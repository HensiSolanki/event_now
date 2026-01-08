const Place = require('../../models/PlaceModel');
const PlaceImage = require('../../models/PlaceImageModel');
const PlaceRating = require('../../models/PlaceRatingModel');
const PlaceCategory = require('../../models/PlaceCategoryModel');
const User = require('../../models/UserModel');
const FavoritePlace = require('../../models/FavoritePlaceModel');
const sequelize = require('../../config/database');
const fs = require('fs');
const path = require('path');

/**
 * Place Controller
 * Handles all operations related to places
 */

const placeController = {
    /**
     * Get all places (with optional filtering and pagination)
     * GET /api/places
     */
    getAllPlaces: async (req, res) => {
        try {
            const { 
                category_id, 
                active_only, 
                featured_only, 
                search,
                pricing,
                sort_by = 'created_at',
                sort_order = 'DESC',
                page = 1,
                limit = 20
            } = req.query;
            
            const { Op } = require('sequelize');
            const where = {};
            
            // Filters
            if (active_only === 'true') {
                where.is_active = true;
            }
            
            if (featured_only === 'true') {
                where.is_featured = true;
            }
            
            if (category_id) {
                where.category_id = category_id;
            }
            
            if (pricing) {
                where.pricing = pricing;
            }
            
            if (search) {
                where[Op.or] = [
                    { name: { [Op.like]: `%${search}%` } },
                    { description: { [Op.like]: `%${search}%` } },
                    { location: { [Op.like]: `%${search}%` } }
                ];
            }
            
            // Pagination
            const offset = (parseInt(page) - 1) * parseInt(limit);
            
            // Sorting
            const validSortFields = ['created_at', 'name', 'average_rating', 'view_count', 'total_ratings'];
            const sortField = validSortFields.includes(sort_by) ? sort_by : 'created_at';
            const sortDirection = sort_order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
            
            const { count, rows: places } = await Place.findAndCountAll({
                where,
                include: [
                    {
                        model: PlaceCategory,
                        as: 'category',
                        attributes: ['id', 'name', 'slug', 'icon', 'color']
                    },
                    {
                        model: PlaceImage,
                        as: 'images',
                        attributes: ['id', 'image_path', 'caption', 'is_primary', 'sort_order'],
                        separate: true,
                        order: [['is_primary', 'DESC'], ['sort_order', 'ASC']]
                    }
                ],
                order: [[sortField, sortDirection]],
                limit: parseInt(limit),
                offset: offset
            });

            let placesWithFavorite = places;
            if (req.user) {
                const userFavorites = await FavoritePlace.findAll({
                    where: { user_id: req.user.id },
                    attributes: ['place_id'],
                    raw: true
                });
                
                const favoritePlaceIds = new Set(userFavorites.map(fav => fav.place_id));
                
                placesWithFavorite = places.map(place => {
                    const placeData = place.toJSON();
                    placeData.isFavorite = favoritePlaceIds.has(place.id);
                    return placeData;
                });
            } else {
                placesWithFavorite = places.map(place => {
                    const placeData = place.toJSON();
                    placeData.isFavorite = false;
                    return placeData;
                });
            }

            res.status(200).json({
                success: true,
                count: placesWithFavorite.length,
                total: count,
                page: parseInt(page),
                totalPages: Math.ceil(count / parseInt(limit)),
                data: placesWithFavorite
            });
        } catch (error) {
            console.error('Error fetching places:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching places',
                error: error.message
            });
        }
    },

    /**
     * Get single place by ID
     * GET /api/places/:id
     */
    getPlaceById: async (req, res) => {
        try {
            const { id } = req.params;
            
            const place = await Place.findByPk(id, {
                include: [
                    {
                        model: PlaceCategory,
                        as: 'category',
                        attributes: ['id', 'name', 'slug', 'icon', 'color', 'description']
                    },
                    {
                        model: PlaceImage,
                        as: 'images',
                        attributes: ['id', 'image_path', 'caption', 'is_primary', 'sort_order'],
                        order: [['is_primary', 'DESC'], ['sort_order', 'ASC']]
                    },
                    {
                        model: PlaceRating,
                        as: 'ratings',
                        where: { is_approved: true },
                        required: false,
                        include: [
                            {
                                model: User,
                                as: 'user',
                                attributes: ['id', 'name', 'email']
                            }
                        ],
                        order: [['created_at', 'DESC']],
                        limit: 10 // Get latest 10 reviews
                    },
                    {
                        model: User,
                        as: 'creator',
                        attributes: ['id', 'name', 'email']
                    }
                ]
            });

            if (!place) {
                return res.status(404).json({
                    success: false,
                    message: 'Place not found'
                });
            }

            // Increment view count
            await place.incrementViews();

            // Get rating distribution
            const ratingDistribution = await PlaceRating.getRatingDistribution(id);

            // Check if place is favorited by current user
            let isFavorite = false;
            if (req.user) {
                isFavorite = await FavoritePlace.isFavorited(req.user.id, id);
            }

            res.status(200).json({
                success: true,
                data: {
                    ...place.toJSON(),
                    rating_distribution: ratingDistribution,
                    isFavorite: isFavorite
                }
            });
        } catch (error) {
            console.error('Error fetching place:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching place',
                error: error.message
            });
        }
    },

    /**
     * Create new place
     * POST /api/places
     */
    createPlace: async (req, res) => {
        const transaction = await sequelize.transaction();
        
        try {
            const {
                category_id,
                name,
                slug,
                description,
                location,
                latitude,
                longitude,
                pricing,
                price_range_min,
                price_range_max,
                opening_time,
                closing_time,
                is_open_24_7,
                operating_days,
                phone,
                email,
                website,
                is_featured,
                is_active
            } = req.body;

            // Validate required fields
            if (!category_id || !name) {
                // Delete uploaded files if validation fails
                if (req.files && req.files.length > 0) {
                    req.files.forEach(file => fs.unlinkSync(file.path));
                }
                return res.status(400).json({
                    success: false,
                    message: 'Category and place name are required'
                });
            }

            // Verify category exists
            const category = await PlaceCategory.findByPk(category_id);
            if (!category) {
                if (req.files && req.files.length > 0) {
                    req.files.forEach(file => fs.unlinkSync(file.path));
                }
                return res.status(400).json({
                    success: false,
                    message: 'Invalid category ID'
                });
            }

            // Parse operating_days if it's a string
            let parsedOperatingDays = operating_days;
            if (typeof operating_days === 'string') {
                try {
                    parsedOperatingDays = JSON.parse(operating_days);
                } catch (e) {
                    parsedOperatingDays = operating_days.split(',').map(d => d.trim());
                }
            }

            // Create place
            const place = await Place.create({
                category_id,
                name,
                slug: slug || undefined,
                description,
                location,
                latitude: latitude ? parseFloat(latitude) : null,
                longitude: longitude ? parseFloat(longitude) : null,
                pricing: pricing || 'moderate',
                price_range_min: price_range_min ? parseFloat(price_range_min) : null,
                price_range_max: price_range_max ? parseFloat(price_range_max) : null,
                opening_time,
                closing_time,
                is_open_24_7: is_open_24_7 === 'true' || is_open_24_7 === true,
                operating_days: parsedOperatingDays || ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
                phone,
                email,
                website,
                is_featured: is_featured === 'true' || is_featured === true || false,
                is_active: is_active !== undefined ? (is_active === 'true' || is_active === true) : true,
                created_by: req.user ? req.user.id : null
            }, { transaction });

            // Handle image uploads
            if (req.files && req.files.length > 0) {
                const imagePaths = req.files.map(file => `uploads/places/${file.filename}`);
                await PlaceImage.bulkCreateImages(place.id, imagePaths, transaction);
            }

            await transaction.commit();

            // Fetch the created place with associations
            const createdPlace = await Place.findByPk(place.id, {
                include: [
                    {
                        model: PlaceCategory,
                        as: 'category',
                        attributes: ['id', 'name', 'slug', 'icon', 'color']
                    },
                    {
                        model: PlaceImage,
                        as: 'images',
                        attributes: ['id', 'image_path', 'caption', 'is_primary', 'sort_order']
                    }
                ]
            });

            res.status(201).json({
                success: true,
                message: 'Place created successfully',
                data: createdPlace
            });
        } catch (error) {
            await transaction.rollback();
            console.error('Error creating place:', error);
            
            // Delete uploaded files if error occurs
            if (req.files && req.files.length > 0) {
                req.files.forEach(file => {
                    if (fs.existsSync(file.path)) {
                        fs.unlinkSync(file.path);
                    }
                });
            }
            
            // Handle validation errors
            if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
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
                message: 'Error creating place',
                error: error.message
            });
        }
    },

    /**
     * Update place
     * PUT /api/places/:id
     */
    updatePlace: async (req, res) => {
        const transaction = await sequelize.transaction();
        
        try {
            const { id } = req.params;
            const place = await Place.findByPk(id);

            if (!place) {
                if (req.files && req.files.length > 0) {
                    req.files.forEach(file => fs.unlinkSync(file.path));
                }
                await transaction.rollback();
                return res.status(404).json({
                    success: false,
                    message: 'Place not found'
                });
            }

            const {
                category_id,
                name,
                slug,
                description,
                location,
                latitude,
                longitude,
                pricing,
                price_range_min,
                price_range_max,
                opening_time,
                closing_time,
                is_open_24_7,
                operating_days,
                phone,
                email,
                website,
                is_featured,
                is_active
            } = req.body;

            // Update fields
            if (category_id !== undefined) {
                // Verify category exists
                const category = await PlaceCategory.findByPk(category_id);
                if (!category) {
                    if (req.files && req.files.length > 0) {
                        req.files.forEach(file => fs.unlinkSync(file.path));
                    }
                    await transaction.rollback();
                    return res.status(400).json({
                        success: false,
                        message: 'Invalid category ID'
                    });
                }
                place.category_id = category_id;
            }
            if (name !== undefined) place.name = name;
            if (slug !== undefined) place.slug = slug;
            if (description !== undefined) place.description = description;
            if (location !== undefined) place.location = location;
            if (latitude !== undefined) place.latitude = parseFloat(latitude);
            if (longitude !== undefined) place.longitude = parseFloat(longitude);
            if (pricing !== undefined) place.pricing = pricing;
            if (price_range_min !== undefined) place.price_range_min = parseFloat(price_range_min);
            if (price_range_max !== undefined) place.price_range_max = parseFloat(price_range_max);
            if (opening_time !== undefined) place.opening_time = opening_time;
            if (closing_time !== undefined) place.closing_time = closing_time;
            if (is_open_24_7 !== undefined) place.is_open_24_7 = is_open_24_7 === 'true' || is_open_24_7 === true;
            if (operating_days !== undefined) {
                let parsedOperatingDays = operating_days;
                if (typeof operating_days === 'string') {
                    try {
                        parsedOperatingDays = JSON.parse(operating_days);
                    } catch (e) {
                        parsedOperatingDays = operating_days.split(',').map(d => d.trim());
                    }
                }
                place.operating_days = parsedOperatingDays;
            }
            if (phone !== undefined) place.phone = phone;
            if (email !== undefined) place.email = email;
            if (website !== undefined) place.website = website;
            if (is_featured !== undefined) place.is_featured = is_featured === 'true' || is_featured === true;
            if (is_active !== undefined) place.is_active = is_active === 'true' || is_active === true;

            await place.save({ transaction });

            // Handle new image uploads
            if (req.files && req.files.length > 0) {
                const imagePaths = req.files.map(file => `uploads/places/${file.filename}`);
                await PlaceImage.bulkCreateImages(place.id, imagePaths, transaction);
            }

            await transaction.commit();

            // Fetch updated place with associations
            const updatedPlace = await Place.findByPk(place.id, {
                include: [
                    {
                        model: PlaceCategory,
                        as: 'category',
                        attributes: ['id', 'name', 'slug', 'icon', 'color']
                    },
                    {
                        model: PlaceImage,
                        as: 'images',
                        attributes: ['id', 'image_path', 'caption', 'is_primary', 'sort_order']
                    }
                ]
            });

            res.status(200).json({
                success: true,
                message: 'Place updated successfully',
                data: updatedPlace
            });
        } catch (error) {
            await transaction.rollback();
            console.error('Error updating place:', error);
            
            // Delete uploaded files if error occurs
            if (req.files && req.files.length > 0) {
                req.files.forEach(file => {
                    if (fs.existsSync(file.path)) {
                        fs.unlinkSync(file.path);
                    }
                });
            }
            
            // Handle validation errors
            if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
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
                message: 'Error updating place',
                error: error.message
            });
        }
    },

    /**
     * Delete place
     * DELETE /api/places/:id
     */
    deletePlace: async (req, res) => {
        try {
            const { id } = req.params;
            const place = await Place.findByPk(id, {
                include: [
                    {
                        model: PlaceImage,
                        as: 'images'
                    }
                ]
            });

            if (!place) {
                return res.status(404).json({
                    success: false,
                    message: 'Place not found'
                });
            }

            // Delete all associated images from filesystem
            if (place.images && place.images.length > 0) {
                place.images.forEach(image => {
                    const imagePath = path.join('public', image.image_path);
                    if (fs.existsSync(imagePath)) {
                        fs.unlinkSync(imagePath);
                    }
                });
            }

            await place.destroy();

            res.status(200).json({
                success: true,
                message: 'Place deleted successfully'
            });
        } catch (error) {
            console.error('Error deleting place:', error);
            res.status(500).json({
                success: false,
                message: 'Error deleting place',
                error: error.message
            });
        }
    },

    /**
     * Toggle place active status
     * PATCH /api/places/:id/toggle-active
     */
    togglePlaceStatus: async (req, res) => {
        try {
            const { id } = req.params;
            const place = await Place.findByPk(id);

            if (!place) {
                return res.status(404).json({
                    success: false,
                    message: 'Place not found'
                });
            }

            await place.toggleActive();

            res.status(200).json({
                success: true,
                message: `Place ${place.is_active ? 'activated' : 'deactivated'} successfully`,
                data: place
            });
        } catch (error) {
            console.error('Error toggling place status:', error);
            res.status(500).json({
                success: false,
                message: 'Error toggling place status',
                error: error.message
            });
        }
    },

    /**
     * Toggle place featured status
     * PATCH /api/places/:id/toggle-featured
     */
    toggleFeaturedStatus: async (req, res) => {
        try {
            const { id } = req.params;
            const place = await Place.findByPk(id);

            if (!place) {
                return res.status(404).json({
                    success: false,
                    message: 'Place not found'
                });
            }

            await place.toggleFeatured();

            res.status(200).json({
                success: true,
                message: `Place ${place.is_featured ? 'featured' : 'unfeatured'} successfully`,
                data: place
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
     * Delete place image
     * DELETE /api/places/:placeId/images/:imageId
     */
    deletePlaceImage: async (req, res) => {
        try {
            const { placeId, imageId } = req.params;
            
            const image = await PlaceImage.findOne({
                where: { 
                    id: imageId,
                    place_id: placeId 
                }
            });

            if (!image) {
                return res.status(404).json({
                    success: false,
                    message: 'Image not found'
                });
            }

            // Delete image file from filesystem
            const imagePath = path.join('public', image.image_path);
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }

            await image.destroy();

            res.status(200).json({
                success: true,
                message: 'Image deleted successfully'
            });
        } catch (error) {
            console.error('Error deleting image:', error);
            res.status(500).json({
                success: false,
                message: 'Error deleting image',
                error: error.message
            });
        }
    },

    /**
     * Set primary image for place
     * PATCH /api/places/:placeId/images/:imageId/set-primary
     */
    setPrimaryImage: async (req, res) => {
        try {
            const { placeId, imageId } = req.params;
            
            const image = await PlaceImage.findOne({
                where: { 
                    id: imageId,
                    place_id: placeId 
                }
            });

            if (!image) {
                return res.status(404).json({
                    success: false,
                    message: 'Image not found'
                });
            }

            await image.setAsPrimary();

            res.status(200).json({
                success: true,
                message: 'Primary image set successfully',
                data: image
            });
        } catch (error) {
            console.error('Error setting primary image:', error);
            res.status(500).json({
                success: false,
                message: 'Error setting primary image',
                error: error.message
            });
        }
    },

    /**
     * Add rating to place
     * POST /api/places/:id/ratings
     */
    addRating: async (req, res) => {
        try {
            const { id } = req.params;
            const { rating, review } = req.body;

            // Validate rating
            if (!rating || rating < 0 || rating > 5) {
                return res.status(400).json({
                    success: false,
                    message: 'Rating must be between 0 and 5'
                });
            }

            // Check if place exists
            const place = await Place.findByPk(id);
            if (!place) {
                return res.status(404).json({
                    success: false,
                    message: 'Place not found'
                });
            }

            // Require authentication for ratings
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required to rate places'
                });
            }

            // Check if user already rated this place
            const existingRating = await PlaceRating.getUserRating(id, req.user.id);
            
            let placeRating;
            if (existingRating) {
                // Update existing rating
                existingRating.rating = rating;
                if (review !== undefined) existingRating.review = review;
                await existingRating.save();
                placeRating = existingRating;
            } else {
                // Create new rating
                placeRating = await PlaceRating.create({
                    place_id: id,
                    user_id: req.user.id,
                    rating: parseFloat(rating),
                    review: review || null,
                    is_approved: true
                });
            }

            // Update place average rating
            const { average, count } = await PlaceRating.calculateAverageRating(id);
            await place.updateRating(average, count);

            // Fetch the rating with user info
            const ratingWithUser = await PlaceRating.findByPk(placeRating.id, {
                include: [
                    {
                        model: User,
                        as: 'user',
                        attributes: ['id', 'name', 'email']
                    }
                ]
            });

            res.status(201).json({
                success: true,
                message: existingRating ? 'Rating updated successfully' : 'Rating added successfully',
                data: ratingWithUser
            });
        } catch (error) {
            console.error('Error adding rating:', error);
            
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
                message: 'Error adding rating',
                error: error.message
            });
        }
    },

    /**
     * Get place ratings
     * GET /api/places/:id/ratings
     */
    getPlaceRatings: async (req, res) => {
        try {
            const { id } = req.params;
            const { page = 1, limit = 10 } = req.query;

            // Check if place exists
            const place = await Place.findByPk(id);
            if (!place) {
                return res.status(404).json({
                    success: false,
                    message: 'Place not found'
                });
            }

            const offset = (parseInt(page) - 1) * parseInt(limit);

            const { count, rows: ratings } = await PlaceRating.findAndCountAll({
                where: { 
                    place_id: id,
                    is_approved: true 
                },
                include: [
                    {
                        model: User,
                        as: 'user',
                        attributes: ['id', 'name', 'email']
                    }
                ],
                order: [['created_at', 'DESC']],
                limit: parseInt(limit),
                offset: offset
            });

            // Get rating distribution
            const ratingDistribution = await PlaceRating.getRatingDistribution(id);

            res.status(200).json({
                success: true,
                count: ratings.length,
                total: count,
                page: parseInt(page),
                totalPages: Math.ceil(count / parseInt(limit)),
                rating_distribution: ratingDistribution,
                data: ratings
            });
        } catch (error) {
            console.error('Error fetching ratings:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching ratings',
                error: error.message
            });
        }
    },

    /**
     * Add place to favorites
     * POST /api/places/:id/favorites
     * @access Private (requires authentication)
     */
    addToFavorites: async (req, res) => {
        try {
            const { id } = req.params;
            const userId = req.user.id;

            // Check if place exists
            const place = await Place.findByPk(id);
            if (!place) {
                return res.status(404).json({
                    success: false,
                    message: 'Place not found'
                });
            }

            // Add to favorites
            const { favorite, created } = await FavoritePlace.addFavorite(userId, id);

            if (!created) {
                return res.status(200).json({
                    success: true,
                    message: 'Place is already in your favorites',
                    data: favorite
                });
            }

            res.status(201).json({
                success: true,
                message: 'Place added to favorites successfully',
                data: favorite
            });
        } catch (error) {
            console.error('Error adding to favorites:', error);
            res.status(500).json({
                success: false,
                message: 'Error adding place to favorites',
                error: error.message
            });
        }
    },

    /**
     * Remove place from favorites
     * DELETE /api/places/:id/favorites
     * @access Private (requires authentication)
     */
    removeFromFavorites: async (req, res) => {
        try {
            const { id } = req.params;
            const userId = req.user.id;

            // Remove from favorites
            const removed = await FavoritePlace.removeFavorite(userId, id);

            if (!removed) {
                return res.status(404).json({
                    success: false,
                    message: 'Place not found in favorites'
                });
            }

            res.status(200).json({
                success: true,
                message: 'Place removed from favorites successfully'
            });
        } catch (error) {
            console.error('Error removing from favorites:', error);
            res.status(500).json({
                success: false,
                message: 'Error removing place from favorites',
                error: error.message
            });
        }
    },

    /**
     * Get all user's favorite places
     * GET /api/places/favorites/my-favorites
     * @access Private (requires authentication)
     */
    getUserFavorites: async (req, res) => {
        try {
            const userId = req.user.id;
            const { page = 1, limit = 20 } = req.query;

            const offset = (parseInt(page) - 1) * parseInt(limit);

            const { count, rows: favorites } = await FavoritePlace.findAndCountAll({
                where: { user_id: userId },
                include: [
                    {
                        model: Place,
                        as: 'place',
                        where: { is_active: true },
                        required: true,
                        include: [
                            {
                                model: PlaceCategory,
                                as: 'category',
                                attributes: ['id', 'name', 'slug', 'icon', 'color']
                            },
                            {
                                model: PlaceImage,
                                as: 'images',
                                attributes: ['id', 'image_path', 'caption', 'is_primary'],
                                where: { is_primary: true },
                                required: false,
                                limit: 1
                            }
                        ]
                    }
                ],
                order: [['created_at', 'DESC']],
                limit: parseInt(limit),
                offset: offset
            });

            res.status(200).json({
                success: true,
                count: favorites.length,
                total: count,
                page: parseInt(page),
                totalPages: Math.ceil(count / parseInt(limit)),
                data: favorites.map(fav => ({
                    favorite_id: fav.id,
                    added_at: fav.created_at,
                    place: fav.place
                }))
            });
        } catch (error) {
            console.error('Error fetching favorites:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching favorite places',
                error: error.message
            });
        }
    },

    /**
     * Check if a place is favorited by user
     * GET /api/places/:id/favorites/check
     * @access Private (requires authentication)
     */
    checkFavoriteStatus: async (req, res) => {
        try {
            const { id } = req.params;
            const userId = req.user.id;

            const isFavorited = await FavoritePlace.isFavorited(userId, id);

            res.status(200).json({
                success: true,
                data: {
                    place_id: id,
                    is_favorited: isFavorited
                }
            });
        } catch (error) {
            console.error('Error checking favorite status:', error);
            res.status(500).json({
                success: false,
                message: 'Error checking favorite status',
                error: error.message
            });
        }
    },

    /**
     * Get favorite statistics for user
     * GET /api/places/favorites/stats
     * @access Private (requires authentication)
     */
    getFavoriteStats: async (req, res) => {
        try {
            const userId = req.user.id;

            const totalFavorites = await FavoritePlace.getUserFavoriteCount(userId);

            // Get category breakdown
            const categoryBreakdown = await FavoritePlace.findAll({
                where: { user_id: userId },
                attributes: [],
                include: [
                    {
                        model: Place,
                        as: 'place',
                        attributes: ['category_id'],
                        include: [
                            {
                                model: PlaceCategory,
                                as: 'category',
                                attributes: ['id', 'name', 'icon', 'color']
                            }
                        ]
                    }
                ],
                raw: false
            });

            // Count by category
            const categoryCounts = {};
            categoryBreakdown.forEach(fav => {
                if (fav.place && fav.place.category) {
                    const catId = fav.place.category.id;
                    if (!categoryCounts[catId]) {
                        categoryCounts[catId] = {
                            category: fav.place.category,
                            count: 0
                        };
                    }
                    categoryCounts[catId].count++;
                }
            });

            res.status(200).json({
                success: true,
                data: {
                    total_favorites: totalFavorites,
                    categories: Object.values(categoryCounts)
                }
            });
        } catch (error) {
            console.error('Error fetching favorite stats:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching favorite statistics',
                error: error.message
            });
        }
    }
};

module.exports = placeController;

