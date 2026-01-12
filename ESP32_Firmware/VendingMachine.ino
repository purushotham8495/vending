/*
 * ESP32 Sanitizing Vending Machine Controller
 * 
 * This firmware connects ESP32 to the cloud backend and controls
 * GPIO pins for relay-based sanitizing equipment.
 * 
 * Features:
 * - WiFi connectivity with auto-reconnect
 * - Heartbeat to server (every 30 seconds)
 * - GPIO control (HIGH = Relay OFF, LOW = Relay ON)
 * - Sequence execution
 * - Emergency stop
 * - Remote restart
 * - Real-time status updates
 * 
 * Author: Vending Control System
 * Date: 2026-01-09
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <Preferences.h>

// ==================== CONFIGURATION ====================

// WiFi Credentials
const char* WIFI_SSID = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

// Server Configuration
const char* SERVER_URL = "http://your-server.com/api";  // Change to your server
const char* MACHINE_ID = "VM001";                        // Change to your machine ID
const char* MACHINE_NAME = "Sanitizer Unit 1";          // Change to your machine name

// Firmware Version
const char* FIRMWARE_VERSION = "1.0.0";

// Heartbeat Interval (milliseconds)
const unsigned long HEARTBEAT_INTERVAL = 30000; // 30 seconds

// GPIO Pin Configuration (adjust as needed)
struct GPIOConfig {
  int pin;
  String name;
  bool currentState; // true = ON (LOW), false = OFF (HIGH)
};

// Define your GPIO pins here
GPIOConfig gpios[] = {
  {25, "Pump 1", false},
  {26, "Pump 2", false},
  {27, "UV Light", false},
  {14, "Dispenser", false},
  {12, "Fan", false},
  {13, "Heater", false}
};

const int NUM_GPIOS = sizeof(gpios) / sizeof(gpios[0]);

// ==================== GLOBAL VARIABLES ====================

Preferences preferences;
String authToken = "";
unsigned long lastHeartbeat = 0;
bool isExecutingSequence = false;
bool emergencyStopTriggered = false;

// ==================== SETUP ====================

void setup() {
  Serial.begin(115200);
  delay(1000);
  
  Serial.println("\n\n====================================");
  Serial.println("ESP32 Vending Machine Controller");
  Serial.println("====================================");
  Serial.println("Machine ID: " + String(MACHINE_ID));
  Serial.println("Machine Name: " + String(MACHINE_NAME));
  Serial.println("Firmware: v" + String(FIRMWARE_VERSION));
  Serial.println("====================================\n");

  // Initialize GPIO pins
  initGPIOs();

  // Connect to WiFi
  connectWiFi();

  // Register machine with server
  registerMachine();

  Serial.println("\n✓ Setup complete. Starting main loop...\n");
}

// ==================== MAIN LOOP ====================

void loop() {
  // Check WiFi connection
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("⚠ WiFi disconnected. Reconnecting...");
    connectWiFi();
  }

  // Send heartbeat
  unsigned long currentTime = millis();
  if (currentTime - lastHeartbeat >= HEARTBEAT_INTERVAL) {
    sendHeartbeat();
    lastHeartbeat = currentTime;
  }

  // Check for commands from server
  checkForCommands();

  delay(1000); // Main loop delay
}

// ==================== GPIO FUNCTIONS ====================

void initGPIOs() {
  Serial.println("Initializing GPIO pins...");
  
  for (int i = 0; i < NUM_GPIOS; i++) {
    pinMode(gpios[i].pin, OUTPUT);
    // Set all pins to HIGH (Relay OFF) initially
    digitalWrite(gpios[i].pin, HIGH);
    gpios[i].currentState = false;
    
    Serial.println("  GPIO " + String(gpios[i].pin) + " (" + gpios[i].name + ") -> OFF");
  }
  
  Serial.println("✓ All GPIOs initialized (Relays OFF)\n");
}

void setGPIO(int gpioIndex, bool state) {
  if (gpioIndex < 0 || gpioIndex >= NUM_GPIOS) {
    Serial.println("✗ Invalid GPIO index: " + String(gpioIndex));
    return;
  }

  // For relay: true (ON) = LOW, false (OFF) = HIGH
  digitalWrite(gpios[gpioIndex].pin, state ? LOW : HIGH);
  gpios[gpioIndex].currentState = state;
  
  Serial.println("GPIO " + String(gpios[gpioIndex].pin) + " (" + gpios[gpioIndex].name + 
                 ") -> " + (state ? "ON (LOW)" : "OFF (HIGH)"));
}

void toggleGPIO(int gpioIndex) {
  if (gpioIndex < 0 || gpioIndex >= NUM_GPIOS) {
    Serial.println("✗ Invalid GPIO index: " + String(gpioIndex));
    return;
  }

  bool newState = !gpios[gpioIndex].currentState;
  setGPIO(gpioIndex, newState);
}

void pulseGPIO(int gpioIndex, unsigned long duration) {
  if (gpioIndex < 0 || gpioIndex >= NUM_GPIOS) {
    Serial.println("✗ Invalid GPIO index: " + String(gpioIndex));
    return;
  }

  Serial.println("⚡ Pulsing GPIO " + String(gpios[gpioIndex].pin) + 
                 " for " + String(duration) + "ms");
  
  setGPIO(gpioIndex, true);  // Turn ON
  delay(duration);
  setGPIO(gpioIndex, false); // Turn OFF
  
  Serial.println("✓ Pulse complete");
}

void emergencyStop() {
  Serial.println("\n🚨 EMERGENCY STOP TRIGGERED 🚨");
  
  emergencyStopTriggered = true;
  isExecutingSequence = false;
  
  // Turn off all GPIOs immediately
  for (int i = 0; i < NUM_GPIOS; i++) {
    setGPIO(i, false);
  }
  
  Serial.println("✓ All GPIOs turned OFF\n");
}

// ==================== WIFI FUNCTIONS ====================

void connectWiFi() {
  Serial.println("Connecting to WiFi: " + String(WIFI_SSID));
  
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n✓ WiFi connected!");
    Serial.println("IP Address: " + WiFi.localIP().toString());
  } else {
    Serial.println("\n✗ WiFi connection failed!");
    Serial.println("Retrying in 10 seconds...");
    delay(10000);
    ESP.restart();
  }
}

// ==================== SERVER COMMUNICATION ====================

void registerMachine() {
  Serial.println("\nRegistering machine with server...");
  
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("✗ Not connected to WiFi");
    return;
  }

  HTTPClient http;
  String url = String(SERVER_URL) + "/esp/register";
  
  http.begin(url);
  http.addHeader("Content-Type", "application/json");

  // Create JSON payload
  StaticJsonDocument<512> doc;
  doc["machineId"] = MACHINE_ID;
  doc["machineName"] = MACHINE_NAME;
  doc["firmwareVersion"] = FIRMWARE_VERSION;
  doc["ipAddress"] = WiFi.localIP().toString();
  
  // Add GPIO configuration
  JsonArray gpioArray = doc.createNestedArray("gpios");
  for (int i = 0; i < NUM_GPIOS; i++) {
    JsonObject gpio = gpioArray.createNestedObject();
    gpio["gpioNumber"] = gpios[i].pin;
    gpio["gpioName"] = gpios[i].name;
  }

  String jsonPayload;
  serializeJson(doc, jsonPayload);

  Serial.println("Sending: " + jsonPayload);

  int httpCode = http.POST(jsonPayload);
  
  if (httpCode > 0) {
    String response = http.getString();
    Serial.println("Response: " + response);
    
    if (httpCode == 200 || httpCode == 201) {
      Serial.println("✓ Machine registered successfully");
      
      // Parse response to get auth token if needed
      StaticJsonDocument<256> respDoc;
      deserializeJson(respDoc, response);
      
      if (respDoc.containsKey("token")) {
        authToken = respDoc["token"].as<String>();
        Serial.println("✓ Auth token received");
      }
    }
  } else {
    Serial.println("✗ Registration failed: " + http.errorToString(httpCode));
  }
  
  http.end();
}

void sendHeartbeat() {
  if (WiFi.status() != WL_CONNECTED) {
    return;
  }

  HTTPClient http;
  String url = String(SERVER_URL) + "/esp/heartbeat";
  
  http.begin(url);
  http.addHeader("Content-Type", "application/json");

  // Create JSON payload with current status
  StaticJsonDocument<1024> doc;
  doc["machineId"] = MACHINE_ID;
  doc["status"] = isExecutingSequence ? "RUNNING" : "IDLE";
  doc["firmwareVersion"] = FIRMWARE_VERSION;
  doc["ipAddress"] = WiFi.localIP().toString();
  doc["uptime"] = millis();
  doc["freeHeap"] = ESP.getFreeHeap();
  
  // Add GPIO states
  JsonArray gpioArray = doc.createNestedArray("gpios");
  for (int i = 0; i < NUM_GPIOS; i++) {
    JsonObject gpio = gpioArray.createNestedObject();
    gpio["gpioNumber"] = gpios[i].pin;
    gpio["gpioName"] = gpios[i].name;
    gpio["currentState"] = gpios[i].currentState ? "ON" : "OFF";
  }

  String jsonPayload;
  serializeJson(doc, jsonPayload);

  int httpCode = http.POST(jsonPayload);
  
  if (httpCode > 0) {
    String response = http.getString();
    
    // Parse response for commands
    StaticJsonDocument<1024> respDoc;
    DeserializationError error = deserializeJson(respDoc, response);
    
    if (!error) {
      // Check for pending restart command
      if (respDoc.containsKey("pendingRestart") && respDoc["pendingRestart"].as<bool>()) {
        Serial.println("⚠ Restart command received from server");
        delay(1000);
        ESP.restart();
      }
      
      // Check for GPIO commands
      if (respDoc.containsKey("gpioCommands")) {
        JsonArray commands = respDoc["gpioCommands"].as<JsonArray>();
        executeGPIOCommands(commands);
      }
      
      // Check for sequence command
      if (respDoc.containsKey("sequenceId")) {
        String sequenceId = respDoc["sequenceId"].as<String>();
        executeSequence(sequenceId);
      }
      
      // Check for emergency stop
      if (respDoc.containsKey("emergencyStop") && respDoc["emergencyStop"].as<bool>()) {
        emergencyStop();
      }
    }
  }
  
  http.end();
}

void checkForCommands() {
  // This function can be used for polling commands if needed
  // Currently commands are received via heartbeat response
}

void executeGPIOCommands(JsonArray commands) {
  Serial.println("\n📥 Executing GPIO commands...");
  
  for (JsonVariant cmd : commands) {
    int gpioIndex = -1;
    
    // Find GPIO by pin number
    int pinNumber = cmd["gpioNumber"].as<int>();
    for (int i = 0; i < NUM_GPIOS; i++) {
      if (gpios[i].pin == pinNumber) {
        gpioIndex = i;
        break;
      }
    }
    
    if (gpioIndex == -1) {
      Serial.println("✗ GPIO pin " + String(pinNumber) + " not found");
      continue;
    }
    
    String action = cmd["action"].as<String>();
    
    if (action == "ON") {
      setGPIO(gpioIndex, true);
    } else if (action == "OFF") {
      setGPIO(gpioIndex, false);
    } else if (action == "TOGGLE") {
      toggleGPIO(gpioIndex);
    } else if (action == "PULSE") {
      unsigned long duration = cmd["duration"].as<unsigned long>();
      pulseGPIO(gpioIndex, duration);
    }
  }
  
  Serial.println("✓ GPIO commands executed\n");
}

void executeSequence(String sequenceId) {
  Serial.println("\n▶ Starting sequence: " + sequenceId);
  
  isExecutingSequence = true;
  emergencyStopTriggered = false;
  
  // Fetch sequence details from server
  HTTPClient http;
  String url = String(SERVER_URL) + "/sequences/" + sequenceId;
  
  http.begin(url);
  int httpCode = http.GET();
  
  if (httpCode == 200) {
    String response = http.getString();
    StaticJsonDocument<2048> doc;
    DeserializationError error = deserializeJson(doc, response);
    
    if (!error) {
      JsonArray steps = doc["sequence"]["steps"].as<JsonArray>();
      
      Serial.println("Sequence has " + String(steps.size()) + " steps");
      
      for (JsonVariant stepVar : steps) {
        if (emergencyStopTriggered) {
          Serial.println("⚠ Sequence aborted by emergency stop");
          break;
        }
        
        JsonObject step = stepVar.as<JsonObject>();
        int stepNumber = step["stepNumber"].as<int>();
        int gpioNumber = step["gpioNumber"].as<int>();
        unsigned long duration = step["duration"].as<unsigned long>();
        
        Serial.println("\nStep " + String(stepNumber) + ": GPIO " + String(gpioNumber) + 
                       " for " + String(duration) + "ms");
        
        // Find GPIO index
        int gpioIndex = -1;
        for (int i = 0; i < NUM_GPIOS; i++) {
          if (gpios[i].pin == gpioNumber) {
            gpioIndex = i;
            break;
          }
        }
        
        if (gpioIndex != -1) {
          pulseGPIO(gpioIndex, duration);
        } else {
          Serial.println("✗ GPIO " + String(gpioNumber) + " not found");
        }
        
        // Wait before next step
        delay(500);
      }
      
      Serial.println("\n✓ Sequence completed");
    }
  }
  
  http.end();
  isExecutingSequence = false;
}

// ==================== UTILITY FUNCTIONS ====================

void printStatus() {
  Serial.println("\n====== MACHINE STATUS ======");
  Serial.println("Machine ID: " + String(MACHINE_ID));
  Serial.println("Status: " + String(isExecutingSequence ? "RUNNING" : "IDLE"));
  Serial.println("WiFi: " + String(WiFi.status() == WL_CONNECTED ? "Connected" : "Disconnected"));
  Serial.println("IP: " + WiFi.localIP().toString());
  Serial.println("Uptime: " + String(millis() / 1000) + "s");
  Serial.println("\nGPIO States:");
  for (int i = 0; i < NUM_GPIOS; i++) {
    Serial.println("  Pin " + String(gpios[i].pin) + " (" + gpios[i].name + "): " +
                   (gpios[i].currentState ? "ON" : "OFF"));
  }
  Serial.println("===========================\n");
}
