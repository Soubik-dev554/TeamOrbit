const express = require('express');
const mongoose = require('mongoose');

const Notification = require('../models/Notification');
const auth = require('../middleware/auth');

const router = express.Router();

router.use(auth);

// Get notifications for logged-in user
router.get('/', async (req, res, next) => {
    try {
        const page = Math.max(1, parseInt(req.query.page, 10) || 1);
        const limit = Math.min(
            50,
            Math.max(1, parseInt(req.query.limit, 10) || 20)
        );

        const filter = {
            recipient: req.user._id,
            organization: req.user.organization
        };

        const [notifications, total, unreadCount] = await Promise.all([
            Notification.find(filter)
                .populate('actor', 'name email')
                .populate('relatedTask', 'title status')
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .lean(),

            Notification.countDocuments(filter),

            Notification.countDocuments({
                ...filter,
                isRead: false
            })
        ]);

        res.json({
            success: true,
            notifications,
            unreadCount,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        next(error);
    }
});

// Get unread notification count
router.get('/unread-count', async (req, res, next) => {
    try {
        const unreadCount = await Notification.countDocuments({
            recipient: req.user._id,
            organization: req.user.organization,
            isRead: false
        });

        res.json({
            success: true,
            unreadCount
        });

    } catch (error) {
        next(error);
    }
});

// Mark a notification as read
router.patch('/:id/read', async (req, res, next) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({
                message: 'Invalid notification ID.'
            });
        }

        const notification = await Notification.findOneAndUpdate(
            {
                _id: req.params.id,
                recipient: req.user._id,
                organization: req.user.organization
            },
            {
                isRead: true
            },
            {
                new: true
            }
        );

        if (!notification) {
            return res.status(404).json({
                message: 'Notification not found.'
            });
        }

        res.json({
            success: true,
            notification
        });

    } catch (error) {
        next(error);
    }
});

// Mark all notifications as read
router.patch('/read-all', async (req, res, next) => {
    try {
        const result = await Notification.updateMany(
            {
                recipient: req.user._id,
                organization: req.user.organization,
                isRead: false
            },
            {
                isRead: true
            }
        );

        res.json({
            success: true,
            message: 'All notifications marked as read.',
            modifiedCount: result.modifiedCount
        });

    } catch (error) {
        next(error);
    }
});

// Delete a notification
router.delete('/:id', async (req, res, next) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({
                message: 'Invalid notification ID.'
            });
        }

        const notification = await Notification.findOneAndDelete({
            _id: req.params.id,
            recipient: req.user._id,
            organization: req.user.organization
        });

        if (!notification) {
            return res.status(404).json({
                message: 'Notification not found.'
            });
        }

        res.json({
            success: true,
            message: 'Notification deleted successfully.'
        });

    } catch (error) {
        next(error);
    }
});

module.exports = router;