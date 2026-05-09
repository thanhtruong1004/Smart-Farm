import express from 'express';
import {
  getDevices,
  getDeviceById,
  createDevice,
  updateDevice,
  deleteDevice
} from '../controllers/deviceController.js';
import { verifyToken, requireAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// GET all devices (permission-based)
router.get('/', verifyToken, getDevices);

// GET single device
router.get('/:deviceId', verifyToken, getDeviceById);

// CREATE device (admin only)
router.post('/', verifyToken, requireAdmin, createDevice);

// UPDATE device (admin or assigned operator)
router.put('/:deviceId', verifyToken, updateDevice);

// DELETE device (admin only)
router.delete('/:deviceId', verifyToken, requireAdmin, deleteDevice);

export default router;
