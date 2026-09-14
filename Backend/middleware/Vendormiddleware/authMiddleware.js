const jwt = require('jsonwebtoken');
const { env } = require('../../src/env');

const authMiddleware = (req, res, next) => {
    try {
        // Get token from cookie (primary for browser clients) OR Authorization header
        const cookieToken = req.cookies?.accessToken;
        const authHeader = req.header('Authorization');
        const bearerToken = authHeader && authHeader.startsWith('Bearer ')
            ? authHeader.slice(7)
            : null;
        const token = cookieToken || bearerToken;

        if (!token) {
            return res.status(401).json({
                success: false,
                error: 'Access denied. No token provided.'
            });
        }

        // Verify token
        const decoded = jwt.verify(token, env.JWT_SECRET);

        // Add vendor ID to request
        req.vendorId = decoded.vendorId;
        req.user = { userId: decoded.sub, role: decoded.role || 'vendor' };

        next();
    } catch (error) {
        console.error('Auth middleware error:', error);

        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                error: 'Invalid token.'
            });
        }

        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                error: 'Token expired.'
            });
        }

        return res.status(401).json({
            success: false,
            error: 'Authentication failed.'
        });
    }
};

module.exports = authMiddleware;
