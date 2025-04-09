import { ethers } from "ethers";

// Simple ERC20 ABI for token interactions
const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "event Transfer(address indexed from, address indexed to, uint256 amount)"
];

// Protocol contract ABIs (simplified for demonstration)
const PROTOCOL_ABI = [
  "function deposit(uint256 amount) returns (bool)",
  "function withdraw(uint256 amount) returns (bool)",
  "function getAPY() view returns (uint256)",
  "function getUserDeposit(address user) view returns (uint256)"
];

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

// Protocol addresses on testnet (these would be actual contract addresses in production)
export const TESTNET_CONTRACTS = {
  aave: "0x1234567890123456789012345678901234567890",
  compound: "0x2345678901234567890123456789012345678901",
  curve: "0x3456789012345678901234567890123456789012",
  // Add more protocols as needed
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
    protocolAddress: string, 
    amount: string
  ): Promise<{ success: boolean; transactionHash: string }> {
    if (!this.provider || !this.signer) {
      throw new Error("Wallet not connected");
    }
    
    try {
      // Create contract instance for the protocol
      const protocolContract = new ethers.Contract(
        protocolAddress,
        PROTOCOL_ABI,
        this.signer
      );
      
      // Convert amount from ETH to Wei
      const amountInWei = ethers.parseEther(amount);
      
      // Send transaction to deposit funds
      const tx = await protocolContract.deposit(amountInWei, {
        value: amountInWei // Send ETH with the transaction
      });
      
      // Wait for transaction to be mined
      const receipt = await tx.wait();
      
      return {
        success: true,
        transactionHash: receipt.hash
      };
    } catch (error) {
      console.error("Error depositing to protocol:", error);
      throw error;
    }
  }
  
  // Helper method to get actual protocol address
  getProtocolAddress(protocolName: string): string {
    const normalizedName = protocolName.toLowerCase();
    
    // Match protocol name to address
    for (const [key, address] of Object.entries(TESTNET_CONTRACTS)) {
      if (normalizedName.includes(key)) {
        return address;
      }
    }
    
    // Default to Aave if no match found
    return TESTNET_CONTRACTS.aave;
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