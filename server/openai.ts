import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";

// Initialize the OpenAI client with the API key from environment variables
// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Function to analyze yield opportunities
export async function analyzeYieldOpportunity(
  protocolName: string,
  asset: string,
  apy: number,
  riskLevel: string,
  networkName: string
): Promise<{ 
  analysis: string;
  riskAssessment: string;
  recommendationScore: number;
  potentialIssues: string[];
}> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert DeFi analyst specializing in yield farming opportunities. Analyze the given opportunity and provide insights on risk, potential, and considerations."
        },
        {
          role: "user",
          content: `Please analyze this yield farming opportunity and respond with JSON:
            - Protocol: ${protocolName}
            - Asset: ${asset}
            - APY: ${apy}%
            - Risk Level (as stated): ${riskLevel}
            - Network: ${networkName}
            
            Provide a JSON response with these fields: 
            {
              "analysis": "A 2-3 sentence analysis of the opportunity",
              "riskAssessment": "Your assessment of the actual risk level",
              "recommendationScore": A number from 1-10 (10 being highest recommendation),
              "potentialIssues": ["List of potential issues or concerns as bullet points"]
            }`
        }
      ],
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content || "";
    return JSON.parse(content);
  } catch (error) {
    console.error("Error analyzing yield opportunity:", error);
    return {
      analysis: "Unable to analyze this opportunity due to an error.",
      riskAssessment: "Unknown - analysis failed",
      recommendationScore: 0,
      potentialIssues: ["Analysis failed due to API error"]
    };
  }
}

// Function to generate optimal yield farming strategy
export async function generateYieldStrategy(
  userRiskProfile: string,
  availableAssets: string[],
  availableNetworks: string[],
  investmentAmount: number
): Promise<{
  recommendedProtocols: string[];
  assetAllocation: Record<string, number>;
  expectedReturns: number;
  strategyDescription: string;
  rebalancingFrequency: string;
}> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert DeFi yield strategy optimizer. Generate optimal yield farming strategies based on user preferences and market conditions."
        },
        {
          role: "user",
          content: `Generate an optimal yield farming strategy with the following parameters:
            - User Risk Profile: ${userRiskProfile}
            - Available Assets: ${availableAssets.join(', ')}
            - Available Networks: ${availableNetworks.join(', ')}
            - Investment Amount: $${investmentAmount}
            
            Provide a JSON response with these fields:
            {
              "recommendedProtocols": ["List of recommended protocols"],
              "assetAllocation": {"ASSET_NAME": percentage, ...},
              "expectedReturns": expected annual percentage return,
              "strategyDescription": "A paragraph describing the strategy",
              "rebalancingFrequency": "How often to rebalance the portfolio"
            }`
        }
      ],
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content || "";
    return JSON.parse(content);
  } catch (error) {
    console.error("Error generating yield strategy:", error);
    return {
      recommendedProtocols: [],
      assetAllocation: {},
      expectedReturns: 0,
      strategyDescription: "Unable to generate a strategy due to an error.",
      rebalancingFrequency: "unknown"
    };
  }
}

// Function to analyze market trends and provide insights
export async function analyzeMarketTrends(
  recentTrends: string[],
  topPerformingAssets: string[],
  timeframe: string
): Promise<{
  marketSummary: string;
  trendAnalysis: string;
  futurePredictions: string;
  recommendedActions: string[];
}> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert cryptocurrency market analyst. Analyze market trends and provide valuable insights."
        },
        {
          role: "user",
          content: `Analyze these market trends and provide insights:
            - Recent Trends: ${recentTrends.join('; ')}
            - Top Performing Assets: ${topPerformingAssets.join(', ')}
            - Timeframe: ${timeframe}
            
            Provide a JSON response with these fields:
            {
              "marketSummary": "A concise summary of current market conditions",
              "trendAnalysis": "An analysis of the identified trends",
              "futurePredictions": "Predictions for the near future based on these trends",
              "recommendedActions": ["List of recommended actions for yield farmers"]
            }`
        }
      ],
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content || "";
    return JSON.parse(content);
  } catch (error) {
    console.error("Error analyzing market trends:", error);
    return {
      marketSummary: "Unable to analyze market trends due to an error.",
      trendAnalysis: "Analysis failed",
      futurePredictions: "Predictions unavailable",
      recommendedActions: ["Try again later when the service is available"]
    };
  }
}

// Function to generate DeFi educational content
export async function generateEducationalContent(
  topic: string,
  complexityLevel: string
): Promise<{
  title: string;
  content: string;
  keyTakeaways: string[];
  furtherReadings: string[];
}> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert DeFi educator. Create educational content that helps users understand complex DeFi concepts."
        },
        {
          role: "user",
          content: `Generate educational content about the following DeFi topic:
            - Topic: ${topic}
            - Complexity Level: ${complexityLevel}
            
            Provide a JSON response with these fields:
            {
              "title": "A catchy title for this educational piece",
              "content": "The main educational content, 3-4 paragraphs",
              "keyTakeaways": ["List of key points to remember"],
              "furtherReadings": ["Suggested resources for further learning"]
            }`
        }
      ],
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content || "";
    return JSON.parse(content);
  } catch (error) {
    console.error("Error generating educational content:", error);
    return {
      title: "Content Unavailable",
      content: "Unable to generate educational content due to an error.",
      keyTakeaways: ["Service temporarily unavailable"],
      furtherReadings: []
    };
  }
}

// Chatbot function to interact with users
export async function processChatbotMessage(
  message: string,
  chatHistory: Array<ChatCompletionMessageParam>
): Promise<string> {
  try {
    // Prepare the conversation history
    const conversationHistory: ChatCompletionMessageParam[] = [
      {
        role: "system",
        content: "You are YieldHunter AI, an expert assistant for DeFi yield farming. You help users understand DeFi opportunities, assess risks, and make informed decisions about yield farming. Keep responses concise, accurate, and focused on DeFi yield farming."
      },
      ...chatHistory,
      {
        role: "user",
        content: message
      }
    ];

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: conversationHistory,
      max_tokens: 800,
    });

    return response.choices[0].message.content || "I apologize, but I couldn't generate a response. Please try again.";
  } catch (error) {
    console.error("Error processing chatbot message:", error);
    return "I'm having trouble connecting to my knowledge base right now. Please try again in a moment.";
  }
}

export default {
  analyzeYieldOpportunity,
  generateYieldStrategy,
  analyzeMarketTrends,
  generateEducationalContent,
  processChatbotMessage
};