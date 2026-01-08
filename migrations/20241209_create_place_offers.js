const { DataTypes } = require('sequelize');

module.exports = {
    up: async (queryInterface, Sequelize) => {
        // Create place_offers table
        await queryInterface.createTable('place_offers', {
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
            title: {
                type: DataTypes.STRING(200),
                allowNull: false,
                comment: 'Offer title'
            },
            description: {
                type: DataTypes.TEXT,
                allowNull: true,
                comment: 'Detailed description of the offer'
            },
            discount_type: {
                type: DataTypes.ENUM('percentage', 'fixed', 'other'),
                allowNull: false,
                defaultValue: 'percentage',
                comment: 'Type of discount'
            },
            discount_value: {
                type: DataTypes.DECIMAL(10, 2),
                allowNull: true,
                comment: 'Percentage or fixed amount value'
            },
            valid_from: {
                type: DataTypes.DATEONLY,
                allowNull: false,
                comment: 'Offer valid from date'
            },
            valid_until: {
                type: DataTypes.DATEONLY,
                allowNull: false,
                comment: 'Offer valid until date'
            },
            terms_and_conditions: {
                type: DataTypes.TEXT,
                allowNull: true,
                comment: 'Terms and conditions for the offer'
            },
            is_active: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: true,
                comment: 'Whether the offer is active'
            },
            usage_limit: {
                type: DataTypes.INTEGER,
                allowNull: true,
                comment: 'Maximum number of times this offer can be used (null = unlimited)'
            },
            used_count: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 0,
                comment: 'Number of times offer has been used'
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

        // Add indexes for better query performance
        await queryInterface.addIndex('place_offers', ['place_id'], {
            name: 'idx_place_offers_place_id'
        });

        await queryInterface.addIndex('place_offers', ['code'], {
            name: 'idx_place_offers_code'
        });

        await queryInterface.addIndex('place_offers', ['is_active'], {
            name: 'idx_place_offers_is_active'
        });

        await queryInterface.addIndex('place_offers', ['valid_from', 'valid_until'], {
            name: 'idx_place_offers_validity_dates'
        });
    },

    down: async (queryInterface, Sequelize) => {
        // Drop the table
        await queryInterface.dropTable('place_offers');
    }
};

