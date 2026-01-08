const jwt = require('jsonwebtoken');
const User = require('../models/UserModel');

/**
 * Middleware to protect API routes with JWT authentication
 * Verifies JWT token and attaches user to request object
 */
const protect = async (req, res, next) => {
    try {
        let token;

        // Check if token exists in Authorization header
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        // If no token found, return unauthorized
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'You are not logged in. Please log in to get access.'
            });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Check if user still exists
        const currentUser = await User.findByPk(decoded.id);

        if (!currentUser) {
            return res.status(401).json({
                success: false,
                message: 'The user belonging to this token no longer exists.'
            });
        }

        // Grant access to protected route
        req.user = currentUser;
        next();
    } catch (error) {
        console.error('JWT verification error:', error);
        
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Invalid token. Please log in again.'
            });
        }
        
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Your token has expired. Please log in again.'
            });
        }

        return res.status(500).json({
            success: false,
            message: 'Authentication failed.'
        });
    }
};

/**
 * Optional authentication middleware
 * Attempts to authenticate user but doesn't fail if no token provided
 * Useful for endpoints that work for both authenticated and non-authenticated users
 */
const optionalAuth = async (req, res, next) => {
    try {
        let token;

        // Check if token exists in Authorization header
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        // If no token found, continue without authentication
        if (!token) {
            req.user = null;
            return next();
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Check if user still exists
        const currentUser = await User.findByPk(decoded.id);

        if (!currentUser) {
            req.user = null;
            return next();
        }

        // Attach user to request
        req.user = currentUser;
        next();
    } catch (error) {
        // If any error occurs, just continue without authentication
        console.error('Optional auth error:', error);
        req.user = null;
        next();
    }
};

module.exports = { protect, optionalAuth };

