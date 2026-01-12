const express = require('express');
const router = express.Router();
const processManager = require('../services/processManager');
const { authenticate, verifyMachineOwnership } = require('../middleware/auth');

/**
 * Emergency Stop - Critical endpoint
 * Available to machine owner and admin
 */
router.post('/emergency-stop/:machineId', authenticate, verifyMachineOwnership, async (req, res) => {
  try {
    const machine = req.machine;

    const result = await processManager.emergencyStop(machine._id, req.user._id);

    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * Start sequence manually (for testing)
 */
router.post('/start-sequence/:machineId', authenticate, verifyMachineOwnership, async (req, res) => {
  try {
    const { sequenceId } = req.body;
    const machine = req.machine;

    if (!sequenceId) {
      return res.status(400).json({
        success: false,
        message: 'Sequence ID required'
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
 * Get current process status
 */
router.get('/status/:machineId', authenticate, verifyMachineOwnership, async (req, res) => {
  try {
    const machine = req.machine;
    await machine.populate('currentSequence');

    res.json({
      success: true,
      status: {
        machineStatus: machine.status,
        processLocked: machine.processLocked,
        currentSequence: machine.currentSequence,
        currentStep: machine.currentStep,
        processStartTime: machine.processStartTime,
        remainingTime: machine.currentSequence 
          ? machine.currentSequence.totalDuration - 
            ((Date.now() - machine.processStartTime?.getTime()) / 1000)
          : 0,
        gpios: machine.gpios
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * Toggle GPIO state (for relay control)
 * Note: For relay - HIGH = OFF, LOW = ON
 */
router.post('/toggle-gpio/:machineId', authenticate, verifyMachineOwnership, async (req, res) => {
  try {
    const { gpioId } = req.body;
    const machine = req.machine;

    if (machine.status === 'RUNNING' || machine.processLocked) {
      return res.status(400).json({
        success: false,
        message: 'Cannot control GPIO while machine is running'
      });
    }

    if (!gpioId) {
      return res.status(400).json({
        success: false,
        message: 'GPIO ID required'
      });
    }

    const gpio = machine.gpios.id(gpioId);
    if (!gpio) {
      return res.status(404).json({
        success: false,
        message: 'GPIO not found'
      });
    }

    // Toggle GPIO state
    gpio.currentState = gpio.currentState === 'ON' ? 'OFF' : 'ON';
    gpio.lastTriggered = new Date();
    await machine.save();

    res.json({
      success: true,
      message: `GPIO ${gpio.gpioName} toggled to ${gpio.currentState}`,
      gpio: {
        _id: gpio._id,
        gpioName: gpio.gpioName,
        gpioNumber: gpio.gpioNumber,
        currentState: gpio.currentState
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * Pulse GPIO for specified duration (automatic ON then OFF)
 */
router.post('/pulse-gpio/:machineId', authenticate, verifyMachineOwnership, async (req, res) => {
  try {
    const { gpioId, duration } = req.body;
    const machine = req.machine;

    if (machine.status === 'RUNNING' || machine.processLocked) {
      return res.status(400).json({
        success: false,
        message: 'Cannot control GPIO while machine is running'
      });
    }

    if (!gpioId || !duration) {
      return res.status(400).json({
        success: false,
        message: 'GPIO ID and duration required'
      });
    }

    const gpio = machine.gpios.id(gpioId);
    if (!gpio) {
      return res.status(404).json({
        success: false,
        message: 'GPIO not found'
      });
    }

    // Turn ON (LOW for relay)
    gpio.currentState = 'ON';
    gpio.lastTriggered = new Date();
    await machine.save();

    // Schedule automatic turn OFF
    setTimeout(async () => {
      try {
        const updatedMachine = await Machine.findById(machine._id);
        const updatedGpio = updatedMachine.gpios.id(gpioId);
        if (updatedGpio) {
          updatedGpio.currentState = 'OFF';
          await updatedMachine.save();
        }
      } catch (error) {
        console.error('Failed to auto-OFF GPIO:', error);
      }
    }, duration);

    res.json({
      success: true,
      message: `GPIO ${gpio.gpioName} pulsed for ${duration}ms`,
      gpio: {
        _id: gpio._id,
        gpioName: gpio.gpioName,
        gpioNumber: gpio.gpioNumber,
        currentState: gpio.currentState,
        duration: duration
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * Restart ESP32
 */
router.post('/restart-esp/:machineId', authenticate, verifyMachineOwnership, async (req, res) => {
  try {
    const machine = req.machine;

    if (machine.status === 'RUNNING' || machine.processLocked) {
      return res.status(400).json({
        success: false,
        message: 'Cannot restart ESP32 while machine is running. Use emergency stop first.'
      });
    }

    // Set a flag that ESP32 will check on next heartbeat
    machine.pendingRestart = true;
    await machine.save();

    res.json({
      success: true,
      message: 'Restart command queued. ESP32 will restart on next heartbeat.'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * Get all GPIO states (for real-time monitoring)
 */
router.get('/gpio-status/:machineId', authenticate, verifyMachineOwnership, async (req, res) => {
  try {
    const machine = req.machine;

    res.json({
      success: true,
      gpios: machine.gpios.map(gpio => ({
        _id: gpio._id,
        gpioName: gpio.gpioName,
        gpioNumber: gpio.gpioNumber,
        currentState: gpio.currentState,
        lastTriggered: gpio.lastTriggered
      }))
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
