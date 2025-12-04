const sequelize = require('../config/database');
const fs = require('fs');
const path = require('path');

/**
 * Simple migration runner for Sequelize
 * This script runs all migration files in order
 */

const runMigrations = async () => {
    try {
        // Test database connection
        await sequelize.authenticate();
        console.log('Database connection established successfully.');

        // Create migrations table if it doesn't exist
        await sequelize.query(`
            CREATE TABLE IF NOT EXISTS migrations (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL UNIQUE,
                executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Get list of executed migrations
        const [executedMigrations] = await sequelize.query(
            'SELECT name FROM migrations ORDER BY id'
        );
        const executedNames = executedMigrations.map(m => m.name);

        // Get all migration files
        const migrationsDir = __dirname;
        const migrationFiles = fs.readdirSync(migrationsDir)
            .filter(file => file.endsWith('.js') && file !== 'migrate.js')
            .sort();

        console.log(`Found ${migrationFiles.length} migration file(s)`);

        // Run pending migrations
        for (const file of migrationFiles) {
            if (executedNames.includes(file)) {
                console.log(`⏭️  Skipping ${file} (already executed)`);
                continue;
            }

            console.log(`🔄 Running migration: ${file}`);
            const migration = require(path.join(migrationsDir, file));
            
            // Run the migration
            await migration.up(sequelize.getQueryInterface(), sequelize.Sequelize);
            
            // Record the migration
            await sequelize.query(
                'INSERT INTO migrations (name) VALUES (?)',
                { replacements: [file] }
            );
            
            console.log(`✅ Completed: ${file}`);
        }

        console.log('\n✨ All migrations completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
};

// Run if called directly
if (require.main === module) {
    runMigrations();
}

module.exports = runMigrations;

