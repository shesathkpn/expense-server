const express = require('express');
const router = express.Router();
const { signup, login, logout, refresh, getMe, updateMe } = require('../controllers/authController');
const { signupValidation, loginValidation } = require('../middleware/validate');
const { protect } = require('../middleware/auth');

router.post('/signup', signupValidation, signup);
router.post('/login', loginValidation, login);
router.post('/logout', protect, logout);
router.post('/refresh', refresh);
router.get('/me', protect, getMe);
router.patch('/me', protect, updateMe);

module.exports = router;
