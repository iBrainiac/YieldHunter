import { useState } from "react";
import { useWallet } from "@/hooks/use-wallet";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2, Wallet } from "lucide-react";
import { ethereumService } from "@/lib/ethereum";

export function ConnectWallet() {
  const { walletState, isConnecting, isSwitchingNetwork, connect, disconnect } = useWallet();
  const [open, setOpen] = useState(false);

  const handleConnect = async () => {
    try {
      await connect();
      setOpen(false);
    } catch (error) {
      console.error("Connection error:", error);
      // Error handling is done in the wallet context
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnect();
    } catch (error) {
      console.error("Disconnection error:", error);
      // Error handling is done in the wallet context
    }
  };

  if (walletState?.connected) {
    return (
      <div className="flex items-center gap-3">
        <div className="text-right hidden sm:block">
          <p className="text-xs text-muted-foreground">
            {walletState.balance}
          </p>
          <p className="text-sm font-medium truncate max-w-[120px]">
            {walletState.address.substring(0, 6)}...{walletState.address.substring(
              walletState.address.length - 4
            )}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleDisconnect}
        >
          Disconnect
        </Button>
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Wallet className="mr-2 h-4 w-4" />
          Connect Wallet
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Connect your wallet</DialogTitle>
          <DialogDescription>
            Connect your wallet to deposit funds and start earning yield
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <div className="flex flex-col gap-4">
            <Button
              variant="outline"
              className="flex items-center justify-between w-full py-6"
              onClick={handleConnect}
              disabled={isConnecting || isSwitchingNetwork || !ethereumService.isMetaMaskInstalled()}
            >
              <div className="flex items-center gap-3">
                <img
                  src="https://metamask.io/images/metamask-fox.svg"
                  alt="MetaMask"
                  className="w-8 h-8"
                />
                <div className="text-left">
                  <p className="font-medium">MetaMask</p>
                  <p className="text-sm text-muted-foreground">
                    Connect to your MetaMask wallet
                  </p>
                </div>
              </div>
              {(isConnecting || isSwitchingNetwork) && (
                <Loader2 className="h-5 w-5 animate-spin" />
              )}
            </Button>
            {!ethereumService.isMetaMaskInstalled() && (
              <p className="text-sm text-yellow-600">
                MetaMask extension is not installed. Please install MetaMask to continue.
              </p>
            )}
          </div>
        </div>
        <DialogFooter className="flex flex-col-reverse sm:flex-row">
          <Button variant="secondary" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <p className="text-xs text-muted-foreground mb-2 sm:mb-0 sm:ml-auto">
            Transactions use the Sepolia testnet
          </p>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}