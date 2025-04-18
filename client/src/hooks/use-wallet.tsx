import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { ethereumService } from "@/lib/ethereum";
import { injectedConnector, walletConnectConnector, WalletType } from "@/lib/wallet-connectors";

export interface WalletState {
  address: string;
  balance: string;
  connected: boolean;
  connectorType?: WalletType;
}

interface WalletContextType {
  walletState: WalletState | null;
  isConnecting: boolean;
  isDisconnecting: boolean;
  isSwitchingNetwork: boolean;
  connect: (walletType?: WalletType) => Promise<WalletState>;
  disconnect: () => Promise<void>;
  depositToProtocol: (protocolName: string, amount: string) => Promise<{
    success: boolean;
    transactionHash: string;
  }>;
}

// Create default context values to avoid null checks
const defaultContextValue: WalletContextType = {
  walletState: null,
  isConnecting: false,
  isDisconnecting: false,
  isSwitchingNetwork: false,
  connect: async () => {
    throw new Error("WalletProvider not initialized");
  },
  disconnect: async () => {
    throw new Error("WalletProvider not initialized");
  },
  depositToProtocol: async () => {
    throw new Error("WalletProvider not initialized");
  }
};

const WalletContext = createContext<WalletContextType>(defaultContextValue);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [walletState, setWalletState] = useState<WalletState | null>(null);
  const [isSwitchingNetwork, setIsSwitchingNetwork] = useState(false);
  const { toast } = useToast();

  // Check for existing connection on load
  useEffect(() => {
    const checkConnection = async () => {
      try {
        if (ethereumService.isMetaMaskInstalled() && await ethereumService.isConnected()) {
          const { address, balance } = await ethereumService.connectWallet();
          setWalletState({
            address,
            balance,
            connected: true,
            connectorType: 'metamask'
          });
        }
      } catch (error) {
        console.error("Error checking connection:", error);
      }
    };

    checkConnection();
  }, []);

  // Handle MetaMask account changes
  useEffect(() => {
    if (typeof window !== 'undefined' && window.ethereum) {
      const handleAccountsChanged = async (accounts: string[]) => {
        if (accounts.length === 0) {
          // User disconnected their wallet
          setWalletState(null);
        } else if (walletState && accounts[0] !== walletState.address) {
          // User switched accounts
          try {
            const balance = await ethereumService.getBalance();
            setWalletState({
              address: accounts[0],
              balance,
              connected: true,
              connectorType: 'metamask'
            });
          } catch (error) {
            console.error("Error updating account:", error);
          }
        }
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      };
    }
  }, [walletState]);

  const connectMutation = useMutation({
    mutationFn: async () => {
      const result = await api.wallet.connect();
      return result;
    }
  });

  const disconnectMutation = useMutation({
    mutationFn: async () => {
      return await api.wallet.disconnect();
    }
  });

  const depositMutation = useMutation({
    mutationFn: async ({ opportunityId, amount }: { opportunityId: number, amount: string }) => {
      if (!walletState?.connected) {
        throw new Error("Wallet not connected");
      }
      
      return await api.transaction.execute({ opportunityId, amount });
    },
    onSuccess: (data) => {
      toast({
        title: "Deposit Successful",
        description: `Transaction completed: ${data.transactionHash.substring(0, 6)}...${data.transactionHash.substring(
          data.transactionHash.length - 4
        )}`,
      });
    },
    onError: (error) => {
      toast({
        title: "Deposit Failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    },
  });

  const connect = async (walletType: WalletType = 'metamask') => {
    setIsSwitchingNetwork(true);
    try {
      // If wallet is already connected, disconnect first
      if (walletState?.connected) {
        await disconnect();
      }
      
      let result: WalletState;
      
      if (walletType === 'walletconnect' || walletType === 'smartwallet') {
        // For testing, use simulated API connection
        const apiResult = await api.wallet.connect();
        result = {
          ...apiResult,
          connected: true,
          connectorType: walletType
        };
      } else {
        // Default to MetaMask/Injected
        try {
          const apiResult = await api.wallet.connect();
          result = {
            ...apiResult,
            connected: true,
            connectorType: 'metamask'
          };
        } catch (error) {
          console.error('MetaMask error:', error);
          throw error;
        }
      }
      
      setWalletState(result);
      
      toast({
        title: "Wallet Connected",
        description: `Connected to ${result.address.substring(0, 6)}...${result.address.substring(
          result.address.length - 4
        )}`,
      });
      
      return result;
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsSwitchingNetwork(false);
    }
  };

  const disconnect = async () => {
    try {
      // Handle different wallet types
      if (walletState?.connectorType === 'walletconnect' || walletState?.connectorType === 'smartwallet') {
        console.log(`Disconnecting ${walletState.connectorType} wallet`);
      } else if (walletState?.connectorType === 'metamask') {
        console.log('Disconnecting MetaMask wallet');
      }
      
      // Call API
      await disconnectMutation.mutateAsync();
      
      // Reset state
      setWalletState(null);
      
      toast({
        title: "Wallet Disconnected",
        description: "Your wallet has been disconnected",
      });
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
      toast({
        title: "Disconnect Failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
      throw error;
    }
  };

  const depositToProtocol = async (protocolName: string, amount: string) => {
    if (walletState?.connectorType === 'smartwallet') {
      console.log('Using Smart Wallet for enhanced transaction handling');
    }
    
    return await depositMutation.mutateAsync({ opportunityId: 1, amount });
  };

  const contextValue: WalletContextType = {
    walletState,
    isConnecting: connectMutation.isPending,
    isDisconnecting: disconnectMutation.isPending,
    isSwitchingNetwork,
    connect,
    disconnect,
    depositToProtocol
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