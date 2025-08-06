const jwt = require('jsonwebtoken');
const { userDB } = require('../utils/dbManager');

const JWT_SECRET = process.env.JWT_SECRET || 'syntax_dropshipping_secret_key_2024';

// Middleware to authenticate JWT tokens
async function authenticateToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ message: 'Missing authentication token' });
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Check if user exists and is active
    const user = await userDB.findById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }
    
    if (!user.is_active) {
      return res.status(401).json({ message: 'Account is disabled' });
    }

    // Add user info to request
    req.userId = decoded.userId;
    req.userEmail = decoded.email;
    req.user = user;
    
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid authentication token' });
    } else if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Authentication token expired' });
    } else {
      console.error('Authentication middleware error:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }
}

// Middleware to check if user is admin
function requireAdmin(req, res, next) {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Admin privileges required' });
  }
}

// Optional authentication (doesn't fail if no token)
async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.replace('Bearer ', '');

    if (token) {
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await userDB.findById(decoded.userId);
      
      if (user && user.is_active) {
        req.userId = decoded.userId;
        req.userEmail = decoded.email;
        req.user = user;
      }
    }
    
    next();
  } catch (error) {
    // Continue without auth if token is invalid
    next();
  }
}

module.exports = {
  authenticateToken,
  requireAdmin,
  optionalAuth
};