const User = require('../models/User');
const {
  signAccessToken, signRefreshToken,
  verifyRefreshToken, setCookies, clearCookies,
} = require('../utils/jwt');

// @desc  Register user
// @route POST /api/auth/signup
const signup = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: 'An account with this email already exists' });
    }

    const user = await User.create({ name, email, password });

    const payload = { userId: user._id.toString(), email: user.email, name: user.name };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    user.refreshToken = refreshToken;
    await user.save();

    setCookies(res, accessToken, refreshToken);

    res.status(201).json({
      message: 'Account created successfully',
      user: user.toJSON(),
      accessToken,
    });
  } catch (err) {
    next(err);
  }
};

// @desc  Login user
// @route POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password +refreshToken');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const payload = { userId: user._id.toString(), email: user.email, name: user.name };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    user.refreshToken = refreshToken;
    await user.save();

    setCookies(res, accessToken, refreshToken);

    res.json({
      message: 'Login successful',
      user: user.toJSON(),
      accessToken,
    });
  } catch (err) {
    next(err);
  }
};

// @desc  Logout
// @route POST /api/auth/logout
const logout = async (req, res, next) => {
  try {
    if (req.user) {
      await User.findByIdAndUpdate(req.user._id, { refreshToken: null });
    }
    clearCookies(res);
    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
};

// @desc  Refresh token
// @route POST /api/auth/refresh
const refresh = async (req, res, next) => {
  try {
    const token = req.cookies?.refresh_token;
    if (!token) {
      return res.status(401).json({ message: 'Refresh token not found' });
    }

    const decoded = verifyRefreshToken(token);
    const user = await User.findById(decoded.userId).select('+refreshToken');

    if (!user || user.refreshToken !== token) {
      clearCookies(res);
      return res.status(401).json({ message: 'Invalid refresh token' });
    }

    const payload = { userId: user._id.toString(), email: user.email, name: user.name };
    const newAccessToken = signAccessToken(payload);
    const newRefreshToken = signRefreshToken(payload);

    user.refreshToken = newRefreshToken;
    await user.save();

    setCookies(res, newAccessToken, newRefreshToken);

    res.json({ message: 'Token refreshed', accessToken: newAccessToken });
  } catch (err) {
    clearCookies(res);
    next(err);
  }
};

// @desc  Get current user
// @route GET /api/auth/me
const getMe = async (req, res) => {
  res.json({ user: req.user });
};

// @desc  Update profile
// @route PATCH /api/auth/me
const updateMe = async (req, res, next) => {
  try {
    const { name, budgetLimit } = req.body;
    const updates = {};
    if (name) updates.name = name.trim();
    if (typeof budgetLimit === 'number') updates.budgetLimit = budgetLimit;

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });
    res.json({ message: 'Profile updated', user });
  } catch (err) {
    next(err);
  }
};

module.exports = { signup, login, logout, refresh, getMe, updateMe };
