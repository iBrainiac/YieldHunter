import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Wallet } from "lucide-react";

interface WalletState {
  address: string;
  balance: string;
  connected: boolean;
}

export default function ConnectWallet() {
  const [isOpen, setIsOpen] = useState(false);
  const [walletState, setWalletState] = useState<WalletState | null>(null);
  const { toast } = useToast();

  const connectMutation = useMutation({
    mutationFn: async () => {
      // In a real app, this would connect to MetaMask or other wallet
      // For demo purposes, we'll use our mock API endpoint
      const mockAddress = "0x" + Math.random().toString(16).substring(2, 42);
      const response = await apiRequest("POST", "/api/wallet/connect", {
        address: mockAddress,
      });
      return response.json();
    },
    onSuccess: (data) => {
      setWalletState(data);
      toast({
        title: "Wallet Connected",
        description: `Connected to ${data.address.substring(0, 6)}...${data.address.substring(
          data.address.length - 4
        )}`,
      });
      setIsOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Connection Failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/wallet/disconnect", {});
      return response.json();
    },
    onSuccess: () => {
      setWalletState(null);
      toast({
        title: "Wallet Disconnected",
        description: "Your wallet has been disconnected",
      });
    },
  });

  const handleConnectClick = () => {
    if (walletState?.connected) {
      disconnectMutation.mutate();
    } else {
      setIsOpen(true);
    }
  };

  const handleConnect = () => {
    connectMutation.mutate();
  };

  const isPending = connectMutation.isPending || disconnectMutation.isPending;
  const buttonText = walletState?.connected
    ? `${walletState.address.substring(0, 6)}...${walletState.address.substring(
        walletState.address.length - 4
      )} (${walletState.balance})`
    : "Connect Wallet";

  return (
    <>
      <Button
        variant={walletState?.connected ? "default" : "outline"}
        size="sm"
        className="flex items-center gap-2"
        onClick={handleConnectClick}
        disabled={isPending}
      >
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Wallet className="h-4 w-4" />
        )}
        {buttonText}
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Connect your wallet</DialogTitle>
            <DialogDescription>
              Connect your crypto wallet to access DeFi yield opportunities
            </DialogDescription>
          </DialogHeader>
          <div className="py-6">
            <div className="space-y-4">
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal"
                onClick={handleConnect}
                disabled={isPending}
              >
                <img
                  src="https://raw.githubusercontent.com/MetaMask/brand-resources/master/SVG/metamask-fox.svg"
                  alt="MetaMask"
                  className="mr-2 h-6 w-6"
                />
                MetaMask
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal"
                onClick={handleConnect}
                disabled={isPending}
              >
                <img
                  src="https://app.walletconnect.com/favicon.ico"
                  alt="WalletConnect"
                  className="mr-2 h-6 w-6"
                />
                WalletConnect
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal"
                onClick={handleConnect}
                disabled={isPending}
              >
                <img
                  src="https://coinbase.com/favicon.ico"
                  alt="Coinbase Wallet"
                  className="mr-2 h-6 w-6"
                />
                Coinbase Wallet
              </Button>
            </div>
          </div>
          <DialogFooter className="flex flex-col sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsOpen(false)}
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}