/**
 * VESSEL FLEET — V5 Multi-Modal
 * Vessel registry & tracking: list of vessels with IMO numbers,
 * current positions, vessel detail with specs, voyage history, inspections
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Ship,
  Search,
  MapPin,
  Anchor,
  Activity,
  Gauge,
  Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";

// Mock fleet data — will connect to real vessel registry when tables are wired
const MOCK_VESSELS = [
  {
    id: 1,
    name: "MSC FLORA",
    imo: "9839284",
    mmsi: "255806132",
    vesselType: "Container Ship",
    flag: "Panama",
    grossTonnage: 228783,
    teu: 23756,
    yearBuilt: 2022,
    status: "at_sea",
    lastPort: "Los Angeles, USA",
    nextPort: "Shanghai, China",
    speed: 21.5,
    heading: 285,
    lastUpdate: "2026-03-16T14:00:00",
  },
  {
    id: 2,
    name: "MAERSK EDMONTON",
    imo: "9778791",
    mmsi: "219345000",
    vesselType: "Container Ship",
    flag: "Denmark",
    grossTonnage: 214286,
    teu: 20568,
    yearBuilt: 2019,
    status: "in_port",
    lastPort: "Rotterdam, Netherlands",
    nextPort: "Felixstowe, UK",
    speed: 0,
    heading: 0,
    lastUpdate: "2026-03-16T12:30:00",
  },
  {
    id: 3,
    name: "CMA CGM JACQUES SAADE",
    imo: "9839179",
    mmsi: "228339600",
    vesselType: "Container Ship",
    flag: "France",
    grossTonnage: 236583,
    teu: 23112,
    yearBuilt: 2020,
    status: "at_sea",
    lastPort: "Singapore",
    nextPort: "Le Havre, France",
    speed: 19.2,
    heading: 310,
    lastUpdate: "2026-03-16T13:45:00",
  },
  {
    id: 4,
    name: "EVER ACE",
    imo: "9893890",
    mmsi: "353136000",
    vesselType: "Container Ship",
    flag: "Panama",
    grossTonnage: 235579,
    teu: 23992,
    yearBuilt: 2021,
    status: "at_anchor",
    lastPort: "Yantian, China",
    nextPort: "Busan, South Korea",
    speed: 0,
    heading: 45,
    lastUpdate: "2026-03-16T11:00:00",
  },
  {
    id: 5,
    name: "HMM ALGECIRAS",
    imo: "9863297",
    mmsi: "440481000",
    vesselType: "Container Ship",
    flag: "South Korea",
    grossTonnage: 228283,
    teu: 23964,
    yearBuilt: 2020,
    status: "at_sea",
    lastPort: "Hamburg, Germany",
    nextPort: "Piraeus, Greece",
    speed: 17.8,
    heading: 170,
    lastUpdate: "2026-03-16T14:15:00",
  },
];

const STATUS_BADGE: Record<string, string> = {
  at_sea: "bg-emerald-500/20 text-emerald-400",
  in_port: "bg-blue-500/20 text-blue-400",
  at_anchor: "bg-amber-500/20 text-amber-400",
  dry_dock: "bg-red-500/20 text-red-400",
};

export default function VesselFleet() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [search, setSearch] = useState("");
  const [selectedVessel, setSelectedVessel] = useState<
    (typeof MOCK_VESSELS)[0] | null
  >(null);

  const bg = isLight ? "bg-slate-50" : "bg-[#0a0a0a]";
  const cardBg = cn(
    "border",
    isLight
      ? "bg-white border-slate-200"
      : "bg-slate-800/60 border-slate-700/50"
  );

  const filtered = MOCK_VESSELS.filter(
    (v) =>
      !search ||
      v.name.toLowerCase().includes(search.toLowerCase()) ||
      v.imo.includes(search)
  );

  return (
    <div className={cn("min-h-screen p-6", bg)}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-cyan-500/10">
          <Ship className="w-6 h-6 text-cyan-400" />
        </div>
        <div>
          <h1
            className={cn(
              "text-2xl font-bold",
              isLight ? "text-slate-900" : "text-white"
            )}
          >
            Vessel Fleet
          </h1>
          <p
            className={cn(
              "text-sm",
              isLight ? "text-slate-500" : "text-slate-400"
            )}
          >
            Vessel registry &amp; AIS tracking
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-6 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          className="pl-9"
          placeholder="Search by vessel name or IMO..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Vessel List */}
        <div className="lg:col-span-2 space-y-3">
          {filtered.map((v) => (
            <Card
              key={v.id}
              className={cn(
                cardBg,
                "cursor-pointer transition-colors",
                selectedVessel?.id === v.id &&
                  (isLight
                    ? "ring-2 ring-cyan-400"
                    : "ring-2 ring-cyan-500/50")
              )}
              onClick={() => setSelectedVessel(v)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <Ship className="w-5 h-5 text-cyan-400" />
                    <div>
                      <div
                        className={cn(
                          "font-semibold text-sm",
                          isLight ? "text-slate-900" : "text-white"
                        )}
                      >
                        {v.name}
                      </div>
                      <div
                        className={cn(
                          "text-xs font-mono",
                          isLight ? "text-slate-500" : "text-slate-400"
                        )}
                      >
                        IMO {v.imo} — {v.flag}
                      </div>
                    </div>
                  </div>
                  <Badge
                    className={
                      STATUS_BADGE[v.status] ||
                      "bg-slate-500/20 text-slate-400"
                    }
                  >
                    {v.status.replace(/_/g, " ")}
                  </Badge>
                </div>
                <div className="grid grid-cols-4 gap-2 text-xs">
                  <div>
                    <span className="text-slate-500">TEU: </span>
                    <span
                      className={
                        isLight ? "text-slate-700" : "text-slate-300"
                      }
                    >
                      {v.teu.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500">GT: </span>
                    <span
                      className={
                        isLight ? "text-slate-700" : "text-slate-300"
                      }
                    >
                      {v.grossTonnage.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500">Speed: </span>
                    <span
                      className={
                        isLight ? "text-slate-700" : "text-slate-300"
                      }
                    >
                      {v.speed} kn
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500">Built: </span>
                    <span
                      className={
                        isLight ? "text-slate-700" : "text-slate-300"
                      }
                    >
                      {v.yearBuilt}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-4 mt-2 text-xs">
                  <span
                    className={cn(
                      "flex items-center gap-1",
                      isLight ? "text-slate-500" : "text-slate-400"
                    )}
                  >
                    <MapPin className="w-3 h-3" /> Last: {v.lastPort}
                  </span>
                  <span
                    className={cn(
                      "flex items-center gap-1",
                      isLight ? "text-slate-500" : "text-slate-400"
                    )}
                  >
                    <Anchor className="w-3 h-3" /> Next: {v.nextPort}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
          {filtered.length === 0 && (
            <p className="text-center py-12 text-slate-500">
              No vessels found
            </p>
          )}
        </div>

        {/* Vessel Detail Panel */}
        <div>
          {selectedVessel ? (
            <Card className={cn(cardBg, "sticky top-6")}>
              <CardHeader>
                <CardTitle
                  className={cn(
                    "text-sm flex items-center gap-2",
                    isLight ? "text-slate-900" : "text-white"
                  )}
                >
                  <Ship className="w-4 h-4 text-cyan-400" />
                  {selectedVessel.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {[
                  ["IMO", selectedVessel.imo],
                  ["MMSI", selectedVessel.mmsi],
                  ["Type", selectedVessel.vesselType],
                  ["Flag", selectedVessel.flag],
                  [
                    "Gross Tonnage",
                    selectedVessel.grossTonnage.toLocaleString(),
                  ],
                  ["TEU Capacity", selectedVessel.teu.toLocaleString()],
                  ["Year Built", selectedVessel.yearBuilt],
                  ["Speed", `${selectedVessel.speed} knots`],
                  ["Heading", `${selectedVessel.heading}°`],
                  ["Last Port", selectedVessel.lastPort],
                  ["Next Port", selectedVessel.nextPort],
                  [
                    "Last AIS Update",
                    new Date(selectedVessel.lastUpdate).toLocaleString(),
                  ],
                ].map(([k, v]) => (
                  <div key={String(k)} className="flex justify-between">
                    <span
                      className={
                        isLight ? "text-slate-500" : "text-slate-400"
                      }
                    >
                      {k}
                    </span>
                    <span
                      className={cn(
                        "font-medium",
                        isLight ? "text-slate-900" : "text-white"
                      )}
                    >
                      {v}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : (
            <Card className={cardBg}>
              <CardContent className="p-8 text-center">
                <Ship
                  className={cn(
                    "w-12 h-12 mx-auto mb-3",
                    isLight ? "text-slate-300" : "text-slate-600"
                  )}
                />
                <p
                  className={cn(
                    "text-sm",
                    isLight ? "text-slate-400" : "text-slate-500"
                  )}
                >
                  Select a vessel to view details
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
