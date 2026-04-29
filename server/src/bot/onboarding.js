import User from "../models/User.js";
import { onboardingChat, extractOnboardingData } from "../ai/grok.js";
import bcrypt from "bcryptjs";

export const handleOnboarding = async (
  bot,
  telegramId,
  username,
  userMessage,
) => {
  let user = await User.findOne({ telegram_id: telegramId });

  // First time user
  if (!user) {
    user = await User.create({
      telegram_id: telegramId,
      telegram_username: username,
      onboarding: { completed: false, step: 0 },
      session: { active: false, messages: [] },
    });
  }

  const step = user.onboarding.step;
  const collectedData = {
    profile: user.profile,
    people: user.people,
    ongoing_events: user.ongoing_events,
  };

  // Get Aeris response for this onboarding step
  const response = await onboardingChat(step, userMessage, collectedData, user.session.messages || []);

  // Add to onboarding session for data extraction
  if (!user.session.messages) user.session.messages = [];

  user.session.messages.push({
    role: "user",
    content: userMessage,
    timestamp: new Date(),
  });
  user.session.messages.push({
    role: "aeris",
    content: response,
    timestamp: new Date(),
  });

  // Move to next step only if instructed by AI
  const nextStepMatch = response.match(/\[NEXT_STEP:\s*(\d+)\]/);
  if (nextStepMatch) {
    user.onboarding.step = parseInt(nextStepMatch[1], 10);
  } else if (!response.includes("[ONBOARDING_COMPLETE]")) {
    // Fallback: stay on current step if AI forgets
    user.onboarding.step = step;
  }

  // Check if onboarding is complete
  if (response.includes("[ONBOARDING_COMPLETE]")) {
    // Extract all data from onboarding conversation
    const extracted = await extractOnboardingData(user.session.messages);

    if (extracted) {
      if (extracted.profile) {
        // Handle web credentials if collected during onboarding
        if (extracted.profile.email) {
          user.email = extracted.profile.email;
          user.telegram_linked = true; // Auto-link since they have web access now
        }
        if (extracted.profile.password) {
          user.password = await bcrypt.hash(extracted.profile.password, 10);
        }
        
        // Remove raw password before saving to profile sub-document to avoid storing plain text
        delete extracted.profile.password;
        delete extracted.profile.email; // Store email in root, not profile
        
        // Update remaining profile fields
        user.profile = { ...user.profile, ...extracted.profile };
      }
      
      if (extracted.people?.length > 0) {
        const validPeople = extracted.people.filter(p => p.name && p.name.trim() !== "");
        if (validPeople.length > 0) user.people = validPeople;
      }
      if (extracted.places?.length > 0) {
        const validPlaces = extracted.places.filter(p => p.name && p.name.trim() !== "");
        if (validPlaces.length > 0) user.places = validPlaces;
      }
      if (extracted.ongoing_events?.length > 0) {
        const validEvents = extracted.ongoing_events.filter(e => e.title && e.title.trim() !== "");
        if (validEvents.length > 0) user.ongoing_events = validEvents;
      }
    }

    user.onboarding.completed = true;
    user.session.messages = []; // clear onboarding chat
    await user.save();

    const cleanResponse = response.replace(/\[NEXT_STEP:\s*\d+\]/g, "").replace("[ONBOARDING_COMPLETE]", "").trim();
    await bot.sendMessage(telegramId, cleanResponse);
    return;
  }

  await user.save();

  const cleanResponse = response.replace(/\[NEXT_STEP:\s*\d+\]/g, "").replace("[ONBOARDING_COMPLETE]", "").trim();
  await bot.sendMessage(telegramId, cleanResponse);
};
