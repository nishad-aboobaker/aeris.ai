import User from '../models/User.js';
import DiaryEntry from '../models/DiaryEntry.js';
import { generateDiaryEntry } from '../ai/grok.js';
import { encrypt, encryptMessages } from '../utils/crypto.js';

export const closeSession = async (user) => {
  try {
    const session = user.session;
    if (!session.active || session.messages.length === 0) return null;

    const generated = await generateDiaryEntry(user, session.messages);
    const today = new Date().toISOString().split('T')[0];
    const userId = user._id;

    // Encrypt raw chat
    const encryptedMessages = encryptMessages(session.messages, userId);

    // Encrypt diary content
    const encryptedContent = generated?.content
      ? encrypt(generated.content, userId)
      : null;

    const entry = await DiaryEntry.create({
      user: userId,
      telegram_id: user.telegram_id,
      date: today,
      raw_chat: encryptedMessages,
      diary_entry: generated ? {
        title: generated.title,
        content: encryptedContent,
        mood: generated.mood,
        highlights: generated.highlights,
        people_mentioned: generated.people_mentioned
      } : null,
      memory_updates: generated?.memory_updates || {}
    });

    // Update user memory
    if (generated?.memory_updates) {
      const updates = generated.memory_updates;

      if (updates.new_people?.length > 0) {
        for (const person of updates.new_people) {
          if (!person.name) continue;
          const exists = user.people.find(p => p.name.toLowerCase() === person.name.toLowerCase());
          if (!exists) user.people.push({ ...person, last_mentioned: new Date() });
        }
      }

      if (updates.new_places?.length > 0) {
        for (const place of updates.new_places) {
          if (!place.name) continue;
          const exists = user.places.find(p => p.name.toLowerCase() === place.name.toLowerCase());
          if (!exists) user.places.push({ ...place, last_mentioned: new Date() });
        }
      }

      if (updates.new_events?.length > 0) {
        for (const event of updates.new_events) {
          if (!event.title) continue;
          user.ongoing_events.push({ ...event, status: 'active' });
        }
      }

      if (generated.people_mentioned?.length > 0) {
        for (const name of generated.people_mentioned) {
          const person = user.people.find(p => p.name.toLowerCase() === name.toLowerCase());
          if (person) { person.mention_count += 1; person.last_mentioned = new Date(); }
        }
      }
    }

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
  return DiaryEntry.find({ telegram_id: telegramId }).sort({ date: -1 }).limit(limit);
};