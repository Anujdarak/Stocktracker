import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { isUsingMemoryFallback, getMemoryDB } from '../config/db.js';
import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET?.trim() || 'marketpulse_dev_jwt_secret_key_change_in_production';

function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export async function createUser({ name, email, password, confirm_password }) {
  if (!name || !name.trim()) {
    const err = new Error('Name is required.');
    err.statusCode = 400;
    throw err;
  }

  if (!email || !email.trim()) {
    const err = new Error('Email address is required.');
    err.statusCode = 400;
    throw err;
  }

  const normalizedEmail = email.trim().toLowerCase();
  if (!isValidEmail(normalizedEmail)) {
    const err = new Error('Invalid email format.');
    err.statusCode = 400;
    throw err;
  }

  if (!password || password.length < 6) {
    const err = new Error('Password must be at least 6 characters long.');
    err.statusCode = 400;
    throw err;
  }

  if (password !== confirm_password) {
    const err = new Error('Passwords do not match.');
    err.statusCode = 400;
    throw err;
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  if (isUsingMemoryFallback()) {
    const memDb = getMemoryDB();
    for (const u of memDb.users.values()) {
      if (u.email === normalizedEmail) {
        const err = new Error('An account with this email already exists.');
        err.statusCode = 400;
        throw err;
      }
    }

    const userId = crypto.randomUUID();
    const newUser = {
      id: userId,
      _id: userId,
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      createdAt: new Date().toISOString()
    };
    memDb.users.set(userId, newUser);

    const token = jwt.sign(
      { id: userId, email: normalizedEmail, name: newUser.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return {
      token,
      user: {
        id: userId,
        name: newUser.name,
        email: newUser.email,
        createdAt: newUser.createdAt
      }
    };
  }

  // Mongoose / MongoDB Atlas
  const existing = await User.findOne({ email: normalizedEmail });
  if (existing) {
    const err = new Error('An account with this email already exists.');
    err.statusCode = 400;
    throw err;
  }

  const user = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    password: hashedPassword
  });

  const token = jwt.sign(
    { id: user._id.toString(), email: user.email, name: user.name },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  return {
    token,
    user: {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      createdAt: user.createdAt
    }
  };
}

export async function authenticateUser({ email, password }) {
  if (!email || !password) {
    const err = new Error('Email and password are required.');
    err.statusCode = 400;
    throw err;
  }

  const normalizedEmail = email.trim().toLowerCase();

  if (isUsingMemoryFallback()) {
    const memDb = getMemoryDB();
    let foundUser = null;
    for (const u of memDb.users.values()) {
      if (u.email === normalizedEmail) {
        foundUser = u;
        break;
      }
    }

    if (!foundUser) {
      const err = new Error('Invalid email or password.');
      err.statusCode = 401;
      throw err;
    }

    const isMatch = await bcrypt.compare(password, foundUser.password);
    if (!isMatch) {
      const err = new Error('Invalid email or password.');
      err.statusCode = 401;
      throw err;
    }

    const token = jwt.sign(
      { id: foundUser.id, email: foundUser.email, name: foundUser.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return {
      token,
      user: {
        id: foundUser.id,
        name: foundUser.name,
        email: foundUser.email,
        createdAt: foundUser.createdAt
      }
    };
  }

  // Mongoose / MongoDB Atlas
  const user = await User.findOne({ email: normalizedEmail });
  if (!user) {
    const err = new Error('Invalid email or password.');
    err.statusCode = 401;
    throw err;
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    const err = new Error('Invalid email or password.');
    err.statusCode = 401;
    throw err;
  }

  const token = jwt.sign(
    { id: user._id.toString(), email: user.email, name: user.name },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  return {
    token,
    user: {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      createdAt: user.createdAt
    }
  };
}

export async function getUserById(userId) {
  if (isUsingMemoryFallback()) {
    const memDb = getMemoryDB();
    const u = memDb.users.get(userId);
    if (!u) return null;
    return {
      id: u.id,
      name: u.name,
      email: u.email,
      createdAt: u.createdAt
    };
  }

  const user = await User.findById(userId).select('-password');
  if (!user) return null;
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    createdAt: user.createdAt
  };
}
