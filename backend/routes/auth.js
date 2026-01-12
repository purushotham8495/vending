const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const OTPService = require('../utils/otpService');
const { authenticate } = require('../middleware/auth');

// Request OTP
router.post('/request-otp', async (req, res) => {
  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber || !/^[0-9]{10}$/.test(phoneNumber)) {
      return res.status(400).json({
        success: false,
        message: 'Valid 10-digit phone number required'
      });
    }

    let user = await User.findOne({ phoneNumber });

    // User must be created by admin first
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Account not found. Please contact admin to create your account.'
      });
    }

    // Check if user is blocked
    if (user.status === 'blocked') {
      return res.status(403).json({
        success: false,
        message: 'Your account has been blocked. Contact admin.'
      });
    }

    // Generate and save OTP
    const otp = OTPService.generateOTP();
    user.otp = otp; // Will be hashed by pre-save hook
    user.otpExpiry = OTPService.getOTPExpiryTime();
    await user.save();

    // Send OTP
    console.log(`📱 OTP for ${phoneNumber}: ${otp}`); // For development
    await OTPService.sendOTP(phoneNumber, otp);

    res.json({
      success: true,
      message: 'OTP sent successfully',
      expiryTime: user.otpExpiry
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Verify OTP and login
router.post('/verify-otp', async (req, res) => {
  try {
    const { phoneNumber, otp } = req.body;

    if (!phoneNumber || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Phone number and OTP required'
      });
    }

    const user = await User.findOne({ phoneNumber });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check OTP expiry
    if (OTPService.isOTPExpired(user.otpExpiry)) {
      return res.status(400).json({
        success: false,
        message: 'OTP expired. Request a new one.'
      });
    }

    // Verify OTP
    const isValid = await user.compareOTP(otp);

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP'
      });
    }

    // Clear OTP
    user.otp = null;
    user.otpExpiry = null;
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        phoneNumber: user.phoneNumber,
        email: user.email,
        role: user.role,
        status: user.status
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get current user
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-otp -otpExpiry')
      .populate('totalMachines');

    res.json({
      success: true,
      user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Logout (optional - mainly for clearing client-side token)
router.post('/logout', authenticate, async (req, res) => {
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

module.exports = router;
