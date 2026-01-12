# Vending Machine Control & Payment Platform

A comprehensive multi-vending-machine control and payment platform with ESP32 integration, Razorpay payments, and real-time monitoring.

## 🎯 Features

### Core Features
- **Multi-Role Authentication**: Admin and Owner roles with JWT-based OTP authentication
- **Machine Management**: Create, monitor, and control multiple vending machines
- **Dynamic GPIO Configuration**: Configure and control GPIO pins for each machine
- **Sequence Management**: Define automated cleaning/operation sequences
- **Process Locking**: Secure sequence execution with emergency stop capability
- **Razorpay Integration**: Automated payment-triggered sequences
- **ESP32 Support**: Real-time device monitoring with heartbeat tracking
- **OTA Updates**: Over-the-air firmware updates for ESP32 devices
- **Transaction Tracking**: Complete payment and earnings history
- **System Logging**: Comprehensive event logging and monitoring

### Admin Capabilities
- ✅ Create and manage machine owners
- ✅ Control all machines across the platform
- ✅ Create and configure machines
- ✅ Define GPIO configurations
- ✅ Create operation sequences
- ✅ Deploy OTA updates
- ✅ View all transactions and logs
- ✅ Execute emergency stops

### Owner Capabilities
- ✅ View dashboard with earnings
- ✅ Manage own machines only
- ✅ Control machine GPIO pins
- ✅ View machine status and logs
- ✅ Track transactions and earnings
- ✅ Execute emergency stops on own machines

### ESP32 Features
- ✅ Heartbeat monitoring (auto-detect offline)
- ✅ REST API polling for commands
- ✅ GPIO state synchronization
- ✅ Sequence execution
- ✅ OTA firmware updates
- ✅ Error reporting

## 🏗️ Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   React     │────▶│   Node.js   │────▶│   MongoDB   │
│  Frontend   │     │   Backend   │     │  Database   │
└─────────────┘     └─────────────┘     └─────────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │  Razorpay   │
                    │   Webhook   │
                    └─────────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │    ESP32    │
                    │   Devices   │
                    └─────────────┘
```

## 📁 Project Structure

```
vending-machine-platform/
├── backend/
│   ├── models/           # MongoDB schemas
│   │   ├── User.js
│   │   ├── Machine.js
│   │   ├── Sequence.js
│   │   ├── Transaction.js
│   │   ├── Log.js
│   │   └── Firmware.js
│   ├── routes/           # API endpoints
│   │   ├── auth.js
│   │   ├── admin.js
│   │   ├── owner.js
│   │   ├── machines.js
│   │   ├── gpio.js
│   │   ├── sequences.js
│   │   ├── razorpay.js
│   │   ├── esp.js
│   │   ├── ota.js
│   │   ├── transactions.js
│   │   ├── logs.js
│   │   └── control.js
│   ├── middleware/       # Authentication middleware
│   ├── services/         # Business logic
│   │   └── processManager.js
│   ├── utils/           # Utilities
│   │   ├── logger.js
│   │   └── otpService.js
│   └── server.js        # Entry point
├── frontend/
│   ├── src/
│   │   ├── components/  # Reusable components
│   │   ├── pages/       # Page components
│   │   ├── context/     # React context
│   │   ├── utils/       # API client
│   │   ├── App.js
│   │   └── index.js
│   ├── public/
│   └── package.json
├── .env.example
├── package.json
└── README.md
```

## 🚀 Installation

### Prerequisites
- Node.js 16+ and npm
- MongoDB 4.4+
- Razorpay account (for payments)

### Backend Setup

1. **Clone and install dependencies**
```bash
npm install
```

2. **Configure environment variables**
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. **Start MongoDB**
```bash
# Using MongoDB service
sudo service mongod start

# Or using Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

4. **Run backend**
```bash
npm run dev
```

Backend will run on `http://localhost:5000`

### Frontend Setup

1. **Install dependencies**
```bash
cd frontend
npm install
```

2. **Configure API URL (optional)**
```bash
# Create .env in frontend folder
echo "REACT_APP_API_URL=http://localhost:5000/api" > .env
```

3. **Run frontend**
```bash
npm start
```

Frontend will run on `http://localhost:3000`

### Run Both Simultaneously
```bash
# From root directory
npm run dev:all
```

## 📱 First Login

### Create Admin User
Since this is a fresh installation, you'll need to manually create an admin user in MongoDB:

```javascript
// Connect to MongoDB
use vending_machine_platform

// Create admin user
db.users.insertOne({
  phoneNumber: "9999999999",
  role: "admin",
  status: "active",
  createdAt: new Date(),
  updatedAt: new Date()
})
```

Now you can login with phone number `9999999999`. The OTP will be logged to console in development mode.

## 🔧 Configuration

### Environment Variables

```env
# Server
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/vending_machine_platform

# JWT
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRE=7d

# Razorpay
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret

# ESP32
ESP32_HEARTBEAT_TIMEOUT=10000
ESP32_POLLING_INTERVAL=5000

# OTA
OTA_STORAGE_PATH=./uploads/firmware

# Frontend URL
FRONTEND_URL=http://localhost:3000
```

## 🔌 API Documentation

### Authentication Endpoints

#### Request OTP
```http
POST /api/auth/request-otp
Content-Type: application/json

{
  "phoneNumber": "9999999999"
}
```

#### Verify OTP
```http
POST /api/auth/verify-otp
Content-Type: application/json

{
  "phoneNumber": "9999999999",
  "otp": "123456"
}
```

### Machine Endpoints

#### Get All Machines
```http
GET /api/machines
Authorization: Bearer <token>
```

#### Create Machine (Admin only)
```http
POST /api/machines
Authorization: Bearer <token>
Content-Type: application/json

{
  "machineId": "MACHINE001",
  "location": "Building A, Floor 1",
  "ownerId": "owner_id_here",
  "fixedPrice": 50,
  "gpios": []
}
```

### ESP32 Endpoints

#### Heartbeat
```http
POST /api/esp/heartbeat
Content-Type: application/json

{
  "machineId": "MACHINE001",
  "firmwareVersion": "v1.0.0",
  "ipAddress": "192.168.1.100",
  "wifiSSID": "MyWiFi",
  "signalStrength": -45
}
```

#### Get GPIO States
```http
GET /api/esp/gpio-states/MACHINE001
```

## 🤖 ESP32 Integration

### Sample ESP32 Code Structure

```cpp
// ESP32 should implement:
// 1. Heartbeat every 5 seconds
// 2. Poll GPIO states every 2 seconds
// 3. Execute GPIO commands
// 4. Check for OTA updates
// 5. Report errors

void loop() {
  // Send heartbeat
  if (millis() - lastHeartbeat > 5000) {
    sendHeartbeat();
    lastHeartbeat = millis();
  }
  
  // Poll GPIO states
  if (millis() - lastPoll > 2000) {
    pollGPIOStates();
    lastPoll = millis();
  }
  
  // Check for OTA
  if (millis() - lastOTACheck > 60000) {
    checkOTAUpdate();
    lastOTACheck = millis();
  }
}
```

## 💳 Razorpay Integration

### Webhook Setup

1. Go to Razorpay Dashboard → Webhooks
2. Add webhook URL: `https://yourdomain.com/api/razorpay/webhook`
3. Select events: `payment.captured`, `payment.failed`
4. Copy webhook secret to `.env`

### Payment Flow

1. Customer scans QR code or uses payment link
2. Payment description should contain `machineId`
3. Razorpay sends webhook on payment success
4. Backend validates signature
5. Sequence starts automatically
6. Transaction logged

## 🔒 Security

- ✅ JWT-based authentication
- ✅ Role-based access control
- ✅ Razorpay signature verification
- ✅ Rate limiting on API endpoints
- ✅ Input validation
- ✅ Helmet.js for security headers
- ✅ Password/OTP hashing with bcrypt

## 📊 Monitoring

### System Logs
Access logs at `/logs` page to monitor:
- ESP32 connections/disconnections
- Sequence executions
- Emergency stops
- Payment events
- Errors and warnings

### Machine Status
- Real-time heartbeat monitoring
- Auto-detect offline machines (10s timeout)
- GPIO state tracking
- Process lock status

## 🚨 Emergency Stop

Emergency stop is available to:
- Machine owner
- Platform admin

Stops all GPIOs immediately and unlocks process.

## 📦 Production Deployment

### Build Frontend
```bash
cd frontend
npm run build
```

### Backend Production
```bash
NODE_ENV=production npm start
```

### Using PM2
```bash
npm install -g pm2
pm2 start backend/server.js --name vending-platform
pm2 startup
pm2 save
```

### Nginx Configuration
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location / {
        root /path/to/frontend/build;
        try_files $uri /index.html;
    }
}
```

## 🧪 Testing

### Create Test Data

Use the admin dashboard to:
1. Create an owner
2. Add a machine
3. Configure GPIOs
4. Create a sequence
5. Test manual sequence execution

## 📝 License

MIT License - feel free to use this project for commercial purposes.

## 🤝 Support

For issues or questions, please create an issue in the repository.

## 🎉 Credits

Built with:
- React + Tailwind CSS
- Node.js + Express
- MongoDB + Mongoose
- Razorpay API
- JWT Authentication
- Lucide React Icons
