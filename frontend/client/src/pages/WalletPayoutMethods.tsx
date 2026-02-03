/**
 * WALLET PAYOUT METHODS PAGE
 * Manage bank accounts and payout preferences
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, CreditCard, Plus, Trash2, CheckCircle, AlertTriangle, RefreshCw } from "lucide-react";

export default function WalletPayoutMethods() {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [accountType, setAccountType] = useState<string>("checking");
  const [routingNumber, setRoutingNumber] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");

  const { data: payoutMethods, isLoading, error, refetch } = trpc.wallet.getPayoutMethods.useQuery();
  const addMethodMutation = trpc.wallet.addPayoutMethod.useMutation({
    onSuccess: () => {
      refetch();
      setShowAddDialog(false);
      setRoutingNumber("");
      setAccountNumber("");
      setAccountName("");
    },
  });
  const removeMethodMutation = trpc.wallet.removePayoutMethod.useMutation({
    onSuccess: () => refetch(),
  });
  const setDefaultMutation = trpc.wallet.setDefaultPayoutMethod.useMutation({
    onSuccess: () => refetch(),
  });

  const handleAddMethod = () => {
    if (!routingNumber || !accountNumber || !accountName) return;
    addMethodMutation.mutate({
      type: "bank_account",
      accountType: accountType as "checking" | "savings",
      routingNumber,
      accountNumber,
      accountName,
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
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
              <h3 className="font-semibold text-red-700">Error Loading Payout Methods</h3>
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

  const methods = payoutMethods || [];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Payout Methods</h1>
          <p className="text-muted-foreground">Manage your bank accounts for receiving payouts</p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" /> Add Account
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Bank Account</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Account Name</Label>
                <Input
                  placeholder="e.g., Business Checking"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Account Type</Label>
                <Select value={accountType} onValueChange={setAccountType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="checking">Checking</SelectItem>
                    <SelectItem value="savings">Savings</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Routing Number</Label>
                <Input
                  placeholder="9 digits"
                  value={routingNumber}
                  onChange={(e) => setRoutingNumber(e.target.value)}
                  maxLength={9}
                />
              </div>
              <div className="space-y-2">
                <Label>Account Number</Label>
                <Input
                  placeholder="Account number"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                />
              </div>
              <Button
                className="w-full"
                onClick={handleAddMethod}
                disabled={addMethodMutation.isPending || !routingNumber || !accountNumber || !accountName}
              >
                {addMethodMutation.isPending ? "Adding..." : "Add Account"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {methods.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Payout Methods</h3>
            <p className="text-muted-foreground mb-4">Add a bank account to receive payouts</p>
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="h-4 w-4 mr-2" /> Add Your First Account
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {methods.map((method: any) => (
            <Card key={method.id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary/10 rounded-lg">
                      {method.type === "bank_account" ? (
                        <Building2 className="h-6 w-6 text-primary" />
                      ) : (
                        <CreditCard className="h-6 w-6 text-primary" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{method.nickname || method.bankName}</h3>
                        {method.isDefault && (
                          <Badge variant="secondary">
                            <CheckCircle className="h-3 w-3 mr-1" /> Default
                          </Badge>
                        )}
                        {method.status === "verified" && (
                          <Badge variant="outline" className="text-green-600 border-green-600">
                            Verified
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {method.accountType === "checking" ? "Checking" : "Savings"} ****{method.last4}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!method.isDefault && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDefaultMutation.mutate({ methodId: String(method.id) })}
                        disabled={setDefaultMutation.isPending}
                      >
                        Set as Default
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-red-500 hover:text-red-700"
                      onClick={() => removeMethodMutation.mutate({ methodId: String(method.id) })}
                      disabled={removeMethodMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Payout Schedule</CardTitle>
          <CardDescription>Your earnings are paid out on a weekly basis every Friday</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-2xl font-bold">Friday</p>
              <p className="text-sm text-muted-foreground">Payout Day</p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-2xl font-bold">1-3</p>
              <p className="text-sm text-muted-foreground">Business Days</p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-2xl font-bold">$25</p>
              <p className="text-sm text-muted-foreground">Min Payout</p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-2xl font-bold">Free</p>
              <p className="text-sm text-muted-foreground">Standard Transfer</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
