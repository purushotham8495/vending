# Local Testing Tools for ESP32

This folder contains tools for testing ESP32 GPIO functionality locally without deploying the full application.

## 📁 Files

- **mock_server.js** - Local web server for testing ESP32 connectivity
- **test_esp32.py** - Python script for automated GPIO testing
- **package.json** - Node.js dependencies for mock server

## 🚀 Quick Start

### Option 1: Serial Monitor Testing (Easiest)
No installation needed! Just use Arduino IDE:

1. Upload `ESP32_Firmware/VendingMachine_StandaloneTest.ino` to ESP32
2. Open Serial Monitor (115200 baud)
3. Type commands like `test`, `t0`, `p1:2000`

See **LOCAL_TESTING_GUIDE.md** for full details.

### Option 2: Mock Server Testing

```bash
# Install dependencies
npm install

# Start mock server
npm start

# Or directly
node mock_server.js
```

Configure ESP32:
```cpp
const char* SERVER_URL = "http://YOUR_PC_IP:5000/api";
```

Open browser: http://localhost:5000

### Option 3: Python Automated Testing

```bash
# Install requirements
pip install pyserial

# Run tests
python test_esp32.py --port COM3
```

## 📖 Complete Documentation

See **LOCAL_TESTING_GUIDE.md** for:
- Detailed setup instructions
- Command reference
- Troubleshooting tips
- Testing scenarios
- Best practices

## 🎯 When to Use Each Method

| Method | Use Case |
|--------|----------|
| **Serial Monitor** | Quick manual testing, debugging |
| **Mock Server** | UI testing, multiple machines, demos |
| **Python Script** | Automated tests, QA, batch testing |

## 💡 Tips

- Start with Serial Monitor for initial testing
- Use Mock Server to test WiFi connectivity
- Use Python for automated regression testing
- Always test without load first!

## 🔗 Related Documentation

- **LOCAL_TESTING_GUIDE.md** - Complete testing guide
- **ESP32_Firmware/README.md** - Firmware installation
- **ESP32_CONTROL_DOCUMENTATION.md** - System architecture

Happy Testing! 🧪
