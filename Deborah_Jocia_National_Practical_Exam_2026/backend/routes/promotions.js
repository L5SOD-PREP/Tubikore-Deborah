const express = require('express');
const { getDatabase, saveDatabase, queryAll, queryOne, execute, logActivity } = require('../config/db');
const { requireAuth, requireRole, requireAdmin } = require('../middleware/auth');
const { promotionValidation, linkValidation, paginationValidation } = require('../config/validation');
const logger = require('../config/logger');

const router = express.Router();

// Get all promotions with pagination and search
router.get('/', requireAuth, paginationValidation, async (req, res) => {
  try {
    await getDatabase();
    const { search, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let countQuery = 'SELECT COUNT(*) as total FROM Promotion p';
    let dataQuery = `
      SELECT p.*, u.UserName as CreatedByName
      FROM Promotion p
      JOIN Users u ON p.CreatedBy = u.UserName
    `;
    const params = [];
    const countParams = [];

    if (search) {
      const whereClause = ` WHERE p.Title LIKE ? OR p.Description LIKE ? OR p.Discount_Type LIKE ?`;
      const searchTerm = `%${search}%`;
      countQuery += whereClause;
      dataQuery += whereClause;
      for (let i = 0; i < 3; i++) {
        params.push(searchTerm);
        countParams.push(searchTerm);
      }
    }

    const totalResult = queryAll(countQuery, countParams);
    const total = totalResult[0]?.total || 0;

    dataQuery += ` ORDER BY p.Start_Date DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), offset);
    const promotions = queryAll(dataQuery, params);

    res.json({
      data: promotions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (err) {
    logger.error('Get promotions error:', err);
    res.status(500).json({ error: 'Failed to retrieve promotions' });
  }
});

// Get single promotion
router.get('/:id', requireAuth, async (req, res) => {
  try {
    await getDatabase();
    const promotion = queryOne(
      "SELECT p.*, u.UserName as CreatedByName FROM Promotion p JOIN Users u ON p.CreatedBy = u.UserName WHERE p.PromotionID = ?",
      [req.params.id]
    );

    if (!promotion) {
      return res.status(404).json({ error: 'Promotion not found' });
    }

    res.json(promotion);
  } catch (err) {
    logger.error('Get promotion error:', err);
    res.status(500).json({ error: 'Failed to retrieve promotion' });
  }
});

// Create promotion
router.post('/', requireAuth, requireRole('staff'), promotionValidation, async (req, res) => {
  try {
    const { Title, Description, Discount_Type, Discount_Value, Start_Date, End_Date, Status } = req.body;

    // Validate end date > start date
    if (new Date(End_Date) <= new Date(Start_Date)) {
      return res.status(400).json({ error: 'End date must be after start date' });
    }

    await getDatabase();
    execute(
      "INSERT INTO Promotion (Title, Description, Discount_Type, Discount_Value, Start_Date, End_Date, Status, CreatedBy) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [Title.trim(), Description?.trim(), Discount_Type, Discount_Value, Start_Date, End_Date, Status || 'Active', req.user.username]
    );
    saveDatabase();

    logActivity(req.user.username, 'CREATE', 'Promotion', null,
      { Title, Discount_Type, Discount_Value }, req.ip);

    res.status(201).json({ message: 'Promotion created successfully' });
  } catch (err) {
    logger.error('Create promotion error:', err);
    res.status(500).json({ error: 'Failed to create promotion' });
  }
});

// Update promotion
router.put('/:id', requireAuth, requireRole('staff'), promotionValidation, async (req, res) => {
  try {
    const { Title, Description, Discount_Type, Discount_Value, Start_Date, End_Date, Status } = req.body;
    await getDatabase();

    const existing = queryOne("SELECT * FROM Promotion WHERE PromotionID = ?", [req.params.id]);
    if (!existing) {
      return res.status(404).json({ error: 'Promotion not found' });
    }

    execute(
      "UPDATE Promotion SET Title = ?, Description = ?, Discount_Type = ?, Discount_Value = ?, Start_Date = ?, End_Date = ?, Status = ?, UpdatedAt = datetime('now') WHERE PromotionID = ?",
      [Title.trim(), Description?.trim(), Discount_Type, Discount_Value, Start_Date, End_Date, Status, req.params.id]
    );
    saveDatabase();

    logActivity(req.user.username, 'UPDATE', 'Promotion', req.params.id,
      { Title, Discount_Type, Status }, req.ip);

    res.json({ message: 'Promotion updated successfully' });
  } catch (err) {
    logger.error('Update promotion error:', err);
    res.status(500).json({ error: 'Failed to update promotion' });
  }
});

// Delete promotion
router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    await getDatabase();
    const existing = queryOne("SELECT * FROM Promotion WHERE PromotionID = ?", [req.params.id]);
    if (!existing) {
      return res.status(404).json({ error: 'Promotion not found' });
    }

    execute("DELETE FROM Promotion WHERE PromotionID = ?", [req.params.id]);
    saveDatabase();

    logActivity(req.user.username, 'DELETE', 'Promotion', req.params.id,
      { Title: existing.Title }, req.ip);

    res.json({ message: 'Promotion deleted successfully' });
  } catch (err) {
    logger.error('Delete promotion error:', err);
    res.status(500).json({ error: 'Failed to delete promotion' });
  }
});

// ======== Promotion-Vehicle linking ========

// Get vehicles linked to a promotion
router.get('/:id/vehicles', requireAuth, async (req, res) => {
  try {
    await getDatabase();
    const vehicles = queryAll(`
      SELECT v.*, pv.Performance, pv.CreatedAt as LinkedAt
      FROM Vehicle v
      JOIN Promotion_Vehicle pv ON v.Plate_Number = pv.Plate_Number
      WHERE pv.PromotionID = ?
    `, [req.params.id]);

    res.json(vehicles);
  } catch (err) {
    logger.error('Get promotion vehicles error:', err);
    res.status(500).json({ error: 'Failed to retrieve linked vehicles' });
  }
});

// Link a vehicle to a promotion
router.post('/:id/vehicles', requireAuth, requireRole('staff'), linkValidation, async (req, res) => {
  try {
    const { Plate_Number, Performance } = req.body;

    await getDatabase();

    // Verify promotion exists
    const promotion = queryOne("SELECT * FROM Promotion WHERE PromotionID = ?", [req.params.id]);
    if (!promotion) {
      return res.status(404).json({ error: 'Promotion not found' });
    }

    // Verify vehicle exists
    const vehicle = queryOne("SELECT * FROM Vehicle WHERE Plate_Number = ?", [Plate_Number]);
    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    // Check if already linked
    const existing = queryOne(
      "SELECT * FROM Promotion_Vehicle WHERE PromotionID = ? AND Plate_Number = ?",
      [req.params.id, Plate_Number]
    );
    if (existing) {
      return res.status(409).json({ error: 'Vehicle already linked to this promotion' });
    }

    execute(
      "INSERT INTO Promotion_Vehicle (PromotionID, Plate_Number, Performance) VALUES (?, ?, ?)",
      [req.params.id, Plate_Number, Performance?.trim() || '']
    );
    saveDatabase();

    logActivity(req.user.username, 'LINK', 'Promotion_Vehicle', `${req.params.id}-${Plate_Number}`,
      { PromotionID: req.params.id, Plate_Number }, req.ip);

    res.status(201).json({ message: 'Vehicle linked to promotion successfully' });
  } catch (err) {
    logger.error('Link vehicle error:', err);
    res.status(500).json({ error: 'Failed to link vehicle' });
  }
});

// Update promotion-vehicle link (performance)
router.put('/:id/vehicles/:plate', requireAuth, requireRole('staff'), async (req, res) => {
  try {
    const { Performance } = req.body;
    await getDatabase();

    const existing = queryOne(
      "SELECT * FROM Promotion_Vehicle WHERE PromotionID = ? AND Plate_Number = ?",
      [req.params.id, req.params.plate]
    );
    if (!existing) {
      return res.status(404).json({ error: 'Link not found' });
    }

    execute(
      "UPDATE Promotion_Vehicle SET Performance = ? WHERE PromotionID = ? AND Plate_Number = ?",
      [Performance?.trim(), req.params.id, req.params.plate]
    );
    saveDatabase();

    res.json({ message: 'Performance updated successfully' });
  } catch (err) {
    logger.error('Update performance error:', err);
    res.status(500).json({ error: 'Failed to update performance' });
  }
});

// Unlink a vehicle from a promotion
router.delete('/:id/vehicles/:plate', requireAuth, requireAdmin, async (req, res) => {
  try {
    await getDatabase();
    execute(
      "DELETE FROM Promotion_Vehicle WHERE PromotionID = ? AND Plate_Number = ?",
      [req.params.id, req.params.plate]
    );
    saveDatabase();

    logActivity(req.user.username, 'UNLINK', 'Promotion_Vehicle', `${req.params.id}-${req.params.plate}`,
      null, req.ip);

    res.json({ message: 'Vehicle removed from promotion successfully' });
  } catch (err) {
    logger.error('Unlink vehicle error:', err);
    res.status(500).json({ error: 'Failed to unlink vehicle' });
  }
});

module.exports = router;
