import React, { useEffect, useState } from 'react';
import { ethers, BrowserProvider } from 'ethers';
import { useWallet } from '@/hooks/use-wallet';
import { 
  isSubscribed, 
  subscribe, 
  getSubscriptionFee, 
  formatSubscriptionFee 
} from '@/lib/subscription-contract';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle2, Unlock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SubscriptionGateProps {
  children: React.ReactNode;
}

const SubscriptionGate: React.FC<SubscriptionGateProps> = ({ children }) => {
  const { walletState } = useWallet();
  const [hasSubscription, setHasSubscription] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [subscriptionFee, setSubscriptionFee] = useState<string>('0');
  const { toast } = useToast();

  // Helper function to determine the network name
  const getNetworkName = () => {
    if (!walletState?.connectorType) return 'ethereum';
    // For different wallet types, we might use different networks
    switch (walletState.connectorType) {
      case 'walletconnect':
        return 'ethereum';
      case 'smartwallet':
        return 'base';
      case 'metamask':
      default:
        return 'ethereum';
    }
  };

  useEffect(() => {
    const checkSubscription = async () => {
      if (walletState?.connected && walletState.address) {
        setIsLoading(true);
        try {
          // In development or testing, we might not have window.ethereum
          if (typeof window === 'undefined' || !window.ethereum) {
            console.warn('No ethereum provider found - This is expected during development');
            // For development, we'll assume not subscribed
            setHasSubscription(false);
            setSubscriptionFee('10000000000000000'); // 0.01 ETH for display purposes
            setIsLoading(false);
            return;
          }

          try {
            // Get provider - wrap this in its own try/catch
            const provider = new BrowserProvider(window.ethereum);
            
            // Check if user is subscribed
            const hasActiveSubscription = await isSubscribed(
              provider, 
              walletState.address,
              getNetworkName()
            );
            
            // Get subscription fee
            const fee = await getSubscriptionFee(
              provider,
              getNetworkName()
            );
            
            setSubscriptionFee(fee || '10000000000000000'); // Default to 0.01 ETH if fee is falsy
            setHasSubscription(hasActiveSubscription);
          } catch (web3Error) {
            console.warn('Web3 provider error:', web3Error);
            // If the provider fails, we'll assume not subscribed 
            setHasSubscription(false);
            setSubscriptionFee('10000000000000000');
          }
        } catch (error) {
          console.error('Error checking subscription:', error);
          setHasSubscription(false);
        } finally {
          setIsLoading(false);
        }
      } else {
        setHasSubscription(null);
        setIsLoading(false);
      }
    };

    // Wrap the async function call in a try/catch
    try {
      checkSubscription();
    } catch (err) {
      console.error('Unexpected error in subscription check:', err);
      setIsLoading(false);
      setHasSubscription(false);
    }
  }, [walletState]);

  const handleSubscribe = async () => {
    if (!walletState?.connected) {
      toast({
        title: 'Wallet not connected',
        description: 'Please connect your wallet first',
        variant: 'destructive'
      });
      return;
    }

    if (typeof window === 'undefined' || !window.ethereum) {
      toast({
        title: 'No wallet provider found',
        description: 'Please install MetaMask or another Web3 wallet to continue',
        variant: 'destructive'
      });
      return;
    }

    setIsProcessing(true);
    try {
      // For demo/development environment, we'll simulate a successful subscription
      if (process.env.NODE_ENV === 'development' && !window.ethereum.isMetaMask) {
        // Simulate a delay for the transaction
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        toast({
          title: 'Subscription successful! (Demo)',
          description: 'Your subscription has been activated',
          variant: 'default'
        });
        setHasSubscription(true);
        setIsProcessing(false);
        return;
      }

      try {
        const provider = new BrowserProvider(window.ethereum);
        const result = await subscribe(
          provider,
          getNetworkName()
        );

        if (result.success) {
          toast({
            title: 'Subscription successful!',
            description: 'Your subscription has been activated',
            variant: 'default'
          });
          setHasSubscription(true);
        } else {
          toast({
            title: 'Subscription failed',
            description: result.error || 'An error occurred while processing your subscription',
            variant: 'destructive'
          });
        }
      } catch (web3Error: any) {
        console.error('Web3 subscription error:', web3Error);
        toast({
          title: 'Subscription error',
          description: web3Error.message || 'There was an error processing your subscription',
          variant: 'destructive'
        });
      }
    } catch (error: any) {
      console.error('Error during subscription:', error);
      toast({
        title: 'Subscription error',
        description: error.message || 'There was an error processing your subscription',
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // If wallet is not connected, show the children (don't block the UI)
  if (!walletState?.connected) {
    return <>{children}</>;
  }

  // If we're still loading, show a loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If the user has a subscription, show the children
  if (hasSubscription) {
    return <>{children}</>;
  }

  // If no subscription, show subscription gate
  return (
    <div className="container mx-auto p-4 max-w-lg">
      <Card className="border-destructive/20 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <AlertCircle className="h-5 w-5 text-destructive" />
            Subscription Required
          </CardTitle>
          <CardDescription>
            Access to YieldHunter premium features requires a one-time subscription fee.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-muted p-6 flex flex-col items-center justify-center text-center space-y-3">
            <p className="text-lg font-medium">One-time access fee</p>
            <p className="text-3xl font-bold">$10</p>
            <p className="text-sm text-muted-foreground">
              Approximately {formatSubscriptionFee(subscriptionFee)} ETH
            </p>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium">What you'll get:</h4>
            <ul className="space-y-2">
              <li className="flex items-start">
                <CheckCircle2 className="h-5 w-5 text-primary mr-2 mt-0.5" />
                <span>Access to all YieldHunter features</span>
              </li>
              <li className="flex items-start">
                <CheckCircle2 className="h-5 w-5 text-primary mr-2 mt-0.5" />
                <span>Advanced AI yield farming strategies</span>
              </li>
              <li className="flex items-start">
                <CheckCircle2 className="h-5 w-5 text-primary mr-2 mt-0.5" />
                <span>Multi-chain opportunity scanning</span>
              </li>
              <li className="flex items-start">
                <CheckCircle2 className="h-5 w-5 text-primary mr-2 mt-0.5" />
                <span>Automated strategy execution</span>
              </li>
            </ul>
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            className="w-full" 
            onClick={handleSubscribe} 
            disabled={isProcessing}
          >
            {isProcessing ? (
              <>
                <span className="animate-spin mr-2">◌</span>
                Processing...
              </>
            ) : (
              <>
                <Unlock className="mr-2 h-4 w-4" />
                Subscribe Now
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default SubscriptionGate;