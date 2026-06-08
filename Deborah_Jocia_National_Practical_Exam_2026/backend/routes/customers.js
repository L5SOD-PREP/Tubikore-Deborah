const express = require('express');
const { getDatabase, saveDatabase, queryAll, queryOne, execute, logActivity } = require('../config/db');
const { requireAuth, requireRole, requireAdmin } = require('../middleware/auth');
const { customerValidation, paginationValidation } = require('../config/validation');
const logger = require('../config/logger');

const router = express.Router();

// Get all customers with pagination and search
router.get('/', requireAuth, paginationValidation, async (req, res) => {
  try {
    await getDatabase();
    const { search, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let countQuery = 'SELECT COUNT(*) as total FROM Customer c';
    let dataQuery = `
      SELECT c.*, u.UserName as RegisteredByName
      FROM Customer c
      JOIN Users u ON c.RegisteredBy = u.UserName
    `;
    const params = [];
    const countParams = [];

    if (search) {
      const whereClause = ` WHERE c.FirstName LIKE ? OR c.LastName LIKE ? OR c.Email LIKE ? OR c.PhoneNumber LIKE ?`;
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

    dataQuery += ` ORDER BY c.LastName, c.FirstName LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), offset);
    const customers = queryAll(dataQuery, params);

    res.json({
      data: customers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (err) {
    logger.error('Get customers error:', err);
    res.status(500).json({ error: 'Failed to retrieve customers' });
  }
});

// Get single customer
router.get('/:id', requireAuth, async (req, res) => {
  try {
    await getDatabase();
    const customer = queryOne(
      "SELECT c.*, u.UserName as RegisteredByName FROM Customer c JOIN Users u ON c.RegisteredBy = u.UserName WHERE c.CustomerID = ?",
      [req.params.id]
    );

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    res.json(customer);
  } catch (err) {
    logger.error('Get customer error:', err);
    res.status(500).json({ error: 'Failed to retrieve customer' });
  }
});

// Create customer
router.post('/', requireAuth, requireRole('staff'), customerValidation, async (req, res) => {
  try {
    const { FirstName, LastName, Email, PhoneNumber, Status } = req.body;

    await getDatabase();

    // Check for duplicate email
    const existingEmail = queryOne("SELECT * FROM Customer WHERE Email = ?", [Email]);
    if (existingEmail) {
      return res.status(409).json({ error: 'A customer with this email already exists' });
    }

    execute(
      "INSERT INTO Customer (FirstName, LastName, Email, PhoneNumber, Status, RegisteredBy) VALUES (?, ?, ?, ?, ?, ?)",
      [FirstName.trim(), LastName.trim(), Email, PhoneNumber, Status || 'Active', req.user.username]
    );
    saveDatabase();

    logActivity(req.user.username, 'CREATE', 'Customer', null,
      { FirstName, LastName, Email }, req.ip);

    res.status(201).json({ message: 'Customer created successfully' });
  } catch (err) {
    logger.error('Create customer error:', err);
    res.status(500).json({ error: 'Failed to create customer' });
  }
});

// Update customer
router.put('/:id', requireAuth, requireRole('staff'), customerValidation, async (req, res) => {
  try {
    const { FirstName, LastName, Email, PhoneNumber, Status } = req.body;
    await getDatabase();

    const existing = queryOne("SELECT * FROM Customer WHERE CustomerID = ?", [req.params.id]);
    if (!existing) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    execute(
      "UPDATE Customer SET FirstName = ?, LastName = ?, Email = ?, PhoneNumber = ?, Status = ?, UpdatedAt = datetime('now') WHERE CustomerID = ?",
      [FirstName.trim(), LastName.trim(), Email, PhoneNumber, Status, req.params.id]
    );
    saveDatabase();

    logActivity(req.user.username, 'UPDATE', 'Customer', req.params.id,
      { FirstName, LastName, Email, Status }, req.ip);

    res.json({ message: 'Customer updated successfully' });
  } catch (err) {
    logger.error('Update customer error:', err);
    res.status(500).json({ error: 'Failed to update customer' });
  }
});

// Delete customer
router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    await getDatabase();
    const existing = queryOne("SELECT * FROM Customer WHERE CustomerID = ?", [req.params.id]);
    if (!existing) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    execute("DELETE FROM Customer WHERE CustomerID = ?", [req.params.id]);
    saveDatabase();

    logActivity(req.user.username, 'DELETE', 'Customer', req.params.id,
      { Name: `${existing.FirstName} ${existing.LastName}` }, req.ip);

    res.json({ message: 'Customer deleted successfully' });
  } catch (err) {
    logger.error('Delete customer error:', err);
    res.status(500).json({ error: 'Failed to delete customer' });
  }
});

module.exports = router;
