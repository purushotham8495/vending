const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Log = sequelize.define('Log', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  machineId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'machines',
      key: 'id'
    }
  },
  level: {
    type: DataTypes.ENUM('info', 'warning', 'error', 'critical'),
    defaultValue: 'info'
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  source: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'e.g., ESP32, API, System'
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true
  }
}, {
  tableName: 'logs',
  timestamps: true,
  indexes: [
    {
      fields: ['machineId']
    },
    {
      fields: ['level']
    },
    {
      fields: ['createdAt']
    }
  ]
});

module.exports = Log;
