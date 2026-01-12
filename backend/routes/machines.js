const express = require('express');
const router = express.Router();
const Machine = require('../models/Machine');
const User = require('../models/User');
const Logger = require('../utils/logger');
const { authenticate, isAdmin, verifyMachineOwnership } = require('../middleware/auth');

// Get all machines (Admin only)
router.get('/', authenticate, async (req, res) => {
  try {
    const query = req.user.role === 'admin' ? {} : { owner: req.user._id };
    
    const machines = await Machine.find(query)
      .populate('owner', 'name phoneNumber email')
      .populate('currentSequence', 'name totalDuration')
      .sort('-createdAt');

    // Update status based on heartbeat
    machines.forEach(machine => machine.updateStatus());

    res.json({
      success: true,
      machines
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get single machine
router.get('/:machineId', authenticate, verifyMachineOwnership, async (req, res) => {
  try {
    const machine = req.machine;
    machine.updateStatus();
    await machine.save();

    res.json({
      success: true,
      machine
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Create machine (Admin only)
router.post('/', authenticate, isAdmin, async (req, res) => {
  try {
    const { machineId, location, ownerId, fixedPrice, gpios } = req.body;

    if (!machineId || !location || !ownerId || !fixedPrice) {
      return res.status(400).json({
        success: false,
        message: 'All required fields must be provided'
      });
    }

    // Check if machine ID already exists
    const existingMachine = await Machine.findOne({ machineId });
    if (existingMachine) {
      return res.status(400).json({
        success: false,
        message: 'Machine ID already exists'
      });
    }

    // Verify owner exists
    const owner = await User.findById(ownerId);
    if (!owner || owner.role !== 'owner') {
      return res.status(400).json({
        success: false,
        message: 'Invalid owner'
      });
    }

    const machine = new Machine({
      machineId,
      location,
      owner: ownerId,
      fixedPrice,
      gpios: gpios || []
    });

    await machine.save();

    await Logger.info(
      `Machine ${machineId} created`,
      { location, ownerId, fixedPrice },
      machine._id,
      req.user._id
    );

    res.status(201).json({
      success: true,
      message: 'Machine created successfully',
      machine
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Update machine (Admin only)
router.put('/:machineId', authenticate, isAdmin, async (req, res) => {
  try {
    const { machineId } = req.params;
    const { location, ownerId, fixedPrice, status } = req.body;

    const machine = await Machine.findById(machineId);

    if (!machine) {
      return res.status(404).json({
        success: false,
        message: 'Machine not found'
      });
    }

    if (location) machine.location = location;
    if (ownerId) {
      const owner = await User.findById(ownerId);
      if (!owner || owner.role !== 'owner') {
        return res.status(400).json({
          success: false,
          message: 'Invalid owner'
        });
      }
      machine.owner = ownerId;
    }
    if (fixedPrice !== undefined) machine.fixedPrice = fixedPrice;
    if (status) machine.status = status;

    await machine.save();

    await Logger.info(
      `Machine ${machine.machineId} updated`,
      { location, ownerId, fixedPrice, status },
      machine._id,
      req.user._id
    );

    res.json({
      success: true,
      message: 'Machine updated successfully',
      machine
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Delete machine (Admin only)
router.delete('/:machineId', authenticate, isAdmin, async (req, res) => {
  try {
    const { machineId } = req.params;

    const machine = await Machine.findByIdAndDelete(machineId);

    if (!machine) {
      return res.status(404).json({
        success: false,
        message: 'Machine not found'
      });
    }

    await Logger.warning(
      `Machine ${machine.machineId} deleted`,
      { location: machine.location },
      machine._id,
      req.user._id
    );

    res.json({
      success: true,
      message: 'Machine deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
