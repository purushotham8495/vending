const express = require('express');
const router = express.Router();
const Log = require('../models/Log');
const { authenticate, verifyMachineOwnership } = require('../middleware/auth');

// Get logs (filtered by role)
router.get('/', authenticate, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 100, 
      machineId, 
      eventType, 
      severity, 
      startDate, 
      endDate 
    } = req.query;

    const query = {};

    // Non-admin users can only see logs for their machines
    if (req.user.role !== 'admin') {
      const Machine = require('../models/Machine');
      const userMachines = await Machine.find({ owner: req.user._id }).select('_id');
      query.machine = { $in: userMachines.map(m => m._id) };
    }

    if (machineId) {
      query.machine = machineId;
    }

    if (eventType) {
      query.eventType = eventType;
    }

    if (severity) {
      query.severity = severity;
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const logs = await Log.find(query)
      .populate('machine', 'machineId location')
      .populate('user', 'phoneNumber role')
      .sort('-createdAt')
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Log.countDocuments(query);

    res.json({
      success: true,
      logs,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get logs for specific machine
router.get('/machine/:machineId', authenticate, verifyMachineOwnership, async (req, res) => {
  try {
    const { page = 1, limit = 100, eventType, severity } = req.query;
    const machine = req.machine;

    const query = { machine: machine._id };

    if (eventType) {
      query.eventType = eventType;
    }

    if (severity) {
      query.severity = severity;
    }

    const logs = await Log.find(query)
      .populate('user', 'phoneNumber role')
      .sort('-createdAt')
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Log.countDocuments(query);

    res.json({
      success: true,
      logs,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get log statistics
router.get('/stats/summary', authenticate, async (req, res) => {
  try {
    const { machineId, startDate, endDate } = req.query;

    const query = {};

    // Non-admin users can only see logs for their machines
    if (req.user.role !== 'admin') {
      const Machine = require('../models/Machine');
      const userMachines = await Machine.find({ owner: req.user._id }).select('_id');
      query.machine = { $in: userMachines.map(m => m._id) };
    }

    if (machineId) {
      query.machine = machineId;
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const stats = await Log.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$severity',
          count: { $sum: 1 }
        }
      }
    ]);

    const eventStats = await Log.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$eventType',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    const summary = {
      total: 0,
      info: 0,
      warning: 0,
      error: 0,
      critical: 0,
      topEvents: eventStats
    };

    stats.forEach(stat => {
      summary[stat._id] = stat.count;
      summary.total += stat.count;
    });

    res.json({
      success: true,
      summary
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Clear old logs (Admin only)
router.delete('/cleanup', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const { daysOld = 90 } = req.query;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - parseInt(daysOld));

    const result = await Log.deleteMany({
      createdAt: { $lt: cutoffDate },
      severity: { $in: ['info', 'warning'] }
    });

    res.json({
      success: true,
      message: `Deleted ${result.deletedCount} old logs`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
