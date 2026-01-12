const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const { sequelize } = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  phoneNumber: {
    type: DataTypes.STRING(10),
    allowNull: false,
    unique: true,
    validate: {
      is: /^[0-9]{10}$/
    }
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    },
    set(value) {
      this.setDataValue('email', value.toLowerCase());
    }
  },
  role: {
    type: DataTypes.ENUM('admin', 'owner'),
    defaultValue: 'owner',
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('active', 'blocked'),
    defaultValue: 'active',
    allowNull: false
  },
  otp: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  otpExpiry: {
    type: DataTypes.DATE,
    allowNull: true
  },
  lastLogin: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'users',
  timestamps: true,
  hooks: {
    beforeSave: async (user) => {
      // Hash OTP before saving
      if (user.changed('otp') && user.otp) {
        user.otp = await bcrypt.hash(user.otp, 10);
      }
    }
  }
});

// Instance method to compare OTP
User.prototype.compareOTP = async function(candidateOTP) {
  return await bcrypt.compare(candidateOTP, this.otp);
};

module.exports = User;
