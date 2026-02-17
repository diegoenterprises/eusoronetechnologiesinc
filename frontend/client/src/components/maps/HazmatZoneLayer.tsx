/**
 * HAZMAT ZONE LAYER — Hazmat compliance overlay showing restricted zones,
 * tunnel restrictions, and hazmat route alerts
 * Wired to location.compliance.getHazmatZoneEntries + location.navigation.checkHazmatTunnels
 */

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Shield, Ban, MapPin, CircleAlert } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface HazmatZoneLayerProps {
  loadId?: number;
  hazmatClass?: string;
}

const HAZMAT_CLASS_LABELS: Record<string, { label: string; color: string }> = {
  "1": { label: "Explosives", color: "text-red-600 bg-red-50" },
  "1.1": { label: "Explosives 1.1", color: "text-red-600 bg-red-50" },
  "1.2": { label: "Explosives 1.2", color: "text-red-600 bg-red-50" },
  "1.3": { label: "Explosives 1.3", color: "text-red-600 bg-red-50" },
  "2.1": { label: "Flammable Gas", color: "text-orange-600 bg-orange-50" },
  "2.2": { label: "Non-Flammable Gas", color: "text-green-600 bg-green-50" },
  "2.3": { label: "Poison Gas", color: "text-purple-600 bg-purple-50" },
  "3": { label: "Flammable Liquid", color: "text-red-500 bg-red-50" },
  "4.1": { label: "Flammable Solid", color: "text-red-500 bg-red-50" },
  "4.2": { label: "Spontaneous Combustible", color: "text-red-500 bg-red-50" },
  "4.3": { label: "Dangerous When Wet", color: "text-blue-600 bg-blue-50" },
  "5.1": { label: "Oxidizer", color: "text-yellow-600 bg-yellow-50" },
  "5.2": { label: "Organic Peroxide", color: "text-yellow-600 bg-yellow-50" },
  "6.1": { label: "Poison", color: "text-purple-600 bg-purple-50" },
  "7": { label: "Radioactive", color: "text-yellow-600 bg-yellow-50" },
  "8": { label: "Corrosive", color: "text-gray-600 bg-gray-50" },
  "9": { label: "Miscellaneous", color: "text-gray-500 bg-gray-50" },
};

const TUNNEL_CATEGORIES = [
  { category: "A", description: "No restrictions", restricted: [] },
  { category: "B", description: "Explosives, poison gas, spontaneous combustible restricted", restricted: ["1.1", "1.2", "1.3", "2.3", "4.2", "5.1", "6.1"] },
  { category: "C", description: "Above + flammable gas, flammable liquid", restricted: ["1.1", "1.2", "1.3", "2.1", "2.3", "3", "4.2", "5.1", "6.1"] },
  { category: "D", description: "Most hazmat restricted", restricted: ["1.1", "1.2", "1.3", "2.1", "2.2", "2.3", "3", "4.1", "4.2", "4.3", "5.1", "5.2", "6.1"] },
  { category: "E", description: "ALL hazmat prohibited", restricted: ["ALL"] },
];

export default function HazmatZoneLayer({ loadId, hazmatClass }: HazmatZoneLayerProps) {
  const hazmatEntries = trpc.location.compliance.getHazmatZoneEntries.useQuery(
    { loadId },
    { enabled: !!loadId },
  );

  const tunnelCheck = trpc.location.navigation.checkHazmatTunnels.useQuery(
    { hazmatClass: hazmatClass || "" },
    { enabled: !!hazmatClass },
  );

  const classInfo = hazmatClass ? HAZMAT_CLASS_LABELS[hazmatClass] || HAZMAT_CLASS_LABELS[hazmatClass.split(".")[0]] : null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            Hazmat Compliance
          </CardTitle>
          {classInfo && (
            <Badge className={`${classInfo.color} border-0 text-xs`}>
              Class {hazmatClass}: {classInfo.label}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Tunnel restrictions */}
        {tunnelCheck.data?.requiresTunnelAvoidance && (
          <div className="p-3 rounded-lg border-2 border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-950/20">
            <div className="flex items-center gap-2 mb-2">
              <Ban className="h-4 w-4 text-red-600" />
              <span className="text-sm font-medium text-red-700 dark:text-red-400">Tunnel Avoidance Required</span>
            </div>
            <p className="text-xs text-red-600 dark:text-red-400">
              Per 49 CFR 397.71: Class {hazmatClass} loads must avoid restricted tunnels.
              Route has been calculated with tunnel avoidance active.
            </p>
          </div>
        )}

        {/* CFR Tunnel categories */}
        {hazmatClass && (
          <div>
            <p className="text-xs font-medium mb-2">NFPA 502 Tunnel Categories</p>
            <div className="space-y-1">
              {TUNNEL_CATEGORIES.map((tc) => {
                const isRestricted = tc.restricted.includes("ALL") || tc.restricted.some(c => hazmatClass?.startsWith(c));
                return (
                  <div key={tc.category} className={`flex items-center justify-between p-1.5 rounded text-xs ${isRestricted ? "bg-red-50 dark:bg-red-950/20" : "bg-muted/30"}`}>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={`text-[10px] ${isRestricted ? "border-red-300 text-red-600" : ""}`}>
                        Cat {tc.category}
                      </Badge>
                      <span className="text-muted-foreground">{tc.description}</span>
                    </div>
                    {isRestricted ? (
                      <Ban className="h-3.5 w-3.5 text-red-500" />
                    ) : (
                      <Shield className="h-3.5 w-3.5 text-green-500" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Hazmat zone entry events */}
        {(hazmatEntries.data?.length ?? 0) > 0 && (
          <div>
            <p className="text-xs font-medium mb-2">Hazmat Zone Events</p>
            <div className="space-y-1">
              {hazmatEntries.data!.map((entry: any) => (
                <div key={entry.id} className="flex items-center justify-between p-1.5 rounded border text-xs">
                  <div className="flex items-center gap-2">
                    <CircleAlert className="h-3.5 w-3.5 text-amber-500" />
                    <span>{entry.lat?.toFixed(4)}, {entry.lng?.toFixed(4)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-muted-foreground">
                      {entry.timestamp ? new Date(entry.timestamp).toLocaleString() : ""}
                    </span>
                    {entry.tamperedFlag && <AlertTriangle className="h-3 w-3 text-red-500" />}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* General routing requirements */}
        {hazmatClass && (
          <div className="border-t pt-3">
            <p className="text-xs font-medium mb-1">49 CFR 397 Routing Requirements</p>
            <ul className="text-[10px] text-muted-foreground space-y-0.5">
              <li className="flex items-center gap-1">
                <Shield className="h-3 w-3 text-blue-400 flex-shrink-0" />
                Prefer designated hazmat routes when available
              </li>
              {hazmatClass.startsWith("7") && (
                <li className="flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3 text-red-400 flex-shrink-0" />
                  MUST use Highway Route Controlled Quantities routes (Class 7)
                </li>
              )}
              {hazmatClass.startsWith("1") && (
                <li className="flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3 text-red-400 flex-shrink-0" />
                  Avoid populated areas when practical (Explosives)
                </li>
              )}
              <li className="flex items-center gap-1">
                <MapPin className="h-3 w-3 text-blue-400 flex-shrink-0" />
                Route scoring by population density active
              </li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
