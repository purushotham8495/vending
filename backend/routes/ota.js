const express = require('express');
const router = express.Router();
const multer = require('multer');
const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');
const Firmware = require('../models/Firmware');
const Machine = require('../models/Machine');
const Logger = require('../utils/logger');
const { authenticate, isAdmin } = require('../middleware/auth');

// Configure multer for firmware upload
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = process.env.OTA_STORAGE_PATH || './uploads/firmware';
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    cb(null, `firmware_${timestamp}_${file.originalname}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/octet-stream' || file.originalname.endsWith('.bin')) {
      cb(null, true);
    } else {
      cb(new Error('Only .bin files are allowed'));
    }
  }
});

// Get all firmware versions
router.get('/', authenticate, isAdmin, async (req, res) => {
  try {
    const firmwares = await Firmware.find()
      .populate('uploadedBy', 'phoneNumber')
      .sort('-createdAt');

    res.json({
      success: true,
      firmwares
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Upload new firmware
router.post('/upload', authenticate, isAdmin, upload.single('firmware'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Firmware file required'
      });
    }

    const { version, description } = req.body;

    if (!version) {
      // Delete uploaded file
      await fs.unlink(req.file.path);
      return res.status(400).json({
        success: false,
        message: 'Version is required'
      });
    }

    // Check if version already exists
    const existingFirmware = await Firmware.findOne({ version });
    if (existingFirmware) {
      await fs.unlink(req.file.path);
      return res.status(400).json({
        success: false,
        message: 'Version already exists'
      });
    }

    // Calculate checksum
    const fileBuffer = await fs.readFile(req.file.path);
    const checksum = crypto.createHash('md5').update(fileBuffer).digest('hex');

    const firmware = new Firmware({
      version,
      fileName: req.file.originalname,
      filePath: req.file.path,
      fileSize: req.file.size,
      checksum,
      description: description || '',
      uploadedBy: req.user._id
    });

    await firmware.save();

    await Logger.info(
      `Firmware version ${version} uploaded`,
      { fileSize: req.file.size, checksum },
      null,
      req.user._id
    );

    res.status(201).json({
      success: true,
      message: 'Firmware uploaded successfully',
      firmware
    });
  } catch (error) {
    // Clean up uploaded file on error
    if (req.file) {
      await fs.unlink(req.file.path).catch(console.error);
    }
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Set firmware as active
router.put('/:firmwareId/activate', authenticate, isAdmin, async (req, res) => {
  try {
    const { firmwareId } = req.params;

    // Deactivate all other firmwares
    await Firmware.updateMany({}, { isActive: false });

    const firmware = await Firmware.findByIdAndUpdate(
      firmwareId,
      { isActive: true },
      { new: true }
    );

    if (!firmware) {
      return res.status(404).json({
        success: false,
        message: 'Firmware not found'
      });
    }

    await Logger.info(
      `Firmware version ${firmware.version} set as active`,
      {},
      null,
      req.user._id
    );

    res.json({
      success: true,
      message: 'Firmware activated successfully',
      firmware
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Deploy firmware to machines
router.post('/:firmwareId/deploy', authenticate, isAdmin, async (req, res) => {
  try {
    const { firmwareId } = req.params;
    const { machineIds } = req.body; // Array of machine IDs

    const firmware = await Firmware.findById(firmwareId);

    if (!firmware) {
      return res.status(404).json({
        success: false,
        message: 'Firmware not found'
      });
    }

    if (!Array.isArray(machineIds) || machineIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Machine IDs array required'
      });
    }

    // Add machines to deployment list
    firmware.deployedToMachines = [
      ...new Set([...firmware.deployedToMachines, ...machineIds])
    ];
    await firmware.save();

    // Log deployment for each machine
    for (const machineId of machineIds) {
      const machine = await Machine.findById(machineId);
      if (machine) {
        await Logger.otaStart(machine, firmware.version, req.user);
      }
    }

    res.json({
      success: true,
      message: `Firmware deployment initiated for ${machineIds.length} machine(s)`,
      firmware
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ESP32 - Check for OTA update
router.get('/check/:machineId', async (req, res) => {
  try {
    const { machineId } = req.params;
    const { currentVersion } = req.query;

    const machine = await Machine.findOne({ machineId });

    if (!machine) {
      return res.status(404).json({
        success: false,
        message: 'Machine not found'
      });
    }

    // Update heartbeat
    machine.lastHeartbeat = new Date();
    await machine.save();

    // Find active firmware or firmware deployed to this machine
    const firmware = await Firmware.findOne({
      $or: [
        { isActive: true },
        { deployedToMachines: machine._id }
      ]
    }).sort('-createdAt');

    if (!firmware || firmware.version === currentVersion) {
      return res.json({
        success: true,
        updateAvailable: false
      });
    }

    res.json({
      success: true,
      updateAvailable: true,
      version: firmware.version,
      fileSize: firmware.fileSize,
      checksum: firmware.checksum,
      downloadUrl: `/api/ota/download/${firmware._id}`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ESP32 - Download firmware
router.get('/download/:firmwareId', async (req, res) => {
  try {
    const { firmwareId } = req.params;
    const { machineId } = req.query;

    const firmware = await Firmware.findById(firmwareId);

    if (!firmware) {
      return res.status(404).json({
        success: false,
        message: 'Firmware not found'
      });
    }

    // Verify file exists
    try {
      await fs.access(firmware.filePath);
    } catch {
      return res.status(404).json({
        success: false,
        message: 'Firmware file not found on server'
      });
    }

    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${firmware.fileName}"`);
    res.setHeader('Content-Length', firmware.fileSize);
    res.setHeader('X-Checksum', firmware.checksum);

    const fileStream = require('fs').createReadStream(firmware.filePath);
    fileStream.pipe(res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ESP32 - Report OTA status
router.post('/status', async (req, res) => {
  try {
    const { machineId, firmwareVersion, status, error } = req.body;

    const machine = await Machine.findOne({ machineId });

    if (!machine) {
      return res.status(404).json({
        success: false,
        message: 'Machine not found'
      });
    }

    if (status === 'success') {
      machine.firmwareVersion = firmwareVersion;
      await machine.save();
      await Logger.otaSuccess(machine, firmwareVersion);
    } else if (status === 'failed') {
      await Logger.otaFailed(machine, firmwareVersion, error || 'Unknown error');
    }

    res.json({
      success: true
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Delete firmware
router.delete('/:firmwareId', authenticate, isAdmin, async (req, res) => {
  try {
    const { firmwareId } = req.params;

    const firmware = await Firmware.findById(firmwareId);

    if (!firmware) {
      return res.status(404).json({
        success: false,
        message: 'Firmware not found'
      });
    }

    // Don't delete if it's the active firmware
    if (firmware.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete active firmware'
      });
    }

    // Delete file
    try {
      await fs.unlink(firmware.filePath);
    } catch (error) {
      console.error('Error deleting firmware file:', error);
    }

    await firmware.deleteOne();

    await Logger.warning(
      `Firmware version ${firmware.version} deleted`,
      {},
      null,
      req.user._id
    );

    res.json({
      success: true,
      message: 'Firmware deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
