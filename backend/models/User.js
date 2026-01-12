const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  phoneNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    match: /^[0-9]{10}$/
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  },
  role: {
    type: String,
    enum: ['admin', 'owner'],
    default: 'owner'
  },
  status: {
    type: String,
    enum: ['active', 'blocked'],
    default: 'active'
  },
  otp: {
    type: String,
    default: null
  },
  otpExpiry: {
    type: Date,
    default: null
  },
  lastLogin: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Hash OTP before saving
userSchema.pre('save', async function(next) {
  if (this.isModified('otp') && this.otp) {
    this.otp = await bcrypt.hash(this.otp, 10);
  }
  next();
});

// Method to compare OTP
userSchema.methods.compareOTP = async function(candidateOTP) {
  return await bcrypt.compare(candidateOTP, this.otp);
};

// Virtual field for total machines
userSchema.virtual('totalMachines', {
  ref: 'Machine',
  localField: '_id',
  foreignField: 'owner',
  count: true
});

module.exports = mongoose.model('User', userSchema);
