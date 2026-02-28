/**
 * STRIPE CONNECT STATUS WIDGET
 * Lightweight dashboard widget — quick-glance payout status linking to EusoWallet.
 * Available to ALL roles.
 */

import React from "react";
import { trpc } from "@/lib/trpc";
import { useTheme } from "@/contexts/ThemeContext";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Landmark, CheckCircle, AlertTriangle, ChevronRight, Clock
} from "lucide-react";

export default function StripeConnectWidget() {
  const { theme } = useTheme();
  const isLight = theme === "light";

  const connectQuery = (trpc as any).stripe?.getConnectAccount?.useQuery(undefined, {
    retry: false,
    staleTime: 60000,
  });

  if (connectQuery?.isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-6">
        <Skeleton className="h-12 w-12 rounded-2xl mb-3" />
        <Skeleton className="h-4 w-24 mb-2" />
        <Skeleton className="h-3 w-32" />
      </div>
    );
  }

  const hasAccount = connectQuery?.data?.hasAccount;
  const chargesEnabled = connectQuery?.data?.chargesEnabled;
  const payoutsEnabled = connectQuery?.data?.payoutsEnabled;
  const detailsSubmitted = connectQuery?.data?.detailsSubmitted;
  const isActive = chargesEnabled && payoutsEnabled;

  const status = isActive ? "active"
    : hasAccount && detailsSubmitted ? "review"
    : hasAccount ? "incomplete"
    : "none";

  const config = {
    active:     { icon: CheckCircle,   color: "text-emerald-500", bg: "bg-emerald-500/15", badge: "bg-emerald-500/20 text-emerald-500", label: "Active",       desc: "Payments & payouts enabled" },
    review:     { icon: Clock,         color: "text-amber-500",   bg: "bg-amber-500/15",   badge: "bg-amber-500/20 text-amber-500",     label: "Under Review", desc: "Verification in progress" },
    incomplete: { icon: AlertTriangle, color: "text-orange-500",  bg: "bg-orange-500/15",  badge: "bg-orange-500/20 text-orange-500",   label: "Incomplete",   desc: "Setup needed" },
    none:       { icon: Landmark,      color: "text-blue-500",    bg: "bg-blue-500/15",    badge: "bg-blue-500/20 text-blue-500",       label: "Not Set Up",   desc: "Set up payouts in EusoWallet" },
  }[status];

  const Icon = config.icon;

  return (
    <button
      onClick={() => window.open("/wallet", "_self")}
      className="flex flex-col items-center justify-center h-full py-4 w-full hover:opacity-80 transition-opacity cursor-pointer"
    >
      <div className={`p-3 rounded-2xl mb-3 ${config.bg}`}>
        <Icon className={`w-8 h-8 ${config.color}`} />
      </div>
      <Badge className={`${config.badge} border-0 mb-2 text-xs font-bold`}>
        {config.label}
      </Badge>
      <p className={`text-sm font-semibold ${isLight ? "text-slate-800" : "text-white"}`}>
        Payout Account
      </p>
      <p className={`text-xs mt-1 text-center ${isLight ? "text-slate-500" : "text-slate-400"}`}>
        {config.desc}
      </p>
      <div className={`mt-3 flex items-center gap-1 text-xs ${isLight ? "text-blue-600" : "text-blue-400"}`}>
        Open EusoWallet <ChevronRight className="w-3 h-3" />
      </div>
    </button>
  );
}
