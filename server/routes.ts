import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { WebSocketServer } from "ws";
import openAI from "./openai";
import {
  insertUserSchema,
  insertProtocolSchema,
  insertNetworkSchema,
  insertOpportunitySchema,
  insertSocialPostSchema,
  insertActivitySchema,
  insertAgentConfigurationSchema,
  insertAgentInstanceSchema,
  insertYieldStrategySchema,
  insertStrategyExecutionSchema
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
  
  // ===== Agent instances APIs for multi-agent architecture =====
  
  // Get all agent instances
  app.get("/api/agent-instances", async (req: Request, res: Response) => {
    try {
      const instances = await storage.getAgentInstances();
      
      // For each instance, fetch the assigned protocol and network details
      const enrichedInstances = await Promise.all(instances.map(async (instance) => {
        let protocol = null;
        let network = null;
        
        if (instance.assignedProtocol) {
          protocol = await storage.getProtocol(instance.assignedProtocol);
        }
        
        if (instance.assignedNetwork) {
          network = await storage.getNetwork(instance.assignedNetwork);
        }
        
        return {
          ...instance,
          protocol: protocol ? { id: protocol.id, name: protocol.name } : null,
          network: network ? { id: network.id, name: network.name } : null
        };
      }));
      
      res.json(enrichedInstances);
    } catch (error) {
      handleError(res, error);
    }
  });
  
  // Get a specific agent instance
  app.get("/api/agent-instances/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const instance = await storage.getAgentInstance(id);
      
      if (!instance) {
        return res.status(404).json({ message: "Agent instance not found" });
      }
      
      // Fetch protocol and network details
      let protocol = null;
      let network = null;
      
      if (instance.assignedProtocol) {
        protocol = await storage.getProtocol(instance.assignedProtocol);
      }
      
      if (instance.assignedNetwork) {
        network = await storage.getNetwork(instance.assignedNetwork);
      }
      
      res.json({
        ...instance,
        protocol: protocol ? { id: protocol.id, name: protocol.name } : null,
        network: network ? { id: network.id, name: network.name } : null
      });
    } catch (error) {
      handleError(res, error);
    }
  });
  
  // Create a new agent instance
  app.post("/api/agent-instances", async (req: Request, res: Response) => {
    try {
      const { name, assignedProtocol, assignedNetwork, configurationId } = req.body;
      
      if (!name || !configurationId) {
        return res.status(400).json({ message: "Name and configurationId are required" });
      }
      
      // Check if configuration exists
      const config = await storage.getAgentConfiguration(configurationId);
      if (!config) {
        return res.status(404).json({ message: "Configuration not found" });
      }
      
      // Get existing agents for this configuration
      const existingAgents = await storage.getAgentInstancesByConfig(configurationId);
      
      // Check if max agents limit would be exceeded
      if (existingAgents.length >= config.maxAgents) {
        return res.status(400).json({ 
          message: `Maximum number of agents (${config.maxAgents}) for this configuration would be exceeded`
        });
      }
      
      // Create the new agent instance
      const newInstance = await storage.createAgentInstance({
        name,
        status: "idle",
        assignedProtocol,
        assignedNetwork,
        currentTask: "Waiting for initialization",
        performance: { successRate: 0, opportunitiesFound: 0 },
        configurationId
      });
      
      res.status(201).json(newInstance);
    } catch (error) {
      handleError(res, error);
    }
  });
  
  // Update an agent instance
  app.put("/api/agent-instances/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const instance = await storage.getAgentInstance(id);
      
      if (!instance) {
        return res.status(404).json({ message: "Agent instance not found" });
      }
      
      const updatedInstance = await storage.updateAgentInstance(id, req.body);
      res.json(updatedInstance);
    } catch (error) {
      handleError(res, error);
    }
  });
  
  // Delete an agent instance
  app.delete("/api/agent-instances/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteAgentInstance(id);
      
      if (!success) {
        return res.status(404).json({ message: "Agent instance not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      handleError(res, error);
    }
  });
  
  // Start an agent scanning task
  app.post("/api/agent-instances/:id/scan", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const instance = await storage.getAgentInstance(id);
      
      if (!instance) {
        return res.status(404).json({ message: "Agent instance not found" });
      }
      
      // Update agent status to scanning
      const updatedInstance = await storage.updateAgentInstance(id, {
        status: "scanning",
        currentTask: "Scanning for yield opportunities"
      });
      
      // In a real implementation, we would launch the scanning process here
      // For now, we'll simulate it by creating a finding after a delay
      setTimeout(async () => {
        try {
          // Simulate opportunity finding
          const scanResult = Math.random() > 0.3; // 70% chance of finding something
          
          if (scanResult && instance.assignedProtocol) {
            // Generate a random opportunity
            const protocol = await storage.getProtocol(instance.assignedProtocol);
            const network = instance.assignedNetwork ? await storage.getNetwork(instance.assignedNetwork) : null;
            
            if (protocol && network) {
              // Create a new opportunity
              const baseApy = 5 + (Math.random() * 20); // Between 5% and 25%
              const opportunity = await storage.createOpportunity({
                protocolId: protocol.id,
                networkId: network.id,
                asset: ["USDC", "ETH", "DAI", "WBTC"][Math.floor(Math.random() * 4)],
                apy: baseApy,
                tvl: 50000000 + (Math.random() * 500000000),
                riskLevel: baseApy > 15 ? "high" : baseApy > 10 ? "medium" : "low",
                details: `${protocol.name} yield opportunity found by agent ${instance.name}`,
                url: protocol.website || ""
              });
              
              // Update agent with success
              await storage.updateAgentInstance(id, {
                status: "idle",
                currentTask: "Waiting for next scan",
                performance: {
                  successRate: Math.min(100, ((instance.performance as any)?.successRate || 90) + 1),
                  opportunitiesFound: ((instance.performance as any)?.opportunitiesFound || 0) + 1,
                  lastFound: new Date().toISOString()
                }
              });
              
              // Create activity log
              await storage.createActivity({
                type: "opportunity",
                description: `Agent ${instance.name} found new yield opportunity on ${protocol.name}`,
                details: { opportunityId: opportunity.id, agentId: instance.id },
                userId: null
              });
            }
          } else {
            // No opportunity found, update agent
            await storage.updateAgentInstance(id, {
              status: "idle",
              currentTask: "Waiting for next scan",
              performance: {
                successRate: Math.max(80, (((instance.performance as any)?.successRate || 90) - 0.5)),
                opportunitiesFound: ((instance.performance as any)?.opportunitiesFound || 0)
              }
            });
          }
        } catch (e) {
          console.error("Error in background scan task:", e);
          // Update agent with error status
          await storage.updateAgentInstance(id, {
            status: "error",
            currentTask: "Scan failed - see logs"
          });
        }
      }, 5000); // Simulate scanning for 5 seconds
      
      res.json({
        message: "Scan initiated",
        instance: updatedInstance
      });
    } catch (error) {
      handleError(res, error);
    }
  });

  // Endpoint for parallel scanning with multiple agents
  app.post("/api/parallel-scan", async (req: Request, res: Response) => {
    try {
      // Get configuration to check if parallel scanning is enabled
      const configId = req.body.configurationId || 1; // Default to first config if not specified
      const config = await storage.getAgentConfiguration(configId);
      
      if (!config) {
        return res.status(404).json({ message: "Agent configuration not found" });
      }
      
      if (!config.parallelScanning) {
        return res.status(400).json({ 
          message: "Parallel scanning not enabled", 
          details: "Enable parallel scanning in agent configuration first" 
        });
      }
      
      // Get all available agents for this config
      const agents = await storage.getAgentInstancesByConfig(configId);
      
      if (!agents || agents.length === 0) {
        return res.status(404).json({ message: "No agent instances found for this configuration" });
      }
      
      // Filter agents that are available for scanning (idle status)
      const availableAgents = agents.filter(agent => agent.status === "idle");
      
      if (availableAgents.length === 0) {
        return res.status(400).json({ 
          message: "No available agents", 
          details: "All agents are currently busy" 
        });
      }
      
      // Start scanning with all available agents in parallel
      const startedScans = [];
      
      for (const agent of availableAgents) {
        // Update agent status
        const updatedAgent = await storage.updateAgentInstance(agent.id, {
          status: "scanning",
          currentTask: "Parallel scanning for yield opportunities"
        });
        
        startedScans.push(updatedAgent);
        
        // Simulate scanning in background (would be a proper job queue in production)
        setTimeout(async () => {
          try {
            // Simulate opportunity finding
            const scanResult = Math.random() > 0.3; // 70% chance of finding something
            
            if (scanResult && agent.assignedProtocol) {
              // Generate a random opportunity
              const protocol = await storage.getProtocol(agent.assignedProtocol);
              const network = agent.assignedNetwork ? await storage.getNetwork(agent.assignedNetwork) : null;
              
              if (protocol && network) {
                // Create a new opportunity
                const baseApy = 5 + (Math.random() * 20); // Between 5% and 25%
                const opportunity = await storage.createOpportunity({
                  protocolId: protocol.id,
                  networkId: network.id,
                  asset: ["USDC", "ETH", "DAI", "WBTC"][Math.floor(Math.random() * 4)],
                  apy: baseApy,
                  tvl: 50000000 + (Math.random() * 500000000),
                  riskLevel: baseApy > 15 ? "high" : baseApy > 10 ? "medium" : "low",
                  details: `${protocol.name} yield opportunity found by agent ${agent.name} during parallel scan`,
                  url: protocol.website || ""
                });
                
                // Update agent with success
                await storage.updateAgentInstance(agent.id, {
                  status: "idle",
                  currentTask: "Waiting for next scan",
                  performance: {
                    successRate: Math.min(100, ((agent.performance as any)?.successRate || 90) + 1),
                    opportunitiesFound: ((agent.performance as any)?.opportunitiesFound || 0) + 1,
                    lastFound: new Date().toISOString()
                  }
                });
                
                // Create activity log
                await storage.createActivity({
                  type: "opportunity",
                  description: `Agent ${agent.name} found new yield opportunity on ${protocol.name} (parallel scan)`,
                  details: { opportunityId: opportunity.id, agentId: agent.id, parallelScan: true },
                  userId: null
                });
              }
            } else {
              // No opportunity found, update agent
              await storage.updateAgentInstance(agent.id, {
                status: "idle",
                currentTask: "Waiting for next scan",
                performance: {
                  successRate: Math.max(80, (((agent.performance as any)?.successRate || 90) - 0.5)),
                  opportunitiesFound: ((agent.performance as any)?.opportunitiesFound || 0)
                }
              });
            }
          } catch (e) {
            console.error("Error in parallel scan task:", e);
            // Update agent with error status
            await storage.updateAgentInstance(agent.id, {
              status: "error",
              currentTask: "Parallel scan failed - see logs"
            });
          }
        }, 3000 + Math.floor(Math.random() * 4000)); // Simulate 3-7 second scan with random completion times
      }
      
      // Create activity for parallel scan
      await storage.createActivity({
        type: "agent",
        description: `Started parallel scanning with ${startedScans.length} agents`,
        details: { agentIds: startedScans.map(a => a.id), configId },
        userId: null
      });
      
      res.json({
        message: `Parallel scan initiated with ${startedScans.length} agents`,
        agents: startedScans
      });
    } catch (error) {
      handleError(res, error);
    }
  });
  
  // ===== Automated Yield Farming Strategy APIs =====
  
  // Get all yield strategies
  app.get("/api/yield-strategies", async (req: Request, res: Response) => {
    try {
      const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;
      const strategies = await storage.getYieldStrategies(userId);
      
      // Enrich strategies with protocol and network information
      const protocols = await storage.getProtocols();
      const networks = await storage.getNetworks();
      
      const enrichedStrategies = strategies.map(strategy => {
        const targetProtocolIds = strategy.targetProtocols as number[];
        const targetNetworkIds = strategy.targetNetworks as number[];
        
        const protocolInfo = targetProtocolIds.map(id => {
          const protocol = protocols.find(p => p.id === id);
          return protocol ? { id, name: protocol.name } : { id, name: "Unknown" };
        });
        
        const networkInfo = targetNetworkIds.map(id => {
          const network = networks.find(n => n.id === id);
          return network ? { id, name: network.name } : { id, name: "Unknown" };
        });
        
        return {
          ...strategy,
          protocolInfo,
          networkInfo
        };
      });
      
      res.json(enrichedStrategies);
    } catch (error) {
      handleError(res, error);
    }
  });
  
  // Get a specific yield strategy
  app.get("/api/yield-strategies/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const strategy = await storage.getYieldStrategy(id);
      
      if (!strategy) {
        return res.status(404).json({ message: "Strategy not found" });
      }
      
      // Get related executions
      const executions = await storage.getStrategyExecutions(id);
      
      // Enrich with protocol and network information
      const protocols = await storage.getProtocols();
      const networks = await storage.getNetworks();
      
      const targetProtocolIds = strategy.targetProtocols as number[];
      const targetNetworkIds = strategy.targetNetworks as number[];
      
      const protocolInfo = targetProtocolIds.map(id => {
        const protocol = protocols.find(p => p.id === id);
        return protocol ? { id, name: protocol.name } : { id, name: "Unknown" };
      });
      
      const networkInfo = targetNetworkIds.map(id => {
        const network = networks.find(n => n.id === id);
        return network ? { id, name: network.name } : { id, name: "Unknown" };
      });
      
      res.json({
        ...strategy,
        protocolInfo,
        networkInfo,
        executions
      });
    } catch (error) {
      handleError(res, error);
    }
  });
  
  // Create a new yield strategy
  app.post("/api/yield-strategies", async (req: Request, res: Response) => {
    try {
      const strategyData = insertYieldStrategySchema.parse(req.body);
      const newStrategy = await storage.createYieldStrategy(strategyData);
      
      res.status(201).json(newStrategy);
    } catch (error) {
      handleError(res, error);
    }
  });
  
  // Update a yield strategy
  app.put("/api/yield-strategies/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const strategy = await storage.getYieldStrategy(id);
      
      if (!strategy) {
        return res.status(404).json({ message: "Strategy not found" });
      }
      
      const updateData = insertYieldStrategySchema.partial().parse(req.body);
      const updatedStrategy = await storage.updateYieldStrategy(id, updateData);
      
      res.json(updatedStrategy);
    } catch (error) {
      handleError(res, error);
    }
  });
  
  // Delete a yield strategy
  app.delete("/api/yield-strategies/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const strategy = await storage.getYieldStrategy(id);
      
      if (!strategy) {
        return res.status(404).json({ message: "Strategy not found" });
      }
      
      const result = await storage.deleteYieldStrategy(id);
      
      if (result) {
        res.json({ message: "Strategy deleted successfully" });
      } else {
        res.status(500).json({ message: "Failed to delete strategy" });
      }
    } catch (error) {
      handleError(res, error);
    }
  });
  
  // Execute a strategy
  app.post("/api/yield-strategies/:id/execute", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const strategy = await storage.getYieldStrategy(id);
      
      if (!strategy) {
        return res.status(404).json({ message: "Strategy not found" });
      }
      
      const result = await storage.executeYieldStrategy(id);
      
      res.json({
        message: "Strategy executed successfully",
        execution: result
      });
    } catch (error) {
      handleError(res, error);
    }
  });
  
  // Get executions for a strategy
  app.get("/api/yield-strategies/:id/executions", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const strategy = await storage.getYieldStrategy(id);
      
      if (!strategy) {
        return res.status(404).json({ message: "Strategy not found" });
      }
      
      const executions = await storage.getStrategyExecutions(id);
      
      res.json(executions);
    } catch (error) {
      handleError(res, error);
    }
  });
  
  // Get all executions
  app.get("/api/strategy-executions", async (req: Request, res: Response) => {
    try {
      const executions = await storage.getStrategyExecutions();
      res.json(executions);
    } catch (error) {
      handleError(res, error);
    }
  });

  // OpenAI-powered chatbot endpoints
  app.post("/api/chatbot/message", async (req: Request, res: Response) => {
    try {
      const { message, history } = req.body;
      
      if (!message) {
        return res.status(400).json({ message: "Message is required" });
      }
      
      const response = await openAI.processChatbotMessage(message, history || []);
      
      // Create activity for the chat interaction
      await storage.createActivity({
        type: "chat",
        description: "Interacted with YieldHunter AI assistant",
        details: { 
          userMessage: message.substring(0, 100) + (message.length > 100 ? "..." : ""),
          timestamp: new Date().toISOString()
        },
        userId: null
      });
      
      res.json({ response });
    } catch (error) {
      handleError(res, error);
    }
  });
  
  // AI Opportunity Analysis endpoint
  app.post("/api/analyze/opportunity", async (req: Request, res: Response) => {
    try {
      const { protocolName, asset, apy, riskLevel, networkName } = req.body;
      
      if (!protocolName || !asset || apy === undefined || !riskLevel || !networkName) {
        return res.status(400).json({ message: "Missing required opportunity details" });
      }
      
      const analysis = await openAI.analyzeYieldOpportunity(
        protocolName,
        asset,
        apy,
        riskLevel,
        networkName
      );
      
      res.json(analysis);
    } catch (error) {
      handleError(res, error);
    }
  });
  
  // AI Strategy Generator endpoint
  app.post("/api/generate/strategy", async (req: Request, res: Response) => {
    try {
      const { riskProfile, assets, networks, investmentAmount } = req.body;
      
      if (!riskProfile || !assets || !networks || !investmentAmount) {
        return res.status(400).json({ message: "Missing required strategy parameters" });
      }
      
      const strategy = await openAI.generateYieldStrategy(
        riskProfile,
        assets,
        networks,
        investmentAmount
      );
      
      res.json(strategy);
    } catch (error) {
      handleError(res, error);
    }
  });
  
  // Market Trends Analysis endpoint
  app.post("/api/analyze/market", async (req: Request, res: Response) => {
    try {
      const { recentTrends, topPerformingAssets, timeframe } = req.body;
      
      if (!recentTrends || !topPerformingAssets || !timeframe) {
        return res.status(400).json({ message: "Missing required market analysis parameters" });
      }
      
      const analysis = await openAI.analyzeMarketTrends(
        recentTrends,
        topPerformingAssets,
        timeframe
      );
      
      res.json(analysis);
    } catch (error) {
      handleError(res, error);
    }
  });
  
  // Educational Content Generator endpoint
  app.post("/api/generate/education", async (req: Request, res: Response) => {
    try {
      const { topic, complexityLevel } = req.body;
      
      if (!topic || !complexityLevel) {
        return res.status(400).json({ message: "Topic and complexity level are required" });
      }
      
      const content = await openAI.generateEducationalContent(
        topic,
        complexityLevel
      );
      
      res.json(content);
    } catch (error) {
      handleError(res, error);
    }
  });
  
  // Set up WebSockets for real-time communication
  const httpServer = createServer(app);
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  wss.on('connection', (ws) => {
    console.log('Client connected to WebSocket');
    
    // Send initial connection success message
    ws.send(JSON.stringify({
      type: 'connection',
      message: 'Connected to YieldHunter WebSocket server',
      timestamp: new Date().toISOString()
    }));
    
    // Handle incoming messages
    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        // Handle different message types
        if (message.type === 'scan_request') {
          // Simulate a scanning process
          ws.send(JSON.stringify({
            type: 'scan_started',
            message: 'Starting yield opportunity scan',
            timestamp: new Date().toISOString()
          }));
          
          // Simulate processing time
          setTimeout(() => {
            ws.send(JSON.stringify({
              type: 'scan_result',
              data: {
                opportunities: [
                  { protocol: 'Aave v3', asset: 'USDC', apy: 3.2, network: 'Base' },
                  { protocol: 'Compound', asset: 'ETH', apy: 4.1, network: 'Base' },
                  { protocol: 'Balancer', asset: 'USDT', apy: 3.8, network: 'Base' }
                ],
                scanTime: new Date().toISOString()
              },
              timestamp: new Date().toISOString()
            }));
          }, 2000);
          
        } else if (message.type === 'chatbot_message') {
          // Process chat message with AI
          const response = await openAI.processChatbotMessage(message.content, message.history || []);
          
          ws.send(JSON.stringify({
            type: 'chatbot_response',
            data: {
              response,
              timestamp: new Date().toISOString()
            }
          }));
        }
        
      } catch (error) {
        console.error('WebSocket message error:', error);
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Error processing message',
          timestamp: new Date().toISOString()
        }));
      }
    });
    
    // Handle disconnection
    ws.on('close', () => {
      console.log('Client disconnected from WebSocket');
    });
  });
  
  return httpServer;
}
