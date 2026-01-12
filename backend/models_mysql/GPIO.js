const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const GPIO = sequelize.define('GPIO', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  machineId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'machines',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  gpioNumber: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  gpioName: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  currentState: {
    type: DataTypes.ENUM('ON', 'OFF'),
    defaultValue: 'OFF'
  },
  lastTriggered: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'gpios',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['machineId', 'gpioNumber']
    }
  ]
});

module.exports = GPIO;
