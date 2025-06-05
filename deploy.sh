#!/bin/bash

# Make the script exit on any error
set -e

# EC2 instance details
EC2_USER="ubuntu"
EC2_HOST="15.207.174.220"
EC2_KEY_PATH="./kicl-server-key.pem"
REMOTE_DIR="/home/ubuntu/kicl_api"

# Ensure key file has correct permissions
chmod 400 $EC2_KEY_PATH

# Create a temporary directory for deployment
echo "Creating deployment package..."
mkdir -p deploy
cp -r app.js db.js package.json middleware routes .env deploy/

# Transfer files to EC2
echo "Transferring files to EC2..."
scp -i $EC2_KEY_PATH -r deploy/* $EC2_USER@$EC2_HOST:$REMOTE_DIR

# Run remote commands
echo "Installing dependencies and restarting service..."
ssh -i $EC2_KEY_PATH $EC2_USER@$EC2_HOST << 'EOF'
  cd ~/kicl_api
  npm install
  pm2 restart app
EOF

# Clean up
echo "Cleaning up..."
rm -rf deploy

echo "Deployment completed successfully!"