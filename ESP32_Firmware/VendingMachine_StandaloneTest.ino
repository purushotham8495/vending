/*
 * ESP32 Vending Machine - STANDALONE TEST VERSION
 * 
 * This version allows you to test all GPIO functionality without
 * any server connection. Control everything via Serial Monitor.
 * 
 * Features:
 * - Test all GPIOs individually
 * - Toggle, pulse, and sequence operations
 * - No WiFi or server required
 * - Interactive serial command interface
 * - Real-time status display
 * 
 * Usage:
 * 1. Upload to ESP32
 * 2. Open Serial Monitor (115200 baud)
 * 3. Type commands to control GPIOs
 * 
 * Author: Vending Control System
 * Date: 2026-01-09
 */

#include <Arduino.h>

// ==================== GPIO CONFIGURATION ====================

struct GPIOConfig {
  int pin;
  String name;
  bool currentState; // true = ON (LOW), false = OFF (HIGH)
};

// Define your GPIO pins here (customize as needed)
GPIOConfig gpios[] = {
  {25, "Pump 1", false},
  {26, "Pump 2", false},
  {27, "UV Light", false},
  {14, "Dispenser", false},
  {12, "Fan", false},
  {13, "Heater", false}
};

const int NUM_GPIOS = sizeof(gpios) / sizeof(gpios[0]);

// ==================== TEST SEQUENCE ====================

struct SequenceStep {
  int gpioIndex;
  unsigned long duration;
};

// Example test sequence
SequenceStep testSequence[] = {
  {0, 2000},  // Pump 1 for 2 seconds
  {1, 2000},  // Pump 2 for 2 seconds
  {2, 3000},  // UV Light for 3 seconds
  {3, 1000},  // Dispenser for 1 second
  {4, 2000},  // Fan for 2 seconds
  {5, 1500}   // Heater for 1.5 seconds
};

const int SEQUENCE_STEPS = sizeof(testSequence) / sizeof(testSequence[0]);

// ==================== GLOBAL VARIABLES ====================

String inputBuffer = "";
bool isRunningSequence = false;

// ==================== SETUP ====================

void setup() {
  Serial.begin(115200);
  delay(1000);
  
  printBanner();
  initGPIOs();
  printHelp();
  printStatus();
}

// ==================== MAIN LOOP ====================

void loop() {
  // Check for serial commands
  while (Serial.available()) {
    char c = Serial.read();
    
    if (c == '\n' || c == '\r') {
      if (inputBuffer.length() > 0) {
        processCommand(inputBuffer);
        inputBuffer = "";
      }
    } else {
      inputBuffer += c;
    }
  }
  
  delay(10);
}

// ==================== GPIO FUNCTIONS ====================

void initGPIOs() {
  Serial.println("\n┌─────────────────────────────────────┐");
  Serial.println("│   Initializing GPIO Pins...         │");
  Serial.println("└─────────────────────────────────────┘\n");
  
  for (int i = 0; i < NUM_GPIOS; i++) {
    pinMode(gpios[i].pin, OUTPUT);
    // Set all pins to HIGH (Relay OFF) initially
    digitalWrite(gpios[i].pin, HIGH);
    gpios[i].currentState = false;
    
    Serial.print("  ✓ GPIO ");
    Serial.print(gpios[i].pin);
    Serial.print(" (");
    Serial.print(gpios[i].name);
    Serial.println(") -> OFF (HIGH)");
  }
  
  Serial.println("\n✅ All GPIOs initialized (Relays OFF)\n");
}

void setGPIO(int gpioIndex, bool state) {
  if (gpioIndex < 0 || gpioIndex >= NUM_GPIOS) {
    Serial.println("❌ Invalid GPIO index: " + String(gpioIndex));
    return;
  }

  // For relay: true (ON) = LOW, false (OFF) = HIGH
  digitalWrite(gpios[gpioIndex].pin, state ? LOW : HIGH);
  gpios[gpioIndex].currentState = state;
  
  Serial.print("⚡ GPIO ");
  Serial.print(gpios[gpioIndex].pin);
  Serial.print(" (");
  Serial.print(gpios[gpioIndex].name);
  Serial.print(") -> ");
  Serial.print(state ? "ON (LOW)" : "OFF (HIGH)");
  Serial.println();
}

void toggleGPIO(int gpioIndex) {
  if (gpioIndex < 0 || gpioIndex >= NUM_GPIOS) {
    Serial.println("❌ Invalid GPIO index: " + String(gpioIndex));
    return;
  }

  bool newState = !gpios[gpioIndex].currentState;
  setGPIO(gpioIndex, newState);
}

void pulseGPIO(int gpioIndex, unsigned long duration) {
  if (gpioIndex < 0 || gpioIndex >= NUM_GPIOS) {
    Serial.println("❌ Invalid GPIO index: " + String(gpioIndex));
    return;
  }

  Serial.print("\n⏱️  Pulsing GPIO ");
  Serial.print(gpios[gpioIndex].pin);
  Serial.print(" (");
  Serial.print(gpios[gpioIndex].name);
  Serial.print(") for ");
  Serial.print(duration);
  Serial.println("ms");
  
  setGPIO(gpioIndex, true);  // Turn ON
  delay(duration);
  setGPIO(gpioIndex, false); // Turn OFF
  
  Serial.println("✅ Pulse complete\n");
}

void allON() {
  Serial.println("\n🔛 Turning ALL GPIOs ON...");
  for (int i = 0; i < NUM_GPIOS; i++) {
    setGPIO(i, true);
    delay(100);
  }
  Serial.println("✅ All GPIOs ON\n");
}

void allOFF() {
  Serial.println("\n🔴 Turning ALL GPIOs OFF...");
  for (int i = 0; i < NUM_GPIOS; i++) {
    setGPIO(i, false);
    delay(100);
  }
  Serial.println("✅ All GPIOs OFF\n");
}

void runSequence() {
  if (isRunningSequence) {
    Serial.println("⚠️  Sequence already running!");
    return;
  }
  
  isRunningSequence = true;
  
  Serial.println("\n▶️  Starting Test Sequence...");
  Serial.println("═══════════════════════════════════════");
  
  for (int i = 0; i < SEQUENCE_STEPS; i++) {
    int gpioIndex = testSequence[i].gpioIndex;
    unsigned long duration = testSequence[i].duration;
    
    Serial.print("\n📍 Step ");
    Serial.print(i + 1);
    Serial.print("/");
    Serial.print(SEQUENCE_STEPS);
    Serial.print(": ");
    Serial.print(gpios[gpioIndex].name);
    Serial.print(" (GPIO ");
    Serial.print(gpios[gpioIndex].pin);
    Serial.print(") for ");
    Serial.print(duration);
    Serial.println("ms");
    
    pulseGPIO(gpioIndex, duration);
    
    // Small delay between steps
    delay(500);
  }
  
  Serial.println("\n═══════════════════════════════════════");
  Serial.println("✅ Sequence Complete!\n");
  
  isRunningSequence = false;
}

void testAllGPIOs() {
  Serial.println("\n🧪 Testing All GPIOs (1 second each)...");
  Serial.println("═══════════════════════════════════════");
  
  for (int i = 0; i < NUM_GPIOS; i++) {
    Serial.print("\n🔍 Testing GPIO ");
    Serial.print(gpios[i].pin);
    Serial.print(" (");
    Serial.print(gpios[i].name);
    Serial.println(")");
    
    pulseGPIO(i, 1000);
    delay(500);
  }
  
  Serial.println("\n═══════════════════════════════════════");
  Serial.println("✅ Test Complete!\n");
}

// ==================== COMMAND PROCESSING ====================

void processCommand(String cmd) {
  cmd.trim();
  cmd.toLowerCase();
  
  Serial.println("\n> " + cmd);
  
  // Help command
  if (cmd == "help" || cmd == "h") {
    printHelp();
  }
  
  // Status command
  else if (cmd == "status" || cmd == "s") {
    printStatus();
  }
  
  // List GPIOs
  else if (cmd == "list" || cmd == "l") {
    listGPIOs();
  }
  
  // All ON
  else if (cmd == "allon" || cmd == "on") {
    allON();
  }
  
  // All OFF
  else if (cmd == "alloff" || cmd == "off") {
    allOFF();
  }
  
  // Run sequence
  else if (cmd == "sequence" || cmd == "seq") {
    runSequence();
  }
  
  // Test all
  else if (cmd == "test") {
    testAllGPIOs();
  }
  
  // Toggle GPIO (format: t0, t1, t2, etc.)
  else if (cmd.startsWith("t") && cmd.length() == 2) {
    int index = cmd.substring(1).toInt();
    toggleGPIO(index);
  }
  
  // Pulse GPIO (format: p0:2000 = pulse GPIO 0 for 2000ms)
  else if (cmd.startsWith("p")) {
    int colonPos = cmd.indexOf(':');
    if (colonPos > 1) {
      int index = cmd.substring(1, colonPos).toInt();
      int duration = cmd.substring(colonPos + 1).toInt();
      pulseGPIO(index, duration);
    } else {
      Serial.println("❌ Invalid pulse format. Use: p0:2000");
    }
  }
  
  // Set GPIO ON (format: on0, on1, etc.)
  else if (cmd.startsWith("on") && cmd.length() > 2) {
    int index = cmd.substring(2).toInt();
    setGPIO(index, true);
  }
  
  // Set GPIO OFF (format: off0, off1, etc.)
  else if (cmd.startsWith("off") && cmd.length() > 3) {
    int index = cmd.substring(3).toInt();
    setGPIO(index, false);
  }
  
  // Clear screen
  else if (cmd == "clear" || cmd == "cls") {
    for (int i = 0; i < 50; i++) {
      Serial.println();
    }
    printBanner();
  }
  
  // Unknown command
  else {
    Serial.println("❌ Unknown command. Type 'help' for available commands.");
  }
  
  Serial.println();
}

// ==================== DISPLAY FUNCTIONS ====================

void printBanner() {
  Serial.println("\n╔═══════════════════════════════════════════════════════════╗");
  Serial.println("║                                                           ║");
  Serial.println("║         ESP32 GPIO TEST - STANDALONE VERSION              ║");
  Serial.println("║         Control GPIOs via Serial Monitor                  ║");
  Serial.println("║                                                           ║");
  Serial.println("╚═══════════════════════════════════════════════════════════╝\n");
}

void printHelp() {
  Serial.println("╔═══════════════════════════════════════════════════════════╗");
  Serial.println("║                    AVAILABLE COMMANDS                     ║");
  Serial.println("╠═══════════════════════════════════════════════════════════╣");
  Serial.println("║ BASIC COMMANDS:                                           ║");
  Serial.println("║   help, h         - Show this help menu                   ║");
  Serial.println("║   status, s       - Show current GPIO states              ║");
  Serial.println("║   list, l         - List all configured GPIOs             ║");
  Serial.println("║   clear, cls      - Clear screen                          ║");
  Serial.println("║                                                           ║");
  Serial.println("║ GPIO CONTROL:                                             ║");
  Serial.println("║   t<n>            - Toggle GPIO n (e.g., t0, t1)          ║");
  Serial.println("║   on<n>           - Turn GPIO n ON (e.g., on0, on1)       ║");
  Serial.println("║   off<n>          - Turn GPIO n OFF (e.g., off0, off1)    ║");
  Serial.println("║   p<n>:<ms>       - Pulse GPIO n for ms (e.g., p0:2000)   ║");
  Serial.println("║                                                           ║");
  Serial.println("║ BATCH OPERATIONS:                                         ║");
  Serial.println("║   allon, on       - Turn all GPIOs ON                     ║");
  Serial.println("║   alloff, off     - Turn all GPIOs OFF                    ║");
  Serial.println("║   test            - Test all GPIOs (1s each)              ║");
  Serial.println("║   sequence, seq   - Run predefined test sequence          ║");
  Serial.println("╚═══════════════════════════════════════════════════════════╝\n");
  
  Serial.println("📝 Examples:");
  Serial.println("   t0         - Toggle GPIO 0");
  Serial.println("   on2        - Turn GPIO 2 ON");
  Serial.println("   off3       - Turn GPIO 3 OFF");
  Serial.println("   p1:3000    - Pulse GPIO 1 for 3 seconds");
  Serial.println("   allon      - Turn all GPIOs ON");
  Serial.println("   test       - Test all GPIOs sequentially\n");
}

void listGPIOs() {
  Serial.println("\n╔═══════════════════════════════════════════════════════════╗");
  Serial.println("║                    CONFIGURED GPIOs                       ║");
  Serial.println("╠═════╦══════════════╦════════════╦═══════════════════════╣");
  Serial.println("║ ID  ║ Pin Number   ║ Name       ║ Current State         ║");
  Serial.println("╠═════╬══════════════╬════════════╬═══════════════════════╣");
  
  for (int i = 0; i < NUM_GPIOS; i++) {
    Serial.print("║ ");
    Serial.print(i);
    if (i < 10) Serial.print("   ");
    else Serial.print("  ");
    
    Serial.print("║ GPIO ");
    Serial.print(gpios[i].pin);
    if (gpios[i].pin < 10) Serial.print("  ");
    else Serial.print(" ");
    
    Serial.print("   ║ ");
    Serial.print(gpios[i].name);
    for (int j = gpios[i].name.length(); j < 10; j++) {
      Serial.print(" ");
    }
    
    Serial.print(" ║ ");
    if (gpios[i].currentState) {
      Serial.print("ON (LOW)  🟢      ");
    } else {
      Serial.print("OFF (HIGH) ⚫      ");
    }
    Serial.println("║");
  }
  
  Serial.println("╚═════╩══════════════╩════════════╩═══════════════════════╝\n");
}

void printStatus() {
  Serial.println("\n╔═══════════════════════════════════════════════════════════╗");
  Serial.println("║                      SYSTEM STATUS                        ║");
  Serial.println("╚═══════════════════════════════════════════════════════════╝");
  
  Serial.print("  Uptime: ");
  Serial.print(millis() / 1000);
  Serial.println(" seconds");
  
  Serial.print("  Free Heap: ");
  Serial.print(ESP.getFreeHeap());
  Serial.println(" bytes");
  
  Serial.print("  Total GPIOs: ");
  Serial.println(NUM_GPIOS);
  
  int activeCount = 0;
  for (int i = 0; i < NUM_GPIOS; i++) {
    if (gpios[i].currentState) activeCount++;
  }
  
  Serial.print("  Active GPIOs: ");
  Serial.print(activeCount);
  Serial.print(" / ");
  Serial.println(NUM_GPIOS);
  
  Serial.println("\n  GPIO States:");
  for (int i = 0; i < NUM_GPIOS; i++) {
    Serial.print("    [");
    Serial.print(i);
    Serial.print("] Pin ");
    Serial.print(gpios[i].pin);
    Serial.print(" (");
    Serial.print(gpios[i].name);
    Serial.print("): ");
    
    if (gpios[i].currentState) {
      Serial.println("ON (LOW) 🟢");
    } else {
      Serial.println("OFF (HIGH) ⚫");
    }
  }
  
  Serial.println();
}
