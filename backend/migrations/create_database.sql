-- ========================================
-- MySQL Database Schema for Vending Control System
-- Created: 2026-01-09
-- ========================================

-- Drop existing database (WARNING: This will delete all data!)
-- DROP DATABASE IF EXISTS vending_control;

-- Create database
CREATE DATABASE IF NOT EXISTS vending_control
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE vending_control;

-- ========================================
-- USERS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  phoneNumber VARCHAR(10) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  role ENUM('admin', 'owner') DEFAULT 'owner' NOT NULL,
  status ENUM('active', 'blocked') DEFAULT 'active' NOT NULL,
  otp VARCHAR(255) NULL,
  otpExpiry DATETIME NULL,
  lastLogin DATETIME NULL,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_phoneNumber (phoneNumber),
  INDEX idx_email (email),
  INDEX idx_role (role),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- SEQUENCES TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS sequences (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT NULL,
  totalDuration INT DEFAULT 0 COMMENT 'Total duration in milliseconds',
  isActive BOOLEAN DEFAULT TRUE,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_isActive (isActive)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- MACHINES TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS machines (
  id INT AUTO_INCREMENT PRIMARY KEY,
  machineId VARCHAR(50) NOT NULL UNIQUE,
  location VARCHAR(255) NOT NULL,
  ownerId INT NOT NULL,
  status ENUM('IDLE', 'RUNNING', 'OFFLINE') DEFAULT 'OFFLINE',
  fixedPrice DECIMAL(10, 2) NOT NULL DEFAULT 0,
  firmwareVersion VARCHAR(20) DEFAULT '1.0.0',
  lastHeartbeat DATETIME NULL,
  ipAddress VARCHAR(45) NULL,
  processLocked BOOLEAN DEFAULT FALSE,
  pendingRestart BOOLEAN DEFAULT FALSE,
  currentSequenceId INT NULL,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (ownerId) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (currentSequenceId) REFERENCES sequences(id) ON DELETE SET NULL,
  INDEX idx_machineId (machineId),
  INDEX idx_ownerId (ownerId),
  INDEX idx_status (status),
  INDEX idx_lastHeartbeat (lastHeartbeat)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- GPIOS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS gpios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  machineId INT NOT NULL,
  gpioNumber INT NOT NULL,
  gpioName VARCHAR(100) NOT NULL,
  currentState ENUM('ON', 'OFF') DEFAULT 'OFF',
  lastTriggered DATETIME NULL,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (machineId) REFERENCES machines(id) ON DELETE CASCADE,
  UNIQUE KEY unique_machine_gpio (machineId, gpioNumber),
  INDEX idx_machineId (machineId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- SEQUENCE_STEPS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS sequence_steps (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sequenceId INT NOT NULL,
  stepNumber INT NOT NULL,
  gpioNumber INT NOT NULL,
  duration INT NOT NULL COMMENT 'Duration in milliseconds',
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (sequenceId) REFERENCES sequences(id) ON DELETE CASCADE,
  INDEX idx_sequenceId (sequenceId),
  INDEX idx_sequence_step (sequenceId, stepNumber)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- TRANSACTIONS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS transactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  orderId VARCHAR(100) NOT NULL UNIQUE,
  machineId INT NOT NULL,
  ownerId INT NOT NULL,
  customerId INT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  status ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending',
  paymentMethod VARCHAR(50) NULL,
  razorpayOrderId VARCHAR(100) NULL,
  razorpayPaymentId VARCHAR(100) NULL,
  razorpaySignature VARCHAR(255) NULL,
  sequenceId INT NULL,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (machineId) REFERENCES machines(id) ON DELETE CASCADE,
  FOREIGN KEY (ownerId) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (customerId) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (sequenceId) REFERENCES sequences(id) ON DELETE SET NULL,
  INDEX idx_orderId (orderId),
  INDEX idx_machineId (machineId),
  INDEX idx_ownerId (ownerId),
  INDEX idx_status (status),
  INDEX idx_createdAt (createdAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- FIRMWARES TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS firmwares (
  id INT AUTO_INCREMENT PRIMARY KEY,
  version VARCHAR(20) NOT NULL UNIQUE,
  filePath VARCHAR(255) NOT NULL,
  description TEXT NULL,
  releaseNotes TEXT NULL,
  isActive BOOLEAN DEFAULT FALSE,
  fileSize INT NULL COMMENT 'File size in bytes',
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_version (version),
  INDEX idx_isActive (isActive)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- LOGS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  machineId INT NULL,
  level ENUM('info', 'warning', 'error', 'critical') DEFAULT 'info',
  message TEXT NOT NULL,
  source VARCHAR(50) NULL COMMENT 'e.g., ESP32, API, System',
  metadata JSON NULL,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (machineId) REFERENCES machines(id) ON DELETE SET NULL,
  INDEX idx_machineId (machineId),
  INDEX idx_level (level),
  INDEX idx_createdAt (createdAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- INITIAL DATA (SEED)
-- ========================================

-- Create default admin user
INSERT INTO users (name, phoneNumber, email, role, status) 
VALUES ('System Admin', '9999999999', 'admin@vendingcontrol.com', 'admin', 'active')
ON DUPLICATE KEY UPDATE name=name;

-- Create sample sequence
INSERT INTO sequences (name, description, totalDuration, isActive)
VALUES 
  ('Standard Sanitization', 'Complete sanitization cycle', 15000, TRUE),
  ('Quick Clean', 'Quick cleaning cycle', 8000, TRUE),
  ('Deep Clean', 'Deep cleaning cycle', 30000, TRUE)
ON DUPLICATE KEY UPDATE name=name;

-- ========================================
-- VERIFICATION QUERIES
-- ========================================

-- Show all tables
-- SHOW TABLES;

-- Show table structures
-- DESCRIBE users;
-- DESCRIBE machines;
-- DESCRIBE gpios;
-- DESCRIBE sequences;
-- DESCRIBE sequence_steps;
-- DESCRIBE transactions;
-- DESCRIBE firmwares;
-- DESCRIBE logs;

-- Count records
-- SELECT 'users' as table_name, COUNT(*) as count FROM users
-- UNION ALL
-- SELECT 'machines', COUNT(*) FROM machines
-- UNION ALL
-- SELECT 'transactions', COUNT(*) FROM transactions;

-- ========================================
-- COMPLETED
-- ========================================
SELECT 'Database schema created successfully!' as status;
