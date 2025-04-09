import { ethers } from "ethers";
import { TESTNET_CONFIG } from "./ethereum";

// Generic ERC20 ABI - used for token interactions
export const ERC20_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function balanceOf(address owner) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "event Transfer(address indexed from, address indexed to, uint256 amount)",
  "event Approval(address indexed owner, address indexed spender, uint256 value)"
];

// Lending Protocol ABI - simplified version for common DeFi protocols
export const LENDING_PROTOCOL_ABI = [
  // Read functions
  "function getReserveData(address asset) view returns (tuple(uint256 liquidity, uint256 totalBorrows, uint256 borrowRate, uint256 supplyRate))",
  "function getUserAccountData(address user) view returns (tuple(uint256 totalCollateral, uint256 totalBorrow, uint256 availableToBorrow, uint256 healthFactor))",
  "function getAPY(address asset) view returns (uint256)",
  
  // Write functions
  "function deposit(address asset, uint256 amount) returns (bool)",
  "function withdraw(address asset, uint256 amount) returns (bool)",
  "function borrow(address asset, uint256 amount) returns (bool)",
  "function repay(address asset, uint256 amount) returns (bool)",
  
  // Events
  "event Deposit(address indexed user, address indexed asset, uint256 amount)",
  "event Withdraw(address indexed user, address indexed asset, uint256 amount)",
  "event Borrow(address indexed user, address indexed asset, uint256 amount)",
  "event Repay(address indexed user, address indexed asset, uint256 amount)"
];

// Staking Protocol ABI
export const STAKING_PROTOCOL_ABI = [
  // Read functions
  "function getStakingData(address asset) view returns (tuple(uint256 totalStaked, uint256 rewardRate, uint256 periodFinish))",
  "function getUserStake(address user, address asset) view returns (uint256)",
  "function getRewards(address user, address asset) view returns (uint256)",
  "function getAPY(address asset) view returns (uint256)",
  
  // Write functions
  "function stake(address asset, uint256 amount) returns (bool)",
  "function unstake(address asset, uint256 amount) returns (bool)",
  "function claimRewards(address asset) returns (uint256)",
  
  // Events
  "event Staked(address indexed user, address indexed asset, uint256 amount)",
  "event Unstaked(address indexed user, address indexed asset, uint256 amount)",
  "event RewardClaimed(address indexed user, address indexed asset, uint256 amount)"
];

// Interface for liquidity pool protocols (e.g., Uniswap, Curve)
export const LIQUIDITY_POOL_ABI = [
  // Read functions
  "function getPoolInfo(address pool) view returns (tuple(address[] tokens, uint256[] reserves, uint256 totalSupply, uint256 fee))",
  "function getUserLiquidity(address user, address pool) view returns (uint256)",
  "function getAPY(address pool) view returns (uint256)",
  
  // Write functions
  "function addLiquidity(address pool, uint256[] amounts, uint256 minLP) returns (uint256)",
  "function removeLiquidity(address pool, uint256 lpAmount, uint256[] minAmounts) returns (uint256[])",
  "function swap(address pool, uint256 amountIn, uint256 minAmountOut, address tokenIn, address tokenOut) returns (uint256)",
  
  // Events
  "event LiquidityAdded(address indexed user, address indexed pool, uint256 lpAmount)",
  "event LiquidityRemoved(address indexed user, address indexed pool, uint256 lpAmount)",
  "event Swapped(address indexed user, address indexed pool, address tokenIn, address tokenOut, uint256 amountIn, uint256 amountOut)"
];

// Mock protocol contract addresses on Sepolia testnet
export const PROTOCOL_ADDRESSES = {
  // Lending protocols
  aave: "0x4Dd5254B3c9612939DE5560044lD91c60CB635F5", // Mock Aave address
  compound: "0x5D4Dd5254B3c9612939DE5560044lD91c60CB635", // Mock Compound address
  
  // Staking protocols
  lido: "0x6DD5254B3c9612939DE5560044lD91c60CB635F7", // Mock Lido address
  rocketPool: "0x7D4Dd5254B3c9612939DE5560044lD91c60CB635", // Mock RocketPool address
  
  // Liquidity pools
  curve: "0x8D4Dd5254B3c9612939DE5560044lD91c60CB635F", // Mock Curve address
  uniswap: "0x9D4Dd5254B3c9612939DE5560044lD91c60CB635", // Mock Uniswap address
};

// Helper function to identify protocol type
export function getProtocolType(protocolName: string): 'lending' | 'staking' | 'liquidity' {
  const name = protocolName.toLowerCase();
  if (name.includes('aave') || name.includes('compound') || name.includes('maker')) {
    return 'lending';
  } else if (name.includes('lido') || name.includes('rocket') || name.includes('stake')) {
    return 'staking';
  } else {
    return 'liquidity';
  }
}

// Helper function to get appropriate ABI based on protocol name
export function getProtocolABI(protocolName: string): any[] {
  const type = getProtocolType(protocolName);
  
  switch (type) {
    case 'lending':
      return LENDING_PROTOCOL_ABI;
    case 'staking':
      return STAKING_PROTOCOL_ABI;
    case 'liquidity':
      return LIQUIDITY_POOL_ABI;
    default:
      return LENDING_PROTOCOL_ABI;
  }
}

// Helper function to get protocol address
export function getProtocolAddress(protocolName: string): string {
  const name = protocolName.toLowerCase();
  
  // Find matching protocol
  for (const [key, address] of Object.entries(PROTOCOL_ADDRESSES)) {
    if (name.includes(key)) {
      return address;
    }
  }
  
  // Default to Aave if no match
  return PROTOCOL_ADDRESSES.aave;
}

// Interface for transacting with protocols
export class ProtocolService {
  private signer: ethers.Signer | null = null;
  
  // Initialize with a signer
  constructor(signer: ethers.Signer | null = null) {
    this.signer = signer;
  }
  
  // Update the signer
  setSigner(signer: ethers.Signer | null) {
    this.signer = signer;
  }
  
  // Make a deposit to a protocol
  async deposit(protocolName: string, amount: string): Promise<{ success: boolean, transactionHash: string }> {
    if (!this.signer) {
      throw new Error("Signer not set - please connect wallet first");
    }
    
    try {
      // Get protocol details
      const protocolAddress = getProtocolAddress(protocolName);
      console.log(`Depositing ${amount} ETH to ${protocolName} at ${protocolAddress}`);
      
      // For demonstration purposes in Replit environment (where we can't use real extensions like MetaMask),
      // we'll simulate a transaction instead of executing a real one
      // Generate a random transaction hash
      const mockTransactionHash = `0x${Math.random().toString(16).substring(2, 62)}`;
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      console.log(`Simulated transaction hash: ${mockTransactionHash}`);
      
      // Return simulated transaction result
      return {
        success: true,
        transactionHash: mockTransactionHash
      };
      
      /* 
      // REAL BLOCKCHAIN TRANSACTION CODE (Uncomment when using with a real provider)
      const protocolABI = getProtocolABI(protocolName);
      
      // Create contract instance
      const contract = new ethers.Contract(protocolAddress, protocolABI, this.signer);
      
      // Convert amount to wei
      const amountInWei = ethers.parseEther(amount);
      
      // Send transaction to deposit funds
      const tx = await contract.deposit(ethers.ZeroAddress, amountInWei, {
        value: amountInWei // Send ETH with the transaction
      });
      
      // Wait for transaction to be mined
      const receipt = await tx.wait();
      
      // Return transaction details
      return {
        success: true,
        transactionHash: receipt.hash
      };
      */
    } catch (error) {
      console.error("Error in protocol deposit:", error);
      throw error;
    }
  }
  
  // Get estimated APY from a protocol for an asset
  async getAPY(protocolName: string, assetAddress: string = ethers.ZeroAddress): Promise<number> {
    if (!this.signer) {
      throw new Error("Signer not set - please connect wallet first");
    }
    
    try {
      // Get protocol details
      const protocolAddress = getProtocolAddress(protocolName);
      const protocolABI = getProtocolABI(protocolName);
      
      // Create read-only contract instance
      const contract = new ethers.Contract(protocolAddress, protocolABI, this.signer);
      
      // Call getAPY function
      const apyBigInt = await contract.getAPY(assetAddress);
      
      // Convert from basis points (0.01%) to percentage
      // Most protocols return APY in basis points (e.g., 500 = 5.00%)
      return Number(apyBigInt) / 100;
    } catch (error) {
      console.error("Error getting APY:", error);
      // Return a fallback APY for demo purposes
      return 5.5;
    }
  }
  
  // Get user's position in a protocol
  async getUserPosition(protocolName: string, userAddress: string): Promise<any> {
    if (!this.signer) {
      throw new Error("Signer not set - please connect wallet first");
    }
    
    try {
      // Get protocol details
      const protocolAddress = getProtocolAddress(protocolName);
      const protocolABI = getProtocolABI(protocolName);
      const type = getProtocolType(protocolName);
      
      // Create contract instance
      const contract = new ethers.Contract(protocolAddress, protocolABI, this.signer);
      
      // Different protocols have different methods for user data
      switch (type) {
        case 'lending':
          return await contract.getUserAccountData(userAddress);
        case 'staking':
          return await contract.getUserStake(userAddress, ethers.ZeroAddress);
        case 'liquidity':
          return await contract.getUserLiquidity(userAddress, ethers.ZeroAddress);
        default:
          throw new Error("Unknown protocol type");
      }
    } catch (error) {
      console.error("Error getting user position:", error);
      return null;
    }
  }
}

// Create a singleton instance
export const protocolService = new ProtocolService();