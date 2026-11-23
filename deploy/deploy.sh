#!/usr/bin/env bash
# Runs ON the EC2 instance (sent over SSH by the deploy job).
# Downloads the latest successful build from S3 and swaps it into Nginx's web root.
# Usage: sudo bash deploy.sh <bucket> <region>
set -euo pipefail

BUCKET="$1"
REGION="$2"
WEB_ROOT=/usr/share/nginx/html
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT

echo "Fetching s3://$BUCKET/releases/latest.zip"
aws s3 cp "s3://$BUCKET/releases/latest.zip" "$TMP/latest.zip" --region "$REGION"
unzip -q "$TMP/latest.zip" -d "$TMP/site"
test -f "$TMP/site/index.html" || { echo "Build has no index.html, aborting"; exit 1; }

# Swap the new release in, keeping the previous one as html.previous for a quick rollback.
rm -rf "$WEB_ROOT.previous"
if [ -d "$WEB_ROOT" ]; then mv "$WEB_ROOT" "$WEB_ROOT.previous"; fi
mv "$TMP/site" "$WEB_ROOT"
chmod -R a+rX "$WEB_ROOT"
systemctl reload nginx

echo "Deployed: $(cat "$WEB_ROOT/version.txt")"
