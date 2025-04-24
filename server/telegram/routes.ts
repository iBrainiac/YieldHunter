import { Router, Request, Response } from 'express';
import { storage } from '../storage';
import { initTelegramBot, notifyNewOpportunity, shutdownTelegramBot } from './bot';
import { telegramService } from './service';

// Create a router
const telegramRouter = Router();

// Bot status variables
let botStatus = {
  isActive: false,
  startTime: null as Date | null,
  username: "@YieldHunterBot",
  connectedUsers: 0,
  lastMessageSent: null as Date | null
};

// Get bot status
telegramRouter.get('/status', async (req: Request, res: Response) => {
  try {
    // Update with real user count
    const users = await storage.getTelegramUsers();
    botStatus.connectedUsers = users.length;
    
    // Check if we have the token set, which means the bot can be active
    botStatus.isActive = !!process.env.TELEGRAM_BOT_TOKEN;
    
    // If this is the first status check, set the start time
    if (botStatus.isActive && !botStatus.startTime) {
      botStatus.startTime = new Date();
    }
    
    res.status(200).json(botStatus);
  } catch (error: any) {
    console.error('Error fetching bot status:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get bot status', 
      error: error.message 
    });
  }
});

// Initialize the bot
telegramRouter.post('/init', async (req: Request, res: Response) => {
  try {
    const success = await initTelegramBot();
    if (success) {
      botStatus.isActive = true;
      botStatus.startTime = new Date();
      res.status(200).json({ success: true, message: 'Telegram bot initialized successfully' });
    } else {
      res.status(500).json({ success: false, message: 'Failed to initialize Telegram bot' });
    }
  } catch (error: any) {
    console.error('Error initializing Telegram bot:', error);
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
});

// Get Telegram users
telegramRouter.get('/users', async (req: Request, res: Response) => {
  try {
    const users = await storage.getTelegramUsers();
    res.status(200).json(users);
  } catch (error) {
    console.error('Error fetching Telegram users:', error);
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
});

// Get a specific Telegram user
telegramRouter.get('/users/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, message: 'Invalid user ID' });
    }
    
    const user = await storage.getTelegramUser(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    res.status(200).json(user);
  } catch (error) {
    console.error('Error fetching Telegram user:', error);
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
});

// Update a Telegram user
telegramRouter.put('/users/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, message: 'Invalid user ID' });
    }
    
    const user = await storage.getTelegramUser(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    const updatedUser = await storage.updateTelegramUser(id, req.body);
    res.status(200).json(updatedUser);
  } catch (error) {
    console.error('Error updating Telegram user:', error);
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
});

// Delete a Telegram user
telegramRouter.delete('/users/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, message: 'Invalid user ID' });
    }
    
    const success = await storage.deleteTelegramUser(id);
    if (!success) {
      return res.status(404).json({ success: false, message: 'User not found or could not be deleted' });
    }
    
    res.status(200).json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting Telegram user:', error);
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
});

// Send a broadcast message to all subscribed users
telegramRouter.post('/broadcast', async (req: Request, res: Response) => {
  try {
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }
    
    const result = await telegramService.sendNotificationToSubscribers(message);
    
    // Update the last message sent timestamp
    botStatus.lastMessageSent = new Date();
    
    res.status(200).json({ 
      success: true, 
      message: `Message sent to ${result.sent} users (${result.failed} failed)`,
      sent: result.sent,
      failed: result.failed
    });
  } catch (error: any) {
    console.error('Error broadcasting message:', error);
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
});

// Send a notification about a new opportunity
telegramRouter.post('/notify-opportunity/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, message: 'Invalid opportunity ID' });
    }
    
    const opportunity = await storage.getOpportunity(id);
    if (!opportunity) {
      return res.status(404).json({ success: false, message: 'Opportunity not found' });
    }
    
    const success = await notifyNewOpportunity(opportunity);
    if (success) {
      res.status(200).json({ success: true, message: 'Notification sent successfully' });
    } else {
      res.status(500).json({ success: false, message: 'Failed to send notification' });
    }
  } catch (error) {
    console.error('Error notifying about opportunity:', error);
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
});

// Shutdown the bot
telegramRouter.post('/shutdown', (req: Request, res: Response) => {
  try {
    shutdownTelegramBot();
    res.status(200).json({ success: true, message: 'Telegram bot stopped successfully' });
  } catch (error) {
    console.error('Error stopping Telegram bot:', error);
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
});

export default telegramRouter;