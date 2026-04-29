import DiaryEntry from '../models/DiaryEntry.js';

export const getEntries = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const entries = await DiaryEntry.find({ user: req.user._id })
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit)
      .select('-raw_chat'); // don't send raw chat in list

    const total = await DiaryEntry.countDocuments({ user: req.user._id });

    res.json({
      entries,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getEntry = async (req, res) => {
  try {
    const entry = await DiaryEntry.findOne({
      user: req.user._id,
      date: req.params.date
    });

    if (!entry) return res.status(404).json({ message: 'Entry not found' });
    res.json(entry);
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

    res.json({ moodCount, entries: entries.map(e => ({
      date: e.date,
      mood: e.diary_entry?.mood || 'neutral'
    }))});
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};