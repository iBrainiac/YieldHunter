import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, SlidersHorizontal, ExternalLink } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useWallet } from "@/hooks/use-wallet";
import { useToast } from "@/hooks/use-toast";
import { DepositForm } from "@/components/deposit/deposit-form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Opportunity {
  id: number;
  protocolId: number;
  networkId: number;
  asset: string;
  apy: number;
  tvl: number;
  riskLevel: string;
  details: string;
  url: string;
  timestamp: string;
  protocol?: {
    id: number;
    name: string;
    logo: string;
  };
  network?: {
    id: number;
    name: string;
    shortName: string;
    logo: string;
  };
}

export default function OpportunitiesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [networkFilter, setNetworkFilter] = useState("all");
  const [riskFilter, setRiskFilter] = useState("all");
  const [viewType, setViewType] = useState("grid");
  const [depositOpportunity, setDepositOpportunity] = useState<Opportunity | null>(null);
  const [isDepositOpen, setIsDepositOpen] = useState(false);
  
  const { data: opportunities, isLoading } = useQuery<Opportunity[]>({
    queryKey: ["/api/opportunities"],
  });
  
  // Filter opportunities based on search and filters
  const filteredOpportunities = opportunities?.filter(opp => {
    // Search filter
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = searchQuery === "" || 
      opp.asset.toLowerCase().includes(searchLower) ||
      opp.protocol?.name.toLowerCase().includes(searchLower) ||
      opp.network?.name.toLowerCase().includes(searchLower);
    
    // Network filter
    const matchesNetwork = networkFilter === "all" || 
      opp.network?.name.toLowerCase().includes(networkFilter.toLowerCase());
    
    // Risk filter
    const matchesRisk = riskFilter === "all" || 
      opp.riskLevel.toLowerCase() === riskFilter.toLowerCase();
    
    return matchesSearch && matchesNetwork && matchesRisk;
  });

  const handleOpenDeposit = (opportunity: Opportunity) => {
    setDepositOpportunity(opportunity);
    setIsDepositOpen(true);
  };

  const handleCloseDeposit = () => {
    setIsDepositOpen(false);
    setDepositOpportunity(null);
  };
  
  return (
    <div>
      <Header title="Yield Opportunities" />
      
      <div className="p-4 md:p-6">
        <Card className="mb-6">
          <CardHeader className="pb-0">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex items-center">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-neutral-500" />
                  <Input 
                    placeholder="Search opportunities..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              
              <div className="flex flex-wrap items-center gap-3">
                <Select value={networkFilter} onValueChange={setNetworkFilter}>
                  <SelectTrigger className="w-36">
                    <SelectValue placeholder="Network" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Networks</SelectItem>
                    <SelectItem value="ethereum">Ethereum</SelectItem>
                    <SelectItem value="polygon">Polygon</SelectItem>
                    <SelectItem value="bsc">BSC</SelectItem>
                    <SelectItem value="arbitrum">Arbitrum</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={riskFilter} onValueChange={setRiskFilter}>
                  <SelectTrigger className="w-36">
                    <SelectValue placeholder="Risk Level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Risks</SelectItem>
                    <SelectItem value="low">Low Risk</SelectItem>
                    <SelectItem value="medium">Medium Risk</SelectItem>
                    <SelectItem value="high">High Risk</SelectItem>
                  </SelectContent>
                </Select>
                
                <div className="border rounded-md p-1">
                  <Tabs value={viewType} onValueChange={setViewType} className="w-24">
                    <TabsList className="grid grid-cols-2">
                      <TabsTrigger value="grid" className="px-2">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><rect width="7" height="7" x="3" y="3" rx="1" /><rect width="7" height="7" x="14" y="3" rx="1" /><rect width="7" height="7" x="14" y="14" rx="1" /><rect width="7" height="7" x="3" y="14" rx="1" /></svg>
                      </TabsTrigger>
                      <TabsTrigger value="list" className="px-2">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><line x1="8" x2="21" y1="6" y2="6" /><line x1="8" x2="21" y1="12" y2="12" /><line x1="8" x2="21" y1="18" y2="18" /><line x1="3" x2="3.01" y1="6" y2="6" /><line x1="3" x2="3.01" y1="12" y2="12" /><line x1="3" x2="3.01" y1="18" y2="18" /></svg>
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="pt-6">
            {isLoading ? (
              viewType === "grid" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Array(6).fill(null).map((_, i) => (
                    <div key={i} className="border rounded-lg p-4">
                      <Skeleton className="h-6 w-32 mb-2" />
                      <Skeleton className="h-4 w-24 mb-4" />
                      <div className="flex justify-between items-center mb-4">
                        <Skeleton className="h-8 w-16" />
                        <Skeleton className="h-6 w-16" />
                      </div>
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-4 w-3/4 mb-6" />
                      <Skeleton className="h-9 w-full rounded-md" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  {Array(6).fill(null).map((_, i) => (
                    <div key={i} className="border-b p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="flex-1">
                        <Skeleton className="h-6 w-32 mb-2" />
                        <Skeleton className="h-4 w-24 mb-2" />
                        <Skeleton className="h-4 w-48" />
                      </div>
                      <div className="flex items-center gap-4">
                        <Skeleton className="h-8 w-16" />
                        <Skeleton className="h-6 w-16" />
                        <Skeleton className="h-9 w-24 rounded-md" />
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : filteredOpportunities && filteredOpportunities.length > 0 ? (
              viewType === "grid" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredOpportunities.map(opportunity => (
                    <OpportunityCard 
                      key={opportunity.id} 
                      opportunity={opportunity}
                      onDeposit={() => handleOpenDeposit(opportunity)}
                    />
                  ))}
                </div>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  {filteredOpportunities.map(opportunity => (
                    <OpportunityListItem 
                      key={opportunity.id} 
                      opportunity={opportunity}
                      onDeposit={() => handleOpenDeposit(opportunity)}
                    />
                  ))}
                </div>
              )
            ) : (
              <div className="text-center py-12">
                <h3 className="text-lg font-medium mb-2">No opportunities found</h3>
                <p className="text-neutral-500 dark:text-neutral-400">Try adjusting your filters or search query</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Deposit Dialog */}
      <Dialog open={isDepositOpen} onOpenChange={setIsDepositOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Deposit Funds</DialogTitle>
          </DialogHeader>
          {depositOpportunity && (
            <DepositForm
              protocolName={depositOpportunity.protocol?.name || "Protocol"}
              asset={depositOpportunity.asset}
              apy={depositOpportunity.apy}
              onSuccess={handleCloseDeposit}
              onCancel={handleCloseDeposit}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function OpportunityCard({ opportunity, onDeposit }: { opportunity: Opportunity; onDeposit: () => void }) {
  const { walletState } = useWallet();
  const { toast } = useToast();

  const getRiskColor = (risk: string) => {
    switch (risk.toLowerCase()) {
      case "low": return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
      case "medium": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400";
      case "high": return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400";
      default: return "bg-neutral-100 text-neutral-800 dark:bg-neutral-900/20 dark:text-neutral-400";
    }
  };

  const handleClick = () => {
    if (!walletState?.connected) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet first to deposit funds",
        variant: "destructive",
      });
      return;
    }
    onDeposit();
  };
  
  return (
    <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center mb-2">
        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-2">
          <span className="text-blue-600 text-xs font-medium">{opportunity.protocol?.logo || "P"}</span>
        </div>
        <div>
          <h3 className="font-medium">{opportunity.protocol?.name || "Unknown Protocol"}</h3>
          <div className="flex items-center text-sm text-neutral-500">
            <div className="h-3 w-3 rounded-full bg-purple-200 flex items-center justify-center mr-1">
              <span className="text-purple-800 text-[10px]">{opportunity.network?.logo || "?"}</span>
            </div>
            <span>{opportunity.network?.name || "Unknown Network"}</span>
          </div>
        </div>
      </div>
      
      <div className="flex justify-between items-center mb-4">
        <div className="text-2xl font-bold text-green-500">{opportunity.apy.toFixed(1)}%</div>
        <Badge className={getRiskColor(opportunity.riskLevel)}>
          {opportunity.riskLevel}
        </Badge>
      </div>
      
      <div className="mb-4">
        <div className="text-sm mb-1">Asset: <span className="font-medium">{opportunity.asset}</span></div>
        <div className="text-sm">TVL: <span className="font-medium">${opportunity.tvl ? (opportunity.tvl / 1000000).toFixed(1) + 'M' : "N/A"}</span></div>
      </div>
      
      <div className="flex space-x-2">
        <Button className="flex-1" onClick={handleClick}>
          Deposit Funds
        </Button>
        <Button variant="outline" size="icon" asChild>
          <a href={opportunity.url} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-4 w-4" />
          </a>
        </Button>
      </div>
    </div>
  );
}

function OpportunityListItem({ opportunity, onDeposit }: { opportunity: Opportunity; onDeposit: () => void }) {
  const { walletState } = useWallet();
  const { toast } = useToast();

  const getRiskColor = (risk: string) => {
    switch (risk.toLowerCase()) {
      case "low": return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
      case "medium": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400";
      case "high": return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400";
      default: return "bg-neutral-100 text-neutral-800 dark:bg-neutral-900/20 dark:text-neutral-400";
    }
  };

  const handleClick = () => {
    if (!walletState?.connected) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet first to deposit funds",
        variant: "destructive",
      });
      return;
    }
    onDeposit();
  };
  
  return (
    <div className="border-b last:border-b-0 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <div className="flex items-center mb-1">
          <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center mr-2">
            <span className="text-blue-600 text-xs font-medium">{opportunity.protocol?.logo || "P"}</span>
          </div>
          <h3 className="font-medium">{opportunity.protocol?.name || "Unknown Protocol"}</h3>
        </div>
        
        <div className="flex items-center text-sm text-neutral-500 mb-1">
          <div className="h-3 w-3 rounded-full bg-purple-200 flex items-center justify-center mr-1">
            <span className="text-purple-800 text-[10px]">{opportunity.network?.logo || "?"}</span>
          </div>
          <span>{opportunity.network?.name || "Unknown Network"}</span>
          <span className="mx-2">•</span>
          <span>Asset: {opportunity.asset}</span>
        </div>
        
        <div className="text-sm">
          {opportunity.details || "No additional details available"}
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="text-xl font-bold text-green-500">{opportunity.apy.toFixed(1)}%</div>
        <Badge className={getRiskColor(opportunity.riskLevel)}>
          {opportunity.riskLevel}
        </Badge>
        <div className="flex space-x-2">
          <Button size="sm" onClick={handleClick}>Deposit Funds</Button>
          <Button variant="outline" size="icon" asChild>
            <a href={opportunity.url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}
