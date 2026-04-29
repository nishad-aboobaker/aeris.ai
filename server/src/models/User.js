import mongoose from 'mongoose';

const PersonSchema = new mongoose.Schema({
  name: { type: String, required: true },
  relation: { type: String }, // friend, mom, dad, sibling, crush, colleague etc
  details: { type: String }, // "college friend", "works at infosys", "she's funny"
  last_mentioned: { type: Date },
  mention_count: { type: Number, default: 0 }
});

const PlaceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  context: { type: String }, // "my college", "favourite cafe", "hometown"
  last_mentioned: { type: Date }
});

const OngoingEventSchema = new mongoose.Schema({
  title: { type: String, required: true }, // "placement preparation", "crush situation"
  details: { type: String },
  status: { type: String, enum: ['active', 'resolved', 'paused'], default: 'active' },
  started_on: { type: Date, default: Date.now },
  last_updated: { type: Date, default: Date.now }
});

const UserSchema = new mongoose.Schema({
  // Role
  is_admin: { type: Boolean, default: false },

  // Web auth
  email: { type: String, unique: true, sparse: true },
  password: { type: String },

  // Telegram linking
  telegram_id: { type: Number, unique: true, sparse: true },
  telegram_username: { type: String },
  telegram_linked: { type: Boolean, default: false },
  link_token: { type: String }, // token user sends to bot to link account

  // Personal info collected during onboarding
  profile: {
    name: { type: String },
    age: { type: Number },
    location: { type: String },
    occupation: { type: String }, // student, working, etc
    about: { type: String }       // free text summary of the user
  },

  // All people aeris knows about
  people: [PersonSchema],

  // Places that matter to the user
  places: [PlaceSchema],

  // Ongoing life events/situations aeris is tracking
  ongoing_events: [OngoingEventSchema],

  // Onboarding state
  onboarding: {
    completed: { type: Boolean, default: false },
    step: { type: Number, default: 0 }
  },

  // Session state for current conversation
  session: {
    active: { type: Boolean, default: false },
    started_at: { type: Date },
    messages: [{ // raw chat buffer for today
      role: { type: String, enum: ['user', 'aeris'] },
      content: { type: String },
      timestamp: { type: Date, default: Date.now }
    }]
  },

  // Preferences
  preferences: {
    daily_prompt_time: { type: String, default: '21:00' }, // HH:MM
    timezone: { type: String, default: 'Asia/Kolkata' },
    language: { type: String, default: 'english' }
  },

  created_at: { type: Date, default: Date.now },
  last_active: { type: Date, default: Date.now }
});

export default mongoose.model('User', UserSchema);