import TelegramBot from 'node-telegram-bot-api';
import User from '../models/User.js';
import { handleOnboarding } from './onboarding.js';
import { chatWithAeris, generateContextualPrompt } from '../ai/grok.js';
import { closeSession, getDiaryEntries } from '../controllers/diary.js';

const SESSION_TIMEOUT_MINUTES = 30;

export const initBot = () => {
  const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });

  console.log('🤖 Aeris bot started');

  bot.on('message', async (msg) => {
    const telegramId = msg.from.id;
    const username = msg.from.username;
    const text = msg.text?.trim();

    if (!text) return;

    try {
      // Handle /start command — could have a link token e.g. /start ABC123
      if (text.startsWith('/start')) {
        const parts = text.split(' ');
        const token = parts[1]?.trim().toUpperCase();

        // Try to link with web account via token
        if (token) {
          const webUser = await User.findOne({ link_token: token });
          if (webUser && !webUser.telegram_linked) {
            // Check for existing bot-only user and delete to prevent duplicate key error
            const existingBotUser = await User.findOne({ telegram_id: telegramId });
            if (existingBotUser && existingBotUser._id.toString() !== webUser._id.toString()) {
              await User.deleteOne({ _id: existingBotUser._id });
            }

            webUser.telegram_id = telegramId;
            webUser.telegram_username = username;
            webUser.telegram_linked = true;
            webUser.onboarding.completed = true; // web signup = onboarding done
            await webUser.save();
            await bot.sendMessage(telegramId,
              `hey ${webUser.profile?.name || 'there'}! 🎉 you're all linked up!\n\ni'm Aeris — your personal diary bestie. i'll check in with you every evening 🌙\n\ncan't wait to hear about your days!`
            );
            return;
          }
        }

        const user = await User.findOne({ telegram_id: telegramId });
        if (user?.onboarding?.completed) {
          await bot.sendMessage(telegramId,
            `hey ${user.profile?.name || 'you'}! 🌙 missed you. how's everything going?`
          );
          return;
        }

        // Start onboarding for new user (direct bot users, no web signup)
        await handleOnboarding(bot, telegramId, username, '/start');
        return;
      }

      // Handle /diary command - show recent entries
      if (text === '/diary') {
        const entries = await getDiaryEntries(telegramId, 5);
        if (entries.length === 0) {
          await bot.sendMessage(telegramId, "no diary entries yet! talk to me tonight 🌙");
          return;
        }

        let response = "📔 *your recent diary entries:*\n\n";
        entries.forEach(e => {
          response += `*${e.date}* — ${e.diary_entry?.title || 'untitled'}\n`;
          response += `mood: ${e.diary_entry?.mood || '?'}\n\n`;
        });

        await bot.sendMessage(telegramId, response, { parse_mode: 'Markdown' });
        return;
      }

      // Handle /memory command - show what Aeris knows
      if (text === '/memory') {
        const user = await User.findOne({ telegram_id: telegramId });
        if (!user) return;

        let response = `🧠 *what i know about you:*\n\n`;

        if (user.profile?.name) response += `you're *${user.profile.name}*`;
        if (user.profile?.age) response += `, ${user.profile.age}`;
        if (user.profile?.location) response += ` from ${user.profile.location}`;
        response += '\n\n';

        if (user.people?.length > 0) {
          response += `*people in your life:*\n`;
          user.people.forEach(p => {
            response += `• ${p.name} (${p.relation || 'friend'})`;
            if (p.details) response += ` — ${p.details}`;
            response += '\n';
          });
        }

        if (user.ongoing_events?.filter(e => e.status === 'active').length > 0) {
          response += `\n*ongoing in your life:*\n`;
          user.ongoing_events
            .filter(e => e.status === 'active')
            .forEach(e => {
              response += `• ${e.title}\n`;
            });
        }

        await bot.sendMessage(telegramId, response, { parse_mode: 'Markdown' });
        return;
      }

      // Check if user exists and onboarding is complete
      const user = await User.findOne({ telegram_id: telegramId });

      if (!user || !user.onboarding?.completed) {
        await handleOnboarding(bot, telegramId, username, text);
        return;
      }

      // Check for session end keywords
      const endKeywords = ['bye', 'good night', 'goodnight', 'gn', 'that\'s it', "that's all", 'done', 'byee', 'ok bye'];
      const isEnding = endKeywords.some(k => text.toLowerCase().includes(k));

      if (isEnding && user.session?.active) {
        // Close session and save diary
        const entry = await closeSession(user);

        if (entry?.diary_entry) {
          await bot.sendMessage(telegramId,
            `aww good night! 🌙✨\n\ni wrote today's diary for you:\n\n` +
            `*${entry.diary_entry.title}*\n\n${entry.diary_entry.content}`,
            { parse_mode: 'Markdown' }
          );
        } else {
          await bot.sendMessage(telegramId, `good night! 🌙 sweet dreams. talk tomorrow!`);
        }
        return;
      }

      // Start or continue session
      if (!user.session.active) {
        user.session.active = true;
        user.session.started_at = new Date();
        user.session.messages = [];
        await user.save();
      }

      // Check session timeout
      if (user.session.started_at) {
        const minutesElapsed = (Date.now() - new Date(user.session.started_at)) / 60000;
        if (minutesElapsed > SESSION_TIMEOUT_MINUTES) {
          await closeSession(user);
          // Reload user after session close
          const refreshed = await User.findOne({ telegram_id: telegramId });
          refreshed.session.active = true;
          refreshed.session.started_at = new Date();
          refreshed.session.messages = [];
          await refreshed.save();
        }
      }

      // Get fresh user state
      const freshUser = await User.findOne({ telegram_id: telegramId });

      // Show typing indicator
      await bot.sendChatAction(telegramId, 'typing');

      // Chat with Aeris
      const reply = await chatWithAeris(freshUser, freshUser.session.messages, text);

      // Save messages to session
      freshUser.session.messages.push({ role: 'user', content: text, timestamp: new Date() });
      freshUser.session.messages.push({ role: 'aeris', content: reply, timestamp: new Date() });
      freshUser.last_active = new Date();
      await freshUser.save();

      await bot.sendMessage(telegramId, reply);

    } catch (err) {
      console.error('Bot error:', err);
      await bot.sendMessage(telegramId, "omg something went wrong on my end 😭 try again?");
    }
  });

  return bot;
};

// Export for use in cron
export const sendDailyPrompt = async (bot, telegramId, userName) => {
  let finalPrompt = null;

  try {
    // Try to get yesterday's entry
    const entries = await getDiaryEntries(telegramId, 1);
    if (entries && entries.length > 0) {
      finalPrompt = await generateContextualPrompt({ profile: { name: userName } }, entries[0]);
    }
  } catch (err) {
    console.error("Failed to generate contextual prompt:", err);
  }

  if (!finalPrompt) {
    // Fallback generic prompts
    const prompts = [
      `hey ${userName}! 🌙 so how was your day? tell me everything`,
      `${userName}! it's your time to spill ☕ what happened today?`,
      `hey you 👋 day's done — what's the tea? 🍵`,
      `${userName}! 🌙 okay so tell me about today. the good, the bad, all of it`,
      `heyy! how did today go? i've been waiting to hear 🌙`
    ];
    finalPrompt = prompts[Math.floor(Math.random() * prompts.length)];
  }

  await bot.sendMessage(telegramId, finalPrompt);
};