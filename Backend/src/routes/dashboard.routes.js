const express = require('express');

const auth = require('../middleware/auth');
const Project = require('../models/Project');
const Task = require('../models/Task');
const User = require('../models/User');

const router = express.Router();

// ============================================
// EXISTING DASHBOARD API
// ============================================

router.get('/', auth, async (req, res, next) => {
    try {
        const isCompanyAdmin = req.user.role === 'admin';

        if (isCompanyAdmin && !req.user.organization) {
            return res.status(403).json({
                message: 'Your account is not associated with an organization.'
            });
        }

        const projectFilter = isCompanyAdmin
            ? { organization: req.user.organization }
            : { owner: req.user._id };

        const projects = await Project.find(projectFilter)
            .select('_id name status updatedAt')
            .sort({ updatedAt: -1 });

        const projectIds = projects.map((project) => project._id);

        const taskFilter = {
            project: { $in: projectIds },
            ...(isCompanyAdmin
                ? { organization: req.user.organization }
                : {})
        };

        const [
            totalTasks,
            todo,
            inProgress,
            done,
            recentTasks
        ] = await Promise.all([
            Task.countDocuments(taskFilter),

            Task.countDocuments({
                ...taskFilter,
                status: 'todo'
            }),

            Task.countDocuments({
                ...taskFilter,
                status: 'in-progress'
            }),

            Task.countDocuments({
                ...taskFilter,
                status: 'done'
            }),

            Task.find(taskFilter)
                .populate('project', 'name')
                .populate('assignee', 'name')
                .sort({ updatedAt: -1 })
                .limit(6)
        ]);

        res.json({
            summary: {
                totalProjects: projects.length,
                totalTasks,
                todo,
                inProgress,
                done
            },

            projects: projects.slice(0, 5),

            recentTasks
        });

    } catch (error) {
        next(error);
    }
});


// ============================================
// EMPLOYEE PERFORMANCE ANALYTICS API
// ============================================

router.get('/employee-performance', auth, async (req, res, next) => {
    try {
        // Only Company Admin can access this API.
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                message: 'Only Company Admins can access employee analytics.'
            });
        }

        if (!req.user.organization) {
            return res.status(403).json({
                message: 'Your account is not associated with an organization.'
            });
        }

        const organizationId = req.user.organization;
        const currentDate = new Date();

        // Get employees belonging to this organization.
        const employees = await User.find({
            organization: organizationId,
            role: 'employee'
        }).select('_id name email isActive');

        const employeeIds = employees.map((employee) => employee._id);

        // Get task performance for each employee.
        const performanceData = employeeIds.length
            ? await Task.aggregate([
                {
                    $match: {
                        organization: organizationId,
                        assignee: { $in: employeeIds }
                    }
                },
                {
                    $group: {
                        _id: '$assignee',

                        totalTasks: {
                            $sum: 1
                        },

                        completedTasks: {
                            $sum: {
                                $cond: [
                                    { $eq: ['$status', 'done'] },
                                    1,
                                    0
                                ]
                            }
                        },

                        pendingTasks: {
                            $sum: {
                                $cond: [
                                    {
                                        $in: [
                                            '$status',
                                            ['todo', 'in-progress']
                                        ]
                                    },
                                    1,
                                    0
                                ]
                            }
                        },

                        overdueTasks: {
                            $sum: {
                                $cond: [
                                    {
                                        $and: [
                                            { $ne: ['$status', 'done'] },
                                            { $ne: ['$dueDate', null] },
                                            { $lt: ['$dueDate', currentDate] }
                                        ]
                                    },
                                    1,
                                    0
                                ]
                            }
                        }
                    }
                }
            ])
            : [];

        // Map analytics data to employees.
        const performanceMap = new Map(
            performanceData.map((item) => [
                item._id.toString(),
                item
            ])
        );

        const employeePerformance = employees.map((employee) => {
            const stats = performanceMap.get(employee._id.toString());

            const totalTasks = stats?.totalTasks || 0;
            const completedTasks = stats?.completedTasks || 0;

            const completionPercentage = totalTasks > 0
                ? Math.round((completedTasks / totalTasks) * 100)
                : 0;

            return {
                employee: {
                    _id: employee._id,
                    name: employee.name,
                    email: employee.email,
                    isActive: employee.isActive
                },

                totalTasks,
                completedTasks,
                pendingTasks: stats?.pendingTasks || 0,
                overdueTasks: stats?.overdueTasks || 0,
                completionPercentage
            };
        });

        // Overall organization performance.
        const summary = employeePerformance.reduce(
            (result, employee) => {
                result.totalEmployees += 1;
                result.totalTasks += employee.totalTasks;
                result.completedTasks += employee.completedTasks;
                result.pendingTasks += employee.pendingTasks;
                result.overdueTasks += employee.overdueTasks;

                return result;
            },
            {
                totalEmployees: employees.length,
                totalTasks: 0,
                completedTasks: 0,
                pendingTasks: 0,
                overdueTasks: 0
            }
        );

        summary.completionPercentage = summary.totalTasks > 0
            ? Math.round(
                (summary.completedTasks / summary.totalTasks) * 100
            )
            : 0;

        res.status(200).json({
            success: true,
            summary,
            employeePerformance
        });

    } catch (error) {
        next(error);
    }
});

module.exports = router;