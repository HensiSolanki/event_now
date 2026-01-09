const cron = require('node-cron');
const Activity = require('../models/ActivityModel');
const { Op } = require('sequelize');

/**
 * Activity Status Scheduler
 * Automatically updates activity statuses based on current time
 * 
 * Rules:
 * 1. If current time >= start_date and status is 'upcoming', change to 'live'
 * 2. If current time >= end_date and status is 'live', change to 'completed'
 */

class ActivityScheduler {
    constructor() {
        this.cronJob = null;
        this.isRunning = false;
    }

    /**
     * Start the scheduler
     * Runs every minute by default
     */
    start(cronExpression = '* * * * *') {
        if (this.isRunning) {
            console.log('⚠️  Activity scheduler is already running');
            return;
        }

        console.log('🚀 Starting activity status scheduler...');
        
        // Run immediately on start
        this.updateActivityStatuses();

        // Schedule periodic updates
        this.cronJob = cron.schedule(cronExpression, async () => {
            await this.updateActivityStatuses();
        });

        this.isRunning = true;
        console.log('✅ Activity scheduler started successfully');
        console.log(`⏰ Running every minute (cron: ${cronExpression})`);
    }

    /**
     * Stop the scheduler
     */
    stop() {
        if (this.cronJob) {
            this.cronJob.stop();
            this.isRunning = false;
            console.log('🛑 Activity scheduler stopped');
        }
    }

    /**
     * Main function to update activity statuses
     */
    async updateActivityStatuses() {
        try {
            const now = new Date();
            let updatedCount = 0;

            // Update upcoming activities to live
            const madeActiveCount = await this.makeActivitiesLive(now);
            updatedCount += madeActiveCount;

            // Update live activities to completed
            const completedCount = await this.completeActivities(now);
            updatedCount += completedCount;

            if (updatedCount > 0) {
                console.log(`✨ Activity scheduler: Updated ${updatedCount} activities at ${now.toLocaleString()}`);
            }

        } catch (error) {
            console.error('❌ Error in activity scheduler:', error.message);
        }
    }

    /**
     * Make activities live if their start time has passed
     */
    async makeActivitiesLive(now) {
        try {
            const activitiesToMakeLive = await Activity.findAll({
                where: {
                    status: 'upcoming',
                    is_active: true,
                    start_date: {
                        [Op.lte]: now
                    }
                }
            });

            if (activitiesToMakeLive.length > 0) {
                // Update all matching activities
                const updateResult = await Activity.update(
                    { status: 'live' },
                    {
                        where: {
                            status: 'upcoming',
                            is_active: true,
                            start_date: {
                                [Op.lte]: now
                            }
                        }
                    }
                );

                const count = updateResult[0]; // Number of affected rows
                if (count > 0) {
                    console.log(`🔴 LIVE: ${count} activities are now live`);
                    
                    // Log each activity that went live
                    activitiesToMakeLive.forEach(activity => {
                        console.log(`   - "${activity.title}" (ID: ${activity.id})`);
                    });
                }
                return count;
            }

            return 0;
        } catch (error) {
            console.error('Error making activities live:', error.message);
            return 0;
        }
    }

    /**
     * Complete activities if their end time has passed
     */
    async completeActivities(now) {
        try {
            // Find activities with end_date that should be completed
            const activitiesToComplete = await Activity.findAll({
                where: {
                    status: 'live',
                    is_active: true,
                    end_date: {
                        [Op.not]: null,
                        [Op.lte]: now
                    }
                }
            });

            if (activitiesToComplete.length > 0) {
                const updateResult = await Activity.update(
                    { status: 'completed' },
                    {
                        where: {
                            status: 'live',
                            is_active: true,
                            end_date: {
                                [Op.not]: null,
                                [Op.lte]: now
                            }
                        }
                    }
                );

                const count = updateResult[0];
                if (count > 0) {
                    console.log(`✅ COMPLETED: ${count} activities marked as completed`);
                    
                    // Log each activity that completed
                    activitiesToComplete.forEach(activity => {
                        console.log(`   - "${activity.title}" (ID: ${activity.id})`);
                    });
                }
                return count;
            }

            return 0;
        } catch (error) {
            console.error('Error completing activities:', error.message);
            return 0;
        }
    }

    /**
     * Get scheduler status
     */
    getStatus() {
        return {
            isRunning: this.isRunning,
            cronExpression: this.cronJob ? '* * * * *' : null
        };
    }

    /**
     * Manual trigger for testing
     */
    async triggerManually() {
        console.log('🔄 Manually triggering activity status update...');
        await this.updateActivityStatuses();
    }
}

// Create singleton instance
const activityScheduler = new ActivityScheduler();

module.exports = activityScheduler;

