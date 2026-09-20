import dotenv from 'dotenv';
dotenv.config();

const ADMIN_SECRET_KEY = process.env.ADMIN_SECRET_KEY || 'moderationgate-admin-secret-2026';
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'AdminGate@2026';

/**
 * Middleware to verify admin authorization header.
 */
export function requireAdminAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const customKey = req.headers['x-admin-key'];

  let token = customKey;
  if (!token && authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  if (token && token === ADMIN_SECRET_KEY) {
    req.isAdmin = true;
    return next();
  }

  return res.status(401).json({
    error: 'Unauthorized',
    message: 'Admin authorization required to access this endpoint.'
  });
}

export { ADMIN_USERNAME, ADMIN_PASSWORD, ADMIN_SECRET_KEY };
