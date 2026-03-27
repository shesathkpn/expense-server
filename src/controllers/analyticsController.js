const Expense = require('../models/Expense');
const {
  startOfDay, endOfDay, subDays,
  startOfWeek, endOfWeek, subWeeks,
  startOfMonth, endOfMonth, subMonths,
  format, eachDayOfInterval, eachWeekOfInterval,
} = require('date-fns');

// @desc  Get analytics data
// @route GET /api/analytics?period=day|week|month
const getAnalytics = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const period = req.query.period || 'month';
    const now = new Date();

    let startDate, endDate;

    if (period === 'day') {
      startDate = startOfDay(subDays(now, 29));
      endDate = endOfDay(now);
    } else if (period === 'week') {
      startDate = startOfWeek(subWeeks(now, 11), { weekStartsOn: 1 });
      endDate = endOfWeek(now, { weekStartsOn: 1 });
    } else {
      startDate = startOfMonth(subMonths(now, 5));
      endDate = endOfMonth(now);
    }

    const [rawData, categoryData, topExpenses] = await Promise.all([
      Expense.aggregate([
        { $match: { userId, date: { $gte: startDate, $lte: endDate } } },
        {
          $group: {
            _id: {
              year: { $year: '$date' },
              month: { $month: '$date' },
              day: { $dayOfMonth: '$date' },
            },
            total: { $sum: '$amount' },
            date: { $first: '$date' },
          },
        },
        { $sort: { date: 1 } },
      ]),
      Expense.aggregate([
        { $match: { userId, date: { $gte: startDate, $lte: endDate } } },
        { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } },
        { $sort: { total: -1 } },
      ]),
      Expense.find({ userId, date: { $gte: startDate, $lte: endDate } })
        .sort({ amount: -1 }).limit(5).lean(),
    ]);

    // Build complete date series
    let chartData = [];

    if (period === 'day') {
      const days = eachDayOfInterval({ start: startDate, end: endDate });
      chartData = days.map(day => {
        const key = format(day, 'yyyy-MM-dd');
        const found = rawData.find(d => format(new Date(d.date), 'yyyy-MM-dd') === key);
        return { date: key, amount: found?.total || 0, label: format(day, 'MMM dd') };
      });
    } else if (period === 'week') {
      const weeks = eachWeekOfInterval({ start: startDate, end: endDate }, { weekStartsOn: 1 });
      chartData = weeks.map(weekStart => {
        const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
        const weekData = rawData.filter(d => {
          const d2 = new Date(d.date);
          return d2 >= weekStart && d2 <= weekEnd;
        });
        const total = weekData.reduce((s, d) => s + d.total, 0);
        return {
          date: format(weekStart, 'yyyy-MM-dd'),
          amount: total,
          label: `Week of ${format(weekStart, 'MMM dd')}`,
        };
      });
    } else {
      for (let i = 5; i >= 0; i--) {
        const monthDate = subMonths(now, i);
        const ms = startOfMonth(monthDate);
        const me = endOfMonth(monthDate);
        const monthData = rawData.filter(d => {
          const d2 = new Date(d.date);
          return d2 >= ms && d2 <= me;
        });
        const total = monthData.reduce((s, d) => s + d.total, 0);
        chartData.push({
          date: format(ms, 'yyyy-MM'),
          amount: total,
          label: format(ms, 'MMM yyyy'),
        });
      }
    }

    res.json({
      chartData,
      categoryData: categoryData.map(c => ({ category: c._id, total: c.total, count: c.count })),
      topExpenses,
      period,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAnalytics };
