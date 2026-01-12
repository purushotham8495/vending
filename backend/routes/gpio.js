const express = require('express');
const router = express.Router();
const Machine = require('../models/Machine');
const Logger = require('../utils/logger');
const { authenticate, verifyMachineOwnership } = require('../middleware/auth');

// Get GPIO configuration for a machine
router.get('/:machineId', authenticate, verifyMachineOwnership, async (req, res) => {
  try {
    const machine = req.machine;

    res.json({
      success: true,
      gpios: machine.gpios
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Update GPIO configuration
router.put('/:machineId', authenticate, verifyMachineOwnership, async (req, res) => {
  try {
    const { gpios } = req.body;
    const machine = req.machine;

    if (!Array.isArray(gpios)) {
      return res.status(400).json({
        success: false,
        message: 'GPIOs must be an array'
      });
    }

    // Validate GPIO numbers (ESP32 valid pins)
    const validPins = [0, 2, 4, 5, 12, 13, 14, 15, 16, 17, 18, 19, 21, 22, 23, 25, 26, 27, 32, 33];
    
    for (const gpio of gpios) {
      if (!validPins.includes(gpio.gpioNumber)) {
        return res.status(400).json({
          success: false,
          message: `Invalid GPIO pin: ${gpio.gpioNumber}`
        });
      }
    }

    machine.gpios = gpios;
    await machine.save();

    await Logger.info(
      `GPIO configuration updated for machine ${machine.machineId}`,
      { gpioCount: gpios.length },
      machine._id,
      req.user._id
    );

    res.json({
      success: true,
      message: 'GPIO configuration updated',
      gpios: machine.gpios
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Toggle GPIO (manual control)
router.post('/:machineId/toggle', authenticate, verifyMachineOwnership, async (req, res) => {
  try {
    const { gpioId, state, duration } = req.body;
    const machine = req.machine;

    // Check if machine is locked (sequence running)
    if (machine.processLocked) {
      return res.status(400).json({
        success: false,
        message: 'Cannot toggle GPIO while sequence is running'
      });
    }

    // Check if machine is online
    if (!machine.isOnline()) {
      return res.status(400).json({
        success: false,
        message: 'Machine is offline'
      });
    }

    const gpio = machine.gpios.id(gpioId);
    if (!gpio) {
      return res.status(404).json({
        success: false,
        message: 'GPIO not found'
      });
    }

    gpio.currentState = state;
    await machine.save();

    await Logger.gpioToggle(machine, gpio.gpioName, state, req.user);

    // If duration is specified, schedule auto-off
    if (duration && state === 'ON') {
      setTimeout(async () => {
        const updatedMachine = await Machine.findById(machine._id);
        const updatedGpio = updatedMachine.gpios.id(gpioId);
        if (updatedGpio && updatedGpio.currentState === 'ON' && !updatedMachine.processLocked) {
          updatedGpio.currentState = 'OFF';
          await updatedMachine.save();
          await Logger.gpioToggle(updatedMachine, updatedGpio.gpioName, 'OFF', null);
        }
      }, duration * 1000);
    }

    res.json({
      success: true,
      message: 'GPIO toggled successfully',
      gpio
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get GPIO state for ESP32
router.get('/:machineId/esp-config', async (req, res) => {
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

    res.json({
      success: true,
      gpios: machine.gpios,
      processLocked: machine.processLocked,
      currentSequence: machine.currentSequence,
      currentStep: machine.currentStep
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
