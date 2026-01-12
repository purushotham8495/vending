const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Verify JWT token
exports.authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user || user.status !== 'active') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token or user blocked'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
};

// Check if user is admin
exports.isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin only.'
    });
  }
  next();
};

// Check if user is owner or admin
exports.isOwnerOrAdmin = (req, res, next) => {
  if (req.user.role !== 'admin' && req.user.role !== 'owner') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Owner or Admin only.'
    });
  }
  next();
};

// Verify machine ownership
exports.verifyMachineOwnership = async (req, res, next) => {
  try {
    const Machine = require('../models/Machine');
    const machineId = req.params.machineId || req.body.machineId;
    
    if (!machineId) {
      return res.status(400).json({
        success: false,
        message: 'Machine ID required'
      });
    }

    const machine = await Machine.findById(machineId);
    
    if (!machine) {
      return res.status(404).json({
        success: false,
        message: 'Machine not found'
      });
    }

    // Admin can access all machines
    if (req.user.role === 'admin') {
      req.machine = machine;
      return next();
    }

    // Owner can only access their machines
    if (machine.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Not your machine.'
      });
    }

    req.machine = machine;
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
