import DiaryEntry from '../models/DiaryEntry.js';
import { decrypt, decryptMessages } from '../utils/crypto.js';

export const getEntries = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const userId = req.user._id;

    const entries = await DiaryEntry.find({ user: userId })
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit)
      .select('-raw_chat');

    // Decrypt diary content for each entry
    const decrypted = entries.map(e => {
      const obj = e.toObject();
      if (obj.diary_entry?.content) {
        obj.diary_entry.content = decrypt(obj.diary_entry.content, userId);
      }
      return obj;
    });

    const total = await DiaryEntry.countDocuments({ user: userId });

    res.json({
      entries: decrypted,
      pagination: { total, page, pages: Math.ceil(total / limit) }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getEntry = async (req, res) => {
  try {
    const userId = req.user._id;
    const entry = await DiaryEntry.findOne({ user: userId, date: req.params.date });

    if (!entry) return res.status(404).json({ message: 'Entry not found' });

    const obj = entry.toObject();

    // Decrypt content
    if (obj.diary_entry?.content) {
      obj.diary_entry.content = decrypt(obj.diary_entry.content, userId);
    }

    // Decrypt raw chat
    if (obj.raw_chat?.length) {
      obj.raw_chat = decryptMessages(obj.raw_chat, userId);
    }

    res.json(obj);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getMoodStats = async (req, res) => {
  try {
    const entries = await DiaryEntry.find({ user: req.user._id })
      .select('date diary_entry.mood')
      .sort({ date: -1 })
      .limit(30);

    const moodCount = {};
    entries.forEach(e => {
      const mood = e.diary_entry?.mood || 'neutral';
      moodCount[mood] = (moodCount[mood] || 0) + 1;
    });

    res.json({
      moodCount,
      entries: entries.map(e => ({ date: e.date, mood: e.diary_entry?.mood || 'neutral' }))
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};