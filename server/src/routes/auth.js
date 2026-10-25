import express from 'express';
import { createUser, authenticateUser } from '../services/authService.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, confirm_password } = req.body;
    const result = await createUser({ name, email, password, confirm_password });
    return res.status(201).json({
      status: 'success',
      message: 'Account created successfully.',
      data: result
    });
  } catch (err) {
    const status = err.statusCode || 500;
    return res.status(status).json({
      status: 'error',
      message: err.message
    });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await authenticateUser({ email, password });
    return res.json({
      status: 'success',
      message: 'Logged in successfully.',
      data: result
    });
  } catch (err) {
    const status = err.statusCode || 500;
    return res.status(status).json({
      status: 'error',
      message: err.message
    });
  }
});

// POST /api/auth/logout
router.post('/logout', authenticate, (req, res) => {
  return res.json({
    status: 'success',
    message: 'Logged out successfully.'
  });
});

// GET /api/auth/me
router.get('/me', authenticate, (req, res) => {
  return res.json({
    status: 'success',
    data: req.user
  });
});

export default router;
