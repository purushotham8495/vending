const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const { authenticate, isAdmin } = require('../middleware/auth');

// Get all transactions (Admin) or owner's transactions
router.get('/', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 50, machineId, status, startDate, endDate } = req.query;

    const query = req.user.role === 'admin' ? {} : { owner: req.user._id };

    if (machineId) {
      query.machine = machineId;
    }

    if (status) {
      query.status = status;
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const transactions = await Transaction.find(query)
      .populate('machine', 'machineId location')
      .populate('owner', 'phoneNumber')
      .populate('sequenceId', 'name')
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

// Get single transaction
router.get('/:transactionId', authenticate, async (req, res) => {
  try {
    const { transactionId } = req.params;

    const transaction = await Transaction.findById(transactionId)
      .populate('machine', 'machineId location')
      .populate('owner', 'phoneNumber')
      .populate('sequenceId', 'name steps');

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    // Check ownership
    if (req.user.role !== 'admin' && transaction.owner._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      transaction
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get transaction statistics
router.get('/stats/summary', authenticate, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const matchQuery = req.user.role === 'admin' ? {} : { owner: req.user._id };

    if (startDate || endDate) {
      matchQuery.createdAt = {};
      if (startDate) matchQuery.createdAt.$gte = new Date(startDate);
      if (endDate) matchQuery.createdAt.$lte = new Date(endDate);
    }

    const stats = await Transaction.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      }
    ]);

    const summary = {
      total: 0,
      completed: 0,
      pending: 0,
      failed: 0,
      totalRevenue: 0
    };

    stats.forEach(stat => {
      summary.total += stat.count;
      summary[stat._id] = stat.count;
      if (stat._id === 'completed') {
        summary.totalRevenue = stat.totalAmount;
      }
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

module.exports = router;
