import YieldOverview from "@/components/dashboard/yield-overview";
import OpportunitiesTable from "@/components/dashboard/opportunities-table";
import SocialPostComposer from "@/components/dashboard/social-post-composer";
import RecentActivity from "@/components/dashboard/recent-activity";
import HistoricalPerformance from "@/components/dashboard/historical-performance";
import AgentConfiguration from "@/components/dashboard/agent-configuration";
import { TransactionHistory } from "@/components/dashboard/transaction-history";
import Header from "@/components/layout/header";
import { useWallet } from "@/hooks/use-wallet";

export default function Dashboard() {
  const { walletState } = useWallet();
  
  return (
    <div>
      <Header title="Dashboard" />
      
      <div className="p-4 md:p-6">
        {/* Yield Overview Section */}
        <YieldOverview />
        
        {/* Opportunities and Social Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Left Column: Top Opportunities */}
          <div className="lg:col-span-2">
            <OpportunitiesTable />
          </div>
          
          {/* Right Column: Social & Activities */}
          <div className="space-y-6">
            <SocialPostComposer />
            <RecentActivity />
          </div>
        </div>
        
        {/* Transaction History Section (only shown when wallet is connected) */}
        {walletState?.connected && (
          <div className="mb-8">
            <TransactionHistory />
          </div>
        )}
        
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
