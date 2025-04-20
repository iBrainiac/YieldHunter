import { ethers, Contract, BrowserProvider } from 'ethers';

// ABI for the YieldHunterSubscription contract
const subscriptionABI = [
  "function subscribe() external payable",
  "function isSubscribed(address user) external view returns (bool)",
  "function subscriptionFee() external view returns (uint256)",
  "function owner() external view returns (address)",
  "function withdrawFunds() external",
  "function transferOwnership(address newOwner) external"
];

// This address should be updated with the actual deployed contract address on the desired network
const CONTRACT_ADDRESSES: Record<string, string> = {
  // Add addresses once contracts are deployed to each network
  'base': '0x0000000000000000000000000000000000000000', // Replace with actual address when deployed
  'ethereum': '0x0000000000000000000000000000000000000000',
  'polygon': '0x0000000000000000000000000000000000000000',
  'arbitrum': '0x0000000000000000000000000000000000000000',
  'optimism': '0x0000000000000000000000000000000000000000',
};

/**
 * Returns the subscription contract for a given network
 */
export function getSubscriptionContract(provider: BrowserProvider, networkName: string) {
  const contractAddress = CONTRACT_ADDRESSES[networkName.toLowerCase()] || CONTRACT_ADDRESSES['base'];
  return new Contract(contractAddress, subscriptionABI, provider);
}

/**
 * Checks if an address is subscribed to YieldHunter
 */
export async function isSubscribed(provider: BrowserProvider, address: string, networkName: string): Promise<boolean> {
  try {
    const contract = getSubscriptionContract(provider, networkName);
    // Use getFunction to access contract methods safely
    return await contract.getFunction('isSubscribed')(address);
  } catch (error) {
    console.error('Error checking subscription status:', error);
    return false;
  }
}

/**
 * Gets the current subscription fee in wei
 */
export async function getSubscriptionFee(provider: BrowserProvider, networkName: string): Promise<string> {
  try {
    const contract = getSubscriptionContract(provider, networkName);
    // Use getFunction to access contract methods safely
    const fee = await contract.getFunction('subscriptionFee')();
    return fee.toString();
  } catch (error) {
    console.error('Error getting subscription fee:', error);
    return '0';
  }
}

/**
 * Subscribe to YieldHunter
 */
export async function subscribe(provider: BrowserProvider, networkName: string): Promise<{ success: boolean; transactionHash?: string; error?: string }> {
  try {
    const contract = getSubscriptionContract(provider, networkName);
    const signer = await provider.getSigner();
    
    // Get the subscription fee
    const fee = await contract.getFunction('subscriptionFee')();
    
    // Execute the transaction
    const contractWithSigner = contract.connect(signer);
    // Since we can't directly call 'subscribe' on a generic Contract, we use the function fragment from the ABI
    const tx = await contractWithSigner.getFunction('subscribe')({ value: fee });
    const receipt = await tx.wait();
    
    return {
      success: true,
      transactionHash: receipt.hash
    };
  } catch (error: any) {
    console.error('Error subscribing to YieldHunter:', error);
    return {
      success: false,
      error: error.message || 'An error occurred while subscribing'
    };
  }
}

/**
 * Format subscription fee to user-friendly format
 */
export function formatSubscriptionFee(weiAmount: string): string {
  // Convert from wei to ether
  const etherValue = ethers.formatEther(weiAmount);
  return etherValue;
}

/**
 * Check if an address is the contract owner
 */
export async function isContractOwner(provider: BrowserProvider, address: string, networkName: string): Promise<boolean> {
  try {
    const contract = getSubscriptionContract(provider, networkName);
    // Get the owner address from the contract
    const ownerAddress = await contract.getFunction('owner')();
    
    // Compare with the provided address (case-insensitive)
    return ownerAddress.toLowerCase() === address.toLowerCase();
  } catch (error) {
    console.error('Error checking contract ownership:', error);
    return false;
  }
}

/**
 * Get the contract balance
 */
export async function getContractBalance(provider: BrowserProvider, networkName: string): Promise<string> {
  try {
    const contractAddress = CONTRACT_ADDRESSES[networkName.toLowerCase()] || CONTRACT_ADDRESSES['base'];
    const balance = await provider.getBalance(contractAddress);
    return balance.toString();
  } catch (error) {
    console.error('Error getting contract balance:', error);
    return '0';
  }
}

/**
 * Withdraw funds from the contract (owner only)
 */
export async function withdrawFunds(provider: BrowserProvider, networkName: string): Promise<{ success: boolean; transactionHash?: string; error?: string }> {
  try {
    const contract = getSubscriptionContract(provider, networkName);
    const signer = await provider.getSigner();
    const signerAddress = await signer.getAddress();
    
    // Check if the signer is the owner
    const isOwner = await isContractOwner(provider, signerAddress, networkName);
    if (!isOwner) {
      return {
        success: false,
        error: 'Only the contract owner can withdraw funds'
      };
    }
    
    // Execute the withdraw function
    const contractWithSigner = contract.connect(signer);
    const tx = await contractWithSigner.getFunction('withdrawFunds')();
    const receipt = await tx.wait();
    
    return {
      success: true,
      transactionHash: receipt.hash
    };
  } catch (error: any) {
    console.error('Error withdrawing funds:', error);
    return {
      success: false,
      error: error.message || 'An error occurred during withdrawal'
    };
  }
}

/**
 * Transfer contract ownership to a new address (owner only)
 */
export async function transferOwnership(provider: BrowserProvider, newOwnerAddress: string, networkName: string): Promise<{ success: boolean; transactionHash?: string; error?: string }> {
  try {
    const contract = getSubscriptionContract(provider, networkName);
    const signer = await provider.getSigner();
    const signerAddress = await signer.getAddress();
    
    // Check if the signer is the current owner
    const isOwner = await isContractOwner(provider, signerAddress, networkName);
    if (!isOwner) {
      return {
        success: false,
        error: 'Only the contract owner can transfer ownership'
      };
    }
    
    // Execute the transferOwnership function
    const contractWithSigner = contract.connect(signer);
    const tx = await contractWithSigner.getFunction('transferOwnership')(newOwnerAddress);
    const receipt = await tx.wait();
    
    return {
      success: true,
      transactionHash: receipt.hash
    };
  } catch (error: any) {
    console.error('Error transferring ownership:', error);
    return {
      success: false,
      error: error.message || 'An error occurred during ownership transfer'
    };
  }
}