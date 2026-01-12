const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const SequenceStep = sequelize.define('SequenceStep', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  sequenceId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'sequences',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  stepNumber: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  gpioNumber: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  duration: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'Duration in milliseconds'
  }
}, {
  tableName: 'sequence_steps',
  timestamps: true,
  indexes: [
    {
      fields: ['sequenceId', 'stepNumber']
    }
  ]
});

module.exports = SequenceStep;
