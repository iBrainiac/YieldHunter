import { InjectedConnector } from '@web3-react/injected-connector';
import { WalletConnectConnector } from '@web3-react/walletconnect-connector';
import { Web3Provider } from '@ethersproject/providers';

// Supported chains for the app
const supportedChainIds = [1, 42161, 137, 56, 8453, 10]; // Ethereum, Arbitrum, Polygon, BSC, Base, Optimism

// RPC URLs for different networks
const RPC_URLS: { [chainId: number]: string } = {
  1: `https://mainnet.infura.io/v3/${import.meta.env.VITE_INFURA_KEY || ''}`,
  42161: 'https://arb1.arbitrum.io/rpc',
  137: 'https://polygon-rpc.com',
  56: 'https://bsc-dataseed.binance.org',
  8453: 'https://base.publicnode.com',
  10: 'https://optimism.publicnode.com'
};

// Injected connector (MetaMask)
export const injectedConnector = new InjectedConnector({
  supportedChainIds
});

// WalletConnect connector
export const walletConnectConnector = new WalletConnectConnector({
  rpc: RPC_URLS,
  bridge: 'https://bridge.walletconnect.org',
  qrcode: true
});

export type WalletType = 'metamask' | 'walletconnect';

export const getConnector = (walletType: WalletType) => {
  switch (walletType) {
    case 'metamask':
      return injectedConnector;
    case 'walletconnect':
      return walletConnectConnector;
    default:
      return injectedConnector;
  }
};