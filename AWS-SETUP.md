# AWS setup, step by step (for beginners)

This guide sets up everything the pipeline needs on AWS. It takes about 30–40 minutes the first time.
You only do it **once**; after that, every `git push` deploys by itself.

---

## 0. What you are building (read this first)

| AWS thing | Plain-English meaning | What it does in this project |
|---|---|---|
| **Region** | Which AWS data centre city your stuff lives in | We use **Europe, Stockholm (`eu-north-1`)** |
| **S3 bucket** | A private online folder for files | Stores every build zip (`build-v1.0.0-3.zip`, `latest.zip`) |
| **EC2 instance** | A small Linux computer rented from AWS | Your production web server. Runs Nginx and shows the store |
| **Key pair (.pem file)** | The "password file" for logging into EC2 | GitHub Actions uses it to log into EC2 and run the deploy |
| **Security group** | EC2's firewall | Opens port 80 (website) and port 22 (SSH login) |
| **IAM** | AWS's users and permissions system | Decides who is allowed to touch your S3 bucket |
| **IAM policy** | A list of allowed actions, written in JSON | "Allowed to upload to this one bucket", nothing more |
| **IAM role** | Permissions given to an AWS *service*, not a person | Lets the EC2 server download builds from S3 with no password |
| **IAM user + access key** | A login for a *program* | Lets GitHub Actions upload builds to S3 |

How they connect:

```
GitHub Actions ──(IAM user access key)──► S3 bucket ◄──(IAM role)── EC2 server ──► your browser
       └──────────────(SSH with .pem key)──────────────────────────────┘
```

Keep a notepad open. You will collect these 5 values along the way:

```
Region:            eu-north-1
Bucket name:       ...
EC2 public IP:     ...
Access key ID:     ...
Secret access key: ...
(+ the pakien-key.pem file in your Downloads)
```

---

## 1. Sign in and choose the region

1. Go to <https://console.aws.amazon.com> and sign in.
2. Look at the **top-right corner**, next to your account name. There is a region name, e.g. "N. Virginia" or "Stockholm".
3. Click it and choose **Europe (Stockholm) eu-north-1**.

> ⚠️ S3 buckets and EC2 instances only show up in the region they were created in.
> If something "disappears" later, check the region first. IAM (step 3) is global, so it ignores the region.

**Search bar tip:** the search box at the top of the console is the fastest way around. Type "S3", "EC2", "IAM" or "Budgets" and click the service.

---

## 2. (Recommended, 2 minutes) Set a zero-spend alert

This emails you if anything ever starts costing real money.

1. Search **Budgets** → open **AWS Budgets** (inside Billing and Cost Management).
2. Click **Create budget**.
3. Choose **Use a template (simplified)** → **Zero spend budget**.
4. Budget name: `zero-spend`. Email: your email.
5. Click **Create budget**.

> On newer accounts (created after 15 July 2025), creating a budget is also one of the onboarding
> activities that earns you extra free credits.

---

## 3. Create the S3 bucket

1. Search **S3** → open it.
2. Click the orange **Create bucket** button.
3. Fill in:
   - **Bucket type:** General purpose (if asked).
   - **Bucket name:** must be unique across *all* of AWS worldwide. Use lowercase, numbers and hyphens only,
     e.g. `pakien-builds-hafsa-2026`. If it says the name is taken, add something (e.g. `-iba`).
   - **Object Ownership:** leave as *ACLs disabled*.
   - **Block Public Access settings:** leave **Block all public access** ✅ **ticked**. The bucket stays private.
   - Leave everything else as default.
4. Scroll down → **Create bucket**.

✍️ Write the bucket name in your notepad.

✅ **Check:** the bucket appears in the list with region *Europe (Stockholm) eu-north-1*.

You don't need to create the `releases/` folder; the pipeline creates it on the first upload.

---

## 4. Create the role that lets EC2 read from S3

This is done in two parts: first the **policy** (the permission), then the **role** (which holds the policy and gets attached to EC2).

### 4a. Policy

1. Search **IAM** → open it.
2. Left menu → **Policies** → **Create policy**.
3. At the top, switch from **Visual** to **JSON**.
4. Delete everything in the box and paste this. **Replace `YOUR-BUCKET-NAME`** with your bucket name:

   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Sid": "DownloadBuilds",
         "Effect": "Allow",
         "Action": ["s3:GetObject"],
         "Resource": "arn:aws:s3:::YOUR-BUCKET-NAME/releases/*"
       }
     ]
   }
   ```
   (This is also in `deploy/iam/ec2-read-builds-policy.json`.)
5. Click **Next**.
6. **Policy name:** `pakien-ec2-read-builds` → **Create policy**.

### 4b. Role

1. IAM left menu → **Roles** → **Create role**.
2. **Trusted entity type:** AWS service.
3. **Use case:** choose **EC2** (the plain "EC2" option, not the longer EC2 variants) → **Next**.
4. In the search box type `pakien` → tick **pakien-ec2-read-builds** → **Next**.
5. **Role name:** `pakien-ec2-role` → scroll down → **Create role**.

✅ **Check:** Roles list shows `pakien-ec2-role`.

---

## 5. Launch the EC2 server

1. Search **EC2** → open it. **Check the region is still Stockholm** (top-right).
2. Click **Launch instance** (orange button on the dashboard).

Now fill in the launch page from top to bottom:

**Name and tags**
- Name: `pakien-production`

**Application and OS Images (AMI)**
- Click **Amazon Linux**. Make sure the dropdown says **Amazon Linux 2023 AMI** and shows the *Free tier eligible* label.
- Architecture: **64-bit (x86)**.

**Instance type**
- Choose **t3.micro**. It should show *Free tier eligible*.
  (Stockholm has no `t2.micro`, so use `t3.micro`. It is free-tier eligible for both old and new accounts.)

**Key pair (login)**
1. Click **Create new key pair**.
2. Key pair name: `pakien-key`
3. Key pair type: **RSA**
4. Private key file format: **.pem**
5. Click **Create key pair**. The browser downloads `pakien-key.pem`.

> ⚠️ This file is the only way to log into the server, and AWS won't let you download it again.
> Keep it somewhere safe (not inside the project folder) and **never commit it to GitHub**.

**Network settings**: click the **Edit** button on the right of this section.
- VPC / Subnet: leave default.
- **Auto-assign public IP: Enable** (must be Enable, otherwise the site has no address).
- Firewall (security groups): **Create security group**.
- Security group name: `pakien-web-sg`. Description: `SSH and HTTP for Pakien`.
- Inbound rule 1 (already there): **Type `ssh`**, Port 22, **Source type: Anywhere** (`0.0.0.0/0`).
  - Why "Anywhere"? GitHub's servers that run your pipeline use different IP addresses each time.
    Login still requires your .pem key, so it remains protected.
- Click **Add security group rule**. Rule 2: **Type `HTTP`**, Port 80, **Source type: Anywhere**.
- Ignore the yellow warning about 0.0.0.0/0; it's expected here.

**Configure storage**
- Leave the default (8 GiB gp3). That's plenty.

**Advanced details**: click to expand this section at the bottom.
- **IAM instance profile:** choose `pakien-ec2-role`.
  (If it doesn't appear, click the small refresh icon next to the dropdown.)
- Scroll all the way down to **User data**. Paste this exactly
  (it's also in `deploy/ec2-user-data.sh`). It runs once when the server first starts:

  ```bash
  #!/bin/bash
  dnf install -y nginx unzip
  systemctl enable --now nginx
  echo '<h1>Pakien server is ready. Waiting for first deployment.</h1>' > /usr/share/nginx/html/index.html
  ```

**Launch**
- Right-hand **Summary** panel: Number of instances = 1 → **Launch instance**.
- Click **View all instances**.

### 5a. Get the public IP and test it

1. In the Instances list, wait until:
   - **Instance state** = *Running*, and
   - **Status check** = *3/3 checks passed* (takes 2–3 minutes; click the refresh button).
2. Click the instance ID → in **Details**, copy **Public IPv4 address** (e.g. `13.233.45.67`).
   ✍️ Write it in your notepad.
3. In a new browser tab, open `http://13.233.45.67` (your IP).
   - Type `http://` yourself. Browsers sometimes switch to `https://`, which won't work here.

✅ **Check:** you see **"Pakien server is ready. Waiting for first deployment."**

**If you don't see it:**
- Wait 2 more minutes (the install runs in the background), then refresh.
- "This site can't be reached": the HTTP rule is missing. EC2 → your instance → **Security** tab → click the security group → **Edit inbound rules** → add HTTP / Anywhere.
- Still nothing: check that you pasted the user data. If you forgot it, do step 5b and run those three commands yourself (put `sudo` in front of each).

### 5b. (Optional, useful for debugging) Log into the server from your browser

You don't need a terminal or the .pem file for this.
1. Select your instance → **Connect** (top button) → **EC2 Instance Connect** tab → **Connect**.
2. A black terminal opens in your browser. Try:
   ```bash
   systemctl status nginx     # should say "active (running)"; press q to exit
   aws s3 ls s3://YOUR-BUCKET-NAME/releases/ --region eu-north-1   # after the first deployment, lists your builds
   cat /usr/share/nginx/html/version.txt                           # after deployment, shows the live version
   ```

> ⚠️ **Don't stop the instance** while you're working on the assignment.
> Every stop/start gives it a **new public IP**, and you'd have to update `EC2_HOST` in GitHub (Part C of README).
> Rebooting keeps the same IP.

---

## 6. Create the IAM user for GitHub Actions

### 6a. Policy (upload-only permission)

1. IAM → **Policies** → **Create policy** → **JSON** tab.
2. Paste this, replacing **both** `YOUR-BUCKET-NAME`s (also in `deploy/iam/github-actions-policy.json`):

   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Sid": "UploadBuilds",
         "Effect": "Allow",
         "Action": ["s3:PutObject"],
         "Resource": "arn:aws:s3:::YOUR-BUCKET-NAME/releases/*"
       },
       {
         "Sid": "ListBuilds",
         "Effect": "Allow",
         "Action": ["s3:ListBucket"],
         "Resource": "arn:aws:s3:::YOUR-BUCKET-NAME"
       }
     ]
   }
   ```
3. **Next** → Policy name `pakien-github-upload` → **Create policy**.

### 6b. User

1. IAM → **Users** → **Create user**.
2. User name: `github-actions-pakien`.
3. Leave **"Provide user access to the AWS Management Console"** ❌ **unticked**. This user is for a program, not a person.
4. **Next** → choose **Attach policies directly** → search `pakien` → tick **pakien-github-upload** → **Next** → **Create user**.

### 6c. Access key

1. Click the new user `github-actions-pakien` → **Security credentials** tab.
2. Scroll to **Access keys** → **Create access key**.
3. Use case: **Application running outside AWS** → **Next**.
4. Description (optional): `GitHub Actions` → **Create access key**.
5. You now see the **Access key ID** (starts with `AKIA…`) and the **Secret access key** (click *Show*).
   ✍️ Copy **both** into your notepad, or click **Download .csv file**.

> ⚠️ The secret access key is shown **only once**. If you lose it, delete that key and create a new one.
> Never paste it into code, the README or a commit, only into GitHub Secrets (next section).

---

## 7. Put the values into GitHub

Now go back to **README.md → Part C** and add the secrets and variables. A quick version:

GitHub repo → **Settings** → left menu **Secrets and variables** → **Actions**.

**Secrets** tab → **New repository secret** (one at a time):

| Name | Value |
|---|---|
| `AWS_ACCESS_KEY_ID` | Access key ID from step 6c |
| `AWS_SECRET_ACCESS_KEY` | Secret access key from step 6c |
| `EC2_SSH_KEY` | Open `pakien-key.pem` in **Notepad** (right-click → Open with → Notepad), press Ctrl+A, Ctrl+C, and paste **everything**, including `-----BEGIN RSA PRIVATE KEY-----` and `-----END RSA PRIVATE KEY-----` |

**Variables** tab → **New repository variable**:

| Name | Value |
|---|---|
| `AWS_REGION` | `eu-north-1` |
| `S3_BUCKET` | your bucket name |
| `EC2_HOST` | the public IP, e.g. `13.233.45.67` (no `http://`, no `/` at the end) |

Then continue with **README.md → Part D** (push the code).

---

## 8. After the first successful pipeline run: where to look

| What | Where |
|---|---|
| Build zips | S3 → your bucket → `releases/` folder → `build-v1.0.0-1.zip` and `latest.zip` |
| Live site | `http://<EC2 public IP>`. The footer shows the version and build number |
| Server logs | Instance Connect (step 5b) → `sudo tail /var/log/nginx/access.log` |
| Cost / credits | Search **Billing and Cost Management** → Home (credits remaining) or **Free Tier** page |

For the video, keep these tabs open in advance: GitHub Actions, S3 `releases/` folder, and the live site.

---

## 9. Clean up after you get your grade

Do it in this order:
1. **EC2** → Instances → select `pakien-production` → **Instance state** → **Terminate (delete) instance**.
   (Terminate deletes it. *Stop* alone still charges for storage and, on some accounts, the IP address.)
2. **S3** → select your bucket → **Empty** (type `permanently delete`) → then **Delete** the bucket.
3. **IAM** → Users → `github-actions-pakien` → **Delete**.
4. Optional: delete the roles/policies and the `pakien-web-sg` security group (they cost nothing).

---

## Common errors

| Where you see it | Error | Fix |
|---|---|---|
| GitHub job *3. Upload to S3* | `AccessDenied` / `not authorized to perform: s3:PutObject` | The bucket name in policy `pakien-github-upload` doesn't match `S3_BUCKET` exactly. IAM → Policies → open it → **Edit** → fix the name |
| GitHub job *3. Upload to S3* | `The security token included in the request is invalid` | Access key secrets were pasted wrong (extra space?). Re-create the secrets |
| GitHub job *3. Upload to S3* | `NoSuchBucket` | `S3_BUCKET` variable is misspelled, or `AWS_REGION` is wrong |
| GitHub job *4. Deploy* | `Permission denied (publickey)` | `EC2_SSH_KEY` isn't the full .pem contents. Paste it again, including the BEGIN/END lines |
| GitHub job *4. Deploy* | `Connection timed out` on port 22 | SSH rule missing in the security group, or `EC2_HOST` is an old IP |
| GitHub job *4. Deploy* | `Unable to locate credentials` | The instance has no role. EC2 → select instance → **Actions → Security → Modify IAM role** → `pakien-ec2-role` → Update |
| GitHub job *4. Deploy* | `403 Forbidden` from `aws s3 cp` | Bucket name typo in policy `pakien-ec2-read-builds` |
| GitHub job *4. Deploy* | `nginx.service not found` | The user data didn't run. Use Instance Connect and run: `sudo dnf install -y nginx unzip && sudo systemctl enable --now nginx` |
| GitHub job *5. Verify* | `Production did not pick up build` | Open `http://<IP>/version.txt` yourself and read the Deploy job log for the real error |
| Browser | Site loads forever / can't be reached | Use `http://`, not `https://`. Check the HTTP rule on port 80 |
