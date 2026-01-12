const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Machine = sequelize.define('Machine', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  machineId: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  location: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  ownerId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  status: {
    type: DataTypes.ENUM('IDLE', 'RUNNING', 'OFFLINE'),
    defaultValue: 'OFFLINE'
  },
  fixedPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0
  },
  firmwareVersion: {
    type: DataTypes.STRING(20),
    defaultValue: '1.0.0'
  },
  lastHeartbeat: {
    type: DataTypes.DATE,
    allowNull: true
  },
  ipAddress: {
    type: DataTypes.STRING(45),
    allowNull: true
  },
  processLocked: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  pendingRestart: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  currentSequenceId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'sequences',
      key: 'id'
    }
  }
}, {
  tableName: 'machines',
  timestamps: true
});

// Instance method to update status based on heartbeat
Machine.prototype.updateStatus = function() {
  if (!this.lastHeartbeat) {
    this.status = 'OFFLINE';
    return;
  }
  
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  if (new Date(this.lastHeartbeat) < fiveMinutesAgo) {
    this.status = 'OFFLINE';
  } else if (this.processLocked) {
    this.status = 'RUNNING';
  } else {
    this.status = 'IDLE';
  }
};

module.exports = Machine;
