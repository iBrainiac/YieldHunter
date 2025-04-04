import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface Protocol {
  id: number;
  name: string;
  logo: string;
}

interface Network {
  id: number;
  name: string;
  shortName: string;
  logo: string;
}

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
  protocol?: Protocol;
  network?: Network;
}

export default function OpportunitiesTable() {
  const [currentPage, setCurrentPage] = useState(1);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const itemsPerPage = 4;

  const { data, isLoading } = useQuery<Opportunity[]>({
    queryKey: ["/api/opportunities"],
  });

  const investMutation = useMutation({
    mutationFn: async (opportunityId: number) => {
      const response = await apiRequest("POST", "/api/transaction", {
        opportunityId,
        amount: "0.1 ETH", // Mocked amount
      });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Transaction Submitted",
        description: data.message,
      });
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/activities/recent"] });
    },
    onError: (error) => {
      toast({
        title: "Transaction Failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    },
  });

  const handleInvest = (opportunityId: number) => {
    investMutation.mutate(opportunityId);
  };

  // Calculate pagination
  const totalItems = data?.length || 0;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = data?.slice(startIndex, startIndex + itemsPerPage) || [];

  const getRiskBadge = (riskLevel: string) => {
    switch (riskLevel.toLowerCase()) {
      case "low":
        return <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">Low</Badge>;
      case "medium":
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">Medium</Badge>;
      case "high":
        return <Badge variant="outline" className="bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400">High</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <h3 className="font-bold">Top Yield Opportunities</h3>
        <Button variant="link">View All</Button>
      </CardHeader>
      
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-neutral-50 dark:bg-neutral-700/20">
            <TableRow>
              <TableHead>Protocol</TableHead>
              <TableHead>Asset</TableHead>
              <TableHead>Network</TableHead>
              <TableHead>APY</TableHead>
              <TableHead>Risk</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array(4).fill(null).map((_, index) => (
                <TableRow key={index}>
                  <TableCell><Skeleton className="h-8 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-12" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : (
              paginatedData.map((opportunity) => (
                <TableRow key={opportunity.id}>
                  <TableCell>
                    <div className="flex items-center">
                      <div className={`flex-shrink-0 h-8 w-8 rounded-full bg-${getProtocolColor(opportunity.protocol?.name || "")} flex items-center justify-center`}>
                        <span className={`text-${getProtocolColor(opportunity.protocol?.name || "")}-600 text-xs font-medium`}>
                          {opportunity.protocol?.logo || "??"}
                        </span>
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium">{opportunity.protocol?.name || "Unknown"}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{opportunity.asset}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <div className={`h-4 w-4 rounded-full bg-${getNetworkColor(opportunity.network?.name || "")} flex items-center justify-center mr-2`}>
                        <span className={`text-${getNetworkColor(opportunity.network?.name || "")}-800 text-xs`}>
                          {opportunity.network?.logo || "?"}
                        </span>
                      </div>
                      <span className="text-sm">{opportunity.network?.name || "Unknown"}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm font-medium text-green-500">{opportunity.apy.toFixed(1)}%</div>
                  </TableCell>
                  <TableCell>
                    {getRiskBadge(opportunity.riskLevel)}
                  </TableCell>
                  <TableCell className="text-right text-sm font-medium">
                    <Button 
                      variant="link" 
                      onClick={() => handleInvest(opportunity.id)}
                      disabled={investMutation.isPending}
                    >
                      Invest
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      
      <CardFooter className="bg-neutral-50 dark:bg-neutral-700/20 px-4 py-3 flex items-center justify-between">
        <div>
          <p className="text-sm text-neutral-700 dark:text-neutral-300">
            Showing <span className="font-medium">{startIndex + 1}</span> to{" "}
            <span className="font-medium">
              {Math.min(startIndex + itemsPerPage, totalItems)}
            </span>{" "}
            of <span className="font-medium">{totalItems}</span> results
          </p>
        </div>
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} 
                isActive={currentPage > 1}
              />
            </PaginationItem>
            
            {Array.from({ length: Math.min(totalPages, 3) }, (_, i) => (
              <PaginationItem key={i}>
                <PaginationLink
                  isActive={currentPage === i + 1}
                  onClick={() => setCurrentPage(i + 1)}
                >
                  {i + 1}
                </PaginationLink>
              </PaginationItem>
            ))}
            
            <PaginationItem>
              <PaginationNext 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} 
                isActive={currentPage < totalPages}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </CardFooter>
    </Card>
  );
}

// Helper function to get color based on protocol name
function getProtocolColor(name: string): string {
  const protocolColors: Record<string, string> = {
    "Aave": "blue",
    "Compound": "green",
    "PancakeSwap": "red",
    "Curve": "indigo",
    "SushiSwap": "purple",
    "Convex": "yellow"
  };
  
  for (const [protocol, color] of Object.entries(protocolColors)) {
    if (name.includes(protocol)) {
      return color;
    }
  }
  
  return "gray";
}

// Helper function to get color based on network name
function getNetworkColor(name: string): string {
  const networkColors: Record<string, string> = {
    "Ethereum": "blue",
    "Polygon": "purple",
    "Binance": "yellow",
    "BSC": "yellow",
    "Arbitrum": "indigo",
    "Optimism": "red",
    "Solana": "green"
  };
  
  for (const [network, color] of Object.entries(networkColors)) {
    if (name.includes(network)) {
      return color;
    }
  }
  
  return "gray";
}
