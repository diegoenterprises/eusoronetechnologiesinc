/**
 * LOAD STATUS TIMELINE — Visual timeline of load lifecycle events
 * Shows geofence-driven status transitions with timestamps and geotags
 * Wired to location.geotags.getForLoad
 */

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  MapPin, Truck, Package, CheckCircle2, Clock, AlertTriangle,
  Camera, FileText, PenLine, Navigation2, Shield, CircleDot,
} from "lucide-react";
import { trpc } from "@/lib/trpc";

interface LoadStatusTimelineProps {
  loadId: number;
}

const EVENT_ICONS: Record<string, React.ElementType> = {
  arrived_pickup: MapPin,
  departed_pickup: Navigation2,
  arrived_delivery: MapPin,
  departed_delivery: CheckCircle2,
  state_crossing: Shield,
  hazmat_zone_entry: AlertTriangle,
  loading_started: Package,
  loading_complete: Package,
  unloading_started: Package,
  unloading_complete: CheckCircle2,
  photo_capture: Camera,
  document_upload: FileText,
  signature_capture: PenLine,
  weigh_station_approach: Truck,
  route_deviation: AlertTriangle,
  speed_alert: AlertTriangle,
};

const CATEGORY_COLORS: Record<string, string> = {
  load_lifecycle: "text-blue-500 bg-blue-50 dark:bg-blue-950/30",
  compliance: "text-purple-500 bg-purple-50 dark:bg-purple-950/30",
  safety: "text-red-500 bg-red-50 dark:bg-red-950/30",
  operational: "text-gray-500 bg-gray-50 dark:bg-gray-950/30",
  photo: "text-amber-500 bg-amber-50 dark:bg-amber-950/30",
  document: "text-indigo-500 bg-indigo-50 dark:bg-indigo-950/30",
};

export default function LoadStatusTimeline({ loadId }: LoadStatusTimelineProps) {
  const { data: geotags, isLoading } = trpc.location.geotags.getForLoad.useQuery(
    { loadId },
    { enabled: !!loadId },
  );

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          <Clock className="h-6 w-6 mx-auto mb-2 animate-pulse opacity-50" />
          <p className="text-sm">Loading timeline...</p>
        </CardContent>
      </Card>
    );
  }

  const tags = geotags || [];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <CircleDot className="h-4 w-4 text-blue-500" />
          Load Timeline
          <Badge variant="outline" className="ml-auto text-[10px]">
            {tags.length} event{tags.length !== 1 ? "s" : ""}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {tags.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">No events recorded yet</p>
        ) : (
          <div className="relative space-y-0">
            {/* Vertical line */}
            <div className="absolute left-[15px] top-2 bottom-2 w-px bg-border" />

            {tags.map((tag: any, idx: number) => {
              const Icon = EVENT_ICONS[tag.eventType] || CircleDot;
              const categoryColor = CATEGORY_COLORS[tag.eventCategory] || CATEGORY_COLORS.operational;
              const isLast = idx === tags.length - 1;

              return (
                <div key={tag.id} className="relative flex items-start gap-3 pb-4">
                  {/* Icon dot */}
                  <div className={`relative z-10 flex items-center justify-center h-[30px] w-[30px] rounded-full border-2 border-white dark:border-gray-900 ${categoryColor}`}>
                    <Icon className="h-3.5 w-3.5" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 pt-0.5">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium capitalize">
                        {tag.eventType.replace(/_/g, " ")}
                      </p>
                      {tag.tamperedFlag && (
                        <AlertTriangle className="h-3 w-3 text-red-500" />
                      )}
                      {tag.isVerified && (
                        <CheckCircle2 className="h-3 w-3 text-green-500" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {tag.timestamp ? new Date(tag.timestamp).toLocaleString() : ""}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-muted-foreground">
                        {Number(tag.lat).toFixed(4)}, {Number(tag.lng).toFixed(4)}
                      </span>
                      <Badge variant="outline" className="text-[9px] capitalize">
                        {tag.source?.replace(/_/g, " ")}
                      </Badge>
                      <Badge variant="outline" className="text-[9px] capitalize">
                        {tag.eventCategory?.replace(/_/g, " ")}
                      </Badge>
                    </div>
                    {tag.photoUrls && tag.photoUrls.length > 0 && (
                      <div className="flex items-center gap-1 mt-1 text-[10px] text-amber-600">
                        <Camera className="h-3 w-3" />
                        {tag.photoUrls.length} photo{tag.photoUrls.length > 1 ? "s" : ""}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
