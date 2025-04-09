import React, { createContext, useContext, useState, ReactNode } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export interface WalletState {
  address: string;
  balance: string;
  connected: boolean;
}

interface WalletContextType {
  walletState: WalletState | null;
  isConnecting: boolean;
  isDisconnecting: boolean;
  connect: () => Promise<WalletState>;
  disconnect: () => Promise<void>;
}

// Create default context values to avoid null checks
const defaultContextValue: WalletContextType = {
  walletState: null,
  isConnecting: false,
  isDisconnecting: false,
  connect: async () => {
    throw new Error("WalletProvider not initialized");
  },
  disconnect: async () => {
    throw new Error("WalletProvider not initialized");
  }
};

const WalletContext = createContext<WalletContextType>(defaultContextValue);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [walletState, setWalletState] = useState<WalletState | null>(null);
  const { toast } = useToast();

  const connectMutation = useMutation({
    mutationFn: async () => {
      // In a real app, this would connect to MetaMask or other wallet
      // For demo purposes, we'll use our mock API endpoint
      const mockAddress = "0x" + Math.random().toString(16).substring(2, 42);
      const response = await apiRequest("POST", "/api/wallet/connect", {
        address: mockAddress,
      });
      return response.json();
    },
    onSuccess: (data) => {
      setWalletState(data);
      toast({
        title: "Wallet Connected",
        description: `Connected to ${data.address.substring(0, 6)}...${data.address.substring(
          data.address.length - 4
        )}`,
      });
    },
    onError: (error) => {
      toast({
        title: "Connection Failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/wallet/disconnect", {});
      return response.json();
    },
    onSuccess: () => {
      setWalletState(null);
      toast({
        title: "Wallet Disconnected",
        description: "Your wallet has been disconnected",
      });
    },
  });

  const connect = async () => {
    const result = await connectMutation.mutateAsync();
    return result;
  };

  const disconnect = async () => {
    await disconnectMutation.mutateAsync();
  };

  const contextValue = {
    walletState,
    isConnecting: connectMutation.isPending,
    isDisconnecting: disconnectMutation.isPending,
    connect,
    disconnect,
  };

  return (
    <WalletContext.Provider value={contextValue}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  return context;
}