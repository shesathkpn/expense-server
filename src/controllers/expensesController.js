const Expense = require('../models/Expense');
const { format } = require('date-fns');

// @desc  Get expenses (paginated + filtered)
// @route GET /api/expenses
const getExpenses = async (req, res, next) => {
  try {
    const { page = 1, limit = 15, startDate, endDate, category, search } = req.query;
    const userId = req.user._id;

    const filter = { userId };

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    if (category && category !== 'all') filter.category = category;
    if (search) filter.title = { $regex: search, $options: 'i' };

    const skip = (Number(page) - 1) * Number(limit);

    const [expenses, total] = await Promise.all([
      Expense.find(filter).sort({ date: -1, createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
      Expense.countDocuments(filter),
    ]);

    res.json({
      expenses,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
      hasMore: Number(page) * Number(limit) < total,
    });
  } catch (err) {
    next(err);
  }
};

// @desc  Get single expense
// @route GET /api/expenses/:id
const getExpense = async (req, res, next) => {
  try {
    const expense = await Expense.findOne({ _id: req.params.id, userId: req.user._id });
    if (!expense) return res.status(404).json({ message: 'Expense not found' });
    res.json({ expense });
  } catch (err) {
    next(err);
  }
};

// @desc  Create expense
// @route POST /api/expenses
const createExpense = async (req, res, next) => {
  try {
    const { title, amount, category, date, notes, isRecurring, recurringInterval } = req.body;
    const expense = await Expense.create({
      userId: req.user._id,
      title, amount, category,
      date: new Date(date),
      notes: notes || '',
      isRecurring: isRecurring || false,
      recurringInterval: recurringInterval || null,
    });
    res.status(201).json({ message: 'Expense created', expense });
  } catch (err) {
    next(err);
  }
};

// @desc  Update expense
// @route PUT /api/expenses/:id
const updateExpense = async (req, res, next) => {
  try {
    const { title, amount, category, date, notes, isRecurring, recurringInterval } = req.body;
    const expense = await Expense.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { title, amount, category, date: new Date(date), notes, isRecurring, recurringInterval },
      { new: true, runValidators: true }
    );
    if (!expense) return res.status(404).json({ message: 'Expense not found' });
    res.json({ message: 'Expense updated', expense });
  } catch (err) {
    next(err);
  }
};

// @desc  Delete expense
// @route DELETE /api/expenses/:id
const deleteExpense = async (req, res, next) => {
  try {
    const expense = await Expense.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!expense) return res.status(404).json({ message: 'Expense not found' });
    res.json({ message: 'Expense deleted' });
  } catch (err) {
    next(err);
  }
};

// @desc  Export expenses as CSV
// @route GET /api/expenses/export
const exportCSV = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const filter = { userId: req.user._id };
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    const expenses = await Expense.find(filter).sort({ date: -1 }).lean();

    const headers = ['Title', 'Amount (INR)', 'Category', 'Date', 'Notes', 'Recurring', 'Created At'];
    const rows = expenses.map(e => [
      `"${String(e.title).replace(/"/g, '""')}"`,
      e.amount.toFixed(2),
      e.category,
      format(new Date(e.date), 'yyyy-MM-dd'),
      `"${String(e.notes || '').replace(/"/g, '""')}"`,
      e.isRecurring ? 'Yes' : 'No',
      format(new Date(e.createdAt), 'yyyy-MM-dd HH:mm:ss'),
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="expenses-${format(new Date(), 'yyyy-MM-dd')}.csv"`);
    res.send(csv);
  } catch (err) {
    next(err);
  }
};

module.exports = { getExpenses, getExpense, createExpense, updateExpense, deleteExpense, exportCSV };
