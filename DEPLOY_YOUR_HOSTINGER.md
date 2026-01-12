# Deploy to YOUR Hostinger - Step by Step

## 🎯 Your Database Credentials

```
Database Name: u120899366_vending
Database User: u120899366_vending
Password: P.m@2693
Host: localhost (or IPv6: 2409:40f2:118b:8f58:a1d6:e45f:9bf8:c6f0)
Port: 3306
```

---

## 🚀 STEP-BY-STEP DEPLOYMENT

### ✅ STEP 1: Import Database Schema (10 minutes)

#### 1.1 Login to Hostinger phpMyAdmin

1. Go to: https://hpanel.hostinger.com
2. Login with your Hostinger credentials
3. Click on **"Websites"**
4. Select your website
5. Scroll down and click **"MySQL Databases"**
6. Find database: `u120899366_vending`
7. Click **"Manage"** or **"phpMyAdmin"** button

#### 1.2 Import Database Schema

1. In phpMyAdmin, you should see **"u120899366_vending"** in the left sidebar
2. Click on it to select it
3. Click the **"SQL"** tab at the top
4. Open the file: `backend/migrations/create_database.sql`
5. Copy ALL content BUT **skip these 3 lines at the top**:
   ```sql
   -- DROP DATABASE IF EXISTS vending_control;
   -- CREATE DATABASE IF NOT EXISTS vending_control ...
   -- USE vending_control;
   ```
6. Paste the remaining SQL into the SQL box
7. Click **"Go"** button at bottom right
8. Wait for success message

#### 1.3 Verify Tables Created

1. Look at left sidebar - you should see **8 new tables**:
   - users
   - machines
   - gpios
   - sequences
   - sequence_steps
   - transactions
   - firmwares
   - logs

2. If you see all 8 tables, SUCCESS! ✅

#### 1.4 Import Initial Data

1. Still in phpMyAdmin, click **"SQL"** tab again
2. Open file: `backend/migrations/seed_data.sql`
3. Copy ALL content
4. **IMPORTANT**: Replace the first line `USE vending_control;` with:
   ```sql
   USE u120899366_vending;
   ```
5. Paste into SQL box
6. Click **"Go"**
7. Wait for success message

#### 1.5 Verify Data Inserted

1. In left sidebar, click **"users"** table
2. Click **"Browse"** tab
3. You should see **1 admin user**:
   - Name: System Admin
   - Phone: 9999999999
   - Email: admin@vendingcontrol.com

If you see this, database is ready! ✅

---

### ✅ STEP 2: Deploy Backend to Render.com (15 minutes)

#### 2.1 Push Code to GitHub (if not done)

```bash
# In your project root
git init
git add .
git commit -m "MySQL migration for Hostinger"
git branch -M main
git remote add origin https://github.com/yourusername/your-repo.git
git push -u origin main
```

#### 2.2 Deploy on Render

1. **Go to**: https://render.com
2. **Sign up** with GitHub (free account)
3. **Click "New +"** at top right
4. **Select "Web Service"**
5. **Connect your GitHub repository**
6. **Configure the service:**

**Basic Settings:**
- **Name**: `vending-control-backend`
- **Region**: Choose nearest to you
- **Branch**: `main`
- **Root Directory**: `backend`
- **Environment**: `Node`
- **Build Command**: `npm install`
- **Start Command**: `npm start`

**Instance Type:**
- Select: **Free** (for testing)

#### 2.3 Add Environment Variables

Click **"Environment"** tab and add these one by one:

```
DB_HOST=localhost
DB_PORT=3306
DB_NAME=u120899366_vending
DB_USER=u120899366_vending
DB_PASSWORD=P.m@2693

PORT=5000
NODE_ENV=production

JWT_SECRET=vending-secret-2024-change-this-random-key-abc123
JWT_EXPIRE=7d

CORS_ORIGIN=http://localhost:3000,https://your-frontend-domain.com
```

**IMPORTANT NOTES:**
- If `DB_HOST=localhost` doesn't work, try:
  - `DB_HOST=mysql.hostinger.com`
  - Or ask Hostinger support for the correct MySQL hostname
- Change `JWT_SECRET` to a random string (at least 32 characters)
- Update `CORS_ORIGIN` with your actual frontend URL later

#### 2.4 Deploy!

1. Click **"Create Web Service"** button
2. Wait 5-10 minutes for deployment
3. You'll see logs scrolling - wait for "Deploy succeeded"
4. **Copy your API URL** at the top (e.g., `https://vending-control-backend.onrender.com`)

#### 2.5 Test Backend

Open in browser:
```
https://your-backend-url.onrender.com/api/health
```

If you don't have a health endpoint, test with:
```
https://your-backend-url.onrender.com
```

You should see a response (not an error page) ✅

---

### ✅ STEP 3: Deploy Frontend (15 minutes)

#### 3.1 Update Frontend Configuration

```bash
cd frontend

# Create .env file
echo "REACT_APP_API_URL=https://your-backend-url.onrender.com/api" > .env

# Replace "your-backend-url.onrender.com" with your actual Render URL
```

#### 3.2 Build Frontend

```bash
npm install
npm run build
```

This creates a `build` folder with production files.

#### Option A: Deploy to Vercel (Recommended - Easier)

1. **Go to**: https://vercel.com
2. **Sign up** with GitHub
3. **Click "Add New..." → "Project"**
4. **Import your repository**
5. **Configure:**
   - Framework Preset: **Create React App**
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `build`
6. **Add Environment Variable:**
   - Key: `REACT_APP_API_URL`
   - Value: `https://your-backend-url.onrender.com/api`
7. **Click "Deploy"**
8. Wait 2-3 minutes
9. **Copy your frontend URL** (e.g., `https://your-app.vercel.app`)

#### Option B: Deploy to Hostinger (If you have web hosting)

1. **Upload build folder** via Hostinger File Manager:
   - Login to Hostinger
   - Go to File Manager
   - Navigate to `public_html` folder
   - Upload all files from `frontend/build` folder

2. **Create .htaccess file** in `public_html`:
   ```apache
   <IfModule mod_rewrite.c>
     RewriteEngine On
     RewriteBase /
     RewriteRule ^index\.html$ - [L]
     RewriteCond %{REQUEST_FILENAME} !-f
     RewriteCond %{REQUEST_FILENAME} !-d
     RewriteCond %{REQUEST_FILENAME} !-l
     RewriteRule . /index.html [L]
   </IfModule>
   ```

3. Your app will be at: `https://yourdomain.com`

---

### ✅ STEP 4: Update CORS (IMPORTANT!)

After frontend is deployed, update backend CORS:

1. Go back to **Render.com** dashboard
2. Open your backend service
3. Click **"Environment"**
4. Find **CORS_ORIGIN** variable
5. Update it to:
   ```
   https://your-vercel-app.vercel.app
   ```
   Or if on Hostinger:
   ```
   https://yourdomain.com
   ```
6. Save changes
7. Service will automatically redeploy (wait 2 minutes)

---

### ✅ STEP 5: Test Complete System (5 minutes)

#### 5.1 Test Login

1. Open your frontend URL
2. You should see login page
3. Enter phone: `9999999999`
4. Click "Send OTP"
5. **Check backend logs** on Render for OTP (it's printed in console for development)
6. Enter OTP and login

#### 5.2 Verify Dashboard

- You should see admin dashboard
- Check if data loads correctly
- Try creating a test owner

#### 5.3 Test Database

In phpMyAdmin:
```sql
SELECT * FROM users;
-- Should show admin and any owners you created
```

---

## 🎯 TROUBLESHOOTING

### Problem: Backend can't connect to MySQL

**Error**: `Can't connect to MySQL server`

**Solutions to try:**

1. **Try different DB_HOST values:**
   ```
   localhost
   mysql.hostinger.com
   127.0.0.1
   ```

2. **Check if Hostinger allows remote connections:**
   - Contact Hostinger support
   - Ask: "Does my database allow remote connections?"
   - They might need to enable it

3. **Use MySQL hostname from Hostinger:**
   - In Hostinger panel → MySQL Databases
   - Look for "Hostname" or "Server"
   - Use that value for DB_HOST

4. **Whitelist Render IP (if needed):**
   - Ask Hostinger support to whitelist Render's IPs
   - Or check if there's a "Remote MySQL" option in Hostinger panel

### Problem: Frontend shows CORS error

**Error**: `Access to fetch... has been blocked by CORS policy`

**Solution:**
- Update CORS_ORIGIN in Render environment variables
- Must include exact frontend URL (with https://)
- Save and wait for redeploy

### Problem: OTP not received

**Solution:**
- OTP is printed in backend console (development mode)
- Check Render logs:
  - Open your service in Render
  - Click "Logs" tab
  - Look for: `OTP for 9999999999: 123456`

### Problem: "Table doesn't exist"

**Solution:**
- Database schema not imported correctly
- Go to phpMyAdmin
- Check if tables exist
- If not, re-run create_database.sql

---

## 📊 VERIFICATION CHECKLIST

After deployment, verify:

- [ ] phpMyAdmin shows 8 tables
- [ ] Users table has admin record
- [ ] Backend URL responds (not 404)
- [ ] Frontend loads login page
- [ ] Can request OTP (check Render logs)
- [ ] Can login with OTP
- [ ] Dashboard shows without errors
- [ ] Can create test owner
- [ ] Owner appears in database

---

## 🎯 NEXT STEPS

### 1. Secure Your System

- [ ] Change JWT_SECRET to random 32+ character string
- [ ] Update admin phone number if needed
- [ ] Set up Razorpay keys (for payments)
- [ ] Enable HTTPS (automatic on Render/Vercel)

### 2. Configure ESP32

Update ESP32 firmware with:
```cpp
const char* SERVER_URL = "https://your-backend-url.onrender.com/api";
const char* MACHINE_ID = "VM001";
```

### 3. Test ESP32 Connection

1. Upload firmware to ESP32
2. Check Render logs for registration
3. Verify machine appears in dashboard

---

## 💡 IMPORTANT NOTES

### About Hostinger MySQL

- Your database is **ALREADY CREATED** ✅
- Name: `u120899366_vending`
- User: `u120899366_vending`
- Password: `P.m@2693`
- Just import the schema!

### About Remote Connections

Hostinger **might not allow remote MySQL** connections on shared hosting. If backend can't connect:

**Option 1: Deploy Backend to Hostinger (if they support Node.js)**
- Ask Hostinger about Node.js hosting
- Deploy there so it can use `localhost`

**Option 2: Use Hostinger Business Plan**
- Allows remote MySQL connections
- Check plan features

**Option 3: Use Different Database Host**
- Keep backend on Render
- Use cloud MySQL (ClearDB, PlanetScale, etc.)

**Check with Hostinger support** about remote MySQL access!

---

## 📞 SUPPORT

### Hostinger Support
- **24/7 Live Chat**: In control panel
- **Knowledge Base**: https://support.hostinger.com
- **Ask**: "Does my plan allow remote MySQL connections?"

### Need Help?
1. Check Render logs for errors
2. Check phpMyAdmin for database issues
3. Test API endpoints with curl/Postman
4. Contact me with specific error messages

---

## ✅ SUCCESS!

When everything works:
- ✅ Frontend loads at your URL
- ✅ Can login with 9999999999
- ✅ Dashboard displays correctly
- ✅ Can create owners
- ✅ Data saves to Hostinger MySQL

**You're LIVE! 🎉**

---

*Your Database: u120899366_vending*
*Ready to deploy!*
