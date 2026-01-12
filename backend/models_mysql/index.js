const { sequelize } = require('../config/database');
const User = require('./User');
const Machine = require('./Machine');
const GPIO = require('./GPIO');
const Sequence = require('./Sequence');
const SequenceStep = require('./SequenceStep');
const Transaction = require('./Transaction');
const Firmware = require('./Firmware');
const Log = require('./Log');

// ==================== ASSOCIATIONS ====================

// User - Machine (One-to-Many)
User.hasMany(Machine, {
  foreignKey: 'ownerId',
  as: 'machines',
  onDelete: 'CASCADE'
});
Machine.belongsTo(User, {
  foreignKey: 'ownerId',
  as: 'owner'
});

// Machine - GPIO (One-to-Many)
Machine.hasMany(GPIO, {
  foreignKey: 'machineId',
  as: 'gpios',
  onDelete: 'CASCADE'
});
GPIO.belongsTo(Machine, {
  foreignKey: 'machineId',
  as: 'machine'
});

// Machine - Sequence (Many-to-One for current sequence)
Machine.belongsTo(Sequence, {
  foreignKey: 'currentSequenceId',
  as: 'currentSequence'
});

// Sequence - SequenceStep (One-to-Many)
Sequence.hasMany(SequenceStep, {
  foreignKey: 'sequenceId',
  as: 'steps',
  onDelete: 'CASCADE'
});
SequenceStep.belongsTo(Sequence, {
  foreignKey: 'sequenceId',
  as: 'sequence'
});

// Transaction - Machine (Many-to-One)
Transaction.belongsTo(Machine, {
  foreignKey: 'machineId',
  as: 'machine'
});
Machine.hasMany(Transaction, {
  foreignKey: 'machineId',
  as: 'transactions'
});

// Transaction - User (Owner)
Transaction.belongsTo(User, {
  foreignKey: 'ownerId',
  as: 'owner'
});
User.hasMany(Transaction, {
  foreignKey: 'ownerId',
  as: 'ownerTransactions'
});

// Transaction - User (Customer)
Transaction.belongsTo(User, {
  foreignKey: 'customerId',
  as: 'customer'
});
User.hasMany(Transaction, {
  foreignKey: 'customerId',
  as: 'customerTransactions'
});

// Transaction - Sequence
Transaction.belongsTo(Sequence, {
  foreignKey: 'sequenceId',
  as: 'sequence'
});

// Log - Machine
Log.belongsTo(Machine, {
  foreignKey: 'machineId',
  as: 'machine'
});
Machine.hasMany(Log, {
  foreignKey: 'machineId',
  as: 'logs'
});

// ==================== EXPORT ====================

module.exports = {
  sequelize,
  User,
  Machine,
  GPIO,
  Sequence,
  SequenceStep,
  Transaction,
  Firmware,
  Log
};
