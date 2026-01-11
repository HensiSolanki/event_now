const FavoritePlace = require('../../models/FavoritePlaceModel');
const Place = require('../../models/PlaceModel');
const PlaceCategory = require('../../models/PlaceCategoryModel');
const PlaceImage = require('../../models/PlaceImageModel');
const PlaceOffer = require('../../models/PlaceOfferModel');

/**
 * Favorite Place Controller
 * Handles all operations related to user's favorite places
 */

const favoritePlaceController = {
    /**
     * Add place to favorites
     * POST /api/auth/favorites/:placeId
     * @access Private (requires authentication)
     */
    addToFavorites: async (req, res) => {
        try {
            const { placeId } = req.params;
            const userId = req.user.id;

            // Check if place exists
            const place = await Place.findByPk(placeId);
            if (!place) {
                return res.status(404).json({
                    success: false,
                    message: 'Place not found'
                });
            }

            // Add to favorites
            const { favorite, created } = await FavoritePlace.addFavorite(userId, placeId);

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
     * DELETE /api/auth/favorites/:placeId
     * @access Private (requires authentication)
     */
    removeFromFavorites: async (req, res) => {
        try {
            const { placeId } = req.params;
            const userId = req.user.id;

            // Remove from favorites
            const removed = await FavoritePlace.removeFavorite(userId, placeId);

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
     * GET /api/auth/favorites
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
                            },
                            {
                                model: PlaceOffer,
                                as: 'offers',
                                attributes: [
                                    'id',
                                    'title',
                                    'description',
                                    'discount_type',
                                    'discount_value',
                                    'valid_from',
                                    'valid_until',
                                    'terms_and_conditions',
                                    'is_active',
                                    'usage_limit',
                                    'used_count',
                                    'minimum_booking_amount',
                                    'code'
                                ],
                                required: false
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
     * GET /api/auth/favorites/:placeId/check
     * @access Private (requires authentication)
     */
    checkFavoriteStatus: async (req, res) => {
        try {
            const { placeId } = req.params;
            const userId = req.user.id;

            const isFavorited = await FavoritePlace.isFavorited(userId, placeId);

            res.status(200).json({
                success: true,
                data: {
                    place_id: placeId,
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
     * GET /api/auth/favorites/stats
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

module.exports = favoritePlaceController;

