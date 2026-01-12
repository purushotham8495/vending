# Deployment Guide

Complete guide for deploying the Vending Machine Platform to production.

## 📋 Pre-Deployment Checklist

- [ ] Domain name configured
- [ ] SSL certificate obtained
- [ ] MongoDB database ready
- [ ] Razorpay account configured
- [ ] SMS gateway integrated (for OTP)
- [ ] Server with Node.js 16+ installed
- [ ] Firewall configured

## 🖥️ Server Requirements

### Minimum Requirements
- **CPU**: 2 cores
- **RAM**: 2GB
- **Storage**: 20GB SSD
- **OS**: Ubuntu 20.04 LTS or later

### Recommended Requirements
- **CPU**: 4 cores
- **RAM**: 4GB
- **Storage**: 50GB SSD
- **OS**: Ubuntu 22.04 LTS

## 🚀 Deployment Options

### Option 1: VPS (DigitalOcean, AWS, etc.)

#### 1. Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt update
sudo apt install -y mongodb-org
sudo systemctl start mongod
sudo systemctl enable mongod

# Install Nginx
sudo apt install -y nginx

# Install PM2 globally
sudo npm install -g pm2

# Install Git
sudo apt install -y git
```

#### 2. Clone and Setup Application

```bash
# Clone repository
cd /var/www
sudo git clone https://github.com/yourusername/vending-platform.git
cd vending-platform

# Install backend dependencies
sudo npm install

# Install frontend dependencies
cd frontend
sudo npm install
sudo npm run build
cd ..

# Create uploads directory
sudo mkdir -p uploads/firmware
sudo chmod 755 uploads
```

#### 3. Configure Environment

```bash
# Create production .env
sudo nano .env
```

```env
# Production Environment
PORT=5000
NODE_ENV=production

# Database
MONGODB_URI=mongodb://localhost:27017/vending_machine_platform

# JWT (Generate strong secret)
JWT_SECRET=your_production_jwt_secret_minimum_32_chars
JWT_EXPIRE=7d

# Razorpay
RAZORPAY_KEY_ID=your_production_key_id
RAZORPAY_KEY_SECRET=your_production_key_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret

# ESP32
ESP32_HEARTBEAT_TIMEOUT=10000
ESP32_POLLING_INTERVAL=5000

# OTA
OTA_STORAGE_PATH=/var/www/vending-platform/uploads/firmware

# Frontend URL
FRONTEND_URL=https://yourdomain.com
```

#### 4. Setup PM2

```bash
# Start application with PM2
pm2 start backend/server.js --name vending-platform

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Copy and run the command that PM2 outputs

# Monitor logs
pm2 logs vending-platform
```

#### 5. Configure Nginx

```bash
sudo nano /etc/nginx/sites-available/vending-platform
```

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # API endpoints
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Increase timeout for long-running operations
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # Frontend static files
    location / {
        root /var/www/vending-platform/frontend/build;
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # Increase max upload size for OTA files
    client_max_body_size 10M;
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/vending-platform /etc/nginx/sites-enabled/

# Test Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

#### 6. Setup SSL with Let's Encrypt

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Test auto-renewal
sudo certbot renew --dry-run
```

#### 7. Configure Firewall

```bash
# Setup UFW firewall
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# Check status
sudo ufw status
```

#### 8. Setup MongoDB Security

```bash
# Create MongoDB admin user
mongosh

use admin
db.createUser({
  user: "admin",
  pwd: "strong_password_here",
  roles: [ { role: "userAdminAnyDatabase", db: "admin" } ]
})

use vending_machine_platform
db.createUser({
  user: "vending_user",
  pwd: "strong_password_here",
  roles: [ { role: "readWrite", db: "vending_machine_platform" } ]
})
exit

# Enable authentication
sudo nano /etc/mongod.conf
```

Add:
```yaml
security:
  authorization: enabled
```

```bash
# Restart MongoDB
sudo systemctl restart mongod

# Update .env with MongoDB credentials
MONGODB_URI=mongodb://vending_user:strong_password_here@localhost:27017/vending_machine_platform
```

## 📱 SMS Gateway Integration

Replace the mock OTP service with a real SMS provider:

```javascript
// backend/utils/otpService.js

// Option 1: Twilio
const twilio = require('twilio');
const client = twilio(accountSid, authToken);

static async sendOTP(phoneNumber, otp) {
  await client.messages.create({
    body: `Your OTP is: ${otp}. Valid for 5 minutes.`,
    from: process.env.TWILIO_PHONE,
    to: `+91${phoneNumber}`
  });
}

// Option 2: MSG91
const axios = require('axios');

static async sendOTP(phoneNumber, otp) {
  await axios.get('https://api.msg91.com/api/v5/otp', {
    params: {
      authkey: process.env.MSG91_AUTH_KEY,
      mobile: phoneNumber,
      otp: otp
    }
  });
}
```

## 🔄 Continuous Deployment

### Using GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Deploy to server
      uses: appleboy/ssh-action@master
      with:
        host: ${{ secrets.SERVER_HOST }}
        username: ${{ secrets.SERVER_USER }}
        key: ${{ secrets.SSH_PRIVATE_KEY }}
        script: |
          cd /var/www/vending-platform
          git pull origin main
          npm install
          cd frontend
          npm install
          npm run build
          cd ..
          pm2 restart vending-platform
```

## 📊 Monitoring Setup

### Setup PM2 Monitoring

```bash
# Link PM2 to PM2.io for monitoring
pm2 link your_secret_key your_public_key

# Monitor application
pm2 monit
```

### Setup Log Rotation

```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

## 🔐 Backup Strategy

### Automated MongoDB Backup

Create backup script `/usr/local/bin/backup-mongodb.sh`:

```bash
#!/bin/bash

BACKUP_DIR="/var/backups/mongodb"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

mongodump --uri="mongodb://vending_user:password@localhost:27017/vending_machine_platform" \
  --out="$BACKUP_DIR/backup_$TIMESTAMP"

# Keep only last 7 days
find $BACKUP_DIR -type d -mtime +7 -exec rm -rf {} +

# Upload to cloud storage (optional)
# aws s3 sync $BACKUP_DIR s3://your-bucket/mongodb-backups/
```

```bash
# Make executable
sudo chmod +x /usr/local/bin/backup-mongodb.sh

# Add to crontab (daily at 2 AM)
sudo crontab -e
0 2 * * * /usr/local/bin/backup-mongodb.sh
```

## 🧪 Post-Deployment Testing

### 1. Health Check
```bash
curl https://yourdomain.com/health
```

### 2. Create Admin User
```bash
mongosh "mongodb://vending_user:password@localhost:27017/vending_machine_platform"

db.users.insertOne({
  phoneNumber: "9999999999",
  role: "admin",
  status: "active",
  createdAt: new Date(),
  updatedAt: new Date()
})
```

### 3. Test Login
- Visit https://yourdomain.com
- Enter phone number
- Check logs for OTP
- Complete login

### 4. Configure Razorpay Webhook
- Go to Razorpay Dashboard
- Add webhook: `https://yourdomain.com/api/razorpay/webhook`
- Test webhook delivery

## 🔧 Troubleshooting

### Application won't start
```bash
# Check PM2 logs
pm2 logs vending-platform

# Check Node.js version
node --version  # Should be 16+

# Check MongoDB status
sudo systemctl status mongod
```

### Database connection issues
```bash
# Test MongoDB connection
mongosh "mongodb://vending_user:password@localhost:27017/vending_machine_platform"

# Check MongoDB logs
sudo tail -f /var/log/mongodb/mongod.log
```

### Nginx issues
```bash
# Test configuration
sudo nginx -t

# Check error logs
sudo tail -f /var/log/nginx/error.log
```

## 📈 Performance Optimization

### Enable Gzip Compression
Add to Nginx config:
```nginx
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css text/xml text/javascript application/javascript application/json;
```

### MongoDB Indexing
```javascript
// Create indexes for better performance
db.machines.createIndex({ owner: 1, status: 1 })
db.transactions.createIndex({ machine: 1, createdAt: -1 })
db.logs.createIndex({ machine: 1, createdAt: -1 })
db.logs.createIndex({ severity: 1, createdAt: -1 })
```

## ✅ Production Checklist

- [ ] Environment variables configured
- [ ] SSL certificate installed
- [ ] MongoDB secured with authentication
- [ ] PM2 configured and running
- [ ] Nginx configured with proper headers
- [ ] Firewall configured
- [ ] Backups automated
- [ ] Monitoring setup
- [ ] SMS gateway integrated
- [ ] Razorpay webhook configured
- [ ] Admin user created
- [ ] Application tested end-to-end
- [ ] Error tracking setup (optional: Sentry)
- [ ] Domain DNS configured correctly

## 🎉 You're Live!

Your vending machine platform is now deployed and ready for production use!
