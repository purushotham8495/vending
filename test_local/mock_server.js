/*
 * Mock Server for ESP32 Local Testing
 * 
 * This simple mock server allows you to test ESP32 connectivity
 * and GPIO control without running the full backend.
 * 
 * Features:
 * - Receives ESP32 registration
 * - Handles heartbeat requests
 * - Sends GPIO commands
 * - Interactive command interface
 * - No database required
 * 
 * Usage:
 *   node mock_server.js
 * 
 * Then access: http://localhost:5000
 */

const express = require('express');
const bodyParser = require('body-parser');
const readline = require('readline');

const app = express();
app.use(bodyParser.json());

// Storage
let machines = {};
let commandQueue = {};

// Create readline interface for commands
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: 'mock> '
});

// ==================== API ROUTES ====================

// ESP32 Registration
app.post('/api/esp/register', (req, res) => {
  const { machineId, machineName, firmwareVersion, ipAddress, gpios } = req.body;
  
  console.log(`\n✅ Machine Registered:`);
  console.log(`   ID: ${machineId}`);
  console.log(`   Name: ${machineName}`);
  console.log(`   Firmware: ${firmwareVersion}`);
  console.log(`   IP: ${ipAddress}`);
  console.log(`   GPIOs: ${gpios.length}`);
  
  machines[machineId] = {
    machineId,
    machineName,
    firmwareVersion,
    ipAddress,
    gpios,
    lastHeartbeat: new Date(),
    status: 'IDLE'
  };
  
  commandQueue[machineId] = [];
  
  res.json({
    success: true,
    message: 'Machine registered successfully',
    machine: machines[machineId]
  });
});

// ESP32 Heartbeat
app.post('/api/esp/heartbeat', (req, res) => {
  const { machineId, status, firmwareVersion, ipAddress, uptime, freeHeap, gpios } = req.body;
  
  if (!machines[machineId]) {
    return res.status(404).json({
      success: false,
      message: 'Machine not found'
    });
  }
  
  // Update machine info
  machines[machineId].status = status;
  machines[machineId].uptime = uptime;
  machines[machineId].freeHeap = freeHeap;
  machines[machineId].gpios = gpios;
  machines[machineId].lastHeartbeat = new Date();
  
  console.log(`\n💓 Heartbeat from ${machineId} (${status})`);
  
  // Log GPIO states
  if (gpios && gpios.length > 0) {
    console.log(`   GPIOs:`);
    gpios.forEach(gpio => {
      const icon = gpio.currentState === 'ON' ? '🟢' : '⚫';
      console.log(`     ${icon} Pin ${gpio.gpioNumber} (${gpio.gpioName}): ${gpio.currentState}`);
    });
  }
  
  // Check for pending commands
  const commands = commandQueue[machineId] || [];
  const response = {
    success: true,
    pendingRestart: false,
    emergencyStop: false,
    gpioCommands: commands,
    sequenceId: null
  };
  
  // Clear command queue
  commandQueue[machineId] = [];
  
  if (commands.length > 0) {
    console.log(`\n📤 Sending ${commands.length} command(s) to ${machineId}`);
  }
  
  res.json(response);
});

// Web interface
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>ESP32 Mock Server</title>
      <style>
        body {
          font-family: 'Courier New', monospace;
          background: #1e1e1e;
          color: #00ff00;
          padding: 20px;
          max-width: 1200px;
          margin: 0 auto;
        }
        h1 { color: #00ff00; text-align: center; }
        .machine {
          border: 2px solid #00ff00;
          padding: 20px;
          margin: 20px 0;
          background: #2d2d2d;
        }
        .gpio {
          display: inline-block;
          margin: 10px;
          padding: 10px;
          border: 1px solid #555;
          background: #333;
        }
        .on { color: #00ff00; font-weight: bold; }
        .off { color: #666; }
        button {
          background: #00ff00;
          color: #000;
          border: none;
          padding: 10px 20px;
          margin: 5px;
          cursor: pointer;
          font-weight: bold;
        }
        button:hover { background: #00cc00; }
        .status { margin: 10px 0; }
      </style>
      <script>
        function sendCommand(machineId, command) {
          fetch('/api/command', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ machineId, command })
          })
          .then(r => r.json())
          .then(data => {
            alert(data.message);
            location.reload();
          });
        }
        
        function refresh() {
          location.reload();
        }
        
        setInterval(refresh, 5000); // Auto refresh every 5 seconds
      </script>
    </head>
    <body>
      <h1>🤖 ESP32 Mock Server Dashboard</h1>
      <p style="text-align: center;">Connected Machines: ${Object.keys(machines).length}</p>
      <button onclick="location.reload()">🔄 Refresh</button>
      
      ${Object.values(machines).map(m => `
        <div class="machine">
          <h2>${m.machineName} (${m.machineId})</h2>
          <div class="status">
            <strong>Status:</strong> ${m.status} | 
            <strong>IP:</strong> ${m.ipAddress} | 
            <strong>Firmware:</strong> ${m.firmwareVersion}<br>
            <strong>Last Heartbeat:</strong> ${new Date(m.lastHeartbeat).toLocaleTimeString()} | 
            <strong>Free Heap:</strong> ${m.freeHeap} bytes
          </div>
          
          <h3>GPIO Controls:</h3>
          ${m.gpios.map(gpio => `
            <div class="gpio ${gpio.currentState === 'ON' ? 'on' : 'off'}">
              <div><strong>Pin ${gpio.gpioNumber}</strong></div>
              <div>${gpio.gpioName}</div>
              <div>${gpio.currentState}</div>
              <button onclick="sendCommand('${m.machineId}', 'toggle:${gpio.gpioNumber}')">Toggle</button>
              <button onclick="sendCommand('${m.machineId}', 'pulse:${gpio.gpioNumber}:2000')">Pulse 2s</button>
            </div>
          `).join('')}
          
          <div style="margin-top: 20px;">
            <button onclick="sendCommand('${m.machineId}', 'allon')">🟢 All ON</button>
            <button onclick="sendCommand('${m.machineId}', 'alloff')">🔴 All OFF</button>
            <button onclick="sendCommand('${m.machineId}', 'restart')">🔄 Restart ESP32</button>
          </div>
        </div>
      `).join('')}
      
      ${Object.keys(machines).length === 0 ? '<p style="text-align: center;">No machines connected yet. Start your ESP32!</p>' : ''}
    </body>
    </html>
  `);
});

// Command API
app.post('/api/command', (req, res) => {
  const { machineId, command } = req.body;
  
  if (!machines[machineId]) {
    return res.status(404).json({
      success: false,
      message: 'Machine not found'
    });
  }
  
  if (!commandQueue[machineId]) {
    commandQueue[machineId] = [];
  }
  
  const [action, ...params] = command.split(':');
  
  if (action === 'toggle') {
    const gpioNumber = parseInt(params[0]);
    commandQueue[machineId].push({
      gpioNumber,
      action: 'TOGGLE'
    });
    console.log(`\n📤 Queued command: Toggle GPIO ${gpioNumber} on ${machineId}`);
  } else if (action === 'pulse') {
    const gpioNumber = parseInt(params[0]);
    const duration = parseInt(params[1]);
    commandQueue[machineId].push({
      gpioNumber,
      action: 'PULSE',
      duration
    });
    console.log(`\n📤 Queued command: Pulse GPIO ${gpioNumber} for ${duration}ms on ${machineId}`);
  } else if (action === 'allon') {
    machines[machineId].gpios.forEach(gpio => {
      commandQueue[machineId].push({
        gpioNumber: gpio.gpioNumber,
        action: 'ON'
      });
    });
    console.log(`\n📤 Queued command: All ON for ${machineId}`);
  } else if (action === 'alloff') {
    machines[machineId].gpios.forEach(gpio => {
      commandQueue[machineId].push({
        gpioNumber: gpio.gpioNumber,
        action: 'OFF'
      });
    });
    console.log(`\n📤 Queued command: All OFF for ${machineId}`);
  } else if (action === 'restart') {
    // Set pending restart flag
    console.log(`\n📤 Queued command: Restart ${machineId}`);
  }
  
  res.json({
    success: true,
    message: `Command queued: ${command}`
  });
});

// ==================== CLI INTERFACE ====================

function printMachines() {
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║               CONNECTED MACHINES                       ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');
  
  if (Object.keys(machines).length === 0) {
    console.log('  No machines connected.\n');
    return;
  }
  
  Object.values(machines).forEach(m => {
    const timeSince = Math.floor((Date.now() - new Date(m.lastHeartbeat)) / 1000);
    console.log(`  📱 ${m.machineName} (${m.machineId})`);
    console.log(`     Status: ${m.status}`);
    console.log(`     IP: ${m.ipAddress}`);
    console.log(`     Last seen: ${timeSince}s ago`);
    console.log(`     GPIOs: ${m.gpios.length}`);
    
    m.gpios.forEach(gpio => {
      const icon = gpio.currentState === 'ON' ? '🟢' : '⚫';
      console.log(`       ${icon} Pin ${gpio.gpioNumber} (${gpio.gpioName}): ${gpio.currentState}`);
    });
    console.log('');
  });
}

function printHelp() {
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║                 AVAILABLE COMMANDS                     ║');
  console.log('╠════════════════════════════════════════════════════════╣');
  console.log('║ machines, m     - List all connected machines          ║');
  console.log('║ help, h         - Show this help                       ║');
  console.log('║ clear, cls      - Clear screen                         ║');
  console.log('║ exit, quit      - Stop server                          ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');
}

// Handle CLI commands
rl.on('line', (input) => {
  const cmd = input.trim().toLowerCase();
  
  if (cmd === 'machines' || cmd === 'm') {
    printMachines();
  } else if (cmd === 'help' || cmd === 'h') {
    printHelp();
  } else if (cmd === 'clear' || cmd === 'cls') {
    console.clear();
  } else if (cmd === 'exit' || cmd === 'quit') {
    console.log('\n👋 Shutting down mock server...\n');
    process.exit(0);
  } else if (cmd !== '') {
    console.log(`❌ Unknown command: ${cmd}. Type 'help' for available commands.`);
  }
  
  rl.prompt();
}).on('close', () => {
  console.log('\n👋 Goodbye!\n');
  process.exit(0);
});

// ==================== START SERVER ====================

const PORT = 5000;

app.listen(PORT, () => {
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║                                                        ║');
  console.log('║          🤖 ESP32 MOCK SERVER RUNNING 🤖               ║');
  console.log('║                                                        ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');
  console.log(`  📡 Server URL: http://localhost:${PORT}`);
  console.log(`  🌐 Web Dashboard: http://localhost:${PORT}`);
  console.log(`  📋 API Endpoint: http://localhost:${PORT}/api`);
  console.log('\n  Configure your ESP32 with:');
  console.log(`  const char* SERVER_URL = "http://YOUR_PC_IP:${PORT}/api";\n`);
  console.log('  💡 Type "help" for available commands\n');
  
  printHelp();
  rl.prompt();
});
