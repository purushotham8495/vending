/**
 * Database Seed Script
 * 
 * This script populates the database with initial data
 * Run: node scripts/seed.js
 */

require('dotenv').config();
const { sequelize, testConnection } = require('../config/database');
const { User, Sequence, SequenceStep, Machine, GPIO, Firmware } = require('../models_mysql');

async function seed() {
  console.log('\n╔═══════════════════════════════════════════════════════════╗');
  console.log('║          DATABASE SEED SCRIPT                             ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');

  try {
    // Test connection
    await testConnection();

    console.log('🌱 Seeding database...\n');

    // 1. Create Admin User
    console.log('👤 Creating admin user...');
    const [admin] = await User.findOrCreate({
      where: { phoneNumber: '9999999999' },
      defaults: {
        name: 'System Admin',
        email: 'admin@vendingcontrol.com',
        role: 'admin',
        status: 'active'
      }
    });
    console.log(`   ✓ Admin: ${admin.name} (${admin.phoneNumber})`);

    // 2. Create Sample Owners
    console.log('\n👥 Creating sample owners...');
    const owners = await Promise.all([
      User.findOrCreate({
        where: { phoneNumber: '8888888888' },
        defaults: {
          name: 'John Doe',
          email: 'john@example.com',
          role: 'owner',
          status: 'active'
        }
      }),
      User.findOrCreate({
        where: { phoneNumber: '7777777777' },
        defaults: {
          name: 'Jane Smith',
          email: 'jane@example.com',
          role: 'owner',
          status: 'active'
        }
      }),
      User.findOrCreate({
        where: { phoneNumber: '6666666666' },
        defaults: {
          name: 'Bob Wilson',
          email: 'bob@example.com',
          role: 'owner',
          status: 'active'
        }
      })
    ]);
    owners.forEach(([owner]) => {
      console.log(`   ✓ Owner: ${owner.name} (${owner.phoneNumber})`);
    });

    // 3. Create Sequences
    console.log('\n🔄 Creating sequences...');
    const sequences = await Promise.all([
      Sequence.findOrCreate({
        where: { name: 'Standard Sanitization' },
        defaults: {
          description: 'Complete sanitization cycle with UV and chemicals',
          totalDuration: 15000,
          isActive: true
        }
      }),
      Sequence.findOrCreate({
        where: { name: 'Quick Clean' },
        defaults: {
          description: 'Quick cleaning cycle for light usage',
          totalDuration: 8000,
          isActive: true
        }
      }),
      Sequence.findOrCreate({
        where: { name: 'Deep Clean' },
        defaults: {
          description: 'Deep cleaning cycle for heavy contamination',
          totalDuration: 30000,
          isActive: true
        }
      })
    ]);
    sequences.forEach(([seq]) => {
      console.log(`   ✓ Sequence: ${seq.name} (${seq.totalDuration}ms)`);
    });

    // 4. Create Sequence Steps
    console.log('\n📋 Creating sequence steps...');
    
    // Standard Sanitization steps
    const standardSeq = sequences[0][0];
    await SequenceStep.bulkCreate([
      { sequenceId: standardSeq.id, stepNumber: 1, gpioNumber: 25, duration: 3000 },
      { sequenceId: standardSeq.id, stepNumber: 2, gpioNumber: 26, duration: 3000 },
      { sequenceId: standardSeq.id, stepNumber: 3, gpioNumber: 27, duration: 5000 },
      { sequenceId: standardSeq.id, stepNumber: 4, gpioNumber: 14, duration: 2000 },
      { sequenceId: standardSeq.id, stepNumber: 5, gpioNumber: 12, duration: 2000 }
    ], { ignoreDuplicates: true });
    console.log(`   ✓ Standard Sanitization: 5 steps`);

    // Quick Clean steps
    const quickSeq = sequences[1][0];
    await SequenceStep.bulkCreate([
      { sequenceId: quickSeq.id, stepNumber: 1, gpioNumber: 25, duration: 2000 },
      { sequenceId: quickSeq.id, stepNumber: 2, gpioNumber: 27, duration: 3000 },
      { sequenceId: quickSeq.id, stepNumber: 3, gpioNumber: 14, duration: 3000 }
    ], { ignoreDuplicates: true });
    console.log(`   ✓ Quick Clean: 3 steps`);

    // Deep Clean steps
    const deepSeq = sequences[2][0];
    await SequenceStep.bulkCreate([
      { sequenceId: deepSeq.id, stepNumber: 1, gpioNumber: 25, duration: 5000 },
      { sequenceId: deepSeq.id, stepNumber: 2, gpioNumber: 26, duration: 5000 },
      { sequenceId: deepSeq.id, stepNumber: 3, gpioNumber: 27, duration: 8000 },
      { sequenceId: deepSeq.id, stepNumber: 4, gpioNumber: 12, duration: 5000 },
      { sequenceId: deepSeq.id, stepNumber: 5, gpioNumber: 13, duration: 5000 },
      { sequenceId: deepSeq.id, stepNumber: 6, gpioNumber: 14, duration: 2000 }
    ], { ignoreDuplicates: true });
    console.log(`   ✓ Deep Clean: 6 steps`);

    // 5. Create Sample Machines (Optional)
    console.log('\n🤖 Creating sample machines...');
    const owner1 = owners[0][0];
    const owner2 = owners[1][0];

    const machines = await Promise.all([
      Machine.findOrCreate({
        where: { machineId: 'VM001' },
        defaults: {
          location: 'Building A, Floor 1',
          ownerId: owner1.id,
          status: 'OFFLINE',
          fixedPrice: 20.00,
          firmwareVersion: '1.0.0'
        }
      }),
      Machine.findOrCreate({
        where: { machineId: 'VM002' },
        defaults: {
          location: 'Building A, Floor 2',
          ownerId: owner1.id,
          status: 'OFFLINE',
          fixedPrice: 20.00,
          firmwareVersion: '1.0.0'
        }
      }),
      Machine.findOrCreate({
        where: { machineId: 'VM003' },
        defaults: {
          location: 'Building B, Floor 1',
          ownerId: owner2.id,
          status: 'OFFLINE',
          fixedPrice: 25.00,
          firmwareVersion: '1.0.0'
        }
      })
    ]);
    machines.forEach(([machine]) => {
      console.log(`   ✓ Machine: ${machine.machineId} at ${machine.location}`);
    });

    // 6. Create GPIOs for machines
    console.log('\n⚡ Creating GPIOs for machines...');
    for (const [machine] of machines) {
      await GPIO.bulkCreate([
        { machineId: machine.id, gpioNumber: 25, gpioName: 'Pump 1', currentState: 'OFF' },
        { machineId: machine.id, gpioNumber: 26, gpioName: 'Pump 2', currentState: 'OFF' },
        { machineId: machine.id, gpioNumber: 27, gpioName: 'UV Light', currentState: 'OFF' },
        { machineId: machine.id, gpioNumber: 14, gpioName: 'Dispenser', currentState: 'OFF' },
        { machineId: machine.id, gpioNumber: 12, gpioName: 'Fan', currentState: 'OFF' },
        { machineId: machine.id, gpioNumber: 13, gpioName: 'Heater', currentState: 'OFF' }
      ], { ignoreDuplicates: true });
      console.log(`   ✓ ${machine.machineId}: 6 GPIOs configured`);
    }

    // 7. Create Firmware entries
    console.log('\n💾 Creating firmware entries...');
    await Firmware.findOrCreate({
      where: { version: '1.0.0' },
      defaults: {
        filePath: '/firmwares/v1.0.0.bin',
        description: 'Initial release',
        releaseNotes: 'First stable release',
        isActive: true,
        fileSize: 524288
      }
    });
    console.log(`   ✓ Firmware v1.0.0`);

    // Summary
    console.log('\n╔═══════════════════════════════════════════════════════════╗');
    console.log('║          SEEDING COMPLETED SUCCESSFULLY! ✅                ║');
    console.log('╚═══════════════════════════════════════════════════════════╝\n');

    const userCount = await User.count();
    const machineCount = await Machine.count();
    const sequenceCount = await Sequence.count();
    const gpioCount = await GPIO.count();

    console.log('📊 Summary:');
    console.log(`   • Users: ${userCount}`);
    console.log(`   • Machines: ${machineCount}`);
    console.log(`   • Sequences: ${sequenceCount}`);
    console.log(`   • GPIOs: ${gpioCount}`);

    console.log('\n🚀 Next steps:');
    console.log('   1. Start server: npm start');
    console.log('   2. Login with admin: 9999999999');
    console.log('   3. Or owner: 8888888888\n');

  } catch (error) {
    console.error('\n❌ Seeding failed:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// Run seed
seed();
