const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Machine = require('../models/Machine');
const Transaction = require('../models/Transaction');
const { authenticate, isAdmin } = require('../middleware/auth');

// All routes require admin authentication
router.use(authenticate, isAdmin);

// Get all owners
router.get('/owners', async (req, res) => {
  try {
    const owners = await User.find({ role: 'owner' })
      .select('-otp -otpExpiry')
      .sort('-createdAt');

    // Get machine count and earnings for each owner
    const ownersWithStats = await Promise.all(
      owners.map(async (owner) => {
        const machines = await Machine.find({ owner: owner._id });
        const activeMachines = machines.filter(m => m.status !== 'OFFLINE').length;
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const earnings = await Transaction.aggregate([
          { $match: { owner: owner._id, status: 'completed' } },
          { 
            $group: { 
              _id: null, 
              total: { $sum: '$amount' },
              todayTotal: {
                $sum: {
                  $cond: [
                    { $gte: ['$createdAt', today] },
                    '$amount',
                    0
                  ]
                }
              }
            } 
          }
        ]);

        return {
          ...owner.toObject(),
          totalMachines: machines.length,
          activeMachines: activeMachines,
          totalEarnings: earnings[0]?.total || 0,
          todayEarnings: earnings[0]?.todayTotal || 0
        };
      })
    );

    res.json({
      success: true,
      owners: ownersWithStats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Create owner
router.post('/owners', async (req, res) => {
  try {
    const { name, phoneNumber, email } = req.body;

    // Validate required fields
    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Name is required'
      });
    }

    if (!phoneNumber || !/^[0-9]{10}$/.test(phoneNumber)) {
      return res.status(400).json({
        success: false,
        message: 'Valid 10-digit phone number required'
      });
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Valid email address required'
      });
    }

    // Check if user already exists with this phone number
    const existingPhone = await User.findOne({ phoneNumber });
    if (existingPhone) {
      return res.status(400).json({
        success: false,
        message: 'User with this phone number already exists'
      });
    }

    // Check if user already exists with this email
    const existingEmail = await User.findOne({ email: email.toLowerCase() });
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    const owner = new User({
      name: name.trim(),
      phoneNumber,
      email: email.toLowerCase(),
      role: 'owner',
      status: 'active'
    });

    await owner.save();

    res.status(201).json({
      success: true,
      message: 'Owner created successfully',
      owner: {
        id: owner._id,
        name: owner.name,
        phoneNumber: owner.phoneNumber,
        email: owner.email,
        role: owner.role,
        status: owner.status
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Update owner
router.put('/owners/:ownerId', async (req, res) => {
  try {
    const { ownerId } = req.params;
    const { name, email, status } = req.body;

    const owner = await User.findById(ownerId);

    if (!owner || owner.role !== 'owner') {
      return res.status(404).json({
        success: false,
        message: 'Owner not found'
      });
    }

    // Update name if provided
    if (name && name.trim()) {
      owner.name = name.trim();
    }

    // Update email if provided
    if (email) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({
          success: false,
          message: 'Valid email address required'
        });
      }
      
      // Check if email is already taken by another user
      const existingEmail = await User.findOne({ 
        email: email.toLowerCase(),
        _id: { $ne: ownerId }
      });
      
      if (existingEmail) {
        return res.status(400).json({
          success: false,
          message: 'Email is already taken by another user'
        });
      }
      
      owner.email = email.toLowerCase();
    }

    // Update status if provided
    if (status) {
      owner.status = status;
    }

    await owner.save();

    res.json({
      success: true,
      message: 'Owner updated successfully',
      owner
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Delete owner
router.delete('/owners/:ownerId', async (req, res) => {
  try {
    const { ownerId } = req.params;

    // Check if owner has machines
    const machineCount = await Machine.countDocuments({ owner: ownerId });
    
    if (machineCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete owner with ${machineCount} active machines`
      });
    }

    const owner = await User.findByIdAndDelete(ownerId);

    if (!owner) {
      return res.status(404).json({
        success: false,
        message: 'Owner not found'
      });
    }

    res.json({
      success: true,
      message: 'Owner deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get platform statistics
router.get('/statistics', async (req, res) => {
  try {
    const totalOwners = await User.countDocuments({ role: 'owner' });
    const totalMachines = await Machine.countDocuments();
    const onlineMachines = await Machine.countDocuments({ status: { $ne: 'OFFLINE' } });
    const totalTransactions = await Transaction.countDocuments();
    
    const revenueStats = await Transaction.aggregate([
      { $match: { status: 'completed' } },
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
          }
        }
      }
    ]);

    res.json({
      success: true,
      statistics: {
        totalOwners,
        totalMachines,
        onlineMachines,
        offlineMachines: totalMachines - onlineMachines,
        totalTransactions,
        totalRevenue: revenueStats[0]?.totalRevenue || 0,
        todayRevenue: revenueStats[0]?.todayRevenue || 0
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get single owner details
router.get('/owners/:ownerId', async (req, res) => {
  try {
    const { ownerId } = req.params;

    const owner = await User.findById(ownerId).select('-otp -otpExpiry');
    
    if (!owner || owner.role !== 'owner') {
      return res.status(404).json({
        success: false,
        message: 'Owner not found'
      });
    }

    // Get machines with detailed info
    const machines = await Machine.find({ owner: ownerId })
      .populate('currentSequence', 'name totalDuration')
      .sort('-createdAt');

    // Update machine statuses
    machines.forEach(machine => machine.updateStatus());

    // Get revenue statistics
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const revenueStats = await Transaction.aggregate([
      { $match: { owner: ownerId, status: 'completed' } },
      { 
        $group: { 
          _id: null, 
          totalRevenue: { $sum: '$amount' },
          todayRevenue: {
            $sum: {
              $cond: [
                { $gte: ['$createdAt', today] },
                '$amount',
                0
              ]
            }
          },
          totalTransactions: { $sum: 1 }
        } 
      }
    ]);

    // Get recent transactions
    const recentTransactions = await Transaction.find({ owner: ownerId })
      .populate('machine', 'machineId location')
      .sort('-createdAt')
      .limit(10);

    const stats = revenueStats[0] || { totalRevenue: 0, todayRevenue: 0, totalTransactions: 0 };

    res.json({
      success: true,
      owner: {
        ...owner.toObject(),
        totalMachines: machines.length,
        activeMachines: machines.filter(m => m.status !== 'OFFLINE').length,
        totalRevenue: stats.totalRevenue,
        todayRevenue: stats.todayRevenue,
        totalTransactions: stats.totalTransactions
      },
      machines,
      recentTransactions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Add machine to owner (same as create machine but scoped to owner)
router.post('/owners/:ownerId/machines', async (req, res) => {
  try {
    const { ownerId } = req.params;
    const { machineId, location, fixedPrice, gpios } = req.body;

    // Verify owner exists
    const owner = await User.findById(ownerId);
    if (!owner || owner.role !== 'owner') {
      return res.status(400).json({
        success: false,
        message: 'Invalid owner'
      });
    }

    if (!machineId || !location || !fixedPrice) {
      return res.status(400).json({
        success: false,
        message: 'Machine ID, location, and price are required'
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

    const machine = new Machine({
      machineId,
      location,
      owner: ownerId,
      fixedPrice,
      gpios: gpios || []
    });

    await machine.save();

    res.status(201).json({
      success: true,
      message: 'Machine added successfully',
      machine
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Delete machine from owner
router.delete('/owners/:ownerId/machines/:machineId', async (req, res) => {
  try {
    const { ownerId, machineId } = req.params;

    const machine = await Machine.findOne({ _id: machineId, owner: ownerId });

    if (!machine) {
      return res.status(404).json({
        success: false,
        message: 'Machine not found for this owner'
      });
    }

    // Check if machine is currently running
    if (machine.status === 'RUNNING' || machine.processLocked) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete machine while it is running'
      });
    }

    await Machine.findByIdAndDelete(machineId);

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
