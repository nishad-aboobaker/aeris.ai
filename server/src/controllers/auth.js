import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User.js';

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });

export const register = async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name)
      return res.status(400).json({ message: 'All fields required' });

    const exists = await User.findOne({ email });
    if (exists)
      return res.status(400).json({ message: 'Email already registered' });

    const hashed = await bcrypt.hash(password, 10);

    // Generate a short link token user will send to bot
    const link_token = crypto.randomBytes(4).toString('hex').toUpperCase();

    const user = await User.create({
      email,
      password: hashed,
      link_token,
      profile: { name },
      onboarding: { completed: false, step: 0 },
      session: { active: false, messages: [] }
    });

    res.status(201).json({
      token: generateToken(user._id),
      user: {
        id: user._id,
        email: user.email,
        name: user.profile.name,
        telegram_linked: user.telegram_linked,
        link_token: user.link_token,
        is_admin: user.is_admin
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: 'Invalid credentials' });

    res.json({
      token: generateToken(user._id),
      user: {
        id: user._id,
        email: user.email,
        name: user.profile.name,
        telegram_linked: user.telegram_linked,
        link_token: user.link_token,
        is_admin: user.is_admin
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getMe = async (req, res) => {
  const user = req.user;
  res.json({
    id: user._id,
    email: user.email,
    name: user.profile?.name,
    profile: user.profile,
    telegram_linked: user.telegram_linked,
    link_token: user.link_token,
    people: user.people,
    ongoing_events: user.ongoing_events,
    places: user.places,
    preferences: user.preferences,
    is_admin: user.is_admin
  });
};

export const updatePreferences = async (req, res) => {
  try {
    const { daily_prompt_time } = req.body;
    
    // Validate HH:mm format
    if (daily_prompt_time && !/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(daily_prompt_time)) {
      return res.status(400).json({ message: 'Invalid time format. Use HH:mm' });
    }

    const user = req.user;
    if (daily_prompt_time) {
      user.preferences.daily_prompt_time = daily_prompt_time;
    }
    
    await user.save();
    
    res.json({
      message: 'Preferences updated',
      preferences: user.preferences
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};