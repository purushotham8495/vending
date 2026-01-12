const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Sequence = sequelize.define('Sequence', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  totalDuration: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Total duration in milliseconds'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'sequences',
  timestamps: true
});

module.exports = Sequence;
