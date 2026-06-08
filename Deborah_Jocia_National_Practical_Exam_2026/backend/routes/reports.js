const express = require('express');
const { getDatabase, queryAll, logActivity } = require('../config/db');
const { requireAuth, requireRole } = require('../middleware/auth');
const logger = require('../config/logger');

const router = express.Router();

// Get report: All customers with promotions that apply to vehicles
router.get('/customer-promotions', requireAuth, async (req, res) => {
  try {
    await getDatabase();
    const { page = 1, limit = 50 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const countResult = queryAll(`SELECT COUNT(*) as total FROM (
      SELECT c.FirstName || ' ' || c.LastName AS CustomerName
      FROM Customer c
      CROSS JOIN Vehicle v
      JOIN Promotion_Vehicle pv ON v.Plate_Number = pv.Plate_Number
      JOIN Promotion p ON pv.PromotionID = p.PromotionID
      WHERE c.Status = 'Active'
        AND v.Status = 'Available'
        AND p.Status = 'Active'
        AND datetime(p.Start_Date) <= datetime('now')
        AND datetime(p.End_Date) >= datetime('now')
    )`);

    const total = countResult[0]?.total || 0;

    const report = queryAll(`
      SELECT 
        c.FirstName || ' ' || c.LastName AS CustomerName,
        c.Email AS CustomerEmail,
        c.PhoneNumber AS CustomerPhone,
        v.Brand AS VehicleBrand,
        v.Model AS VehicleModel,
        v.Plate_Number AS VehiclePlate,
        p.Title AS PromotionTitle,
        p.Discount_Value AS DiscountValue,
        p.Discount_Type AS DiscountType,
        pv.Performance,
        p.Start_Date AS PromotionStart,
        p.End_Date AS PromotionEnd
      FROM Customer c
      CROSS JOIN Vehicle v
      JOIN Promotion_Vehicle pv ON v.Plate_Number = pv.Plate_Number
      JOIN Promotion p ON pv.PromotionID = p.PromotionID
      WHERE c.Status = 'Active'
        AND v.Status = 'Available'
        AND p.Status = 'Active'
        AND datetime(p.Start_Date) <= datetime('now')
        AND datetime(p.End_Date) >= datetime('now')
      ORDER BY c.LastName, c.FirstName, v.Brand, v.Model
      LIMIT ? OFFSET ?
    `, [parseInt(limit), offset]);

    // Enrich with discount type labels
    const typeMap = {
      'free': 'Free',
      'percentage': 'Percentage',
      'FLAT_RATE': 'Flat Rate',
      'CASHBACK': 'Cashback',
      'BUY_ONE_GET_ONE': 'Buy One Get One',
      'Bundle': 'Bundle',
      'amount': 'Amount'
    };
    const enriched = report.map(row => ({
      ...row,
      DiscountTypeLabel: typeMap[row.DiscountType] || row.DiscountType
    }));

    logActivity(req.user.username, 'VIEW_REPORT', 'Report', 'customer-promotions', null, req.ip);

    res.json({
      data: enriched,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (err) {
    logger.error('Report error:', err);
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

// Get dashboard stats
router.get('/stats', requireAuth, async (req, res) => {
  try {
    await getDatabase();

    const stats = queryAll(`
      SELECT 
        (SELECT COUNT(*) FROM Vehicle) as totalVehicles,
        (SELECT COUNT(*) FROM Vehicle WHERE Status = 'Available') as activeVehicles,
        (SELECT COUNT(*) FROM Vehicle WHERE Status = 'Rented') as rentedVehicles,
        (SELECT COUNT(*) FROM Vehicle WHERE Status = 'Sold') as soldVehicles,
        (SELECT COUNT(*) FROM Customer) as totalCustomers,
        (SELECT COUNT(*) FROM Customer WHERE Status = 'Active') as activeCustomers,
        (SELECT COUNT(*) FROM Customer WHERE Status = 'Inactive') as inactiveCustomers,
        (SELECT COUNT(*) FROM Customer WHERE Status = 'Blocked') as blockedCustomers,
        (SELECT COUNT(*) FROM Promotion) as totalPromotions,
        (SELECT COUNT(*) FROM Promotion WHERE Status = 'Active') as activePromotions,
        (SELECT COUNT(*) FROM Promotion WHERE Status = 'Expired') as expiredPromotions,
        (SELECT COUNT(*) FROM Activity_Logs WHERE datetime(CreatedAt) >= datetime('now', '-7 days')) as recentActivities,
        (SELECT COUNT(*) FROM Notifications WHERE IsRead = 0) as unreadNotifications
    `);

    res.json(stats[0] || {});
  } catch (err) {
    logger.error('Stats error:', err);
    res.status(500).json({ error: 'Failed to load stats' });
  }
});

// Get activity logs (admin only)
router.get('/activity', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    await getDatabase();
    const { page = 1, limit = 50 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const totalResult = queryAll("SELECT COUNT(*) as total FROM Activity_Logs");
    const total = totalResult[0]?.total || 0;

    const logs = queryAll(`
      SELECT * FROM Activity_Logs
      ORDER BY CreatedAt DESC
      LIMIT ? OFFSET ?
    `, [parseInt(limit), offset]);

    res.json({
      data: logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (err) {
    logger.error('Activity logs error:', err);
    res.status(500).json({ error: 'Failed to retrieve activity logs' });
  }
});

// Get unread notifications
router.get('/notifications', requireAuth, async (req, res) => {
  try {
    await getDatabase();
    const notifications = queryAll(
      "SELECT * FROM Notifications WHERE UserName = ? ORDER BY CreatedAt DESC LIMIT 20",
      [req.user.username]
    );
    res.json(notifications);
  } catch (err) {
    logger.error('Notifications error:', err);
    res.status(500).json({ error: 'Failed to load notifications' });
  }
});

// Mark notification as read
router.put('/notifications/:id/read', requireAuth, async (req, res) => {
  try {
    await getDatabase();
    const { execute } = require('../config/db');
    execute(
      "UPDATE Notifications SET IsRead = 1 WHERE NotificationID = ? AND UserName = ?",
      [req.params.id, req.user.username]
    );
    res.json({ message: 'Notification marked as read' });
  } catch (err) {
    logger.error('Mark notification error:', err);
    res.status(500).json({ error: 'Failed to update notification' });
  }
});

module.exports = router;
