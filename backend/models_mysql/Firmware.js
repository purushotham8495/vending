const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Firmware = sequelize.define('Firmware', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  version: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true
  },
  filePath: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  releaseNotes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  fileSize: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'File size in bytes'
  }
}, {
  tableName: 'firmwares',
  timestamps: true
});

module.exports = Firmware;
