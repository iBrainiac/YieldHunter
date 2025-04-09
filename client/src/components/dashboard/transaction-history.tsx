import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useWallet } from "@/hooks/use-wallet";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ExternalLink, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { format } from "date-fns";
import { TESTNET_CONFIG } from "@/lib/ethereum";

interface Transaction {
  id: number;
  hash: string;
  type: "deposit" | "withdraw" | "transfer" | "borrow" | "repay";
  protocolName?: string;
  asset: string;
  amount: string;
  timestamp: string;
  success: boolean;
}

export function TransactionHistory() {
  const { walletState } = useWallet();
  const [activeTab, setActiveTab] = useState("all");

  // Query user's transaction history
  const { data: transactions, isLoading } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions", walletState?.address],
    enabled: !!walletState?.address,
    queryFn: async () => {
      const { api } = await import("@/lib/api");
      return api.transaction.getHistory();
    }
  });

  // Filter transactions based on active tab
  const filteredTransactions = transactions?.filter(tx => {
    if (activeTab === "all") return true;
    return tx.type === activeTab;
  }) || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transaction History</CardTitle>
        <CardDescription>
          Your recent transactions on the blockchain
        </CardDescription>
      </CardHeader>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="px-4">
        <TabsList className="grid grid-cols-5 mb-4">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="deposit">Deposits</TabsTrigger>
          <TabsTrigger value="withdraw">Withdrawals</TabsTrigger>
          <TabsTrigger value="borrow">Borrows</TabsTrigger>
          <TabsTrigger value="repay">Repayments</TabsTrigger>
        </TabsList>
      </Tabs>
      
      <CardContent>
        <div className="space-y-4">
          {!walletState?.connected ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                Connect your wallet to view transaction history
              </p>
            </div>
          ) : isLoading ? (
            // Loading state
            <>
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between border-b pb-4">
                  <div className="flex items-center space-x-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-[250px]" />
                      <Skeleton className="h-4 w-[200px]" />
                    </div>
                  </div>
                  <Skeleton className="h-4 w-[100px]" />
                </div>
              ))}
            </>
          ) : filteredTransactions.length > 0 ? (
            // Transaction list
            <>
              {filteredTransactions.map((tx) => (
                <TransactionItem key={tx.id} transaction={tx} />
              ))}
            </>
          ) : (
            // No transactions
            <div className="text-center py-8">
              <p className="text-muted-foreground">No transactions found</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function TransactionItem({ transaction }: { transaction: Transaction }) {
  // Get icon based on transaction type
  const getIcon = () => {
    switch (transaction.type) {
      case "deposit":
      case "repay":
        return <ArrowUpRight className="h-5 w-5 text-green-500" />;
      case "withdraw":
      case "borrow":
        return <ArrowDownLeft className="h-5 w-5 text-blue-500" />;
      default:
        return <ArrowUpRight className="h-5 w-5 text-gray-500" />;
    }
  };
  
  // Format transaction type for display
  const formatType = (type: string): string => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };
  
  // Create the transaction explorer URL with fallback
  const explorerUrl = `${TESTNET_CONFIG.blockExplorerUrl}/tx/${transaction.hash || "0x0"}`;
  
  // Format the transaction date
  const txDate = new Date(transaction.timestamp);
  const formattedDate = format(txDate, "MMM d, yyyy 'at' h:mm a");
  
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-4">
      <div className="flex items-start space-x-4">
        <div className="mt-1 flex-shrink-0">
          {getIcon()}
        </div>
        
        <div className="space-y-1">
          <div className="flex items-center">
            <p className="font-medium">{formatType(transaction.type)}</p>
            <Badge 
              variant={transaction.success ? "outline" : "destructive"} 
              className="ml-2"
            >
              {transaction.success ? "Success" : "Failed"}
            </Badge>
          </div>
          
          <p className="text-sm text-muted-foreground">
            {transaction.amount} {transaction.asset}
            {transaction.protocolName && ` to ${transaction.protocolName}`}
          </p>
          
          <div className="flex items-center text-xs text-muted-foreground">
            <span>{formattedDate}</span>
            <a 
              href={explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center ml-2 text-blue-500 hover:underline"
            >
              View on Etherscan
              <ExternalLink className="h-3 w-3 ml-1" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}