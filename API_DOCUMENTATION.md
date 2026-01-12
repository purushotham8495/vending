# API Documentation

Complete REST API documentation for the Vending Machine Platform.

## Base URL
```
Production: https://yourdomain.com/api
Development: http://localhost:5000/api
```

## Authentication

All protected endpoints require JWT token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

---

## 🔐 Authentication APIs

### Request OTP
```http
POST /auth/request-otp
```

**Request Body**:
```json
{
  "phoneNumber": "9999999999"
}
```

**Response**:
```json
{
  "success": true,
  "message": "OTP sent successfully",
  "expiryTime": "2024-01-09T16:20:00.000Z"
}
```

### Verify OTP
```http
POST /auth/verify-otp
```

**Request Body**:
```json
{
  "phoneNumber": "9999999999",
  "otp": "123456"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user_id",
    "phoneNumber": "9999999999",
    "role": "admin",
    "status": "active"
  }
}
```

### Get Current User
```http
GET /auth/me
Authorization: Bearer <token>
```

**Response**:
```json
{
  "success": true,
  "user": {
    "id": "user_id",
    "phoneNumber": "9999999999",
    "role": "admin",
    "status": "active",
    "totalMachines": 5
  }
}
```

---

## 👥 Admin APIs (Admin Only)

### Get All Owners
```http
GET /admin/owners
Authorization: Bearer <token>
```

**Response**:
```json
{
  "success": true,
  "owners": [
    {
      "_id": "owner_id",
      "phoneNumber": "9876543210",
      "role": "owner",
      "status": "active",
      "totalMachines": 3,
      "totalEarnings": 15000
    }
  ]
}
```

### Create Owner
```http
POST /admin/owners
Authorization: Bearer <token>
```

**Request Body**:
```json
{
  "phoneNumber": "9876543210",
  "razorpayKeyId": "rzp_test_xxx",
  "razorpayKeySecret": "secret_xxx",
  "razorpayAccountId": "acc_xxx"
}
```

### Update Owner
```http
PUT /admin/owners/:ownerId
Authorization: Bearer <token>
```

**Request Body**:
```json
{
  "status": "blocked"
}
```

### Get Platform Statistics
```http
GET /admin/statistics
Authorization: Bearer <token>
```

**Response**:
```json
{
  "success": true,
  "statistics": {
    "totalOwners": 10,
    "totalMachines": 50,
    "onlineMachines": 45,
    "offlineMachines": 5,
    "totalTransactions": 1000,
    "totalRevenue": 50000,
    "todayRevenue": 2500
  }
}
```

---

## 🏢 Owner APIs

### Get Owner Dashboard
```http
GET /owner/dashboard
Authorization: Bearer <token>
```

**Response**:
```json
{
  "success": true,
  "dashboard": {
    "totalMachines": 5,
    "onlineMachines": 4,
    "offlineMachines": 1,
    "totalRevenue": 25000,
    "todayRevenue": 1500,
    "monthRevenue": 15000,
    "totalTransactions": 500
  }
}
```

### Get Owner's Machines
```http
GET /owner/machines
Authorization: Bearer <token>
```

### Get Owner's Transactions
```http
GET /owner/transactions?page=1&limit=20&machineId=xxx
Authorization: Bearer <token>
```

### Get Earnings Report
```http
GET /owner/earnings?groupBy=day&startDate=2024-01-01&endDate=2024-01-31
Authorization: Bearer <token>
```

---

## 🖥️ Machine APIs

### Get All Machines
```http
GET /machines
Authorization: Bearer <token>
```

### Get Single Machine
```http
GET /machines/:machineId
Authorization: Bearer <token>
```

### Create Machine (Admin Only)
```http
POST /machines
Authorization: Bearer <token>
```

**Request Body**:
```json
{
  "machineId": "MACHINE001",
  "location": "Building A, Floor 1",
  "ownerId": "owner_id_here",
  "fixedPrice": 50,
  "gpios": []
}
```

### Update Machine (Admin Only)
```http
PUT /machines/:machineId
Authorization: Bearer <token>
```

### Delete Machine (Admin Only)
```http
DELETE /machines/:machineId
Authorization: Bearer <token>
```

---

## 🔌 GPIO APIs

### Get GPIO Configuration
```http
GET /gpio/:machineId
Authorization: Bearer <token>
```

### Update GPIO Configuration
```http
PUT /gpio/:machineId
Authorization: Bearer <token>
```

**Request Body**:
```json
{
  "gpios": [
    {
      "gpioNumber": 4,
      "gpioName": "Hot Air",
      "defaultState": "OFF",
      "relayLogic": "LOW_ON"
    }
  ]
}
```

### Toggle GPIO
```http
POST /gpio/:machineId/toggle
Authorization: Bearer <token>
```

**Request Body**:
```json
{
  "gpioId": "gpio_id",
  "state": "ON",
  "duration": 10
}
```

---

## 📝 Sequence APIs

### Get All Sequences
```http
GET /sequences
Authorization: Bearer <token>
```

### Create Sequence (Admin Only)
```http
POST /sequences
Authorization: Bearer <token>
```

**Request Body**:
```json
{
  "name": "Standard Cleaning",
  "description": "Default cleaning sequence",
  "steps": [
    {
      "stepNumber": 1,
      "gpioName": "Hot Air",
      "onTime": 5,
      "offTime": 2
    }
  ],
  "isDefault": true
}
```

### Update Sequence (Admin Only)
```http
PUT /sequences/:sequenceId
Authorization: Bearer <token>
```

### Delete Sequence (Admin Only)
```http
DELETE /sequences/:sequenceId
Authorization: Bearer <token>
```

---

## 🎮 Control APIs

### Emergency Stop
```http
POST /control/emergency-stop/:machineId
Authorization: Bearer <token>
```

### Start Sequence (Manual)
```http
POST /control/start-sequence/:machineId
Authorization: Bearer <token>
```

**Request Body**:
```json
{
  "sequenceId": "sequence_id"
}
```

### Get Machine Status
```http
GET /control/status/:machineId
Authorization: Bearer <token>
```

**Response**:
```json
{
  "success": true,
  "status": {
    "machineStatus": "RUNNING",
    "processLocked": true,
    "currentSequence": {
      "name": "Standard Cleaning",
      "totalDuration": 30
    },
    "currentStep": 2,
    "remainingTime": 15,
    "gpios": [...]
  }
}
```

---

## 💳 Razorpay APIs

### Create Order
```http
POST /razorpay/create-order
```

**Request Body**:
```json
{
  "machineId": "MACHINE001"
}
```

**Response**:
```json
{
  "success": true,
  "order": {
    "id": "order_xxx",
    "amount": 5000,
    "currency": "INR",
    "machineId": "MACHINE001",
    "keyId": "rzp_test_xxx"
  }
}
```

### Webhook (Payment Captured)
```http
POST /razorpay/webhook
X-Razorpay-Signature: <signature>
```

This endpoint is called automatically by Razorpay.

---

## 📱 ESP32 APIs (No Auth Required)

### Heartbeat
```http
POST /esp/heartbeat
```

### Get GPIO States
```http
GET /esp/gpio-states/:machineId
```

### Report Error
```http
POST /esp/error
```

---

## 📊 Transaction APIs

### Get All Transactions
```http
GET /transactions?page=1&limit=20&status=completed
Authorization: Bearer <token>
```

### Get Single Transaction
```http
GET /transactions/:transactionId
Authorization: Bearer <token>
```

### Get Transaction Stats
```http
GET /transactions/stats/summary
Authorization: Bearer <token>
```

---

## 📝 Log APIs

### Get All Logs
```http
GET /logs?page=1&severity=error&eventType=EMERGENCY_STOP
Authorization: Bearer <token>
```

### Get Machine Logs
```http
GET /logs/machine/:machineId
Authorization: Bearer <token>
```

### Get Log Statistics
```http
GET /logs/stats/summary
Authorization: Bearer <token>
```

---

## 🔄 OTA APIs

### Get All Firmware
```http
GET /ota
Authorization: Bearer <token>
```

### Upload Firmware (Admin Only)
```http
POST /ota/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

### Activate Firmware (Admin Only)
```http
PUT /ota/:firmwareId/activate
Authorization: Bearer <token>
```

### Deploy to Machines (Admin Only)
```http
POST /ota/:firmwareId/deploy
Authorization: Bearer <token>
```

**Request Body**:
```json
{
  "machineIds": ["machine_id_1", "machine_id_2"]
}
```

### Check for Update (ESP32)
```http
GET /ota/check/:machineId?currentVersion=v1.0.0
```

### Download Firmware (ESP32)
```http
GET /ota/download/:firmwareId?machineId=MACHINE001
```

---

## 📋 Error Responses

All errors follow this format:

```json
{
  "success": false,
  "message": "Error description"
}
```

Common HTTP status codes:
- `200`: Success
- `201`: Created
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error
