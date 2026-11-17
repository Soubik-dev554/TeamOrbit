const express = require('express');
const mongoose = require('mongoose');

const Comment = require('../models/Comment');
const Task = require('../models/Task');
const Notification = require('../models/Notification');
const User = require('../models/User');

const auth = require('../middleware/auth');

const router = express.Router();

router.use(auth);

// Allow only Company Admin and Employee
router.use((req, res, next) => {
    if (!['admin', 'employee'].includes(req.user.role)) {
        return res.status(403).json({
            message: 'You are not authorized to access comments.'
        });
    }

    if (!req.user.organization) {
        return res.status(403).json({
            message: 'Your account is not associated with an organization.'
        });
    }

    next();
});


// HELPER: CHECK TASK ACCESS
async function getAccessibleTask(taskId, user) {
    if (!mongoose.isValidObjectId(taskId)) {
        return null;
    }

    const filter = {
        _id: taskId,
        organization: user.organization
    };

    // Employees can access only assigned tasks
    if (user.role === 'employee') {
        filter.assignee = user._id;
    }

    return Task.findOne(filter);
}


// HELPER: SEND COMMENT NOTIFICATIONS
async function notifyTaskComment({ task, actor }) {
    try {
        let recipients = [];

        // Admin comments: notify assigned employee
        if (actor.role === 'admin' && task.assignee) {
            recipients = [task.assignee];
        }

        // Employee comments: notify active admins
        if (actor.role === 'employee') {
            const admins = await User.find({
                organization: actor.organization,
                role: 'admin',
                isActive: true,
                _id: { $ne: actor._id }
            }).select('_id');

            recipients = admins.map(admin => admin._id);
        }

        // Remove duplicates and exclude the actor
        const uniqueRecipients = [
            ...new Set(
                recipients
                    .map(id => id.toString())
                    .filter(id => id !== actor._id.toString())
            )
        ];

        if (!uniqueRecipients.length) return;

        const message = actor.role === 'admin'
            ? `${actor.name} commented on your task: "${task.title}".`
            : `${actor.name} commented on task: "${task.title}".`;

        await Notification.insertMany(
            uniqueRecipients.map(recipient => ({
                recipient,
                organization: actor.organization,
                actor: actor._id,
                type: 'COMMENT_ADDED',
                message,
                relatedTask: task._id
            }))
        );

    } catch (error) {
        // Notification failure must not interrupt comment creation
        console.error('Comment notification failed:', error.message);
    }
}


// GET COMMENTS FOR A TASK
router.get('/:taskId', async (req, res, next) => {
    try {
        const task = await getAccessibleTask(
            req.params.taskId,
            req.user
        );

        if (!task) {
            return res.status(404).json({
                message: 'Task not found.'
            });
        }

        const comments = await Comment.find({
            task: task._id,
            organization: req.user.organization
        })
            .populate('author', 'name email role')
            .sort({ createdAt: 1 });

        res.json({
            success: true,
            comments
        });

    } catch (error) {
        next(error);
    }
});


// CREATE COMMENT
router.post('/:taskId', async (req, res, next) => {
    try {
        const task = await getAccessibleTask(
            req.params.taskId,
            req.user
        );

        if (!task) {
            return res.status(404).json({
                message: 'Task not found.'
            });
        }

        const { content } = req.body;

        if (typeof content !== 'string' || !content.trim()) {
            return res.status(400).json({
                message: 'Comment cannot be empty.'
            });
        }

        if (content.trim().length > 2000) {
            return res.status(400).json({
                message: 'Comment cannot exceed 2000 characters.'
            });
        }

        const comment = await Comment.create({
            task: task._id,
            organization: req.user.organization,
            author: req.user._id,
            content: content.trim()
        });

        await comment.populate('author', 'name email role');

        // SEND COMMENT NOTIFICATION
        await notifyTaskComment({
            task,
            actor: req.user
        });

        res.status(201).json({
            success: true,
            message: 'Comment added successfully.',
            comment
        });

    } catch (error) {
        next(error);
    }
});


// EDIT OWN COMMENT
router.put('/:commentId', async (req, res, next) => {
    try {
        if (!mongoose.isValidObjectId(req.params.commentId)) {
            return res.status(400).json({
                message: 'Invalid comment id.'
            });
        }

        const { content } = req.body;

        if (typeof content !== 'string' || !content.trim()) {
            return res.status(400).json({
                message: 'Comment cannot be empty.'
            });
        }

        if (content.trim().length > 2000) {
            return res.status(400).json({
                message: 'Comment cannot exceed 2000 characters.'
            });
        }

        const comment = await Comment.findOne({
            _id: req.params.commentId,
            organization: req.user.organization,
            author: req.user._id
        });

        if (!comment) {
            return res.status(404).json({
                message: 'Comment not found or you cannot edit it.'
            });
        }

        const task = await getAccessibleTask(
            comment.task,
            req.user
        );

        if (!task) {
            return res.status(404).json({
                message: 'Task not found.'
            });
        }

        comment.content = content.trim();

        await comment.save();
        await comment.populate('author', 'name email role');

        res.json({
            success: true,
            message: 'Comment updated successfully.',
            comment
        });

    } catch (error) {
        next(error);
    }
});


// DELETE COMMENT
router.delete('/:commentId', async (req, res, next) => {
    try {
        if (!mongoose.isValidObjectId(req.params.commentId)) {
            return res.status(400).json({
                message: 'Invalid comment id.'
            });
        }

        const filter = {
            _id: req.params.commentId,
            organization: req.user.organization
        };

        // Employees can delete only their own comments
        if (req.user.role === 'employee') {
            filter.author = req.user._id;
        }

        const comment = await Comment.findOne(filter);

        if (!comment) {
            return res.status(404).json({
                message: 'Comment not found.'
            });
        }

        // Verify related task belongs to organization
        const task = await Task.findOne({
            _id: comment.task,
            organization: req.user.organization
        });

        if (!task) {
            return res.status(404).json({
                message: 'Task not found.'
            });
        }

        // Employees can access only assigned tasks
        if (
            req.user.role === 'employee' &&
            task.assignee?.toString() !== req.user._id.toString()
        ) {
            return res.status(403).json({
                message: 'You cannot delete this comment.'
            });
        }

        await comment.deleteOne();

        res.json({
            success: true,
            message: 'Comment deleted successfully.'
        });

    } catch (error) {
        next(error);
    }
});


module.exports = router;
