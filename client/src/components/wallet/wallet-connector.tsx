import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Wallet } from 'lucide-react';
import { useWallet } from '@/hooks/use-wallet';
import { WalletType } from '@/lib/wallet-connectors';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SmartWalletFeatures } from './smart-wallet-features';

interface WalletConnectorProps {
  collapsed?: boolean;
}

export default function WalletConnector({ collapsed = false }: WalletConnectorProps) {
  const { walletState, connect, disconnect, isConnecting, isDisconnecting } = useWallet();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleConnect = async (walletType: WalletType = 'metamask') => {
    try {
      // Make sure we completely disconnect first
      if (walletState?.connected) {
        await disconnect();
      }
      // Wait a brief moment to ensure everything is properly disconnected
      await new Promise(resolve => setTimeout(resolve, 500));
      // Now connect with the new wallet type
      await connect(walletType);
    } catch (error) {
      console.error(`Failed to connect ${walletType} wallet`, error);
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnect();
    } catch (error) {
      console.error('Failed to disconnect wallet', error);
    }
  };

  const displayAddress = walletState?.address
    ? `${walletState.address.substring(0, 6)}...${walletState.address.substring(
        walletState.address.length - 4
      )}`
    : 'Connect Wallet';

  if (collapsed) {
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={walletState ? handleDisconnect : () => handleConnect('metamask')}
        disabled={isConnecting || isDisconnecting}
        title={walletState ? `Disconnect (${displayAddress})` : 'Connect Wallet'}
      >
        <Wallet
          className={`h-5 w-5 ${
            walletState?.connected ? 'text-green-500' : 'text-neutral-400'
          }`}
        />
      </Button>
    );
  }

  if (walletState?.connected) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium">Your Wallet</div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDisconnect}
            disabled={isDisconnecting}
          >
            Disconnect
          </Button>
        </div>
        <div className="flex items-center space-x-2 bg-muted p-2 rounded-md">
          <Wallet className="h-5 w-5 text-green-500" />
          <div className="flex-1">
            <div className="text-sm font-medium">{displayAddress}</div>
            <div className="text-xs text-muted-foreground">{walletState.balance} ETH</div>
          </div>
          {walletState.connectorType && (
            <div className={`text-xs px-2 py-1 rounded ${
              walletState.connectorType === 'smartwallet'
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                : 'bg-primary/10 text-primary'
            }`}>
              {walletState.connectorType === 'metamask' 
                ? 'MetaMask' 
                : walletState.connectorType === 'walletconnect' 
                  ? 'WalletConnect'
                  : walletState.connectorType === 'smartwallet'
                    ? 'Smart Wallet'
                    : walletState.connectorType}
            </div>
          )}
        </div>
        
        {/* Smart Wallet specific features */}
        <SmartWalletFeatures />
      </div>
    );
  }

  // Not connected
  return (
    <div className="space-y-2">
      <div className="text-sm font-medium">Wallet</div>
      <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-start"
            disabled={isConnecting}
          >
            <Wallet className="h-5 w-5 mr-2" />
            Connect Wallet
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48">
          <DropdownMenuItem
            onClick={() => {
              handleConnect('metamask');
              setIsMenuOpen(false);
            }}
          >
            <img
              src="https://metamask.io/images/metamask-fox.svg"
              alt="MetaMask"
              className="h-4 w-4 mr-2"
            />
            MetaMask
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              handleConnect('walletconnect');
              setIsMenuOpen(false);
            }}
          >
            <img
              src="https://walletconnect.com/images/walletconnect-logo.svg"
              alt="WalletConnect"
              className="h-4 w-4 mr-2"
            />
            WalletConnect
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              handleConnect('smartwallet');
              setIsMenuOpen(false);
            }}
          >
            <svg 
              viewBox="0 0 24 24" 
              className="h-4 w-4 mr-2 fill-current"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
            </svg>
            Smart Wallet
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}