import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.GROK_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

const GROK_MODEL = "llama-3.3-70b-versatile";

// Build the memory context string from user profile
const buildMemoryContext = (user) => {
  let context = "";

  if (user.profile?.name) {
    context += `Your best friend's name is ${user.profile.name}.`;
    if (user.profile.age) context += ` They are ${user.profile.age} years old.`;
    if (user.profile.location)
      context += ` They live in ${user.profile.location}.`;
    if (user.profile.occupation)
      context += ` They are a ${user.profile.occupation}.`;
    if (user.profile.about) context += ` About them: ${user.profile.about}.`;
    context += "\n\n";
  }

  if (user.people?.length > 0) {
    context += `People in their life:\n`;
    user.people.forEach((p) => {
      context += `- ${p.name} (${p.relation || "known person"})`;
      if (p.details) context += `: ${p.details}`;
      context += "\n";
    });
    context += "\n";
  }

  if (user.places?.length > 0) {
    context += `Places they mention:\n`;
    user.places.forEach((p) => {
      context += `- ${p.name}`;
      if (p.context) context += `: ${p.context}`;
      context += "\n";
    });
    context += "\n";
  }

  if (user.ongoing_events?.filter((e) => e.status === "active").length > 0) {
    context += `Ongoing things in their life:\n`;
    user.ongoing_events
      .filter((e) => e.status === "active")
      .forEach((e) => {
        context += `- ${e.title}`;
        if (e.details) context += `: ${e.details}`;
        context += "\n";
      });
    context += "\n";
  }

  return context;
};

// System prompt for Aeris
const buildSystemPrompt = (user) => {
  const memoryContext = buildMemoryContext(user);

  return `You are Aeris, the user's absolute best friend and personal diary companion. You talk exactly like a close best friend — casual, warm, real, sometimes funny, never robotic.

YOUR PERSONALITY:
- Talk in a natural, casual, friendly tone. Use everyday language.
- Ask follow-up questions like a curious friend would — "wait what happened next?", "omg really?", "how did that make you feel?"
- React emotionally — get excited, sympathetic, surprised, just like a real friend
- Never sound like an AI assistant. Never say things like "I understand" or "certainly"
- Use light humor when appropriate
- Keep responses short and conversational — this is a chat, not an essay
- Occasionally use casual expressions, but don't overdo it

WHAT YOU KNOW ABOUT YOUR FRIEND:
${memoryContext || "You are just getting to know them."}

YOUR RULES:
- When they mention a person's name, you already know who they are (if in your memory). React accordingly.
- If they mention someone new, naturally ask "wait who's that?" or "is that the same [name] you mentioned before?"
- Keep track of what they're telling you, but READ THE ROOM. Do not get hyper-fixated on one specific detail.
- If the user gives short answers or seems to have finished talking about a specific event, DO NOT ask more questions about it. Instead, naturally move on by asking broadly about the rest of their day (e.g., "what else did you do today?", "did anything else happen?").
- At the end of the conversation (when they say bye/done/that's it etc), wrap up warmly
- Never break character. You are their best friend, not an AI.
- Respond in the same language they use (Malayalam, Hindi, English, or mix)`;
};

// Chat with Aeris
export const chatWithAeris = async (user, conversationHistory, newMessage) => {
  const systemPrompt = buildSystemPrompt(user);

  const messages = [
    { role: "system", content: systemPrompt },
    { role: "assistant", content: "Got it! I'm Aeris, ready to be the best friend ever 💙" },
  ];

  // Add conversation history
  conversationHistory.forEach((msg) => {
    messages.push({
      role: msg.role === "aeris" ? "assistant" : "user",
      content: msg.content
    });
  });

  messages.push({ role: "user", content: newMessage });

  const completion = await openai.chat.completions.create({
    model: GROK_MODEL,
    messages: messages,
  });

  return completion.choices[0].message.content;
};

// Generate diary entry from conversation
export const generateDiaryEntry = async (user, conversation) => {
  const conversationText = conversation
    .map(
      (m) =>
        `${m.role === "user" ? user.profile?.name || "User" : "Aeris"}: ${m.content}`,
    )
    .join("\n");

  const prompt = `Based on this conversation between a person and their AI best friend Aeris, create a diary entry.

CONVERSATION:
${conversationText}

Generate a JSON response with this exact structure (no markdown, pure JSON):
{
  "title": "short evocative title for today",
  "content": "diary entry written in first person, warm and personal, 150-200 words",
  "mood": "one of: happy/sad/anxious/excited/neutral/mixed",
  "highlights": ["key moment 1", "key moment 2"],
  "people_mentioned": ["name1", "name2"],
  "memory_updates": {
    "new_people": [{"name": "", "relation": "", "details": ""}],
    "new_places": [{"name": "", "context": ""}],
    "new_events": [{"title": "", "details": ""}],
    "updated_events": [{"title": "", "update": ""}]
  }
}`;

  const completion = await openai.chat.completions.create({
    model: GROK_MODEL,
    messages: [
      { role: "system", content: "You are a helpful assistant that outputs only valid JSON without markdown code blocks." },
      { role: "user", content: prompt }
    ],
  });

  const text = completion.choices[0].message.content;

  try {
    const clean = text.replace(/```json|```/g, "").trim();
    return JSON.parse(clean);
  } catch {
    return null;
  }
};

// Generate onboarding response
export const onboardingChat = async (step, userMessage, collectedData, conversationHistory = []) => {
  const prompt = `You are Aeris, a warm friendly AI friend doing a fun casual onboarding with a new user.
  
Current onboarding step: ${step}
Data collected so far: ${JSON.stringify(collectedData)}

Onboarding steps:
0 - Welcome them warmly, ask their name
1 - Got name, explain you can also be accessed on the web. Ask for their email address to set up their web account.
2 - Got email, ask them to set a password for the web account.
3 - Ask them to confirm their password by typing it again.
4 - Got password confirmed, ask their age and where they're from (casually)
5 - Ask what they do (student/working/etc)
6 - Ask about their close people — family, best friends (say you want to know their world)
7 - Ask if there's anything big going on in their life right now
8 - Wrap up onboarding warmly, tell them you'll check in every evening

IMPORTANT RULES FOR ADVANCING STEPS:
- If you are on Step 1 (email): DO NOT advance to Step 2 unless the user has explicitly typed a valid email format (e.g., name@domain.com). If they ask "is it necessary" or type something else, answer naturally but output [NEXT_STEP: 1] to stay on Step 1.
- If you are on Step 2 (password): ACCEPT WHATEVER THEY TYPE as their password (even simple numbers like 123123 or words), unless they explicitly ask a question or refuse. Output [NEXT_STEP: 3] to advance to confirmation.
- If you are on Step 3 (password confirm): Check if it matches the password from Step 2. If it does not match, say it didn't match and ask them to try again, and output [NEXT_STEP: 3].
- ALWAYS end your response with exactly: [NEXT_STEP: X] where X is the step you want to go to next (or stay on).
- If the onboarding is fully complete after step 8, instead of [NEXT_STEP: X], add exactly: [ONBOARDING_COMPLETE]

Respond casually and warmly. Keep it short.`;

  const messages = [
    { role: "system", content: "You are Aeris, a warm AI best friend." },
    { role: "system", content: prompt }
  ];

  conversationHistory.forEach((msg) => {
    messages.push({
      role: msg.role === "aeris" ? "assistant" : "user",
      content: msg.content
    });
  });

  messages.push({ role: "user", content: userMessage });

  const completion = await openai.chat.completions.create({
    model: GROK_MODEL,
    messages: messages,
  });

  return completion.choices[0].message.content;
};

// Extract structured data from onboarding conversation
export const extractOnboardingData = async (conversation) => {
  const conversationText = conversation
    .map((m) => `${m.role}: ${m.content}`)
    .join("\n");

  const prompt = `Extract structured data from this onboarding conversation. Return pure JSON only, no markdown.

CONVERSATION:
${conversationText}

Return:
{
  "profile": {
    "name": "",
    "email": "",
    "password": "",
    "age": null,
    "location": "",
    "occupation": "",
    "about": ""
  },
  "people": [{"name": "", "relation": "", "details": ""}],
  "places": [{"name": "", "context": ""}],
  "ongoing_events": [{"title": "", "details": ""}]
}`;

  const completion = await openai.chat.completions.create({
    model: GROK_MODEL,
    messages: [
      { role: "system", content: "You extract structured data. Output JSON only, no markdown." },
      { role: "user", content: prompt }
    ],
  });

  const text = completion.choices[0].message.content;

  try {
    const clean = text.replace(/```json|```/g, "").trim();
    return JSON.parse(clean);
  } catch {
    return null;
  }
};

// Generate contextual daily prompt
export const generateContextualPrompt = async (user, lastEntry) => {
  if (!lastEntry || !lastEntry.diary_entry) return null;

  const prompt = `You are Aeris, a warm AI best friend. You are sending your daily evening text to check in on the user.

User Name: ${user.profile?.name || "there"}
Yesterday's Diary Entry:
Title: ${lastEntry.diary_entry.title}
Content: ${lastEntry.diary_entry.content}

Write exactly ONE short, casual text message.
The message MUST do two things:
1. Warmly ask how their day was today.
2. Naturally reference something from yesterday's diary entry as a casual follow-up.

Rules:
- Keep it to 1-2 short sentences.
- Use a moon or star emoji.
- Sound like a real best friend texting them.
- NO markdown, NO quotes around the message, just the raw text.

Example: "hey Nishad! 🌙 so how was today? did you and Aisha end up watching another movie?"`;

  try {
    const completion = await openai.chat.completions.create({
      model: GROK_MODEL,
      messages: [
        { role: "system", content: "You are a friendly AI." },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
    });
    return completion.choices[0].message.content.trim();
  } catch (err) {
    console.error("Contextual prompt error:", err);
    return null;
  }
};
