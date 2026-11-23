#!/bin/bash
# Paste into "Advanced details > User data" when launching the EC2 instance (Amazon Linux 2023).
# Installs Nginx and unzip. The AWS CLI is already included in Amazon Linux 2023.
dnf install -y nginx unzip
systemctl enable --now nginx
echo '<h1>Pakien server is ready. Waiting for first deployment.</h1>' > /usr/share/nginx/html/index.html
