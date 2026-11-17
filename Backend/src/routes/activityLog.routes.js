const express = require('express');
const router = express.Router();

const ActivityLog = require('../models/ActivityLog');
const auth = require('../middleware/auth');
const { adminOnly } = require('../middleware/auth');

// GET /api/activity-logs
// Only Company Admin can view their organization's activity logs.
router.get('/', auth, adminOnly, async (req, res) => {
    try {
        const organizationId = req.user.organization;

        if (!organizationId) {
            return res.status(400).json({
                message: 'Organization not found for this account.'
            });
        }

        const page = Math.max(1, parseInt(req.query.page, 10) || 1);
        const limit = Math.min(
            100,
            Math.max(1, parseInt(req.query.limit, 10) || 20)
        );

        const skip = (page - 1) * limit;

        const filter = {
            organization: organizationId
        };

        // Optional action filter
        if (req.query.action) {
            filter.action = req.query.action;
        }

        // Optional text search
        if (req.query.search?.trim()) {
            filter.description = {
                $regex: req.query.search.trim(),
                $options: 'i'
            };
        }

        const [logs, total] = await Promise.all([
            ActivityLog.find(filter)
                .populate('user', 'name email role')
                .populate('relatedTask', 'title')
                .populate('relatedProject', 'name')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),

            ActivityLog.countDocuments(filter)
        ]);

        return res.status(200).json({
            success: true,
            logs,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('Activity logs error:', error);

        return res.status(500).json({
            message: 'Failed to fetch activity logs.'
        });
    }
});

module.exports = router;