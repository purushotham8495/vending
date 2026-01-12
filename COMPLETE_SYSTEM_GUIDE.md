# Complete Vending Machine Control System - User Guide

## 🎯 System Overview

This is a comprehensive cloud-based vending machine control system with:
- **Owner Management** - Admins manage owners with name, phone, email
- **Machine Control** - Real-time ESP32 GPIO control via web dashboard
- **Sequence Execution** - Automated sanitizing routines
- **Remote Management** - Control machines from anywhere
- **Revenue Tracking** - Monitor earnings and transactions

---

## 📋 Table of Contents

1. [User Roles](#user-roles)
2. [Getting Started](#getting-started)
3. [Owner Management](#owner-management)
4. [Machine Control](#machine-control)
5. [ESP32 Setup](#esp32-setup)
6. [Common Tasks](#common-tasks)
7. [Troubleshooting](#troubleshooting)

---

## 👥 User Roles

### Admin
**Can do everything:**
- Create/edit/delete owners
- Add/remove machines
- Control all machines
- View all revenue
- Manage sequences
- System configuration

### Owner
**Can manage own machines:**
- View own machines
- Control own machines
- View own revenue
- Execute sequences
- Monitor machine status

---

## 🚀 Getting Started

### For Admins

#### 1. First Login
- Use admin phone number (default: 9999999999)
- Request OTP
- Enter OTP to login

#### 2. Create First Owner
1. Go to **Owners** page
2. Click **Add Owner**
3. Fill in:
   - Name: "John Doe"
   - Phone: "8888888888"
   - Email: "john@example.com"
4. Click **Create**

#### 3. Add Machine to Owner
1. Click on owner card
2. Click **Add Machine**
3. Fill in:
   - Machine ID: "VM001"
   - Location: "Building A, Floor 2"
   - Fixed Price: 20
4. Click **Add Machine**

#### 4. Upload ESP32 Firmware
1. Open Arduino IDE
2. Load `ESP32_Firmware/VendingMachine.ino`
3. Configure WiFi and server
4. Upload to ESP32

### For Owners

#### 1. Login
- Use phone number provided by admin
- Request OTP
- Enter OTP to login

#### 2. View Your Machines
- Go to **My Machines** page
- See all your machines
- Check online/offline status

#### 3. Control a Machine
- Click on machine card
- Click **Advanced Control**
- Control individual GPIOs
- Execute sequences

---

## 🏢 Owner Management

### View All Owners (Admin Only)

**Card View:**
- Beautiful cards showing:
  - Owner name, phone, email
  - Total machines
  - Active machines count
  - Total revenue
  - Today's revenue
  - Online percentage

**Table View:**
- Detailed list view
- Edit/delete options
- Quick actions

### Owner Detail Page

**Access:** Click any owner card

**Shows:**
- Contact information
- Machine statistics
- All machines grid
- Recent transactions

**Actions:**
- Add new machine
- Delete machine
- View machine details
- Remote control

---

## 🎮 Machine Control

### Access Control Dashboard

**Method 1:** From Machine List
1. Go to Machines page
2. Click on machine
3. Click **Advanced Control** button

**Method 2:** Direct URL
Navigate to: `/machine/:machineId/control`

### Control Dashboard Features

#### 1. Machine Status Panel
- **Status**: IDLE, RUNNING, or OFFLINE
- **Connection**: WiFi indicator (green/gray)
- **Last Heartbeat**: Timestamp
- **Firmware Version**: Current version
- **GPIO Count**: Number of pins

#### 2. GPIO Control Panel

Each GPIO shows:
- **Pin Name**: e.g., "Pump 1"
- **Pin Number**: GPIO pin (e.g., 25)
- **State**: ACTIVE (LOW) or INACTIVE (HIGH)
- **Status Dot**: Green (ON) or Gray (OFF)

**Controls:**
- **Toggle Button**: Switch ON/OFF
- **Pulse 1s**: ON for 1 second
- **Pulse 3s**: ON for 3 seconds
- **Pulse 5s**: ON for 5 seconds

#### 3. Sequence Execution

**Steps:**
1. Select sequence from dropdown
2. Review steps and duration
3. Click **Execute Sequence**
4. Monitor progress bar
5. Use **Emergency Stop** if needed

#### 4. Emergency Controls

**Restart ESP32:**
- Remotely restart controller
- ESP32 reboots in seconds
- Automatically reconnects

**Emergency Stop:**
- Immediately stops all operations
- Turns OFF all GPIOs
- Clears running sequence

---

## 🔧 ESP32 Setup

### Hardware Requirements
- ESP32 Development Board
- Relay modules (for controlling devices)
- Power supply (5V, 2A minimum)
- USB cable for programming
- Sanitizing equipment

### Software Requirements
- Arduino IDE 1.8.19 or newer
- ESP32 board support
- ArduinoJson library

### Installation Steps

#### 1. Install Arduino IDE
Download from: https://www.arduino.cc/en/software

#### 2. Add ESP32 Support
1. Open Arduino IDE
2. Go to **File → Preferences**
3. Add URL to "Additional Board Manager URLs":
   ```
   https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
   ```
4. Go to **Tools → Board → Boards Manager**
5. Search "ESP32"
6. Install "esp32 by Espressif Systems"

#### 3. Install Libraries
Go to **Sketch → Include Library → Manage Libraries**
Install:
- **ArduinoJson** (by Benoit Blanchon)

#### 4. Configure Firmware
Open `ESP32_Firmware/VendingMachine.ino`

**Update WiFi:**
```cpp
const char* WIFI_SSID = "YourWiFiName";
const char* WIFI_PASSWORD = "YourWiFiPassword";
```

**Update Server:**
```cpp
const char* SERVER_URL = "http://192.168.1.100:5000/api";
const char* MACHINE_ID = "VM001";
const char* MACHINE_NAME = "Sanitizer Unit 1";
```

**Configure GPIOs:**
```cpp
GPIOConfig gpios[] = {
  {25, "Pump 1", false},
  {26, "Pump 2", false},
  {27, "UV Light", false},
  {14, "Dispenser", false},
  {12, "Fan", false},
  {13, "Heater", false}
};
```

#### 5. Upload Firmware
1. Connect ESP32 via USB
2. Select **Tools → Board → ESP32 Dev Module**
3. Select correct **Port**
4. Click **Upload** (→)
5. Wait for "Done uploading"

#### 6. Test Connection
1. Open **Serial Monitor** (Ctrl+Shift+M)
2. Set baud rate to **115200**
3. Press ESP32 reset button
4. Should see:
   ```
   Connecting to WiFi...
   WiFi connected!
   IP Address: 192.168.1.xxx
   Registering machine...
   Machine registered successfully
   ```

### GPIO Wiring

**Important:** Most relays use inverted logic
- **HIGH (3.3V) = Relay OFF**
- **LOW (0V) = Relay ON**

**Typical Relay Wiring:**
```
ESP32 GPIO Pin → Relay IN
ESP32 GND → Relay GND
ESP32 VIN (5V) → Relay VCC

Relay COM → Device Power +
Relay NO (Normally Open) → Device
Device Ground → Power Ground
```

**Example for Pump:**
```
GPIO 25 → Relay 1 IN
Relay 1 COM → 12V Power
Relay 1 NO → Pump +
Pump - → Power Ground
```

---

## 📚 Common Tasks

### Task 1: Add a New Owner
```
Admin → Owners → Add Owner
→ Enter: Name, Phone, Email
→ Click Create
→ Owner can now login
```

### Task 2: Add Machine to Owner
```
Admin → Owners → Click Owner Card
→ Click "Add Machine"
→ Enter: Machine ID, Location, Price
→ Click Add
→ Machine appears in grid
```

### Task 3: Control GPIO Remotely
```
Any User → Machines → Click Machine
→ Click "Advanced Control"
→ Find GPIO in control panel
→ Click Toggle or Pulse button
→ Watch real-time status update
```

### Task 4: Execute Sanitizing Sequence
```
Any User → Machine Control Page
→ Select Sequence from dropdown
→ Review steps
→ Click "Execute Sequence"
→ Monitor progress
→ Sequence completes automatically
```

### Task 5: Emergency Stop
```
Any User → Machine Control Page
→ Click "Emergency Stop"
→ Confirm action
→ All GPIOs turn OFF immediately
→ Machine returns to IDLE
```

### Task 6: View Owner Revenue
```
Admin → Owners → Click Owner Card
→ See "Today's Revenue" card
→ See "Total Revenue" card
→ See "Recent Transactions" table
```

### Task 7: Restart ESP32
```
Admin/Owner → Machine Control Page
→ Ensure machine is IDLE
→ Click "Restart ESP32"
→ Confirm action
→ ESP32 reboots in 5 seconds
```

---

## ❓ Troubleshooting

### Machine Shows Offline

**Check:**
1. ESP32 has power
2. WiFi credentials correct
3. Server URL correct
4. WiFi network accessible
5. Serial Monitor for errors

**Fix:**
- Restart ESP32
- Check WiFi signal strength
- Verify server is running
- Re-upload firmware with correct settings

### GPIO Not Responding

**Check:**
1. Machine is IDLE (not RUNNING)
2. Machine is online (green WiFi)
3. Relay module has power
4. Wiring is correct
5. Remember: HIGH=OFF, LOW=ON

**Fix:**
- Test relay with multimeter
- Check GPIO pin number matches
- Verify relay module voltage
- Try different GPIO pin

### Sequence Won't Start

**Check:**
1. Machine is online
2. Machine is IDLE
3. Sequence has valid steps
4. GPIOs are configured

**Fix:**
- Use Emergency Stop first
- Wait for machine to return to IDLE
- Verify sequence in admin panel
- Check Serial Monitor for errors

### Can't Login

**Check:**
1. Phone number correct (10 digits)
2. Account created by admin
3. Account status is "active"
4. OTP received

**Fix:**
- Contact admin to create account
- Check spam folder for OTP
- Try resending OTP
- Check server is running

### ESP32 Keeps Restarting

**Check:**
1. Power supply stable (5V, 2A)
2. No short circuits
3. Relay modules not overloading
4. Serial Monitor for error messages

**Fix:**
- Use better power supply
- Add capacitors if needed
- Reduce WiFi power in code
- Check for faulty relay modules

---

## 🔐 Security Best Practices

1. **Change Default Credentials**
   - Update default admin phone
   - Use strong passwords

2. **Use HTTPS**
   - In production, use SSL/TLS
   - Update ESP32 to use WiFiClientSecure

3. **Limit Access**
   - Use firewall rules
   - Restrict API access
   - Monitor logs regularly

4. **Update Firmware**
   - Keep ESP32 firmware updated
   - Update backend regularly
   - Apply security patches

5. **Backup Data**
   - Regular database backups
   - Export important data
   - Test restore procedures

---

## 📞 Support

### Documentation Files
- **USER_MANAGEMENT_UPDATE.md** - User system details
- **OWNER_MANAGEMENT_FEATURES.md** - Owner features
- **ESP32_CONTROL_DOCUMENTATION.md** - ESP32 technical docs
- **ESP32_Firmware/README.md** - Firmware setup guide
- **API_DOCUMENTATION.md** - API reference

### Getting Help
1. Check relevant documentation
2. Review Serial Monitor output
3. Check server logs
4. Test with multimeter
5. Contact system administrator

---

## 🎉 Success Indicators

**System is working when:**
- ✅ Admin can create owners
- ✅ Owners can login
- ✅ ESP32 shows "WiFi connected"
- ✅ Machine appears online in dashboard
- ✅ GPIOs toggle from dashboard
- ✅ Sequences execute successfully
- ✅ Real-time updates working
- ✅ Transactions recorded
- ✅ Revenue tracked correctly

---

## 📊 System Architecture

```
┌─────────────────┐
│   Web Browser   │
│   (Dashboard)   │
└────────┬────────┘
         │
         │ HTTPS/HTTP
         │
┌────────▼────────┐
│  Backend API    │
│  (Node.js)      │
└────────┬────────┘
         │
         ├──────────┐
         │          │
┌────────▼───┐  ┌──▼──────────┐
│  MongoDB   │  │   ESP32     │
│ (Database) │  │  (Machine)  │
└────────────┘  └─────┬───────┘
                      │
                      │ GPIO
                      │
                ┌─────▼──────┐
                │   Relays   │
                │  (Devices) │
                └────────────┘
```

---

## 🔄 Update History

- **v1.0.0** (2026-01-09)
  - Initial release
  - Owner management system
  - ESP32 control dashboard
  - Real-time GPIO control
  - Sequence execution
  - Remote management

---

**Last Updated:** 2026-01-09
**System Version:** 1.0.0
**Author:** Vending Control System Team

---

## 🎓 Quick Reference

### URLs
- Dashboard: `http://localhost:3000`
- Machine Control: `http://localhost:3000/machine/:id/control`
- Admin Panel: `http://localhost:3000/admin`

### Default Credentials
- Admin Phone: 9999999999 (change this!)
- OTP: Check server console

### GPIO States
- ON = LOW signal = Relay closed = Device active
- OFF = HIGH signal = Relay open = Device inactive

### Heartbeat Interval
- ESP32 → Server: Every 30 seconds
- Dashboard → Server: Every 2 seconds

### Support Contact
- Technical Issues: Check documentation
- Hardware Issues: Test with multimeter
- Software Issues: Check server logs

---

**END OF GUIDE**
