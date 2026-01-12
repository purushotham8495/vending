-- ========================================
-- Seed Data for Vending Control System
-- This file contains sample data for testing
-- ========================================

USE vending_control;

-- ========================================
-- SEED USERS
-- ========================================

-- Admin user
INSERT INTO users (name, phoneNumber, email, role, status) 
VALUES ('System Admin', '9999999999', 'admin@vendingcontrol.com', 'admin', 'active')
ON DUPLICATE KEY UPDATE name='System Admin';

-- Sample owner users
INSERT INTO users (name, phoneNumber, email, role, status)
VALUES 
  ('John Doe', '8888888888', 'john@example.com', 'owner', 'active'),
  ('Jane Smith', '7777777777', 'jane@example.com', 'owner', 'active'),
  ('Bob Wilson', '6666666666', 'bob@example.com', 'owner', 'active')
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- ========================================
-- SEED SEQUENCES
-- ========================================

INSERT INTO sequences (name, description, totalDuration, isActive)
VALUES 
  ('Standard Sanitization', 'Complete sanitization cycle with UV and chemicals', 15000, TRUE),
  ('Quick Clean', 'Quick cleaning cycle for light usage', 8000, TRUE),
  ('Deep Clean', 'Deep cleaning cycle for heavy contamination', 30000, TRUE),
  ('Maintenance Mode', 'Maintenance and testing sequence', 10000, FALSE)
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- ========================================
-- SEED SEQUENCE STEPS
-- ========================================

-- Standard Sanitization sequence steps
INSERT INTO sequence_steps (sequenceId, stepNumber, gpioNumber, duration)
SELECT id, 1, 25, 3000 FROM sequences WHERE name = 'Standard Sanitization'
UNION ALL
SELECT id, 2, 26, 3000 FROM sequences WHERE name = 'Standard Sanitization'
UNION ALL
SELECT id, 3, 27, 5000 FROM sequences WHERE name = 'Standard Sanitization'
UNION ALL
SELECT id, 4, 14, 2000 FROM sequences WHERE name = 'Standard Sanitization'
UNION ALL
SELECT id, 5, 12, 2000 FROM sequences WHERE name = 'Standard Sanitization'
ON DUPLICATE KEY UPDATE duration=VALUES(duration);

-- Quick Clean sequence steps
INSERT INTO sequence_steps (sequenceId, stepNumber, gpioNumber, duration)
SELECT id, 1, 25, 2000 FROM sequences WHERE name = 'Quick Clean'
UNION ALL
SELECT id, 2, 27, 3000 FROM sequences WHERE name = 'Quick Clean'
UNION ALL
SELECT id, 3, 14, 3000 FROM sequences WHERE name = 'Quick Clean'
ON DUPLICATE KEY UPDATE duration=VALUES(duration);

-- Deep Clean sequence steps
INSERT INTO sequence_steps (sequenceId, stepNumber, gpioNumber, duration)
SELECT id, 1, 25, 5000 FROM sequences WHERE name = 'Deep Clean'
UNION ALL
SELECT id, 2, 26, 5000 FROM sequences WHERE name = 'Deep Clean'
UNION ALL
SELECT id, 3, 27, 8000 FROM sequences WHERE name = 'Deep Clean'
UNION ALL
SELECT id, 4, 12, 5000 FROM sequences WHERE name = 'Deep Clean'
UNION ALL
SELECT id, 5, 13, 5000 FROM sequences WHERE name = 'Deep Clean'
UNION ALL
SELECT id, 6, 14, 2000 FROM sequences WHERE name = 'Deep Clean'
ON DUPLICATE KEY UPDATE duration=VALUES(duration);

-- ========================================
-- SEED MACHINES (Optional - for testing)
-- ========================================

-- Get owner IDs
SET @owner1_id = (SELECT id FROM users WHERE phoneNumber = '8888888888');
SET @owner2_id = (SELECT id FROM users WHERE phoneNumber = '7777777777');

-- Insert sample machines
INSERT INTO machines (machineId, location, ownerId, status, fixedPrice, firmwareVersion)
VALUES 
  ('VM001', 'Building A, Floor 1', @owner1_id, 'OFFLINE', 20.00, '1.0.0'),
  ('VM002', 'Building A, Floor 2', @owner1_id, 'OFFLINE', 20.00, '1.0.0'),
  ('VM003', 'Building B, Floor 1', @owner2_id, 'OFFLINE', 25.00, '1.0.0')
ON DUPLICATE KEY UPDATE location=VALUES(location);

-- ========================================
-- SEED GPIOS (Optional - for testing)
-- ========================================

-- Get machine IDs
SET @machine1_id = (SELECT id FROM machines WHERE machineId = 'VM001');
SET @machine2_id = (SELECT id FROM machines WHERE machineId = 'VM002');
SET @machine3_id = (SELECT id FROM machines WHERE machineId = 'VM003');

-- Insert GPIOs for VM001
INSERT INTO gpios (machineId, gpioNumber, gpioName, currentState)
VALUES 
  (@machine1_id, 25, 'Pump 1', 'OFF'),
  (@machine1_id, 26, 'Pump 2', 'OFF'),
  (@machine1_id, 27, 'UV Light', 'OFF'),
  (@machine1_id, 14, 'Dispenser', 'OFF'),
  (@machine1_id, 12, 'Fan', 'OFF'),
  (@machine1_id, 13, 'Heater', 'OFF')
ON DUPLICATE KEY UPDATE gpioName=VALUES(gpioName);

-- Insert GPIOs for VM002
INSERT INTO gpios (machineId, gpioNumber, gpioName, currentState)
VALUES 
  (@machine2_id, 25, 'Pump 1', 'OFF'),
  (@machine2_id, 26, 'Pump 2', 'OFF'),
  (@machine2_id, 27, 'UV Light', 'OFF'),
  (@machine2_id, 14, 'Dispenser', 'OFF'),
  (@machine2_id, 12, 'Fan', 'OFF'),
  (@machine2_id, 13, 'Heater', 'OFF')
ON DUPLICATE KEY UPDATE gpioName=VALUES(gpioName);

-- ========================================
-- SEED FIRMWARES (Optional)
-- ========================================

INSERT INTO firmwares (version, filePath, description, isActive, fileSize)
VALUES 
  ('1.0.0', '/firmwares/v1.0.0.bin', 'Initial release', TRUE, 524288),
  ('1.0.1', '/firmwares/v1.0.1.bin', 'Bug fixes and improvements', FALSE, 524288)
ON DUPLICATE KEY UPDATE description=VALUES(description);

-- ========================================
-- VERIFICATION
-- ========================================

SELECT '=== SEEDED DATA SUMMARY ===' as info;

SELECT 'Users' as entity, COUNT(*) as count FROM users
UNION ALL
SELECT 'Sequences', COUNT(*) FROM sequences
UNION ALL
SELECT 'Sequence Steps', COUNT(*) FROM sequence_steps
UNION ALL
SELECT 'Machines', COUNT(*) FROM machines
UNION ALL
SELECT 'GPIOs', COUNT(*) FROM gpios
UNION ALL
SELECT 'Firmwares', COUNT(*) FROM firmwares;

SELECT 'Seed data inserted successfully!' as status;
