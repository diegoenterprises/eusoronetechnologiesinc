/**
 * ETA DISPLAY — ETA card with confidence indicator and history
 * Wired to location.tracking.getETAForLoad + location.navigation.getETAHistory
 */

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, TrendingDown, TrendingUp, Minus, AlertTriangle, Coffee } from "lucide-react";
import { useETAUpdates } from "@/hooks/useLocationTracking";

interface ETADisplayProps {
  loadId: number;
  compact?: boolean;
}

const CONFIDENCE_STYLES: Record<string, { color: string; bg: string }> = {
  HIGH: { color: "text-green-600", bg: "bg-green-100 dark:bg-green-950/30" },
  MEDIUM: { color: "text-amber-600", bg: "bg-amber-100 dark:bg-amber-950/30" },
  LOW: { color: "text-red-600", bg: "bg-red-100 dark:bg-red-950/30" },
};

export default function ETADisplay({ loadId, compact = false }: ETADisplayProps) {
  const { eta, history, isLoading } = useETAUpdates(loadId);

  if (!eta) {
    return compact ? null : (
      <Card>
        <CardContent className="p-4 text-center text-muted-foreground text-sm">
          No ETA available
        </CardContent>
      </Card>
    );
  }

  const confStyle = CONFIDENCE_STYLES[(eta.confidence || "MEDIUM").toUpperCase()] || CONFIDENCE_STYLES.MEDIUM;
  const etaDate = eta.predictedEta ? new Date(eta.predictedEta) : null;
  const hours = eta.remainingMinutes ? Math.floor(eta.remainingMinutes / 60) : 0;
  const mins = eta.remainingMinutes ? eta.remainingMinutes % 60 : 0;

  // Check if ETA is shifting compared to previous
  let etaTrend: "earlier" | "later" | "stable" = "stable";
  if (history.length >= 2) {
    const prev = history[1];
    const curr = history[0];
    if (prev?.remainingMinutes && curr?.remainingMinutes) {
      const diff = curr.remainingMinutes - prev.remainingMinutes;
      if (diff > 5) etaTrend = "later";
      else if (diff < -5) etaTrend = "earlier";
    }
  }

  if (compact) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <Clock className="h-4 w-4 text-blue-500" />
        <span className="font-medium">
          ETA: {etaDate ? etaDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "--:--"}
        </span>
        <Badge className={`${confStyle.bg} ${confStyle.color} border-0 text-[10px]`}>
          {(eta.confidence || "").toUpperCase()}
        </Badge>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Clock className="h-4 w-4 text-blue-500" />
          Estimated Arrival
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center">
          <p className="text-3xl font-bold tabular-nums">
            {etaDate ? etaDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "--:--"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {etaDate ? etaDate.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" }) : ""}
          </p>

          <div className="flex items-center justify-center gap-3 mt-3">
            <div className="text-center">
              <p className="text-lg font-semibold">{hours}h {mins}m</p>
              <p className="text-[10px] text-muted-foreground">Remaining</p>
            </div>
            <div className="h-8 w-px bg-border" />
            <div className="text-center">
              <p className="text-lg font-semibold">{eta.remainingMiles || 0}</p>
              <p className="text-[10px] text-muted-foreground">Miles</p>
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 mt-3">
            <Badge className={`${confStyle.bg} ${confStyle.color} border-0 text-xs`}>
              {(eta.confidence || "MEDIUM").toUpperCase()} Confidence
            </Badge>
            {etaTrend === "later" && (
              <Badge variant="outline" className="text-red-500 text-[10px]">
                <TrendingUp className="h-3 w-3 mr-0.5" />
                Delayed
              </Badge>
            )}
            {etaTrend === "earlier" && (
              <Badge variant="outline" className="text-green-500 text-[10px]">
                <TrendingDown className="h-3 w-3 mr-0.5" />
                Ahead
              </Badge>
            )}
          </div>
        </div>

        {/* ETA History */}
        {history.length > 1 && (
          <div className="mt-4 border-t pt-3">
            <p className="text-[10px] text-muted-foreground mb-2">Recent ETA Changes</p>
            <div className="space-y-1">
              {history.slice(0, 5).map((h: any, i: number) => (
                <div key={h.id || i} className="flex items-center justify-between text-[10px]">
                  <span className="text-muted-foreground">
                    {h.createdAt ? new Date(h.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
                  </span>
                  <span className="font-medium">
                    {h.predictedEta ? new Date(h.predictedEta).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "--"}
                  </span>
                  <Badge variant="outline" className="text-[8px]">{h.confidence}</Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
