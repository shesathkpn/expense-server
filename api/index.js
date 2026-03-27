require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');

const connectDB = require('../src/config/db');
const authRoutes = require('../src/routes/auth');
const expenseRoutes = require('../src/routes/expenses');
const dashboardRoutes = require('../src/routes/dashboard');
const analyticsRoutes = require('../src/routes/analytics');
const { errorHandler, notFound } = require('../src/middleware/errorHandler');

const app = express();

// Only connect to DB once
let dbConnected = false;

async function initializeApp() {
  if (!dbConnected) {
    try {
      await connectDB();
      dbConnected = true;
    } catch (err) {
      console.error('Database connection error:', err);
      // Don't throw - let the app start anyway
    }
  }
}

// Initialize on first request or module load
initializeApp().catch(err => console.error('Init error:', err));

// Security Middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { message: 'Too many requests, please try again later.' },
});
app.use('/api', limiter);

// CORS
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Body parsing
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Xpensio API is running', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/analytics', analyticsRoutes);

// Error Handlers
app.use(notFound);
app.use(errorHandler);

module.exports = app;
export default app;
