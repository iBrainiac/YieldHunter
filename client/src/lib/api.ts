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
    
    // Get transaction history
    getHistory: async () => {
      const response = await apiRequest("GET", "/api/transactions");
      return response.json();
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
    }
  }
};
