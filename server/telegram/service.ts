import { storage } from "../storage";
import { Protocol, Network, Opportunity, TelegramUser, InsertTelegramUser } from "@shared/schema";

// Types for Telegram API
interface TelegramMessage {
  message_id: number;
  from: {
    id: number;
    is_bot: boolean;
    first_name: string;
    last_name?: string;
    username?: string;
  };
  chat: {
    id: number;
    type: string;
    first_name: string;
    last_name?: string;
    username?: string;
  };
  date: number;
  text: string;
}

interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
  callback_query?: any;
}

// Main service class
export class TelegramService {
  private token: string;
  private baseUrl: string;
  private polling: boolean = false;
  private offset: number = 0;
  private commandHandlers: Map<string, (msg: TelegramMessage) => Promise<void>>;

  constructor() {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
      throw new Error("TELEGRAM_BOT_TOKEN environment variable is not set");
    }
    
    this.token = token;
    this.baseUrl = `https://api.telegram.org/bot${this.token}`;
    this.commandHandlers = new Map();
    
    // Register command handlers
    this.registerHandlers();
  }

  // Start the bot and begin polling for updates
  async start() {
    console.log("Starting Telegram bot...");
    
    try {
      // Send a request to Telegram to get bot info
      const me = await this.makeRequest('getMe');
      console.log(`Telegram bot started: @${me.username}`);
      
      // Start polling for updates
      this.polling = true;
      this.pollForUpdates();
      
      return true;
    } catch (error) {
      console.error("Error starting Telegram bot:", error);
      return false;
    }
  }

  // Stop the bot
  stop() {
    console.log("Stopping Telegram bot...");
    this.polling = false;
  }

  // Make HTTP request to Telegram API
  private async makeRequest(method: string, params: Record<string, any> = {}) {
    try {
      const url = `${this.baseUrl}/${method}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Telegram API error: ${errorData.description}`);
      }

      const data = await response.json();
      return data.result;
    } catch (error) {
      console.error(`Error making request to Telegram API (${method}):`, error);
      throw error;
    }
  }

  // Poll for updates from Telegram
  private async pollForUpdates() {
    while (this.polling) {
      try {
        const updates = await this.makeRequest('getUpdates', {
          offset: this.offset,
          timeout: 30,
        });

        if (updates && updates.length > 0) {
          for (const update of updates) {
            await this.processUpdate(update);
            // Update offset to acknowledge the update
            this.offset = update.update_id + 1;
          }
        }
      } catch (error) {
        console.error("Error polling for updates:", error);
        // Wait before trying again to avoid flooding in case of errors
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
  }

  // Process an update from Telegram
  private async processUpdate(update: TelegramUpdate) {
    console.log("Received update:", JSON.stringify(update, null, 2));
    
    if (update.message && update.message.text) {
      const message = update.message;
      
      // Check if this is a new user
      await this.ensureUserExists(message);
      
      // Process commands
      if (message.text.startsWith('/')) {
        const commandParts = message.text.split(' ');
        const command = commandParts[0].toLowerCase();
        
        if (this.commandHandlers.has(command)) {
          try {
            await this.commandHandlers.get(command)!(message);
          } catch (error) {
            console.error(`Error handling command ${command}:`, error);
            await this.sendMessage(message.chat.id, `Sorry, an error occurred while processing your command.`);
          }
        } else {
          await this.sendMessage(message.chat.id, `Sorry, I don't recognize the command "${command}". Try /help for a list of commands.`);
        }
      } else {
        // Handle non-command messages based on user state
        await this.handleMessage(message);
      }
    } else if (update.callback_query) {
      // Handle callback queries (button clicks)
      await this.handleCallbackQuery(update.callback_query);
    }
  }

  // Send a message to a Telegram chat
  async sendMessage(chatId: number, text: string, options: Record<string, any> = {}) {
    return this.makeRequest('sendMessage', {
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      ...options,
    });
  }

  // Register all command handlers
  private registerHandlers() {
    this.commandHandlers.set('/start', this.handleStart.bind(this));
    this.commandHandlers.set('/help', this.handleHelp.bind(this));
    this.commandHandlers.set('/opportunities', this.handleOpportunities.bind(this));
    this.commandHandlers.set('/subscribe', this.handleSubscribe.bind(this));
    this.commandHandlers.set('/stats', this.handleStats.bind(this));
  }

  // Ensure the user exists in database
  private async ensureUserExists(message: TelegramMessage) {
    const { from } = message;
    let user = await storage.getTelegramUserByTelegramId(from.id);
    
    if (!user) {
      // Create a new user
      const newUser: InsertTelegramUser = {
        telegramId: from.id,
        username: from.username || null,
        firstName: from.first_name,
        lastName: from.last_name || null,
        isAuthenticated: false,
        preferences: {}
      };
      
      user = await storage.createTelegramUser(newUser);
      console.log(`Created new Telegram user: ${user.id}, Telegram ID: ${user.telegramId}`);
    } else {
      // Update user's last interaction time
      await storage.updateTelegramUser(user.id, {});
    }
    
    return user;
  }

  // Handle non-command messages
  private async handleMessage(message: TelegramMessage) {
    const user = await storage.getTelegramUserByTelegramId(message.from.id);
    
    if (!user) {
      return this.sendMessage(message.chat.id, "Please use /start to begin.");
    }
    
    // For now, just reply with a generic message
    await this.sendMessage(
      message.chat.id, 
      "I understand text messages, but I'm designed to work with commands. Try /help to see what I can do."
    );
  }

  // Handle callback queries (button clicks)
  private async handleCallbackQuery(query: any) {
    // Extract the data from the callback query
    const data = query.data;
    
    // Acknowledge the callback query
    await this.makeRequest('answerCallbackQuery', {
      callback_query_id: query.id,
    });
    
    // Process the callback data (you can add specific handling here)
    console.log(`Callback query received: ${data}`);
  }

  // Command Handlers
  private async handleStart(message: TelegramMessage) {
    await this.sendMessage(
      message.chat.id,
      `👋 <b>Welcome to YieldHunter Bot!</b>\n\nI can help you track the best DeFi yield opportunities and manage your strategies.\n\nUse /help to see what I can do.`
    );
  }

  private async handleHelp(message: TelegramMessage) {
    await this.sendMessage(
      message.chat.id,
      `<b>YieldHunter Bot Commands</b>\n\n` +
      `/opportunities - View top yield opportunities\n` +
      `/subscribe - Subscribe to daily opportunity updates\n` +
      `/stats - View platform statistics\n` +
      `/help - Show this help message`
    );
  }

  private async handleOpportunities(message: TelegramMessage) {
    try {
      // Get top 5 opportunities
      const opportunities = await storage.getTopOpportunities(5);
      
      if (opportunities.length === 0) {
        return this.sendMessage(message.chat.id, "No yield opportunities found at the moment. Please check back later.");
      }
      
      // Get protocols and networks for display
      const protocols = await storage.getProtocols();
      const networks = await storage.getNetworks();
      
      // Format the opportunities
      let responseText = "<b>🔥 Top Yield Opportunities</b>\n\n";
      
      for (const opp of opportunities) {
        const protocol = protocols.find(p => p.id === opp.protocolId);
        const network = networks.find(n => n.id === opp.networkId);
        
        if (!protocol || !network) continue;
        
        responseText += `<b>${opp.asset} on ${protocol.name} (${network.name})</b>\n`;
        responseText += `APY: <b>${opp.apy.toFixed(2)}%</b>\n`;
        responseText += `Risk level: ${opp.riskLevel}\n`;
        if (opp.details) responseText += `Details: ${opp.details}\n`;
        responseText += `\n`;
      }
      
      responseText += "To view all opportunities, visit our web app at: https://yieldhunter.replit.app";
      
      await this.sendMessage(message.chat.id, responseText);
      return true;
    } catch (error) {
      console.error("Error fetching opportunities:", error);
      await this.sendMessage(message.chat.id, "Sorry, I couldn't fetch the opportunities. Please try again later.");
      return { success: false, sent: 0, failed: 1 };
    }
  }

  private async handleSubscribe(message: TelegramMessage) {
    const user = await storage.getTelegramUserByTelegramId(message.from.id);
    
    if (!user) {
      return this.sendMessage(message.chat.id, "Please use /start to begin.");
    }
    
    // Toggle subscription status
    const isSubscribed = user.preferences && (user.preferences as any).subscribed === true;
    const updatedUser = await storage.updateTelegramUser(user.id, {
      preferences: {
        ...(user.preferences as any),
        subscribed: !isSubscribed
      }
    });
    
    if (updatedUser?.preferences && (updatedUser.preferences as any).subscribed) {
      await this.sendMessage(
        message.chat.id,
        "✅ You are now subscribed to daily yield opportunity updates! You will receive a notification when high-APY opportunities are found."
      );
    } else {
      await this.sendMessage(
        message.chat.id,
        "❌ You have unsubscribed from daily yield opportunity updates."
      );
    }
  }

  private async handleStats(message: TelegramMessage) {
    try {
      const opportunities = await storage.getOpportunities();
      const protocols = await storage.getProtocols();
      
      // Calculate stats
      const avgApy = opportunities.reduce((sum, opp) => sum + opp.apy, 0) / Math.max(1, opportunities.length);
      const totalProtocols = protocols.length;
      const highYieldCount = opportunities.filter(opp => opp.apy > 20).length;
      
      await this.sendMessage(
        message.chat.id,
        `<b>📊 YieldHunter Platform Statistics</b>\n\n` +
        `Total opportunities: <b>${opportunities.length}</b>\n` +
        `Supported protocols: <b>${totalProtocols}</b>\n` +
        `Average APY: <b>${avgApy.toFixed(2)}%</b>\n` +
        `High yield opportunities (>20% APY): <b>${highYieldCount}</b>\n\n` +
        `For more detailed statistics and analytics, visit our web app at: https://yieldhunter.replit.app`
      );
    } catch (error) {
      console.error("Error fetching stats:", error);
      await this.sendMessage(message.chat.id, "Sorry, I couldn't fetch the statistics. Please try again later.");
    }
  }

  // Send notification to all subscribed users
  async sendNotificationToSubscribers(message: string): Promise<{ sent: number, failed: number }> {
    const subscribers = (await storage.getTelegramUsers()).filter(
      user => user.preferences && (user.preferences as any).subscribed === true
    );
    
    let sent = 0;
    let failed = 0;
    
    for (const user of subscribers) {
      try {
        await this.sendMessage(user.telegramId, message);
        sent++;
      } catch (error) {
        console.error(`Failed to send notification to user ${user.id}:`, error);
        failed++;
      }
    }
    
    return { sent, failed };
  }

  // Notify about new opportunity
  async notifyNewOpportunity(opportunity: Opportunity): Promise<boolean> {
    try {
      // Get protocol and network names
      const protocols = await storage.getProtocols();
      const networks = await storage.getNetworks();
      
      const protocol = protocols.find(p => p.id === opportunity.protocolId);
      const network = networks.find(n => n.id === opportunity.networkId);
      
      if (!protocol || !network) {
        return false;
      }
      
      const message = `<b>🔥 New High-Yield Opportunity Detected!</b>\n\n` +
        `Asset: <b>${opportunity.asset}</b>\n` +
        `Protocol: <b>${protocol.name}</b>\n` +
        `Network: <b>${network.name}</b>\n` +
        `APY: <b>${opportunity.apy.toFixed(2)}%</b>\n` +
        `Risk level: ${opportunity.riskLevel}\n` +
        `\nCheck it out in our web app: https://yieldhunter.replit.app`;
      
      const { sent, failed } = await this.sendNotificationToSubscribers(message);
      console.log(`Sent opportunity notification to ${sent} subscribers (${failed} failed)`);
      
      return sent > 0;
    } catch (error) {
      console.error("Error notifying about new opportunity:", error);
      return false;
    }
  }
}

// Create singleton instance
export const telegramService = new TelegramService();