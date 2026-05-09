import express from 'express';
import { 
  getZones, 
  getZoneById, 
  createZone, 
  updateZone, 
  deleteZone 
} from '../controllers/zoneController.js';
import { verifyToken, requireAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// GET all zones (permission-based on user type)
router.get('/', verifyToken, getZones);

// GET single zone by ID
router.get('/:zoneId', verifyToken, getZoneById);

// CREATE zone (admin only)
router.post('/', verifyToken, requireAdmin, createZone);

// UPDATE zone (admin or assigned operator)
router.put('/:zoneId', verifyToken, updateZone);

// DELETE zone (admin only)
router.delete('/:zoneId', verifyToken, requireAdmin, deleteZone);

export default router; 