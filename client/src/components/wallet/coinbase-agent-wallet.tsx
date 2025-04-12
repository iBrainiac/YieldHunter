import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Loader2, Wallet, BarChart3, History, ArrowRight, ShieldCheck, RefreshCw, Check, X, AlertCircle } from 'lucide-react';
import { useWallet } from '@/hooks/use-wallet';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';

interface CoinbaseAgentWalletProps {
  onConnected?: (address: string) => void;
  onDisconnected?: () => void;
}

export function CoinbaseAgentWallet({ onConnected, onDisconnected }: CoinbaseAgentWalletProps) {
  const { walletState, isConnecting, connect, disconnect } = useWallet();
  const [activeTab, setActiveTab] = useState('overview');
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [isLoadingOpportunities, setIsLoadingOpportunities] = useState(false);
  const { toast } = useToast();

  // Fetch transactions when wallet is connected
  useEffect(() => {
    if (walletState?.connected) {
      fetchTransactions();
      fetchOpportunities();
      onConnected?.(walletState.address);
    }
  }, [walletState?.connected]);

  const fetchTransactions = async () => {
    setIsLoadingTransactions(true);
    try {
      const data = await api.transaction.getHistory();
      setTransactions(data);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast({
        title: 'Error',
        description: 'Failed to load transaction history',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingTransactions(false);
    }
  };

  const fetchOpportunities = async () => {
    setIsLoadingOpportunities(true);
    try {
      const data = await api.transaction.getOpportunities();
      setOpportunities(data);
    } catch (error) {
      console.error('Error fetching opportunities:', error);
      toast({
        title: 'Error',
        description: 'Failed to load yield opportunities',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingOpportunities(false);
    }
  };

  const handleConnect = async () => {
    try {
      // Use 'coinbase' as the wallet type for AgentKit (type matches WalletType)
      await connect('coinbase' as any);
      toast({
        title: 'Connected',
        description: 'Wallet connected successfully',
      });
    } catch (error) {
      console.error('Error connecting wallet:', error);
      toast({
        title: 'Connection Failed',
        description: error instanceof Error ? error.message : 'Failed to connect wallet',
        variant: 'destructive',
      });
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnect();
      onDisconnected?.();
      toast({
        title: 'Disconnected',
        description: 'Wallet disconnected successfully',
      });
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
      toast({
        title: 'Disconnection Failed',
        description: 'Failed to disconnect wallet',
        variant: 'destructive',
      });
    }
  };

  // Wallet not connected view
  if (!walletState?.connected) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Coinbase AgentKit
            <Badge variant="outline" className="ml-1 bg-blue-50 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
              Beta
            </Badge>
          </CardTitle>
          <CardDescription>
            Connect your wallet to access enhanced yield farming features
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center space-y-4 py-8">
          <div className="flex flex-col items-center text-center space-y-2 mb-4">
            <ShieldCheck className="h-12 w-12 text-blue-500 mb-2 opacity-80" />
            <h3 className="text-xl font-semibold">Smart Accounts</h3>
            <p className="text-muted-foreground text-sm max-w-sm">
              Coinbase AgentKit provides advanced wallet features, including gasless transactions and automated yield farming
            </p>
          </div>
          <ul className="text-sm space-y-2 text-muted-foreground mb-4">
            <li className="flex items-center">
              <Check className="h-4 w-4 mr-2 text-green-500" />
              Social recovery options
            </li>
            <li className="flex items-center">
              <Check className="h-4 w-4 mr-2 text-green-500" />
              Gasless transactions (no ETH needed)
            </li>
            <li className="flex items-center">
              <Check className="h-4 w-4 mr-2 text-green-500" />
              Batch transactions for efficient swaps & deposits
            </li>
          </ul>
        </CardContent>
        <CardFooter>
          <Button 
            onClick={handleConnect} 
            className="w-full" 
            disabled={isConnecting}
            variant="default"
          >
            {isConnecting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                Connect Wallet
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // Wallet connected view
  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Coinbase Smart Wallet
            </CardTitle>
            <CardDescription className="mt-1">
              <span className="font-mono">{walletState.address.substring(0, 6)}...{walletState.address.substring(walletState.address.length - 4)}</span>
            </CardDescription>
          </div>
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 flex items-center">
            <Check className="mr-1 h-3 w-3" />
            Connected
          </Badge>
        </div>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="opportunities">Opportunities</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent className="pt-4">
        <TabsContent value="overview" className="mt-0">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Balance</h3>
              <Button variant="ghost" size="sm" onClick={() => fetchTransactions()} disabled={isLoadingTransactions}>
                <RefreshCw className="h-4 w-4 mr-1" />
                Refresh
              </Button>
            </div>
            <div className="flex flex-col">
              <span className="text-3xl font-bold">{walletState.balance || '0.00 ETH'}</span>
              <span className="text-sm text-muted-foreground">Base Network</span>
            </div>
            
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <h4 className="font-medium flex items-center">
                <ShieldCheck className="h-4 w-4 mr-1.5 text-green-500" />
                AgentKit Features Available
              </h4>
              <ul className="text-sm space-y-2">
                <li className="flex items-center text-muted-foreground">
                  <Check className="h-3.5 w-3.5 mr-1.5 text-green-500" />
                  Gasless transactions enabled
                </li>
                <li className="flex items-center text-muted-foreground">
                  <Check className="h-3.5 w-3.5 mr-1.5 text-green-500" />
                  Social recovery configured
                </li>
                <li className="flex items-center text-muted-foreground">
                  <Check className="h-3.5 w-3.5 mr-1.5 text-green-500" />
                  OpenAI analysis available
                </li>
              </ul>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="transactions" className="mt-0">
          {isLoadingTransactions ? (
            <div className="py-8 flex justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : transactions.length > 0 ? (
            <div className="space-y-3">
              {transactions.map((tx, i) => (
                <div key={i} className="flex items-start border-b last:border-b-0 border-border/50 pb-3 last:pb-0 pt-1">
                  <div className={`rounded-full p-2 mr-3 ${tx.success ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'}`}>
                    {tx.success ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <h4 className="font-medium">{tx.type === 'deposit' ? 'Deposit' : 'Withdrawal'}</h4>
                      <span className="text-sm">{new Date(tx.timestamp).toLocaleDateString()}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {tx.amount} {tx.asset} on {tx.protocolName}
                    </p>
                    <div className="mt-1">
                      <a 
                        href={`https://goerli.basescan.org/tx/${tx.hash}`} 
                        target="_blank"
                        rel="noopener noreferrer" 
                        className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        {tx.hash.substring(0, 8)}...{tx.hash.substring(tx.hash.length - 6)} ↗
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center">
              <AlertCircle className="h-8 w-8 mx-auto mb-4 text-muted-foreground/60" />
              <h3 className="font-medium text-lg">No transactions yet</h3>
              <p className="text-muted-foreground text-sm mt-1">
                Your transaction history will appear here
              </p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="opportunities" className="mt-0">
          {isLoadingOpportunities ? (
            <div className="py-8 flex justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : opportunities.length > 0 ? (
            <div className="space-y-3">
              {opportunities.slice(0, 5).map((opp, i) => (
                <div key={i} className="flex items-center border-b last:border-b-0 border-border/50 pb-3 last:pb-0 pt-1">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mr-3">
                    <BarChart3 className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium">{opp.protocol?.name || "Unknown"}</h4>
                      <Badge className="bg-green-100 text-green-800">
                        {opp.apy}% APY
                      </Badge>
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-sm text-muted-foreground">
                        {opp.asset} on {opp.network?.name || "Unknown"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        TVL: ${(opp.tvl / 1000000).toFixed(1)}M
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center">
              <AlertCircle className="h-8 w-8 mx-auto mb-4 text-muted-foreground/60" />
              <h3 className="font-medium text-lg">No opportunities available</h3>
              <p className="text-muted-foreground text-sm mt-1">
                Check back later for available yield opportunities
              </p>
            </div>
          )}
        </TabsContent>
      </CardContent>
      <CardFooter className="border-t flex justify-between pt-4">
        <Button variant="outline" onClick={handleDisconnect}>
          Disconnect
        </Button>
        <Button onClick={() => window.open('https://goerli.basescan.org/', '_blank')}>
          View on Basescan
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}