import User from '../models/User.js';
import DiaryEntry from '../models/DiaryEntry.js';
import { generateDiaryEntry } from '../ai/grok.js';

export const closeSession = async (user) => {
  try {
    const session = user.session;
    if (!session.active || session.messages.length === 0) return null;

    // Generate diary entry from conversation
    const generated = await generateDiaryEntry(user, session.messages);

    const today = new Date().toISOString().split('T')[0];

    // Save diary entry
    const entry = await DiaryEntry.create({
      user: user._id,
      telegram_id: user.telegram_id,
      date: today,
      raw_chat: session.messages,
      diary_entry: generated ? {
        title: generated.title,
        content: generated.content,
        mood: generated.mood,
        highlights: generated.highlights,
        people_mentioned: generated.people_mentioned
      } : null,
      memory_updates: generated?.memory_updates || {}
    });

    // Update user memory from this conversation
    if (generated?.memory_updates) {
      const updates = generated.memory_updates;

      // Add new people
      if (updates.new_people?.length > 0) {
        for (const person of updates.new_people) {
          if (!person.name) continue;
          const exists = user.people.find(
            p => p.name.toLowerCase() === person.name.toLowerCase()
          );
          if (!exists) {
            user.people.push({ ...person, last_mentioned: new Date() });
          }
        }
      }

      // Add new places
      if (updates.new_places?.length > 0) {
        for (const place of updates.new_places) {
          if (!place.name) continue;
          const exists = user.places.find(
            p => p.name.toLowerCase() === place.name.toLowerCase()
          );
          if (!exists) {
            user.places.push({ ...place, last_mentioned: new Date() });
          }
        }
      }

      // Add new ongoing events
      if (updates.new_events?.length > 0) {
        for (const event of updates.new_events) {
          if (!event.title) continue;
          user.ongoing_events.push({ ...event, status: 'active' });
        }
      }

      // Update mention count for mentioned people
      if (generated.diary_entry?.people_mentioned?.length > 0) {
        for (const name of generated.diary_entry.people_mentioned) {
          const person = user.people.find(
            p => p.name.toLowerCase() === name.toLowerCase()
          );
          if (person) {
            person.mention_count += 1;
            person.last_mentioned = new Date();
          }
        }
      }
    }

    // Clear session
    user.session.active = false;
    user.session.messages = [];
    user.last_active = new Date();
    await user.save();

    return entry;
  } catch (err) {
    console.error('Error closing session:', err);
    return null;
  }
};

export const getDiaryEntries = async (telegramId, limit = 7) => {
  return DiaryEntry.find({ telegram_id: telegramId })
    .sort({ date: -1 })
    .limit(limit);
};