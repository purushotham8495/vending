# Deploy from GitHub - Complete Guide

## 🎯 Your Setup

- **Database**: Already on Hostinger (u120899366_vending)
- **Code**: Will be on GitHub
- **Backend**: Deploy from GitHub to Render/Railway
- **Frontend**: Deploy from GitHub to Vercel/Netlify

---

## 📋 STEP 1: Setup Database on Hostinger (5 minutes)

### Run SQL Queries in phpMyAdmin

1. **Login**: https://hpanel.hostinger.com
2. **Navigate**: Websites → MySQL Databases → u120899366_vending → Manage
3. **Click**: SQL tab
4. **Copy & Paste**: All content from `HOSTINGER_ALL_SQL_QUERIES.sql`
5. **Click**: Go button
6. **Verify**: 8 tables created ✅

---

## 📋 STEP 2: Push Code to GitHub (10 minutes)

### 2.1 Prepare Your Code

```bash
# Navigate to your project root
cd /path/to/your/vending-control-project

# Initialize git (if not done)
git init

# Create .gitignore file
cat > .gitignore << 'EOF'
# Dependencies
node_modules/
package-lock.json

# Environment variables
.env
.env.local
.env.*.local
backend/.env
frontend/.env

# Build output
frontend/build/
frontend/dist/
backend/dist/

# Logs
logs/
*.log
npm-debug.log*

# OS files
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/
*.swp
*.swo

# Testing
coverage/

# Uploads
backend/uploads/*
!backend/uploads/.gitkeep

# Temporary files
tmp/
temp/
*.tmp
EOF

# Add all files
git add .

# Commit
git commit -m "Initial commit - Vending Control System MySQL"
```

### 2.2 Create GitHub Repository

1. **Go to**: https://github.com
2. **Click**: New repository (green button)
3. **Repository name**: `vending-control-system` (or your choice)
4. **Visibility**: Private (recommended) or Public
5. **Don't** check "Initialize with README"
6. **Click**: Create repository

### 2.3 Push to GitHub

```bash
# Add remote (replace with your repo URL)
git remote add origin https://github.com/YOUR_USERNAME/vending-control-system.git

# Set main branch
git branch -M main

# Push code
git push -u origin main
```

**✅ Your code is now on GitHub!**

---

## 📋 STEP 3: Deploy Backend from GitHub (10 minutes)

### Option A: Render.com (Recommended - Free)

#### 3.1 Sign Up & Connect GitHub

1. **Go to**: https://render.com
2. **Click**: "Get Started"
3. **Sign up**: With GitHub (authorize access)

#### 3.2 Create Web Service

1. **Click**: "New +" → "Web Service"
2. **Connect repository**: Select your `vending-control-system` repo
3. **Click**: "Connect"

#### 3.3 Configure Service

**Basic Settings:**
```
Name: vending-control-backend
Region: Singapore (or nearest to you)
Branch: main
Root Directory: backend
Runtime: Node
Build Command: npm install
Start Command: npm start
```

**Instance Type:**
- Select: **Free**

#### 3.4 Add Environment Variables

Click "Environment" tab and add:

```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=u120899366_vending
DB_USER=u120899366_vending
DB_PASSWORD=P.m@2693

PORT=5000
NODE_ENV=production

JWT_SECRET=vending-2024-super-secret-key-change-this-random-abc123xyz
JWT_EXPIRE=7d

RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret

CORS_ORIGIN=http://localhost:3000
```

**⚠️ IMPORTANT**: 
- If `DB_HOST=localhost` doesn't work, try: `mysql.hostinger.com`
- You may need to enable remote MySQL access on Hostinger

#### 3.5 Deploy

1. **Click**: "Create Web Service"
2. **Wait**: 5-10 minutes for deployment
3. **Copy**: Your backend URL (e.g., `https://vending-control-backend.onrender.com`)

**Test it**: Open `https://your-backend-url.onrender.com` in browser

---

### Option B: Railway.app (Alternative - Free)

1. **Go to**: https://railway.app
2. **Sign up**: With GitHub
3. **New Project**: Deploy from GitHub repo
4. **Select**: Your repository
5. **Add variables**: Same as Render above
6. **Deploy**: Automatic!
7. **Copy**: Your Railway URL

---

## 📋 STEP 4: Deploy Frontend from GitHub (10 minutes)

### Option A: Vercel (Recommended - Free & Fast)

#### 4.1 Sign Up & Connect

1. **Go to**: https://vercel.com
2. **Sign up**: With GitHub
3. **Import Project**: Click "Add New..." → "Project"
4. **Select**: Your `vending-control-system` repository

#### 4.2 Configure

```
Framework Preset: Create React App
Root Directory: frontend
Build Command: npm run build
Output Directory: build
Install Command: npm install
```

#### 4.3 Add Environment Variable

Click "Environment Variables":

```
Name: REACT_APP_API_URL
Value: https://your-backend-url.onrender.com/api
```

Replace `your-backend-url.onrender.com` with your actual Render URL from Step 3.

#### 4.4 Deploy

1. **Click**: "Deploy"
2. **Wait**: 2-3 minutes
3. **Copy**: Your Vercel URL (e.g., `https://vending-control.vercel.app`)

**Test it**: Open the URL - you should see login page!

---

### Option B: Netlify (Alternative)

1. **Go to**: https://netlify.com
2. **Sign up**: With GitHub
3. **New site**: From Git → Select repo
4. **Build settings**:
   ```
   Base directory: frontend
   Build command: npm run build
   Publish directory: frontend/build
   ```
5. **Environment**: Add `REACT_APP_API_URL`
6. **Deploy**: Automatic!

---

## 📋 STEP 5: Update CORS (IMPORTANT!)

After frontend is deployed, update backend:

### On Render.com:

1. **Open**: Your backend service on Render
2. **Click**: "Environment" tab
3. **Find**: `CORS_ORIGIN` variable
4. **Update** to your Vercel URL:
   ```
   CORS_ORIGIN=https://your-app.vercel.app
   ```
5. **Save**: Service will auto-redeploy (wait 2 minutes)

---

## 📋 STEP 6: Test Complete System (5 minutes)

### 6.1 Test Backend

```bash
# Test API
curl https://your-backend-url.onrender.com

# Should return something (not 404)
```

### 6.2 Test Frontend

1. **Open**: Your Vercel URL
2. **Should see**: Login page
3. **Enter phone**: `9999999999`
4. **Click**: Send OTP
5. **Check**: Render logs for OTP

**To see OTP:**
1. Go to Render dashboard
2. Click on your service
3. Click "Logs" tab
4. Look for: `OTP for 9999999999: 123456`

### 6.3 Login & Test

1. **Enter OTP** from logs
2. **Click**: Verify OTP
3. **Should see**: Admin dashboard
4. **Try**: Create a test owner
5. **Verify**: Owner appears in dashboard

---

## 🔄 Future Updates - Super Easy!

When you make changes:

```bash
# Make your changes to code
# ...

# Commit changes
git add .
git commit -m "Your changes description"

# Push to GitHub
git push

# 🎉 Both Render and Vercel auto-deploy!
# No manual steps needed!
```

**Both services automatically detect GitHub changes and redeploy!**

---

## 🐛 Troubleshooting

### Backend Can't Connect to MySQL

**Error**: `Can't connect to MySQL server`

**Solutions:**

1. **Try different DB_HOST in Render environment:**
   ```
   localhost
   mysql.hostinger.com
   127.0.0.1
   ```

2. **Enable Remote MySQL on Hostinger:**
   - Contact Hostinger support
   - Ask: "Please enable remote MySQL access"
   - They may ask for Render's IP ranges

3. **Check Hostinger plan:**
   - Shared hosting may not allow remote MySQL
   - Business plans usually allow it

### Frontend CORS Error

**Error**: `Access blocked by CORS policy`

**Fix:**
- Update CORS_ORIGIN in Render with exact Vercel URL
- Include `https://` prefix
- No trailing slash

### OTP Not Showing

**Solution:**
- Development mode prints OTP to console
- Check Render logs tab
- For production, set up Twilio or email service

### Build Fails on Render/Vercel

**Check:**
1. `package.json` exists in backend/frontend folders
2. Dependencies are correct
3. Node version compatible (use LTS)

**Fix in Render/Vercel:**
- Add build environment variable: `NODE_VERSION=18`

---

## ✅ Deployment Checklist

### Database (Hostinger)
- [ ] phpMyAdmin shows 8 tables
- [ ] Users table has admin (9999999999)
- [ ] Sequences table has 3 entries

### Backend (Render)
- [ ] Service deployed successfully
- [ ] Environment variables added
- [ ] URL accessible (not 404)
- [ ] Can see logs

### Frontend (Vercel)
- [ ] Build successful
- [ ] Environment variable added
- [ ] Login page loads
- [ ] No console errors

### Full System
- [ ] Can request OTP
- [ ] OTP appears in Render logs
- [ ] Can login with OTP
- [ ] Dashboard displays
- [ ] Can create owner
- [ ] Changes sync to database

---

## 🎯 Your URLs Summary

After deployment:

```
Database:
  Host: localhost (or mysql.hostinger.com)
  Name: u120899366_vending
  phpMyAdmin: Via Hostinger panel

Backend:
  Render: https://vending-control-backend.onrender.com
  API: https://vending-control-backend.onrender.com/api
  Logs: Render dashboard → Your service → Logs

Frontend:
  Vercel: https://your-app.vercel.app
  Or custom domain: https://yourdomain.com

GitHub:
  Repo: https://github.com/YOUR_USERNAME/vending-control-system
```

---

## 🔐 Security Best Practices

### Before Going Live:

1. **Change JWT_SECRET**:
   ```
   Generate: https://randomkeygen.com/
   Use: 256-bit key or longer
   ```

2. **Update CORS**:
   ```
   Remove: http://localhost:3000
   Keep: Only your production URL
   ```

3. **Add Razorpay Keys**:
   ```
   Use: Production keys (not test keys)
   ```

4. **Environment Variables**:
   - Never commit .env files
   - Use different secrets for dev/prod
   - Rotate keys periodically

5. **Database**:
   - Strong password (already have!)
   - Regular backups via Hostinger
   - Monitor suspicious activity

---

## 🚀 Custom Domain Setup (Optional)

### For Frontend (Vercel):

1. **Buy domain** (Namecheap, GoDaddy, etc.)
2. **In Vercel**:
   - Settings → Domains
   - Add your domain
   - Follow DNS instructions
3. **Update CORS** in backend with new domain

### For Backend (Render):

1. **In Render**:
   - Settings → Custom Domain
   - Add domain/subdomain (e.g., api.yourdomain.com)
2. **Update DNS** with Render's CNAME

---

## 💡 Pro Tips

### Auto-Deploy on Push
- ✅ Enabled by default on Render & Vercel
- Every push to `main` branch auto-deploys
- Monitor deployments in dashboards

### Preview Deployments (Vercel)
- Create new branch: `git checkout -b feature-name`
- Push: `git push origin feature-name`
- Vercel creates preview URL automatically

### Environment-Specific Configs
```bash
# Production
CORS_ORIGIN=https://yourdomain.com

# Development
CORS_ORIGIN=http://localhost:3000

# Use different configs per environment
```

### Monitoring
- Render: Check "Metrics" tab for performance
- Vercel: Check "Analytics" for frontend stats
- Hostinger: Monitor database size in phpMyAdmin

---

## 📞 Support Resources

### Render.com
- Docs: https://render.com/docs
- Community: https://community.render.com
- Status: https://status.render.com

### Vercel
- Docs: https://vercel.com/docs
- Support: support@vercel.com
- Status: https://vercel-status.com

### Hostinger
- Live Chat: 24/7 in hPanel
- Docs: https://support.hostinger.com
- Email: support@hostinger.com

---

## 🎉 Success!

When everything is working:

- ✅ GitHub has your code
- ✅ Render hosts backend (auto-deploys on push)
- ✅ Vercel hosts frontend (auto-deploys on push)
- ✅ Hostinger hosts MySQL database
- ✅ Can login at your Vercel URL
- ✅ Dashboard works perfectly
- ✅ Can manage owners and machines
- ✅ ESP32 can connect (test later)

**Total Deployment Time: ~35 minutes**

**Future Updates: Just `git push` - that's it!** 🚀

---

*Last Updated: 2026-01-09*
*Deploy once, update forever with Git!*
