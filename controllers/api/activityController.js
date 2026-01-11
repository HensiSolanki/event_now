const Activity = require('../../models/ActivityModel');
const Place = require('../../models/PlaceModel');
const PlaceCategory = require('../../models/PlaceCategoryModel');
const PlaceImage = require('../../models/PlaceImageModel');
const User = require('../../models/UserModel');
const sequelize = require('../../config/database');
const { Op } = require('sequelize');

/**
 * Activity Controller
 * Handles all operations related to activities (upcoming and live)
 */

const activityController = {
    /**
     * Create a new activity
     * POST /api/auth/activities
     * @access Private (requires authentication)
     */
    createActivity: async (req, res) => {
        try {
            const {
                place_id,
                title,
                description,
                activity_type,
                location,
                latitude,
                longitude,
                start_date,
                end_date,
                entry_fee,
                is_free,
                max_participants,
                contact_phone,
                contact_email,
                organizer_name,
                tags
            } = req.body;

            // Validate required fields
            if (!title || !start_date) {
                return res.status(400).json({
                    success: false,
                    message: 'Title and start date are required'
                });
            }

            // If place_id is provided, check if place exists
            if (place_id) {
                const place = await Place.findByPk(place_id);
                if (!place) {
                    return res.status(404).json({
                        success: false,
                        message: 'Place not found'
                    });
                }
            }

            // Validate start date is not in the past
            const startDateObj = new Date(start_date);
            const now = new Date();
            
            if (startDateObj < now) {
                return res.status(400).json({
                    success: false,
                    message: 'Start date cannot be in the past'
                });
            }

            // Handle image upload if provided
            let imagePath = null;
            if (req.file) {
                imagePath = `uploads/activities/${req.file.filename}`;
            }

            // Create activity
            const activity = await Activity.create({
                place_id: place_id || null,
                title,
                description: description || null,
                activity_type: activity_type || 'event',
                status: 'upcoming',
                location: location || null,
                latitude: latitude || null,
                longitude: longitude || null,
                start_date,
                end_date: end_date || null,
                image_path: imagePath,
                entry_fee: entry_fee || 0.00,
                is_free: is_free !== undefined ? is_free : true,
                max_participants: max_participants || null,
                contact_phone: contact_phone || null,
                contact_email: contact_email || null,
                organizer_name: organizer_name || null,
                tags: tags || [],
                created_by: req.user.id
            });

            // Fetch the created activity with place details if applicable
            const createdActivity = await Activity.findByPk(activity.id, {
                include: place_id ? [
                    {
                        model: Place,
                        as: 'place',
                        attributes: ['id', 'name', 'location', 'phone', 'email'],
                        include: [
                            {
                                model: PlaceCategory,
                                as: 'category',
                                attributes: ['id', 'name', 'icon']
                            },
                            {
                                model: PlaceImage,
                                as: 'images',
                                attributes: ['id', 'image_path'],
                                where: { is_primary: true },
                                required: false,
                                limit: 1
                            }
                        ]
                    }
                ] : []
            });

            res.status(201).json({
                success: true,
                message: 'Activity created successfully',
                data: createdActivity
            });
        } catch (error) {
            console.error('Error creating activity:', error);
            
            // Handle validation errors
            if (error.name === 'SequelizeValidationError') {
                return res.status(400).json({
                    success: false,
                    message: 'Validation error',
                    errors: error.errors.map(e => ({
                        field: e.path,
                        message: e.message
                    }))
                });
            }

            res.status(500).json({
                success: false,
                message: 'Error creating activity',
                error: error.message
            });
        }
    },

    /**
     * Get all activities (with filters and pagination)
     * GET /api/auth/activities
     * @access Public
     */
    getAllActivities: async (req, res) => {
        try {
            const {
                status,
                place_id,
                activity_type,
                is_featured,
                date_from,
                date_to,
                page = 1,
                limit = 20
            } = req.query;

            const where = { is_active: true };

            // Apply filters
            if (status) {
                where.status = status;
            }

            if (place_id) {
                where.place_id = place_id;
            }

            if (activity_type) {
                where.activity_type = activity_type;
            }

            if (is_featured) {
                where.is_featured = is_featured === 'true';
            }

            if (date_from || date_to) {
                where.start_date = {};
                if (date_from) {
                    where.start_date[Op.gte] = date_from;
                }
                if (date_to) {
                    where.start_date[Op.lte] = date_to;
                }
            }

            const offset = (parseInt(page) - 1) * parseInt(limit);

            const { count, rows: activities } = await Activity.findAndCountAll({
                where,
                include: [
                    {
                        model: Place,
                        as: 'place',
                        attributes: ['id', 'name', 'location', 'phone', 'email', 'average_rating'],
                        required: false,
                        include: [
                            {
                                model: PlaceCategory,
                                as: 'category',
                                attributes: ['id', 'name', 'icon', 'color']
                            },
                            {
                                model: PlaceImage,
                                as: 'images',
                                attributes: ['id', 'image_path'],
                                where: { is_primary: true },
                                required: false,
                                limit: 1
                            }
                        ]
                    }
                ],
                order: [
                    ['status', 'ASC'], // live first, then upcoming
                    ['start_date', 'ASC'],
                    ['created_at', 'DESC']
                ],
                limit: parseInt(limit),
                offset: offset
            });

            res.status(200).json({
                success: true,
                count: activities.length,
                total: count,
                page: parseInt(page),
                totalPages: Math.ceil(count / parseInt(limit)),
                data: activities
            });
        } catch (error) {
            console.error('Error fetching activities:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching activities',
                error: error.message
            });
        }
    },

    /**
     * Get upcoming activities
     * GET /api/auth/activities/upcoming
     * @access Public
     */
    getUpcomingActivities: async (req, res) => {
        try {
            const {
                place_id,
                activity_type
            } = req.query;

            const where = { 
                is_active: true,
                status: 'upcoming',
                start_date: {
                    [Op.gte]: new Date() // Only future activities
                }
            };

            if (place_id) {
                where.place_id = place_id;
            }

            if (activity_type) {
                where.activity_type = activity_type;
            }

            const activities = await Activity.findAll({
                where,
                include: [
                    {
                        model: Place,
                        as: 'place',
                        attributes: ['id', 'name', 'location', 'phone', 'email'],
                        required: false,
                        include: [
                            {
                                model: PlaceCategory,
                                as: 'category',
                                attributes: ['id', 'name', 'icon', 'color']
                            },
                            {
                                model: PlaceImage,
                                as: 'images',
                                attributes: ['id', 'image_path'],
                                where: { is_primary: true },
                                required: false,
                                limit: 1
                            }
                        ]
                    }
                ],
                order: [['start_date', 'ASC']]
            });

            res.status(200).json({
                success: true,
                count: activities.length,
                data: activities
            });
        } catch (error) {
            console.error('Error fetching upcoming activities:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching upcoming activities',
                error: error.message
            });
        }
    },

    /**
     * Get live activities
     * GET /api/auth/activities/live
     * @access Public
     */
    getLiveActivities: async (req, res) => {
        try {
            const {
                place_id,
                activity_type
            } = req.query;

            const where = { 
                is_active: true,
                status: 'live'
            };

            if (place_id) {
                where.place_id = place_id;
            }

            if (activity_type) {
                where.activity_type = activity_type;
            }

            const activities = await Activity.findAll({
                where,
                include: [
                    {
                        model: Place,
                        as: 'place',
                        attributes: ['id', 'name', 'location', 'phone', 'email'],
                        required: false,
                        include: [
                            {
                                model: PlaceCategory,
                                as: 'category',
                                attributes: ['id', 'name', 'icon', 'color']
                            },
                            {
                                model: PlaceImage,
                                as: 'images',
                                attributes: ['id', 'image_path'],
                                where: { is_primary: true },
                                required: false,
                                limit: 1
                            }
                        ]
                    }
                ],
                order: [['start_date', 'DESC'], ['view_count', 'DESC']]
            });

            res.status(200).json({
                success: true,
                count: activities.length,
                data: activities
            });
        } catch (error) {
            console.error('Error fetching live activities:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching live activities',
                error: error.message
            });
        }
    },

    /**
     * Get activity by ID
     * GET /api/auth/activities/:id
     * @access Public
     */
    getActivityById: async (req, res) => {
        try {
            const { id } = req.params;

            const activity = await Activity.findOne({
                where: { 
                    id,
                    is_active: true 
                },
                include: [
                    {
                        model: Place,
                        as: 'place',
                        required: false,
                        include: [
                            {
                                model: PlaceCategory,
                                as: 'category',
                                attributes: ['id', 'name', 'icon', 'color']
                            },
                            {
                                model: PlaceImage,
                                as: 'images',
                                attributes: ['id', 'image_path', 'is_primary'],
                                limit: 5
                            }
                        ]
                    },
                    {
                        model: User,
                        as: 'creator',
                        attributes: ['id', 'name', 'email']
                    }
                ]
            });

            if (!activity) {
                return res.status(404).json({
                    success: false,
                    message: 'Activity not found'
                });
            }

            // Increment view count
            await activity.incrementViews();

            res.status(200).json({
                success: true,
                data: activity
            });
        } catch (error) {
            console.error('Error fetching activity:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching activity',
                error: error.message
            });
        }
    },

    /**
     * Update activity
     * PUT /api/auth/activities/:id
     * @access Private (requires authentication)
     */
    updateActivity: async (req, res) => {
        try {
            const { id } = req.params;
            const {
                place_id,
                title,
                description,
                activity_type,
                location,
                latitude,
                longitude,
                start_date,
                end_date,
                entry_fee,
                is_free,
                max_participants,
                contact_phone,
                contact_email,
                organizer_name,
                tags
            } = req.body;

            const activity = await Activity.findByPk(id);

            if (!activity) {
                return res.status(404).json({
                    success: false,
                    message: 'Activity not found'
                });
            }

            // Check if user is the creator (optional - you can add role checks here)
            if (activity.created_by !== req.user.id) {
                return res.status(403).json({
                    success: false,
                    message: 'Not authorized to update this activity'
                });
            }

            // Check if activity can be updated
            if (activity.status === 'completed') {
                return res.status(400).json({
                    success: false,
                    message: 'Cannot update a completed activity'
                });
            }

            if (activity.status === 'cancelled') {
                return res.status(400).json({
                    success: false,
                    message: 'Cannot update a cancelled activity'
                });
            }

            // Update fields
            if (place_id !== undefined) activity.place_id = place_id;
            if (title !== undefined) activity.title = title;
            if (description !== undefined) activity.description = description;
            if (activity_type !== undefined) activity.activity_type = activity_type;
            if (location !== undefined) activity.location = location;
            if (latitude !== undefined) activity.latitude = latitude;
            if (longitude !== undefined) activity.longitude = longitude;
            if (start_date !== undefined) {
                const startDateObj = new Date(start_date);
                const now = new Date();
                
                if (startDateObj < now && activity.status === 'upcoming') {
                    return res.status(400).json({
                        success: false,
                        message: 'Start date cannot be in the past for upcoming activities'
                    });
                }
                activity.start_date = start_date;
            }
            if (end_date !== undefined) activity.end_date = end_date;
            if (entry_fee !== undefined) activity.entry_fee = entry_fee;
            if (is_free !== undefined) activity.is_free = is_free;
            if (max_participants !== undefined) activity.max_participants = max_participants;
            if (contact_phone !== undefined) activity.contact_phone = contact_phone;
            if (contact_email !== undefined) activity.contact_email = contact_email;
            if (organizer_name !== undefined) activity.organizer_name = organizer_name;
            if (tags !== undefined) activity.tags = tags;

            await activity.save();

            // Fetch updated activity with details
            const updatedActivity = await Activity.findByPk(activity.id, {
                include: [
                    {
                        model: Place,
                        as: 'place',
                        required: false,
                        include: [
                            {
                                model: PlaceCategory,
                                as: 'category',
                                attributes: ['id', 'name', 'icon']
                            },
                            {
                                model: PlaceImage,
                                as: 'images',
                                attributes: ['id', 'image_path'],
                                where: { is_primary: true },
                                required: false,
                                limit: 1
                            }
                        ]
                    }
                ]
            });

            res.status(200).json({
                success: true,
                message: 'Activity updated successfully',
                data: updatedActivity
            });
        } catch (error) {
            console.error('Error updating activity:', error);
            
            if (error.name === 'SequelizeValidationError') {
                return res.status(400).json({
                    success: false,
                    message: 'Validation error',
                    errors: error.errors.map(e => ({
                        field: e.path,
                        message: e.message
                    }))
                });
            }

            res.status(500).json({
                success: false,
                message: 'Error updating activity',
                error: error.message
            });
        }
    },

    /**
     * Delete activity
     * DELETE /api/auth/activities/:id
     * @access Private (requires authentication)
     */
    deleteActivity: async (req, res) => {
        try {
            const { id } = req.params;

            const activity = await Activity.findByPk(id);

            if (!activity) {
                return res.status(404).json({
                    success: false,
                    message: 'Activity not found'
                });
            }

            // Check if user is the creator
            if (activity.created_by !== req.user.id) {
                return res.status(403).json({
                    success: false,
                    message: 'Not authorized to delete this activity'
                });
            }

            await activity.destroy();

            res.status(200).json({
                success: true,
                message: 'Activity deleted successfully'
            });
        } catch (error) {
            console.error('Error deleting activity:', error);
            res.status(500).json({
                success: false,
                message: 'Error deleting activity',
                error: error.message
            });
        }
    },

    /**
     * Make activity live (change status from upcoming to live)
     * PATCH /api/auth/activities/:id/make-live
     * @access Private (requires authentication)
     * 
     * NOTE: Activities automatically become live when start_date is reached.
     * This endpoint is optional for manual override if needed.
     */
    makeLive: async (req, res) => {
        try {
            const { id } = req.params;

            const activity = await Activity.findByPk(id);

            if (!activity) {
                return res.status(404).json({
                    success: false,
                    message: 'Activity not found'
                });
            }

            // Check if user is the creator
            if (activity.created_by !== req.user.id) {
                return res.status(403).json({
                    success: false,
                    message: 'Not authorized to modify this activity'
                });
            }

            if (activity.status === 'live') {
                return res.status(400).json({
                    success: false,
                    message: 'Activity is already live'
                });
            }

            if (activity.status !== 'upcoming') {
                return res.status(400).json({
                    success: false,
                    message: `Cannot make ${activity.status} activity live`
                });
            }

            await activity.makeLive();

            res.status(200).json({
                success: true,
                message: 'Activity is now live',
                data: activity
            });
        } catch (error) {
            console.error('Error making activity live:', error);
            res.status(500).json({
                success: false,
                message: 'Error making activity live',
                error: error.message
            });
        }
    },

    /**
     * Complete activity
     * PATCH /api/auth/activities/:id/complete
     * @access Private (requires authentication)
     * 
     * NOTE: Activities with end_date automatically complete when end_date is reached.
     * This endpoint is optional for manual completion if needed.
     */
    completeActivity: async (req, res) => {
        try {
            const { id } = req.params;

            const activity = await Activity.findByPk(id);

            if (!activity) {
                return res.status(404).json({
                    success: false,
                    message: 'Activity not found'
                });
            }

            // Check if user is the creator
            if (activity.created_by !== req.user.id) {
                return res.status(403).json({
                    success: false,
                    message: 'Not authorized to modify this activity'
                });
            }

            if (activity.status === 'completed') {
                return res.status(400).json({
                    success: false,
                    message: 'Activity is already completed'
                });
            }

            await activity.markCompleted();

            res.status(200).json({
                success: true,
                message: 'Activity marked as completed',
                data: activity
            });
        } catch (error) {
            console.error('Error completing activity:', error);
            res.status(500).json({
                success: false,
                message: 'Error completing activity',
                error: error.message
            });
        }
    },

    /**
     * Cancel activity
     * PATCH /api/auth/activities/:id/cancel
     * @access Private (requires authentication)
     */
    cancelActivity: async (req, res) => {
        try {
            const { id } = req.params;

            const activity = await Activity.findByPk(id);

            if (!activity) {
                return res.status(404).json({
                    success: false,
                    message: 'Activity not found'
                });
            }

            // Check if user is the creator
            if (activity.created_by !== req.user.id) {
                return res.status(403).json({
                    success: false,
                    message: 'Not authorized to modify this activity'
                });
            }

            if (activity.status === 'cancelled') {
                return res.status(400).json({
                    success: false,
                    message: 'Activity is already cancelled'
                });
            }

            if (activity.status === 'completed') {
                return res.status(400).json({
                    success: false,
                    message: 'Cannot cancel a completed activity'
                });
            }

            await activity.cancel();

            res.status(200).json({
                success: true,
                message: 'Activity cancelled successfully',
                data: activity
            });
        } catch (error) {
            console.error('Error cancelling activity:', error);
            res.status(500).json({
                success: false,
                message: 'Error cancelling activity',
                error: error.message
            });
        }
    },

    /**
     * Toggle activity featured status
     * PATCH /api/auth/activities/:id/toggle-featured
     * @access Private (requires authentication)
     */
    toggleFeatured: async (req, res) => {
        try {
            const { id } = req.params;

            const activity = await Activity.findByPk(id);

            if (!activity) {
                return res.status(404).json({
                    success: false,
                    message: 'Activity not found'
                });
            }

            await activity.toggleFeatured();

            res.status(200).json({
                success: true,
                message: `Activity ${activity.is_featured ? 'featured' : 'unfeatured'} successfully`,
                data: activity
            });
        } catch (error) {
            console.error('Error toggling featured status:', error);
            res.status(500).json({
                success: false,
                message: 'Error toggling featured status',
                error: error.message
            });
        }
    },

    /**
     * Get activities by place
     * GET /api/auth/places/:placeId/activities
     * @access Public
     */
    getActivitiesByPlace: async (req, res) => {
        try {
            const { placeId } = req.params;
            const { status, page = 1, limit = 20 } = req.query;

            // Check if place exists
            const place = await Place.findByPk(placeId);
            if (!place) {
                return res.status(404).json({
                    success: false,
                    message: 'Place not found'
                });
            }

            const where = {
                place_id: placeId,
                is_active: true
            };

            if (status) {
                where.status = status;
            }

            const offset = (parseInt(page) - 1) * parseInt(limit);

            const { count, rows: activities } = await Activity.findAndCountAll({
                where,
                order: [
                    ['status', 'ASC'],
                    ['start_date', 'ASC']
                ],
                limit: parseInt(limit),
                offset: offset
            });

            res.status(200).json({
                success: true,
                count: activities.length,
                total: count,
                page: parseInt(page),
                totalPages: Math.ceil(count / parseInt(limit)),
                data: activities
            });
        } catch (error) {
            console.error('Error fetching activities by place:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching activities by place',
                error: error.message
            });
        }
    }
};

module.exports = activityController;

