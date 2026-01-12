# ESP32 Integration Guide

Complete guide for integrating ESP32 devices with the Vending Machine Platform.

## 📋 Overview

ESP32 devices communicate with the backend server via REST API polling. Each device:
- Sends heartbeat every 5 seconds
- Polls GPIO states every 2-5 seconds
- Executes sequences automatically
- Reports errors
- Supports OTA firmware updates

## 🔌 API Endpoints for ESP32

### 1. Heartbeat
**Endpoint**: `POST /api/esp/heartbeat`

**Request**:
```json
{
  "machineId": "MACHINE001",
  "firmwareVersion": "v1.0.0",
  "ipAddress": "192.168.1.100",
  "wifiSSID": "MyWiFi",
  "signalStrength": -45
}
```

**Response**:
```json
{
  "success": true,
  "status": "IDLE",
  "processLocked": false,
  "gpios": [...]
}
```

### 2. Get GPIO States
**Endpoint**: `GET /api/esp/gpio-states/{machineId}`

**Response**:
```json
{
  "success": true,
  "gpios": [
    {
      "pin": 4,
      "name": "Hot Air",
      "state": "ON",
      "relayLogic": "LOW_ON"
    }
  ],
  "processLocked": false,
  "currentStep": 0
}
```

### 3. Check OTA Update
**Endpoint**: `GET /api/ota/check/{machineId}?currentVersion=v1.0.0`

**Response**:
```json
{
  "success": true,
  "updateAvailable": true,
  "version": "v1.1.0",
  "fileSize": 524288,
  "checksum": "abc123...",
  "downloadUrl": "/api/ota/download/{firmwareId}"
}
```

### 4. Report OTA Status
**Endpoint**: `POST /api/ota/status`

**Request**:
```json
{
  "machineId": "MACHINE001",
  "firmwareVersion": "v1.1.0",
  "status": "success"
}
```

### 5. Report Error
**Endpoint**: `POST /api/esp/error`

**Request**:
```json
{
  "machineId": "MACHINE001",
  "errorMessage": "WiFi connection lost",
  "errorCode": "WIFI_001"
}
```

## 💻 ESP32 Arduino Code Example

### Basic Structure

```cpp
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// Configuration
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";
const char* serverUrl = "http://your-server.com/api";
const char* machineId = "MACHINE001";
const char* firmwareVersion = "v1.0.0";

// Timing
unsigned long lastHeartbeat = 0;
unsigned long lastPoll = 0;
const unsigned long HEARTBEAT_INTERVAL = 5000;  // 5 seconds
const unsigned long POLL_INTERVAL = 2000;       // 2 seconds

// GPIO Configuration (synced from server)
struct GPIO {
  int pin;
  String name;
  String state;
  String relayLogic;
};

GPIO gpios[10];
int gpioCount = 0;
bool processLocked = false;

void setup() {
  Serial.begin(115200);
  
  // Connect to WiFi
  connectWiFi();
  
  // Initial setup
  sendHeartbeat();
  pollGPIOStates();
}

void loop() {
  // Check WiFi connection
  if (WiFi.status() != WL_CONNECTED) {
    connectWiFi();
  }
  
  // Send heartbeat
  if (millis() - lastHeartbeat > HEARTBEAT_INTERVAL) {
    sendHeartbeat();
    lastHeartbeat = millis();
  }
  
  // Poll GPIO states
  if (millis() - lastPoll > POLL_INTERVAL) {
    pollGPIOStates();
    lastPoll = millis();
  }
  
  delay(100);
}

void connectWiFi() {
  Serial.println("Connecting to WiFi...");
  WiFi.begin(ssid, password);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nConnected!");
    Serial.print("IP: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\nFailed to connect!");
  }
}

void sendHeartbeat() {
  if (WiFi.status() != WL_CONNECTED) return;
  
  HTTPClient http;
  String url = String(serverUrl) + "/esp/heartbeat";
  
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  
  DynamicJsonDocument doc(1024);
  doc["machineId"] = machineId;
  doc["firmwareVersion"] = firmwareVersion;
  doc["ipAddress"] = WiFi.localIP().toString();
  doc["wifiSSID"] = WiFi.SSID();
  doc["signalStrength"] = WiFi.RSSI();
  
  String requestBody;
  serializeJson(doc, requestBody);
  
  int httpCode = http.POST(requestBody);
  
  if (httpCode == 200) {
    String response = http.getString();
    Serial.println("Heartbeat sent successfully");
  } else {
    Serial.printf("Heartbeat failed: %d\n", httpCode);
  }
  
  http.end();
}

void pollGPIOStates() {
  if (WiFi.status() != WL_CONNECTED) return;
  
  HTTPClient http;
  String url = String(serverUrl) + "/esp/gpio-states/" + machineId;
  
  http.begin(url);
  int httpCode = http.GET();
  
  if (httpCode == 200) {
    String payload = http.getString();
    
    DynamicJsonDocument doc(2048);
    deserializeJson(doc, payload);
    
    JsonArray gpioArray = doc["gpios"];
    gpioCount = gpioArray.size();
    
    for (int i = 0; i < gpioCount; i++) {
      gpios[i].pin = gpioArray[i]["pin"];
      gpios[i].name = gpioArray[i]["name"].as<String>();
      gpios[i].state = gpioArray[i]["state"].as<String>();
      gpios[i].relayLogic = gpioArray[i]["relayLogic"].as<String>();
      
      // Apply GPIO state
      applyGPIOState(gpios[i]);
    }
    
    processLocked = doc["processLocked"];
  }
  
  http.end();
}

void applyGPIOState(GPIO gpio) {
  pinMode(gpio.pin, OUTPUT);
  
  bool outputValue;
  if (gpio.relayLogic == "LOW_ON") {
    outputValue = (gpio.state == "ON") ? LOW : HIGH;
  } else {
    outputValue = (gpio.state == "ON") ? HIGH : LOW;
  }
  
  digitalWrite(gpio.pin, outputValue);
  
  Serial.printf("GPIO %d (%s): %s\n", 
    gpio.pin, 
    gpio.name.c_str(), 
    gpio.state.c_str()
  );
}

void reportError(String errorMessage, String errorCode) {
  if (WiFi.status() != WL_CONNECTED) return;
  
  HTTPClient http;
  String url = String(serverUrl) + "/esp/error";
  
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  
  DynamicJsonDocument doc(512);
  doc["machineId"] = machineId;
  doc["errorMessage"] = errorMessage;
  doc["errorCode"] = errorCode;
  
  String requestBody;
  serializeJson(doc, requestBody);
  
  http.POST(requestBody);
  http.end();
}
```

## 🔄 OTA Update Implementation

```cpp
#include <Update.h>

void checkOTAUpdate() {
  if (WiFi.status() != WL_CONNECTED) return;
  
  HTTPClient http;
  String url = String(serverUrl) + "/ota/check/" + machineId + 
               "?currentVersion=" + firmwareVersion;
  
  http.begin(url);
  int httpCode = http.GET();
  
  if (httpCode == 200) {
    String payload = http.getString();
    
    DynamicJsonDocument doc(1024);
    deserializeJson(doc, payload);
    
    bool updateAvailable = doc["updateAvailable"];
    
    if (updateAvailable) {
      String downloadUrl = doc["downloadUrl"].as<String>();
      String newVersion = doc["version"].as<String>();
      
      Serial.println("Update available: " + newVersion);
      performOTAUpdate(downloadUrl, newVersion);
    }
  }
  
  http.end();
}

void performOTAUpdate(String downloadUrl, String newVersion) {
  HTTPClient http;
  String fullUrl = String(serverUrl) + downloadUrl + "?machineId=" + machineId;
  
  http.begin(fullUrl);
  int httpCode = http.GET();
  
  if (httpCode == 200) {
    int contentLength = http.getSize();
    
    if (contentLength > 0) {
      bool canBegin = Update.begin(contentLength);
      
      if (canBegin) {
        WiFiClient * stream = http.getStreamPtr();
        
        size_t written = Update.writeStream(*stream);
        
        if (written == contentLength) {
          Serial.println("Written successfully");
        }
        
        if (Update.end()) {
          if (Update.isFinished()) {
            Serial.println("Update complete. Rebooting...");
            reportOTAStatus(newVersion, "success");
            delay(1000);
            ESP.restart();
          }
        } else {
          Serial.println("Update failed");
          reportOTAStatus(newVersion, "failed");
        }
      }
    }
  }
  
  http.end();
}

void reportOTAStatus(String version, String status) {
  HTTPClient http;
  String url = String(serverUrl) + "/ota/status";
  
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  
  DynamicJsonDocument doc(512);
  doc["machineId"] = machineId;
  doc["firmwareVersion"] = version;
  doc["status"] = status;
  
  String requestBody;
  serializeJson(doc, requestBody);
  
  http.POST(requestBody);
  http.end();
}
```

## 📝 Configuration Tips

### 1. GPIO Pin Selection
Valid ESP32 GPIO pins: 0, 2, 4, 5, 12, 13, 14, 15, 16, 17, 18, 19, 21, 22, 23, 25, 26, 27, 32, 33

**Avoid**: 6-11 (used for flash), 34-39 (input only)

### 2. Relay Logic
- `LOW_ON`: Relay activates on LOW signal (most common)
- `HIGH_ON`: Relay activates on HIGH signal

### 3. Timing Considerations
- Heartbeat: 5 seconds (detect offline within 10s)
- GPIO poll: 2-5 seconds (balance responsiveness vs load)
- OTA check: 60 seconds (optional, for automatic updates)

## 🐛 Debugging

Enable serial debugging:
```cpp
#define DEBUG_MODE true

void debugLog(String message) {
  if (DEBUG_MODE) {
    Serial.println("[" + String(millis()) + "] " + message);
  }
}
```

## 📦 Required Libraries

```cpp
// Install via Arduino Library Manager
#include <WiFi.h>           // Built-in
#include <HTTPClient.h>     // Built-in
#include <ArduinoJson.h>    // Version 6.x
#include <Update.h>         // Built-in (for OTA)
```

## ✅ Testing Checklist

- [ ] WiFi connection stable
- [ ] Heartbeat sending every 5s
- [ ] GPIO states syncing correctly
- [ ] Relays responding to commands
- [ ] OTA update working
- [ ] Error reporting functional
- [ ] Power cycle recovery working
- [ ] Sequence execution accurate

## 🚀 Production Recommendations

1. **Implement watchdog timer** for auto-recovery
2. **Add local storage** for offline operation
3. **Implement retry logic** for failed API calls
4. **Add status LED** for visual feedback
5. **Implement emergency stop button** (hardware)
6. **Add voltage monitoring** for power issues
7. **Store WiFi credentials in EEPROM/NVS**
8. **Implement certificate pinning** for HTTPS

This completes the ESP32 integration guide!
