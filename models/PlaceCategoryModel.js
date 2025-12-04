const { DataTypes } = require('sequelize');
const sequelize = require("../config/database");

const PlaceCategory = sequelize.define('PlaceCategory', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
        validate: {
            notEmpty: {
                msg: 'Category name cannot be empty'
            }
        }
    },
    slug: {
        type: DataTypes.STRING(100),
        allowNull: true,
        unique: true     
        
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    icon: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    color: {
        type: DataTypes.STRING(7),
        allowNull: true,
        defaultValue: '#000000',
        validate: {
            is: {
                args: /^#[0-9A-F]{6}$/i,
                msg: 'Color must be a valid hex color code'
            }
        }
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
    },
    sort_order: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    }
}, {
    tableName: 'place_categories',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    hooks: {
        beforeCreate: (category) => {
            // Auto-generate slug from name if not provided
            if (!category.slug && category.name) {
                category.slug = category.name
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, '-')
                    .replace(/^-+|-+$/g, '');
            }
        },
        beforeUpdate: (category) => {
            // Update slug if name changes and slug wasn't manually set
            if (category.changed('name') && !category.changed('slug')) {
                category.slug = category.name
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
PlaceCategory.prototype.toggleActive = async function () {
    this.is_active = !this.is_active;
    return await this.save();
};

/**
 * Static method to get active categories
 */
PlaceCategory.getActiveCategories = async function () {
    return await PlaceCategory.findAll({
        where: { is_active: true },
        order: [['sort_order', 'ASC'], ['name', 'ASC']]
    });
};

/**
 * Static method to get category by slug
 */
PlaceCategory.findBySlug = async function (slug) {
    return await PlaceCategory.findOne({
        where: { slug }
    });
};

module.exports = PlaceCategory;

