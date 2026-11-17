const ActivityLog = require('../models/ActivityLog');

const logActivity = async ({
    user,
    organization,
    action,
    description,
    relatedTask = null,
    relatedProject = null
}) => {
    try {
        if (!user || !organization || !action || !description) {
            console.error('Activity log skipped: Missing required information.');
            return;
        }

        await ActivityLog.create({
            user,
            organization,
            action,
            description,
            relatedTask,
            relatedProject
        });

    } catch (error) {
        // Logging failure should not interrupt the main application action.
        console.error('Activity logging failed:', error.message);
    }
};

module.exports = logActivity;