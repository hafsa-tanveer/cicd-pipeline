# Pakien store: CI/CD with GitHub Actions + AWS

A static demo e-commerce store (the neutral version of the Pakien study store, with the
consent gate, screen recording and Vercel setup removed), deployed by this pipeline:

```
Code change → git push → Security scan + Unit tests → Build zip → AWS S3 → EC2 (Nginx) → Verify live site
```

| Stage | Job in `.github/workflows/ci-cd.yml` | What it does |
|---|---|---|
| Security (bonus) | `0. Security scan` | Gitleaks secret scan + CodeQL static analysis (SAST) |
| Test | `1. Unit tests` | `npm test` runs 11 tests; any failure stops the pipeline |
| Build | `2. Build artifact` | Stamps version into the footer, zips `dist/` as `build-v1.0.0-<run>.zip` |
| Store | `3. Upload artifact to S3` | Uploads the zip to `s3://<bucket>/releases/` and copies it to `releases/latest.zip` |
| Deploy | `4. Deploy latest build to EC2` | SSHes into EC2, which downloads `latest.zip` from S3 and swaps it into Nginx |
| Verify | `5. Verify production` | Calls `http://<EC2>/version.txt` and checks it shows this run's build number |

## Project layout

```
index.html              store page (footer shows the version, e.g. "v1.0.0 · build 7")
js/pricing.js           pricing rules (Buy 2 Get 1, delivery, fees), unit-tested
js/app.js               store UI logic
assets/                 product photos
tests/                  unit tests (Node's built-in test runner, no dependencies)
scripts/build.js        builds dist/
deploy/deploy.sh        runs on EC2: pull latest build from S3 and go live
deploy/ec2-user-data.sh installs Nginx when the EC2 instance first boots
deploy/iam/*.json       least-privilege IAM policies
AWS-SETUP.md            beginner click-by-click AWS guide
```

Run it locally (needs Node 20+): `npm test`, then `npm run build`, then open `dist/index.html`.

---

# Setup guide

Do the parts in order. Do Parts B and C **before** your first push, otherwise the S3/deploy
jobs fail because the credentials aren't there yet (you can just re-run the workflow if that happens).

## Part A: Create the GitHub repo

1. On GitHub, create a new **public** repository, e.g. `pakien-cicd`. Don't add a README.
   (It must be public for CodeQL to be free.)
2. Don't push yet. Keep the page open and do Parts B and C first.

## Part B: AWS setup

**Follow [AWS-SETUP.md](AWS-SETUP.md).** It has click-by-click instructions with checks after each step.
Summary of what you'll create there:

1. A private S3 bucket for build zips
2. IAM role `pakien-ec2-role`, which lets the EC2 server download builds from S3
3. An EC2 server (Amazon Linux 2023, free-tier instance type) running Nginx, ports 22 and 80 open
4. IAM user `github-actions-pakien` with an access key, which lets GitHub upload builds to S3

## Part C: GitHub secrets and variables

In your repo: **Settings → Secrets and variables → Actions**.

**Secrets** tab → New repository secret:

| Name | Value |
|---|---|
| `AWS_ACCESS_KEY_ID` | access key ID from B4 |
| `AWS_SECRET_ACCESS_KEY` | secret access key from B4 |
| `EC2_SSH_KEY` | the **entire** contents of `pakien-key.pem`, including the `-----BEGIN` and `-----END` lines |

**Variables** tab → New repository variable:

| Name | Example value |
|---|---|
| `AWS_REGION` | `eu-north-1` |
| `S3_BUCKET` | `pakien-builds-hafsa-2026` |
| `EC2_HOST` | `13.233.xx.xx` (public IPv4 of your instance) |

## Part D: Push the code (first deployment)

From inside this project folder:

```bash
git init
git add .
git commit -m "Pakien store with CI/CD pipeline"
git branch -M main
git remote add origin https://github.com/<your-username>/pakien-cicd.git
git push -u origin main
```

Open the **Actions** tab and watch the run. When all jobs are green, open
`http://<EC2_HOST>`. The footer should say `Version v1.0.0 · build 1 · <commit>`.

Also check:
- **S3 bucket → releases/**: `build-v1.0.0-1.zip` and `latest.zip`.
- **Security tab → Code scanning**: CodeQL results.

## Part E: The visible change (for the demo)

1. In `index.html`, change the banner heading:
   `Thoughtful gifts, honestly priced` → e.g. `Winter Sale is live!`
2. In `package.json`, bump `"version": "1.0.0"` to `"1.1.0"`.
3. Commit and push:
   ```bash
   git commit -am "Winter sale banner, v1.1.0"
   git push
   ```
4. When the run is green, refresh the live site: new heading, and the footer shows `v1.1.0 · build 2`.

**Optional, to show that failing tests block deployment:** in `js/pricing.js` change
`const SERVICE_FEE = 99;` to `199`, push, and the **Unit tests** job goes red, so Build, S3 and Deploy are skipped.
Change it back and push again.

## Part F: 2-minute video plan

| Time | Show |
|---|---|
| 0:00–0:10 | Live site at `http://<EC2_HOST>` with the old heading and `v1.0.0` in the footer |
| 0:10–0:25 | Edit the heading in `index.html` and the version in `package.json`, then `git commit` and `git push` in the terminal |
| 0:25–0:35 | Actions tab: the new run starts automatically. Open it to show the job graph |
| 0:35–1:05 | Click into **Security scan** (Gitleaks/CodeQL), then **Unit tests** (11 passing), then **Build** (zip name). Fast-forward the waiting |
| 1:05–1:20 | **Upload to S3** log, then the S3 console showing the new `build-v1.1.0-N.zip` in `releases/` |
| 1:20–1:35 | **Deploy** log (`Deployed: v1.1.0 · build N`), then **Verify production** (green) |
| 1:35–1:55 | Refresh the live site: new heading and `v1.1.0` in the footer |
| 1:55–2:00 | Briefly show `.github/workflows/ci-cd.yml` |

## Troubleshooting

| Problem | Fix |
|---|---|
| Upload to S3: `AccessDenied` | Bucket name in the IAM policy must match `S3_BUCKET` exactly; policy must be attached to the IAM user |
| Deploy: `Permission denied (publickey)` | `EC2_SSH_KEY` must contain the whole .pem file; `EC2_USER` is `ec2-user` on Amazon Linux |
| Deploy: `Connection timed out` | Security group needs port 22 open; `EC2_HOST` must be the current public IP |
| Deploy: `Unable to locate credentials` / `403` from S3 | The instance needs IAM role `pakien-ec2-role` (EC2 → Actions → Security → Modify IAM role) |
| Site doesn't load in the browser | Use `http://`, not `https://`; port 80 must be open |
| Gitleaks fails | It found something that looks like a secret in your history. Remove it and rotate the key |

## Clean up after grading

To avoid using up your free tier: terminate the EC2 instance, empty and delete the S3 bucket, and
delete the IAM user's access key.
