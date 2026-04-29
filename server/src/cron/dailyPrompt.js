import cron from "node-cron";
import User from "../models/User.js";
import { sendDailyPrompt } from "../bot/index.js";

export const startDailyCron = (bot) => {
  // Run every minute
  cron.schedule(
    "* * * * *",
    async () => {
      // Get current time in IST
      const now = new Date();
      const formatter = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
      const currentISTTime = formatter.format(now); // "HH:mm"

      try {
        // Get users who have completed onboarding AND have this time as their preference
        const users = await User.find({ 
          "onboarding.completed": true,
          "preferences.daily_prompt_time": currentISTTime
        });

        if (users.length > 0) {
          console.log(`⏰ Sending daily prompts to ${users.length} users for time ${currentISTTime} IST`);
        }

        for (const user of users) {
          try {
            // Close any open session from previous day
            if (user.session?.active && user.session.messages?.length > 0) {
              const { closeSession } = await import("../controllers/diary.js");
              await closeSession(user);
            }

            await sendDailyPrompt(
              bot,
              user.telegram_id,
              user.profile?.name || "hey",
            );

            // Small delay to avoid rate limiting
            await new Promise((r) => setTimeout(r, 100));
          } catch (err) {
            console.error(
              `Failed to send prompt to ${user.telegram_id}:`,
              err.message,
            );
          }
        }
      } catch (err) {
        console.error("Cron error:", err);
      }
    },
    {
      timezone: "Asia/Kolkata",
    },
  );

  console.log(`⏰ Dynamic daily cron scheduled (checks every minute)`);
};
