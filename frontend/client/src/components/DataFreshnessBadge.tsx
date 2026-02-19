import { RefreshCw, CheckCircle, Clock, AlertTriangle } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";

interface DataFreshnessBadgeProps {
  status: "fresh" | "stale" | "expired";
  dataType?: string;
  fetchedAt?: string;
  dataSources?: number;
  compact?: boolean;
  className?: string;
}

export function DataFreshnessBadge({
  status,
  dataType,
  fetchedAt,
  dataSources,
  compact = false,
  className,
}: DataFreshnessBadgeProps) {
  const forceRefresh = trpc.hotZones.forceRefresh.useMutation();

  const statusConfig = {
    fresh: {
      icon: CheckCircle,
      label: "Live",
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800",
      dot: "bg-emerald-500",
    },
    stale: {
      icon: Clock,
      label: "Updating",
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800",
      dot: "bg-amber-500",
    },
    expired: {
      icon: AlertTriangle,
      label: "Stale",
      color: "text-red-600 dark:text-red-400",
      bg: "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800",
      dot: "bg-red-500",
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  const age = fetchedAt ? Math.floor((Date.now() - new Date(fetchedAt).getTime()) / 1000) : null;
  const ageLabel = age !== null
    ? age < 60 ? `${age}s ago`
    : age < 3600 ? `${Math.floor(age / 60)}m ago`
    : `${Math.floor(age / 3600)}h ago`
    : null;

  const handleRefresh = () => {
    if (forceRefresh.isPending) return;
    forceRefresh.mutate({ dataType: dataType || "ZONE_INTELLIGENCE" });
  };

  if (compact) {
    return (
      <span
        className={cn("inline-flex items-center gap-1 text-xs font-medium", config.color, className)}
        title={`Data: ${config.label}${ageLabel ? ` (${ageLabel})` : ""}${dataSources ? ` | ${dataSources} sources` : ""}`}
      >
        <span className={cn("h-1.5 w-1.5 rounded-full animate-pulse", config.dot)} />
        {config.label}
      </span>
    );
  }

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 px-2.5 py-1 rounded-md border text-xs font-medium",
        config.bg,
        config.color,
        className
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      <span>{config.label}</span>
      {ageLabel && <span className="opacity-70">{ageLabel}</span>}
      {dataSources && <span className="opacity-60">| {dataSources} sources</span>}
      {(status === "stale" || status === "expired") && (
        <button
          onClick={handleRefresh}
          disabled={forceRefresh.isPending}
          className="ml-1 p-0.5 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
          title="Refresh data"
        >
          <RefreshCw className={cn("h-3 w-3", forceRefresh.isPending && "animate-spin")} />
        </button>
      )}
    </div>
  );
}
