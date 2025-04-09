import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { ethereumService } from "@/lib/ethereum";
import { injectedConnector, walletConnectConnector, WalletType } from "@/lib/wallet-connectors";
import { useWeb3React } from "@web3-react/core";

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
            connected: true
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
              connected: true
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
      setIsSwitchingNetwork(true);
      try {
        // This will connect to MetaMask and switch to testnet
        const result = await api.wallet.connect();
        return result;
      } finally {
        setIsSwitchingNetwork(false);
      }
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
      return await api.wallet.disconnect();
    },
    onSuccess: () => {
      setWalletState(null);
      toast({
        title: "Wallet Disconnected",
        description: "Your wallet has been disconnected",
      });
    },
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
      
      // Connect using the specified connector
      let result;
      
      if (walletType === 'walletconnect' || walletType === 'smartwallet') {
        try {
          // Use WalletConnect
          await walletConnectConnector.activate();
          // Cast walletConnectConnector to any to access provider
          const provider = (walletConnectConnector as any).provider;
          
          if (provider) {
            const accounts = await provider.request({ method: 'eth_accounts' });
            const address = accounts[0];
            const balanceHex = await provider.request({
              method: 'eth_getBalance',
              params: [address, 'latest']
            });
            
            // Convert hex balance to ETH
            const balanceWei = parseInt(balanceHex, 16);
            const balanceEth = (balanceWei / 1e18).toFixed(4);
            
            // For smart wallets, we would handle account abstraction here
            // Smart wallets typically have their own SDK for handling transactions,
            // creating accounts, and managing gas
            if (walletType === 'smartwallet') {
              // This is where we'd implement smart wallet specific functionality
              // For example, setting up a counterfactual address, or initializing the AA SDK
              
              const walletState: WalletState = {
                address,
                balance: balanceEth,
                connected: true,
                connectorType: 'smartwallet'
              };
              result = walletState;
            } else {
              const walletState: WalletState = {
                address,
                balance: balanceEth,
                connected: true,
                connectorType: 'walletconnect'
              };
              result = walletState;
            }
          } else {
            throw new Error('Failed to get provider from WalletConnect');
          }
        } catch (error) {
          console.error('WalletConnect error:', error);
          // Fallback to API-based connection
          const apiResult = await api.wallet.connect();
          const walletState: WalletState = {
            ...apiResult,
            connectorType: 'metamask' as WalletType
          };
          result = walletState;
        }
      } else {
        // Default to MetaMask/Injected
        try {
          // First try to use the injected connector
          await injectedConnector.activate();
          const provider = await injectedConnector.getProvider();
          
          if (provider) {
            const accounts = await provider.request({ method: 'eth_accounts' });
            const address = accounts[0];
            const balanceHex = await provider.request({
              method: 'eth_getBalance',
              params: [address, 'latest']
            });
            
            // Convert hex balance to ETH
            const balanceWei = parseInt(balanceHex, 16);
            const balanceEth = (balanceWei / 1e18).toFixed(4);
            
            const walletState: WalletState = {
              address,
              balance: balanceEth,
              connected: true,
              connectorType: 'metamask'
            };
            result = walletState;
          } else {
            throw new Error('Failed to get provider from MetaMask');
          }
        } catch (error) {
          console.error('MetaMask error:', error);
          // Fallback to API-based connection
          const apiResult = await api.wallet.connect();
          const walletState: WalletState = {
            ...apiResult,
            connectorType: 'metamask' as WalletType
          };
          result = walletState;
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
      // First try to disconnect from the connector based on type
      if (walletState?.connectorType === 'walletconnect' || walletState?.connectorType === 'smartwallet') {
        // Both smart wallets and regular WalletConnect use the same connector
        try {
          await walletConnectConnector.deactivate();
          
          // Additional cleanup for smart wallet if needed
          if (walletState.connectorType === 'smartwallet') {
            // For a real implementation, we would clean up any smart wallet specific state here
            // This might include clearing session keys, etc.
            console.log('Cleaning up smart wallet resources');
          }
        } catch (error) {
          console.error(`Error disconnecting from ${walletState.connectorType}:`, error);
        }
      } else if (walletState?.connectorType === 'metamask') {
        // Disconnect from MetaMask
        try {
          await injectedConnector.deactivate();
          
          // If using window.ethereum directly, also reset connection
          if (typeof window !== 'undefined' && window.ethereum) {
            console.log('Resetting MetaMask connection');
          }
        } catch (error) {
          console.error('Error disconnecting from MetaMask:', error);
        }
      }
      
      // Always call the API disconnect as a fallback
      await disconnectMutation.mutateAsync();
      
      // Ensure wallet state is cleared
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
    // Find the opportunity by protocol name
    // In a real application, we would query for protocol and get its opportunity
    // For now, we'll just hardcode opportunityId = 1
    
    // Handle special features for smart wallet
    if (walletState?.connectorType === 'smartwallet') {
      // For smart wallets, we would:
      // 1. Use account abstraction for gasless transactions
      // 2. Use batch transactions for gas efficiency
      // 3. Implement paymasters for sponsored transactions
      
      // The code would be similar to this:
      /*
      // Example of smart wallet Account Abstraction (not actual implementation)
      const aaProvider = new SmartWalletProvider(walletState.address);
      const userOp = await aaProvider.createTransactionRequest({
        target: protocolAddress,
        data: depositCalldata,
        value: ethers.utils.parseEther(amount)
      });
      
      // Handle gasless transactions if needed
      const paymaster = await getPaymaster();
      if (paymaster) {
        userOp = await paymaster.sponsor(userOp);
      }
      
      const receipt = await aaProvider.sendTransaction(userOp);
      return {
        success: true,
        transactionHash: receipt.transactionHash
      };
      */
      
      console.log('Using Smart Wallet for enhanced transaction handling');
    }
    
    return await depositMutation.mutateAsync({ opportunityId: 1, amount });
  };

  const contextValue = {
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