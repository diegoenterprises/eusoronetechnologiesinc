/**
 * DETENTION CLOCK DISPLAY — Real-time detention timer with billing
 * Shows active and historical detention records for a load
 * Wired to location.detention.getForLoad
 */

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Timer, DollarSign, Clock, AlertTriangle, CheckCircle2, Building2 } from "lucide-react";
import { useDetention } from "@/hooks/useLocationTracking";

interface DetentionClockDisplayProps {
  loadId: number;
}

function LiveTimer({ enterAt }: { enterAt: string }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const start = new Date(enterAt).getTime();
    const tick = () => setElapsed(Math.floor((Date.now() - start) / 60000));
    tick();
    const interval = setInterval(tick, 60000);
    return () => clearInterval(interval);
  }, [enterAt]);

  const hours = Math.floor(elapsed / 60);
  const mins = elapsed % 60;
  const isBillable = elapsed >= 120;

  return (
    <div className="text-center">
      <p className={`text-3xl font-bold tabular-nums ${isBillable ? "text-red-600" : "text-amber-600"}`}>
        {String(hours).padStart(2, "0")}:{String(mins).padStart(2, "0")}
      </p>
      <p className="text-xs text-muted-foreground mt-1">
        {isBillable ? "Billable detention active" : `${120 - elapsed} min free time remaining`}
      </p>
      {isBillable && (
        <Badge variant="destructive" className="mt-2 text-xs">
          <DollarSign className="h-3 w-3 mr-0.5" />
          Est. ${((elapsed - 120) / 60 * 75).toFixed(2)}
        </Badge>
      )}
    </div>
  );
}

export default function DetentionClockDisplay({ loadId }: DetentionClockDisplayProps) {
  const { records, isLoading } = useDetention(loadId);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-4 text-center text-muted-foreground text-sm">
          <Timer className="h-5 w-5 mx-auto mb-1 animate-pulse opacity-50" />
          Loading detention data...
        </CardContent>
      </Card>
    );
  }

  const activeRecords = records.filter((r: any) => !r.exitAt);
  const closedRecords = records.filter((r: any) => r.exitAt);
  const totalCharge = records.reduce((sum: number, r: any) => sum + (r.detentionCharge || 0), 0);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Timer className="h-4 w-4 text-orange-500" />
            Detention
          </CardTitle>
          {totalCharge > 0 && (
            <Badge variant="destructive" className="text-xs">
              <DollarSign className="h-3 w-3 mr-0.5" />
              Total: ${totalCharge.toFixed(2)}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {records.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">No detention records</p>
        ) : (
          <div className="space-y-4">
            {/* Active clocks */}
            {activeRecords.map((r: any) => (
              <div key={r.id} className="p-3 rounded-lg border-2 border-orange-300 dark:border-orange-700 bg-orange-50 dark:bg-orange-950/20">
                <div className="flex items-center justify-between mb-2">
                  <Badge className="bg-orange-100 text-orange-700 border-0 capitalize text-xs">
                    <Building2 className="h-3 w-3 mr-1" />
                    {r.locationType}
                  </Badge>
                  <div className="flex items-center gap-1 text-orange-600">
                    <div className="h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
                    <span className="text-[10px] font-medium">ACTIVE</span>
                  </div>
                </div>
                <LiveTimer enterAt={r.enterAt} />
                <p className="text-[10px] text-muted-foreground text-center mt-2">
                  Entered: {new Date(r.enterAt).toLocaleString()}
                </p>
              </div>
            ))}

            {/* Closed records */}
            {closedRecords.map((r: any) => (
              <div key={r.id} className="p-2 rounded-lg border bg-muted/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="capitalize text-[10px]">
                      {r.locationType}
                    </Badge>
                    <span className="text-xs font-medium">
                      {r.totalDwellMinutes || 0} min total
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    {r.isBillable ? (
                      <Badge variant="destructive" className="text-[10px]">
                        <DollarSign className="h-3 w-3 mr-0.5" />
                        ${r.detentionCharge?.toFixed(2)}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-green-600 text-[10px]">
                        <CheckCircle2 className="h-3 w-3 mr-0.5" />
                        No Charge
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                  <span>In: {new Date(r.enterAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                  <span>Out: {new Date(r.exitAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                  {r.detentionMinutes > 0 && (
                    <span className="text-red-500">{r.detentionMinutes} min detention</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
