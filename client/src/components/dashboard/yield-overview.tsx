import { useQuery } from "@tanstack/react-query";
import { TrendingUp } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function YieldOverview() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["/api/analytics/summary"],
  });

  const handleRefresh = () => {
    refetch();
  };

  return (
    <div className="mb-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold">Yield Optimization</h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">AI-powered yield opportunities across DeFi protocols</p>
        </div>
        <div className="mt-3 md:mt-0 flex items-center space-x-2">
          <Select defaultValue="all">
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Select Network" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Networks</SelectItem>
              <SelectItem value="ethereum">Ethereum</SelectItem>
              <SelectItem value="polygon">Polygon</SelectItem>
              <SelectItem value="arbitrum">Arbitrum</SelectItem>
              <SelectItem value="optimism">Optimism</SelectItem>
              <SelectItem value="solana">Solana</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleRefresh}>
            Refresh Data
          </Button>
        </div>
      </div>
      
      {/* Status Card */}
      <Card>
        <CardHeader className="bg-neutral-50 dark:bg-neutral-700/20 p-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-primary-600 dark:text-primary-400" />
              </div>
              <div>
                <h3 className="font-bold">AI Yield Agent Status</h3>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  Last updated: {isLoading ? <Skeleton className="h-4 w-24 inline-block" /> : new Date().toLocaleString()}
                </p>
              </div>
            </div>
            <div className="mt-4 md:mt-0 flex items-center space-x-3">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm">Agent Online</span>
              </div>
              <Button variant="ghost" size="icon">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                </svg>
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-neutral-50 dark:bg-neutral-700/20 rounded-md p-4">
              <div className="text-sm text-neutral-500 dark:text-neutral-400">Protocols Analyzed</div>
              <div className="flex items-end mt-1">
                {isLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <>
                    <div className="text-2xl font-bold">
                      {data?.opportunitiesCount || 0}
                    </div>
                    <div className="ml-2 text-xs text-green-500">+3 today</div>
                  </>
                )}
              </div>
            </div>
            
            <div className="bg-neutral-50 dark:bg-neutral-700/20 rounded-md p-4">
              <div className="text-sm text-neutral-500 dark:text-neutral-400">Best Current APY</div>
              <div className="flex items-end mt-1">
                {isLoading ? (
                  <Skeleton className="h-8 w-24" />
                ) : (
                  <>
                    <div className="text-2xl font-bold text-green-500">
                      {data?.avgApy ? `${data.avgApy.toFixed(1)}%` : "0%"}
                    </div>
                    <div className="ml-2 text-xs">on Aave v3</div>
                  </>
                )}
              </div>
            </div>
            
            <div className="bg-neutral-50 dark:bg-neutral-700/20 rounded-md p-4">
              <div className="text-sm text-neutral-500 dark:text-neutral-400">Social Posts</div>
              <div className="flex items-end mt-1">
                {isLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <>
                    <div className="text-2xl font-bold">7</div>
                    <div className="ml-2 text-xs text-neutral-500">this week</div>
                  </>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
