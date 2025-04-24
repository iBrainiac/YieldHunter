/**
 * Telegram Bot Integration for YieldHunter
 * 
 * This module implements a Telegram bot that allows users to interact with
 * the YieldHunter platform via Telegram messaging.
 */

import { Request, Response } from 'express';
import { storage } from '../storage';

// Interface for Telegram webhook update
interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    from: {
      id: number;
      is_bot: boolean;
      first_name: string;
      username?: string;
    };
    chat: {
      id: number;
      first_name: string;
      username?: string;
      type: string;
    };
    date: number;
    text?: string;
  };
  callback_query?: {
    id: string;
    from: {
      id: number;
      is_bot: boolean;
      first_name: string;
      username?: string;
    };
    message: {
      message_id: number;
      chat: {
        id: number;
        type: string;
      };
    };
    data: string;
  };
}

// Interface for Telegram outgoing message
interface TelegramMessage {
  chat_id: number;
  text: string;
  parse_mode?: 'Markdown' | 'HTML';
  reply_markup?: any;
}

// User session mapping for Telegram users
interface UserSession {
  telegramId: number;
  walletAddress?: string;
  authenticated: boolean;
  lastCommand?: string;
  lastMessageTime: number;
}

// Keep track of user sessions
const userSessions = new Map<number, UserSession>();

/**
 * Handle incoming webhook updates from Telegram
 */
export async function handleTelegramWebhook(req: Request, res: Response) {
  try {
    const update: TelegramUpdate = req.body;
    
    // Early return if not a valid update
    if (!update || (!update.message && !update.callback_query)) {
      return res.status(400).send({ error: 'Invalid update format' });
    }
    
    // Process the message
    if (update.message && update.message.text) {
      await handleTextMessage(update.message.from.id, update.message.chat.id, update.message.text);
    } 
    // Process callback queries (button clicks)
    else if (update.callback_query) {
      await handleCallbackQuery(
        update.callback_query.from.id,
        update.callback_query.message.chat.id,
        update.callback_query.data,
        update.callback_query.id
      );
    }
    
    // Respond to webhook
    res.status(200).send({ ok: true });
  } catch (error) {
    console.error('Error handling Telegram webhook:', error);
    res.status(500).send({ error: 'Internal server error' });
  }
}

/**
 * Handle text messages received from users
 */
async function handleTextMessage(userId: number, chatId: number, text: string) {
  // Get or create user session
  let session = getUserSession(userId);
  
  // Check if this is a command
  if (text.startsWith('/')) {
    // Handle commands
    const command = text.split(' ')[0].toLowerCase();
    session.lastCommand = command;
    
    switch (command) {
      case '/start':
        await sendWelcomeMessage(chatId);
        break;
      case '/help':
        await sendHelpMessage(chatId);
        break;
      case '/opportunities':
        await sendOpportunities(chatId);
        break;
      case '/balance':
        await sendBalanceInfo(chatId, session);
        break;
      case '/connect':
        await startWalletConnection(chatId, session);
        break;
      case '/price':
        // Extract the cryptocurrency symbol if provided
        const params = text.split(' ');
        const symbol = params.length > 1 ? params[1].toUpperCase() : '';
        await sendCryptoPrice(chatId, symbol);
        break;
      default:
        await sendMessage(chatId, 'Unknown command. Type /help to see available commands.');
        break;
    }
  } else {
    // Handle regular text based on the last command
    if (session.lastCommand === '/connect' && !session.authenticated) {
      // Check if the message looks like a wallet address
      if (isValidEthereumAddress(text)) {
        session.walletAddress = text;
        session.authenticated = true;
        await sendMessage(chatId, 
          `Wallet connected: ${formatAddress(text)}\n\nYou can now use other commands like /balance and /opportunities.`);
      } else {
        await sendMessage(chatId, 'This doesn\'t look like a valid Ethereum address. Please try again or type /cancel to abort.');
      }
    } else {
      // Default response for text messages
      await sendMessage(chatId, 
        'I\'m your YieldHunter bot assistant. Send /help to see what I can do for you!');
    }
  }
  
  // Update the session
  updateUserSession(userId, session);
}

/**
 * Handle callback queries from inline keyboards
 */
async function handleCallbackQuery(userId: number, chatId: number, data: string, queryId: string) {
  const session = getUserSession(userId);
  
  // Handle different callback data
  if (data.startsWith('opportunity_')) {
    const opportunityId = parseInt(data.split('_')[1]);
    await sendOpportunityDetails(chatId, opportunityId);
  } else if (data === 'more_opportunities') {
    await sendOpportunities(chatId, 5); // Send more opportunities
  } else if (data === 'cancel_connect') {
    session.lastCommand = undefined;
    await sendMessage(chatId, 'Wallet connection cancelled.');
  }
  
  // Acknowledge the callback query
  await answerCallbackQuery(queryId);
  
  // Update session
  updateUserSession(userId, session);
}

/**
 * Send a welcome message to new users
 */
async function sendWelcomeMessage(chatId: number) {
  const message = `
*Welcome to YieldHunter AI* 🚀

I'm your assistant for optimizing DeFi yields and managing your crypto investments.

*What I can do:*
• Find the best yield farming opportunities
• Check your portfolio balance
• Set up price alerts
• Monitor protocol APYs

To get started, use /help to see all available commands.
`;

  await sendMessage(chatId, message, 'Markdown');
}

/**
 * Send help information
 */
async function sendHelpMessage(chatId: number) {
  const message = `
*YieldHunter AI Bot Commands*

/opportunities - View top yield farming opportunities
/balance - Check your portfolio balance
/connect - Connect your wallet address
/price [symbol] - Check current price of a cryptocurrency
/alerts - Manage your price and APY alerts
/help - Show this help message

Need more assistance? Visit our website or contact support.
`;

  await sendMessage(chatId, message, 'Markdown');
}

/**
 * Send top yield opportunities to the user
 */
async function sendOpportunities(chatId: number, limit: number = 3) {
  try {
    // Get top opportunities from storage
    const opportunities = await storage.getTopOpportunities(limit);
    
    if (opportunities.length === 0) {
      await sendMessage(chatId, 'No yield opportunities found at the moment. Please try again later.');
      return;
    }
    
    // Format the opportunities message
    let message = '*Top Yield Farming Opportunities* 💰\n\n';
    
    opportunities.forEach((opp, index) => {
      message += `*${index + 1}. ${opp.asset} on ${opp.protocolName}*\n`;
      message += `   Network: ${opp.networkName}\n`;
      message += `   APY: ${opp.apy}%\n`;
      message += `   Risk: ${opp.risk}\n\n`;
    });
    
    message += 'To get more details on an opportunity, tap on it below.';
    
    // Create inline keyboard for opportunity selection
    const inlineKeyboard = {
      inline_keyboard: [
        ...opportunities.map((opp, index) => [{
          text: `${index + 1}. ${opp.asset} (${opp.apy}%)`,
          callback_data: `opportunity_${opp.id}`
        }]),
        [{
          text: 'Show More Opportunities',
          callback_data: 'more_opportunities'
        }]
      ]
    };
    
    await sendMessage(chatId, message, 'Markdown', inlineKeyboard);
  } catch (error) {
    console.error('Error fetching opportunities:', error);
    await sendMessage(chatId, 'Sorry, there was an error fetching opportunities. Please try again later.');
  }
}

/**
 * Send detailed information about a specific opportunity
 */
async function sendOpportunityDetails(chatId: number, opportunityId: number) {
  try {
    const opportunity = await storage.getOpportunity(opportunityId);
    
    if (!opportunity) {
      await sendMessage(chatId, 'Sorry, this opportunity is no longer available.');
      return;
    }
    
    // Format the opportunity details
    let message = `
*${opportunity.asset} on ${opportunity.protocolName}* 📊

*Network:* ${opportunity.networkName}
*APY:* ${opportunity.apy}%
*Risk Level:* ${opportunity.risk}
*Liquidity:* $${(opportunity.liquidity / 1000000).toFixed(2)}M
*Minimum Deposit:* ${opportunity.minimumDeposit} ${opportunity.asset}

*Strategy:* ${opportunity.strategy}

To invest in this opportunity, visit our website or use the /invest command.
`;
    
    // Create action buttons
    const inlineKeyboard = {
      inline_keyboard: [
        [{
          text: 'Invest Now',
          url: `https://yieldhunter.app/opportunities/${opportunityId}`
        }],
        [{
          text: 'Set APY Alert',
          callback_data: `alert_apy_${opportunityId}`
        }],
        [{
          text: '« Back to Opportunities',
          callback_data: 'more_opportunities'
        }]
      ]
    };
    
    await sendMessage(chatId, message, 'Markdown', inlineKeyboard);
  } catch (error) {
    console.error('Error fetching opportunity details:', error);
    await sendMessage(chatId, 'Sorry, there was an error fetching the opportunity details. Please try again later.');
  }
}

/**
 * Send the user's portfolio balance information
 */
async function sendBalanceInfo(chatId: number, session: UserSession) {
  if (!session.authenticated || !session.walletAddress) {
    await sendMessage(chatId, 
      'You need to connect your wallet first. Use the /connect command to link your wallet address.');
    return;
  }
  
  // In a real implementation, you would fetch actual balance data
  // Since this is a prototype, we'll use mock data
  const message = `
*Your Portfolio Balance* 💼

*Total Value:* $5,243.78
*24h Change:* +$142.50 (2.8%)

*Assets:*
• ETH: 1.24 ($2,356.80)
• USDC: 1,500.00 ($1,500.00)
• AAVE: 12.5 ($1,237.50)
• Other: $149.48

*Active Investments:*
• USDC in Compound: $1,000 at 4.2% APY
• ETH in Lido: 0.5 ETH at 3.8% APY

For more details, visit the web dashboard.
`;
  
  const inlineKeyboard = {
    inline_keyboard: [
      [{
        text: 'View on Web Dashboard',
        url: 'https://yieldhunter.app/portfolio'
      }],
      [{
        text: 'Check New Opportunities',
        callback_data: 'more_opportunities'
      }]
    ]
  };
  
  await sendMessage(chatId, message, 'Markdown', inlineKeyboard);
}

/**
 * Start the wallet connection process
 */
async function startWalletConnection(chatId: number, session: UserSession) {
  if (session.authenticated && session.walletAddress) {
    await sendMessage(chatId, 
      `You already have a wallet connected: ${formatAddress(session.walletAddress)}\n\nTo connect a different wallet, please disconnect first with /disconnect.`);
    return;
  }
  
  const message = `
Please send your Ethereum wallet address to connect to YieldHunter.

This will allow you to:
• View your portfolio balance
• Check your active investments
• Receive personalized opportunities

*Your address will only be used to read data, not for transactions.*
`;
  
  const inlineKeyboard = {
    inline_keyboard: [
      [{
        text: 'Cancel',
        callback_data: 'cancel_connect'
      }]
    ]
  };
  
  await sendMessage(chatId, message, 'Markdown', inlineKeyboard);
}

/**
 * Send cryptocurrency price information
 */
async function sendCryptoPrice(chatId: number, symbol: string) {
  if (!symbol) {
    await sendMessage(chatId, 
      'Please specify a cryptocurrency symbol. For example: /price ETH');
    return;
  }
  
  // In a real implementation, you would fetch actual price data from an API
  // For this prototype, we'll use sample data
  const priceData: Record<string, { price: number, change24h: number }> = {
    'BTC': { price: 68542.35, change24h: 2.4 },
    'ETH': { price: 1975.80, change24h: 1.8 },
    'SOL': { price: 121.30, change24h: 5.2 },
    'USDC': { price: 1.00, change24h: 0.0 },
    'AAVE': { price: 98.75, change24h: -1.3 }
  };
  
  if (priceData[symbol]) {
    const data = priceData[symbol];
    const changeSymbol = data.change24h >= 0 ? '▲' : '▼';
    const changeColor = data.change24h >= 0 ? '🟢' : '🔴';
    
    const message = `
*${symbol} Price Information* ${changeColor}

*Current Price:* $${data.price.toLocaleString()}
*24h Change:* ${changeSymbol} ${Math.abs(data.change24h)}%

Last updated: ${new Date().toISOString().split('T')[0]} ${new Date().toTimeString().split(' ')[0]}
`;
    
    const inlineKeyboard = {
      inline_keyboard: [
        [{
          text: 'Set Price Alert',
          callback_data: `price_alert_${symbol}`
        }],
        [{
          text: 'Check Other Coins',
          callback_data: 'price_menu'
        }]
      ]
    };
    
    await sendMessage(chatId, message, 'Markdown', inlineKeyboard);
  } else {
    await sendMessage(chatId, 
      `Sorry, price information for ${symbol} is not available. Please try another symbol like BTC, ETH, SOL, USDC, or AAVE.`);
  }
}

/**
 * Send a text message to a Telegram chat
 */
async function sendMessage(
  chatId: number, 
  text: string, 
  parseMode: 'Markdown' | 'HTML' = 'Markdown',
  replyMarkup?: any
) {
  // In a real implementation, this would use the Telegram Bot API
  // For the prototype, we'll just log the message
  console.log(`[Telegram Bot] Sending message to ${chatId}: ${text.substring(0, 50)}...`);
  
  // Create the message object
  const message: TelegramMessage = {
    chat_id: chatId,
    text,
    parse_mode: parseMode
  };
  
  if (replyMarkup) {
    message.reply_markup = replyMarkup;
  }
  
  // In production, this would make an API call to Telegram
  // Here we're just simulating the behavior
  return { ok: true, result: { message_id: Math.floor(Math.random() * 1000) } };
}

/**
 * Answer a callback query to stop the loading indicator
 */
async function answerCallbackQuery(queryId: string, text?: string) {
  // In a real implementation, this would use the Telegram Bot API
  console.log(`[Telegram Bot] Answering callback query: ${queryId}`);
  
  // In production, this would make an API call to Telegram
  return { ok: true };
}

/**
 * Get a user session, creating one if it doesn't exist
 */
function getUserSession(userId: number): UserSession {
  if (!userSessions.has(userId)) {
    userSessions.set(userId, {
      telegramId: userId,
      authenticated: false,
      lastMessageTime: Date.now()
    });
  }
  
  return userSessions.get(userId)!;
}

/**
 * Update a user's session information
 */
function updateUserSession(userId: number, session: UserSession) {
  session.lastMessageTime = Date.now();
  userSessions.set(userId, session);
}

/**
 * Check if a string is a valid Ethereum address
 */
function isValidEthereumAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Format an Ethereum address for display (truncate middle)
 */
function formatAddress(address: string): string {
  if (!address) return '';
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
}