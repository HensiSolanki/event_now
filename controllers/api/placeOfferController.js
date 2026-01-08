const PlaceOffer = require('../../models/PlaceOfferModel');
const Place = require('../../models/PlaceModel');
const { Op } = require('sequelize');

/**
 * Place Offer Controller
 * Handles all operations related to place offers
 */

const placeOfferController = {
    /**
     * Add a new offer for a place
     * POST /api/auth/places/:placeId/offers
     * @access Public (can be protected with 'protect' middleware if needed)
     */
    addOffer: async (req, res) => {
        try {
            const { placeId } = req.params;
            const {
                title,
                description,
                discount_type,
                discount_value,
                valid_from,
                valid_until,
                terms_and_conditions,
                is_active,
                usage_limit,
                minimum_booking_amount,
                code
            } = req.body;

            // Validate required fields
            if (!title || !discount_type || !valid_from || !valid_until) {
                return res.status(400).json({
                    success: false,
                    message: 'Title, discount type, valid from, and valid until dates are required'
                });
            }

            // Check if place exists
            const place = await Place.findByPk(placeId);
            if (!place) {
                return res.status(404).json({
                    success: false,
                    message: 'Place not found'
                });
            }

            // Validate dates
            const validFromDate = new Date(valid_from);
            const validUntilDate = new Date(valid_until);

            if (validUntilDate < validFromDate) {
                return res.status(400).json({
                    success: false,
                    message: 'Valid until date must be after valid from date'
                });
            }

            // Check if code is unique (if provided)
            if (code) {
                const existingOffer = await PlaceOffer.findOne({
                    where: { code: code.toUpperCase() }
                });
                if (existingOffer) {
                    return res.status(400).json({
                        success: false,
                        message: 'Offer code already exists. Please use a different code.'
                    });
                }
            }

            // Create the offer
            const offer = await PlaceOffer.create({
                place_id: placeId,
                title,
                description: description || null,
                discount_type,
                discount_value: discount_value || null,
                valid_from,
                valid_until,
                terms_and_conditions: terms_and_conditions || null,
                is_active: is_active !== undefined ? is_active : true,
                usage_limit: usage_limit || null,
                minimum_booking_amount: minimum_booking_amount || null,
                code: code ? code.toUpperCase() : null
            });

            res.status(201).json({
                success: true,
                message: 'Offer created successfully',
                data: offer
            });
        } catch (error) {
            console.error('Error creating offer:', error);

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

            // Handle unique constraint errors
            if (error.name === 'SequelizeUniqueConstraintError') {
                return res.status(400).json({
                    success: false,
                    message: 'Offer code already exists'
                });
            }

            res.status(500).json({
                success: false,
                message: 'Error creating offer',
                error: error.message
            });
        }
    },

    /**
     * Get all offers for a place
     * GET /api/auth/places/:placeId/offers
     * @access Public
     */
    getPlaceOffers: async (req, res) => {
        try {
            const { placeId } = req.params;
            const { active_only = 'false', include_expired = 'false' } = req.query;

            // Check if place exists
            const place = await Place.findByPk(placeId);
            if (!place) {
                return res.status(404).json({
                    success: false,
                    message: 'Place not found'
                });
            }

            const where = { place_id: placeId };
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            // Filter by active status
            if (active_only === 'true') {
                where.is_active = true;
            }

            // Filter out expired offers
            if (include_expired === 'false') {
                where.valid_until = {
                    [Op.gte]: today
                };
            }

            const offers = await PlaceOffer.findAll({
                where,
                order: [['created_at', 'DESC']]
            });

            res.status(200).json({
                success: true,
                count: offers.length,
                data: offers
            });
        } catch (error) {
            console.error('Error fetching offers:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching offers',
                error: error.message
            });
        }
    },

    /**
     * Get offer by ID
     * GET /api/auth/offers/:id
     * @access Public
     */
    getOfferById: async (req, res) => {
        try {
            const { id } = req.params;

            const offer = await PlaceOffer.findByPk(id, {
                include: [
                    {
                        model: Place,
                        as: 'place',
                        attributes: ['id', 'name', 'location']
                    }
                ]
            });

            if (!offer) {
                return res.status(404).json({
                    success: false,
                    message: 'Offer not found'
                });
            }

            res.status(200).json({
                success: true,
                data: offer
            });
        } catch (error) {
            console.error('Error fetching offer:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching offer',
                error: error.message
            });
        }
    },

    /**
     * Update offer
     * PUT /api/auth/offers/:id
     * @access Public (can be protected with 'protect' middleware if needed)
     */
    updateOffer: async (req, res) => {
        try {
            const { id } = req.params;
            const {
                title,
                description,
                discount_type,
                discount_value,
                valid_from,
                valid_until,
                terms_and_conditions,
                is_active,
                usage_limit,
                minimum_booking_amount,
                code
            } = req.body;

            const offer = await PlaceOffer.findByPk(id);

            if (!offer) {
                return res.status(404).json({
                    success: false,
                    message: 'Offer not found'
                });
            }

            // Validate dates if provided
            if (valid_from || valid_until) {
                const validFromDate = new Date(valid_from || offer.valid_from);
                const validUntilDate = new Date(valid_until || offer.valid_until);

                if (validUntilDate < validFromDate) {
                    return res.status(400).json({
                        success: false,
                        message: 'Valid until date must be after valid from date'
                    });
                }
            }

            // Check if code is unique (if provided and changed)
            if (code && code.toUpperCase() !== offer.code) {
                const existingOffer = await PlaceOffer.findOne({
                    where: { 
                        code: code.toUpperCase(),
                        id: { [Op.ne]: id }
                    }
                });
                if (existingOffer) {
                    return res.status(400).json({
                        success: false,
                        message: 'Offer code already exists. Please use a different code.'
                    });
                }
            }

            // Update fields
            if (title !== undefined) offer.title = title;
            if (description !== undefined) offer.description = description;
            if (discount_type !== undefined) offer.discount_type = discount_type;
            if (discount_value !== undefined) offer.discount_value = discount_value;
            if (valid_from !== undefined) offer.valid_from = valid_from;
            if (valid_until !== undefined) offer.valid_until = valid_until;
            if (terms_and_conditions !== undefined) offer.terms_and_conditions = terms_and_conditions;
            if (is_active !== undefined) offer.is_active = is_active;
            if (usage_limit !== undefined) offer.usage_limit = usage_limit;
            if (minimum_booking_amount !== undefined) offer.minimum_booking_amount = minimum_booking_amount;
            if (code !== undefined) offer.code = code ? code.toUpperCase() : null;

            await offer.save();

            res.status(200).json({
                success: true,
                message: 'Offer updated successfully',
                data: offer
            });
        } catch (error) {
            console.error('Error updating offer:', error);

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

            if (error.name === 'SequelizeUniqueConstraintError') {
                return res.status(400).json({
                    success: false,
                    message: 'Offer code already exists'
                });
            }

            res.status(500).json({
                success: false,
                message: 'Error updating offer',
                error: error.message
            });
        }
    },

    /**
     * Delete offer
     * DELETE /api/auth/offers/:id
     * @access Public (can be protected with 'protect' middleware if needed)
     */
    deleteOffer: async (req, res) => {
        try {
            const { id } = req.params;

            const offer = await PlaceOffer.findByPk(id);

            if (!offer) {
                return res.status(404).json({
                    success: false,
                    message: 'Offer not found'
                });
            }

            await offer.destroy();

            res.status(200).json({
                success: true,
                message: 'Offer deleted successfully'
            });
        } catch (error) {
            console.error('Error deleting offer:', error);
            res.status(500).json({
                success: false,
                message: 'Error deleting offer',
                error: error.message
            });
        }
    },

    /**
     * Toggle offer active status
     * PATCH /api/auth/offers/:id/toggle-active
     * @access Public (can be protected with 'protect' middleware if needed)
     */
    toggleOfferStatus: async (req, res) => {
        try {
            const { id } = req.params;

            const offer = await PlaceOffer.findByPk(id);

            if (!offer) {
                return res.status(404).json({
                    success: false,
                    message: 'Offer not found'
                });
            }

            await offer.toggleActive();

            res.status(200).json({
                success: true,
                message: `Offer ${offer.is_active ? 'activated' : 'deactivated'} successfully`,
                data: offer
            });
        } catch (error) {
            console.error('Error toggling offer status:', error);
            res.status(500).json({
                success: false,
                message: 'Error toggling offer status',
                error: error.message
            });
        }
    },

    /**
     * Validate and get offer by code
     * GET /api/auth/offers/validate/:code
     * @access Public
     */
    validateOfferCode: async (req, res) => {
        try {
            const { code } = req.params;
            const { place_id, booking_amount } = req.query;

            const offer = await PlaceOffer.findByCode(code);

            if (!offer) {
                return res.status(404).json({
                    success: false,
                    message: 'Invalid offer code'
                });
            }

            // Check if offer belongs to the specified place
            if (place_id && offer.place_id !== parseInt(place_id)) {
                return res.status(400).json({
                    success: false,
                    message: 'This offer is not valid for the selected place'
                });
            }

            // Check if offer is valid
            if (!offer.isValid()) {
                return res.status(400).json({
                    success: false,
                    message: 'This offer is no longer valid or has reached its usage limit'
                });
            }

            // Check minimum booking amount
            if (offer.minimum_booking_amount && booking_amount) {
                if (parseFloat(booking_amount) < parseFloat(offer.minimum_booking_amount)) {
                    return res.status(400).json({
                        success: false,
                        message: `Minimum booking amount of ${offer.minimum_booking_amount} is required for this offer`
                    });
                }
            }

            res.status(200).json({
                success: true,
                message: 'Offer code is valid',
                data: offer
            });
        } catch (error) {
            console.error('Error validating offer code:', error);
            res.status(500).json({
                success: false,
                message: 'Error validating offer code',
                error: error.message
            });
        }
    }
};

module.exports = placeOfferController;

