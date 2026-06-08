const { body, query, param, validationResult } = require('express-validator');

// Middleware to check validation results
function handleValidation(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const messages = errors.array().map(e => ({
      field: e.path,
      message: e.msg
    }));
    return res.status(400).json({ error: 'Validation failed', details: messages });
  }
  next();
}

// Login validation
const loginValidation = [
  body('username').trim().notEmpty().withMessage('Username is required'),
  body('password').notEmpty().withMessage('Password is required'),
  handleValidation
];

// Register validation
const registerValidation = [
  body('username').trim().notEmpty().withMessage('Username is required')
    .isLength({ min: 3, max: 50 }).withMessage('Username must be 3-50 characters')
    .matches(/^[a-zA-Z0-9_]+$/).withMessage('Username can only contain letters, numbers, and underscores'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').optional().isIn(['admin', 'staff', 'viewer']).withMessage('Invalid role'),
  handleValidation
];

// Vehicle validation
const vehicleValidation = [
  body('Plate_Number').trim().notEmpty().withMessage('Plate number is required')
    .matches(/^[A-Za-z0-9-]+$/).withMessage('Plate number can only contain letters, numbers, and hyphens'),
  body('Brand').trim().notEmpty().withMessage('Brand is required'),
  body('Model').trim().notEmpty().withMessage('Model is required'),
  body('Year').isInt({ min: 1900, max: 2030 }).withMessage('Year must be between 1900 and 2030'),
  body('Vehicle_Type').trim().notEmpty().withMessage('Vehicle type is required'),
  body('Purchase_Price').isFloat({ min: 0 }).withMessage('Purchase price must be a positive number'),
  body('Status').optional().isIn(['Available', 'Rented', 'Sold', 'Maintenance']).withMessage('Invalid status'),
  handleValidation
];

// Customer validation
const customerValidation = [
  body('FirstName').trim().notEmpty().withMessage('First name is required')
    .isLength({ max: 100 }).withMessage('First name is too long'),
  body('LastName').trim().notEmpty().withMessage('Last name is required')
    .isLength({ max: 100 }).withMessage('Last name is too long'),
  body('Email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('PhoneNumber').trim().notEmpty().withMessage('Phone number is required'),
  body('Status').optional().isIn(['Active', 'Inactive', 'Blocked']).withMessage('Invalid status'),
  handleValidation
];

// Promotion validation
const promotionValidation = [
  body('Title').trim().notEmpty().withMessage('Title is required'),
  body('Description').optional().trim(),
  body('Discount_Type').isIn(['free', 'percentage', 'FLAT_RATE', 'CASHBACK', 'BUY_ONE_GET_ONE', 'Bundle', 'amount'])
    .withMessage('Invalid discount type'),
  body('Discount_Value').isFloat({ min: 0 }).withMessage('Discount value must be a positive number'),
  body('Start_Date').isISO8601().withMessage('Start date must be a valid date'),
  body('End_Date').isISO8601().withMessage('End date must be a valid date'),
  body('Status').optional().isIn(['Active', 'Inactive', 'Expired']).withMessage('Invalid status'),
  handleValidation
];

// Link validation
const linkValidation = [
  body('Plate_Number').trim().notEmpty().withMessage('Plate number is required'),
  handleValidation
];

// Pagination validation
const paginationValidation = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('search').optional().trim(),
  (req, res, next) => next()
];

module.exports = {
  loginValidation,
  registerValidation,
  vehicleValidation,
  customerValidation,
  promotionValidation,
  linkValidation,
  paginationValidation
};
