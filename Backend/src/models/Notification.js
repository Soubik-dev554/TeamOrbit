const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
    {
        recipient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true
        },

        organization: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Organization',
            required: true,
            index: true
        },

        actor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null
        },

        type: {
            type: String,
            required: true,
            enum: [
                'TASK_ASSIGNED',
                'TASK_UPDATED',
                'TASK_REASSIGNED',
                'TASK_COMPLETED',
                'COMMENT_ADDED'
            ]
        },

        message: {
            type: String,
            required: true,
            trim: true,
            maxlength: 300
        },

        relatedTask: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Task',
            default: null
        },

        isRead: {
            type: Boolean,
            default: false,
            index: true
        }
    },
    {
        timestamps: true
    }
);

notificationSchema.index({
    recipient: 1,
    organization: 1,
    createdAt: -1
});

module.exports = mongoose.model('Notification', notificationSchema);