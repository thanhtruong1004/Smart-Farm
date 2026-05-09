import express from 'express';
import {
  getOperators,
  getZoneOperators,
  getOperatorZones,
  assignZoneToOperator,
  revokeZoneFromOperator,
  revokeAllZonesFromOperator,
  batchAssignZones
} from '../controllers/permissionController.js';
import { verifyToken, requireAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// GET all operators (admin only)
router.get('/operators', verifyToken, requireAdmin, getOperators);

// GET operators assigned to a zone (admin only)
router.get('/zones/:zoneId/operators', verifyToken, requireAdmin, getZoneOperators);

// GET zones assigned to an operator (admin only)
router.get('/operators/:operatorId/zones', verifyToken, requireAdmin, getOperatorZones);

// ASSIGN operator to zone (admin only)
router.post('/zones/:zoneId/operators/:operatorId', verifyToken, requireAdmin, assignZoneToOperator);

// REVOKE operator from zone (admin only)
router.delete('/zones/:zoneId/operators/:operatorId', verifyToken, requireAdmin, revokeZoneFromOperator);

// REVOKE all zones from operator (admin only)
router.delete('/operators/:operatorId/zones', verifyToken, requireAdmin, revokeAllZonesFromOperator);

// BATCH assign zones to operator (admin only)
router.post('/operators/:operatorId/zones/batch', verifyToken, requireAdmin, batchAssignZones);

export default router;
