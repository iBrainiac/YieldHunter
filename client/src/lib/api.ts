import { apiRequest } from "@/lib/queryClient";
import { ethereumService } from "@/lib/ethereum";

interface TransactionParams {
  opportunityId: number;
  amount: string;
}

interface GeneratePostParams {
  opportunityIds?: number[];
}

interface PostSocialParams {
  platform: string;
  content: string;
  status: string;
  scheduledAt?: string | null;
  opportunityId?: number | null;
}

interface AgentConfigParams {
  scanFrequency?: string;
  riskTolerance?: string;
  networks?: string[];
  postingMode?: string;
  parallelScanning?: boolean;
  maxAgents?: number;
}

interface YieldStrategyParams {
  name: string;
  description?: string;
  triggerType: string;
  targetProtocols: number[];
  targetNetworks: number[];
  conditions: Record<string, any>;
  actions: Record<string, any>;
  maxGasFee?: number;
  nextScheduledExecution?: Date;
  settings?: Record<string, any>;
}

// Add protocols and networks API functions
export const protocolsApi = {
  getAll: async () => {
    const response = await apiRequest("GET", "/api/protocols");
    return response.json();
  },
  
  get: async (id: number) => {
    const response = await apiRequest("GET", `/api/protocols/${id}`);
    return response.json();
  }
};

export const networksApi = {
  getAll: async () => {
    const response = await apiRequest("GET", "/api/networks");
    return response.json();
  },
  
  get: async (id: number) => {
    const response = await apiRequest("GET", `/api/networks/${id}`);
    return response.json();
  }
};

// API functions to interact with the backend
export const api = {
  // Wallet functions
  wallet: {
    connect: async () => {
      try {
        if (!ethereumService.isMetaMaskInstalled()) {
          throw new Error("MetaMask is not installed. Please install MetaMask extension to connect your wallet.");
        }
        
        // Connect to wallet
        const walletData = await ethereumService.connectWallet();
        
        // Switch to the appropriate testnet
        await ethereumService.switchToTestnet();
        
        // Record the connection in the backend
        const response = await apiRequest("POST", "/api/wallet/connect", { 
          address: walletData.address 
        });
        
        // Return wallet state with data from both MetaMask and backend
        return {
          ...walletData,
          connected: true
        };
      } catch (error) {
        console.error("Error connecting wallet:", error);
        throw error;
      }
    },
    
    disconnect: async () => {
      // Clear local wallet state
      ethereumService.disconnect();
      
      // Inform backend about disconnect
      const response = await apiRequest("POST", "/api/wallet/disconnect", {});
      return { connected: false };
    }
  },
  
  // Transaction functions
  transaction: {
    execute: async ({ opportunityId, amount }: TransactionParams) => {
      try {
        // Get opportunity details from backend
        const res = await apiRequest("GET", `/api/opportunities/${opportunityId}`);
        const opportunity = await res.json();
        
        if (!opportunity) {
          throw new Error("Opportunity not found");
        }
        
        // Get protocol name for the deposit
        const protocolRes = await apiRequest("GET", `/api/protocols/${opportunity.protocolId}`);
        const protocol = await protocolRes.json();
        
        if (!protocol) {
          throw new Error("Protocol not found");
        }
        
        console.log(`Executing deposit of ${amount} to ${protocol.name} on ${opportunity.asset}`);
        
        // Execute the transaction through the blockchain
        const result = await ethereumService.depositToProtocol(
          protocol.name, // Using the protocol name to find the address in the service
          amount
        );
        
        console.log(`Transaction successful: ${result.transactionHash}`);
        
        // Log the transaction in our system
        await apiRequest("POST", "/api/transaction", {
          opportunityId,
          amount,
          transactionHash: result.transactionHash
        });
        
        return result;
      } catch (error) {
        console.error("Transaction error:", error);
        throw error;
      }
    },
    
    // Withdraw funds from a protocol
    withdraw: async ({ opportunityId, amount }: TransactionParams) => {
      try {
        // Get opportunity details from backend
        const res = await apiRequest("GET", `/api/opportunities/${opportunityId}`);
        const opportunity = await res.json();
        
        if (!opportunity) {
          throw new Error("Opportunity not found");
        }
        
        // Get protocol name for the withdrawal
        const protocolRes = await apiRequest("GET", `/api/protocols/${opportunity.protocolId}`);
        const protocol = await protocolRes.json();
        
        if (!protocol) {
          throw new Error("Protocol not found");
        }
        
        console.log(`Executing withdrawal of ${amount} from ${protocol.name} on ${opportunity.asset}`);
        
        // Execute the withdrawal transaction through the blockchain
        const result = await ethereumService.withdrawFromProtocol(
          protocol.name,
          amount
        );
        
        console.log(`Withdrawal successful: ${result.transactionHash}`);
        
        // Log the transaction in our system
        await apiRequest("POST", "/api/transaction", {
          opportunityId,
          amount,
          type: "withdrawal",
          transactionHash: result.transactionHash
        });
        
        return result;
      } catch (error) {
        console.error("Withdrawal error:", error);
        throw error;
      }
    },
    
    // Get transaction history
    getHistory: async () => {
      const response = await apiRequest("GET", "/api/transactions");
      return response.json();
    },
    
    // Get opportunities
    getOpportunities: async () => {
      const response = await apiRequest("GET", "/api/opportunities");
      return response.json();
    },
    
    // Get wallet balance
    getWalletBalance: async () => {
      try {
        const balance = await ethereumService.getWalletBalance();
        return balance;
      } catch (error) {
        console.error("Error fetching wallet balance:", error);
        throw error;
      }
    }
  },
  
  // Social post functions
  social: {
    generatePost: async (params?: GeneratePostParams) => {
      const response = await apiRequest("POST", "/api/social-posts/generate", params || {});
      return response.json();
    },
    postToSocial: async (params: PostSocialParams) => {
      const response = await apiRequest("POST", "/api/social-posts", params);
      return response.json();
    }
  },
  
  // Agent configuration and instances
  agent: {
    // Configuration methods
    getConfig: async () => {
      const response = await apiRequest("GET", "/api/agent-configuration");
      return response.json();
    },
    
    updateConfig: async (params: AgentConfigParams) => {
      const response = await apiRequest("PUT", "/api/agent-configuration", params);
      return response.json();
    },
    
    // Multi-agent instance methods
    getInstances: async () => {
      const response = await apiRequest("GET", "/api/agent-instances");
      return response.json();
    },
    
    getInstance: async (id: number) => {
      const response = await apiRequest("GET", `/api/agent-instances/${id}`);
      return response.json();
    },
    
    createInstance: async (data: {
      name: string;
      assignedProtocol?: number;
      assignedNetwork?: number;
      configurationId: number;
    }) => {
      const response = await apiRequest("POST", "/api/agent-instances", data);
      return response.json();
    },
    
    updateInstance: async (id: number, data: {
      name?: string;
      status?: string;
      assignedProtocol?: number;
      assignedNetwork?: number;
      currentTask?: string;
    }) => {
      const response = await apiRequest("PUT", `/api/agent-instances/${id}`, data);
      return response.json();
    },
    
    deleteInstance: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/agent-instances/${id}`);
      return response.json();
    },
    
    startScan: async (id: number) => {
      const response = await apiRequest("POST", `/api/agent-instances/${id}/scan`);
      return response.json();
    },
    
    // Start parallel scanning with multiple agents
    startParallelScan: async (configId: number = 1) => {
      const response = await apiRequest("POST", "/api/parallel-scan", { configurationId: configId });
      return response.json();
    }
  },
  
  // Automated yield farming strategies
  yieldStrategy: {
    // Get all strategies
    getAll: async (userId?: number) => {
      const url = userId ? `/api/yield-strategies?userId=${userId}` : "/api/yield-strategies";
      const response = await apiRequest("GET", url);
      return response.json();
    },
    
    // Get a specific strategy
    get: async (id: number) => {
      const response = await apiRequest("GET", `/api/yield-strategies/${id}`);
      return response.json();
    },
    
    // Create a new strategy
    create: async (data: YieldStrategyParams) => {
      const response = await apiRequest("POST", "/api/yield-strategies", data);
      return response.json();
    },
    
    // Update an existing strategy
    update: async (id: number, data: Partial<YieldStrategyParams>) => {
      const response = await apiRequest("PUT", `/api/yield-strategies/${id}`, data);
      return response.json();
    },
    
    // Delete a strategy
    delete: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/yield-strategies/${id}`);
      return response.json();
    },
    
    // Execute a strategy
    execute: async (id: number) => {
      const response = await apiRequest("POST", `/api/yield-strategies/${id}/execute`);
      return response.json();
    },
    
    // Get executions for a strategy
    getExecutions: async (id: number) => {
      const response = await apiRequest("GET", `/api/yield-strategies/${id}/executions`);
      return response.json();
    },
    
    // Get all executions
    getAllExecutions: async () => {
      const response = await apiRequest("GET", "/api/strategy-executions");
      return response.json();
    }
  },
  
  // OpenAI-powered functionality
  ai: {
    // Chatbot interaction
    sendChatMessage: async (message: string, history: Array<{role: string, content: string}> = []) => {
      const response = await apiRequest("POST", "/api/chatbot/message", { message, history });
      return response.json();
    },
    
    // Analyze a yield opportunity
    analyzeOpportunity: async (data: {
      protocolName: string;
      asset: string;
      apy: number;
      riskLevel: string;
      networkName: string;
    }) => {
      const response = await apiRequest("POST", "/api/analyze/opportunity", data);
      return response.json();
    },
    
    // Generate a yield strategy
    generateStrategy: async (data: {
      riskProfile: string;
      assets: string[];
      networks: string[];
      investmentAmount: number;
    }) => {
      const response = await apiRequest("POST", "/api/generate/strategy", data);
      return response.json();
    },
    
    // Analyze market trends
    analyzeMarketTrends: async (data: {
      recentTrends: string[];
      topPerformingAssets: string[];
      timeframe: string;
    }) => {
      const response = await apiRequest("POST", "/api/analyze/market", data);
      return response.json();
    },
    
    // Generate educational content
    generateEducation: async (data: {
      topic: string;
      complexityLevel: string;
    }) => {
      const response = await apiRequest("POST", "/api/generate/education", data);
      return response.json();
    }
  },
  
  // WebSocket connection for real-time data
  ws: {
    connect: () => {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      const socket = new WebSocket(wsUrl);
      
      return {
        socket,
        onOpen: (callback: () => void) => {
          socket.addEventListener('open', callback);
        },
        onMessage: (callback: (data: any) => void) => {
          socket.addEventListener('message', (event) => {
            try {
              const data = JSON.parse(event.data);
              callback(data);
            } catch (error) {
              console.error('Error parsing WebSocket message:', error);
            }
          });
        },
        onClose: (callback: () => void) => {
          socket.addEventListener('close', callback);
        },
        onError: (callback: (error: Event) => void) => {
          socket.addEventListener('error', callback);
        },
        send: (data: any) => {
          if (socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify(data));
          } else {
            console.error('WebSocket is not open. Current state:', socket.readyState);
          }
        },
        close: () => {
          socket.close();
        }
      };
    }
  }
};
