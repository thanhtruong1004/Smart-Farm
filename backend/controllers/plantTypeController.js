import pool from '../config/database.js';

// GET all plant types
export const getPlantTypes = async (req, res) => {
  try {
    const conn = await pool.getConnection();
    const [plantTypes] = await conn.query(`
      SELECT * FROM plant_type 
      ORDER BY name ASC
    `);
    conn.release();
    res.status(200).json(plantTypes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

// GET single plant type by ID
export const getPlantTypeById = async (req, res) => {
  const { plantTypeId } = req.params;
  
  try {
    const conn = await pool.getConnection();
    const [plantTypes] = await conn.query(
      'SELECT * FROM plant_type WHERE plant_type_id = ?',
      [plantTypeId]
    );
    conn.release();
    
    if (plantTypes.length === 0) {
      return res.status(404).json({ error: 'Plant type not found' });
    }
    
    res.status(200).json(plantTypes[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

// CREATE plant type (admin only)
export const createPlantType = async (req, res) => {
  const { 
    name, 
    description, 
    min_temp, 
    max_temp, 
    min_soil, 
    max_soil, 
    min_humidity, 
    max_humidity, 
    min_light, 
    max_light 
  } = req.body;
  
  if (!name) {
    return res.status(400).json({ error: 'Name is required' });
  }
  
  try {
    const conn = await pool.getConnection();
    
    const [result] = await conn.query(`
      INSERT INTO plant_type 
      (name, description, min_temp, max_temp, min_soil, max_soil, min_humidity, max_humidity, min_light, max_light) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      name, description || null,
      min_temp || null, max_temp || null,
      min_soil || null, max_soil || null,
      min_humidity || null, max_humidity || null,
      min_light || null, max_light || null
    ]);
    
    conn.release();
    res.status(201).json({
      message: 'Plant type created successfully',
      plant_type_id: result.insertId
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

// UPDATE plant type (admin only)
export const updatePlantType = async (req, res) => {
  const { plantTypeId } = req.params;
  const updateData = req.body;
  
  try {
    const conn = await pool.getConnection();
    
    // Verify plant type exists
    const [plantTypes] = await conn.query(
      'SELECT * FROM plant_type WHERE plant_type_id = ?',
      [plantTypeId]
    );
    
    if (plantTypes.length === 0) {
      conn.release();
      return res.status(404).json({ error: 'Plant type not found' });
    }
    
    const updateFields = [];
    const values = [];
    
    // Build dynamic update query
    const allowedFields = ['name', 'description', 'min_temp', 'max_temp', 'min_soil', 'max_soil', 'min_humidity', 'max_humidity', 'min_light', 'max_light'];
    
    for (const field of allowedFields) {
      if (field in updateData) {
        updateFields.push(`${field} = ?`);
        values.push(updateData[field] || null);
      }
    }
    
    if (updateFields.length === 0) {
      conn.release();
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    values.push(plantTypeId);
    
    await conn.query(
      `UPDATE plant_type SET ${updateFields.join(', ')} WHERE plant_type_id = ?`,
      values
    );
    
    conn.release();
    res.status(200).json({ message: 'Plant type updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

// DELETE plant type (admin only)
export const deletePlantType = async (req, res) => {
  const { plantTypeId } = req.params;
  
  try {
    const conn = await pool.getConnection();
    
    // Check if any zones use this plant type
    const [zones] = await conn.query(
      'SELECT COUNT(*) as count FROM zone WHERE plant_type_id = ?',
      [plantTypeId]
    );
    
    if (zones[0].count > 0) {
      conn.release();
      return res.status(409).json({ 
        error: 'Cannot delete plant type - it is used by existing zones' 
      });
    }
    
    const [result] = await conn.query(
      'DELETE FROM plant_type WHERE plant_type_id = ?',
      [plantTypeId]
    );
    
    conn.release();
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Plant type not found' });
    }
    
    res.status(200).json({ message: 'Plant type deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};
