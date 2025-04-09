import { ethers } from "ethers";
import { protocolService, getProtocolAddress } from "./contracts";

// Testnet configuration
export const TESTNET_CONFIG = {
  rpcUrl: "https://eth-sepolia.g.alchemy.com/v2/demo",
  chainId: 11155111, // Sepolia testnet
  chainName: "Sepolia",
  nativeCurrency: {
    name: "Sepolia Ether",
    symbol: "ETH",
    decimals: 18,
  },
  blockExplorerUrl: "https://sepolia.etherscan.io",
};

// Helper function to convert number to hex
function toHex(num: number): string {
  return '0x' + num.toString(16);
}

// Class to handle Ethereum wallet operations
export class EthereumService {
  private provider: ethers.BrowserProvider | null = null;
  private signer: ethers.Signer | null = null;
  
  // Check if MetaMask is available
  isMetaMaskInstalled(): boolean {
    return typeof window !== 'undefined' && window.ethereum !== undefined;
  }
  
  // Connect to MetaMask
  async connectWallet(): Promise<{ address: string; balance: string }> {
    if (!this.isMetaMaskInstalled()) {
      throw new Error("MetaMask is not installed");
    }
    
    try {
      // Create a new provider
      this.provider = new ethers.BrowserProvider(window.ethereum);
      
      // Request access to user's accounts
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      // Get the signer
      this.signer = await this.provider.getSigner();
      
      // Update protocol service with the new signer
      protocolService.setSigner(this.signer);
      
      // Get the connected wallet address
      const address = await this.signer.getAddress();
      
      // Get native token (ETH) balance
      const balance = await this.provider.getBalance(address);
      const formattedBalance = ethers.formatEther(balance);
      
      return { 
        address, 
        balance: `${parseFloat(formattedBalance).toFixed(4)} ETH` 
      };
    } catch (error) {
      console.error("Error connecting to wallet:", error);
      throw error;
    }
  }
  
  // Check if wallet is connected
  async isConnected(): Promise<boolean> {
    if (!this.provider || !this.signer) return false;
    
    try {
      await this.signer.getAddress();
      return true;
    } catch (error) {
      return false;
    }
  }
  
  // Disconnect from MetaMask (clear local state)
  disconnect(): void {
    this.provider = null;
    this.signer = null;
    
    // Clear protocol service signer
    protocolService.setSigner(null);
  }
  
  // Switch to the testnet
  async switchToTestnet(): Promise<boolean> {
    if (!window.ethereum) {
      throw new Error("Provider not initialized");
    }
    
    try {
      // Try to switch to the testnet
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: toHex(TESTNET_CONFIG.chainId) }],
      });
      return true;
    } catch (error: any) {
      // If the testnet is not configured in the wallet, add it
      if (error.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: toHex(TESTNET_CONFIG.chainId),
                chainName: TESTNET_CONFIG.chainName,
                nativeCurrency: TESTNET_CONFIG.nativeCurrency,
                rpcUrls: [TESTNET_CONFIG.rpcUrl],
                blockExplorerUrls: [TESTNET_CONFIG.blockExplorerUrl]
              },
            ],
          });
          return true;
        } catch (addError) {
          console.error("Error adding testnet:", addError);
          throw addError;
        }
      } else {
        console.error("Error switching to testnet:", error);
        throw error;
      }
    }
  }
  
  // Get account balance
  async getBalance(): Promise<string> {
    if (!this.provider || !this.signer) {
      throw new Error("Wallet not connected");
    }
    
    const address = await this.signer.getAddress();
    const balance = await this.provider.getBalance(address);
    const formattedBalance = ethers.formatEther(balance);
    
    return `${parseFloat(formattedBalance).toFixed(4)} ETH`;
  }
  
  // Deposit funds into a protocol
  async depositToProtocol(
    protocolName: string, 
    amount: string
  ): Promise<{ success: boolean; transactionHash: string }> {
    if (!this.provider || !this.signer) {
      throw new Error("Wallet not connected");
    }
    
    try {
      // Use protocol service to handle the transaction
      return await protocolService.deposit(protocolName, amount);
    } catch (error) {
      console.error("Error depositing to protocol:", error);
      throw error;
    }
  }
  
  // Helper method to get actual protocol address
  getProtocolAddress(protocolName: string): string {
    return getProtocolAddress(protocolName);
  }
  
  // Get the current signer (for use in other services)
  getSigner(): ethers.Signer | null {
    return this.signer;
  }
}

// Create a singleton instance of the service
export const ethereumService = new EthereumService();

// Type declaration for window.ethereum
declare global {
  interface Window {
    ethereum: any;
  }
}