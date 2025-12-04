const { DataTypes } = require('sequelize');

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.createTable('place_categories', {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true
            },
            name: {
                type: DataTypes.STRING(100),
                allowNull: false,
                unique: true,
                comment: 'Category name (e.g., Sports, Clubs, Live Bands, DJ)'
            },
            slug: {
                type: DataTypes.STRING(100),
                allowNull: false,
                unique: true,
                comment: 'URL-friendly version of the name'
            },
            description: {
                type: DataTypes.TEXT,
                allowNull: true,
                comment: 'Description of the place category'
            },
            icon: {
                type: DataTypes.STRING(255),
                allowNull: true,
                comment: 'Icon or image path for the category'
            },
            color: {
                type: DataTypes.STRING(7),
                allowNull: true,
                defaultValue: '#000000',
                comment: 'Hex color code for category display'
            },
            is_active: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: true,
                comment: 'Whether the category is active/visible'
            },
            sort_order: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 0,
                comment: 'Display order of categories'
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
        await queryInterface.addIndex('place_categories', ['slug'], {
            name: 'idx_place_categories_slug'
        });

        await queryInterface.addIndex('place_categories', ['is_active'], {
            name: 'idx_place_categories_is_active'
        });

        await queryInterface.addIndex('place_categories', ['sort_order'], {
            name: 'idx_place_categories_sort_order'
        });

        // Table created successfully - no initial data
        // Use the API to create categories as needed
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.dropTable('place_categories');
    }
};

