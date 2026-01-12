const mongoose = require('mongoose');

const firmwareSchema = new mongoose.Schema({
  version: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  fileName: {
    type: String,
    required: true
  },
  filePath: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number,
    required: true
  },
  checksum: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: false
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  deployedToMachines: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Machine'
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Firmware', firmwareSchema);
