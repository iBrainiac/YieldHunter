import { ethers, Contract, BrowserProvider } from 'ethers';

// ABI for the YieldHunterSubscription contract
const subscriptionABI = [
  "function subscribe() external payable",
  "function isSubscribed(address user) external view returns (bool)",
  "function subscriptionFee() external view returns (uint256)"
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
    return await contract.isSubscribed(address);
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
    const fee = await contract.subscriptionFee();
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
    const fee = await contract.subscriptionFee();
    
    // Execute the transaction
    const contractWithSigner = contract.connect(signer);
    const tx = await contractWithSigner.subscribe({ value: fee });
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