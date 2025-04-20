import React, { useState, useEffect } from 'react';
import { useAdmin } from '@/hooks/use-admin';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { formatSubscriptionFee } from '@/lib/subscription-contract';
import { AlertCircle, ArrowRight, Database, DollarSign, Users, Wallet } from 'lucide-react';
import { ethers } from 'ethers';

const AdminDashboard: React.FC = () => {
  const { isAdmin, isAdminLoading, getContractBalance, withdrawFunds } = useAdmin();
  const [contractBalance, setContractBalance] = useState<string>('0');
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [totalSubscribers, setTotalSubscribers] = useState<number>(0);
  
  // This would be improved to use real data in a production environment
  // For now, we're using placeholder data for demonstration
  const [recentSubscriptions, setRecentSubscriptions] = useState<{
    address: string;
    date: string;
    amount: string;
  }[]>([]);

  // Fetch the contract balance
  const fetchContractBalance = async () => {
    setIsLoadingBalance(true);
    try {
      const balance = await getContractBalance();
      setContractBalance(balance);
    } catch (error) {
      console.error('Error fetching contract balance:', error);
    } finally {
      setIsLoadingBalance(false);
    }
  };

  // Handle withdraw funds
  const handleWithdraw = async () => {
    setIsWithdrawing(true);
    try {
      const success = await withdrawFunds();
      if (success) {
        // Refresh the balance after successful withdrawal
        await fetchContractBalance();
      }
    } finally {
      setIsWithdrawing(false);
    }
  };

  // Fetch initial data
  useEffect(() => {
    if (isAdmin) {
      fetchContractBalance();
      
      // This would be improved to use real data in a production environment
      // For now, we're setting placeholder data for demonstration
      setTotalSubscribers(12);
      setRecentSubscriptions([
        {
          address: '0x1234...5678',
          date: '2023-04-01',
          amount: '0.01'
        },
        {
          address: '0xabcd...efgh',
          date: '2023-03-28',
          amount: '0.01'
        },
        {
          address: '0x9876...5432',
          date: '2023-03-25',
          amount: '0.01'
        }
      ]);
    }
  }, [isAdmin]);

  // Show loading state while checking admin status
  if (isAdminLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If not admin, don't show anything
  if (!isAdmin) {
    return null;
  }

  // Format the contract balance
  const formattedBalance = formatSubscriptionFee(contractBalance);
  const balanceInUsd = parseFloat(formattedBalance) * 2000; // Assuming 1 ETH = $2000 for demonstration

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <Button 
          variant="destructive" 
          onClick={handleWithdraw} 
          disabled={isWithdrawing || parseFloat(contractBalance) === 0}
        >
          {isWithdrawing ? (
            <>
              <span className="animate-spin mr-2">◌</span>
              Withdrawing...
            </>
          ) : (
            <>
              <Wallet className="mr-2 h-4 w-4" />
              Withdraw Funds
            </>
          )}
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Contract Balance Card */}
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center text-xl">
              <DollarSign className="h-5 w-5 mr-2 text-primary" />
              Contract Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {isLoadingBalance ? (
                <div className="animate-pulse h-8 w-32 bg-muted rounded"></div>
              ) : (
                `${formattedBalance} ETH`
              )}
            </div>
            <div className="text-muted-foreground mt-1">
              {isLoadingBalance ? (
                <div className="animate-pulse h-4 w-20 bg-muted rounded"></div>
              ) : (
                `≈ $${balanceInUsd.toFixed(2)}`
              )}
            </div>
          </CardContent>
        </Card>
        
        {/* Total Subscribers Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-xl">
              <Users className="h-5 w-5 mr-2 text-primary" />
              Total Subscribers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalSubscribers}</div>
            <div className="text-muted-foreground mt-1">
              {totalSubscribers > 0 ? `$${(totalSubscribers * 10).toFixed(2)} Revenue` : 'No subscribers yet'}
            </div>
          </CardContent>
        </Card>
        
        {/* Subscription Fee Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-xl">
              <Database className="h-5 w-5 mr-2 text-primary" />
              Subscription Fee
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">$10.00</div>
            <div className="text-muted-foreground mt-1">One-time payment</div>
          </CardContent>
        </Card>
      </div>
      
      {/* Recent Subscriptions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Subscriptions</CardTitle>
          <CardDescription>
            Latest users who have subscribed to YieldHunter
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentSubscriptions.length > 0 ? (
            <div className="space-y-4">
              {recentSubscriptions.map((subscription, index) => (
                <div key={index} className="flex justify-between items-center">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mr-3">
                      <Users className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <div className="font-medium">{subscription.address}</div>
                      <div className="text-sm text-muted-foreground">{subscription.date}</div>
                    </div>
                  </div>
                  <div className="font-medium">{subscription.amount} ETH</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No subscription data available
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between border-t pt-4">
          <Button variant="outline" size="sm">
            View all transactions
          </Button>
          <Button variant="ghost" size="sm">
            Export <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardFooter>
      </Card>
      
      {/* Admin Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-500" />
            Important Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm">
            You're viewing this dashboard because your connected wallet is recognized as the contract owner. 
            This gives you access to manage subscription fees and withdraw funds from the contract. 
            To transfer ownership to another wallet, please use the Contract Interaction tools.
          </p>
          <Separator className="my-4" />
          <div className="text-sm">
            <div className="font-medium">Contract Details:</div>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Current withdrawal address: Your connected wallet</li>
              <li>You can change the subscription fee at any time</li>
              <li>All funds can be withdrawn directly to your wallet</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;