const mongoose = require('mongoose');

const gpioSchema = new mongoose.Schema({
  gpioNumber: {
    type: Number,
    required: true,
    min: 0,
    max: 39
  },
  gpioName: {
    type: String,
    required: true,
    trim: true
  },
  defaultState: {
    type: String,
    enum: ['ON', 'OFF'],
    default: 'OFF'
  },
  currentState: {
    type: String,
    enum: ['ON', 'OFF'],
    default: 'OFF'
  },
  relayLogic: {
    type: String,
    enum: ['LOW_ON', 'HIGH_ON'],
    default: 'LOW_ON' // LOW = ON
  }
}, { _id: true });

const machineSchema = new mongoose.Schema({
  machineId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  location: {
    type: String,
    required: true,
    trim: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  fixedPrice: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['IDLE', 'RUNNING', 'OFFLINE'],
    default: 'OFFLINE'
  },
  lastHeartbeat: {
    type: Date,
    default: null
  },
  firmwareVersion: {
    type: String,
    default: 'v1.0.0'
  },
  gpios: [gpioSchema],
  currentSequence: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Sequence',
    default: null
  },
  processLocked: {
    type: Boolean,
    default: false
  },
  pendingRestart: {
    type: Boolean,
    default: false
  },
  currentStep: {
    type: Number,
    default: 0
  },
  processStartTime: {
    type: Date,
    default: null
  },
  processEndTime: {
    type: Date,
    default: null
  },
  ipAddress: {
    type: String,
    default: null
  },
  wifiSSID: {
    type: String,
    default: null
  },
  signalStrength: {
    type: Number,
    default: null
  }
}, {
  timestamps: true
});

// Method to check if machine is online
machineSchema.methods.isOnline = function() {
  if (!this.lastHeartbeat) return false;
  const timeoutMs = parseInt(process.env.ESP32_HEARTBEAT_TIMEOUT) || 10000;
  return (Date.now() - this.lastHeartbeat.getTime()) < timeoutMs;
};

// Update status based on heartbeat
machineSchema.methods.updateStatus = function() {
  if (this.isOnline()) {
    if (this.status === 'OFFLINE') {
      this.status = 'IDLE';
    }
  } else {
    this.status = 'OFFLINE';
  }
  return this.status;
};

module.exports = mongoose.model('Machine', machineSchema);
