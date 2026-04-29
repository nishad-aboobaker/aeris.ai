import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import connectDB from './src/config/db.js';
import { initBot } from './src/bot/index.js';
import { startDailyCron } from './src/cron/dailyPrompt.js';
import apiRoutes from './src/routes/api.js';
import seedAdmin from './src/config/seedAdmin.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const start = async () => {
  try {
    await connectDB();
    await seedAdmin(); // Seed default admin if it doesn't exist

    // Express API server
    const app = express();
    app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
    app.use(express.json());
    app.use('/api', apiRoutes);

    // Serve React frontend
    app.use(express.static(path.join(__dirname, '../client/dist')));
    
    // Fallback for React Router
    app.use((req, res) => {
      res.sendFile(path.join(__dirname, '../client/dist/index.html'));
    });

    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => console.log(`🚀 API running on port ${PORT}`));

    // Telegram bot
    const bot = initBot();

    // Daily cron
    startDailyCron(bot);

    console.log('✨ Aeris is alive!');
  } catch (err) {
    console.error('Failed to start Aeris:', err);
    process.exit(1);
  }
};

start();