const Expense = require('../models/Expense');
const User = require('../models/User');
const {
  startOfDay, endOfDay,
  startOfWeek, endOfWeek,
  startOfMonth, endOfMonth,
} = require('date-fns');

// @desc  Get dashboard stats
// @route GET /api/dashboard
const getDashboard = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const now = new Date();

    const [todayAgg, weekAgg, monthAgg, recent, categories] = await Promise.all([
      Expense.aggregate([
        { $match: { userId, date: { $gte: startOfDay(now), $lte: endOfDay(now) } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Expense.aggregate([
        { $match: { userId, date: { $gte: startOfWeek(now, { weekStartsOn: 1 }), $lte: endOfWeek(now, { weekStartsOn: 1 }) } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Expense.aggregate([
        { $match: { userId, date: { $gte: startOfMonth(now), $lte: endOfMonth(now) } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Expense.find({ userId }).sort({ date: -1, createdAt: -1 }).limit(5).lean(),
      Expense.aggregate([
        { $match: { userId, date: { $gte: startOfMonth(now), $lte: endOfMonth(now) } } },
        { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } },
        { $sort: { total: -1 } },
      ]),
    ]);

    const totalThisMonth = monthAgg[0]?.total || 0;

    res.json({
      totalToday: todayAgg[0]?.total || 0,
      totalThisWeek: weekAgg[0]?.total || 0,
      totalThisMonth,
      recentExpenses: recent,
      categoryBreakdown: categories.map(c => ({
        category: c._id,
        total: c.total,
        count: c.count,
      })),
      budgetLimit: req.user.budgetLimit || null,
      budgetUsed: totalThisMonth,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getDashboard };
