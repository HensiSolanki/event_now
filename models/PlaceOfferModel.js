const { DataTypes } = require('sequelize');
const sequelize = require("../config/database");

const PlaceOffer = sequelize.define('PlaceOffer', {
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
                msg: 'Place is required'
            }
        }
    },
    title: {
        type: DataTypes.STRING(200),
        allowNull: false,
        validate: {
            notEmpty: {
                msg: 'Offer title is required'
            }
        }
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    discount_type: {
        type: DataTypes.ENUM('percentage', 'fixed', 'other'),
        allowNull: false,
        defaultValue: 'percentage',
        validate: {
            notEmpty: {
                msg: 'Discount type is required'
            }
        }
    },
    discount_value: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        comment: 'Percentage or fixed amount value'
    },
    valid_from: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        validate: {
            notEmpty: {
                msg: 'Valid from date is required'
            },
            isDate: {
                msg: 'Must be a valid date'
            }
        }
    },
    valid_until: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        validate: {
            notEmpty: {
                msg: 'Valid until date is required'
            },
            isDate: {
                msg: 'Must be a valid date'
            }
        }
    },
    terms_and_conditions: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
    },
    usage_limit: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Maximum number of times this offer can be used (null = unlimited)'
    },
    used_count: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    },
    minimum_booking_amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        comment: 'Minimum amount required to use this offer'
    },
    code: {
        type: DataTypes.STRING(50),
        allowNull: true,
        unique: true,
        comment: 'Promo code for the offer'
    }
}, {
    tableName: 'place_offers',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    hooks: {
        beforeCreate: (offer) => {
            // Generate a unique code if not provided
            if (!offer.code && offer.title) {
                const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
                offer.code = `${offer.title.substring(0, 4).toUpperCase().replace(/[^A-Z0-9]/g, '')}${randomStr}`;
            }
        }
    }
});

/**
 * Instance method to check if offer is valid
 */
PlaceOffer.prototype.isValid = function () {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const validFrom = new Date(this.valid_from);
    const validUntil = new Date(this.valid_until);
    
    // Check if offer is active
    if (!this.is_active) {
        return false;
    }
    
    // Check if within valid date range
    if (today < validFrom || today > validUntil) {
        return false;
    }
    
    // Check if usage limit reached
    if (this.usage_limit !== null && this.used_count >= this.usage_limit) {
        return false;
    }
    
    return true;
};

/**
 * Instance method to increment usage count
 */
PlaceOffer.prototype.incrementUsage = async function () {
    this.used_count += 1;
    return await this.save();
};

/**
 * Instance method to toggle active status
 */
PlaceOffer.prototype.toggleActive = async function () {
    this.is_active = !this.is_active;
    return await this.save();
};

/**
 * Static method to get active offers for a place
 */
PlaceOffer.getActiveOffersByPlace = async function (placeId) {
    const { Op } = require('sequelize');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return await PlaceOffer.findAll({
        where: {
            place_id: placeId,
            is_active: true,
            valid_from: { [Op.lte]: today },
            valid_until: { [Op.gte]: today }
        },
        order: [['created_at', 'DESC']]
    });
};

/**
 * Static method to find offer by code
 */
PlaceOffer.findByCode = async function (code) {
    return await PlaceOffer.findOne({
        where: { code: code.toUpperCase() }
    });
};

module.exports = PlaceOffer;

