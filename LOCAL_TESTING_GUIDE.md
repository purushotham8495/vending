# ESP32 Local Testing Guide

## Overview
This guide shows you how to test ESP32 GPIO functionality **without hosting the website**. Three methods are provided:

1. **Serial Monitor (Easiest)** - Direct control via Arduino IDE
2. **Mock Server** - Test with local web dashboard
3. **Python Script** - Automated testing

---

## 🎯 Method 1: Serial Monitor (Recommended for Quick Testing)

### What You Need
- ESP32 board
- USB cable
- Arduino IDE

### Setup Steps

#### 1. Upload Standalone Firmware
```cpp
// Open: ESP32_Firmware/VendingMachine_StandaloneTest.ino
// This version has NO WiFi/Server - just GPIO control!
```

#### 2. Upload to ESP32
1. Connect ESP32 via USB
2. Open Arduino IDE
3. Load `VendingMachine_StandaloneTest.ino`
4. Select **Tools → Board → ESP32 Dev Module**
5. Select correct **Port**
6. Click **Upload**

#### 3. Open Serial Monitor
1. Click **Tools → Serial Monitor**
2. Set baud rate to **115200**
3. You'll see:
```
╔═══════════════════════════════════════════════════════════╗
║         ESP32 GPIO TEST - STANDALONE VERSION              ║
║         Control GPIOs via Serial Monitor                  ║
╚═══════════════════════════════════════════════════════════╝

Initializing GPIO pins...
  ✓ GPIO 25 (Pump 1) -> OFF (HIGH)
  ✓ GPIO 26 (Pump 2) -> OFF (HIGH)
  ...

✅ All GPIOs initialized (Relays OFF)
```

### Available Commands

#### Basic Commands
| Command | Description | Example |
|---------|-------------|---------|
| `help` or `h` | Show help menu | `help` |
| `status` or `s` | Show current status | `status` |
| `list` or `l` | List all GPIOs | list` |
| `clear` or `cls` | Clear screen | `clear` |

#### GPIO Control
| Command | Description | Example |
|---------|-------------|---------|
| `t<n>` | Toggle GPIO n | `t0` (toggle GPIO 0) |
| `on<n>` | Turn GPIO n ON | `on2` (turn GPIO 2 ON) |
| `off<n>` | Turn GPIO n OFF | `off3` (turn GPIO 3 OFF) |
| `p<n>:<ms>` | Pulse GPIO n for ms | `p1:3000` (pulse GPIO 1 for 3s) |

#### Batch Operations
| Command | Description |
|---------|-------------|
| `allon` or `on` | Turn all GPIOs ON |
| `alloff` or `off` | Turn all GPIOs OFF |
| `test` | Test all GPIOs (1s each) |
| `sequence` or `seq` | Run predefined sequence |

### Example Testing Session

```
> list
╔═══════════════════════════════════════════════════════════╗
║                    CONFIGURED GPIOs                       ║
╠═════╦══════════════╦════════════╦═══════════════════════╣
║ ID  ║ Pin Number   ║ Name       ║ Current State         ║
╠═════╬══════════════╬════════════╬═══════════════════════╣
║ 0   ║ GPIO 25      ║ Pump 1     ║ OFF (HIGH) ⚫          ║
║ 1   ║ GPIO 26      ║ Pump 2     ║ OFF (HIGH) ⚫          ║
...

> t0
⚡ GPIO 25 (Pump 1) -> ON (LOW)

> status
  GPIO States:
    [0] Pin 25 (Pump 1): ON (LOW) 🟢
    [1] Pin 26 (Pump 2): OFF (HIGH) ⚫

> p1:2000
⏱️  Pulsing GPIO 26 (Pump 2) for 2000ms
⚡ GPIO 26 (Pump 2) -> ON (LOW)
⚡ GPIO 26 (Pump 2) -> OFF (HIGH)
✅ Pulse complete

> test
🧪 Testing All GPIOs (1 second each)...
...
✅ Test Complete!

> sequence
▶️  Starting Test Sequence...
📍 Step 1/6: Pump 1 (GPIO 25) for 2000ms
📍 Step 2/6: Pump 2 (GPIO 26) for 2000ms
...
✅ Sequence Complete!
```

---

## 🌐 Method 2: Mock Server (For Web Dashboard Testing)

### What You Need
- ESP32 board
- Node.js installed
- Local network

### Setup Steps

#### 1. Install Dependencies
```bash
cd test_local
npm install express body-parser
```

#### 2. Start Mock Server
```bash
node mock_server.js
```

You'll see:
```
╔════════════════════════════════════════════════════════╗
║          🤖 ESP32 MOCK SERVER RUNNING 🤖               ║
╚════════════════════════════════════════════════════════╝

  📡 Server URL: http://localhost:5000
  🌐 Web Dashboard: http://localhost:5000
  📋 API Endpoint: http://localhost:5000/api

  Configure your ESP32 with:
  const char* SERVER_URL = "http://YOUR_PC_IP:5000/api";
```

#### 3. Find Your PC's IP Address

**Windows:**
```bash
ipconfig
# Look for IPv4 Address (e.g., 192.168.1.100)
```

**Mac/Linux:**
```bash
ifconfig
# or
ip addr show
# Look for inet address (e.g., 192.168.1.100)
```

#### 4. Configure ESP32
Open `VendingMachine.ino` and update:
```cpp
// WiFi Credentials
const char* WIFI_SSID = "YourWiFiName";
const char* WIFI_PASSWORD = "YourWiFiPassword";

// Server Configuration (use your PC's IP)
const char* SERVER_URL = "http://192.168.1.100:5000/api";
const char* MACHINE_ID = "VM001";
const char* MACHINE_NAME = "Test Unit";
```

#### 5. Upload and Connect
1. Upload firmware to ESP32
2. ESP32 connects to WiFi
3. ESP32 registers with mock server
4. Open browser: `http://localhost:5000`

### Mock Server Features

#### Web Dashboard
- View all connected machines
- See real-time GPIO states
- Control GPIOs with buttons
- Toggle, pulse, all on/off
- Auto-refreshes every 5 seconds

#### CLI Commands
Type in server terminal:
```bash
mock> machines     # List connected machines
mock> help         # Show help
mock> clear        # Clear screen
mock> exit         # Stop server
```

#### Testing GPIOs
1. Open `http://localhost:5000` in browser
2. See your ESP32 machine
3. Click GPIO buttons to control
4. Watch real-time updates

---

## 🐍 Method 3: Python Automated Testing

### What You Need
- Python 3.6+
- PySerial library
- ESP32 with standalone firmware

### Setup Steps

#### 1. Install PySerial
```bash
pip install pyserial
```

#### 2. Find Serial Port

**Windows:**
- Open Device Manager
- Look for COM port (e.g., COM3, COM5)

**Mac:**
```bash
ls /dev/cu.*
# Look for: /dev/cu.usbserial-XXXX
```

**Linux:**
```bash
ls /dev/ttyUSB*
# Look for: /dev/ttyUSB0
```

#### 3. Run Test Script

**Interactive Mode (Default):**
```bash
python test_esp32.py --port COM3
# or
python test_esp32.py --port /dev/ttyUSB0
```

**Quick Test:**
```bash
python test_esp32.py --port COM3 --test quick
```

**Full Test Suite:**
```bash
python test_esp32.py --port COM3 --test full
```

### Test Modes

#### Interactive Mode
```bash
🎮 INTERACTIVE MODE
Type commands to send to ESP32
Type 'exit' or 'quit' to exit

esp32> list
esp32> t0
esp32> pulse 1:2000
esp32> test
esp32> exit
```

#### Quick Test
- Lists GPIOs
- Shows status
- Tests all GPIOs once

#### Full Test Suite
- List GPIOs
- Get status
- Test all GPIOs
- Test toggle
- Test pulse
- Test all ON/OFF
- Test sequence
- Generate report

### Test Report Example
```
╔════════════════════════════════════════════════════════╗
║                    TEST SUMMARY                        ║
╚════════════════════════════════════════════════════════╝

Total Tests: 7
Passed: 7 ✅
Failed: 0 ❌
Success Rate: 100.0%

Individual Results:
✅ List GPIOs                    1.23s
✅ Get Status                    0.89s
✅ Test All GPIOs                8.45s
✅ Test Toggle                   2.34s
✅ Test Pulse                    3.12s
✅ Test All ON/OFF               4.56s
✅ Test Sequence                12.78s
```

---

## 🔧 Hardware Testing Checklist

### Before Testing
- [ ] ESP32 powered on
- [ ] USB cable connected (Serial Monitor)
- [ ] OR WiFi connected (Mock Server)
- [ ] Relay modules powered
- [ ] All wiring checked
- [ ] No short circuits

### During Testing
- [ ] Monitor Serial output
- [ ] Watch relay LEDs
- [ ] Listen for relay clicks
- [ ] Check device activation
- [ ] Verify timing accuracy

### Safety
- [ ] Start with single GPIO
- [ ] Test without load first
- [ ] Verify relay polarity (HIGH=OFF, LOW=ON)
- [ ] Emergency stop tested
- [ ] Power supply stable

---

## 🐛 Troubleshooting

### Serial Monitor Issues

**No output in Serial Monitor**
- Check baud rate is 115200
- Press ESP32 reset button
- Verify USB connection
- Try different USB cable

**Garbled text**
- Wrong baud rate (set to 115200)
- USB driver issue (reinstall)

**Commands not working**
- Ensure "No line ending" or "Newline" is selected
- Type command and press Enter
- Check spelling

### Mock Server Issues

**ESP32 won't connect**
- Check WiFi credentials
- Verify PC IP address (use `ipconfig` or `ifconfig`)
- Ensure ESP32 and PC on same network
- Check firewall settings
- Try pinging PC from another device

**Dashboard shows no machines**
- Check server logs in terminal
- Verify ESP32 Serial Monitor for errors
- Confirm registration success
- Refresh browser page

**Commands not executed**
- Wait for next heartbeat (30 seconds)
- Check command queue in server logs
- Verify ESP32 is online

### GPIO Issues

**Relay not clicking**
- Check relay module power
- Verify wiring (GPIO → Relay IN)
- Test with LED first
- Use multimeter to check voltage

**Relay stuck ON**
- Use "alloff" command
- Check for short circuit
- Verify relay module quality
- Test different GPIO pin

**Wrong state (inverted)**
- Remember: HIGH = OFF, LOW = ON
- Check relay module type (active high/low)
- Firmware handles this automatically

---

## 📝 Testing Scenarios

### Scenario 1: First Time Setup
```
1. Upload standalone firmware
2. Open Serial Monitor
3. Type "list" to see GPIOs
4. Type "test" to test all
5. Type "status" to verify
```

### Scenario 2: Single GPIO Test
```
1. Type "on0" to turn on GPIO 0
2. Verify relay clicks
3. Type "off0" to turn off
4. Verify relay clicks back
```

### Scenario 3: Timed Operation
```
1. Type "p0:5000" to pulse GPIO 0 for 5 seconds
2. Watch relay turn ON
3. Wait 5 seconds
4. Watch relay turn OFF automatically
```

### Scenario 4: Full Sequence
```
1. Type "sequence" to run test sequence
2. Watch all GPIOs activate in order
3. Verify timing is correct
4. Confirm all turn OFF at end
```

### Scenario 5: Web Control
```
1. Start mock server
2. Upload normal firmware with server URL
3. Open http://localhost:5000
4. Click toggle buttons
5. Watch real-time updates
```

---

## 🎯 Best Practices

### Testing Order
1. **Single GPIO** - Test one at a time first
2. **Toggle** - Verify ON/OFF works
3. **Pulse** - Test timed operations
4. **All GPIOs** - Test each sequentially
5. **Sequence** - Test automation
6. **Web Control** - Test with mock server
7. **Full Integration** - Test with real backend

### Safety First
- Always test without load first
- Use LED for visual verification
- Start with short pulse durations
- Have emergency stop ready
- Monitor power consumption

### Documentation
- Note which GPIOs work
- Record timing accuracy
- Document any issues
- Keep wiring diagrams
- Log test results

---

## 📊 Comparison Table

| Method | Pros | Cons | Best For |
|--------|------|------|----------|
| **Serial Monitor** | ✅ Simplest<br>✅ No network needed<br>✅ Direct control | ❌ Manual only<br>❌ No automation | Quick testing, debugging |
| **Mock Server** | ✅ Web interface<br>✅ Multiple machines<br>✅ Real-time updates | ❌ Needs WiFi<br>❌ Setup required | UI testing, demo |
| **Python Script** | ✅ Automated<br>✅ Test reports<br>✅ Repeatable | ❌ Python required<br>❌ Serial only | QA, batch testing |

---

## 🚀 Quick Start Guide

### Fastest Way to Test (5 minutes)

1. **Upload Standalone Firmware**
   ```
   Open: VendingMachine_StandaloneTest.ino
   Upload to ESP32
   ```

2. **Open Serial Monitor**
   ```
   Baud rate: 115200
   ```

3. **Test Commands**
   ```
   > list       (see all GPIOs)
   > test       (test all GPIOs)
   > t0         (toggle GPIO 0)
   > p1:2000    (pulse GPIO 1 for 2s)
   ```

4. **Done!** 🎉

---

## 📞 Support

### Common Questions

**Q: Can I test without WiFi?**
A: Yes! Use standalone firmware with Serial Monitor.

**Q: Do I need the full backend?**
A: No! Use mock server for local testing.

**Q: How do I test multiple ESP32s?**
A: Use mock server - it handles multiple machines.

**Q: Can I automate tests?**
A: Yes! Use the Python script for automated testing.

**Q: What about production testing?**
A: Use Python script with custom test cases.

---

## 🎓 Learning Path

1. **Day 1:** Serial Monitor basics
2. **Day 2:** GPIO control commands
3. **Day 3:** Mock server setup
4. **Day 4:** Python automation
5. **Day 5:** Full integration testing

---

**Happy Testing! 🧪**

*Last Updated: 2026-01-09*
