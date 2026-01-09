const { DataTypes } = require('sequelize');
const sequelize = require("../config/database");

const Activity = sequelize.define('Activity', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    place_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Reference to place (null if activity is not place-specific)'
    },
    title: {
        type: DataTypes.STRING(200),
        allowNull: false,
        validate: {
            notEmpty: {
                msg: 'Activity title cannot be empty'
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
    activity_type: {
        type: DataTypes.ENUM('sports', 'music', 'club', 'dj', 'event', 'festival', 'workshop', 'other'),
        allowNull: false,
        defaultValue: 'event'
    },
    status: {
        type: DataTypes.ENUM('upcoming', 'live', 'completed', 'cancelled'),
        allowNull: false,
        defaultValue: 'upcoming',
        comment: 'Status of the activity'
    },
    location: {
        type: DataTypes.STRING(500),
        allowNull: true,
        comment: 'Activity location (if different from place or no place)'
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
    start_date: {
        type: DataTypes.DATE,
        allowNull: false,
        comment: 'Activity start date and time'
    },
    end_date: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'Activity end date and time'
    },
    image_path: {
        type: DataTypes.STRING(255),
        allowNull: true,
        comment: 'Banner/poster image for the activity'
    },
    entry_fee: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: 0.00
    },
    is_free: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
    },
    max_participants: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Maximum number of participants (null for unlimited)'
    },
    current_participants: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    },
    contact_phone: {
        type: DataTypes.STRING(20),
        allowNull: true
    },
    contact_email: {
        type: DataTypes.STRING(100),
        allowNull: true,
        validate: {
            isEmail: {
                msg: 'Must be a valid email address'
            }
        }
    },
    organizer_name: {
        type: DataTypes.STRING(200),
        allowNull: true
    },
    tags: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: []
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
    created_by: {
        type: DataTypes.INTEGER,
        allowNull: true
    }
}, {
    tableName: 'activities',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    hooks: {
        beforeCreate: (activity) => {
            // Auto-generate slug from title if not provided
            if (!activity.slug && activity.title) {
                activity.slug = activity.title
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, '-')
                    .replace(/^-+|-+$/g, '');
            }
        },
        beforeUpdate: (activity) => {
            // Update slug if title changes and slug wasn't manually set
            if (activity.changed('title') && !activity.changed('slug')) {
                activity.slug = activity.title
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, '-')
                    .replace(/^-+|-+$/g, '');
            }
        }
    }
});

/**
 * Instance method to toggle activity to live
 */
Activity.prototype.makeLive = async function () {
    this.status = 'live';
    return await this.save();
};

/**
 * Instance method to mark activity as completed
 */
Activity.prototype.markCompleted = async function () {
    this.status = 'completed';
    return await this.save();
};

/**
 * Instance method to cancel activity
 */
Activity.prototype.cancel = async function () {
    this.status = 'cancelled';
    return await this.save();
};

/**
 * Instance method to toggle active status
 */
Activity.prototype.toggleActive = async function () {
    this.is_active = !this.is_active;
    return await this.save();
};

/**
 * Instance method to toggle featured status
 */
Activity.prototype.toggleFeatured = async function () {
    this.is_featured = !this.is_featured;
    return await this.save();
};

/**
 * Instance method to increment view count
 */
Activity.prototype.incrementViews = async function () {
    this.view_count += 1;
    return await this.save();
};

/**
 * Static method to get upcoming activities
 */
Activity.getUpcomingActivities = async function (options = {}) {
    const { place_id, activity_type, limit, offset } = options;
    const where = { 
        is_active: true,
        status: 'upcoming'
    };
    
    if (place_id) {
        where.place_id = place_id;
    }
    
    if (activity_type) {
        where.activity_type = activity_type;
    }
    
    return await Activity.findAll({
        where,
        order: [['start_date', 'ASC']],
        limit: limit || 20,
        offset: offset || 0
    });
};

/**
 * Static method to get live activities
 */
Activity.getLiveActivities = async function (options = {}) {
    const { place_id, activity_type, limit, offset } = options;
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
    
    return await Activity.findAll({
        where,
        order: [['start_date', 'DESC']],
        limit: limit || 20,
        offset: offset || 0
    });
};

/**
 * Static method to get featured activities
 */
Activity.getFeaturedActivities = async function (limit = 10) {
    return await Activity.findAll({
        where: { 
            is_active: true,
            is_featured: true,
            status: ['upcoming', 'live']
        },
        order: [['start_date', 'ASC'], ['view_count', 'DESC']],
        limit
    });
};

/**
 * Static method to find by slug
 */
Activity.findBySlug = async function (slug) {
    return await Activity.findOne({
        where: { slug }
    });
};

module.exports = Activity;

