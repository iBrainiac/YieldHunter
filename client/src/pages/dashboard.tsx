import YieldOverview from "@/components/dashboard/yield-overview";
import OpportunitiesTable from "@/components/dashboard/opportunities-table";
import SocialPostComposer from "@/components/dashboard/social-post-composer";
import RecentActivity from "@/components/dashboard/recent-activity";
import HistoricalPerformance from "@/components/dashboard/historical-performance";
import AgentConfiguration from "@/components/dashboard/agent-configuration";
import { TransactionHistory } from "@/components/dashboard/transaction-history";
import { CoinbaseAgentWallet } from "@/components/wallet/coinbase-agent-wallet";
import Header from "@/components/layout/header";
import { useWallet } from "@/hooks/use-wallet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";

export default function Dashboard() {
  const { walletState } = useWallet();
  
  return (
    <div>
      <Header title="Dashboard" />
      
      <div className="p-4 md:p-6">
        {/* Yield Overview Section */}
        <YieldOverview />
        
        {/* Wallet and Opportunities Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Left Column: Top Opportunities */}
          <div className="lg:col-span-2">
            <div className="mb-4 flex items-center">
              <h2 className="text-xl font-bold">Top Opportunities</h2>
              <Badge variant="outline" className="ml-2 bg-blue-50 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                <Sparkles className="w-3 h-3 mr-1" />
                AI Optimized
              </Badge>
            </div>
            <OpportunitiesTable />
          </div>
          
          {/* Right Column: Coinbase AgentKit Wallet */}
          <div>
            <CoinbaseAgentWallet />
          </div>
        </div>
        
        {/* Social and Activities Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Left Column */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="social">
              <TabsList className="mb-4">
                <TabsTrigger value="social">Social Posts</TabsTrigger>
                <TabsTrigger value="transactions">Transactions</TabsTrigger>
              </TabsList>
              <TabsContent value="social">
                <SocialPostComposer />
              </TabsContent>
              <TabsContent value="transactions">
                {walletState?.connected ? (
                  <TransactionHistory />
                ) : (
                  <div className="bg-muted rounded-lg p-6 text-center">
                    <p className="text-muted-foreground">
                      Connect your wallet to view transaction history
                    </p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
          
          {/* Right Column */}
          <div>
            <RecentActivity />
          </div>
        </div>
        
        {/* Historical Performance Section */}
        <HistoricalPerformance />
        
        {/* Agent Configuration Section */}
        <div className="mb-8">
          <AgentConfiguration />
        </div>
      </div>
    </div>
  );
}
