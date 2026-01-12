const Machine = require('../models/Machine');
const Sequence = require('../models/Sequence');
const Transaction = require('../models/Transaction');
const Logger = require('../utils/logger');

class ProcessManager {
  constructor() {
    this.runningProcesses = new Map(); // machineId -> interval
  }

  /**
   * Start a sequence on a machine
   */
  async startSequence(machineId, sequenceId, transactionId = null) {
    try {
      const machine = await Machine.findById(machineId);
      const sequence = await Sequence.findById(sequenceId);

      if (!machine) {
        throw new Error('Machine not found');
      }

      if (!sequence) {
        throw new Error('Sequence not found');
      }

      // Check if machine is online
      if (!machine.isOnline()) {
        throw new Error('Machine is offline');
      }

      // Check if machine is already running
      if (machine.processLocked) {
        throw new Error('Machine is already running a sequence');
      }

      // Lock the machine
      machine.processLocked = true;
      machine.currentSequence = sequenceId;
      machine.currentStep = 0;
      machine.processStartTime = new Date();
      machine.status = 'RUNNING';
      await machine.save();

      // Update transaction if provided
      let transaction = null;
      if (transactionId) {
        transaction = await Transaction.findById(transactionId);
        if (transaction) {
          transaction.sequenceStarted = true;
          transaction.sequenceStartTime = new Date();
          transaction.sequenceId = sequenceId;
          await transaction.save();
        }
      }

      await Logger.sequenceStart(machine, sequence, transaction);

      // Execute sequence steps
      await this.executeSequence(machine, sequence, transaction);

      return {
        success: true,
        message: 'Sequence started successfully'
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Execute sequence steps
   */
  async executeSequence(machine, sequence, transaction = null) {
    const steps = sequence.steps;
    let currentStepIndex = 0;

    const executeNextStep = async () => {
      try {
        // Reload machine to check status
        const updatedMachine = await Machine.findById(machine._id);

        // Check if process was stopped
        if (!updatedMachine.processLocked) {
          this.stopProcess(machine._id.toString());
          return;
        }

        // Check if machine went offline
        if (!updatedMachine.isOnline()) {
          await Logger.sequenceInterrupted(updatedMachine, sequence, 'Machine went offline');
          await this.unlockMachine(machine._id);
          return;
        }

        if (currentStepIndex >= steps.length) {
          // Sequence completed
          await this.completeSequence(updatedMachine, sequence, transaction);
          return;
        }

        const step = steps[currentStepIndex];
        updatedMachine.currentStep = currentStepIndex + 1;

        // Find GPIO by name
        const gpio = updatedMachine.gpios.find(g => g.gpioName === step.gpioName);

        if (gpio) {
          // Turn GPIO ON
          gpio.currentState = 'ON';
          await updatedMachine.save();

          await Logger.info(
            `Step ${currentStepIndex + 1}: ${step.gpioName} ON for ${step.onTime}s`,
            { step: currentStepIndex + 1, gpioName: step.gpioName, onTime: step.onTime },
            updatedMachine._id
          );

          // Schedule GPIO OFF and next step
          setTimeout(async () => {
            const m = await Machine.findById(machine._id);
            const g = m.gpios.find(gp => gp.gpioName === step.gpioName);
            if (g) {
              g.currentState = 'OFF';
              await m.save();
            }

            // Wait for offTime before next step
            if (step.offTime > 0) {
              setTimeout(() => {
                currentStepIndex++;
                executeNextStep();
              }, step.offTime * 1000);
            } else {
              currentStepIndex++;
              executeNextStep();
            }
          }, step.onTime * 1000);
        } else {
          // GPIO not found, skip to next step
          await Logger.warning(
            `GPIO "${step.gpioName}" not found in machine configuration`,
            { step: currentStepIndex + 1 },
            updatedMachine._id
          );
          currentStepIndex++;
          executeNextStep();
        }
      } catch (error) {
        console.error('Error in executeNextStep:', error);
        await this.unlockMachine(machine._id);
      }
    };

    // Start executing steps
    executeNextStep();
  }

  /**
   * Complete sequence
   */
  async completeSequence(machine, sequence, transaction = null) {
    try {
      machine.processLocked = false;
      machine.currentSequence = null;
      machine.currentStep = 0;
      machine.processEndTime = new Date();
      machine.status = 'IDLE';

      // Turn off all GPIOs
      machine.gpios.forEach(gpio => {
        gpio.currentState = 'OFF';
      });

      await machine.save();

      // Update transaction
      if (transaction) {
        transaction.sequenceCompleted = true;
        transaction.sequenceEndTime = new Date();
        transaction.status = 'completed';
        await transaction.save();
      }

      await Logger.sequenceEnd(machine, sequence, transaction);

      // Remove from running processes
      this.stopProcess(machine._id.toString());
    } catch (error) {
      console.error('Error completing sequence:', error);
    }
  }

  /**
   * Stop process (emergency stop)
   */
  async emergencyStop(machineId, userId) {
    try {
      const machine = await Machine.findById(machineId);
      const User = require('../models/User');
      const user = await User.findById(userId);

      if (!machine) {
        throw new Error('Machine not found');
      }

      // Turn off all GPIOs
      machine.gpios.forEach(gpio => {
        gpio.currentState = 'OFF';
      });

      machine.processLocked = false;
      machine.currentSequence = null;
      machine.currentStep = 0;
      machine.processEndTime = new Date();
      machine.status = 'IDLE';
      await machine.save();

      await Logger.emergencyStop(machine, user);

      this.stopProcess(machineId.toString());

      return {
        success: true,
        message: 'Emergency stop executed successfully'
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Unlock machine
   */
  async unlockMachine(machineId) {
    try {
      const machine = await Machine.findById(machineId);
      
      if (machine) {
        machine.gpios.forEach(gpio => {
          gpio.currentState = 'OFF';
        });
        
        machine.processLocked = false;
        machine.currentSequence = null;
        machine.currentStep = 0;
        machine.status = 'IDLE';
        await machine.save();
      }

      this.stopProcess(machineId.toString());
    } catch (error) {
      console.error('Error unlocking machine:', error);
    }
  }

  /**
   * Stop process tracking
   */
  stopProcess(machineId) {
    if (this.runningProcesses.has(machineId)) {
      clearInterval(this.runningProcesses.get(machineId));
      this.runningProcesses.delete(machineId);
    }
  }

  /**
   * Restart sequence after reconnection
   */
  async restartSequenceAfterReconnect(machineId) {
    try {
      const machine = await Machine.findById(machineId);

      if (!machine || !machine.processLocked || !machine.currentSequence) {
        return;
      }

      // Check if process was started recently (within last 10 minutes)
      const timeSinceStart = Date.now() - machine.processStartTime.getTime();
      if (timeSinceStart > 10 * 60 * 1000) {
        // Too old, unlock machine
        await this.unlockMachine(machineId);
        return;
      }

      const sequence = await Sequence.findById(machine.currentSequence);
      
      if (!sequence) {
        await this.unlockMachine(machineId);
        return;
      }

      await Logger.info(
        'Restarting interrupted sequence after reconnection',
        { sequenceName: sequence.name, currentStep: machine.currentStep },
        machine._id
      );

      // Restart the sequence from beginning
      machine.currentStep = 0;
      await machine.save();

      await this.executeSequence(machine, sequence);
    } catch (error) {
      console.error('Error restarting sequence:', error);
    }
  }
}

// Singleton instance
const processManager = new ProcessManager();

module.exports = processManager;
