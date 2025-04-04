import { apiRequest } from "@/lib/queryClient";

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

// API functions to interact with the backend
export const api = {
  // Wallet functions
  wallet: {
    connect: async (address: string) => {
      const response = await apiRequest("POST", "/api/wallet/connect", { address });
      return response.json();
    },
    disconnect: async () => {
      const response = await apiRequest("POST", "/api/wallet/disconnect", {});
      return response.json();
    }
  },
  
  // Transaction functions
  transaction: {
    execute: async ({ opportunityId, amount }: TransactionParams) => {
      const response = await apiRequest("POST", "/api/transaction", { opportunityId, amount });
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
  
  // Agent configuration
  agent: {
    updateConfig: async (params: AgentConfigParams) => {
      const response = await apiRequest("PUT", "/api/agent-configuration", params);
      return response.json();
    }
  }
};
