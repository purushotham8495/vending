const express = require('express');
const router = express.Router();
const Sequence = require('../models/Sequence');
const Machine = require('../models/Machine');
const Logger = require('../utils/logger');
const { authenticate, isAdmin } = require('../middleware/auth');

// Get all sequences
router.get('/', authenticate, async (req, res) => {
  try {
    const sequences = await Sequence.find()
      .populate('createdBy', 'phoneNumber')
      .sort('-createdAt');

    res.json({
      success: true,
      sequences
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get single sequence
router.get('/:sequenceId', authenticate, async (req, res) => {
  try {
    const sequence = await Sequence.findById(req.params.sequenceId)
      .populate('createdBy', 'phoneNumber');

    if (!sequence) {
      return res.status(404).json({
        success: false,
        message: 'Sequence not found'
      });
    }

    res.json({
      success: true,
      sequence
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Create sequence (Admin only)
router.post('/', authenticate, isAdmin, async (req, res) => {
  try {
    const { name, description, steps, isDefault } = req.body;

    if (!name || !steps || !Array.isArray(steps) || steps.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Name and steps are required'
      });
    }

    // If setting as default, remove default flag from others
    if (isDefault) {
      await Sequence.updateMany({}, { isDefault: false });
    }

    const sequence = new Sequence({
      name,
      description,
      steps,
      isDefault: isDefault || false,
      createdBy: req.user._id
    });

    await sequence.save();

    await Logger.info(
      `Sequence "${name}" created`,
      { stepsCount: steps.length, totalDuration: sequence.totalDuration },
      null,
      req.user._id
    );

    res.status(201).json({
      success: true,
      message: 'Sequence created successfully',
      sequence
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Update sequence (Admin only)
router.put('/:sequenceId', authenticate, isAdmin, async (req, res) => {
  try {
    const { sequenceId } = req.params;
    const { name, description, steps, isDefault } = req.body;

    const sequence = await Sequence.findById(sequenceId);

    if (!sequence) {
      return res.status(404).json({
        success: false,
        message: 'Sequence not found'
      });
    }

    if (name) sequence.name = name;
    if (description !== undefined) sequence.description = description;
    if (steps) sequence.steps = steps;
    
    if (isDefault) {
      await Sequence.updateMany({}, { isDefault: false });
      sequence.isDefault = true;
    }

    await sequence.save();

    await Logger.info(
      `Sequence "${sequence.name}" updated`,
      { stepsCount: sequence.steps.length },
      null,
      req.user._id
    );

    res.json({
      success: true,
      message: 'Sequence updated successfully',
      sequence
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Delete sequence (Admin only)
router.delete('/:sequenceId', authenticate, isAdmin, async (req, res) => {
  try {
    const { sequenceId } = req.params;

    // Check if any machine is using this sequence
    const machinesUsingSequence = await Machine.countDocuments({ currentSequence: sequenceId });

    if (machinesUsingSequence > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete sequence being used by ${machinesUsingSequence} machine(s)`
      });
    }

    const sequence = await Sequence.findByIdAndDelete(sequenceId);

    if (!sequence) {
      return res.status(404).json({
        success: false,
        message: 'Sequence not found'
      });
    }

    await Logger.warning(
      `Sequence "${sequence.name}" deleted`,
      {},
      null,
      req.user._id
    );

    res.json({
      success: true,
      message: 'Sequence deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get default sequence
router.get('/default/get', authenticate, async (req, res) => {
  try {
    const sequence = await Sequence.findOne({ isDefault: true });

    if (!sequence) {
      return res.status(404).json({
        success: false,
        message: 'No default sequence found'
      });
    }

    res.json({
      success: true,
      sequence
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
