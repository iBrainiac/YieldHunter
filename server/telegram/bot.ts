import { telegramService } from './service';
import { storage } from '../storage';
import { Opportunity } from '@shared/schema';

/**
 * Initialize the Telegram bot
 */
export async function initTelegramBot() {
  if (!process.env.TELEGRAM_BOT_TOKEN) {
    console.warn('TELEGRAM_BOT_TOKEN not set, Telegram bot will not be started');
    return false;
  }

  try {
    console.log('Initializing Telegram bot');
    const success = await telegramService.start();
    
    if (success) {
      console.log('✅ Telegram bot initialized successfully');
      return true;
    } else {
      console.error('❌ Failed to initialize Telegram bot');
      return false;
    }
  } catch (error) {
    console.error('Error initializing Telegram bot:', error);
    return false;
  }
}

/**
 * Send notification about a new opportunity to Telegram subscribers
 */
export async function notifyNewOpportunity(opportunity: Opportunity) {
  if (!process.env.TELEGRAM_BOT_TOKEN) {
    return false;
  }

  return telegramService.notifyNewOpportunity(opportunity);
}

/**
 * Shutdown the Telegram bot
 */
export function shutdownTelegramBot() {
  telegramService.stop();
  console.log('Telegram bot stopped');
}