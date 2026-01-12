# ESP32 Machine Control System - Complete Documentation

## Overview
Complete system for controlling ESP32-based sanitizing vending machines from a web dashboard with real-time GPIO control, sequence execution, and remote management.

---

## 🎮 Web Dashboard Features

### Machine Control Page (`/machine/:machineId/control`)

#### **1. Real-time Machine Status**
- **Connection Status**: WiFi indicator (green = online, gray = offline)
- **Machine Status**: IDLE, RUNNING, or OFFLINE
- **Last Heartbeat**: Timestamp of last communication
- **Firmware Version**: Current ESP32 firmware
- **GPIO Count**: Number of configured pins

#### **2. GPIO Control Panel**
Each GPIO pin displays:
- **Pin Name**: Descriptive name (e.g., "Pump 1")
- **Pin Number**: GPIO pin number
- **Current State**: ACTIVE (LOW) or INACTIVE (HIGH)
- **Status Indicator**: Green dot (ON) or gray dot (OFF)

**Control Options per GPIO:**
- **Toggle Button**: Switch between ON/OFF
- **Pulse 1s**: Turn ON for 1 second, then OFF
- **Pulse 3s**: Turn ON for 3 seconds, then OFF
- **Pulse 5s**: Turn ON for 5 seconds, then OFF

#### **3. Sequence Execution**
- **Sequence Selection**: Dropdown with all available sequences
- **Step Preview**: View all steps before execution
- **Execute Button**: Start sequence execution
- **Progress Monitor**: Real-time execution progress
- **Emergency Stop**: Halt execution immediately

#### **4. Emergency Controls**
- **Restart ESP32**: Remotely restart the controller
- **Emergency Stop**: Stop all operations and turn off GPIOs

---

## 🔧 Backend API Endpoints

### GPIO Control Routes

#### Toggle GPIO
```http
POST /api/control/toggle-gpio/:machineId
Content-Type: application/json

{
  "gpioId": "gpio_id_here"
}
```

**Response:**
```json
{
  "success": true,
  "message": "GPIO Pump 1 toggled to ON",
  "gpio": {
    "_id": "gpio_id",
    "gpioName": "Pump 1",
    "gpioNumber": 25,
    "currentState": "ON"
  }
}
```

#### Pulse GPIO
```http
POST /api/control/pulse-gpio/:machineId
Content-Type: application/json

{
  "gpioId": "gpio_id_here",
  "duration": 3000
}
```

**Response:**
```json
{
  "success": true,
  "message": "GPIO Pump 1 pulsed for 3000ms",
  "gpio": {
    "_id": "gpio_id",
    "gpioName": "Pump 1",
    "gpioNumber": 25,
    "currentState": "ON",
    "duration": 3000
  }
}
```

#### Restart ESP32
```http
POST /api/control/restart-esp/:machineId
```

**Response:**
```json
{
  "success": true,
  "message": "Restart command queued. ESP32 will restart on next heartbeat."
}
```

#### Get GPIO Status
```http
GET /api/control/gpio-status/:machineId
```

**Response:**
```json
{
  "success": true,
  "gpios": [
    {
      "_id": "gpio_id",
      "gpioName": "Pump 1",
      "gpioNumber": 25,
      "currentState": "ON",
      "lastTriggered": "2026-01-09T10:30:00.000Z"
    }
  ]
}
```

---

## 🤖 ESP32 Firmware

### Configuration

#### WiFi Setup
```cpp
const char* WIFI_SSID = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";
```

#### Server Configuration
```cpp
const char* SERVER_URL = "http://your-server.com/api";
const char* MACHINE_ID = "VM001";
const char* MACHINE_NAME = "Sanitizer Unit 1";
```

#### GPIO Configuration
```cpp
GPIOConfig gpios[] = {
  {25, "Pump 1", false},      // Pin 25, Name, Initial State OFF
  {26, "Pump 2", false},
  {27, "UV Light", false},
  {14, "Dispenser", false},
  {12, "Fan", false},
  {13, "Heater", false}
};
```

### Key Functions

#### Initialize GPIOs
```cpp
void initGPIOs() {
  // Sets all pins to OUTPUT mode
  // Initializes all to HIGH (Relay OFF)
}
```

#### Set GPIO State
```cpp
void setGPIO(int gpioIndex, bool state) {
  // true = ON (LOW signal)
  // false = OFF (HIGH signal)
}
```

#### Pulse GPIO
```cpp
void pulseGPIO(int gpioIndex, unsigned long duration) {
  // Turn ON for duration milliseconds
  // Then automatically turn OFF
}
```

#### Send Heartbeat
```cpp
void sendHeartbeat() {
  // Sends status every 30 seconds
  // Includes GPIO states, uptime, memory
  // Receives commands from server
}
```

#### Execute Sequence
```cpp
void executeSequence(String sequenceId) {
  // Fetch sequence from server
  // Execute each step with timing
  // Can be interrupted by emergency stop
}
```

---

## 🔌 Relay Control Logic

### Important: Inverted Logic
Most relay modules use **active-LOW** logic:
- **HIGH (3.3V) = Relay OFF** (circuit open)
- **LOW (0V) = Relay ON** (circuit closed)

### In Code:
```cpp
// Turn relay ON (activate device)
digitalWrite(pin, LOW);

// Turn relay OFF (deactivate device)
digitalWrite(pin, HIGH);
```

### In Dashboard:
- **"ON" state** = GPIO LOW = Relay closed = Device active
- **"OFF" state** = GPIO HIGH = Relay open = Device inactive

---

## 📡 Communication Flow

### 1. Machine Registration (On Startup)
```
ESP32 → POST /api/esp/register
{
  "machineId": "VM001",
  "machineName": "Sanitizer Unit 1",
  "firmwareVersion": "1.0.0",
  "ipAddress": "192.168.1.100",
  "gpios": [...]
}

Server → Response
{
  "success": true,
  "machine": {...}
}
```

### 2. Heartbeat (Every 30s)
```
ESP32 → POST /api/esp/heartbeat
{
  "machineId": "VM001",
  "status": "IDLE",
  "firmwareVersion": "1.0.0",
  "gpios": [
    {"gpioNumber": 25, "currentState": "OFF"}
  ]
}

Server → Response with Commands
{
  "success": true,
  "pendingRestart": false,
  "emergencyStop": false,
  "gpioCommands": [...],
  "sequenceId": null
}
```

### 3. User Controls GPIO
```
Dashboard → POST /api/control/toggle-gpio/:machineId
Server → Updates database
ESP32 → Fetches state on next heartbeat
ESP32 → Executes GPIO change
ESP32 → Reports new state in next heartbeat
```

### 4. User Executes Sequence
```
Dashboard → POST /api/control/start-sequence/:machineId
Server → Marks sequence for execution
ESP32 → Receives sequenceId in heartbeat
ESP32 → Fetches sequence details
ESP32 → Executes steps one by one
ESP32 → Reports completion
```

---

## 🎯 Usage Guide

### Setting Up a New Machine

1. **Upload Firmware to ESP32**
   - Configure WiFi credentials
   - Set unique MACHINE_ID
   - Upload via Arduino IDE

2. **Power On ESP32**
   - ESP32 connects to WiFi
   - Registers with server
   - Appears in dashboard

3. **Configure GPIOs in Dashboard**
   - Admin adds machine to owner
   - Configure GPIO names and pins
   - Test each GPIO

4. **Create Sequences**
   - Define step-by-step operations
   - Set timing for each step
   - Test sequence execution

### Controlling a Machine

1. **Navigate to Machine**
   - Go to Machines page
   - Click on desired machine
   - Click "Control" button

2. **Monitor Status**
   - Check online/offline status
   - View last heartbeat time
   - See firmware version

3. **Control Individual GPIOs**
   - Click toggle button to switch ON/OFF
   - Use pulse buttons for timed operations
   - Watch real-time status updates

4. **Execute Sequences**
   - Select sequence from dropdown
   - Review steps
   - Click "Execute Sequence"
   - Monitor progress

5. **Emergency Controls**
   - Use "Emergency Stop" if needed
   - Restart ESP32 if unresponsive
   - All GPIOs turn OFF on emergency stop

---

## 🔒 Safety Features

### 1. Process Locking
- Machine locks during sequence execution
- Manual controls disabled while running
- Prevents conflicting commands

### 2. Emergency Stop
- Immediately halts all operations
- Turns OFF all GPIOs
- Can be triggered from dashboard or ESP32

### 3. Automatic Timeouts
- Pulse operations auto-turn OFF
- Prevents stuck relays
- No manual intervention needed

### 4. State Synchronization
- ESP32 reports actual GPIO states
- Dashboard shows real values
- No phantom states

### 5. Connection Monitoring
- Heartbeat every 30 seconds
- Offline detection after 5 minutes
- Auto-reconnect on WiFi loss

---

## 🐛 Troubleshooting

### GPIO Not Responding
1. Check ESP32 is online (WiFi indicator)
2. Verify machine status is not RUNNING
3. Check relay module power supply
4. Test with multimeter
5. Review Serial Monitor output

### Sequence Won't Execute
1. Ensure machine is IDLE
2. Check sequence is properly configured
3. Verify GPIO pins match hardware
4. Look for errors in Serial Monitor

### ESP32 Offline
1. Check WiFi connection
2. Verify power supply
3. Check server URL is correct
4. Review firewall settings
5. Try manual restart

### Relay Stays On
1. Use emergency stop
2. Check for hardware malfunction
3. Verify inverted logic (HIGH=OFF)
4. Inspect wiring connections

---

## 📊 Monitoring & Analytics

### Dashboard Metrics
- Total machines online/offline
- GPIO usage statistics
- Sequence execution count
- Error rates
- Uptime percentages

### ESP32 Serial Monitor
- Connection status
- GPIO state changes
- Commands received
- Sequence execution steps
- Error messages

### Server Logs
- API requests
- Heartbeat history
- Command execution
- Error tracking

---

## 🚀 Advanced Features

### Custom Sequences
Create complex sanitizing routines:
```
Step 1: Pump 1 ON (2000ms)
Step 2: UV Light ON (5000ms)
Step 3: Fan ON (3000ms)
Step 4: Dispenser pulse (1000ms)
Step 5: All OFF
```

### Scheduled Operations
- Define time-based triggers
- Automatic sanitizing cycles
- Maintenance reminders

### Multi-Machine Control
- Control multiple units
- Synchronized operations
- Group commands

---

## 📖 API Reference

See `API_DOCUMENTATION.md` for complete API reference.

---

## 🔐 Security Best Practices

1. **Change Default Credentials**
2. **Use HTTPS in Production**
3. **Implement Authentication Tokens**
4. **Restrict API Access**
5. **Regular Firmware Updates**
6. **Monitor Access Logs**
7. **Use Firewall Rules**

---

## 📞 Support

For technical support:
- Check Serial Monitor for errors
- Review server logs
- Test with multimeter
- Contact system administrator

---

**System Version:** 1.0.0
**Last Updated:** 2026-01-09
