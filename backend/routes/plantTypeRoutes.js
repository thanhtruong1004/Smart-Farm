import express from 'express';
import {
  getPlantTypes,
  getPlantTypeById,
  createPlantType,
  updatePlantType,
  deletePlantType
} from '../controllers/plantTypeController.js';
import { verifyToken, requireAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// GET all plant types (all authenticated users)
router.get('/', verifyToken, getPlantTypes);

// GET single plant type
router.get('/:plantTypeId', verifyToken, getPlantTypeById);

// CREATE plant type (admin only)
router.post('/', verifyToken, requireAdmin, createPlantType);

// UPDATE plant type (admin only)
router.put('/:plantTypeId', verifyToken, requireAdmin, updatePlantType);

// DELETE plant type (admin only)
router.delete('/:plantTypeId', verifyToken, requireAdmin, deletePlantType);

export default router;
