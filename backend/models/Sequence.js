const mongoose = require('mongoose');

const sequenceStepSchema = new mongoose.Schema({
  stepNumber: {
    type: Number,
    required: true,
    min: 1
  },
  gpioName: {
    type: String,
    required: true,
    trim: true
  },
  onTime: {
    type: Number,
    required: true,
    min: 0,
    comment: 'Time in seconds'
  },
  offTime: {
    type: Number,
    default: 0,
    min: 0,
    comment: 'Optional delay before next step in seconds'
  }
}, { _id: false });

const sequenceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  steps: [sequenceStepSchema],
  isDefault: {
    type: Boolean,
    default: false
  },
  totalDuration: {
    type: Number,
    default: 0,
    comment: 'Total duration in seconds (calculated)'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Calculate total duration before saving
sequenceSchema.pre('save', function(next) {
  this.totalDuration = this.steps.reduce((total, step) => {
    return total + step.onTime + step.offTime;
  }, 0);
  next();
});

module.exports = mongoose.model('Sequence', sequenceSchema);
