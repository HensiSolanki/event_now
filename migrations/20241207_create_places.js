const { DataTypes } = require('sequelize');

module.exports = {
    up: async (queryInterface, Sequelize) => {
        // Create places table
        await queryInterface.createTable('places', {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true
            },
            category_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: 'place_categories',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'RESTRICT',
                comment: 'Reference to place category'
            },
            name: {
                type: DataTypes.STRING(200),
                allowNull: false,
                comment: 'Name of the place'
            },
            slug: {
                type: DataTypes.STRING(200),
                allowNull: false,
                unique: true,
                comment: 'URL-friendly version of the name'
            },
            description: {
                type: DataTypes.TEXT,
                allowNull: true,
                comment: 'Detailed description of the place'
            },
            location: {
                type: DataTypes.STRING(500),
                allowNull: true,
                comment: 'Full address of the place'
            },
            latitude: {
                type: DataTypes.DECIMAL(10, 8),
                allowNull: true,
                comment: 'Latitude coordinate'
            },
            longitude: {
                type: DataTypes.DECIMAL(11, 8),
                allowNull: true,
                comment: 'Longitude coordinate'
            },
            pricing: {
                type: DataTypes.ENUM('free', 'budget', 'moderate', 'expensive', 'luxury'),
                allowNull: true,
                defaultValue: 'moderate',
                comment: 'Price range of the place'
            },
            price_range_min: {
                type: DataTypes.DECIMAL(10, 2),
                allowNull: true,
                comment: 'Minimum price in local currency'
            },
            price_range_max: {
                type: DataTypes.DECIMAL(10, 2),
                allowNull: true,
                comment: 'Maximum price in local currency'
            },
            opening_time: {
                type: DataTypes.TIME,
                allowNull: true,
                comment: 'Opening time (24-hour format)'
            },
            closing_time: {
                type: DataTypes.TIME,
                allowNull: true,
                comment: 'Closing time (24-hour format)'
            },
            is_open_24_7: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false,
                comment: 'Whether the place is open 24/7'
            },
            operating_days: {
                type: DataTypes.JSON,
                allowNull: true,
                comment: 'Array of operating days: ["monday", "tuesday", ...]'
            },
            phone: {
                type: DataTypes.STRING(20),
                allowNull: true,
                comment: 'Contact phone number'
            },
            email: {
                type: DataTypes.STRING(100),
                allowNull: true,
                comment: 'Contact email'
            },
            website: {
                type: DataTypes.STRING(255),
                allowNull: true,
                comment: 'Website URL'
            },
            average_rating: {
                type: DataTypes.DECIMAL(3, 2),
                allowNull: false,
                defaultValue: 0.00,
                comment: 'Average rating (0.00 to 5.00)'
            },
            total_ratings: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 0,
                comment: 'Total number of ratings received'
            },
            is_featured: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false,
                comment: 'Whether the place is featured'
            },
            is_active: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: true,
                comment: 'Whether the place is active/visible'
            },
            view_count: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 0,
                comment: 'Number of times the place has been viewed'
            },
            created_by: {
                type: DataTypes.INTEGER,
                allowNull: true,
                references: {
                    model: 'users',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL',
                comment: 'User who created this place'
            },
            created_at: {
                type: DataTypes.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            },
            updated_at: {
                type: DataTypes.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
            }
        });

        // Create place_images table
        await queryInterface.createTable('place_images', {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true
            },
            place_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: 'places',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE',
                comment: 'Reference to place'
            },
            image_path: {
                type: DataTypes.STRING(500),
                allowNull: false,
                comment: 'Path to the uploaded image'
            },
            caption: {
                type: DataTypes.STRING(255),
                allowNull: true,
                comment: 'Optional caption for the image'
            },
            is_primary: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false,
                comment: 'Whether this is the primary/featured image'
            },
            sort_order: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 0,
                comment: 'Display order of images'
            },
            created_at: {
                type: DataTypes.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            },
            updated_at: {
                type: DataTypes.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
            }
        });

        // Create place_ratings table
        await queryInterface.createTable('place_ratings', {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true
            },
            place_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: 'places',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE',
                comment: 'Reference to place'
            },
            user_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: 'users',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE',
                comment: 'User who gave the rating'
            },
            rating: {
                type: DataTypes.DECIMAL(3, 2),
                allowNull: false,
                validate: {
                    min: 0.00,
                    max: 5.00
                },
                comment: 'Rating value (0.00 to 5.00)'
            },
            review: {
                type: DataTypes.TEXT,
                allowNull: true,
                comment: 'Optional review text'
            },
            is_approved: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: true,
                comment: 'Whether the rating is approved for display'
            },
            created_at: {
                type: DataTypes.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            },
            updated_at: {
                type: DataTypes.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
            }
        });

        // Add indexes for better performance
        await queryInterface.addIndex('places', ['category_id'], {
            name: 'idx_places_category_id'
        });

        await queryInterface.addIndex('places', ['slug'], {
            name: 'idx_places_slug'
        });

        await queryInterface.addIndex('places', ['is_active'], {
            name: 'idx_places_is_active'
        });

        await queryInterface.addIndex('places', ['is_featured'], {
            name: 'idx_places_is_featured'
        });

        await queryInterface.addIndex('places', ['average_rating'], {
            name: 'idx_places_average_rating'
        });

        await queryInterface.addIndex('place_images', ['place_id'], {
            name: 'idx_place_images_place_id'
        });

        await queryInterface.addIndex('place_images', ['is_primary'], {
            name: 'idx_place_images_is_primary'
        });

        await queryInterface.addIndex('place_ratings', ['place_id'], {
            name: 'idx_place_ratings_place_id'
        });

        await queryInterface.addIndex('place_ratings', ['user_id'], {
            name: 'idx_place_ratings_user_id'
        });

        await queryInterface.addIndex('place_ratings', ['is_approved'], {
            name: 'idx_place_ratings_is_approved'
        });

        // Add unique constraint for one rating per user per place
        await queryInterface.addIndex('place_ratings', ['place_id', 'user_id'], {
            unique: true,
            name: 'unique_place_user_rating'
        });
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.dropTable('place_ratings');
        await queryInterface.dropTable('place_images');
        await queryInterface.dropTable('places');
    }
};

