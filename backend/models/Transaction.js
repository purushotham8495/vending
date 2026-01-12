const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  machine: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Machine',
    required: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  paymentId: {
    type: String,
    required: true,
    unique: true
  },
  orderId: {
    type: String,
    default: null
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'INR'
  },
  upiId: {
    type: String,
    default: null
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  sequenceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Sequence',
    default: null
  },
  sequenceStarted: {
    type: Boolean,
    default: false
  },
  sequenceCompleted: {
    type: Boolean,
    default: false
  },
  sequenceStartTime: {
    type: Date,
    default: null
  },
  sequenceEndTime: {
    type: Date,
    default: null
  },
  razorpaySignature: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Index for faster queries
transactionSchema.index({ machine: 1, createdAt: -1 });
transactionSchema.index({ owner: 1, createdAt: -1 });
transactionSchema.index({ paymentId: 1 });

module.exports = mongoose.model('Transaction', transactionSchema);
