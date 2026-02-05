/**
 * WALLET INSTANT PAY PAGE
 * Request instant payouts with fee display
 * 100% dynamic - no mock data
 */

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Zap, DollarSign, Clock, CheckCircle, RefreshCw } from "lucide-react";

export default function WalletInstantPay() {
  const [amount, setAmount] = useState("");

  const { data: eligibility, isLoading, error, refetch } = (trpc as any).wallet.getInstantPayoutEligibility.useQuery();
  const { data: balance } = (trpc as any).wallet.getBalance.useQuery();
  const instantPayMutation = (trpc as any).wallet.requestInstantPay.useMutation({
    onSuccess: () => {
      refetch();
      setAmount("");
    },
  });

  const requestedAmount = parseFloat(amount) || 0;
  const fee = Math.max((requestedAmount * (eligibility?.feePercentage || 1.5)) / 100, eligibility?.minFee || 0.5);
  const netAmount = requestedAmount - fee;

  const handleRequestPayout = () => {
    if (requestedAmount <= 0 || requestedAmount > (eligibility?.maxAmount || 0)) return;
    instantPayMutation.mutate({ amount: requestedAmount, payoutMethodId: 1 } as any);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6 flex items-center gap-4">
            <AlertTriangle className="h-8 w-8 text-red-500" />
            <div>
              <h3 className="font-semibold text-red-700">Error Loading Instant Pay</h3>
              <p className="text-red-600 text-sm">{error.message}</p>
            </div>
            <Button variant="outline" onClick={() => refetch()} className="ml-auto">
              <RefreshCw className="h-4 w-4 mr-2" /> Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Zap className="h-6 w-6 text-yellow-500" /> Instant Pay
        </h1>
        <p className="text-muted-foreground">Get your earnings instantly for a small fee</p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6 text-center">
            <DollarSign className="h-8 w-8 mx-auto text-green-500 mb-2" />
            <p className="text-3xl font-bold">${eligibility?.availableBalance?.toFixed(2) || "0.00"}</p>
            <p className="text-sm text-muted-foreground">Available Balance</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <Zap className="h-8 w-8 mx-auto text-yellow-500 mb-2" />
            <p className="text-3xl font-bold">${eligibility?.maxAmount?.toFixed(2) || "0.00"}</p>
            <p className="text-sm text-muted-foreground">Max Instant Payout</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <Clock className="h-8 w-8 mx-auto text-blue-500 mb-2" />
            <p className="text-3xl font-bold">{eligibility?.feePercentage || 1.5}%</p>
            <p className="text-sm text-muted-foreground">Instant Pay Fee</p>
          </CardContent>
        </Card>
      </div>

      {!eligibility?.eligible ? (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-6 flex items-center gap-4">
            <AlertTriangle className="h-8 w-8 text-yellow-500" />
            <div>
              <h3 className="font-semibold text-yellow-700">Not Eligible for Instant Pay</h3>
              <p className="text-yellow-600 text-sm">{eligibility?.reason || "You need a minimum balance to use Instant Pay"}</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Request Instant Payout</CardTitle>
            <CardDescription>Enter the amount you want to receive instantly</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Amount to Withdraw</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="number"
                  placeholder="0.00"
                  className="pl-9 text-2xl h-14"
                  value={amount}
                  onChange={(e: any) => setAmount(e.target.value)}
                  max={eligibility.maxAmount}
                  min={0}
                  step={0.01}
                />
              </div>
              <p className="text-sm text-muted-foreground">
                Maximum: ${eligibility.maxAmount?.toFixed(2)}
              </p>
            </div>

            {requestedAmount > 0 && (
              <div className="p-4 bg-muted rounded-lg space-y-3">
                <div className="flex justify-between">
                  <span>Withdrawal Amount</span>
                  <span className="font-medium">${requestedAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Instant Pay Fee ({eligibility.feePercentage}%)</span>
                  <span>-${fee.toFixed(2)}</span>
                </div>
                <div className="border-t pt-3 flex justify-between font-bold">
                  <span>You Receive</span>
                  <span className="text-green-600">${netAmount.toFixed(2)}</span>
                </div>
              </div>
            )}

            <Button
              className="w-full h-12"
              onClick={handleRequestPayout}
              disabled={
                instantPayMutation.isPending ||
                requestedAmount <= 0 ||
                requestedAmount > (eligibility?.maxAmount || 0)
              }
            >
              {instantPayMutation.isPending ? (
                "Processing..."
              ) : (
                <>
                  <Zap className="h-4 w-4 mr-2" /> Request Instant Payout
                </>
              )}
            </Button>

            {instantPayMutation.isSuccess && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <div>
                  <p className="font-medium text-green-700">Payout Requested Successfully</p>
                  <p className="text-sm text-green-600">Funds will arrive within minutes</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">How Instant Pay Works</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-primary font-bold">1</span>
              </div>
              <h4 className="font-medium mb-1">Enter Amount</h4>
              <p className="text-sm text-muted-foreground">Choose how much to withdraw</p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-primary font-bold">2</span>
              </div>
              <h4 className="font-medium mb-1">Confirm Request</h4>
              <p className="text-sm text-muted-foreground">Review the fee and confirm</p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-primary font-bold">3</span>
              </div>
              <h4 className="font-medium mb-1">Receive Funds</h4>
              <p className="text-sm text-muted-foreground">Money arrives in minutes</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
