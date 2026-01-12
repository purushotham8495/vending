# ESP32 Vending Machine Firmware

## Overview
This firmware enables ESP32 to connect to the cloud-based vending machine control system and control relay-based sanitizing equipment via GPIO pins.

## Features
✅ WiFi connectivity with auto-reconnect
✅ Heartbeat to server every 30 seconds
✅ GPIO control (HIGH = Relay OFF, LOW = Relay ON)
✅ Sequence execution with step-by-step control
✅ Emergency stop functionality
✅ Remote restart capability
✅ Real-time status updates
✅ Automatic registration with server

## Hardware Requirements
- ESP32 Development Board
- Relay modules (connected to GPIO pins)
- Power supply
- Sanitizing equipment (pumps, UV lights, etc.)

## Pin Configuration
Default GPIO configuration (modify as needed):

| GPIO Pin | Device Name | Default State |
|----------|-------------|---------------|
| 25 | Pump 1 | OFF (HIGH) |
| 26 | Pump 2 | OFF (HIGH) |
| 27 | UV Light | OFF (HIGH) |
| 14 | Dispenser | OFF (HIGH) |
| 12 | Fan | OFF (HIGH) |
| 13 | Heater | OFF (HIGH) |

**Important**: For relay modules, HIGH = OFF and LOW = ON

## Installation Steps

### 1. Install Arduino IDE
Download and install Arduino IDE from [arduino.cc](https://www.arduino.cc/en/software)

### 2. Add ESP32 Board Support
1. Open Arduino IDE
2. Go to **File → Preferences**
3. Add this URL to "Additional Board Manager URLs":
   ```
   https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
   ```
4. Go to **Tools → Board → Board Manager**
5. Search for "ESP32" and install "esp32 by Espressif Systems"

### 3. Install Required Libraries
Go to **Sketch → Include Library → Manage Libraries** and install:
- **ArduinoJson** (by Benoit Blanchon) - Latest version
- **HTTPClient** (included with ESP32)
- **WiFi** (included with ESP32)
- **Preferences** (included with ESP32)

### 4. Configure the Firmware
Open `VendingMachine.ino` and update these settings:

```cpp
// WiFi Credentials
const char* WIFI_SSID = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

// Server Configuration
const char* SERVER_URL = "http://your-server.com/api";
const char* MACHINE_ID = "VM001";
const char* MACHINE_NAME = "Sanitizer Unit 1";
```

### 5. Customize GPIO Pins (if needed)
Modify the `gpios[]` array to match your hardware:

```cpp
GPIOConfig gpios[] = {
  {25, "Pump 1", false},
  {26, "Pump 2", false},
  {27, "UV Light", false},
  // Add more pins as needed
};
```

### 6. Upload to ESP32
1. Connect ESP32 to computer via USB
2. Select **Tools → Board → ESP32 Dev Module**
3. Select the correct **Port**
4. Click **Upload** button (→)
5. Wait for upload to complete

### 7. Monitor Serial Output
1. Click **Tools → Serial Monitor**
2. Set baud rate to **115200**
3. You should see connection and registration messages

## Serial Monitor Output

### Successful Connection:
```
====================================
ESP32 Vending Machine Controller
====================================
Machine ID: VM001
Machine Name: Sanitizer Unit 1
Firmware: v1.0.0
====================================

Initializing GPIO pins...
  GPIO 25 (Pump 1) -> OFF
  GPIO 26 (Pump 2) -> OFF
  ...
✓ All GPIOs initialized (Relays OFF)

Connecting to WiFi: YourWiFi
........
✓ WiFi connected!
IP Address: 192.168.1.100

Registering machine with server...
✓ Machine registered successfully

✓ Setup complete. Starting main loop...
```

## API Communication

### Heartbeat (Every 30 seconds)
ESP32 sends status to server:
```json
{
  "machineId": "VM001",
  "status": "IDLE",
  "firmwareVersion": "1.0.0",
  "ipAddress": "192.168.1.100",
  "uptime": 123456,
  "freeHeap": 200000,
  "gpios": [
    {
      "gpioNumber": 25,
      "gpioName": "Pump 1",
      "currentState": "OFF"
    }
  ]
}
```

### Server Commands
Server responds with commands:
```json
{
  "pendingRestart": false,
  "emergencyStop": false,
  "gpioCommands": [
    {
      "gpioNumber": 25,
      "action": "ON"
    }
  ],
  "sequenceId": "seq123"
}
```

## GPIO Control

### Toggle GPIO
```cpp
toggleGPIO(gpioIndex);
```

### Set GPIO State
```cpp
setGPIO(gpioIndex, true);   // Turn ON (LOW)
setGPIO(gpioIndex, false);  // Turn OFF (HIGH)
```

### Pulse GPIO
```cpp
pulseGPIO(gpioIndex, 3000); // ON for 3 seconds, then OFF
```

### Emergency Stop
```cpp
emergencyStop(); // Turns OFF all GPIOs immediately
```

## Relay Wiring

### Important Notes:
- **HIGH signal = Relay OFF** (NC opens, NO closes)
- **LOW signal = Relay ON** (NC closes, NO opens)
- Most relay modules use active-LOW logic

### Typical Relay Module Wiring:
```
ESP32 GPIO → Relay Module Input
ESP32 GND → Relay Module GND
ESP32 VIN (5V) → Relay Module VCC

Relay Module COM → Device Power +
Relay Module NO → Device Input
Device Ground → Power Ground
```

## Troubleshooting

### WiFi Connection Issues
- Check SSID and password
- Ensure 2.4GHz WiFi (ESP32 doesn't support 5GHz)
- Move closer to router

### Registration Failed
- Verify server URL is correct
- Check server is running
- Ensure backend API is accessible

### GPIO Not Working
- Check pin numbers match hardware
- Verify relay module power
- Test with multimeter
- Remember: HIGH = OFF, LOW = ON

### ESP32 Keeps Restarting
- Check power supply (needs stable 5V)
- Reduce WiFi power: Add `WiFi.setTxPower(WIFI_POWER_11dBm);`
- Check for short circuits

## Advanced Features

### Custom Sequences
Sequences are defined on the server and executed step-by-step:
1. Server sends sequence ID
2. ESP32 fetches sequence details
3. Executes each step with timing
4. Reports completion

### Remote Restart
Server can trigger ESP32 restart via `pendingRestart` flag in heartbeat response.

### Emergency Stop
Can be triggered from:
- Web dashboard
- Mobile app
- Server command
- Physical button (add to code)

## Monitoring

### Check Machine Status
From Serial Monitor, ESP32 prints:
- Connection status
- GPIO states
- Commands received
- Sequence execution
- Errors and warnings

### Real-time Dashboard
Use the web dashboard to:
- View live GPIO states
- Control individual GPIOs
- Execute sequences
- Monitor heartbeat
- Trigger restart

## Security Notes

⚠️ **Important Security Considerations:**
- Change default credentials
- Use HTTPS for production (update WiFiClientSecure)
- Implement authentication tokens
- Restrict network access
- Use firewall rules
- Keep firmware updated

## Firmware Updates

### OTA (Over-The-Air) Updates
Future versions will support OTA updates. For now, upload via USB.

### Version Control
Update `FIRMWARE_VERSION` when making changes:
```cpp
const char* FIRMWARE_VERSION = "1.0.1";
```

## Support

For issues or questions:
1. Check Serial Monitor for error messages
2. Verify server connectivity
3. Test GPIO with multimeter
4. Review wiring connections
5. Contact system administrator

## License
This firmware is part of the Vending Control System.

---

**Last Updated:** 2026-01-09
**Firmware Version:** 1.0.0
