const sequelize = require('../config/database');
const { DataTypes } = require('sequelize');

/**
 * Migration: Create Activities Table
 * Date: 2025-01-09
 */

async function up() {
    const queryInterface = sequelize.getQueryInterface();

    await queryInterface.createTable('activities', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        place_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'places',
                key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL',
            comment: 'Reference to place (null if activity is not place-specific)'
        },
        title: {
            type: DataTypes.STRING(200),
            allowNull: false
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
            allowNull: true
        },
        longitude: {
            type: DataTypes.DECIMAL(11, 8),
            allowNull: true
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
            allowNull: true
        },
        organizer_name: {
            type: DataTypes.STRING(200),
            allowNull: true
        },
        tags: {
            type: DataTypes.JSON,
            allowNull: true
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
            allowNull: true,
            references: {
                model: 'users',
                key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL'
        },
        created_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
        },
        updated_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
        }
    });

    // Add indexes for better query performance
    await queryInterface.addIndex('activities', ['place_id'], {
        name: 'idx_activities_place_id'
    });

    await queryInterface.addIndex('activities', ['status'], {
        name: 'idx_activities_status'
    });

    await queryInterface.addIndex('activities', ['activity_type'], {
        name: 'idx_activities_type'
    });

    await queryInterface.addIndex('activities', ['start_date'], {
        name: 'idx_activities_start_date'
    });

    await queryInterface.addIndex('activities', ['is_active', 'status'], {
        name: 'idx_activities_active_status'
    });

    await queryInterface.addIndex('activities', ['slug'], {
        name: 'idx_activities_slug'
    });

    console.log('✓ Activities table created successfully');
}

async function down() {
    const queryInterface = sequelize.getQueryInterface();
    await queryInterface.dropTable('activities');
    console.log('✓ Activities table dropped successfully');
}

module.exports = { up, down };

