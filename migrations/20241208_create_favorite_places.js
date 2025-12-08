const sequelize = require('../config/database');

/**
 * Migration: Create favorite_places table
 * This table stores user favorite places
 */
module.exports = {
    up: async () => {
        try {
            await sequelize.query(`
                CREATE TABLE IF NOT EXISTS favorite_places (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    user_id INT NOT NULL,
                    place_id INT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    
                    -- Foreign key constraints
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                    FOREIGN KEY (place_id) REFERENCES places(id) ON DELETE CASCADE,
                    
                    -- Unique constraint to prevent duplicate favorites
                    UNIQUE KEY unique_user_place (user_id, place_id),
                    
                    -- Indexes for performance
                    INDEX idx_user_id (user_id),
                    INDEX idx_place_id (place_id)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
                COMMENT='Stores user favorite places';
            `);
            
            console.log('✓ favorite_places table created successfully');
            return true;
        } catch (error) {
            console.error('✗ Error creating favorite_places table:', error);
            throw error;
        }
    },

    down: async () => {
        try {
            await sequelize.query('DROP TABLE IF EXISTS favorite_places');
            console.log('✓ favorite_places table dropped successfully');
            return true;
        } catch (error) {
            console.error('✗ Error dropping favorite_places table:', error);
            throw error;
        }
    }
};

