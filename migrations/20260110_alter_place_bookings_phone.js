/**
 * Migration: Alter place_bookings table - Make phone column optional
 * Date: 2026-01-10
 * 
 * IMPORTANT: After pulling this change, run: npm run migrate
 * This migration changes the phone field from NOT NULL to NULL (optional)
 */

const sequelize = require('../config/database');
const { DataTypes } = require('sequelize');

async function up() {
    const queryInterface = sequelize.getQueryInterface();
    
    // Change phone column to allow NULL
    await queryInterface.changeColumn('place_bookings', 'phone', {
        type: DataTypes.STRING(20),
        allowNull: true
    });

    console.log('✓ Altered place_bookings table - phone column is now optional');
}

async function down() {
    const queryInterface = sequelize.getQueryInterface();
    
    // Revert: Make phone column NOT NULL again
    // Note: This might fail if there are NULL values in the database
    await queryInterface.changeColumn('place_bookings', 'phone', {
        type: DataTypes.STRING(20),
        allowNull: false
    });
    
    console.log('✓ Reverted place_bookings table - phone column is now required');
}

module.exports = { up, down };

