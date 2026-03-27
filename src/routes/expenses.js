const express = require('express');
const router = express.Router();
const {
  getExpenses, getExpense, createExpense,
  updateExpense, deleteExpense, exportCSV,
} = require('../controllers/expensesController');
const { expenseValidation } = require('../middleware/validate');
const { protect } = require('../middleware/auth');

router.use(protect);

router.route('/')
  .get(getExpenses)
  .post(expenseValidation, createExpense);

router.get('/export', exportCSV);

router.route('/:id')
  .get(getExpense)
  .put(expenseValidation, updateExpense)
  .delete(deleteExpense);

module.exports = router;
