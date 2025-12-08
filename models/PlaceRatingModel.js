const { DataTypes } = require('sequelize');
const sequelize = require("../config/database");

const PlaceRating = sequelize.define('PlaceRating', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    place_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            notEmpty: {
                msg: 'Place ID is required'
            }
        }
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            notEmpty: {
                msg: 'User ID is required'
            }
        }
    },
    rating: {
        type: DataTypes.DECIMAL(3, 2),
        allowNull: false,
        validate: {
            min: {
                args: [0.00],
                msg: 'Rating must be at least 0.00'
            },
            max: {
                args: [5.00],
                msg: 'Rating cannot exceed 5.00'
            },
            notEmpty: {
                msg: 'Rating is required'
            }
        }
    },
    review: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    is_approved: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
    }
}, {
    tableName: 'place_ratings',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

/**
 * Instance method to toggle approval status
 */
PlaceRating.prototype.toggleApproval = async function () {
    this.is_approved = !this.is_approved;
    return await this.save();
};

/**
 * Static method to get ratings for a place
 */
PlaceRating.getPlaceRatings = async function (placeId, approvedOnly = true) {
    const where = { place_id: placeId };
    
    if (approvedOnly) {
        where.is_approved = true;
    }
    
    return await PlaceRating.findAll({
        where,
        order: [['created_at', 'DESC']]
    });
};

/**
 * Static method to get user's rating for a place
 */
PlaceRating.getUserRating = async function (placeId, userId) {
    return await PlaceRating.findOne({
        where: { 
            place_id: placeId,
            user_id: userId 
        }
    });
};

/**
 * Static method to calculate average rating for a place
 */
PlaceRating.calculateAverageRating = async function (placeId) {
    const ratings = await PlaceRating.findAll({
        where: { 
            place_id: placeId,
            is_approved: true 
        },
        attributes: [
            [sequelize.fn('AVG', sequelize.col('rating')), 'average'],
            [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        raw: true
    });
    
    return {
        average: parseFloat(ratings[0].average || 0).toFixed(2),
        count: parseInt(ratings[0].count || 0)
    };
};

/**
 * Static method to get approved ratings count by rating value
 */
PlaceRating.getRatingDistribution = async function (placeId) {
    const { Op } = require('sequelize');
    
    const distribution = await PlaceRating.findAll({
        where: { 
            place_id: placeId,
            is_approved: true 
        },
        attributes: [
            [sequelize.fn('FLOOR', sequelize.col('rating')), 'star'],
            [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        group: [sequelize.fn('FLOOR', sequelize.col('rating'))],
        raw: true
    });
    
    // Format as object with star ratings 1-5
    const result = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    distribution.forEach(item => {
        const star = parseInt(item.star) || 0;
        if (star >= 1 && star <= 5) {
            result[star] = parseInt(item.count);
        }
    });
    
    return result;
};

module.exports = PlaceRating;

