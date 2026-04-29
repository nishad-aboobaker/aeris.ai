import mongoose from 'mongoose';

const DiaryEntrySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  telegram_id: { type: Number, required: true },

  date: { type: String, required: true }, // YYYY-MM-DD

  // Raw conversation between user and aeris
  raw_chat: [{
    role: { type: String, enum: ['user', 'aeris'] },
    content: { type: String },
    timestamp: { type: Date }
  }],

  // AI generated diary entry from the conversation
  diary_entry: {
    title: { type: String },       // "A day with old friends"
    content: { type: String },     // full diary entry in first person
    mood: { type: String },        // happy, sad, anxious, excited, neutral
    highlights: [String],          // key moments of the day
    people_mentioned: [String],    // names extracted
  },

  // New memory extracted from this conversation
  memory_updates: {
    new_people: [{ name: String, relation: String, details: String }],
    new_places: [{ name: String, context: String }],
    new_events: [{ title: String, details: String }],
    updated_events: [{ title: String, update: String }]
  },

  created_at: { type: Date, default: Date.now }
});

export default mongoose.model('DiaryEntry', DiaryEntrySchema);