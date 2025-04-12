import { 
  users, protocols, networks, opportunities, socialPosts, activities, 
  agentConfigurations, agentInstances, yieldStrategies, strategyExecutions,
  type User, type InsertUser, 
  type Protocol, type InsertProtocol,
  type Network, type InsertNetwork,
  type Opportunity, type InsertOpportunity,
  type SocialPost, type InsertSocialPost,
  type Activity, type InsertActivity,
  type AgentConfiguration, type InsertAgentConfiguration,
  type AgentInstance, type InsertAgentInstance,
  type YieldStrategy, type InsertYieldStrategy,
  type StrategyExecution, type InsertStrategyExecution
} from "@shared/schema";

// Storage interface with CRUD methods
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Protocol methods
  getProtocols(): Promise<Protocol[]>;
  getProtocol(id: number): Promise<Protocol | undefined>;
  createProtocol(protocol: InsertProtocol): Promise<Protocol>;

  // Network methods
  getNetworks(): Promise<Network[]>;
  getNetwork(id: number): Promise<Network | undefined>;
  createNetwork(network: InsertNetwork): Promise<Network>;

  // Opportunity methods
  getOpportunities(): Promise<Opportunity[]>;
  getOpportunity(id: number): Promise<Opportunity | undefined>;
  createOpportunity(opportunity: InsertOpportunity): Promise<Opportunity>;
  getTopOpportunities(limit: number): Promise<Opportunity[]>;

  // Social post methods
  getSocialPosts(): Promise<SocialPost[]>;
  getSocialPost(id: number): Promise<SocialPost | undefined>;
  createSocialPost(post: InsertSocialPost): Promise<SocialPost>;

  // Activity methods
  getActivities(): Promise<Activity[]>;
  createActivity(activity: InsertActivity): Promise<Activity>;
  getRecentActivities(limit: number): Promise<Activity[]>;

  // Agent configuration methods
  getAgentConfiguration(id: number): Promise<AgentConfiguration | undefined>;
  createAgentConfiguration(config: InsertAgentConfiguration): Promise<AgentConfiguration>;
  updateAgentConfiguration(id: number, config: Partial<InsertAgentConfiguration>): Promise<AgentConfiguration | undefined>;
  
  // Agent instance methods (for multi-agent architecture)
  getAgentInstances(): Promise<AgentInstance[]>;
  getAgentInstance(id: number): Promise<AgentInstance | undefined>;
  getAgentInstancesByConfig(configId: number): Promise<AgentInstance[]>;
  createAgentInstance(instance: InsertAgentInstance): Promise<AgentInstance>;
  updateAgentInstance(id: number, data: Partial<InsertAgentInstance>): Promise<AgentInstance | undefined>;
  deleteAgentInstance(id: number): Promise<boolean>;
  
  // Yield farming strategy methods
  getYieldStrategies(userId?: number): Promise<YieldStrategy[]>;
  getYieldStrategy(id: number): Promise<YieldStrategy | undefined>;
  createYieldStrategy(strategy: InsertYieldStrategy): Promise<YieldStrategy>;
  updateYieldStrategy(id: number, data: Partial<InsertYieldStrategy>): Promise<YieldStrategy | undefined>;
  deleteYieldStrategy(id: number): Promise<boolean>;
  
  // Strategy execution methods
  getStrategyExecutions(strategyId?: number): Promise<StrategyExecution[]>;
  getStrategyExecution(id: number): Promise<StrategyExecution | undefined>;
  createStrategyExecution(execution: InsertStrategyExecution): Promise<StrategyExecution>;
  executeYieldStrategy(strategyId: number): Promise<StrategyExecution>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private protocols: Map<number, Protocol>;
  private networks: Map<number, Network>;
  private opportunities: Map<number, Opportunity>;
  private socialPosts: Map<number, SocialPost>;
  private activities: Map<number, Activity>;
  private agentConfigurations: Map<number, AgentConfiguration>;
  private agentInstances: Map<number, AgentInstance>;
  private yieldStrategies: Map<number, YieldStrategy>;
  private strategyExecutions: Map<number, StrategyExecution>;
  
  private userId: number;
  private protocolId: number;
  private networkId: number;
  private opportunityId: number;
  private postId: number;
  private activityId: number;
  private configId: number;
  private instanceId: number;
  private strategyId: number;
  private executionId: number;

  constructor() {
    this.users = new Map();
    this.protocols = new Map();
    this.networks = new Map();
    this.opportunities = new Map();
    this.socialPosts = new Map();
    this.activities = new Map();
    this.agentConfigurations = new Map();
    this.agentInstances = new Map();
    this.yieldStrategies = new Map();
    this.strategyExecutions = new Map();
    
    this.userId = 1;
    this.protocolId = 1;
    this.networkId = 1;
    this.opportunityId = 1;
    this.postId = 1;
    this.activityId = 1;
    this.configId = 1;
    this.instanceId = 1;
    this.strategyId = 1;
    this.executionId = 1;
    
    // Initialize with sample data for demo (using IIFE to handle async)
    (async () => {
      await this.initializeData();
    })();
  }

  private async initializeData() {
    // Initialize networks
    const networks = [
      { name: "Ethereum", shortName: "ETH", logo: "E", isActive: true },
      { name: "Polygon", shortName: "MATIC", logo: "P", isActive: true },
      { name: "Binance Smart Chain", shortName: "BSC", logo: "B", isActive: true },
      { name: "Arbitrum", shortName: "ARB", logo: "A", isActive: true },
      { name: "Optimism", shortName: "OP", logo: "O", isActive: true },
      { name: "Base", shortName: "BASE", logo: "B", isActive: true }
    ];
    
    for (const network of networks) {
      await this.createNetwork(network);
    }
    
    // Initialize protocols
    const protocols = [
      { name: "Aave v3", logo: "AAVE", website: "https://aave.com", description: "Decentralized lending protocol", riskLevel: "low" },
      { name: "Compound", logo: "COMP", website: "https://compound.finance", description: "Decentralized lending protocol", riskLevel: "low" },
      { name: "PancakeSwap", logo: "CAKE", website: "https://pancakeswap.finance", description: "AMM and yield farming", riskLevel: "medium" },
      { name: "Curve Finance", logo: "CRV", website: "https://curve.fi", description: "Stablecoin AMM", riskLevel: "low" },
      { name: "SushiSwap", logo: "SUSHI", website: "https://sushi.com", description: "DEX and yield farming", riskLevel: "medium" },
      { name: "Convex Finance", logo: "CVX", website: "https://convexfinance.com", description: "Curve yield booster", riskLevel: "medium" }
    ];
    
    for (const protocol of protocols) {
      await this.createProtocol(protocol);
    }
    
    // Initialize opportunities
    const opportunities = [
      { protocolId: 1, networkId: 2, asset: "USDC", apy: 18.4, tvl: 500000000, riskLevel: "low", details: "Lending USDC on Aave v3", url: "https://app.aave.com" },
      { protocolId: 2, networkId: 1, asset: "ETH", apy: 12.9, tvl: 800000000, riskLevel: "medium", details: "Lending ETH on Compound", url: "https://app.compound.finance" },
      { protocolId: 3, networkId: 3, asset: "CAKE-BNB LP", apy: 34.5, tvl: 150000000, riskLevel: "high", details: "LP farming on PancakeSwap", url: "https://pancakeswap.finance" },
      { protocolId: 4, networkId: 1, asset: "3pool", apy: 8.2, tvl: 950000000, riskLevel: "low", details: "Stablecoin pool on Curve", url: "https://curve.fi" },
      { protocolId: 5, networkId: 2, asset: "SUSHI-ETH LP", apy: 22.7, tvl: 120000000, riskLevel: "medium", details: "LP farming on SushiSwap", url: "https://app.sushi.com" },
      { protocolId: 6, networkId: 1, asset: "cvxCRV", apy: 15.6, tvl: 730000000, riskLevel: "medium", details: "Staking on Convex", url: "https://convexfinance.com" },
      // Base L2 opportunities
      { protocolId: 5, networkId: 7, asset: "SUSHI-ETH LP", apy: 28.3, tvl: 85000000, riskLevel: "medium", details: "LP farming on SushiSwap (Base)", url: "https://app.sushi.com" },
      { protocolId: 5, networkId: 7, asset: "SUSHI-USDC LP", apy: 31.2, tvl: 65000000, riskLevel: "medium", details: "LP farming on SushiSwap (Base)", url: "https://app.sushi.com" },
      { protocolId: 4, networkId: 7, asset: "Base-3pool", apy: 11.8, tvl: 220000000, riskLevel: "low", details: "Stablecoin pool on Curve (Base)", url: "https://curve.fi" }
    ];
    
    for (const opportunity of opportunities) {
      await this.createOpportunity(opportunity);
    }
    
    // Initialize activities
    const activities = [
      { type: "opportunity", description: "Found new yield opportunity on Aave v3", details: { opportunityId: 1 }, userId: null },
      { type: "social", description: "Posted market update to Twitter", details: { platform: "twitter" }, userId: null },
      { type: "transaction", description: "Successfully executed stake on Compound", details: { protocolId: 2, amount: "0.5 ETH" }, userId: null }
    ];
    
    for (const activity of activities) {
      await this.createActivity(activity);
    }
    
    // Initialize agent configuration with parallel scanning
    const config = await this.createAgentConfiguration({
      scanFrequency: "hourly",
      riskTolerance: "low",
      networks: ["ethereum", "polygon", "bsc", "base"],
      postingMode: "approval",
      parallelScanning: true,
      maxAgents: 4,
      userId: null
    });
    
    // Create initial agent instances for the multi-agent architecture
    await this.createAgentInstance({
      name: "Yield Scanner Alpha",
      status: "idle",
      assignedProtocol: 1, // Aave v3
      assignedNetwork: 2, // Polygon
      currentTask: "Monitoring stablecoin pools",
      performance: { successRate: 98, lastFound: "2023-04-08T14:22:11Z", opportunitiesFound: 12 },
      configurationId: config.id
    });
    
    await this.createAgentInstance({
      name: "Yield Scanner Beta",
      status: "scanning",
      assignedProtocol: 3, // PancakeSwap
      assignedNetwork: 3, // BSC
      currentTask: "Scanning liquidity pools",
      performance: { successRate: 95, lastFound: "2023-04-08T20:15:46Z", opportunitiesFound: 9 },
      configurationId: config.id
    });
    
    await this.createAgentInstance({
      name: "Yield Scanner Gamma",
      status: "idle",
      assignedProtocol: 6, // Convex Finance
      assignedNetwork: 1, // Ethereum
      currentTask: "Waiting for next scan",
      performance: { successRate: 97, lastFound: "2023-04-08T12:03:22Z", opportunitiesFound: 7 },
      configurationId: config.id
    });
    
    // Create dedicated Base L2 liquidity pool scanner agent
    await this.createAgentInstance({
      name: "Base LP Scanner",
      status: "idle",
      assignedProtocol: 5, // SushiSwap 
      assignedNetwork: 7, // Base
      currentTask: "Monitoring Base liquidity pools",
      performance: { successRate: 99, lastFound: "2023-04-08T22:45:31Z", opportunitiesFound: 5 },
      configurationId: config.id
    });
    
    // Initialize sample yield farming strategies
    await this.createYieldStrategy({
      name: "High APY Stablecoin Strategy",
      description: "Automatically deposit to highest APY stablecoin pools across protocols",
      status: "active",
      userId: null,
      conditions: {
        minApy: 10,
        maxRisk: "medium",
        assetTypes: ["USDC", "USDT", "DAI"]
      },
      actions: {
        depositAmount: "1000 USDC",
        autoCompound: true,
        rebalancePeriod: "weekly"
      },
      maxGasFee: 50, // Max gas fee in USD
      triggerType: "apy-based",
      nextScheduledExecution: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      targetProtocols: [1, 2, 4], // Aave, Compound, Curve
      targetNetworks: [1, 2], // Ethereum, Polygon
      settings: {
        slippageTolerance: 0.5,
        notificationsEnabled: true,
        executionTimeWindow: {
          start: "09:00",
          end: "17:00"
        }
      }
    });
    
    await this.createYieldStrategy({
      name: "Base L2 LP Farming",
      description: "Farm liquidity pools on Base L2 with automatic compounding",
      status: "active",
      userId: null,
      conditions: {
        minApy: 20,
        maxRisk: "high",
        assetTypes: ["ETH-LP", "USDC-LP"]
      },
      actions: {
        depositAmount: "0.5 ETH",
        autoCompound: true,
        rebalancePeriod: "daily"
      },
      maxGasFee: 25, // Max gas fee in USD
      triggerType: "time-based",
      nextScheduledExecution: new Date(Date.now() + 8 * 60 * 60 * 1000), // 8 hours from now
      targetProtocols: [5], // SushiSwap
      targetNetworks: [7], // Base L2
      settings: {
        slippageTolerance: 1.0,
        notificationsEnabled: true,
        executionTimeWindow: {
          start: "00:00",
          end: "23:59"
        }
      }
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Protocol methods
  async getProtocols(): Promise<Protocol[]> {
    return Array.from(this.protocols.values());
  }

  async getProtocol(id: number): Promise<Protocol | undefined> {
    return this.protocols.get(id);
  }

  async createProtocol(protocol: InsertProtocol): Promise<Protocol> {
    const id = this.protocolId++;
    const newProtocol: Protocol = { ...protocol, id };
    this.protocols.set(id, newProtocol);
    return newProtocol;
  }

  // Network methods
  async getNetworks(): Promise<Network[]> {
    return Array.from(this.networks.values());
  }

  async getNetwork(id: number): Promise<Network | undefined> {
    return this.networks.get(id);
  }

  async createNetwork(network: InsertNetwork): Promise<Network> {
    const id = this.networkId++;
    const newNetwork: Network = { ...network, id };
    this.networks.set(id, newNetwork);
    return newNetwork;
  }

  // Opportunity methods
  async getOpportunities(): Promise<Opportunity[]> {
    return Array.from(this.opportunities.values());
  }

  async getOpportunity(id: number): Promise<Opportunity | undefined> {
    return this.opportunities.get(id);
  }

  async createOpportunity(opportunity: InsertOpportunity): Promise<Opportunity> {
    const id = this.opportunityId++;
    const timestamp = new Date();
    const newOpportunity: Opportunity = { ...opportunity, id, timestamp };
    this.opportunities.set(id, newOpportunity);
    return newOpportunity;
  }

  async getTopOpportunities(limit: number): Promise<Opportunity[]> {
    return Array.from(this.opportunities.values())
      .sort((a, b) => b.apy - a.apy)
      .slice(0, limit);
  }

  // Social post methods
  async getSocialPosts(): Promise<SocialPost[]> {
    return Array.from(this.socialPosts.values());
  }

  async getSocialPost(id: number): Promise<SocialPost | undefined> {
    return this.socialPosts.get(id);
  }

  async createSocialPost(post: InsertSocialPost): Promise<SocialPost> {
    const id = this.postId++;
    const timestamp = new Date();
    const newPost: SocialPost = { ...post, id, timestamp };
    this.socialPosts.set(id, newPost);
    
    // Create activity for the post
    this.createActivity({
      type: "social",
      description: `Posted update to ${post.platform}`,
      details: { postId: id },
      userId: null
    });
    
    return newPost;
  }

  // Activity methods
  async getActivities(): Promise<Activity[]> {
    return Array.from(this.activities.values());
  }

  async createActivity(activity: InsertActivity): Promise<Activity> {
    const id = this.activityId++;
    const timestamp = new Date();
    const newActivity: Activity = { ...activity, id, timestamp };
    this.activities.set(id, newActivity);
    return newActivity;
  }

  async getRecentActivities(limit: number): Promise<Activity[]> {
    return Array.from(this.activities.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  // Agent configuration methods
  async getAgentConfiguration(id: number): Promise<AgentConfiguration | undefined> {
    return this.agentConfigurations.get(id);
  }

  async createAgentConfiguration(config: InsertAgentConfiguration): Promise<AgentConfiguration> {
    const id = this.configId++;
    const newConfig: AgentConfiguration = { ...config, id };
    this.agentConfigurations.set(id, newConfig);
    return newConfig;
  }

  async updateAgentConfiguration(id: number, config: Partial<InsertAgentConfiguration>): Promise<AgentConfiguration | undefined> {
    const existingConfig = this.agentConfigurations.get(id);
    if (!existingConfig) return undefined;
    
    const updatedConfig: AgentConfiguration = { ...existingConfig, ...config };
    this.agentConfigurations.set(id, updatedConfig);
    return updatedConfig;
  }
  
  // Agent instance methods
  async getAgentInstances(): Promise<AgentInstance[]> {
    return Array.from(this.agentInstances.values());
  }
  
  async getAgentInstance(id: number): Promise<AgentInstance | undefined> {
    return this.agentInstances.get(id);
  }
  
  async getAgentInstancesByConfig(configId: number): Promise<AgentInstance[]> {
    return Array.from(this.agentInstances.values()).filter(
      instance => instance.configurationId === configId
    );
  }
  
  async createAgentInstance(instance: InsertAgentInstance): Promise<AgentInstance> {
    const id = this.instanceId++;
    const createdAt = new Date();
    const newInstance: AgentInstance = { 
      ...instance, 
      id, 
      createdAt,
      status: instance.status || "idle",
      lastScanTime: null 
    };
    
    this.agentInstances.set(id, newInstance);
    
    // Log agent creation
    this.createActivity({
      type: "agent",
      description: `Created new agent instance: ${instance.name}`,
      details: { agentId: id, protocol: instance.assignedProtocol },
      userId: null
    });
    
    return newInstance;
  }
  
  async updateAgentInstance(id: number, data: Partial<InsertAgentInstance>): Promise<AgentInstance | undefined> {
    const existingInstance = this.agentInstances.get(id);
    if (!existingInstance) return undefined;
    
    const updatedInstance: AgentInstance = { ...existingInstance, ...data };
    
    // If status changed to "scanning", update lastScanTime
    if (data.status === "scanning" && existingInstance.status !== "scanning") {
      updatedInstance.lastScanTime = new Date();
    }
    
    this.agentInstances.set(id, updatedInstance);
    return updatedInstance;
  }
  
  async deleteAgentInstance(id: number): Promise<boolean> {
    const instance = this.agentInstances.get(id);
    if (!instance) return false;
    
    this.agentInstances.delete(id);
    
    // Log agent deletion
    this.createActivity({
      type: "agent",
      description: `Deleted agent instance: ${instance.name}`,
      details: { agentId: id },
      userId: null
    });
    
    return true;
  }
  
  // Yield strategy methods
  async getYieldStrategies(userId?: number): Promise<YieldStrategy[]> {
    const strategies = Array.from(this.yieldStrategies.values());
    
    if (userId !== undefined) {
      return strategies.filter(strategy => strategy.userId === userId);
    }
    
    return strategies;
  }
  
  async getYieldStrategy(id: number): Promise<YieldStrategy | undefined> {
    return this.yieldStrategies.get(id);
  }
  
  async createYieldStrategy(strategy: InsertYieldStrategy): Promise<YieldStrategy> {
    const id = this.strategyId++;
    const createdAt = new Date();
    
    const newStrategy: YieldStrategy = {
      ...strategy,
      id,
      createdAt,
      status: strategy.status || "active",
      lastExecutedAt: null,
      totalExecutions: 0,
      executionResults: {},
      totalInvested: 0,
      totalReturn: 0
    };
    
    this.yieldStrategies.set(id, newStrategy);
    
    // Log strategy creation
    this.createActivity({
      type: "strategy",
      description: `Created new yield farming strategy: ${strategy.name}`,
      details: { 
        strategyId: id, 
        triggerType: strategy.triggerType,
        targetProtocols: strategy.targetProtocols,
        targetNetworks: strategy.targetNetworks
      },
      userId: strategy.userId
    });
    
    return newStrategy;
  }
  
  async updateYieldStrategy(id: number, data: Partial<InsertYieldStrategy>): Promise<YieldStrategy | undefined> {
    const existingStrategy = this.yieldStrategies.get(id);
    if (!existingStrategy) return undefined;
    
    const updatedStrategy: YieldStrategy = { ...existingStrategy, ...data };
    this.yieldStrategies.set(id, updatedStrategy);
    
    // Log strategy update
    this.createActivity({
      type: "strategy",
      description: `Updated yield farming strategy: ${existingStrategy.name}`,
      details: { strategyId: id },
      userId: existingStrategy.userId
    });
    
    return updatedStrategy;
  }
  
  async deleteYieldStrategy(id: number): Promise<boolean> {
    const strategy = this.yieldStrategies.get(id);
    if (!strategy) return false;
    
    this.yieldStrategies.delete(id);
    
    // Log strategy deletion
    this.createActivity({
      type: "strategy",
      description: `Deleted yield farming strategy: ${strategy.name}`,
      details: { strategyId: id },
      userId: strategy.userId
    });
    
    return true;
  }
  
  // Strategy execution methods
  async getStrategyExecutions(strategyId?: number): Promise<StrategyExecution[]> {
    const executions = Array.from(this.strategyExecutions.values());
    
    if (strategyId !== undefined) {
      return executions.filter(execution => execution.strategyId === strategyId);
    }
    
    return executions;
  }
  
  async getStrategyExecution(id: number): Promise<StrategyExecution | undefined> {
    return this.strategyExecutions.get(id);
  }
  
  async createStrategyExecution(execution: InsertStrategyExecution): Promise<StrategyExecution> {
    const id = this.executionId++;
    const executedAt = new Date();
    
    const newExecution: StrategyExecution = {
      ...execution,
      id,
      executedAt
    };
    
    this.strategyExecutions.set(id, newExecution);
    
    // Update the strategy with execution result
    const strategy = this.yieldStrategies.get(execution.strategyId);
    if (strategy) {
      strategy.lastExecutedAt = executedAt;
      strategy.totalExecutions++;
      
      // Update execution results history
      if (strategy.executionResults) {
        const executionResults = { ...strategy.executionResults };
        executionResults[id] = {
          status: execution.status,
          executedAt,
          transactionHash: execution.transactionHash,
          details: execution.details
        };
        strategy.executionResults = executionResults;
      } else {
        strategy.executionResults = {
          [id]: {
            status: execution.status,
            executedAt,
            transactionHash: execution.transactionHash,
            details: execution.details
          }
        };
      }
      
      this.yieldStrategies.set(strategy.id, strategy);
    }
    
    return newExecution;
  }
  
  async executeYieldStrategy(strategyId: number): Promise<StrategyExecution> {
    const strategy = this.yieldStrategies.get(strategyId);
    if (!strategy) {
      throw new Error(`Strategy with ID ${strategyId} not found`);
    }
    
    // Find the best opportunity from the target protocols and networks
    const targetProtocols = strategy.targetProtocols as number[];
    const targetNetworks = strategy.targetNetworks as number[];
    
    const eligibleOpportunities = Array.from(this.opportunities.values())
      .filter(opp => 
        targetProtocols.includes(opp.protocolId) && 
        targetNetworks.includes(opp.networkId)
      )
      .sort((a, b) => b.apy - a.apy);
    
    if (eligibleOpportunities.length === 0) {
      // No eligible opportunity found
      return this.createStrategyExecution({
        strategyId,
        status: "failed",
        transactionHash: null,
        gasUsed: null,
        gasFee: null,
        opportunityId: null,
        details: { reason: "No eligible opportunities found" },
        errorMessage: "No eligible opportunities found matching strategy criteria"
      });
    }
    
    // Select the best opportunity
    const bestOpportunity = eligibleOpportunities[0];
    
    // Create a transaction execution record
    const protocol = this.protocols.get(bestOpportunity.protocolId);
    const network = this.networks.get(bestOpportunity.networkId);
    
    // Simulate transaction execution
    const gasFee = Math.random() * 0.01; // Simulated gas fee
    const gasUsed = Math.floor(Math.random() * 200000); // Simulated gas used
    const transactionHash = `0x${Math.random().toString(16).substring(2)}${Math.random().toString(16).substring(2)}`;
    
    // Update strategy totals (for simulation)
    const investmentAmount = 1.0; // 1 ETH for example
    strategy.totalInvested += investmentAmount;
    strategy.totalReturn += (investmentAmount * bestOpportunity.apy) / 100 / 365; // Daily return
    
    this.yieldStrategies.set(strategy.id, strategy);
    
    // Log strategy execution
    this.createActivity({
      type: "transaction",
      description: `Executed yield strategy "${strategy.name}" on ${protocol?.name || 'Unknown protocol'} (${network?.name || 'Unknown network'})`,
      details: { 
        strategyId,
        opportunityId: bestOpportunity.id,
        apy: bestOpportunity.apy,
        asset: bestOpportunity.asset,
        transactionHash
      },
      userId: strategy.userId
    });
    
    return this.createStrategyExecution({
      strategyId,
      status: "success",
      transactionHash,
      gasUsed,
      gasFee,
      opportunityId: bestOpportunity.id,
      details: {
        protocolId: bestOpportunity.protocolId,
        networkId: bestOpportunity.networkId,
        asset: bestOpportunity.asset,
        apy: bestOpportunity.apy,
        amount: investmentAmount
      },
      errorMessage: null
    });
  }
}

// Create and export the storage instance
export const storage = new MemStorage();
