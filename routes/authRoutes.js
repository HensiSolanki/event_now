const express = require('express');
const router = express.Router();
const authController = require('../controllers/api/authController');
const placeCategoryController = require('../controllers/api/placeCategoryController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/upload');

/**
 * Authentication Routes
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

/**
 * Place Category Routes
 * Base URL: /api/auth/place-categories
 */

// @route   GET /api/auth/place-categories
// @desc    Get all categories (with optional filtering)
// @access  Public
router.get('/place-categories', placeCategoryController.getAllCategories);

// @route   GET /api/auth/place-categories/:id
// @desc    Get category by ID
// @access  Public
router.get('/place-categories/:id', placeCategoryController.getCategoryById);

// @route   POST /api/auth/place-categories
// @desc    Create new category
// @access  Public
router.post('/place-categories', upload.single('icon'), placeCategoryController.createCategory);

// @route   PUT /api/auth/place-categories/:id
// @desc    Update category
// @access  Public
router.put('/place-categories/:id', upload.single('icon'), placeCategoryController.updateCategory);

// @route   PATCH /api/auth/place-categories/:id/toggle
// @desc    Toggle category active status
// @access  Public
router.patch('/place-categories/:id/toggle', placeCategoryController.toggleCategoryStatus);

// @route   DELETE /api/auth/place-categories/:id
// @desc    Delete category
// @access  Public
router.delete('/place-categories/:id', placeCategoryController.deleteCategory);

module.exports = router;

