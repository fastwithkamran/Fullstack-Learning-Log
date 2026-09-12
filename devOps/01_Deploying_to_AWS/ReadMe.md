# AWS EC2 Deployment with Nginx Reverse Proxy and PM2

A step-by-step documentation guide for deploying a Node.js/Express web application on an AWS EC2 instance using Nginx as a reverse proxy and PM2 for process management.

## Architecture Overview

```text
[ Client / Browser ]
         | HTTP (Port 80)
         v
    [ Nginx ]  -- Reverse Proxy -->  [ Node.js App (Port 3000) ]
  (Port 80)                           (Managed by PM2)
```

## Step 1: Launch and Configure AWS EC2

### Launch the Instance

- **OS:** Ubuntu 24.04 / 26.04 LTS
- **Instance type:** `t2.micro` or `t3.micro` (Free Tier)

Configure the security group inbound rules:

- **SSH:** Port `22`, source `0.0.0.0/0` (or your IP)
- **HTTP:** Port `80`, source `0.0.0.0/0`
- **HTTPS:** Port `443`, source `0.0.0.0/0`
- **Custom TCP (testing):** Port `3000`, source `0.0.0.0/0`

## Step 2: Server Setup and Environment Preparation

Connect to your EC2 instance via SSH or EC2 Instance Connect, then run:

```bash
# Update the Ubuntu package repository index
sudo apt update && sudo apt upgrade -y

# Install curl and Git
sudo apt install curl git -y

# Install Node Version Manager (NVM)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash

# Load NVM into the current session
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Install the Node.js LTS version
nvm install --lts

# Verify the installation
node -v
npm -v
```

## Step 3: Clone the Application and Install Dependencies

```bash
# Clone the repository
git clone https://github.com/fastwithkamran/Fullstack-Learning-Log.git

# Navigate to the project folder
cd Fullstack-Learning-Log/devOps/01_Deploying_to_AWS

# Install dependencies
npm install
```

## Step 4: Process Management with PM2

Keep your Node.js application running in the background continuously:

```bash
# Install PM2 globally
npm install -g pm2

# Start the app with PM2
pm2 start server.js --name "node-app"

# Ensure PM2 restarts automatically on server reboot
pm2 startup
pm2 save
```

Useful PM2 commands:

```bash
pm2 status       # Check app status
pm2 logs         # View live application logs
pm2 restart all  # Restart the application
```

## Step 5: Configure Nginx as a Reverse Proxy

Forward public web traffic on Port 80 (HTTP) directly to Port 3000 (Node.js).

### Install Nginx

```bash
sudo apt install nginx -y
```

### Edit the Nginx Configuration

```bash
sudo nano /etc/nginx/sites-available/default
```

Update the server configuration block:

```nginx
server {
    listen 80 default_server;
    listen [::]:80 default_server;

    server_name _;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

### Test and Restart Nginx

```bash
# Test configuration syntax
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

## Step 6: Verify the Deployment

Open your browser and navigate to your server's public IP address:

```text
http://YOUR_EC2_PUBLIC_IP/
```

If set up correctly, your web application will respond directly over port 80 without needing `:3000` in the URL.
