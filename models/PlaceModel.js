const { DataTypes } = require('sequelize');
const sequelize = require("../config/database");

const Place = sequelize.define('Place', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    category_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            notEmpty: {
                msg: 'Category is required'
            }
        }
    },
    name: {
        type: DataTypes.STRING(200),
        allowNull: false,
        validate: {
            notEmpty: {
                msg: 'Place name cannot be empty'
            }
        }
    },
    slug: {
        type: DataTypes.STRING(200),
        allowNull: true,
        unique: true
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    location: {
        type: DataTypes.STRING(500),
        allowNull: true
    },
    latitude: {
        type: DataTypes.DECIMAL(10, 8),
        allowNull: true,
        validate: {
            min: -90,
            max: 90
        }
    },
    longitude: {
        type: DataTypes.DECIMAL(11, 8),
        allowNull: true,
        validate: {
            min: -180,
            max: 180
        }
    },
    pricing: {
        type: DataTypes.ENUM('free', 'budget', 'moderate', 'expensive', 'luxury'),
        allowNull: true,
        defaultValue: 'moderate'
    },
    price_range_min: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true
    },
    price_range_max: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true
    },
    opening_time: {
        type: DataTypes.TIME,
        allowNull: true
    },
    closing_time: {
        type: DataTypes.TIME,
        allowNull: true
    },
    is_open_24_7: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
    operating_days: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    },
    phone: {
        type: DataTypes.STRING(20),
        allowNull: true
    },
    email: {
        type: DataTypes.STRING(100),
        allowNull: true,
        validate: {
            isEmail: {
                msg: 'Must be a valid email address'
            }
        }
    },
    website: {
        type: DataTypes.STRING(255),
        allowNull: true,
        validate: {
            isUrl: {
                msg: 'Must be a valid URL'
            }
        }
    },
    average_rating: {
        type: DataTypes.DECIMAL(3, 2),
        allowNull: false,
        defaultValue: 0.00
    },
    total_ratings: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    },
    is_featured: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
    },
    view_count: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    },
    crowded_percentage: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0,
        validate: {
            min: 0,
            max: 100
        }
    },
    created_by: {
        type: DataTypes.INTEGER,
        allowNull: true
    }
}, {
    tableName: 'places',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    hooks: {
        beforeCreate: (place) => {
            // Auto-generate slug from name if not provided
            if (!place.slug && place.name) {
                place.slug = place.name
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, '-')
                    .replace(/^-+|-+$/g, '');
            }
        },
        beforeUpdate: (place) => {
            // Update slug if name changes and slug wasn't manually set
            if (place.changed('name') && !place.changed('slug')) {
                place.slug = place.name
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, '-')
                    .replace(/^-+|-+$/g, '');
            }
        }
    }
});

/**
 * Instance method to toggle active status
 */
Place.prototype.toggleActive = async function () {
    this.is_active = !this.is_active;
    return await this.save();
};

/**
 * Instance method to toggle featured status
 */
Place.prototype.toggleFeatured = async function () {
    this.is_featured = !this.is_featured;
    return await this.save();
};

/**
 * Instance method to increment view count
 */
Place.prototype.incrementViews = async function () {
    this.view_count += 1;
    return await this.save();
};

/**
 * Instance method to update average rating
 */
Place.prototype.updateRating = async function (newRating, totalRatings) {
    this.average_rating = newRating;
    this.total_ratings = totalRatings;
    return await this.save();
};

/**
 * Static method to get active places
 */
Place.getActivePlaces = async function (options = {}) {
    const { category_id, limit, offset } = options;
    const where = { is_active: true };
    
    if (category_id) {
        where.category_id = category_id;
    }
    
    return await Place.findAll({
        where,
        order: [['created_at', 'DESC']],
        limit: limit || 20,
        offset: offset || 0
    });
};

/**
 * Static method to get featured places
 */
Place.getFeaturedPlaces = async function (limit = 10) {
    return await Place.findAll({
        where: { 
            is_active: true,
            is_featured: true 
        },
        order: [['average_rating', 'DESC'], ['view_count', 'DESC']],
        limit
    });
};

/**
 * Static method to get place by slug
 */
Place.findBySlug = async function (slug) {
    return await Place.findOne({
        where: { slug }
    });
};

/**
 * Static method to search places
 */
Place.searchPlaces = async function (searchTerm, options = {}) {
    const { category_id, limit, offset } = options;
    const { Op } = require('sequelize');
    
    const where = {
        is_active: true,
        [Op.or]: [
            { name: { [Op.like]: `%${searchTerm}%` } },
            { description: { [Op.like]: `%${searchTerm}%` } },
            { location: { [Op.like]: `%${searchTerm}%` } }
        ]
    };
    
    if (category_id) {
        where.category_id = category_id;
    }
    
    return await Place.findAll({
        where,
        order: [['average_rating', 'DESC']],
        limit: limit || 20,
        offset: offset || 0
    });
};

module.exports = Place;


