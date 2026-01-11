const PlaceBooking = require('../../models/PlaceBookingModel');
const Place = require('../../models/PlaceModel');
const User = require('../../models/UserModel');
const PlaceCategory = require('../../models/PlaceCategoryModel');
const PlaceImage = require('../../models/PlaceImageModel');
const sequelize = require('../../config/database');
const { Op } = require('sequelize');

/**
 * Place Booking Controller
 * Handles all operations related to place bookings
 */

const placeBookingController = {
    /**
     * Create a new booking
     * POST /api/auth/bookings
     * @access Private (requires authentication)
     */
    createBooking: async (req, res) => {
        try {
            const {
                place_id,
                booking_date,
                booking_time,
                number_of_guests,
                full_name,
                email,
                phone,
                special_requests,
                total_amount
            } = req.body;

            // Validate required fields
            if (!place_id || !booking_date || !full_name || !email) {
                return res.status(400).json({
                    success: false,
                    message: 'Place, booking date, full name, and email are required'
                });
            }

            // Check if place exists and is active
            const place = await Place.findByPk(place_id);
            if (!place) {
                return res.status(404).json({
                    success: false,
                    message: 'Place not found'
                });
            }

            if (!place.is_active) {
                return res.status(400).json({
                    success: false,
                    message: 'This place is currently not available for booking'
                });
            }

            // Validate booking date is not in the past
            const bookingDateObj = new Date(booking_date);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            if (bookingDateObj < today) {
                return res.status(400).json({
                    success: false,
                    message: 'Booking date cannot be in the past'
                });
            }

            // Create booking
            const booking = await PlaceBooking.create({
                place_id,
                user_id: req.user.id,
                booking_date,
                booking_time: booking_time || null,
                number_of_guests: number_of_guests || 1,
                full_name,
                email,
                phone: phone || null,
                special_requests: special_requests || null,
                total_amount: total_amount || 0.00,
                booking_status: 'pending',
                payment_status: 'unpaid'
            });

            // Fetch the created booking with place details
            const createdBooking = await PlaceBooking.findByPk(booking.id, {
                include: [
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
                    },
                    {
                        model: User,
                        as: 'user',
                        attributes: ['id', 'name', 'email']
                    }
                ]
            });

            res.status(201).json({
                success: true,
                message: 'Booking created successfully',
                data: createdBooking
            });
        } catch (error) {
            console.error('Error creating booking:', error);
            
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
                message: 'Error creating booking',
                error: error.message
            });
        }
    },

    /**
     * Get all bookings (with filters and pagination)
     * GET /api/auth/bookings
     * @access Private (requires authentication)
     */
    getAllBookings: async (req, res) => {
        try {
            const {
                status,
                place_id,
                date_from,
                date_to,
                page = 1,
                limit = 20
            } = req.query;

            const where = { user_id: req.user.id };

            // Apply filters
            if (status) {
                where.booking_status = status;
            }

            if (place_id) {
                where.place_id = place_id;
            }

            if (date_from || date_to) {
                where.booking_date = {};
                if (date_from) {
                    where.booking_date[Op.gte] = date_from;
                }
                if (date_to) {
                    where.booking_date[Op.lte] = date_to;
                }
            }

            const offset = (parseInt(page) - 1) * parseInt(limit);

            const { count, rows: bookings } = await PlaceBooking.findAndCountAll({
                where,
                include: [
                    {
                        model: Place,
                        as: 'place',
                        attributes: ['id', 'name', 'location', 'phone', 'email', 'average_rating'],
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
                order: [['created_at', 'DESC'], ['booking_date', 'DESC']],
                limit: parseInt(limit),
                offset: offset
            });

            res.status(200).json({
                success: true,
                count: bookings.length,
                total: count,
                page: parseInt(page),
                totalPages: Math.ceil(count / parseInt(limit)),
                data: bookings
            });
        } catch (error) {
            console.error('Error fetching bookings:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching bookings',
                error: error.message
            });
        }
    },

    /**
     * Get booking by ID
     * GET /api/auth/bookings/:id
     * @access Private (requires authentication)
     */
    getBookingById: async (req, res) => {
        try {
            const { id } = req.params;

            const booking = await PlaceBooking.findOne({
                where: { 
                    id,
                    user_id: req.user.id 
                },
                include: [
                    {
                        model: Place,
                        as: 'place',
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
                        as: 'user',
                        attributes: ['id', 'name', 'email']
                    }
                ]
            });

            if (!booking) {
                return res.status(404).json({
                    success: false,
                    message: 'Booking not found'
                });
            }

            res.status(200).json({
                success: true,
                data: booking
            });
        } catch (error) {
            console.error('Error fetching booking:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching booking',
                error: error.message
            });
        }
    },

    /**
     * Update booking
     * PUT /api/auth/bookings/:id
     * @access Private (requires authentication)
     */
    updateBooking: async (req, res) => {
        try {
            const { id } = req.params;
            const {
                booking_date,
                booking_time,
                number_of_guests,
                full_name,
                email,
                phone,
                special_requests
            } = req.body;

            const booking = await PlaceBooking.findOne({
                where: { 
                    id,
                    user_id: req.user.id 
                }
            });

            if (!booking) {
                return res.status(404).json({
                    success: false,
                    message: 'Booking not found'
                });
            }

            // Check if booking can be updated
            if (booking.booking_status === 'cancelled') {
                return res.status(400).json({
                    success: false,
                    message: 'Cannot update a cancelled booking'
                });
            }

            if (booking.booking_status === 'completed') {
                return res.status(400).json({
                    success: false,
                    message: 'Cannot update a completed booking'
                });
            }

            // Update fields
            if (booking_date !== undefined) {
                const bookingDateObj = new Date(booking_date);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                
                if (bookingDateObj < today) {
                    return res.status(400).json({
                        success: false,
                        message: 'Booking date cannot be in the past'
                    });
                }
                booking.booking_date = booking_date;
            }
            if (booking_time !== undefined) booking.booking_time = booking_time;
            if (number_of_guests !== undefined) booking.number_of_guests = number_of_guests;
            if (full_name !== undefined) booking.full_name = full_name;
            if (email !== undefined) booking.email = email;
            if (phone !== undefined) booking.phone = phone;
            if (special_requests !== undefined) booking.special_requests = special_requests;

            await booking.save();

            // Fetch updated booking with details
            const updatedBooking = await PlaceBooking.findByPk(booking.id, {
                include: [
                    {
                        model: Place,
                        as: 'place',
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
                message: 'Booking updated successfully',
                data: updatedBooking
            });
        } catch (error) {
            console.error('Error updating booking:', error);
            
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
                message: 'Error updating booking',
                error: error.message
            });
        }
    },

    /**
     * Cancel booking
     * PATCH /api/auth/bookings/:id/cancel
     * @access Private (requires authentication)
     */
    cancelBooking: async (req, res) => {
        try {
            const { id } = req.params;
            const { cancellation_reason } = req.body;

            const booking = await PlaceBooking.findOne({
                where: { 
                    id,
                    user_id: req.user.id 
                }
            });

            if (!booking) {
                return res.status(404).json({
                    success: false,
                    message: 'Booking not found'
                });
            }

            if (booking.booking_status === 'cancelled') {
                return res.status(400).json({
                    success: false,
                    message: 'Booking is already cancelled'
                });
            }

            if (booking.booking_status === 'completed') {
                return res.status(400).json({
                    success: false,
                    message: 'Cannot cancel a completed booking'
                });
            }

            await booking.cancel(cancellation_reason);

            res.status(200).json({
                success: true,
                message: 'Booking cancelled successfully',
                data: booking
            });
        } catch (error) {
            console.error('Error cancelling booking:', error);
            res.status(500).json({
                success: false,
                message: 'Error cancelling booking',
                error: error.message
            });
        }
    },

    /**
     * Get booking history (past bookings)
     * GET /api/auth/bookings/history/list
     * @access Private (requires authentication)
     */
    getBookingHistory: async (req, res) => {
        try {
            const { page = 1, limit = 20 } = req.query;
            const offset = (parseInt(page) - 1) * parseInt(limit);

            const { count, rows: bookings } = await PlaceBooking.findAndCountAll({
                where: {
                    user_id: req.user.id,
                    [Op.or]: [
                        { booking_status: 'completed' },
                        { booking_status: 'cancelled' },
                        {
                            booking_date: {
                                [Op.lt]: new Date()
                            }
                        }
                    ]
                },
                include: [
                    {
                        model: Place,
                        as: 'place',
                        attributes: ['id', 'name', 'location', 'average_rating'],
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
                order: [['booking_date', 'DESC'], ['created_at', 'DESC']],
                limit: parseInt(limit),
                offset: offset
            });

            res.status(200).json({
                success: true,
                count: bookings.length,
                total: count,
                page: parseInt(page),
                totalPages: Math.ceil(count / parseInt(limit)),
                data: bookings
            });
        } catch (error) {
            console.error('Error fetching booking history:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching booking history',
                error: error.message
            });
        }
    },

    /**
     * Accept or Cancel booking
     * PATCH /api/auth/bookings/:id/status
     * @access Private (requires authentication)
     * @body { action: 'accept' | 'cancel', cancellation_reason?: string }
     */
    updateBookingStatus: async (req, res) => {
        try {
            const { id } = req.params;
            const { action, cancellation_reason } = req.body;

            // Validate action parameter
            if (!action || !['accept', 'cancel'].includes(action)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid action. Must be either "accept" or "cancel"'
                });
            }

            // Check if booking exists
            const booking = await PlaceBooking.findByPk(id, {
                include: [
                    {
                        model: Place,
                        as: 'place',
                        attributes: ['id', 'name', 'location', 'is_active']
                    },
                    {
                        model: User,
                        as: 'user',
                        attributes: ['id', 'name', 'email']
                    }
                ]
            });

            if (!booking) {
                return res.status(404).json({
                    success: false,
                    message: 'Booking not found'
                });
            }

            // Verify that the booking belongs to the authenticated user
            if (booking.user_id !== req.user.id) {
                return res.status(403).json({
                    success: false,
                    message: 'You are not authorized to modify this booking'
                });
            }

            // Check if place still exists and is active (for accept action)
            if (action === 'accept' && booking.place) {
                if (!booking.place.is_active) {
                    return res.status(400).json({
                        success: false,
                        message: 'This place is currently not available for booking'
                    });
                }
            }

            // Handle ACCEPT action
            if (action === 'accept') {
                // Check current booking status
                if (booking.booking_status === 'confirmed') {
                    return res.status(400).json({
                        success: false,
                        message: 'Booking is already confirmed'
                    });
                }

                if (booking.booking_status === 'cancelled') {
                    return res.status(400).json({
                        success: false,
                        message: 'Cannot accept a cancelled booking'
                    });
                }

                if (booking.booking_status === 'completed') {
                    return res.status(400).json({
                        success: false,
                        message: 'Cannot accept a completed booking'
                    });
                }

                // Validate booking date is not in the past
                const bookingDateObj = new Date(booking.booking_date);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                
                if (bookingDateObj < today) {
                    return res.status(400).json({
                        success: false,
                        message: 'Cannot accept a booking with a past date'
                    });
                }

                // Confirm the booking
                await booking.confirm();

                // Fetch updated booking with all details
                const updatedBooking = await PlaceBooking.findByPk(booking.id, {
                    include: [
                        {
                            model: Place,
                            as: 'place',
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
                        },
                        {
                            model: User,
                            as: 'user',
                            attributes: ['id', 'name', 'email']
                        }
                    ]
                });

                return res.status(200).json({
                    success: true,
                    message: 'Booking confirmed successfully',
                    data: updatedBooking
                });
            }

            // Handle CANCEL action
            if (action === 'cancel') {
                // Check current booking status
                if (booking.booking_status === 'cancelled') {
                    return res.status(400).json({
                        success: false,
                        message: 'Booking is already cancelled'
                    });
                }

                if (booking.booking_status === 'completed') {
                    return res.status(400).json({
                        success: false,
                        message: 'Cannot cancel a completed booking'
                    });
                }

                // Cancel the booking
                await booking.cancel(cancellation_reason);

                // Fetch updated booking with all details
                const updatedBooking = await PlaceBooking.findByPk(booking.id, {
                    include: [
                        {
                            model: Place,
                            as: 'place',
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
                        },
                        {
                            model: User,
                            as: 'user',
                            attributes: ['id', 'name', 'email']
                        }
                    ]
                });

                return res.status(200).json({
                    success: true,
                    message: 'Booking cancelled successfully',
                    data: updatedBooking
                });
            }

        } catch (error) {
            console.error('Error updating booking status:', error);
            res.status(500).json({
                success: false,
                message: 'Error updating booking status',
                error: error.message
            });
        }
    },

};

module.exports = placeBookingController;

