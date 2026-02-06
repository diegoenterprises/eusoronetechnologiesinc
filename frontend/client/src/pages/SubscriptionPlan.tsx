/**
 * SUBSCRIPTION PLAN PAGE
 * 100% Dynamic - No mock data
 * UI Style: Gradient headers, stat cards with icons, rounded cards
 */

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  Crown, CheckCircle, Zap, Users, Truck,
  ArrowRight, Calendar, Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { redirectToCheckout } from "@/lib/stripe";

export default function SubscriptionPlan() {
  // Real Stripe subscription data
  const subscriptionQuery = (trpc as any).stripe.getSubscription.useQuery();
  const plansQuery = (trpc as any).stripe.getPlans.useQuery();
  const usageQuery = (trpc as any).billing.getUsage.useQuery();

  // Stripe Checkout for subscription upgrades
  const checkoutMutation = (trpc as any).stripe.createSubscriptionCheckout.useMutation({
    onSuccess: (data: any) => {
      if (data?.url) {
        redirectToCheckout(data.url);
      } else {
        toast.error("Failed to create checkout session");
      }
    },
    onError: (error: any) => toast.error("Failed to start checkout", { description: error.message }),
  });

  // Cancel subscription
  const cancelMutation = (trpc as any).stripe.cancelSubscription.useMutation({
    onSuccess: () => { toast.success("Subscription will cancel at end of billing period"); subscriptionQuery.refetch(); },
    onError: (error: any) => toast.error("Failed to cancel", { description: error.message }),
  });

  const subscription = subscriptionQuery.data;
  const usage = usageQuery.data;

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with Gradient Title */}
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
          Subscription Plan
        </h1>
        <p className="text-slate-400 text-sm mt-1">Manage your subscription and usage</p>
      </div>

      {/* Current Plan */}
      {subscriptionQuery.isLoading ? (
        <Skeleton className="h-40 w-full rounded-xl" />
      ) : (
        <Card className="bg-gradient-to-r from-cyan-500/10 to-emerald-500/10 border-cyan-500/30 rounded-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-4 rounded-full bg-gradient-to-r from-cyan-500/20 to-emerald-500/20">
                  <Crown className="w-8 h-8 text-cyan-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-white text-2xl font-bold">{subscription?.planName}</p>
                    <Badge className="bg-cyan-500/20 text-cyan-400 border-0">{subscription?.status}</Badge>
                  </div>
                  <p className="text-slate-400">${subscription?.price}/month</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-slate-400 text-sm flex items-center gap-1"><Calendar className="w-4 h-4" />Next billing: {subscription?.currentPeriodEnd ? new Date(subscription.currentPeriodEnd).toLocaleDateString() : "N/A"}</p>
                {subscription?.active && subscription?.subscriptionId && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-2 text-red-400 border-red-400/30 hover:bg-red-500/10"
                    onClick={() => cancelMutation.mutate({ subscriptionId: subscription.subscriptionId })}
                    disabled={cancelMutation.isPending}
                  >
                    {subscription.cancelAtPeriodEnd ? "Cancellation Pending" : "Cancel Plan"}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Usage */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-400" />
            Current Usage
          </CardTitle>
        </CardHeader>
        <CardContent>
          {usageQuery.isLoading ? (
            <div className="space-y-4">{[1, 2, 3].map((i: any) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-700/30">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-blue-400" />
                    <span className="text-white">Loads</span>
                  </div>
                  <span className="text-slate-400">{usage?.loads?.used} / {usage?.loads?.limit}</span>
                </div>
                <Progress value={((usage?.loads?.used ?? 0) / (usage?.loads?.limit ?? 1)) * 100} className={cn("h-2", (usage?.loads?.used ?? 0) / (usage?.loads?.limit ?? 1) > 0.9 && "[&>div]:bg-red-500")} />
              </div>
              <div className="p-4 rounded-xl bg-slate-700/30">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-green-400" />
                    <span className="text-white">Team Members</span>
                  </div>
                  <span className="text-slate-400">{usage?.users?.used} / {usage?.users?.limit}</span>
                </div>
                <Progress value={((usage?.users?.used ?? 0) / (usage?.users?.limit ?? 1)) * 100} className="h-2" />
              </div>
              <div className="p-4 rounded-xl bg-slate-700/30">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-purple-400" />
                    <span className="text-white">Vehicles</span>
                  </div>
                  <span className="text-slate-400">{usage?.vehicles?.used} / {usage?.vehicles?.limit}</span>
                </div>
                <Progress value={((usage?.vehicles?.used ?? 0) / (usage?.vehicles?.limit ?? 1)) * 100} className="h-2" />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Available Plans */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg">Available Plans</CardTitle>
        </CardHeader>
        <CardContent>
          {plansQuery.isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">{[1, 2, 3].map((i: any) => <Skeleton key={i} className="h-64 w-full rounded-xl" />)}</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(plansQuery.data as any)?.map((plan: any) => (
                <div key={plan.id} className={cn("p-6 rounded-xl border transition-all", plan.id === subscription?.planId ? "bg-cyan-500/10 border-cyan-500/30" : "bg-slate-700/30 border-slate-600/50 hover:border-slate-500/50")}>
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-white text-xl font-bold">{plan.name}</p>
                    {plan.popular && <Badge className="bg-emerald-500/20 text-emerald-400 border-0">Popular</Badge>}
                  </div>
                  <p className="text-3xl font-bold text-white mb-1">${plan.price}<span className="text-sm text-slate-400">/mo</span></p>
                  <p className="text-slate-400 text-sm mb-4">{plan.description}</p>
                  <ul className="space-y-2 mb-6">
                    {plan.features?.map((feature: string, idx: number) => (
                      <li key={idx} className="flex items-center gap-2 text-sm text-slate-300">
                        <CheckCircle className="w-4 h-4 text-green-400" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  {plan.id === subscription?.plan ? (
                    <Button disabled className="w-full rounded-lg">Current Plan</Button>
                  ) : (
                    <Button
                      className={cn("w-full rounded-lg", plan.price > (subscription?.price ?? 0) ? "bg-gradient-to-r from-[#1473FF] to-[#BE01FF] hover:opacity-90" : "bg-slate-600 hover:bg-slate-500")}
                      onClick={() => checkoutMutation.mutate({ planId: plan.id })}
                      disabled={checkoutMutation.isPending}
                    >
                      {checkoutMutation.isPending ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : null}
                      {plan.price > (subscription?.price ?? 0) ? "Upgrade" : "Switch"} <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
