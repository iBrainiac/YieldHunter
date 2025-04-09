import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useWallet } from "@/hooks/use-wallet";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Loader2 } from "lucide-react";

const depositFormSchema = z.object({
  amount: z
    .string()
    .min(1, "Amount is required")
    .refine(
      (value) => {
        const num = Number(value);
        return !isNaN(num) && num > 0;
      },
      {
        message: "Amount must be a positive number",
      }
    ),
});

type DepositFormValues = z.infer<typeof depositFormSchema>;

interface DepositFormProps {
  protocolName: string;
  asset: string;
  apy: number;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function DepositForm({
  protocolName,
  asset,
  apy,
  onSuccess,
  onCancel,
}: DepositFormProps) {
  const { walletState, depositToProtocol } = useWallet();
  const [isDepositing, setIsDepositing] = useState(false);

  const form = useForm<DepositFormValues>({
    resolver: zodResolver(depositFormSchema),
    defaultValues: {
      amount: "",
    },
  });

  async function onSubmit(data: DepositFormValues) {
    try {
      setIsDepositing(true);
      
      // Execute the deposit
      await depositToProtocol(protocolName, data.amount);
      
      // Call the onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Deposit error:", error);
      // Error handling is done within the wallet context
    } finally {
      setIsDepositing(false);
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Deposit to {protocolName}</CardTitle>
        <CardDescription>
          Earn {apy}% APY by depositing {asset}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input placeholder="0.0" {...field} />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <span className="text-sm text-gray-500">ETH</span>
                      </div>
                    </div>
                  </FormControl>
                  <FormDescription>
                    Available: {walletState?.balance || "0.0000 ETH"}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-between text-sm text-gray-500">
              <span>Expected APY</span>
              <span>{apy}%</span>
            </div>

            <Separator className="my-4" />

            <div className="space-y-2">
              <Button
                type="submit"
                className="w-full"
                disabled={isDepositing || !walletState?.connected}
              >
                {isDepositing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Depositing...
                  </>
                ) : (
                  "Deposit"
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={onCancel}
                disabled={isDepositing}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex justify-center text-xs text-gray-500">
        Transaction will be processed on Sepolia Testnet
      </CardFooter>
    </Card>
  );
}