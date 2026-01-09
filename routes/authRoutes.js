const express = require('express');
const router = express.Router();
const authController = require('../controllers/api/authController');
const placeCategoryController = require('../controllers/api/placeCategoryController');
const placeController = require('../controllers/api/placeController');
const placeBookingController = require('../controllers/api/placeBookingController');
const placeOfferController = require('../controllers/api/placeOfferController');
const activityController = require('../controllers/api/activityController');
const activityScheduler = require('../services/activityScheduler');
const { protect, optionalAuth } = require('../middleware/authMiddleware');
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
// @access  Public (includes isFavorite flag if authenticated)
router.get('/places', optionalAuth, placeController.getAllPlaces);

// @route   GET /api/auth/places/:id
// @desc    Get place by ID with details
// @access  Public (includes isFavorite flag if authenticated)
router.get('/places/:id', optionalAuth, placeController.getPlaceById);

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

/**
 * Place Offer Routes
 * Base URL: /api/auth/places/:placeId/offers and /api/auth/offers
 */

// @route   POST /api/auth/places/:placeId/offers
// @desc    Add a new offer for a place
// @access  Public (can be protected with 'protect' middleware if needed)
router.post('/places/:placeId/offers', placeOfferController.addOffer);

// @route   GET /api/auth/places/:placeId/offers
// @desc    Get all offers for a place
// @access  Public
router.get('/places/:placeId/offers', placeOfferController.getPlaceOffers);

// @route   GET /api/auth/offers/:id
// @desc    Get offer by ID
// @access  Public
router.get('/offers/:id', placeOfferController.getOfferById);

// @route   PUT /api/auth/offers/:id
// @desc    Update offer
// @access  Public (can be protected with 'protect' middleware if needed)
router.put('/offers/:id', placeOfferController.updateOffer);

// @route   DELETE /api/auth/offers/:id
// @desc    Delete offer
// @access  Public (can be protected with 'protect' middleware if needed)
router.delete('/offers/:id', placeOfferController.deleteOffer);

// @route   PATCH /api/auth/offers/:id/toggle-active
// @desc    Toggle offer active status
// @access  Public (can be protected with 'protect' middleware if needed)
router.patch('/offers/:id/toggle-active', placeOfferController.toggleOfferStatus);

// @route   GET /api/auth/offers/validate/:code
// @desc    Validate and get offer by code
// @access  Public
router.get('/offers/validate/:code', placeOfferController.validateOfferCode);

/**
 * Activity Routes
 * Base URL: /api/auth/activities
 */

// @route   POST /api/auth/activities
// @desc    Create a new activity
// @access  Private (requires authentication)
router.post('/activities', protect, activityController.createActivity);

// @route   GET /api/auth/activities
// @desc    Get all activities (with filters and pagination)
// @access  Public
router.get('/activities', activityController.getAllActivities);

// @route   GET /api/auth/activities/upcoming
// @desc    Get upcoming activities
// @access  Public
router.get('/activities/upcoming', activityController.getUpcomingActivities);

// @route   GET /api/auth/activities/live
// @desc    Get live activities
// @access  Public
router.get('/activities/live', activityController.getLiveActivities);

// @route   GET /api/auth/activities/:id
// @desc    Get activity by ID
// @access  Public
router.get('/activities/:id', activityController.getActivityById);

// @route   PUT /api/auth/activities/:id
// @desc    Update activity
// @access  Private (requires authentication)
router.put('/activities/:id', protect, activityController.updateActivity);

// @route   DELETE /api/auth/activities/:id
// @desc    Delete activity
// @access  Private (requires authentication)
router.delete('/activities/:id', protect, activityController.deleteActivity);

// @route   PATCH /api/auth/activities/:id/make-live
// @desc    Make activity live (change status from upcoming to live)
// @access  Private (requires authentication)
router.patch('/activities/:id/make-live', protect, activityController.makeLive);

// @route   PATCH /api/auth/activities/:id/complete
// @desc    Mark activity as completed
// @access  Private (requires authentication)
router.patch('/activities/:id/complete', protect, activityController.completeActivity);

// @route   PATCH /api/auth/activities/:id/cancel
// @desc    Cancel activity
// @access  Private (requires authentication)
router.patch('/activities/:id/cancel', protect, activityController.cancelActivity);

// @route   PATCH /api/auth/activities/:id/toggle-featured
// @desc    Toggle activity featured status
// @access  Private (requires authentication)
router.patch('/activities/:id/toggle-featured', protect, activityController.toggleFeatured);

// @route   GET /api/auth/places/:placeId/activities
// @desc    Get all activities for a specific place
// @access  Public
router.get('/places/:placeId/activities', activityController.getActivitiesByPlace);

/**
 * Test/Debug Routes for Activity Scheduler
 * These endpoints help test the automatic scheduler
 */

// @route   GET /api/auth/test/scheduler/status
// @desc    Check if scheduler is running
// @access  Public (for testing)
router.get('/test/scheduler/status', (req, res) => {
    const status = activityScheduler.getStatus();
    res.json({
        success: true,
        scheduler: status,
        message: status.isRunning ? 'Scheduler is running' : 'Scheduler is not running'
    });
});

// @route   POST /api/auth/test/scheduler/trigger
// @desc    Manually trigger scheduler (for testing without waiting)
// @access  Public (for testing)
router.post('/test/scheduler/trigger', async (req, res) => {
    try {
        await activityScheduler.triggerManually();
        res.json({
            success: true,
            message: 'Scheduler triggered manually. Check console logs for results.'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error triggering scheduler',
            error: error.message
        });
    }
});

// @route   POST /api/auth/test/activity/quick-test
// @desc    Create a test activity that goes live in 1 minute (for quick testing)
// @access  Private (requires authentication)
router.post('/test/activity/quick-test', protect, async (req, res) => {
    try {
        const Activity = require('../models/ActivityModel');
        
        // Create activity that starts in 1 minute and ends in 3 minutes
        const now = new Date();
        const startDate = new Date(now.getTime() + 1 * 60000); // +1 minute
        const endDate = new Date(now.getTime() + 3 * 60000);   // +3 minutes
        
        const activity = await Activity.create({
            title: `Quick Test Activity - ${now.toLocaleTimeString()}`,
            description: 'Auto-generated test activity for scheduler testing',
            activity_type: 'event',
            status: 'upcoming',
            start_date: startDate,
            end_date: endDate,
            is_free: true,
            is_active: true,
            created_by: req.user.id
        });
        
        res.status(201).json({
            success: true,
            message: 'Test activity created!',
            data: activity,
            testing: {
                currentTime: now.toISOString(),
                goesLiveAt: startDate.toISOString(),
                completesAt: endDate.toISOString(),
                instructions: [
                    '1. Wait 1 minute for activity to go LIVE',
                    '2. Wait 3 minutes for activity to COMPLETE',
                    '3. Watch console logs for scheduler updates',
                    '4. Or call POST /api/auth/test/scheduler/trigger to test immediately'
                ]
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error creating test activity',
            error: error.message
        });
    }
});

module.exports = router;

