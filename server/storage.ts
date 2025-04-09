import { 
  users, protocols, networks, opportunities, socialPosts, activities, agentConfigurations, agentInstances,
  type User, type InsertUser, 
  type Protocol, type InsertProtocol,
  type Network, type InsertNetwork,
  type Opportunity, type InsertOpportunity,
  type SocialPost, type InsertSocialPost,
  type Activity, type InsertActivity,
  type AgentConfiguration, type InsertAgentConfiguration,
  type AgentInstance, type InsertAgentInstance
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
  
  private userId: number;
  private protocolId: number;
  private networkId: number;
  private opportunityId: number;
  private postId: number;
  private activityId: number;
  private configId: number;
  private instanceId: number;

  constructor() {
    this.users = new Map();
    this.protocols = new Map();
    this.networks = new Map();
    this.opportunities = new Map();
    this.socialPosts = new Map();
    this.activities = new Map();
    this.agentConfigurations = new Map();
    this.agentInstances = new Map();
    
    this.userId = 1;
    this.protocolId = 1;
    this.networkId = 1;
    this.opportunityId = 1;
    this.postId = 1;
    this.activityId = 1;
    this.configId = 1;
    this.instanceId = 1;
    
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
      { name: "Solana", shortName: "SOL", logo: "S", isActive: true },
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
}

// Create and export the storage instance
export const storage = new MemStorage();
