const sequelize = require('../config/database');
const fs = require('fs');
const path = require('path');

/**
 * Simple migration rollback script
 * This script rolls back the last executed migration
 */

const rollbackMigration = async () => {
    try {
        // Test database connection
        await sequelize.authenticate();
        console.log('Database connection established successfully.');

        // Check if migrations table exists
        const [tables] = await sequelize.query(
            "SHOW TABLES LIKE 'migrations'"
        );

        if (tables.length === 0) {
            console.log('No migrations table found. Nothing to rollback.');
            process.exit(0);
        }

        // Get the last executed migration
        const [lastMigration] = await sequelize.query(
            'SELECT name FROM migrations ORDER BY id DESC LIMIT 1'
        );

        if (lastMigration.length === 0) {
            console.log('No migrations to rollback.');
            process.exit(0);
        }

        const migrationName = lastMigration[0].name;
        console.log(`🔄 Rolling back migration: ${migrationName}`);

        // Load and execute the down method
        const migrationsDir = __dirname;
        const migrationPath = path.join(migrationsDir, migrationName);
        
        if (!fs.existsSync(migrationPath)) {
            throw new Error(`Migration file not found: ${migrationName}`);
        }

        const migration = require(migrationPath);
        
        // Run the rollback
        await migration.down(sequelize.getQueryInterface(), sequelize.Sequelize);
        
        // Remove the migration record
        await sequelize.query(
            'DELETE FROM migrations WHERE name = ?',
            { replacements: [migrationName] }
        );
        
        console.log(`✅ Rolled back: ${migrationName}`);
        console.log('\n✨ Rollback completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Rollback failed:', error);
        process.exit(1);
    }
};

// Run if called directly
if (require.main === module) {
    rollbackMigration();
}

module.exports = rollbackMigration;


