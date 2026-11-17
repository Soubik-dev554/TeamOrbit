const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
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
            unique: true,
            lowercase: true,
            trim: true
        },

        password: {
            type: String,
            required: true,
            minlength: 8,
            select: false
        },

        // Email verification
        isEmailVerified: {
            type: Boolean,
            default: true
        },

        emailOTP: {
            type: String,
            default: null,
            select: false
        },

        emailOTPExpires: {
            type: Date,
            default: null,
            select: false
        },

        emailOTPAttempts: {
            type: Number,
            default: 0,
            select: false
        },

        emailOTPResendAt: {
            type: Date,
            default: null,
            select: false
        },

        // Password reset
        resetPasswordToken: {
            type: String,
            default: null,
            select: false
        },

        resetPasswordExpires: {
            type: Date,
            default: null,
            select: false
        },

        role: {
            type: String,
            enum: ['superadmin', 'admin', 'employee'],
            default: 'employee'
        },

        isActive: {
            type: Boolean,
            default: true
        },

        avatar: {
            type: String,
            default: ''
        },

        organization: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Organization',
            default: null
        }
    },
    {
        timestamps: true
    }
);

const User = mongoose.model('User', userSchema);

module.exports = User;