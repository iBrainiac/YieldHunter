import { useState } from "react";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { Wifi } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface WalletState {
  connected: boolean;
  address: string;
  balance: string;
}

interface WalletConnectorProps {
  collapsed?: boolean;
}

export default function WalletConnector({ collapsed = false }: WalletConnectorProps) {
  const [wallet, setWallet] = useState<WalletState>({
    connected: false,
    address: "",
    balance: "0 ETH"
  });

  const queryClient = useQueryClient();

  const connectMutation = useMutation({
    mutationFn: async () => {
      // Generate a random ETH address for demo purposes
      const address = `0x${Math.random().toString(16).substring(2, 14)}...${Math.random().toString(16).substring(2, 6)}`;
      const response = await apiRequest("POST", "/api/wallet/connect", { address });
      return response.json();
    },
    onSuccess: (data) => {
      setWallet({
        connected: true,
        address: data.address,
        balance: data.balance
      });
      // Invalidate relevant queries that might depend on wallet state
      queryClient.invalidateQueries({ queryKey: ["/api/opportunities"] });
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/wallet/disconnect", {});
      return response.json();
    },
    onSuccess: () => {
      setWallet({
        connected: false,
        address: "",
        balance: "0 ETH"
      });
    },
  });

  if (wallet.connected) {
    return (
      <div className="wallet-connected">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm font-medium">Connected</span>
          </div>
          <button 
            onClick={() => disconnectMutation.mutate()}
            className="text-xs text-primary-500 hover:text-primary-600 dark:text-primary-400 dark:hover:text-primary-300"
          >
            Disconnect
          </button>
        </div>
        {!collapsed && (
          <div className="mt-2 p-2 bg-neutral-100 dark:bg-neutral-700 rounded-md">
            <p className="font-mono text-xs truncate">{wallet.address}</p>
            <div className="flex items-center justify-between mt-1">
              <span className="text-xs text-neutral-500 dark:text-neutral-400">Balance</span>
              <span className="text-sm font-medium">{wallet.balance}</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="wallet-disconnected">
      <Button
        onClick={() => connectMutation.mutate()}
        className={cn("w-full", collapsed && "p-2")}
        disabled={connectMutation.isPending}
      >
        <Wifi className={cn("h-5 w-5", !collapsed && "mr-2")} />
        {!collapsed && <span>Connect Wallet</span>}
      </Button>
    </div>
  );
}
