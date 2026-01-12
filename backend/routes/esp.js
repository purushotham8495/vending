const express = require('express');
const router = express.Router();
const Machine = require('../models/Machine');
const Logger = require('../utils/logger');
const processManager = require('../services/processManager');

/**
 * ESP32 Heartbeat - Called every X seconds by ESP32
 */
router.post('/heartbeat', async (req, res) => {
  try {
    const { machineId, firmwareVersion, ipAddress, wifiSSID, signalStrength } = req.body;

    if (!machineId) {
      return res.status(400).json({
        success: false,
        message: 'Machine ID required'
      });
    }

    let machine = await Machine.findOne({ machineId });

    if (!machine) {
      return res.status(404).json({
        success: false,
        message: 'Machine not registered'
      });
    }

    const wasOffline = !machine.isOnline();

    // Update machine status
    machine.lastHeartbeat = new Date();
    machine.ipAddress = ipAddress;
    machine.wifiSSID = wifiSSID;
    machine.signalStrength = signalStrength;
    
    if (firmwareVersion) {
      machine.firmwareVersion = firmwareVersion;
    }

    machine.updateStatus();
    await machine.save();

    // Log connection if was offline
    if (wasOffline) {
      await Logger.esp32Connected(machine, ipAddress);

      // Check if there's an interrupted sequence to restart
      if (machine.processLocked) {
        await processManager.restartSequenceAfterReconnect(machine._id);
      }
    }

    res.json({
      success: true,
      status: machine.status,
      processLocked: machine.processLocked,
      gpios: machine.gpios
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * Get current GPIO states for ESP32
 */
router.get('/gpio-states/:machineId', async (req, res) => {
  try {
    const { machineId } = req.params;

    const machine = await Machine.findOne({ machineId });

    if (!machine) {
      return res.status(404).json({
        success: false,
        message: 'Machine not found'
      });
    }

    // Update heartbeat
    machine.lastHeartbeat = new Date();
    machine.updateStatus();
    await machine.save();

    // Format GPIO states for ESP32
    const gpioStates = machine.gpios.map(gpio => ({
      pin: gpio.gpioNumber,
      name: gpio.gpioName,
      state: gpio.currentState,
      relayLogic: gpio.relayLogic
    }));

    res.json({
      success: true,
      gpios: gpioStates,
      processLocked: machine.processLocked,
      currentStep: machine.currentStep
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * Update GPIO state from ESP32 (confirmation)
 */
router.post('/gpio-state-update', async (req, res) => {
  try {
    const { machineId, gpioNumber, state } = req.body;

    const machine = await Machine.findOne({ machineId });

    if (!machine) {
      return res.status(404).json({
        success: false,
        message: 'Machine not found'
      });
    }

    const gpio = machine.gpios.find(g => g.gpioNumber === gpioNumber);

    if (gpio) {
      gpio.currentState = state;
      await machine.save();
    }

    res.json({
      success: true
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * Report error from ESP32
 */
router.post('/error', async (req, res) => {
  try {
    const { machineId, errorMessage, errorCode } = req.body;

    const machine = await Machine.findOne({ machineId });

    if (machine) {
      await Logger.error(
        `ESP32 Error: ${errorMessage}`,
        { errorCode },
        machine._id
      );
    }

    res.json({
      success: true
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * Manual sequence start (for testing)
 */
router.post('/start-sequence', async (req, res) => {
  try {
    const { machineId, sequenceId } = req.body;

    const machine = await Machine.findOne({ machineId });

    if (!machine) {
      return res.status(404).json({
        success: false,
        message: 'Machine not found'
      });
    }

    const result = await processManager.startSequence(machine._id, sequenceId);

    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * Emergency stop from ESP32
 */
router.post('/emergency-stop', async (req, res) => {
  try {
    const { machineId } = req.body;

    const machine = await Machine.findOne({ machineId });

    if (!machine) {
      return res.status(404).json({
        success: false,
        message: 'Machine not found'
      });
    }

    // Create a system user for logging
    await processManager.emergencyStop(machine._id, machine.owner);

    res.json({
      success: true,
      message: 'Emergency stop executed'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
