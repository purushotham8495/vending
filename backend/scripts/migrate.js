/**
 * Database Migration Script
 * 
 * This script creates all tables using Sequelize models
 * Run: node scripts/migrate.js
 */

require('dotenv').config();
const { sequelize, testConnection, syncDatabase } = require('../config/database');
const models = require('../models_mysql');

async function migrate() {
  console.log('\n╔═══════════════════════════════════════════════════════════╗');
  console.log('║          DATABASE MIGRATION SCRIPT                        ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');

  try {
    // Test connection
    console.log('📡 Testing database connection...');
    await testConnection();

    // Sync database (create tables)
    console.log('\n📦 Creating/updating database tables...');
    
    // Set to true to drop all tables and recreate (WARNING: DATA LOSS)
    const forceSync = process.argv.includes('--force');
    
    if (forceSync) {
      console.log('⚠️  WARNING: Force sync enabled - all tables will be dropped!');
      const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
      });

      const answer = await new Promise(resolve => {
        readline.question('Are you sure? Type "yes" to continue: ', resolve);
      });
      readline.close();

      if (answer.toLowerCase() !== 'yes') {
        console.log('❌ Migration cancelled');
        process.exit(0);
      }
    }

    await syncDatabase(forceSync);

    // Show created tables
    const [tables] = await sequelize.query('SHOW TABLES');
    console.log('\n✅ Tables created/updated:');
    tables.forEach(table => {
      const tableName = Object.values(table)[0];
      console.log(`   ✓ ${tableName}`);
    });

    console.log('\n╔═══════════════════════════════════════════════════════════╗');
    console.log('║          MIGRATION COMPLETED SUCCESSFULLY! ✅              ║');
    console.log('╚═══════════════════════════════════════════════════════════╝\n');

    console.log('Next steps:');
    console.log('  1. Run: node scripts/seed.js (to add sample data)');
    console.log('  2. Start server: npm start\n');

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// Run migration
migrate();
