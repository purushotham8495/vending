# Deploy Backend to Hostinger - Complete Guide

## 🎯 Your Setup

```
Database: u120899366_vending
User: u120899366_vending
Password: P.m@2693
Host: localhost
Backend: Will be on same Hostinger account
```

---

## 📋 PART 1: Setup Database (10 minutes)

### Step 1: Access phpMyAdmin

1. Login to: https://hpanel.hostinger.com
2. Click **"Websites"** → Select your domain
3. Scroll to **"MySQL Databases"**
4. Find: `u120899366_vending`
5. Click **"Manage"** or **"phpMyAdmin"**

### Step 2: Run SQL Queries

1. In phpMyAdmin, click **"SQL"** tab at the top
2. Open file: `HOSTINGER_ALL_SQL_QUERIES.sql`
3. **Copy ALL content** from that file
4. **Paste into SQL box**
5. Click **"Go"** button (bottom right)
6. Wait 30 seconds - you'll see multiple success messages

### Step 3: Verify Database

1. Look at **left sidebar** in phpMyAdmin
2. You should see **8 tables**:
   - ✅ users
   - ✅ machines
   - ✅ gpios
   - ✅ sequences
   - ✅ sequence_steps
   - ✅ transactions
   - ✅ firmwares
   - ✅ logs

3. Click on **"users"** table → Click **"Browse"**
4. You should see **4 users**:
   - Admin: 9999999999
   - Owner: 8888888888
   - Owner: 7777777777
   - Owner: 6666666666

**If you see these, database is ready!** ✅

---

## 📋 PART 2: Deploy Backend to Hostinger

### Option A: Node.js Hosting (If Available)

#### Step 1: Check Node.js Support

1. In Hostinger panel, look for **"Node.js"** section
2. If you see it, **Hostinger supports Node.js!** ✅
3. If not, contact Hostinger support: "Does my plan support Node.js applications?"

#### Step 2: Create Node.js Application

1. Go to **Node.js** section in Hostinger
2. Click **"Create Application"**
3. Configure:
   - **Application name**: vending-control-backend
   - **Node.js version**: 18.x or latest LTS
   - **Application mode**: Production
   - **Application root**: `/public_html/backend` (or custom path)
   - **Application startup file**: `server.js`

#### Step 3: Upload Backend Files

**Method 1: Git (Recommended)**
```bash
# In Hostinger SSH or Git
cd /home/u120899366/domains/yourdomain.com/public_html
git clone https://github.com/yourusername/your-repo.git backend
cd backend
npm install
```

**Method 2: File Manager**
1. Go to Hostinger **File Manager**
2. Navigate to `public_html`
3. Create folder: `backend`
4. Upload all files from your `backend` folder
5. Open terminal in File Manager
6. Run: `npm install`

#### Step 4: Configure Environment Variables

In Hostinger Node.js panel, add:
```
DB_HOST=localhost
DB_PORT=3306
DB_NAME=u120899366_vending
DB_USER=u120899366_vending
DB_PASSWORD=P.m@2693

PORT=5000
NODE_ENV=production

JWT_SECRET=vending-secret-key-change-this-random-12345
JWT_EXPIRE=7d

CORS_ORIGIN=https://yourdomain.com
```

#### Step 5: Start Application

1. In Node.js panel, click **"Start"** or **"Restart"**
2. Your backend will be at: `https://yourdomain.com:5000`
3. Or Hostinger may assign: `https://yourdomain.com/backend`

---

### Option B: Use Cloud Hosting (If Hostinger doesn't support Node.js)

If Hostinger doesn't support Node.js, deploy backend to:

#### Render.com (Free, Recommended)

1. Go to: https://render.com
2. Sign up with GitHub
3. New Web Service → Connect repo
4. Environment variables:
   ```
   DB_HOST=mysql.hostinger.com
   DB_NAME=u120899366_vending
   DB_USER=u120899366_vending
   DB_PASSWORD=P.m@2693
   JWT_SECRET=random-secret-key
   CORS_ORIGIN=https://yourdomain.com
   ```
5. Deploy!

**Note**: You'll need to enable **remote MySQL access** on Hostinger for this to work.

#### Railway.app (Alternative)

Similar to Render, just import from GitHub and add environment variables.

---

## 📋 PART 3: Deploy Frontend to Hostinger

### Step 1: Build Frontend

```bash
cd frontend

# Create .env file with backend URL
echo "REACT_APP_API_URL=https://yourdomain.com:5000/api" > .env
# Or if backend is in subfolder:
# echo "REACT_APP_API_URL=https://yourdomain.com/backend/api" > .env

# Install and build
npm install
npm run build
```

### Step 2: Upload to Hostinger

**Method 1: File Manager (Easiest)**

1. Go to Hostinger **File Manager**
2. Navigate to `public_html` folder
3. **Delete** default files (index.html, etc.) OR create subfolder
4. **Upload** all files from `frontend/build` folder
5. Make sure these are in `public_html`:
   - index.html
   - static/ folder
   - asset-manifest.json
   - favicon.ico
   - etc.

**Method 2: FTP**

1. Use FileZilla or any FTP client
2. Connect with Hostinger FTP credentials
3. Navigate to `public_html`
4. Upload all files from `frontend/build`

### Step 3: Configure .htaccess

Create/edit `.htaccess` file in `public_html`:

```apache
# React Router Support
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  
  # Serve index.html for all routes
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteCond %{REQUEST_FILENAME} !-l
  RewriteRule . /index.html [L]
</IfModule>

# Compression
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/plain
  AddOutputFilterByType DEFLATE text/html
  AddOutputFilterByType DEFLATE text/css
  AddOutputFilterByType DEFLATE text/javascript
  AddOutputFilterByType DEFLATE application/javascript
  AddOutputFilterByType DEFLATE application/json
</IfModule>

# Cache Control
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType text/css "access plus 1 year"
  ExpiresByType text/javascript "access plus 1 year"
  ExpiresByType application/javascript "access plus 1 year"
  ExpiresByType image/gif "access plus 1 year"
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType image/webp "access plus 1 year"
</IfModule>
```

### Step 4: Test Frontend

1. Open: `https://yourdomain.com`
2. You should see login page
3. If not, check File Manager to ensure files uploaded correctly

---

## 📋 PART 4: Configure ESP32

Update ESP32 firmware with your Hostinger URL:

```cpp
const char* WIFI_SSID = "YourWiFi";
const char* WIFI_PASSWORD = "YourPassword";

// If backend on Hostinger Node.js:
const char* SERVER_URL = "http://yourdomain.com:5000/api";

// Or if using subdomain:
const char* SERVER_URL = "http://api.yourdomain.com/api";

const char* MACHINE_ID = "VM001";
const char* MACHINE_NAME = "Sanitizer Unit 1";
```

---

## ✅ Verification Checklist

### Database
- [ ] phpMyAdmin shows 8 tables
- [ ] Users table has 4 users
- [ ] Sequences table has 3 sequences
- [ ] Sequence_steps table has 14 steps

### Backend
- [ ] Backend accessible at your URL
- [ ] Can access: `https://yourdomain.com:5000/api/health`
- [ ] No 404 or 500 errors

### Frontend
- [ ] Website loads at: `https://yourdomain.com`
- [ ] Login page displays
- [ ] No console errors
- [ ] Can request OTP

### Full System
- [ ] Can login with: 9999999999
- [ ] Dashboard loads correctly
- [ ] Can create new owner
- [ ] Owner appears in database
- [ ] ESP32 can connect (test later)

---

## 🐛 Troubleshooting

### Frontend shows blank page

**Check:**
1. View page source → should see React app HTML
2. Check browser console for errors
3. Verify API URL in .env was correct before build

**Fix:**
```bash
cd frontend
# Fix API URL
echo "REACT_APP_API_URL=https://your-correct-url.com/api" > .env
# Rebuild
npm run build
# Re-upload build folder
```

### Backend not starting

**Check:**
1. Hostinger Node.js panel for error logs
2. Verify `server.js` exists in root
3. Check if port 5000 is available

**Fix:**
- Contact Hostinger support
- Check error logs in Node.js panel
- Try different port in .env

### Can't connect to database

**Error**: `Access denied for user`

**Check:**
1. Username: `u120899366_vending` (correct?)
2. Password: `P.m@2693` (correct?)
3. Database: `u120899366_vending` (exists?)

**Fix:**
```sql
-- In phpMyAdmin, run:
SHOW DATABASES LIKE 'u120899366_vending';
-- Should show your database

-- Check user privileges:
SHOW GRANTS FOR 'u120899366_vending'@'localhost';
-- Should show full privileges
```

### CORS errors in frontend

**Error**: `Access to fetch... has been blocked by CORS policy`

**Fix:**
Update backend CORS_ORIGIN:
```
CORS_ORIGIN=https://yourdomain.com,http://localhost:3000
```

### OTP not working

**In Development Mode:**
- OTP is printed to backend console/logs
- Check Hostinger Node.js logs
- Or backend terminal if running locally

**In Production:**
- Need SMS service (Twilio, etc.)
- Or email service
- Update backend/utils/otpService.js

---

## 📞 Support Resources

### Hostinger Support
- **24/7 Live Chat**: Available in hPanel
- **Email**: support@hostinger.com
- **Knowledge Base**: https://support.hostinger.com

### Common Questions

**Q: Does my Hostinger plan support Node.js?**
A: Check your plan features or contact support. Usually available on Business plans and above.

**Q: What if Node.js is not supported?**
A: Deploy backend to Render/Railway (free) and just host frontend + database on Hostinger.

**Q: Can ESP32 connect to Hostinger?**
A: Yes! Use your domain URL in ESP32 SERVER_URL configuration.

**Q: How do I enable remote MySQL?**
A: Contact Hostinger support. Usually available on higher tier plans.

---

## 🎯 Summary of URLs

After deployment:

```
Database: 
  phpMyAdmin: Via Hostinger panel
  Host: localhost (from same server)
  Name: u120899366_vending

Backend:
  URL: https://yourdomain.com:5000/api
  Or: https://yourdomain.com/backend/api
  Health: https://yourdomain.com:5000/api/health

Frontend:
  URL: https://yourdomain.com
  Login: https://yourdomain.com/login

Admin Login:
  Phone: 9999999999
  OTP: Check backend logs
```

---

## ✨ Success Indicators

You'll know everything works when:

1. ✅ phpMyAdmin shows 8 tables with data
2. ✅ Backend URL returns response (not 404)
3. ✅ Frontend loads login page
4. ✅ Can request OTP (check logs)
5. ✅ Can login and see dashboard
6. ✅ Can create test owner
7. ✅ Owner appears in database
8. ✅ ESP32 can register (test later)

---

## 🚀 You're Ready!

**Quick Steps:**
1. ✅ Run `HOSTINGER_ALL_SQL_QUERIES.sql` in phpMyAdmin
2. ✅ Deploy backend (Node.js or Render)
3. ✅ Upload frontend build to public_html
4. ✅ Add .htaccess
5. ✅ Test with admin login: 9999999999

**Everything is ready! Start with the SQL queries!** 🎉

---

*Database: u120899366_vending*
*Ready to deploy!*
