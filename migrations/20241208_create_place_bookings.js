/**
 * Migration: Create place_bookings table
 * Date: 2024-12-08
 */

const sequelize = require('../config/database');
const { DataTypes } = require('sequelize');

async function up() {
    const queryInterface = sequelize.getQueryInterface();
    
    await queryInterface.createTable('place_bookings', {
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
            onDelete: 'CASCADE'
        },
        user_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE'
        },
        booking_date: {
            type: DataTypes.DATEONLY,
            allowNull: false
        },
        booking_time: {
            type: DataTypes.TIME,
            allowNull: true
        },
        number_of_guests: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 1
        },
        full_name: {
            type: DataTypes.STRING(200),
            allowNull: false
        },
        email: {
            type: DataTypes.STRING(100),
            allowNull: false
        },
        phone: {
            type: DataTypes.STRING(20),
            allowNull: false
        },
        special_requests: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        booking_status: {
            type: DataTypes.ENUM('pending', 'confirmed', 'cancelled', 'completed'),
            allowNull: false,
            defaultValue: 'pending'
        },
        payment_status: {
            type: DataTypes.ENUM('unpaid', 'paid', 'refunded'),
            allowNull: false,
            defaultValue: 'unpaid'
        },
        total_amount: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true,
            defaultValue: 0.00
        },
        booking_reference: {
            type: DataTypes.STRING(50),
            allowNull: true,
            unique: true
        },
        cancelled_at: {
            type: DataTypes.DATE,
            allowNull: true
        },
        cancellation_reason: {
            type: DataTypes.TEXT,
            allowNull: true
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
    await queryInterface.addIndex('place_bookings', ['place_id'], {
        name: 'idx_place_bookings_place_id'
    });

    await queryInterface.addIndex('place_bookings', ['user_id'], {
        name: 'idx_place_bookings_user_id'
    });

    await queryInterface.addIndex('place_bookings', ['booking_date'], {
        name: 'idx_place_bookings_booking_date'
    });

    await queryInterface.addIndex('place_bookings', ['booking_status'], {
        name: 'idx_place_bookings_booking_status'
    });

    await queryInterface.addIndex('place_bookings', ['booking_reference'], {
        name: 'idx_place_bookings_booking_reference',
        unique: true
    });

    console.log('✓ Created place_bookings table with indexes');
}

async function down() {
    const queryInterface = sequelize.getQueryInterface();
    
    await queryInterface.dropTable('place_bookings');
    console.log('✓ Dropped place_bookings table');
}

module.exports = { up, down };

