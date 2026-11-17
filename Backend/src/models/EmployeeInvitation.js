const mongoose = require('mongoose');

const employeeInvitationSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            maxlength: 80
        },

        email: {
            type: String,
            required: true,
            lowercase: true,
            trim: true
        },

        organization: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Organization',
            required: true
        },

        invitedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },

        tokenHash: {
            type: String,
            required: true,
            select: false
        },

        otpHash: {
            type: String,
            default: null,
            select: false
        },

        otpExpires: {
            type: Date,
            default: null,
            select: false
        },

        otpAttempts: {
            type: Number,
            default: 0,
            select: false
        },

        otpResendAt: {
            type: Date,
            default: null,
            select: false
        },

        expiresAt: {
            type: Date,
            required: true
        },

        acceptedAt: {
            type: Date,
            default: null
        },

        status: {
            type: String,
            enum: ['pending', 'accepted', 'expired', 'cancelled'],
            default: 'pending'
        }
    },
    {
        timestamps: true
    }
);

employeeInvitationSchema.index({
    organization: 1,
    email: 1,
    status: 1
});

employeeInvitationSchema.index(
    { expiresAt: 1 },
    { expireAfterSeconds: 0 }
);

module.exports = mongoose.model(
    'EmployeeInvitation',
    employeeInvitationSchema
);