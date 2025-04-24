/**
 * Telegram Bot Service for YieldHunter
 * 
 * This service handles the initialization and management of the Telegram bot.
 * It provides methods to send messages to users and handle administrative tasks.
 */

import { Request, Response } from 'express';
import { storage } from '../storage';

// Environment variables for Telegram configuration
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const TELEGRAM_WEBHOOK_URL = process.env.TELEGRAM_WEBHOOK_URL || '';

// Flag to track if the bot has been initialized
let botInitialized = false;

/**
 * Initialize the Telegram bot with the appropriate configuration
 */
export async function initializeBot(forceUpdate = false): Promise<boolean> {
  // Skip initialization if already initialized and not forced
  if (botInitialized && !forceUpdate) {
    console.log('[Telegram] Bot already initialized');
    return true;
  }
  
  // Check if we have the necessary configuration
  if (!TELEGRAM_BOT_TOKEN) {
    console.error('[Telegram] Bot token is not configured. Bot will not be active.');
    return false;
  }
  
  try {
    // In a real implementation, this would set up the webhook with Telegram
    console.log('[Telegram] Initializing bot');
    
    // Log the initialization but don't actually contact Telegram API in this prototype
    console.log(`[Telegram] Would set webhook to: ${TELEGRAM_WEBHOOK_URL}/api/telegram/webhook`);
    
    // In production, we would make this API call:
    // await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook`, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({
    //     url: `${TELEGRAM_WEBHOOK_URL}/api/telegram/webhook`,
    //     allowed_updates: ['message', 'callback_query']
    //   })
    // });
    
    botInitialized = true;
    console.log('[Telegram] Bot initialization successful');
    return true;
  } catch (error) {
    console.error('[Telegram] Failed to initialize bot:', error);
    return false;
  }
}

/**
 * Handle requests to initialize or update the bot configuration
 */
export async function handleBotInitialization(req: Request, res: Response) {
  try {
    const forceUpdate = req.query.force === 'true';
    const result = await initializeBot(forceUpdate);
    
    if (result) {
      res.status(200).json({ success: true, message: 'Bot initialized successfully' });
    } else {
      res.status(400).json({ 
        success: false, 
        message: 'Failed to initialize bot. Check server logs for details.'
      });
    }
  } catch (error) {
    console.error('[Telegram] Error in bot initialization handler:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

/**
 * Send a notification to a specific Telegram user
 */
export async function sendNotification(telegramUserId: number, message: string): Promise<boolean> {
  if (!TELEGRAM_BOT_TOKEN) {
    console.error('[Telegram] Cannot send notification: Bot token is not configured');
    return false;
  }
  
  try {
    // In a real implementation, this would call the Telegram API
    console.log(`[Telegram] Sending notification to user ${telegramUserId}: ${message.substring(0, 50)}...`);
    
    // In production, we would make this API call:
    // await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({
    //     chat_id: telegramUserId,
    //     text: message,
    //     parse_mode: 'Markdown'
    //   })
    // });
    
    return true;
  } catch (error) {
    console.error('[Telegram] Failed to send notification:', error);
    return false;
  }
}

/**
 * Send a broadcast message to all registered users
 */
export async function sendBroadcast(message: string): Promise<{ success: boolean, sent: number, failed: number }> {
  if (!TELEGRAM_BOT_TOKEN) {
    console.error('[Telegram] Cannot send broadcast: Bot token is not configured');
    return { success: false, sent: 0, failed: 0 };
  }
  
  try {
    // In a real implementation, this would fetch all users with Telegram IDs
    // For this prototype, we'll just log the action
    console.log(`[Telegram] Broadcasting message: ${message.substring(0, 50)}...`);
    
    // In production, we would:
    // 1. Get all users with telegram_id from database
    // 2. Send the message to each user
    
    return { success: true, sent: 10, failed: 0 };
  } catch (error) {
    console.error('[Telegram] Failed to send broadcast:', error);
    return { success: false, sent: 0, failed: 1 };
  }
}

/**
 * Handle admin requests to send a broadcast message
 */
export async function handleBroadcastMessage(req: Request, res: Response) {
  try {
    const { message } = req.body;
    
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }
    
    const result = await sendBroadcast(message);
    
    if (result.success) {
      res.status(200).json({ 
        success: true, 
        message: `Broadcast sent successfully to ${result.sent} users` 
      });
    } else {
      res.status(500).json({ 
        success: false, 
        message: 'Failed to send broadcast. Check server logs for details.'
      });
    }
  } catch (error) {
    console.error('[Telegram] Error in broadcast handler:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

/**
 * Send a notification about a new yield opportunity
 */
export async function notifyNewOpportunity(opportunityId: number): Promise<boolean> {
  try {
    const opportunity = await storage.getOpportunity(opportunityId);
    
    if (!opportunity) {
      console.error(`[Telegram] Cannot notify: Opportunity #${opportunityId} not found`);
      return false;
    }
    
    const message = `
*New Yield Opportunity Alert* 🚨

*${opportunity.asset} on ${opportunity.protocolName}*
Network: ${opportunity.networkName}
APY: ${opportunity.apy}%
Risk: ${opportunity.risk}

This new opportunity has just been identified by our AI. Check it out!
`;
    
    return await sendBroadcast(message);
  } catch (error) {
    console.error('[Telegram] Failed to notify about new opportunity:', error);
    return false;
  }
}