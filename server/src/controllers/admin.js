import User from '../models/User.js';

export const getAllUsersForAdmin = async (req, res) => {
  try {
    // Exclude sensitive data: password, session, people, places, ongoing_events
    const users = await User.find({})
      .select('-password -session -people -places -ongoing_events')
      .sort({ created_at: -1 });

    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
