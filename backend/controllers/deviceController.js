import pool from '../config/database.js';

// GET all devices in accessible zones
export const getDevices = async (req, res) => {
  try {
    const conn = await pool.getConnection();
    
    let devices;
    if (req.user.user_type === 'admin') {
      // Admin sees all devices
      [devices] = await conn.query(`
        SELECT d.*, dt.name as device_type_name, z.name as zone_name
        FROM device d
        LEFT JOIN device_type dt ON d.device_type_id = dt.device_type_id
        LEFT JOIN zone z ON d.zone_id = z.zone_id
        ORDER BY d.created_at DESC
      `);
    } else if (req.user.user_type === 'operator') {
      // Operator sees only devices in assigned zones
      [devices] = await conn.query(`
        SELECT d.*, dt.name as device_type_name, z.name as zone_name
        FROM device d
        LEFT JOIN device_type dt ON d.device_type_id = dt.device_type_id
        LEFT JOIN zone z ON d.zone_id = z.zone_id
        INNER JOIN zone_permission zp ON d.zone_id = zp.zone_id
        WHERE zp.user_id = ?
        ORDER BY d.created_at DESC
      `, [req.user.user_id]);
    } else {
      // Viewer sees all but read-only
      [devices] = await conn.query(`
        SELECT d.*, dt.name as device_type_name, z.name as zone_name
        FROM device d
        LEFT JOIN device_type dt ON d.device_type_id = dt.device_type_id
        LEFT JOIN zone z ON d.zone_id = z.zone_id
        ORDER BY d.created_at DESC
      `);
    }
    
    conn.release();
    res.status(200).json(devices);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

// GET single device
export const getDeviceById = async (req, res) => {
  const { deviceId } = req.params;
  
  try {
    const conn = await pool.getConnection();
    
    const [devices] = await conn.query(`
      SELECT d.*, dt.name as device_type_name, z.name as zone_name
      FROM device d
      LEFT JOIN device_type dt ON d.device_type_id = dt.device_type_id
      LEFT JOIN zone z ON d.zone_id = z.zone_id
      WHERE d.device_id = ?
    `, [deviceId]);
    
    if (devices.length === 0) {
      conn.release();
      return res.status(404).json({ error: 'Device not found' });
    }
    
    const device = devices[0];
    
    // Check permission
    if (req.user.user_type === 'operator') {
      const [permission] = await conn.query(`
        SELECT * FROM zone_permission
        WHERE zone_id = ? AND user_id = ?
      `, [device.zone_id, req.user.user_id]);
      
      if (permission.length === 0) {
        conn.release();
        return res.status(403).json({ error: 'Access denied' });
      }
    }
    
    conn.release();
    res.status(200).json(device);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

// CREATE device (admin only, needs device_type first)
export const createDevice = async (req, res) => {
  const { zone_id, device_type_id, name, serial_number } = req.body;
  
  if (!zone_id || !device_type_id || !name) {
    return res.status(400).json({ 
      error: 'zone_id, device_type_id, and name are required' 
    });
  }
  
  try {
    const conn = await pool.getConnection();
    await conn.beginTransaction();
    
    // Verify zone exists
    const [zones] = await conn.query(
      'SELECT * FROM zone WHERE zone_id = ?',
      [zone_id]
    );
    
    if (zones.length === 0) {
      await conn.rollback();
      conn.release();
      return res.status(400).json({ error: 'Zone not found' });
    }
    
    // Verify device type exists
    const [deviceTypes] = await conn.query(
      'SELECT * FROM device_type WHERE device_type_id = ?',
      [device_type_id]
    );
    
    if (deviceTypes.length === 0) {
      await conn.rollback();
      conn.release();
      return res.status(400).json({ error: 'Device type not found' });
    }
    
    // Create device
    const [result] = await conn.query(`
      INSERT INTO device (zone_id, device_type_id, name, serial_number, connection_status)
      VALUES (?, ?, ?, ?, ?)
    `, [zone_id, device_type_id, name, serial_number || null, 'offline']);
    
    // Update zone device count
    await conn.query('UPDATE zone SET number_of_device = number_of_device + 1 WHERE zone_id = ?', [zone_id]);
    
    // If device_type is 'sensor', create sensor_device record
    if (deviceTypes[0].category === 'sensor') {
      await conn.query(
        'INSERT INTO sensor_device (device_id, read_interval_sec) VALUES (?, ?)',
        [result.insertId, 30]
      );
    }
    // If device_type is 'control', create control_device record
    else if (deviceTypes[0].category === 'control') {
      await conn.query(
        'INSERT INTO control_device (device_id, control_channel, current_state) VALUES (?, ?, ?)',
        [result.insertId, '1', 'off']
      );
    }
    
    await conn.commit();
    conn.release();
    
    res.status(201).json({
      message: 'Device created successfully',
      device_id: result.insertId
    });
  } catch (error) {
    const conn = await pool.getConnection();
    await conn.rollback();
    conn.release();
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

// UPDATE device (admin or assigned operator)
export const updateDevice = async (req, res) => {
  const { deviceId } = req.params;
  const { name, serial_number, connection_status } = req.body;
  
  try {
    const conn = await pool.getConnection();
    
    // Get device
    const [devices] = await conn.query(
      'SELECT * FROM device WHERE device_id = ?',
      [deviceId]
    );
    
    if (devices.length === 0) {
      conn.release();
      return res.status(404).json({ error: 'Device not found' });
    }
    
    const device = devices[0];
    
    // Check permission
    if (req.user.user_type === 'operator') {
      const [permission] = await conn.query(`
        SELECT * FROM zone_permission
        WHERE zone_id = ? AND user_id = ?
      `, [device.zone_id, req.user.user_id]);
      
      if (permission.length === 0) {
        conn.release();
        return res.status(403).json({ error: 'Access denied' });
      }
    }
    
    // Update device
    const updateFields = [];
    const values = [];
    
    if (name) {
      updateFields.push('name = ?');
      values.push(name);
    }
    if (serial_number !== undefined) {
      updateFields.push('serial_number = ?');
      values.push(serial_number);
    }
    if (connection_status) {
      updateFields.push('connection_status = ?');
      values.push(connection_status);
    }
    
    if (updateFields.length === 0) {
      conn.release();
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    values.push(deviceId);
    
    await conn.query(
      `UPDATE device SET ${updateFields.join(', ')} WHERE device_id = ?`,
      values
    );
    
    conn.release();
    res.status(200).json({ message: 'Device updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

// DELETE device (admin only)
export const deleteDevice = async (req, res) => {
  const { deviceId } = req.params;
  
  let conn;
  try {
    conn = await pool.getConnection();
    await conn.beginTransaction();
    
    // Get device
    const [devices] = await conn.query(
      'SELECT * FROM device WHERE device_id = ?',
      [deviceId]
    );
    
    if (devices.length === 0) {
      await conn.rollback();
      conn.release();
      return res.status(404).json({ error: 'Device not found' });
    }
    
    const device = devices[0];
    
    // Delete device (cascade will handle sensor_device/control_device)
    await conn.query('DELETE FROM device WHERE device_id = ?', [deviceId]);
    
    // Update zone device count
    await conn.query('UPDATE zone SET number_of_device = GREATEST(number_of_device - 1, 0) WHERE zone_id = ?', [device.zone_id]);
    
    await conn.commit();
    conn.release();
    
    res.status(200).json({ message: 'Device deleted successfully' });
  } catch (error) {
    if (conn) await conn.rollback();
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};
