const Log = require('../models/Log');

class Logger {
  static async log(data) {
    try {
      const log = new Log(data);
      await log.save();
      return log;
    } catch (error) {
      console.error('Logger error:', error);
    }
  }

  static async info(message, metadata = {}, machine = null, user = null) {
    return this.log({
      eventType: 'INFO',
      severity: 'info',
      message,
      metadata,
      machine,
      user
    });
  }

  static async warning(message, metadata = {}, machine = null, user = null) {
    return this.log({
      eventType: 'WARNING',
      severity: 'warning',
      message,
      metadata,
      machine,
      user
    });
  }

  static async error(message, metadata = {}, machine = null, user = null) {
    return this.log({
      eventType: 'ERROR',
      severity: 'error',
      message,
      metadata,
      machine,
      user
    });
  }

  static async critical(message, metadata = {}, machine = null, user = null) {
    return this.log({
      eventType: 'ERROR',
      severity: 'critical',
      message,
      metadata,
      machine,
      user
    });
  }

  static async esp32Connected(machine, ipAddress) {
    return this.log({
      eventType: 'ESP32_CONNECTED',
      severity: 'info',
      message: `ESP32 connected from ${ipAddress}`,
      metadata: { ipAddress },
      machine: machine._id,
      ipAddress
    });
  }

  static async esp32Disconnected(machine) {
    return this.log({
      eventType: 'ESP32_DISCONNECTED',
      severity: 'warning',
      message: 'ESP32 disconnected (heartbeat timeout)',
      machine: machine._id
    });
  }

  static async sequenceStart(machine, sequence, transaction = null) {
    return this.log({
      eventType: 'SEQUENCE_START',
      severity: 'info',
      message: `Sequence "${sequence.name}" started`,
      metadata: {
        sequenceId: sequence._id,
        sequenceName: sequence.name,
        transactionId: transaction?._id
      },
      machine: machine._id
    });
  }

  static async sequenceEnd(machine, sequence, transaction = null) {
    return this.log({
      eventType: 'SEQUENCE_END',
      severity: 'info',
      message: `Sequence "${sequence.name}" completed`,
      metadata: {
        sequenceId: sequence._id,
        sequenceName: sequence.name,
        transactionId: transaction?._id
      },
      machine: machine._id
    });
  }

  static async sequenceInterrupted(machine, sequence, reason) {
    return this.log({
      eventType: 'SEQUENCE_INTERRUPTED',
      severity: 'warning',
      message: `Sequence interrupted: ${reason}`,
      metadata: {
        sequenceId: sequence._id,
        sequenceName: sequence.name,
        reason
      },
      machine: machine._id
    });
  }

  static async emergencyStop(machine, user) {
    return this.log({
      eventType: 'EMERGENCY_STOP',
      severity: 'critical',
      message: 'Emergency stop activated',
      metadata: {
        stoppedBy: user.phoneNumber,
        userRole: user.role
      },
      machine: machine._id,
      user: user._id
    });
  }

  static async gpioToggle(machine, gpioName, state, user = null) {
    return this.log({
      eventType: 'GPIO_TOGGLE',
      severity: 'info',
      message: `GPIO "${gpioName}" toggled to ${state}`,
      metadata: {
        gpioName,
        state,
        triggeredBy: user?.phoneNumber || 'system'
      },
      machine: machine._id,
      user: user?._id
    });
  }

  static async otaStart(machine, version, user) {
    return this.log({
      eventType: 'OTA_START',
      severity: 'info',
      message: `OTA update to version ${version} started`,
      metadata: {
        version,
        initiatedBy: user.phoneNumber
      },
      machine: machine._id,
      user: user._id
    });
  }

  static async otaSuccess(machine, version) {
    return this.log({
      eventType: 'OTA_SUCCESS',
      severity: 'info',
      message: `OTA update to version ${version} completed successfully`,
      metadata: { version },
      machine: machine._id
    });
  }

  static async otaFailed(machine, version, error) {
    return this.log({
      eventType: 'OTA_FAILED',
      severity: 'error',
      message: `OTA update to version ${version} failed: ${error}`,
      metadata: { version, error },
      machine: machine._id
    });
  }

  static async paymentReceived(machine, transaction) {
    return this.log({
      eventType: 'PAYMENT_RECEIVED',
      severity: 'info',
      message: `Payment received: ₹${transaction.amount}`,
      metadata: {
        paymentId: transaction.paymentId,
        amount: transaction.amount,
        upiId: transaction.upiId
      },
      machine: machine._id
    });
  }

  static async paymentFailed(machine, paymentId, reason) {
    return this.log({
      eventType: 'PAYMENT_FAILED',
      severity: 'error',
      message: `Payment failed: ${reason}`,
      metadata: { paymentId, reason },
      machine: machine._id
    });
  }
}

module.exports = Logger;
