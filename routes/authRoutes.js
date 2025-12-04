const express = require('express');
const router = express.Router();
const authController = require('../controllers/api/authController');
const { protect } = require('../middleware/authMiddleware');

/**
 * Public routes (no authentication required)
 */

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', authController.register);

// @route   POST /api/auth/login
// @desc    Login user and get JWT token
// @access  Public
router.post('/login', authController.login);

/**
 * Protected routes (authentication required)
 */

// @route   GET /api/auth/me
// @desc    Get current user profile
// @access  Private
router.get('/me', protect, authController.getMe);

// @route   PUT /api/auth/update-profile
// @desc    Update user profile (name, email)
// @access  Private
router.put('/update-profile', protect, authController.updateProfile);

// @route   PUT /api/auth/change-password
// @desc    Change user password
// @access  Private
router.put('/change-password', protect, authController.changePassword);

module.exports = router;

