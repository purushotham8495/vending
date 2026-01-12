const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
  machine: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Machine',
    default: null
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  eventType: {
    type: String,
    enum: [
      'ESP32_CONNECTED',
      'ESP32_DISCONNECTED',
      'SEQUENCE_START',
      'SEQUENCE_END',
      'SEQUENCE_INTERRUPTED',
      'EMERGENCY_STOP',
      'GPIO_TOGGLE',
      'OTA_START',
      'OTA_SUCCESS',
      'OTA_FAILED',
      'PAYMENT_RECEIVED',
      'PAYMENT_FAILED',
      'ERROR',
      'WARNING',
      'INFO'
    ],
    required: true
  },
  severity: {
    type: String,
    enum: ['info', 'warning', 'error', 'critical'],
    default: 'info'
  },
  message: {
    type: String,
    required: true
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  ipAddress: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Index for faster queries
logSchema.index({ machine: 1, createdAt: -1 });
logSchema.index({ eventType: 1, createdAt: -1 });
logSchema.index({ severity: 1, createdAt: -1 });

module.exports = mongoose.model('Log', logSchema);
