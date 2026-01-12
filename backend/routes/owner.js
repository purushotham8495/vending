const express = require('express');
const router = express.Router();
const Machine = require('../models/Machine');
const Transaction = require('../models/Transaction');
const { authenticate, isOwnerOrAdmin } = require('../middleware/auth');

// All routes require owner or admin authentication
router.use(authenticate, isOwnerOrAdmin);

// Get owner's dashboard statistics
router.get('/dashboard', async (req, res) => {
  try {
    const ownerId = req.user._id;

    const totalMachines = await Machine.countDocuments({ owner: ownerId });
    const onlineMachines = await Machine.countDocuments({ 
      owner: ownerId, 
      status: { $ne: 'OFFLINE' } 
    });

    const revenueStats = await Transaction.aggregate([
      { $match: { owner: ownerId, status: 'completed' } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$amount' },
          todayRevenue: {
            $sum: {
              $cond: [
                { $gte: ['$createdAt', new Date(new Date().setHours(0, 0, 0, 0))] },
                '$amount',
                0
              ]
            }
          },
          monthRevenue: {
            $sum: {
              $cond: [
                { $gte: ['$createdAt', new Date(new Date().getFullYear(), new Date().getMonth(), 1)] },
                '$amount',
                0
              ]
            }
          }
        }
      }
    ]);

    const totalTransactions = await Transaction.countDocuments({ 
      owner: ownerId, 
      status: 'completed' 
    });

    res.json({
      success: true,
      dashboard: {
        totalMachines,
        onlineMachines,
        offlineMachines: totalMachines - onlineMachines,
        totalRevenue: revenueStats[0]?.totalRevenue || 0,
        todayRevenue: revenueStats[0]?.todayRevenue || 0,
        monthRevenue: revenueStats[0]?.monthRevenue || 0,
        totalTransactions
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get owner's machines
router.get('/machines', async (req, res) => {
  try {
    const machines = await Machine.find({ owner: req.user._id })
      .sort('-createdAt')
      .populate('currentSequence', 'name totalDuration');

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

// Get owner's transactions
router.get('/transactions', async (req, res) => {
  try {
    const { page = 1, limit = 50, machineId, startDate, endDate } = req.query;

    const query = { owner: req.user._id };

    if (machineId) {
      query.machine = machineId;
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const transactions = await Transaction.find(query)
      .populate('machine', 'machineId location')
      .sort('-createdAt')
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Transaction.countDocuments(query);

    res.json({
      success: true,
      transactions,
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

// Get earnings report
router.get('/earnings', async (req, res) => {
  try {
    const { groupBy = 'day', startDate, endDate } = req.query;

    const matchQuery = { 
      owner: req.user._id, 
      status: 'completed' 
    };

    if (startDate || endDate) {
      matchQuery.createdAt = {};
      if (startDate) matchQuery.createdAt.$gte = new Date(startDate);
      if (endDate) matchQuery.createdAt.$lte = new Date(endDate);
    }

    let groupByFormat;
    switch (groupBy) {
      case 'hour':
        groupByFormat = { $dateToString: { format: '%Y-%m-%d %H:00', date: '$createdAt' } };
        break;
      case 'day':
        groupByFormat = { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } };
        break;
      case 'month':
        groupByFormat = { $dateToString: { format: '%Y-%m', date: '$createdAt' } };
        break;
      default:
        groupByFormat = { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } };
    }

    const earnings = await Transaction.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: groupByFormat,
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      success: true,
      earnings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
