/**
 * Telegram Bot Routes for YieldHunter
 * 
 * This module sets up the Express routes for handling Telegram bot interactions.
 */

import { Router } from 'express';
import { handleTelegramWebhook } from './bot';
import { handleBotInitialization, handleBroadcastMessage } from './service';

// Create a router for Telegram-related routes
const telegramRouter = Router();

// Route to handle incoming webhook updates from Telegram
telegramRouter.post('/webhook', handleTelegramWebhook);

// Admin routes for managing the bot
telegramRouter.post('/initialize', handleBotInitialization);
telegramRouter.post('/broadcast', handleBroadcastMessage);

// Route to get bot status (admin-only in production)
telegramRouter.get('/status', (req, res) => {
  const status = {
    active: process.env.TELEGRAM_BOT_TOKEN ? true : false,
    webhook: process.env.TELEGRAM_WEBHOOK_URL || 'Not configured',
    timestamp: new Date().toISOString()
  };
  
  res.status(200).json(status);
});

export default telegramRouter;