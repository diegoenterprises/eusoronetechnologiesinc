/**
 * Wallet - Add Funds
 * Journey Document: All user journeys - Section 8
 * 
 * NO MOCK DATA - All data from tRPC queries
 */

import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ArrowLeft, CreditCard, Building2, DollarSign, Plus, AlertCircle } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { toast } from 'sonner';

export default function WalletAddFunds() {
  const [, setLocation] = useLocation();
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('bank');

  const { data: balance, isLoading: balanceLoading } = trpc.wallet.getBalance.useQuery();
  const { data: accounts } = trpc.wallet.getLinkedAccounts.useQuery();
  
  const addFundsMutation = trpc.wallet.addFunds.useMutation({
    onSuccess: () => {
      toast.success('Funds added successfully!');
      setLocation('/wallet');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to add funds');
    },
  });

  const quickAmounts = [100, 500, 1000, 5000];

  if (balanceLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-32" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  const handleSubmit = () => {
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    addFundsMutation.mutate({ amount: amountNum, method: paymentMethod });
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/wallet">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Plus className="h-6 w-6 text-green-500" />
            Add Funds
          </h1>
          <p className="text-muted-foreground">Add money to your EusoWallet</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Current Balance</p>
              <p className="text-3xl font-bold">${balance?.available?.toLocaleString() || '0.00'}</p>
            </div>
            <div className="p-4 rounded-full bg-green-100">
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Amount</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-4 gap-2">
            {quickAmounts.map((amt) => (
              <Button
                key={amt}
                variant={amount === String(amt) ? 'default' : 'outline'}
                onClick={() => setAmount(String(amt))}
              >
                ${amt.toLocaleString()}
              </Button>
            ))}
          </div>
          <div className="space-y-2">
            <Label htmlFor="amount">Custom Amount</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="amount"
                type="number"
                placeholder="0.00"
                className="pl-8"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payment Method</CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
            <div className="space-y-3">
              {accounts?.map((account: any) => (
                <div key={account.id} className="flex items-center space-x-3 p-4 rounded-lg border">
                  <RadioGroupItem value={account.id} id={account.id} />
                  <Label htmlFor={account.id} className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-3">
                      {account.type === 'bank' ? (
                        <Building2 className="h-5 w-5 text-blue-500" />
                      ) : (
                        <CreditCard className="h-5 w-5 text-purple-500" />
                      )}
                      <div>
                        <p className="font-medium">{account.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {account.type === 'bank' ? 'Bank Account' : 'Credit Card'} ending in {account.last4}
                        </p>
                      </div>
                    </div>
                  </Label>
                </div>
              ))}
              {(!accounts || accounts.length === 0) && (
                <div className="p-4 rounded-lg border border-dashed text-center">
                  <p className="text-muted-foreground">No payment methods linked</p>
                  <Link href="/wallet/accounts/link">
                    <Button variant="link" className="mt-2">
                      <Plus className="h-4 w-4 mr-1" />
                      Link Account
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </RadioGroup>
        </CardContent>
        <CardFooter className="flex-col gap-4">
          <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-50 text-blue-800 text-sm w-full">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <p>Bank transfers typically take 1-3 business days to process.</p>
          </div>
          <Button 
            className="w-full" 
            size="lg"
            disabled={!amount || parseFloat(amount) <= 0 || addFundsMutation.isPending}
            onClick={handleSubmit}
          >
            {addFundsMutation.isPending ? 'Processing...' : `Add $${parseFloat(amount || '0').toLocaleString()}`}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
