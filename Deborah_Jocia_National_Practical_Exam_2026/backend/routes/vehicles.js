const express = require('express');
const { getDatabase, saveDatabase, queryAll, queryOne, execute, logActivity } = require('../config/db');
const { requireAuth, requireRole, requireAdmin } = require('../middleware/auth');
const { vehicleValidation, paginationValidation } = require('../config/validation');
const logger = require('../config/logger');

const router = express.Router();

// Get all vehicles with pagination and search
router.get('/', requireAuth, paginationValidation, async (req, res) => {
  try {
    await getDatabase();
    const { search, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let countQuery = 'SELECT COUNT(*) as total FROM Vehicle v';
    let dataQuery = `
      SELECT v.*, u.UserName as RegisteredByName
      FROM Vehicle v
      JOIN Users u ON v.RegisteredBy = u.UserName
    `;
    const params = [];
    const countParams = [];

    if (search) {
      const whereClause = ` WHERE v.Plate_Number LIKE ? OR v.Brand LIKE ? OR v.Model LIKE ? OR v.Vehicle_Type LIKE ?`;
      const searchTerm = `%${search}%`;
      countQuery += whereClause;
      dataQuery += whereClause;
      for (let i = 0; i < 4; i++) {
        params.push(searchTerm);
        countParams.push(searchTerm);
      }
    }

    const totalResult = queryAll(countQuery, countParams);
    const total = totalResult[0]?.total || 0;

    dataQuery += ` ORDER BY v.Plate_Number LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), offset);
    const vehicles = queryAll(dataQuery, params);

    res.json({
      data: vehicles,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (err) {
    logger.error('Get vehicles error:', err);
    res.status(500).json({ error: 'Failed to retrieve vehicles' });
  }
});

// Get single vehicle
router.get('/:plate', requireAuth, async (req, res) => {
  try {
    await getDatabase();
    const vehicle = queryOne(
      "SELECT v.*, u.UserName as RegisteredByName FROM Vehicle v JOIN Users u ON v.RegisteredBy = u.UserName WHERE v.Plate_Number = ?",
      [req.params.plate]
    );

    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found with plate number: ' + req.params.plate });
    }

    res.json(vehicle);
  } catch (err) {
    logger.error('Get vehicle error:', err);
    res.status(500).json({ error: 'Failed to retrieve vehicle' });
  }
});

// Create vehicle
router.post('/', requireAuth, requireRole('staff'), vehicleValidation, async (req, res) => {
  try {
    const { Plate_Number, Brand, Model, Year, Vehicle_Type, Purchase_Price, Status } = req.body;

    await getDatabase();
    const existing = queryOne("SELECT * FROM Vehicle WHERE Plate_Number = ?", [Plate_Number.toUpperCase()]);
    if (existing) {
      return res.status(409).json({ error: 'Vehicle with plate number ' + Plate_Number + ' already exists' });
    }

    execute(
      "INSERT INTO Vehicle (Plate_Number, Brand, Model, Year, Vehicle_Type, Purchase_Price, Status, RegisteredBy) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [Plate_Number.toUpperCase(), Brand, Model, Year, Vehicle_Type, Purchase_Price, Status || 'Available', req.user.username]
    );
    saveDatabase();

    logActivity(req.user.username, 'CREATE', 'Vehicle', Plate_Number.toUpperCase(),
      { Brand, Model, Year, Purchase_Price }, req.ip);

    res.status(201).json({ message: 'Vehicle created successfully', plateNumber: Plate_Number.toUpperCase() });
  } catch (err) {
    logger.error('Create vehicle error:', err);
    res.status(500).json({ error: 'Failed to create vehicle' });
  }
});

// Update vehicle
router.put('/:plate', requireAuth, requireRole('staff'), vehicleValidation, async (req, res) => {
  try {
    const { Brand, Model, Year, Vehicle_Type, Purchase_Price, Status } = req.body;
    await getDatabase();

    const existing = queryOne("SELECT * FROM Vehicle WHERE Plate_Number = ?", [req.params.plate]);
    if (!existing) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    execute(
      "UPDATE Vehicle SET Brand = ?, Model = ?, Year = ?, Vehicle_Type = ?, Purchase_Price = ?, Status = ?, UpdatedAt = datetime('now') WHERE Plate_Number = ?",
      [Brand, Model, Year, Vehicle_Type, Purchase_Price, Status, req.params.plate]
    );
    saveDatabase();

    logActivity(req.user.username, 'UPDATE', 'Vehicle', req.params.plate,
      { Brand, Model, Year, Status }, req.ip);

    res.json({ message: 'Vehicle updated successfully' });
  } catch (err) {
    logger.error('Update vehicle error:', err);
    res.status(500).json({ error: 'Failed to update vehicle' });
  }
});

// Delete vehicle
router.delete('/:plate', requireAuth, requireAdmin, async (req, res) => {
  try {
    await getDatabase();
    const existing = queryOne("SELECT * FROM Vehicle WHERE Plate_Number = ?", [req.params.plate]);
    if (!existing) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    execute("DELETE FROM Vehicle WHERE Plate_Number = ?", [req.params.plate]);
    saveDatabase();

    logActivity(req.user.username, 'DELETE', 'Vehicle', req.params.plate, null, req.ip);

    res.json({ message: 'Vehicle deleted successfully' });
  } catch (err) {
    logger.error('Delete vehicle error:', err);
    res.status(500).json({ error: 'Failed to delete vehicle' });
  }
});

module.exports = router;
