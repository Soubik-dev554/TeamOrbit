const jwt = require('jsonwebtoken');
const User = require('../models/User');

const requireAuth = async (req, res, next) => {
    try {
        let token = req.cookies?.token;

        if (!token) {
            const authHeader = req.headers.authorization;

            if (authHeader) {
                token = authHeader.replace(/^Bearer\s+/i, '');
            }
        }

        if (!token) {
            return res.status(401).json({
                message: 'Authentication required.'
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await User.findById(decoded.id);

        if (!user) {
            return res.status(401).json({
                message: 'Account no longer exists.'
            });
        }

        if (!user.isActive) {
            return res.status(403).json({
                message: 'Your account has been deactivated.'
            });
        }

        req.user = user;
        next();

    } catch (error) {
        return res.status(401).json({
            message: 'Session expired. Please log in again.'
        });
    }
};

// Only company Admin
const adminOnly = (req, res, next) => {
    if (req.user?.role !== 'admin') {
        return res.status(403).json({
            message: 'Company Admin permission required.'
        });
    }

    next();
};

// Only TeamOrbit Super Admin
const superAdminOnly = (req, res, next) => {
    if (req.user?.role !== 'superadmin') {
        return res.status(403).json({
            message: 'Super Admin permission required.'
        });
    }

    next();
};

// Company Admin or Super Admin
const adminOrSuperAdmin = (req, res, next) => {
    if (!['admin', 'superadmin'].includes(req.user?.role)) {
        return res.status(403).json({
            message: 'Administrator permission required.'
        });
    }

    next();
};

module.exports = requireAuth;
module.exports.adminOnly = adminOnly;
module.exports.superAdminOnly = superAdminOnly;
module.exports.adminOrSuperAdmin = adminOrSuperAdmin;