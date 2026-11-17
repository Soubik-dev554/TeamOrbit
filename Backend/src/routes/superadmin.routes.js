const express = require('express');
const bcrypt = require('bcryptjs');

const Organization = require('../models/Organization');
const User = require('../models/User');
const Project = require('../models/Project');
const Task = require('../models/Task');

const auth = require('../middleware/auth');
const { superAdminOnly } = require('../middleware/auth');

const router = express.Router();

router.use(auth, superAdminOnly);

// ========================================
// CREATE ADMIN ACCOUNT
// ========================================

router.post('/create-admin', async (req, res, next) => {
    try {
        const { name, email, password, organizationId } = req.body;

        // Validate required fields
        if (
            !name?.trim() ||
            !email?.trim() ||
            !password ||
            !organizationId
        ) {
            return res.status(400).json({
                message: 'All fields are required.'
            });
        }

        // Validate password
        if (password.length < 8) {
            return res.status(400).json({
                message: 'Password must contain at least 8 characters.'
            });
        }

        // Validate organization ID
        if (!/^[a-f\d]{24}$/i.test(organizationId)) {
            return res.status(400).json({
                message: 'Invalid organization ID.'
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        // Check existing email
        const existingUser = await User.findOne({
            email: normalizedEmail
        });

        if (existingUser) {
            return res.status(409).json({
                message: 'This email is already registered.'
            });
        }

        // Check organization
        const organization = await Organization.findById(
            organizationId
        );

        if (!organization) {
            return res.status(404).json({
                message: 'Organization not found.'
            });
        }

        if (!organization.isActive) {
            return res.status(403).json({
                message: 'Cannot create an Admin for a suspended organization.'
            });
        }

        // Hash password using existing authentication method
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create Admin
        const admin = await User.create({
            name: name.trim(),
            email: normalizedEmail,
            password: hashedPassword,
            role: 'admin',
            isActive: true,
            organization: organization._id
        });

        return res.status(201).json({
            message: 'Admin account created successfully.',
            admin: {
                id: admin._id,
                name: admin.name,
                email: admin.email,
                role: admin.role,
                isActive: admin.isActive,
                organization: {
                    id: organization._id,
                    name: organization.name
                },
                createdAt: admin.createdAt
            }
        });

    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                message: 'This email is already registered.'
            });
        }

        next(error);
    }
});


// ========================================
// SUPER ADMIN STATISTICS
// ========================================

router.get('/stats', async (req, res, next) => {
    try {
        const [
            totalOrganizations,
            activeOrganizations,
            suspendedOrganizations,
            totalUsers,
            totalAdmins,
            totalEmployees,
            totalProjects,
            totalTasks
        ] = await Promise.all([
            Organization.countDocuments(),
            Organization.countDocuments({ isActive: true }),
            Organization.countDocuments({ isActive: false }),
            User.countDocuments(),
            User.countDocuments({ role: 'admin' }),
            User.countDocuments({ role: 'employee' }),
            Project.countDocuments(),
            Task.countDocuments()
        ]);

        res.json({
            stats: {
                totalOrganizations,
                activeOrganizations,
                suspendedOrganizations,
                totalUsers,
                totalAdmins,
                totalEmployees,
                totalProjects,
                totalTasks
            }
        });

    } catch (error) {
        next(error);
    }
});


// ========================================
// LIST ALL ORGANIZATIONS
// ========================================

router.get('/organizations', async (req, res, next) => {
    try {
        const organizations = await Organization.find()
            .populate('owner', 'name email isActive')
            .sort({ createdAt: -1 });

        res.json({ organizations });

    } catch (error) {
        next(error);
    }
});


// ========================================
// LIST ALL USERS
// ========================================

router.get('/users', async (req, res, next) => {
    try {
        const users = await User.find()
            .select('name email role isActive organization createdAt')
            .populate('organization', 'name slug')
            .sort({ createdAt: -1 });

        res.json({ users });

    } catch (error) {
        next(error);
    }
});

// ========================================
// LIST ALL COMPANY ADMINS
// ========================================

router.get('/admins', async (req, res, next) => {
    try {
        const admins = await User.find({ role: 'admin' })
            .select('name email role isActive organization createdAt')
            .populate('organization', 'name slug isActive')
            .sort({ createdAt: -1 });

        res.json({ admins });

    } catch (error) {
        next(error);
    }
});

// ========================================
// UPDATE COMPANY ADMIN STATUS
// ========================================

router.patch('/admins/:id/status', async (req, res, next) => {
    try {
        const { id } = req.params;
        const { isActive } = req.body;

        if (!/^[a-f\d]{24}$/i.test(id)) {
            return res.status(400).json({
                message: 'Invalid Admin ID.'
            });
        }

        if (typeof isActive !== 'boolean') {
            return res.status(400).json({
                message: 'A valid account status is required.'
            });
        }

        const admin = await User.findOne({
            _id: id,
            role: 'admin'
        });

        if (!admin) {
            return res.status(404).json({
                message: 'Company Admin not found.'
            });
        }

        // Prevent removing the last active Admin of an active organization.
        if (!isActive && admin.isActive) {
            const organization = await Organization.findById(
                admin.organization
            );

            if (organization?.isActive) {
                const activeAdminCount = await User.countDocuments({
                    organization: admin.organization,
                    role: 'admin',
                    isActive: true
                });

                if (activeAdminCount <= 1) {
                    return res.status(400).json({
                        message: 'Cannot suspend the last active Admin of an organization.'
                    });
                }
            }
        }

        admin.isActive = isActive;
        await admin.save();

        res.json({
            message: `Admin account ${isActive ? 'activated' : 'suspended'} successfully.`,
            admin: {
                id: admin._id,
                name: admin.name,
                email: admin.email,
                isActive: admin.isActive
            }
        });

    } catch (error) {
        next(error);
    }
});

// ========================================
// LIST ALL COMPANY EMPLOYEES
// ========================================

router.get('/employees', async (req, res, next) => {
    try {
        const employees = await User.find({ role: 'employee' })
            .select('name email role isActive organization createdAt')
            .populate('organization', 'name slug isActive')
            .sort({ createdAt: -1 });

        res.json({ employees });

    } catch (error) {
        next(error);
    }
});


// ========================================
// UPDATE EMPLOYEE ACCOUNT STATUS
// ========================================

router.patch('/employees/:id/status', async (req, res, next) => {
    try {
        const { id } = req.params;
        const { isActive } = req.body;

        // Validate employee ID
        if (!/^[a-f\d]{24}$/i.test(id)) {
            return res.status(400).json({
                message: 'Invalid Employee ID.'
            });
        }

        // Validate account status
        if (typeof isActive !== 'boolean') {
            return res.status(400).json({
                message: 'A valid account status is required.'
            });
        }

        // Find only an employee account
        const employee = await User.findOne({
            _id: id,
            role: 'employee'
        });

        if (!employee) {
            return res.status(404).json({
                message: 'Employee not found.'
            });
        }

        // Do not activate employees belonging to suspended organizations
        if (isActive) {
            const organization = await Organization.findById(
                employee.organization
            );

            if (!organization || !organization.isActive) {
                return res.status(400).json({
                    message: 'Cannot activate an employee from a suspended or unavailable organization.'
                });
            }
        }

        employee.isActive = isActive;
        await employee.save();

        res.json({
            message: `Employee account ${isActive ? 'activated' : 'suspended'} successfully.`,
            employee: {
                id: employee._id,
                name: employee.name,
                email: employee.email,
                isActive: employee.isActive
            }
        });

    } catch (error) {
        next(error);
    }
});
module.exports = router;