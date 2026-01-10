const { DataTypes } = require('sequelize');

module.exports = {
    up: async (queryInterface, Sequelize) => {
        // Add crowded_percentage field to places table
        await queryInterface.addColumn('places', 'crowded_percentage', {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: 0,
            comment: 'Crowded percentage (0-100) indicating how crowded the place is',
            validate: {
                min: 0,
                max: 100
            }
        });

        // Add index for better performance when filtering by crowded_percentage
        await queryInterface.addIndex('places', ['crowded_percentage'], {
            name: 'idx_places_crowded_percentage'
        });
    },

    down: async (queryInterface, Sequelize) => {
        // Remove the index first
        await queryInterface.removeIndex('places', 'idx_places_crowded_percentage');
        
        // Remove the column
        await queryInterface.removeColumn('places', 'crowded_percentage');
    }
};

