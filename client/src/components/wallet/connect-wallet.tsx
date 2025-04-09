import { useState } from "react";
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
import { useWallet } from "@/hooks/use-wallet";

export default function ConnectWallet() {
  const [isOpen, setIsOpen] = useState(false);
  const { walletState, isConnecting, isDisconnecting, connect, disconnect } = useWallet();

  const handleConnectClick = () => {
    if (walletState?.connected) {
      disconnect();
    } else {
      setIsOpen(true);
    }
  };

  const handleConnect = () => {
    connect().then(() => {
      setIsOpen(false);
    });
  };

  const isPending = isConnecting || isDisconnecting;
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