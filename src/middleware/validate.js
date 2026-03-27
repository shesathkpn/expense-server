const { body, validationResult } = require('express-validator');

const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const fieldErrors = {};
    errors.array().forEach(err => {
      if (!fieldErrors[err.path]) fieldErrors[err.path] = [];
      fieldErrors[err.path].push(err.msg);
    });
    return res.status(400).json({
      message: 'Validation failed',
      errors: fieldErrors,
    });
  }
  next();
};

const signupValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('email')
    .isEmail()
    .withMessage('Please enter a valid email')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/)
    .withMessage('Password must contain at least one uppercase letter')
    .matches(/[0-9]/)
    .withMessage('Password must contain at least one number'),
  handleValidation,
];

const loginValidation = [
  body('email').isEmail().withMessage('Valid email required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
  handleValidation,
];

const CATEGORIES = [
  'Food', 'Travel', 'Bills', 'Shopping', 'Health',
  'Entertainment', 'Education', 'Housing', 'Transportation', 'Other',
];

const expenseValidation = [
  body('title')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Title must be between 1 and 100 characters'),
  body('amount')
    .isFloat({ min: 0.01, max: 10000000 })
    .withMessage('Amount must be a positive number'),
  body('category')
    .isIn(CATEGORIES)
    .withMessage('Invalid category'),
  body('date')
    .isISO8601()
    .withMessage('Valid date is required'),
  body('notes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Notes cannot exceed 500 characters'),
  body('isRecurring')
    .optional()
    .isBoolean(),
  body('recurringInterval')
    .optional({ nullable: true })
    .isIn(['daily', 'weekly', 'monthly', null, '']),
  handleValidation,
];

module.exports = { signupValidation, loginValidation, expenseValidation };
