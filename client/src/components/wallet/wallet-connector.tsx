import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Wallet } from 'lucide-react';
import { useWallet } from '@/hooks/use-wallet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface WalletConnectorProps {
  collapsed?: boolean;
}

export default function WalletConnector({ collapsed = false }: WalletConnectorProps) {
  const { walletState, connect, disconnect, isConnecting, isDisconnecting } = useWallet();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleConnect = async (walletType: 'metamask' | 'walletconnect' = 'metamask') => {
    try {
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
            <div className="text-xs px-2 py-1 rounded bg-primary/10 text-primary">
              {walletState.connectorType === 'metamask' 
                ? 'MetaMask' 
                : walletState.connectorType === 'walletconnect' 
                  ? 'WalletConnect' 
                  : walletState.connectorType}
            </div>
          )}
        </div>
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
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}