/**
 * PAYMENT METHODS PAGE
 * 100% Dynamic - No mock data
 * UI Style: Gradient headers, stat cards with icons, rounded cards
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  CreditCard, Plus, Trash2, CheckCircle, Star,
  Building, Wallet
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function PaymentMethods() {
  const methodsQuery = (trpc as any).billing.getPaymentMethods.useQuery();

  const setDefaultMutation = (trpc as any).billing.setDefaultPaymentMethod.useMutation({
    onSuccess: () => { toast.success("Default payment method updated"); methodsQuery.refetch(); },
    onError: (error: any) => toast.error("Failed to update", { description: error.message }),
  });

  const deleteMutation = (trpc as any).billing.deletePaymentMethod.useMutation({
    onSuccess: () => { toast.success("Payment method removed"); methodsQuery.refetch(); },
    onError: (error: any) => toast.error("Failed to remove", { description: error.message }),
  });

  const getCardIcon = (brand: string) => {
    return <CreditCard className="w-6 h-6" />;
  };

  const getMethodIcon = (type: string) => {
    switch (type) {
      case "card": return <CreditCard className="w-5 h-5" />;
      case "bank": return <Building className="w-5 h-5" />;
      default: return <Wallet className="w-5 h-5" />;
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with Gradient Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
            Payment Methods
          </h1>
          <p className="text-slate-400 text-sm mt-1">Manage your payment methods</p>
        </div>
        <Button className="bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 rounded-lg">
          <Plus className="w-4 h-4 mr-2" />Add Payment Method
        </Button>
      </div>

      {/* Payment Methods List */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg">Your Payment Methods</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {methodsQuery.isLoading ? (
            <div className="p-4 space-y-3">{[1, 2, 3].map((i: any) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}</div>
          ) : (methodsQuery.data as any)?.length === 0 ? (
            <div className="text-center py-16">
              <div className="p-4 rounded-full bg-slate-700/50 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <CreditCard className="w-10 h-10 text-slate-500" />
              </div>
              <p className="text-slate-400 text-lg">No payment methods</p>
              <p className="text-slate-500 text-sm">Add a payment method to get started</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {(methodsQuery.data as any)?.map((method: any) => (
                <div key={method.id} className={cn("p-4", method.isDefault && "bg-cyan-500/5 border-l-2 border-cyan-500")}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={cn("p-3 rounded-xl", method.type === "card" ? "bg-blue-500/20 text-blue-400" : "bg-green-500/20 text-green-400")}>
                        {getMethodIcon(method.type)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-white font-medium">{method.brand} {method.type === "card" ? `•••• ${method.last4}` : method.bankName}</p>
                          {method.isDefault && <Badge className="bg-cyan-500/20 text-cyan-400 border-0"><Star className="w-3 h-3 mr-1" />Default</Badge>}
                        </div>
                        <p className="text-sm text-slate-400">
                          {method.type === "card" ? `Expires ${method.expMonth}/${method.expYear}` : `Account ending in ${method.last4}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!method.isDefault && (
                        <Button size="sm" variant="outline" className="bg-slate-700/50 border-slate-600/50 hover:bg-slate-700 rounded-lg" onClick={() => setDefaultMutation.mutate({ methodId: method.id })}>
                          <CheckCircle className="w-4 h-4 mr-1" />Set Default
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" className="text-red-400 hover:text-red-300 hover:bg-red-500/10" onClick={() => deleteMutation.mutate({ methodId: method.id })} disabled={method.isDefault}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Billing Address */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white text-lg">Billing Address</CardTitle>
            <Button size="sm" variant="outline" className="bg-slate-700/50 border-slate-600/50 hover:bg-slate-700 rounded-lg">
              Edit
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {methodsQuery.isLoading ? (
            <Skeleton className="h-20 w-full rounded-xl" />
          ) : (methodsQuery.data as any)?.billingAddress ? (
            <div className="text-slate-400">
              <p className="text-white font-medium">{methodsQuery.data.billingAddress.name}</p>
              <p>{methodsQuery.data.billingAddress.line1}</p>
              {methodsQuery.data.billingAddress.line2 && <p>{methodsQuery.data.billingAddress.line2}</p>}
              <p>{methodsQuery.data.billingAddress.city}, {methodsQuery.data.billingAddress.state} {methodsQuery.data.billingAddress.postalCode}</p>
              <p>{methodsQuery.data.billingAddress.country}</p>
            </div>
          ) : (
            <p className="text-slate-400">No billing address on file</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
