import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { ethers, BrowserProvider } from "ethers";
import { useWallet } from "@/hooks/use-wallet";
import { isContractOwner } from "@/lib/subscription-contract";
import { useToast } from "@/hooks/use-toast";

interface AdminContextType {
  isAdmin: boolean;
  isAdminLoading: boolean;
  getContractBalance: () => Promise<string>;
  withdrawFunds: () => Promise<boolean>;
}

// Create default context values
const defaultContextValue: AdminContextType = {
  isAdmin: false,
  isAdminLoading: false,
  getContractBalance: async () => "0",
  withdrawFunds: async () => false,
};

const AdminContext = createContext<AdminContextType>(defaultContextValue);

export function AdminProvider({ children }: { children: ReactNode }) {
  const { walletState } = useWallet();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAdminLoading, setIsAdminLoading] = useState(false);
  const { toast } = useToast();

  // Check if the connected wallet is the contract owner
  useEffect(() => {
    const checkOwnership = async () => {
      if (!walletState?.connected || !walletState?.address || !window.ethereum) {
        setIsAdmin(false);
        return;
      }

      setIsAdminLoading(true);
      try {
        const provider = new BrowserProvider(window.ethereum);
        const networkName = walletState.connectorType === 'smartwallet' ? 'base' : 'ethereum';
        
        const ownerStatus = await isContractOwner(
          provider,
          walletState.address,
          networkName
        );
        
        setIsAdmin(ownerStatus);
      } catch (error) {
        console.error("Error checking admin status:", error);
        setIsAdmin(false);
      } finally {
        setIsAdminLoading(false);
      }
    };

    checkOwnership();
  }, [walletState]);

  // Get the contract balance
  const getContractBalance = async (): Promise<string> => {
    if (!window.ethereum || !walletState?.connected) {
      return "0";
    }

    try {
      const provider = new BrowserProvider(window.ethereum);
      const networkName = walletState.connectorType === 'smartwallet' ? 'base' : 'ethereum';
      
      // Import dynamically to avoid circular dependencies
      const { getContractBalance } = await import('@/lib/subscription-contract');
      
      return await getContractBalance(provider, networkName);
    } catch (error) {
      console.error("Error fetching contract balance:", error);
      return "0";
    }
  };

  // Withdraw funds from the contract
  const withdrawFunds = async (): Promise<boolean> => {
    if (!window.ethereum || !walletState?.connected || !isAdmin) {
      toast({
        title: "Error",
        description: "You must be the contract owner to withdraw funds",
        variant: "destructive",
      });
      return false;
    }

    try {
      const provider = new BrowserProvider(window.ethereum);
      const networkName = walletState.connectorType === 'smartwallet' ? 'base' : 'ethereum';
      
      // Import dynamically to avoid circular dependencies
      const { withdrawFunds } = await import('@/lib/subscription-contract');
      
      const result = await withdrawFunds(provider, networkName);
      
      if (result.success) {
        toast({
          title: "Success",
          description: "Funds have been withdrawn successfully",
        });
        return true;
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to withdraw funds",
          variant: "destructive",
        });
        return false;
      }
    } catch (error) {
      console.error("Error withdrawing funds:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
      return false;
    }
  };

  const contextValue: AdminContextType = {
    isAdmin,
    isAdminLoading,
    getContractBalance,
    withdrawFunds,
  };

  return (
    <AdminContext.Provider value={contextValue}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  return useContext(AdminContext);
}