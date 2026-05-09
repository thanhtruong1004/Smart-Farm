import pool from '../config/database.js';

// GET all operators
export const getOperators = async (req, res) => {
  try {
    const conn = await pool.getConnection();
    const [operators] = await conn.query(
      'SELECT user_id, user_name, email, user_type FROM user WHERE user_type = ? ORDER BY user_name ASC',
      ['operator']
    );
    conn.release();
    res.status(200).json(operators);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

// GET operators assigned to a zone
export const getZoneOperators = async (req, res) => {
  const { zoneId } = req.params;
  
  try {
    const conn = await pool.getConnection();
    
    // Verify zone exists
    const [zones] = await conn.query(
      'SELECT * FROM zone WHERE zone_id = ?',
      [zoneId]
    );
    
    if (zones.length === 0) {
      conn.release();
      return res.status(404).json({ error: 'Zone not found' });
    }
    
    const [operators] = await conn.query(`
      SELECT u.user_id, u.user_name, u.email, zp.assigned_at
      FROM user u
      INNER JOIN zone_permission zp ON u.user_id = zp.user_id
      WHERE zp.zone_id = ? AND u.user_type = ?
      ORDER BY u.user_name ASC
    `, [zoneId, 'operator']);
    
    conn.release();
    res.status(200).json(operators);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

// GET zones assigned to an operator
export const getOperatorZones = async (req, res) => {
  const { operatorId } = req.params;
  
  try {
    const conn = await pool.getConnection();
    
    // Verify operator exists
    const [users] = await conn.query(
      'SELECT * FROM user WHERE user_id = ? AND user_type = ?',
      [operatorId, 'operator']
    );
    
    if (users.length === 0) {
      conn.release();
      return res.status(404).json({ error: 'Operator not found' });
    }
    
    const [zones] = await conn.query(`
      SELECT z.*, pt.name as plant_type_name, zp.assigned_at
      FROM zone z
      INNER JOIN zone_permission zp ON z.zone_id = zp.zone_id
      LEFT JOIN plant_type pt ON z.plant_type_id = pt.plant_type_id
      WHERE zp.user_id = ?
      ORDER BY z.name ASC
    `, [operatorId]);
    
    conn.release();
    res.status(200).json(zones);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

// ASSIGN operator to zone (admin only)
export const assignZoneToOperator = async (req, res) => {
  const { zoneId, operatorId } = req.params;
  
  try {
    const conn = await pool.getConnection();
    await conn.beginTransaction();
    
    // Verify zone exists
    const [zones] = await conn.query(
      'SELECT * FROM zone WHERE zone_id = ?',
      [zoneId]
    );
    
    if (zones.length === 0) {
      await conn.rollback();
      conn.release();
      return res.status(404).json({ error: 'Zone not found' });
    }
    
    // Verify operator exists and is an operator
    const [users] = await conn.query(
      'SELECT * FROM user WHERE user_id = ? AND user_type = ?',
      [operatorId, 'operator']
    );
    
    if (users.length === 0) {
      await conn.rollback();
      conn.release();
      return res.status(404).json({ error: 'Operator not found' });
    }
    
    // Check if already assigned
    const [existing] = await conn.query(
      'SELECT * FROM zone_permission WHERE zone_id = ? AND user_id = ?',
      [zoneId, operatorId]
    );
    
    if (existing.length > 0) {
      await conn.rollback();
      conn.release();
      return res.status(409).json({ error: 'Operator already assigned to this zone' });
    }
    
    // Create zone_permission
    await conn.query(
      'INSERT INTO zone_permission (zone_id, user_id, assigned_by) VALUES (?, ?, ?)',
      [zoneId, operatorId, req.user.user_id]
    );
    
    await conn.commit();
    conn.release();
    
    res.status(201).json({ message: 'Operator assigned to zone successfully' });
  } catch (error) {
    const conn = await pool.getConnection();
    await conn.rollback();
    conn.release();
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

// REVOKE operator from zone (admin only)
export const revokeZoneFromOperator = async (req, res) => {
  const { zoneId, operatorId } = req.params;
  
  try {
    const conn = await pool.getConnection();
    
    const [result] = await conn.query(
      'DELETE FROM zone_permission WHERE zone_id = ? AND user_id = ?',
      [zoneId, operatorId]
    );
    
    conn.release();
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Permission not found' });
    }
    
    res.status(200).json({ message: 'Operator removed from zone successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

// REVOKE all zones from operator (admin only)
export const revokeAllZonesFromOperator = async (req, res) => {
  const { operatorId } = req.params;
  
  try {
    const conn = await pool.getConnection();
    
    const [result] = await conn.query(
      'DELETE FROM zone_permission WHERE user_id = ?',
      [operatorId]
    );
    
    conn.release();
    
    res.status(200).json({ 
      message: 'All zone permissions revoked', 
      removedCount: result.affectedRows 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

// BATCH assign operators to zones (admin only)
export const batchAssignZones = async (req, res) => {
  const { operatorId } = req.params;
  const { zoneIds } = req.body; // Array of zone IDs
  
  if (!Array.isArray(zoneIds)) {
    return res.status(400).json({ error: 'zoneIds must be an array' });
  }
  
  let conn;
  try {
    conn = await pool.getConnection();
    await conn.beginTransaction();
    
    // Verify operator exists
    const [users] = await conn.query(
      'SELECT * FROM user WHERE user_id = ? AND user_type = ?',
      [operatorId, 'operator']
    );
    
    if (users.length === 0) {
      await conn.rollback();
      conn.release();
      return res.status(404).json({ error: 'Operator not found' });
    }
    
    // Remove all existing permissions
    await conn.query('DELETE FROM zone_permission WHERE user_id = ?', [operatorId]);
    
    // Add new permissions
    let addedCount = 0;
    for (const zoneId of zoneIds) {
      const [zones] = await conn.query(
        'SELECT * FROM zone WHERE zone_id = ?',
        [zoneId]
      );
      
      if (zones.length > 0) {
        await conn.query(
          'INSERT INTO zone_permission (zone_id, user_id, assigned_by) VALUES (?, ?, ?)',
          [zoneId, operatorId, req.user.user_id]
        );
        addedCount++;
      }
    }
    
    await conn.commit();
    conn.release();
    
    res.status(200).json({ 
      message: 'Zones assigned to operator', 
      assignedCount: addedCount 
    });
  } catch (error) {
    if (conn) await conn.rollback();
    if (conn) conn.release();
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};
