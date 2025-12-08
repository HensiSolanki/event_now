const express = require('express');
const router = express.Router();
const authController = require('../controllers/api/authController');
const placeCategoryController = require('../controllers/api/placeCategoryController');
const placeController = require('../controllers/api/placeController');
const placeBookingController = require('../controllers/api/placeBookingController');
const { protect } = require('../middleware/authMiddleware');
const { categoryUpload, placeUpload } = require('../middleware/upload');

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
router.post('/place-categories', categoryUpload.single('icon'), placeCategoryController.createCategory);

// @route   PUT /api/auth/place-categories/:id
// @desc    Update category
// @access  Public
router.put('/place-categories/:id', categoryUpload.single('icon'), placeCategoryController.updateCategory);

// @route   DELETE /api/auth/place-categories/:id
// @desc    Delete category
// @access  Public
router.delete('/place-categories/:id', placeCategoryController.deleteCategory);

/**
 * Place Routes
 * Base URL: /api/auth/places
 */

// @route   GET /api/auth/places
// @desc    Get all places (with filtering and pagination)
// @access  Public
router.get('/places', placeController.getAllPlaces);

// @route   GET /api/auth/places/:id
// @desc    Get place by ID with details
// @access  Public
router.get('/places/:id', placeController.getPlaceById);

// @route   POST /api/auth/places
// @desc    Create new place (with multiple images)
// @access  Public (can be protected with 'protect' middleware if needed)
router.post('/places', placeUpload.array('images', 10), placeController.createPlace);

// @route   PUT /api/auth/places/:id
// @desc    Update place (can add more images)
// @access  Public (can be protected with 'protect' middleware if needed)
router.put('/places/:id', placeUpload.array('images', 10), placeController.updatePlace);

// @route   DELETE /api/auth/places/:id
// @desc    Delete place
// @access  Public (can be protected with 'protect' middleware if needed)
router.delete('/places/:id', placeController.deletePlace);

// @route   PATCH /api/auth/places/:id/toggle-active
// @desc    Toggle place active status
// @access  Public (can be protected with 'protect' middleware if needed)
router.patch('/places/:id/toggle-active', placeController.togglePlaceStatus);

// @route   PATCH /api/auth/places/:id/toggle-featured
// @desc    Toggle place featured status
// @access  Public (can be protected with 'protect' middleware if needed)
router.patch('/places/:id/toggle-featured', placeController.toggleFeaturedStatus);

// @route   DELETE /api/auth/places/:placeId/images/:imageId
// @desc    Delete a specific image from place
// @access  Public (can be protected with 'protect' middleware if needed)
router.delete('/places/:placeId/images/:imageId', placeController.deletePlaceImage);

// @route   PATCH /api/auth/places/:placeId/images/:imageId/set-primary
// @desc    Set image as primary/featured for place
// @access  Public (can be protected with 'protect' middleware if needed)
router.patch('/places/:placeId/images/:imageId/set-primary', placeController.setPrimaryImage);

/**
 * Place Rating Routes
 * Base URL: /api/auth/places/:id/ratings
 */

// @route   POST /api/auth/places/:id/ratings
// @desc    Add or update rating for a place
// @access  Private (requires authentication)
router.post('/places/:id/ratings', protect, placeController.addRating);

// @route   GET /api/auth/places/:id/ratings
// @desc    Get all ratings for a place
// @access  Public
router.get('/places/:id/ratings', placeController.getPlaceRatings);

/**
 * Favorite Places Routes
 * Base URL: /api/auth/places
 */

// @route   GET /api/auth/places/favorites/my-favorites
// @desc    Get all user's favorite places
// @access  Private (requires authentication)
router.get('/places/favorites/my-favorites', protect, placeController.getUserFavorites);

// @route   GET /api/auth/places/favorites/stats
// @desc    Get user's favorite statistics
// @access  Private (requires authentication)
router.get('/places/favorites/stats', protect, placeController.getFavoriteStats);

// @route   GET /api/auth/places/:id/favorites/check
// @desc    Check if a place is favorited by user
// @access  Private (requires authentication)
router.get('/places/:id/favorites/check', protect, placeController.checkFavoriteStatus);

// @route   POST /api/auth/places/:id/favorites
// @desc    Add place to favorites
// @access  Private (requires authentication)
router.post('/places/:id/favorites', protect, placeController.addToFavorites);

// @route   DELETE /api/auth/places/:id/favorites
// @desc    Remove place from favorites
// @access  Private (requires authentication)
router.delete('/places/:id/favorites', protect, placeController.removeFromFavorites);

/**
 * Place Booking Routes
 * Base URL: /api/auth/bookings
 */

// @route   POST /api/auth/bookings
// @desc    Create a new booking
// @access  Private (requires authentication)
router.post('/bookings', protect, placeBookingController.createBooking);

// @route   GET /api/auth/bookings
// @desc    Get all user's bookings (with filters and pagination)
// @access  Private (requires authentication)
router.get('/bookings', protect, placeBookingController.getAllBookings);

// @route   GET /api/auth/bookings/upcoming/list
// @desc    Get upcoming bookings
// @access  Private (requires authentication)
router.get('/bookings/upcoming/list', protect, placeBookingController.getUpcomingBookings);

// @route   GET /api/auth/bookings/history/list
// @desc    Get booking history (past bookings)
// @access  Private (requires authentication)
router.get('/bookings/history/list', protect, placeBookingController.getBookingHistory);

// @route   GET /api/auth/bookings/:id
// @desc    Get booking by ID
// @access  Private (requires authentication)
router.get('/bookings/:id', protect, placeBookingController.getBookingById);

// @route   PUT /api/auth/bookings/:id
// @desc    Update booking
// @access  Private (requires authentication)
router.put('/bookings/:id', protect, placeBookingController.updateBooking);

// @route   PATCH /api/auth/bookings/:id/cancel
// @desc    Cancel booking
// @access  Private (requires authentication)
router.patch('/bookings/:id/cancel', protect, placeBookingController.cancelBooking);

module.exports = router;

