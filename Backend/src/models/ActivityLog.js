const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema(
    {
        organization: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Organization',
            required: true,
            index: true
        },

        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },

        action: {
            type: String,
            required: true,
            enum: [
                'PROJECT_CREATED',
                'PROJECT_UPDATED',
                'PROJECT_DELETED',
                'TASK_CREATED',
                'TASK_UPDATED',
                'TASK_ASSIGNED',
                'TASK_STATUS_CHANGED',
                'TASK_PRIORITY_CHANGED',
                'TASK_DELETED',
                'EMPLOYEE_CREATED',
                'EMPLOYEE_INVITED',
                'EMPLOYEE_ACTIVATED',
                'EMPLOYEE_SUSPENDED'
            ]
        },

        description: {
            type: String,
            required: true,
            trim: true,
            maxlength: 500
        },

        relatedTask: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Task',
            default: null
        },

        relatedProject: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Project',
            default: null
        }
    },
    {
        timestamps: true
    }
);

activityLogSchema.index({
    organization: 1,
    createdAt: -1
});

module.exports = mongoose.model('ActivityLog', activityLogSchema);
