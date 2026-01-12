# Hostinger Deployment Guide - MySQL Version

## 🎯 Overview
This guide will help you deploy the Vending Control System to Hostinger with MySQL database.

---

## 📋 Prerequisites

### What You Need from Hostinger:
1. **MySQL Database**
   - Database name (e.g., `u123456789_vending`)
   - Database user (e.g., `u123456789_admin`)
   - Database password
   - Database host (usually `localhost` or `mysql.hostinger.com`)

2. **Node.js Hosting** (if available)
   - Or use external service (Render, Railway, Heroku)

3. **FTP/SSH Access**
   - To upload files

---

## 🗄️ Part 1: Setting Up MySQL Database on Hostinger

### Step 1: Create MySQL Database

1. **Login to Hostinger Control Panel**
   - Go to: https://hpanel.hostinger.com

2. **Navigate to MySQL Databases**
   - Click on **"Websites"**
   - Select your domain
   - Click **"MySQL Databases"**

3. **Create New Database**
   - Database name: `u123456789_vending` (Hostinger adds prefix automatically)
   - Database user: Create new user or use existing
   - Password: Use strong password
   - Click **"Create"**

4. **Note Down Credentials**
   ```
   Database Host: localhost (or mysql.hostinger.com)
   Database Name: u123456789_vending
   Database User: u123456789_admin
   Database Password: YourStrongPassword123
   Port: 3306
   ```

### Step 2: Access phpMyAdmin

1. In Hostinger panel, click **"Manage"** next to your database
2. This opens phpMyAdmin
3. You'll use this to run SQL scripts

### Step 3: Import Database Schema

#### Option A: Using phpMyAdmin (Recommended)

1. **Open phpMyAdmin**
2. **Select your database** from left sidebar
3. **Click "SQL" tab**
4. **Copy and paste** content from `backend/migrations/create_database.sql`
5. **Remove or comment out** these lines at the top:
   ```sql
   -- DROP DATABASE IF EXISTS vending_control;
   -- CREATE DATABASE IF NOT EXISTS vending_control ...
   -- USE vending_control;
   ```
6. **Click "Go"** to execute
7. **Verify tables created** - you should see 8 tables in left sidebar

#### Option B: Using SQL File Upload

1. Open phpMyAdmin
2. Click **"Import"** tab
3. Click **"Choose File"**
4. Select `backend/migrations/create_database.sql`
5. **Important**: Edit the file first to remove database creation lines
6. Click **"Go"**

### Step 4: Seed Initial Data

1. In phpMyAdmin, click **"SQL"** tab
2. Copy content from `backend/migrations/seed_data.sql`
3. Paste into SQL box
4. Click **"Go"**
5. Verify data:
   ```sql
   SELECT * FROM users;
   SELECT * FROM sequences;
   ```

You should see:
- 1 admin user (phone: 9999999999)
- 3 sequences

---

## 🚀 Part 2: Deploying Backend

### Option A: Deploy to Render.com (Recommended - Free)

#### Step 1: Prepare Your Code

1. **Update package.json**
   ```bash
   # In backend folder, rename package_mysql.json to package.json
   cp package_mysql.json package.json
   ```

2. **Create .env file** (based on .env.mysql.example)
   ```env
   # Database (Hostinger MySQL)
   DB_HOST=mysql.hostinger.com
   DB_PORT=3306
   DB_NAME=u123456789_vending
   DB_USER=u123456789_admin
   DB_PASSWORD=YourHostingerDBPassword

   # Server
   PORT=5000
   NODE_ENV=production

   # JWT
   JWT_SECRET=your-super-secret-key-change-this
   JWT_EXPIRE=7d

   # Razorpay
   RAZORPAY_KEY_ID=your_razorpay_key
   RAZORPAY_KEY_SECRET=your_razorpay_secret

   # CORS (your frontend domain)
   CORS_ORIGIN=https://your-frontend-domain.com
   ```

3. **Push to GitHub**
   ```bash
   git add .
   git commit -m "MySQL migration for Hostinger"
   git push origin main
   ```

#### Step 2: Deploy on Render

1. **Go to**: https://render.com
2. **Sign up** with GitHub
3. **Click "New +"** → **"Web Service"**
4. **Connect your repository**
5. **Configure:**
   - **Name**: vending-control-backend
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: Free

6. **Add Environment Variables** (click "Environment")
   - Add all variables from your .env file
   - DB_HOST, DB_NAME, DB_USER, DB_PASSWORD, etc.

7. **Click "Create Web Service"**
8. **Wait for deployment** (5-10 minutes)
9. **Note your API URL**: `https://vending-control-backend.onrender.com`

### Option B: Deploy to Railway.app (Alternative - Free)

1. Go to: https://railway.app
2. Sign up with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your repository
5. Add environment variables
6. Deploy!

### Option C: Deploy to Hostinger Node.js (If Available)

Check if your Hostinger plan supports Node.js hosting:
1. Contact Hostinger support
2. Request Node.js hosting details
3. Follow their Node.js deployment guide

---

## 🌐 Part 3: Deploying Frontend

### Option 1: Hostinger Web Hosting

#### Step 1: Build Frontend

```bash
cd frontend

# Update API URL in .env
echo "REACT_APP_API_URL=https://your-backend-url.com/api" > .env

# Build
npm run build
```

#### Step 2: Upload to Hostinger

1. **Access File Manager** in Hostinger panel
2. **Navigate to** `public_html` folder
3. **Upload all files** from `frontend/build` folder
4. Your app will be at: `https://yourdomain.com`

#### Step 3: Configure .htaccess (for React Router)

Create `.htaccess` in `public_html`:
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

### Option 2: Vercel (Recommended - Free)

1. Push frontend code to GitHub
2. Go to: https://vercel.com
3. Import your repository
4. Configure:
   - Framework: Create React App
   - Root Directory: `frontend`
   - Environment Variables: Add `REACT_APP_API_URL`
5. Deploy!

---

## ✅ Part 4: Verification

### Test Database Connection

1. **SSH or use online tool** to test connection:
   ```bash
   mysql -h mysql.hostinger.com -u u123456789_admin -p
   # Enter password
   
   USE u123456789_vending;
   SHOW TABLES;
   SELECT * FROM users;
   ```

2. **Verify tables exist:**
   - users
   - machines
   - gpios
   - sequences
   - sequence_steps
   - transactions
   - firmwares
   - logs

### Test Backend API

```bash
# Test health check
curl https://your-backend-url.com/api/health

# Test auth
curl -X POST https://your-backend-url.com/api/auth/request-otp \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber":"9999999999"}'
```

### Test Frontend

1. Open: `https://yourdomain.com`
2. Should see login page
3. Try logging in with: `9999999999`

---

## 🔧 Part 5: Configuration Checklist

### Hostinger MySQL Setup
- [ ] Database created
- [ ] Database user created with full privileges
- [ ] Tables created (8 tables)
- [ ] Initial data seeded
- [ ] Connection tested from phpMyAdmin

### Backend Deployment
- [ ] Code deployed to hosting service
- [ ] Environment variables configured
- [ ] Database connection working
- [ ] API endpoints accessible
- [ ] CORS configured for frontend domain

### Frontend Deployment
- [ ] Built with production API URL
- [ ] Uploaded to Hostinger or Vercel
- [ ] .htaccess configured (if on Hostinger)
- [ ] Domain/subdomain working
- [ ] Can access login page

### Security
- [ ] Strong database password
- [ ] JWT secret changed
- [ ] Razorpay keys added (production keys)
- [ ] CORS restricted to frontend domain only
- [ ] Environment variables not in code

---

## 🔒 Part 6: Security Considerations

### Database Security

1. **Use strong passwords**
   - Mix of uppercase, lowercase, numbers, symbols
   - At least 16 characters

2. **Limit database user privileges**
   ```sql
   GRANT SELECT, INSERT, UPDATE, DELETE ON u123456789_vending.* 
   TO 'u123456789_admin'@'%';
   FLUSH PRIVILEGES;
   ```

3. **Backup regularly**
   - Use Hostinger's backup feature
   - Or export database weekly via phpMyAdmin

### API Security

1. **Use HTTPS only**
   - Hostinger provides free SSL
   - Enable in control panel

2. **Rate limiting** (add to backend):
   ```bash
   npm install express-rate-limit
   ```

3. **Environment variables**
   - Never commit .env to git
   - Use different values for production

---

## 📊 Part 7: Monitoring

### Check Database Size

In phpMyAdmin:
```sql
SELECT 
  table_schema as 'Database',
  SUM(data_length + index_length) / 1024 / 1024 as 'Size (MB)'
FROM information_schema.tables
WHERE table_schema = 'u123456789_vending'
GROUP BY table_schema;
```

### Check Record Counts

```sql
SELECT 'users' as table_name, COUNT(*) as count FROM users
UNION ALL SELECT 'machines', COUNT(*) FROM machines
UNION ALL SELECT 'transactions', COUNT(*) FROM transactions
UNION ALL SELECT 'logs', COUNT(*) FROM logs;
```

### Monitor Logs

Add to backend (optional):
```javascript
// Store API logs in database
app.use((req, res, next) => {
  Log.create({
    level: 'info',
    message: `${req.method} ${req.path}`,
    source: 'API',
    metadata: { ip: req.ip, userAgent: req.headers['user-agent'] }
  });
  next();
});
```

---

## 🐛 Troubleshooting

### "Can't connect to MySQL server"

**Check:**
1. Correct host (localhost or mysql.hostinger.com)
2. Correct port (3306)
3. Database user has remote access enabled
4. Firewall not blocking connection

**Fix:**
```env
# Try both:
DB_HOST=localhost
# or
DB_HOST=mysql.hostinger.com
```

### "Access denied for user"

**Check:**
1. Username is correct (with Hostinger prefix)
2. Password is correct (no extra spaces)
3. User has privileges on database

**Fix in phpMyAdmin:**
```sql
SHOW GRANTS FOR 'u123456789_admin'@'%';
```

### "Table doesn't exist"

**Check:**
1. Database selected correctly
2. Tables actually created
3. Correct table names (case-sensitive on Linux)

**Fix:**
```sql
USE u123456789_vending;
SHOW TABLES;
```

### "CORS Error" in frontend

**Check:**
1. CORS_ORIGIN in backend .env includes frontend URL
2. Protocol matches (http vs https)
3. No trailing slash in URL

**Fix in backend:**
```javascript
// backend/server.js
app.use(cors({
  origin: ['https://yourdomain.com', 'http://localhost:3000'],
  credentials: true
}));
```

---

## 📞 Support Resources

### Hostinger Support
- **Live Chat**: Available 24/7 in control panel
- **Knowledge Base**: https://support.hostinger.com
- **Email**: support@hostinger.com

### Database Issues
- Check phpMyAdmin for errors
- Review MySQL error logs in Hostinger panel
- Test connection with online MySQL tools

### Deployment Issues
- Check service logs (Render/Railway)
- Verify environment variables
- Test API endpoints with curl/Postman

---

## 🚀 Quick Start Summary

### For Complete Beginners:

**Step 1: Setup Hostinger Database (10 minutes)**
1. Login to Hostinger → MySQL Databases
2. Create database and user
3. Open phpMyAdmin
4. Run create_database.sql (remove first 3 lines)
5. Run seed_data.sql

**Step 2: Deploy Backend (15 minutes)**
1. Sign up at Render.com with GitHub
2. Connect your repository
3. Add environment variables (DB credentials)
4. Deploy
5. Copy API URL

**Step 3: Deploy Frontend (10 minutes)**
1. Update frontend/.env with API URL
2. Run: `npm run build`
3. Upload build folder to Hostinger public_html
4. Add .htaccess file
5. Done!

**Total Time**: ~35 minutes

---

## 📋 Environment Variables Cheat Sheet

```env
# Copy this to Render/Railway environment variables

DB_HOST=mysql.hostinger.com
DB_PORT=3306
DB_NAME=u123456789_vending
DB_USER=u123456789_admin
DB_PASSWORD=YourHostingerPassword123

PORT=5000
NODE_ENV=production

JWT_SECRET=super-secret-change-this-123456
JWT_EXPIRE=7d

RAZORPAY_KEY_ID=rzp_live_xxxxx
RAZORPAY_KEY_SECRET=secret_xxxxx

CORS_ORIGIN=https://yourdomain.com
```

---

## ✅ Success Checklist

After deployment, verify:
- [ ] Can access phpMyAdmin and see 8 tables
- [ ] Backend API returns health check
- [ ] Frontend loads without errors
- [ ] Can login with admin (9999999999)
- [ ] Dashboard shows correctly
- [ ] Can create owner
- [ ] ESP32 can connect (test later)

---

**You're ready to deploy! Follow the steps carefully and you'll have your system running in about 30-40 minutes! 🎉**

*Last Updated: 2026-01-09*
