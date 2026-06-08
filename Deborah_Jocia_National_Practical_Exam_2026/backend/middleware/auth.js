const jwt = require('jsonwebtoken');

// Role hierarchy: admin > staff > viewer
const ROLE_HIERARCHY = {
  admin: 3,
  staff: 2,
  viewer: 1
};

function requireAuth(req, res, next) {
  // Check session first (for web app)
  if (req.session && req.session.user) {
    req.user = req.session.user;
    return next();
  }

  // Fall back to JWT (for API clients)
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = {
        username: decoded.username,
        role: decoded.role
      };
      return next();
    } catch (err) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
  }

  return res.status(401).json({ error: 'Authentication required. Please login.' });
}

function requireRole(minimumRole) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const userLevel = ROLE_HIERARCHY[req.user.role] || 0;
    const requiredLevel = ROLE_HIERARCHY[minimumRole] || 0;

    if (userLevel < requiredLevel) {
      return res.status(403).json({
        error: `Access denied. Requires ${minimumRole} role or higher.`
      });
    }

    next();
  };
}

function requireAdmin(req, res, next) {
  return requireRole('admin')(req, res, next);
}

module.exports = { requireAuth, requireRole, requireAdmin };
