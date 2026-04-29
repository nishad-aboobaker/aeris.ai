import express from 'express';
import { register, login, getMe, updatePreferences } from '../controllers/auth.js';
import { getEntries, getEntry, getMoodStats } from '../controllers/entries.js';
import authMiddleware, { adminMiddleware } from '../middleware/auth.js';
import { getAllUsersForAdmin } from '../controllers/admin.js';

const router = express.Router();

// Auth
router.post('/auth/register', register);
router.post('/auth/login', login);
router.get('/auth/me', authMiddleware, getMe);
router.put('/auth/preferences', authMiddleware, updatePreferences);

// Admin Routes
router.get('/admin/users', authMiddleware, adminMiddleware, getAllUsersForAdmin);

// Diary entries
router.get('/entries', authMiddleware, getEntries);
router.get('/entries/mood-stats', authMiddleware, getMoodStats);
router.get('/entries/:date', authMiddleware, getEntry);

export default router;