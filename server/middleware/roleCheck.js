const db = require('../db');

const requireRole = (allowedRoles) => {
    return async (req, res, next) => {
        try {
            const userId = req.userId; // Set by verifyToken
            if (!userId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            const result = await db.query('SELECT role FROM users WHERE id = $1', [userId]);
            const user = result.rows[0];

            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }

            // Ensure allowedRoles is an array
            const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

            if (!roles.includes(user.role)) {
                return res.status(403).json({ error: 'Access denied: Insufficient privileges' });
            }

            // Pass role to next handler if needed
            req.userRole = user.role;
            next();
        } catch (err) {
            console.error('Role Check Error:', err);
            res.status(500).json({ error: 'Server error during role verification' });
        }
    };
};

module.exports = requireRole;
