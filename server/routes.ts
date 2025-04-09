import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import {
  insertUserSchema,
  insertProtocolSchema,
  insertNetworkSchema,
  insertOpportunitySchema,
  insertSocialPostSchema,
  insertActivitySchema,
  insertAgentConfigurationSchema
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Helper function to handle errors
  const handleError = (res: Response, error: unknown) => {
    console.error(error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: error.errors });
    }
    if (error instanceof Error) {
      return res.status(500).json({ message: error.message });
    }
    return res.status(500).json({ message: "An unknown error occurred" });
  };

  // Get all protocols
  app.get("/api/protocols", async (req: Request, res: Response) => {
    try {
      const protocols = await storage.getProtocols();
      res.json(protocols);
    } catch (error) {
      handleError(res, error);
    }
  });

  // Get a specific protocol
  app.get("/api/protocols/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const protocol = await storage.getProtocol(id);
      if (!protocol) {
        return res.status(404).json({ message: "Protocol not found" });
      }
      res.json(protocol);
    } catch (error) {
      handleError(res, error);
    }
  });

  // Create a new protocol
  app.post("/api/protocols", async (req: Request, res: Response) => {
    try {
      const protocol = insertProtocolSchema.parse(req.body);
      const newProtocol = await storage.createProtocol(protocol);
      res.status(201).json(newProtocol);
    } catch (error) {
      handleError(res, error);
    }
  });

  // Get all networks
  app.get("/api/networks", async (req: Request, res: Response) => {
    try {
      const networks = await storage.getNetworks();
      res.json(networks);
    } catch (error) {
      handleError(res, error);
    }
  });

  // Get all opportunities
  app.get("/api/opportunities", async (req: Request, res: Response) => {
    try {
      const opportunities = await storage.getOpportunities();
      
      // Enrich opportunities with protocol and network details
      const protocols = await storage.getProtocols();
      const networks = await storage.getNetworks();
      
      const enrichedOpportunities = await Promise.all(
        opportunities.map(async (opp) => {
          const protocol = protocols.find(p => p.id === opp.protocolId);
          const network = networks.find(n => n.id === opp.networkId);
          
          return {
            ...opp,
            protocol: protocol || null,
            network: network || null
          };
        })
      );
      
      res.json(enrichedOpportunities);
    } catch (error) {
      handleError(res, error);
    }
  });

  // Get top opportunities
  app.get("/api/opportunities/top", async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 5;
      const opportunities = await storage.getTopOpportunities(limit);
      
      // Enrich opportunities with protocol and network details
      const protocols = await storage.getProtocols();
      const networks = await storage.getNetworks();
      
      const enrichedOpportunities = await Promise.all(
        opportunities.map(async (opp) => {
          const protocol = protocols.find(p => p.id === opp.protocolId);
          const network = networks.find(n => n.id === opp.networkId);
          
          return {
            ...opp,
            protocol: protocol || null,
            network: network || null
          };
        })
      );
      
      res.json(enrichedOpportunities);
    } catch (error) {
      handleError(res, error);
    }
  });

  // Create a new opportunity
  app.post("/api/opportunities", async (req: Request, res: Response) => {
    try {
      const opportunity = insertOpportunitySchema.parse(req.body);
      const newOpportunity = await storage.createOpportunity(opportunity);
      
      // Create activity for new opportunity
      await storage.createActivity({
        type: "opportunity",
        description: `Found new yield opportunity on ${req.body.protocolName || "a protocol"}`,
        details: { opportunityId: newOpportunity.id },
        userId: null
      });
      
      res.status(201).json(newOpportunity);
    } catch (error) {
      handleError(res, error);
    }
  });

  // Get all social posts
  app.get("/api/social-posts", async (req: Request, res: Response) => {
    try {
      const posts = await storage.getSocialPosts();
      res.json(posts);
    } catch (error) {
      handleError(res, error);
    }
  });

  // Create a new social post
  app.post("/api/social-posts", async (req: Request, res: Response) => {
    try {
      const post = insertSocialPostSchema.parse(req.body);
      const newPost = await storage.createSocialPost(post);
      res.status(201).json(newPost);
    } catch (error) {
      handleError(res, error);
    }
  });

  // Generate AI post content
  app.post("/api/social-posts/generate", async (req: Request, res: Response) => {
    try {
      // In a real app, this would call an AI service
      const opportunities = await storage.getTopOpportunities(3);
      const protocols = await storage.getProtocols();
      
      // Get protocol names for the top opportunities
      const protocolNames = opportunities.map(o => {
        const protocol = protocols.find(p => p.id === o.protocolId);
        return protocol ? protocol.name : "Unknown";
      });
      
      // Generate a simple post about the top opportunities
      const topApy = opportunities.length > 0 ? opportunities[0].apy.toFixed(1) : "0";
      const protocolList = protocolNames.join(", ");
      
      const content = `🚀 DeFi Yield Alert! Today's top APY: ${topApy}% on ${protocolNames[0] || "a protocol"}. Also check out yields on ${protocolList}. Stay updated with YieldHawk AI! #DeFi #Crypto #YieldFarming`;
      
      res.json({ content });
    } catch (error) {
      handleError(res, error);
    }
  });

  // Get recent activities
  app.get("/api/activities/recent", async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 3;
      const activities = await storage.getRecentActivities(limit);
      res.json(activities);
    } catch (error) {
      handleError(res, error);
    }
  });

  // Get agent configuration
  app.get("/api/agent-configuration", async (req: Request, res: Response) => {
    try {
      // Always return the first config for this demo
      const config = await storage.getAgentConfiguration(1);
      if (!config) {
        return res.status(404).json({ message: "Configuration not found" });
      }
      res.json(config);
    } catch (error) {
      handleError(res, error);
    }
  });

  // Update agent configuration
  app.put("/api/agent-configuration", async (req: Request, res: Response) => {
    try {
      const configUpdate = insertAgentConfigurationSchema.partial().parse(req.body);
      // Always update the first config for this demo
      const updatedConfig = await storage.updateAgentConfiguration(1, configUpdate);
      if (!updatedConfig) {
        return res.status(404).json({ message: "Configuration not found" });
      }
      res.json(updatedConfig);
    } catch (error) {
      handleError(res, error);
    }
  });

  // Connect wallet (mock endpoint)
  app.post("/api/wallet/connect", async (req: Request, res: Response) => {
    try {
      const { address } = req.body;
      if (!address) {
        return res.status(400).json({ message: "Wallet address is required" });
      }
      
      // Return mock wallet data
      res.json({
        address,
        balance: "4.32 ETH",
        connected: true
      });
    } catch (error) {
      handleError(res, error);
    }
  });

  // Disconnect wallet (mock endpoint)
  app.post("/api/wallet/disconnect", async (req: Request, res: Response) => {
    res.json({ connected: false });
  });

  // Blockchain transaction endpoint
  app.post("/api/transaction", async (req: Request, res: Response) => {
    try {
      const { opportunityId, amount, transactionHash } = req.body;
      
      if (!opportunityId || !amount) {
        return res.status(400).json({ message: "Opportunity ID and amount are required" });
      }
      
      const opportunity = await storage.getOpportunity(parseInt(opportunityId));
      if (!opportunity) {
        return res.status(404).json({ message: "Opportunity not found" });
      }
      
      // Create activity for transaction
      const protocol = await storage.getProtocol(opportunity.protocolId);
      await storage.createActivity({
        type: "transaction",
        description: `Successfully deposited ${amount} ${opportunity.asset} into ${protocol?.name || "a protocol"}`,
        details: { 
          opportunityId, 
          amount, 
          transactionHash: transactionHash || `0x${Math.random().toString(16).substring(2, 42)}`,
          asset: opportunity.asset,
          protocolName: protocol?.name || "Unknown Protocol",
          networkId: opportunity.networkId,
          timestamp: new Date().toISOString()
        },
        userId: null
      });
      
      res.json({
        success: true,
        transactionHash: transactionHash || `0x${Math.random().toString(16).substring(2, 42)}`,
        message: "Transaction submitted successfully"
      });
    } catch (error) {
      handleError(res, error);
    }
  });
  
  // Get transaction history
  app.get("/api/transactions", async (req: Request, res: Response) => {
    try {
      // Get all activities that are transactions
      const activities = await storage.getActivities();
      const transactions = activities
        .filter(activity => activity.type === "transaction")
        .map((activity, index) => {
          const details = activity.details as any;
          return {
            id: activity.id,
            hash: details.transactionHash || `0x${Math.random().toString(16).substring(2, 42)}`,
            type: "deposit",
            protocolName: details.protocolName || "Unknown Protocol",
            asset: details.asset || "ETH",
            amount: details.amount || "0.1",
            timestamp: activity.timestamp,
            success: true
          };
        });
      
      res.json(transactions);
    } catch (error) {
      handleError(res, error);
    }
  });

  // Analytics summary
  app.get("/api/analytics/summary", async (req: Request, res: Response) => {
    try {
      const opportunities = await storage.getOpportunities();
      
      // Calculate some basic analytics
      const tvl = opportunities.reduce((sum, opp) => sum + (opp.tvl || 0), 0);
      const avgApy = opportunities.reduce((sum, opp) => sum + opp.apy, 0) / opportunities.length;
      const weeklyYield = tvl * (avgApy / 100) / 52; // Approximate weekly yield
      
      res.json({
        tvl,
        avgApy,
        weeklyYield,
        opportunitiesCount: opportunities.length
      });
    } catch (error) {
      handleError(res, error);
    }
  });

  // Historical yield data (mock)
  app.get("/api/analytics/historical", async (req: Request, res: Response) => {
    try {
      const period = req.query.period || "7days";
      
      // In a real app, this would fetch historical data from a database
      // For now, return mock data
      const protocols = await storage.getProtocols();
      const opportunities = await storage.getOpportunities();
      
      // Calculate average APY for each protocol
      const protocolAverages = protocols.map(protocol => {
        const protocolOpps = opportunities.filter(opp => opp.protocolId === protocol.id);
        const avgApy = protocolOpps.length > 0 
          ? protocolOpps.reduce((sum, opp) => sum + opp.apy, 0) / protocolOpps.length
          : 0;
        
        return {
          protocol: protocol.name,
          avgApy
        };
      }).sort((a, b) => b.avgApy - a.avgApy);
      
      // Create mock time-series data
      const days = period === "30days" ? 30 : period === "90days" ? 90 : 7;
      const timeSeriesData = [];
      
      // Start date is X days ago
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      for (let i = 0; i < days; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        
        // Create entry for this date
        const entry = {
          date: date.toISOString().split('T')[0],
          // Add APY data for top protocols with slight random variations
          data: protocolAverages.slice(0, 5).map(pa => {
            const variation = (Math.random() * 4) - 2; // Random variation between -2% and +2%
            return {
              protocol: pa.protocol,
              apy: Math.max(0, pa.avgApy + variation)
            };
          })
        };
        
        timeSeriesData.push(entry);
      }
      
      const response = {
        period,
        bestProtocol: protocolAverages[0]?.protocol || "None",
        avgApy: opportunities.reduce((sum, opp) => sum + opp.apy, 0) / opportunities.length,
        yieldChange: Math.random() * 5 - 1, // Random value between -1% and +4%
        agentAccuracy: 94, // Mock value
        timeSeriesData
      };
      
      res.json(response);
    } catch (error) {
      handleError(res, error);
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
