const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const Machine = require('../models/Machine');
const Transaction = require('../models/Transaction');
const Sequence = require('../models/Sequence');
const Logger = require('../utils/logger');
const processManager = require('../services/processManager');

/**
 * Razorpay Webhook Handler
 * PUBLIC ENDPOINT - No authentication required
 * 
 * This endpoint receives payment notifications from Razorpay
 * Payment is collected externally (QR code, payment link, etc.)
 * This webhook only stores transaction history and triggers sequences
 * 
 * WEBHOOK URL: https://yourdomain.com/api/razorpay/webhook
 */
router.post('/webhook', async (req, res) => {
  try {
    console.log('📥 Webhook received:', new Date().toISOString());
    console.log('Event:', req.body.event);
    
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    
    if (!webhookSecret) {
      console.error('❌ RAZORPAY_WEBHOOK_SECRET not configured in .env');
      return res.status(500).json({
        success: false,
        message: 'Webhook secret not configured'
      });
    }

    const signature = req.headers['x-razorpay-signature'];

    if (!signature) {
      console.error('❌ Missing signature header');
      return res.status(400).json({
        success: false,
        message: 'Missing signature'
      });
    }

    // Verify webhook signature
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(JSON.stringify(req.body))
      .digest('hex');

    if (signature !== expectedSignature) {
      console.error('❌ Invalid webhook signature');
      console.error('Received:', signature);
      console.error('Expected:', expectedSignature);
      return res.status(400).json({
        success: false,
        message: 'Invalid signature'
      });
    }

    console.log('✅ Signature verified');

    const event = req.body.event;
    const payload = req.body.payload?.payment?.entity;

    if (!payload) {
      console.error('❌ Invalid payload structure');
      return res.status(400).json({
        success: false,
        message: 'Invalid payload'
      });
    }

    if (event === 'payment.captured') {
      await handlePaymentCaptured(payload);
    } else if (event === 'payment.failed') {
      await handlePaymentFailed(payload);
    } else {
      console.log(`ℹ️  Unhandled event: ${event}`);
    }

    // Always respond with 200 to acknowledge receipt
    res.json({ 
      success: true,
      message: 'Webhook processed',
      event: event
    });
  } catch (error) {
    console.error('❌ Webhook error:', error);
    // Still return 200 to prevent Razorpay from retrying
    res.status(200).json({
      success: false,
      message: 'Error processing webhook',
      error: error.message
    });
  }
});

/**
 * Handle successful payment
 * Payment must include machineId in description or notes
 */
async function handlePaymentCaptured(payment) {
  try {
    const { 
      id: paymentId, 
      amount, 
      order_id, 
      description, 
      vpa, 
      method,
      email,
      contact,
      notes 
    } = payment;

    console.log(`💰 Processing payment: ${paymentId}`);
    console.log(`   Amount: ₹${amount / 100}`);
    console.log(`   Method: ${method}`);
    console.log(`   Description: ${description}`);
    console.log(`   Notes:`, notes);

    // Extract machine ID from description or notes
    const machineId = description || notes?.machine_id || notes?.machineId;

    if (!machineId) {
      console.error('❌ Machine ID not found in payment:', paymentId);
      console.error('   Description:', description);
      console.error('   Notes:', notes);
      throw new Error('Machine ID not found in payment. Please include machine ID in description or notes.machine_id');
    }

    console.log(`🔍 Looking for machine: ${machineId}`);

    const machine = await Machine.findOne({ machineId }).populate('owner');

    if (!machine) {
      console.error(`❌ Machine not found: ${machineId}`);
      throw new Error(`Machine not found: ${machineId}. Please create the machine in admin dashboard first.`);
    }

    console.log(`✅ Machine found: ${machine.machineId} at ${machine.location}`);

    // Check if transaction already exists (prevent duplicates)
    let transaction = await Transaction.findOne({ paymentId });

    if (transaction) {
      console.log(`⚠️  Transaction already exists: ${paymentId}`);
      console.log(`   Skipping duplicate processing`);
      return; // Don't start sequence again
    }

    // Create new transaction record
    transaction = new Transaction({
      machine: machine._id,
      owner: machine.owner._id,
      paymentId,
      orderId: order_id || null,
      amount: amount / 100, // Razorpay amount is in paise, convert to rupees
      currency: payment.currency || 'INR',
      upiId: vpa || null,
      status: 'completed'
    });
    await transaction.save();

    console.log(`✅ Transaction recorded:`);
    console.log(`   ID: ${transaction._id}`);
    console.log(`   Payment ID: ${paymentId}`);
    console.log(`   Amount: ₹${transaction.amount}`);
    console.log(`   Machine: ${machineId}`);
    console.log(`   Owner: ${machine.owner.phoneNumber}`);

    await Logger.paymentReceived(machine, transaction);

    // Get default sequence
    let sequence = await Sequence.findOne({ isDefault: true });

    if (!sequence) {
      console.error('❌ No default sequence found');
      console.error('   Please create a default sequence in admin dashboard');
      throw new Error('No default sequence found');
    }

    console.log(`📋 Found sequence: ${sequence.name} (${sequence.steps.length} steps, ${sequence.totalDuration}s)`);

    // Check if machine is online and available
    if (!machine.isOnline()) {
      console.warn(`⚠️  Machine ${machineId} is OFFLINE`);
      console.warn(`   Sequence will start when machine comes online`);
      // Update transaction status to indicate sequence pending
      transaction.status = 'completed'; // Payment completed but sequence pending
      transaction.sequenceStarted = false;
      await transaction.save();
      return;
    }

    if (machine.processLocked) {
      console.warn(`⚠️  Machine ${machineId} is BUSY (process locked)`);
      console.warn(`   Cannot start sequence now`);
      return;
    }

    // Start the cleaning/operation sequence
    console.log(`🚀 Starting sequence "${sequence.name}" on ${machineId}`);
    await processManager.startSequence(machine._id, sequence._id, transaction._id);
    
    console.log(`✅ Payment processing complete!`);

  } catch (error) {
    console.error('❌ Error handling payment:', error.message);
    console.error(error.stack);
  }
}

/**
 * Handle failed payment
 */
async function handlePaymentFailed(payment) {
  try {
    const { id: paymentId, description, error_reason, amount } = payment;
    const machineId = description || payment.notes?.machine_id;

    console.log(`❌ Payment failed: ${paymentId} - ${error_reason}`);

    if (machineId) {
      const machine = await Machine.findOne({ machineId });
      if (machine) {
        await Logger.paymentFailed(machine, paymentId, error_reason);
        
        // Optionally record failed transaction
        const existingTransaction = await Transaction.findOne({ paymentId });
        if (!existingTransaction) {
          const transaction = new Transaction({
            machine: machine._id,
            owner: machine.owner,
            paymentId,
            amount: amount ? amount / 100 : 0,
            status: 'failed'
          });
          await transaction.save();
        }
      }
    }
  } catch (error) {
    console.error('Error handling failed payment:', error);
  }
}

/**
 * Get machine details for payment (public endpoint)
 * Used to display machine info before payment
 */
router.get('/machine-info/:machineId', async (req, res) => {
  try {
    const { machineId } = req.params;

    const machine = await Machine.findOne({ machineId })
      .select('machineId location fixedPrice status');

    if (!machine) {
      return res.status(404).json({
        success: false,
        message: 'Machine not found'
      });
    }

    res.json({
      success: true,
      machine: {
        machineId: machine.machineId,
        location: machine.location,
        price: machine.fixedPrice,
        status: machine.status,
        available: machine.status !== 'OFFLINE' && !machine.processLocked
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
