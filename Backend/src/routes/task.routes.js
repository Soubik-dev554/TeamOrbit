const express = require('express');
const mongoose = require('mongoose');

const Task = require('../models/Task');
const Project = require('../models/Project');
const User = require('../models/User');
const Notification = require('../models/Notification');

const auth = require('../middleware/auth');
const logActivity = require('../utils/logActivity');

const router = express.Router();

router.use(auth);

// Allow only Company Admin and Employee
const checkTaskAccess = (req, res, next) => {
    if (!['admin', 'employee'].includes(req.user.role)) {
        return res.status(403).json({
            message: 'You are not authorized to access tasks.'
        });
    }

    if (!req.user.organization) {
        return res.status(403).json({
            message: 'Your account is not associated with an organization.'
        });
    }

    next();
};

router.use(checkTaskAccess);

// Create notification without interrupting the main task operation.
const createNotification = async ({
    recipient,
    organization,
    actor,
    type,
    message,
    relatedTask
}) => {
    try {
        if (!recipient || !organization || !type || !message) {
            return;
        }

        await Notification.create({
            recipient,
            organization,
            actor,
            type,
            message,
            relatedTask
        });

    } catch (error) {
        console.error('Notification creation failed:', error.message);
    }
};

// GET TASKS
router.get('/', async (req, res, next) => {
    try {
        const filter = {
            organization: req.user.organization
        };

        // Employees see only their assigned tasks.
        if (req.user.role === 'employee') {
            filter.assignee = req.user._id;
        }

        if (req.query.projectId) {
            if (!mongoose.isValidObjectId(req.query.projectId)) {
                return res.status(400).json({
                    message: 'Invalid project id.'
                });
            }

            filter.project = req.query.projectId;
        }

        const validStatuses = ['todo', 'in-progress', 'done'];

        if (req.query.status) {
            if (!validStatuses.includes(req.query.status)) {
                return res.status(400).json({
                    message: 'Invalid task status.'
                });
            }

            filter.status = req.query.status;
        }

        const validPriorities = ['low', 'medium', 'high', 'urgent'];

        if (req.query.priority) {
            if (!validPriorities.includes(req.query.priority)) {
                return res.status(400).json({
                    message: 'Invalid task priority.'
                });
            }

            filter.priority = req.query.priority;
        }

        // Only Admin can filter by employee.
        if (req.user.role === 'admin' && req.query.assignee) {
            if (req.query.assignee === 'me') {
                filter.assignee = req.user._id;
            } else if (mongoose.isValidObjectId(req.query.assignee)) {
                filter.assignee = req.query.assignee;
            } else {
                return res.status(400).json({
                    message: 'Invalid assignee id.'
                });
            }
        }

        if (req.query.search) {
            const searchText = req.query.search.trim();

            if (searchText) {
                const escapedSearch = searchText.replace(
                    /[.*+?^${}()|[\]\\]/g,
                    '\\$&'
                );

                filter.title = {
                    $regex: escapedSearch,
                    $options: 'i'
                };
            }
        }

        const tasks = await Task.find(filter)
            .populate('project', 'name')
            .populate('assignee', 'name email')
            .sort({ updatedAt: -1 });

        res.json({ tasks });

    } catch (error) {
        next(error);
    }
});

// CREATE TASK - ADMIN ONLY
router.post('/projects/:projectId/tasks', async (req, res, next) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                message: 'Only Company Admins can create tasks.'
            });
        }

        if (!mongoose.isValidObjectId(req.params.projectId)) {
            return res.status(400).json({
                message: 'Invalid project id.'
            });
        }

        const project = await Project.findOne({
            _id: req.params.projectId,
            organization: req.user.organization
        });

        if (!project) {
            return res.status(404).json({
                message: 'Project not found.'
            });
        }

        const {
            title,
            description = '',
            status = 'todo',
            priority = 'medium',
            dueDate = null,
            assignee = null
        } = req.body;

        if (typeof title !== 'string' || !title.trim()) {
            return res.status(400).json({
                message: 'Task title is required.'
            });
        }

        if (assignee) {
            if (!mongoose.isValidObjectId(assignee)) {
                return res.status(400).json({
                    message: 'Invalid assignee id.'
                });
            }

            const assignedUser = await User.findOne({
                _id: assignee,
                organization: req.user.organization,
                role: 'employee',
                isActive: true
            });

            if (!assignedUser) {
                return res.status(400).json({
                    message: 'Assignee must be an active employee of this organization.'
                });
            }
        }

        const task = await Task.create({
            title: title.trim(),
            description,
            status,
            priority,
            dueDate: dueDate || null,
            project: project._id,
            assignee: assignee || null,
            createdBy: req.user._id,
            organization: req.user.organization
        });

        await task.populate([
            {
                path: 'assignee',
                select: 'name email'
            },
            {
                path: 'project',
                select: 'name'
            }
        ]);

        // ACTIVITY LOG: TASK CREATED
        await logActivity({
            user: req.user._id,
            organization: req.user.organization,
            action: 'TASK_CREATED',
            description: `Created task: ${task.title}`,
            relatedTask: task._id,
            relatedProject: task.project._id
        });

        // ACTIVITY LOG: TASK ASSIGNED
        if (task.assignee) {
            await logActivity({
                user: req.user._id,
                organization: req.user.organization,
                action: 'TASK_ASSIGNED',
                description: `Assigned task "${task.title}" to ${task.assignee.name}`,
                relatedTask: task._id,
                relatedProject: task.project._id
            });

            // NOTIFICATION: TASK ASSIGNED
            await createNotification({
                recipient: task.assignee._id,
                organization: req.user.organization,
                actor: req.user._id,
                type: 'TASK_ASSIGNED',
                message: `You have been assigned a new task: "${task.title}".`,
                relatedTask: task._id
            });
        }

        res.status(201).json({ task });

    } catch (error) {
        next(error);
    }
});

// UPDATE TASK
router.patch('/:id', async (req, res, next) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({
                message: 'Invalid task id.'
            });
        }

        const filter = {
            _id: req.params.id,
            organization: req.user.organization
        };

        // Employee can access only assigned tasks.
        if (req.user.role === 'employee') {
            filter.assignee = req.user._id;
        }

        const task = await Task.findOne(filter);

        if (!task) {
            return res.status(404).json({
                message: 'Task not found.'
            });
        }

        // Store previous values before updating.
        const previousValues = {
            status: task.status,
            priority: task.priority,
            assignee: task.assignee?.toString() || null,
            title: task.title,
            description: task.description,
            dueDate: task.dueDate?.toISOString() || null
        };

        // EMPLOYEE PERMISSIONS
        if (req.user.role === 'employee') {
            const submittedFields = Object.keys(req.body);

            // Employees can update ONLY status.
            if (
                submittedFields.length !== 1 ||
                submittedFields[0] !== 'status'
            ) {
                return res.status(403).json({
                    message: 'Employees can only update task status.'
                });
            }

            const validStatuses = ['todo', 'in-progress', 'done'];

            if (!validStatuses.includes(req.body.status)) {
                return res.status(400).json({
                    message: 'Invalid task status.'
                });
            }

            task.status = req.body.status;
        }

        // COMPANY ADMIN PERMISSIONS
        if (req.user.role === 'admin') {
            const allowedFields = [
                'title',
                'description',
                'status',
                'priority',
                'dueDate',
                'assignee'
            ];

            const submittedFields = Object.keys(req.body);

            const invalidFields = submittedFields.filter(
                field => !allowedFields.includes(field)
            );

            if (invalidFields.length > 0) {
                return res.status(400).json({
                    message: `Invalid fields: ${invalidFields.join(', ')}`
                });
            }

            if (req.body.title !== undefined) {
                if (
                    typeof req.body.title !== 'string' ||
                    !req.body.title.trim()
                ) {
                    return res.status(400).json({
                        message: 'Task title cannot be empty.'
                    });
                }

                task.title = req.body.title.trim();
            }

            if (req.body.description !== undefined) {
                task.description = req.body.description;
            }

            if (req.body.status !== undefined) {
                const validStatuses = ['todo', 'in-progress', 'done'];

                if (!validStatuses.includes(req.body.status)) {
                    return res.status(400).json({
                        message: 'Invalid task status.'
                    });
                }

                task.status = req.body.status;
            }

            if (req.body.priority !== undefined) {
                const validPriorities = [
                    'low',
                    'medium',
                    'high',
                    'urgent'
                ];

                if (!validPriorities.includes(req.body.priority)) {
                    return res.status(400).json({
                        message: 'Invalid task priority.'
                    });
                }

                task.priority = req.body.priority;
            }

            if (req.body.dueDate !== undefined) {
                if (
                    req.body.dueDate !== null &&
                    Number.isNaN(Date.parse(req.body.dueDate))
                ) {
                    return res.status(400).json({
                        message: 'Invalid due date.'
                    });
                }

                task.dueDate = req.body.dueDate || null;
            }

            if (req.body.assignee !== undefined) {
                if (
                    req.body.assignee === null ||
                    req.body.assignee === ''
                ) {
                    task.assignee = null;
                } else {
                    if (!mongoose.isValidObjectId(req.body.assignee)) {
                        return res.status(400).json({
                            message: 'Invalid assignee id.'
                        });
                    }

                    const assignedUser = await User.findOne({
                        _id: req.body.assignee,
                        organization: req.user.organization,
                        role: 'employee',
                        isActive: true
                    });

                    if (!assignedUser) {
                        return res.status(400).json({
                            message: 'Assignee must be an active employee of this organization.'
                        });
                    }

                    task.assignee = assignedUser._id;
                }
            }
        }

        await task.save();

        const currentAssignee = task.assignee?.toString() || null;

        // ACTIVITY LOG: STATUS CHANGE
        if (previousValues.status !== task.status) {
            await logActivity({
                user: req.user._id,
                organization: req.user.organization,
                action: 'TASK_STATUS_CHANGED',
                description: `Changed "${task.title}" status from ${previousValues.status} to ${task.status}`,
                relatedTask: task._id,
                relatedProject: task.project
            });
        }

        // NOTIFICATION: EMPLOYEE COMPLETED TASK
        if (
            req.user.role === 'employee' &&
            previousValues.status !== 'done' &&
            task.status === 'done'
        ) {
            const admins = await User.find({
                organization: req.user.organization,
                role: 'admin',
                isActive: true
            }).select('_id');

            await Promise.all(
                admins.map(admin =>
                    createNotification({
                        recipient: admin._id,
                        organization: req.user.organization,
                        actor: req.user._id,
                        type: 'TASK_COMPLETED',
                        message: `${req.user.name} completed the task "${task.title}".`,
                        relatedTask: task._id
                    })
                )
            );
        }

        // ACTIVITY LOG: PRIORITY CHANGE
        if (previousValues.priority !== task.priority) {
            await logActivity({
                user: req.user._id,
                organization: req.user.organization,
                action: 'TASK_PRIORITY_CHANGED',
                description: `Changed "${task.title}" priority from ${previousValues.priority} to ${task.priority}`,
                relatedTask: task._id,
                relatedProject: task.project
            });
        }

        // ACTIVITY LOG: ASSIGNMENT CHANGE
        if (previousValues.assignee !== currentAssignee) {
            const assignedUser = currentAssignee
                ? await User.findById(currentAssignee).select('name')
                : null;

            await logActivity({
                user: req.user._id,
                organization: req.user.organization,
                action: 'TASK_ASSIGNED',
                description: assignedUser
                    ? `Assigned "${task.title}" to ${assignedUser.name}`
                    : `Removed assignment from "${task.title}"`,
                relatedTask: task._id,
                relatedProject: task.project
            });
        }

        // ACTIVITY LOG: OTHER TASK UPDATES
        const otherFieldsChanged =
            previousValues.title !== task.title ||
            previousValues.description !== task.description ||
            previousValues.dueDate !== (task.dueDate?.toISOString() || null);

        if (otherFieldsChanged) {
            await logActivity({
                user: req.user._id,
                organization: req.user.organization,
                action: 'TASK_UPDATED',
                description: `Updated task: ${task.title}`,
                relatedTask: task._id,
                relatedProject: task.project
            });
        }

        // NOTIFICATIONS: ADMIN TASK UPDATES
        if (req.user.role === 'admin') {
            const assignmentChanged =
                previousValues.assignee !== currentAssignee;

            const taskDetailsChanged =
                previousValues.title !== task.title ||
                previousValues.description !== task.description ||
                previousValues.dueDate !== (task.dueDate?.toISOString() || null) ||
                previousValues.priority !== task.priority ||
                previousValues.status !== task.status;

            if (assignmentChanged && currentAssignee) {
                await createNotification({
                    recipient: currentAssignee,
                    organization: req.user.organization,
                    actor: req.user._id,
                    type: 'TASK_REASSIGNED',
                    message: `You have been assigned the task "${task.title}".`,
                    relatedTask: task._id
                });
            } else if (!assignmentChanged && taskDetailsChanged && currentAssignee) {
                await createNotification({
                    recipient: currentAssignee,
                    organization: req.user.organization,
                    actor: req.user._id,
                    type: 'TASK_UPDATED',
                    message: `Your assigned task "${task.title}" has been updated.`,
                    relatedTask: task._id
                });
            }
        }

        await task.populate([
            {
                path: 'assignee',
                select: 'name email'
            },
            {
                path: 'project',
                select: 'name'
            }
        ]);

        res.json({ task });

    } catch (error) {
        next(error);
    }
});

// DELETE TASK - ADMIN ONLY
router.delete('/:id', async (req, res, next) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                message: 'Only Company Admins can delete tasks.'
            });
        }

        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({
                message: 'Invalid task id.'
            });
        }

        // Find task before deleting so we can record its details.
        const task = await Task.findOne({
            _id: req.params.id,
            organization: req.user.organization
        });

        if (!task) {
            return res.status(404).json({
                message: 'Task not found.'
            });
        }

        // ACTIVITY LOG: TASK DELETED
        await logActivity({
            user: req.user._id,
            organization: req.user.organization,
            action: 'TASK_DELETED',
            description: `Deleted task: ${task.title}`,
            relatedTask: task._id,
            relatedProject: task.project
        });

        await task.deleteOne();

        res.json({
            message: 'Task deleted successfully.'
        });

    } catch (error) {
        next(error);
    }
});

module.exports = router;