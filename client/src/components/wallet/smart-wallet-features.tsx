import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Shield, KeyRound, UserPlus, RefreshCcw } from 'lucide-react';
import { useWallet } from '@/hooks/use-wallet';

/**
 * Smart Wallet Features component to showcase additional functionality
 * that smart wallets provide over traditional EOA wallets.
 */
export function SmartWalletFeatures() {
  const { walletState } = useWallet();
  const { toast } = useToast();
  const [guardianAddress, setGuardianAddress] = useState('');
  const [isAddingGuardian, setIsAddingGuardian] = useState(false);

  // Only show for smart wallets
  if (walletState?.connectorType !== 'smartwallet') {
    return null;
  }

  const handleAddGuardian = () => {
    setIsAddingGuardian(true);
    
    // Simulate API call to add guardian
    setTimeout(() => {
      toast({
        title: "Guardian Added",
        description: `Added ${guardianAddress.substring(0, 6)}...${guardianAddress.substring(guardianAddress.length - 4)} as a wallet guardian.`,
      });
      setGuardianAddress('');
      setIsAddingGuardian(false);
    }, 1500);
  };

  const handleSocialRecovery = () => {
    toast({
      title: "Recovery Initiated",
      description: "Social recovery process has been started. Guardians will be notified.",
    });
  };

  const handleGaslessTransaction = () => {
    toast({
      title: "Gasless Transaction",
      description: "This transaction will be processed without gas fees using a paymaster.",
    });
  };

  return (
    <div className="space-y-4 mt-4">
      <h3 className="text-lg font-medium">Smart Wallet Features</h3>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="h-5 w-5 mr-2 text-blue-500" />
            Social Recovery
          </CardTitle>
          <CardDescription>
            Set up guardians to help recover your wallet if you lose access.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div>
              <p className="text-sm mb-2">Add a new guardian address:</p>
              <div className="flex space-x-2">
                <Input
                  value={guardianAddress}
                  onChange={(e) => setGuardianAddress(e.target.value)}
                  placeholder="0x..."
                  className="flex-1"
                />
                <Button 
                  onClick={handleAddGuardian} 
                  disabled={!guardianAddress || isAddingGuardian}
                  size="sm"
                >
                  <UserPlus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>
            </div>
            
            <div className="pt-2">
              <Button 
                onClick={handleSocialRecovery} 
                variant="outline" 
                className="w-full"
              >
                <KeyRound className="h-4 w-4 mr-2" />
                Initiate Recovery
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <RefreshCcw className="h-5 w-5 mr-2 text-green-500" />
            Gasless Transactions
          </CardTitle>
          <CardDescription>
            Submit transactions without paying for gas using a paymaster.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">
            Smart wallets can sponsor your gas fees, making transactions more affordable.
          </p>
          <Button onClick={handleGaslessTransaction} className="w-full">
            Enable Gasless Mode
          </Button>
        </CardContent>
        <CardFooter className="text-xs text-muted-foreground">
          Sponsored by YieldHawk Protocol
        </CardFooter>
      </Card>
    </div>
  );
}