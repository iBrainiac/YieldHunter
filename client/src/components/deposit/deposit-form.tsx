import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useWallet } from "@/hooks/use-wallet";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Slider
} from "@/components/ui/slider";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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

interface DepositFormProps {
  opportunity: Opportunity;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function DepositForm({ opportunity, isOpen, onOpenChange }: DepositFormProps) {
  const { walletState } = useWallet();
  const [amount, setAmount] = useState(0.1);
  const [transactionHash, setTransactionHash] = useState<string | null>(null);
  const [transactionSuccess, setTransactionSuccess] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Extract balance as a number
  const balanceString = walletState?.balance || "0 ETH";
  const maxBalance = parseFloat(balanceString.split(" ")[0]);

  const depositMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/transaction", {
        opportunityId: opportunity.id,
        amount: `${amount.toFixed(2)} ETH`
      });
      return response.json();
    },
    onSuccess: (data) => {
      setTransactionHash(data.transactionHash);
      setTransactionSuccess(true);
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/activities/recent"] });
      
      toast({
        title: "Deposit Successful",
        description: `Successfully deposited ${amount.toFixed(2)} ETH into ${opportunity.protocol?.name}`
      });
    },
    onError: (error) => {
      toast({
        title: "Deposit Failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
    }
  });

  const handleDeposit = () => {
    if (!walletState?.connected) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet first",
        variant: "destructive"
      });
      return;
    }
    
    depositMutation.mutate();
  };

  const handleClose = () => {
    // Reset state when closing
    setTransactionHash(null);
    setTransactionSuccess(false);
    onOpenChange(false);
  };

  // Get risk badge color
  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel.toLowerCase()) {
      case "low":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
      case "medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400";
      case "high":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400";
      default:
        return "";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Deposit Funds</DialogTitle>
          <DialogDescription>
            Deposit your funds to earn yield on {opportunity.protocol?.name}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {transactionSuccess ? (
            <div className="space-y-4">
              <div className="rounded-lg bg-green-50 dark:bg-green-900/20 p-4 text-center">
                <h3 className="font-medium text-green-800 dark:text-green-400">Transaction Successful</h3>
                <p className="mt-1 text-sm text-green-700 dark:text-green-300">
                  Your deposit has been processed and will start earning yield immediately.
                </p>
                <div className="mt-2 text-xs font-mono break-all text-neutral-500 dark:text-neutral-400">
                  TX: {transactionHash}
                </div>
              </div>
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-base">Transaction Details</CardTitle>
                </CardHeader>
                <CardContent className="py-2">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-neutral-500 dark:text-neutral-400">Amount</span>
                      <span className="font-medium">{amount.toFixed(2)} ETH</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-neutral-500 dark:text-neutral-400">Protocol</span>
                      <span className="font-medium">{opportunity.protocol?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-neutral-500 dark:text-neutral-400">Asset</span>
                      <span className="font-medium">{opportunity.asset}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-neutral-500 dark:text-neutral-400">APY</span>
                      <span className="font-medium text-green-600 dark:text-green-400">{opportunity.apy.toFixed(1)}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="space-y-6">
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-base">{opportunity.protocol?.name}</CardTitle>
                    <Badge variant="outline" className={getRiskColor(opportunity.riskLevel)}>
                      {opportunity.riskLevel} Risk
                    </Badge>
                  </div>
                  <CardDescription>{opportunity.details}</CardDescription>
                </CardHeader>
                <CardContent className="pb-2">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-sm text-neutral-500 dark:text-neutral-400">Current APY</div>
                      <div className="text-xl font-semibold text-green-600 dark:text-green-400">{opportunity.apy.toFixed(1)}%</div>
                    </div>
                    <div>
                      <div className="text-sm text-neutral-500 dark:text-neutral-400">Asset</div>
                      <div className="text-xl font-semibold">{opportunity.asset}</div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="text-xs text-neutral-500 flex justify-between">
                  <span>Network: {opportunity.network?.name}</span>
                  <span>TVL: ${(opportunity.tvl / 1000000).toFixed(1)}M</span>
                </CardFooter>
              </Card>

              <div className="space-y-4">
                <div>
                  <div className="mb-2 flex justify-between">
                    <label className="text-sm font-medium">Amount to Deposit</label>
                    <span className="text-sm">{amount.toFixed(2)} ETH</span>
                  </div>
                  <Slider
                    value={[amount]}
                    min={0.01}
                    max={maxBalance}
                    step={0.01}
                    onValueChange={(value) => setAmount(value[0])}
                  />
                  <div className="mt-1 flex justify-between text-xs text-neutral-500">
                    <span>Min: 0.01 ETH</span>
                    <span>Max: {maxBalance.toFixed(2)} ETH</span>
                  </div>
                </div>

                <div className="bg-neutral-50 dark:bg-neutral-800 rounded-md p-3">
                  <div className="flex justify-between text-sm">
                    <span>Estimated Annual Yield</span>
                    <span className="font-medium text-green-600 dark:text-green-400">
                      {(amount * opportunity.apy / 100).toFixed(4)} ETH
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-neutral-500 mt-1">
                    <span>Monthly</span>
                    <span>{(amount * opportunity.apy / 100 / 12).toFixed(4)} ETH</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row sm:justify-between">
          {transactionSuccess ? (
            <Button onClick={handleClose}>Close</Button>
          ) : (
            <>
              <Button
                variant="secondary"
                onClick={handleClose}
                disabled={depositMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                onClick={handleDeposit}
                disabled={depositMutation.isPending || !walletState?.connected}
              >
                {depositMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  `Deposit ${amount.toFixed(2)} ETH`
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}