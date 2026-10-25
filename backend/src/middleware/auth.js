import jwt from 'jsonwebtoken';
import { getUserById } from '../services/authService.js';

const JWT_SECRET = process.env.JWT_SECRET?.trim() || 'marketpulse_dev_jwt_secret_key_change_in_production';

export async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication credentials are required.'
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    const user = await getUserById(decoded.id);
    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'User associated with this token no longer exists.'
      });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({
      status: 'error',
      message: 'Invalid or expired session token. Please sign in again.'
    });
  }
}

export async function optionalAuthenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await getUserById(decoded.id);
      req.user = user || null;
    } else {
      req.user = null;
    }
  } catch (err) {
    req.user = null;
  }
  next();
}
