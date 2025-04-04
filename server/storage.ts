import { 
  users, protocols, networks, opportunities, socialPosts, activities, agentConfigurations,
  type User, type InsertUser, 
  type Protocol, type InsertProtocol,
  type Network, type InsertNetwork,
  type Opportunity, type InsertOpportunity,
  type SocialPost, type InsertSocialPost,
  type Activity, type InsertActivity,
  type AgentConfiguration, type InsertAgentConfiguration
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
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private protocols: Map<number, Protocol>;
  private networks: Map<number, Network>;
  private opportunities: Map<number, Opportunity>;
  private socialPosts: Map<number, SocialPost>;
  private activities: Map<number, Activity>;
  private agentConfigurations: Map<number, AgentConfiguration>;
  
  private userId: number;
  private protocolId: number;
  private networkId: number;
  private opportunityId: number;
  private postId: number;
  private activityId: number;
  private configId: number;

  constructor() {
    this.users = new Map();
    this.protocols = new Map();
    this.networks = new Map();
    this.opportunities = new Map();
    this.socialPosts = new Map();
    this.activities = new Map();
    this.agentConfigurations = new Map();
    
    this.userId = 1;
    this.protocolId = 1;
    this.networkId = 1;
    this.opportunityId = 1;
    this.postId = 1;
    this.activityId = 1;
    this.configId = 1;
    
    // Initialize with sample data for demo
    this.initializeData();
  }

  private initializeData() {
    // Initialize networks
    const networks = [
      { name: "Ethereum", shortName: "ETH", logo: "E", isActive: true },
      { name: "Polygon", shortName: "MATIC", logo: "P", isActive: true },
      { name: "Binance Smart Chain", shortName: "BSC", logo: "B", isActive: true },
      { name: "Arbitrum", shortName: "ARB", logo: "A", isActive: true },
      { name: "Optimism", shortName: "OP", logo: "O", isActive: true },
      { name: "Solana", shortName: "SOL", logo: "S", isActive: true }
    ];
    
    networks.forEach(network => this.createNetwork(network));
    
    // Initialize protocols
    const protocols = [
      { name: "Aave v3", logo: "AAVE", website: "https://aave.com", description: "Decentralized lending protocol", riskLevel: "low" },
      { name: "Compound", logo: "COMP", website: "https://compound.finance", description: "Decentralized lending protocol", riskLevel: "low" },
      { name: "PancakeSwap", logo: "CAKE", website: "https://pancakeswap.finance", description: "AMM and yield farming", riskLevel: "medium" },
      { name: "Curve Finance", logo: "CRV", website: "https://curve.fi", description: "Stablecoin AMM", riskLevel: "low" },
      { name: "SushiSwap", logo: "SUSHI", website: "https://sushi.com", description: "DEX and yield farming", riskLevel: "medium" },
      { name: "Convex Finance", logo: "CVX", website: "https://convexfinance.com", description: "Curve yield booster", riskLevel: "medium" }
    ];
    
    protocols.forEach(protocol => this.createProtocol(protocol));
    
    // Initialize opportunities
    const opportunities = [
      { protocolId: 1, networkId: 2, asset: "USDC", apy: 18.4, tvl: 500000000, riskLevel: "low", details: "Lending USDC on Aave v3", url: "https://app.aave.com" },
      { protocolId: 2, networkId: 1, asset: "ETH", apy: 12.9, tvl: 800000000, riskLevel: "medium", details: "Lending ETH on Compound", url: "https://app.compound.finance" },
      { protocolId: 3, networkId: 3, asset: "CAKE-BNB LP", apy: 34.5, tvl: 150000000, riskLevel: "high", details: "LP farming on PancakeSwap", url: "https://pancakeswap.finance" },
      { protocolId: 4, networkId: 1, asset: "3pool", apy: 8.2, tvl: 950000000, riskLevel: "low", details: "Stablecoin pool on Curve", url: "https://curve.fi" },
      { protocolId: 5, networkId: 2, asset: "SUSHI-ETH LP", apy: 22.7, tvl: 120000000, riskLevel: "medium", details: "LP farming on SushiSwap", url: "https://app.sushi.com" },
      { protocolId: 6, networkId: 1, asset: "cvxCRV", apy: 15.6, tvl: 730000000, riskLevel: "medium", details: "Staking on Convex", url: "https://convexfinance.com" }
    ];
    
    opportunities.forEach(opportunity => this.createOpportunity(opportunity));
    
    // Initialize activities
    const activities = [
      { type: "opportunity", description: "Found new yield opportunity on Aave v3", details: { opportunityId: 1 }, userId: null },
      { type: "social", description: "Posted market update to Twitter", details: { platform: "twitter" }, userId: null },
      { type: "transaction", description: "Successfully executed stake on Compound", details: { protocolId: 2, amount: "0.5 ETH" }, userId: null }
    ];
    
    activities.forEach(activity => this.createActivity(activity));
    
    // Initialize agent configuration
    this.createAgentConfiguration({
      scanFrequency: "hourly",
      riskTolerance: "low",
      networks: ["ethereum", "polygon", "bsc"],
      postingMode: "approval",
      userId: null
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
}

// Create and export the storage instance
export const storage = new MemStorage();
