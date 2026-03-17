/**
 * RAIL CREW HOS — V5 Multi-Modal
 * Rail hours of service tracking per 49 CFR 228
 * 12-hour on-duty limit, 10-hour undisturbed rest, limbo time tracking
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Clock,
  Users,
  AlertTriangle,
  CheckCircle,
  Shield,
  Moon,
  Timer,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";

// Mock crew data — will be replaced with tRPC calls when crew tables are wired
const MOCK_CREW = [
  {
    id: 1,
    name: "James Mitchell",
    role: "Engineer",
    hoursOnDuty: 6.5,
    maxOnDuty: 12,
    lastRestStart: "2026-03-16T02:00:00",
    restHours: 10,
    limboHours: 0,
    status: "on_duty",
  },
  {
    id: 2,
    name: "Robert Chen",
    role: "Conductor",
    hoursOnDuty: 9.2,
    maxOnDuty: 12,
    lastRestStart: "2026-03-15T22:00:00",
    restHours: 10,
    limboHours: 1.5,
    status: "on_duty",
  },
  {
    id: 3,
    name: "Sarah Williams",
    role: "Engineer",
    hoursOnDuty: 0,
    maxOnDuty: 12,
    lastRestStart: "2026-03-16T10:00:00",
    restHours: 4,
    limboHours: 0,
    status: "resting",
  },
  {
    id: 4,
    name: "David Thompson",
    role: "Conductor",
    hoursOnDuty: 11.3,
    maxOnDuty: 12,
    lastRestStart: "2026-03-15T18:00:00",
    restHours: 10,
    limboHours: 3.0,
    status: "approaching_limit",
  },
];

function HoursBar({
  current,
  max,
  label,
  color,
  isLight,
}: {
  current: number;
  max: number;
  label: string;
  color: string;
  isLight: boolean;
}) {
  const pct = Math.min((current / max) * 100, 100);
  const danger = pct > 90;
  const warning = pct > 75;
  return (
    <div className="mb-2">
      <div className="flex justify-between text-xs mb-1">
        <span className={isLight ? "text-slate-500" : "text-slate-400"}>
          {label}
        </span>
        <span
          className={cn(
            "font-medium",
            danger
              ? "text-red-400"
              : warning
                ? "text-amber-400"
                : isLight
                  ? "text-slate-700"
                  : "text-slate-300"
          )}
        >
          {current.toFixed(1)}h / {max}h
        </span>
      </div>
      <Progress
        value={pct}
        className={cn("h-2", danger ? "[&>div]:bg-red-500" : warning ? "[&>div]:bg-amber-500" : `[&>div]:${color}`)}
      />
    </div>
  );
}

export default function RailCrewHOS() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [tab, setTab] = useState("active");

  const bg = isLight ? "bg-slate-50" : "bg-[#0a0a0a]";
  const cardBg = cn(
    "border",
    isLight
      ? "bg-white border-slate-200"
      : "bg-slate-800/60 border-slate-700/50"
  );

  const onDuty = MOCK_CREW.filter(
    (c) => c.status === "on_duty" || c.status === "approaching_limit"
  );
  const resting = MOCK_CREW.filter((c) => c.status === "resting");
  const approaching = MOCK_CREW.filter(
    (c) => c.status === "approaching_limit"
  );

  return (
    <div className={cn("min-h-screen p-6", bg)}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-cyan-500/10">
          <Clock className="w-6 h-6 text-cyan-400" />
        </div>
        <div>
          <h1
            className={cn(
              "text-2xl font-bold",
              isLight ? "text-slate-900" : "text-white"
            )}
          >
            Rail Crew HOS
          </h1>
          <p
            className={cn(
              "text-sm",
              isLight ? "text-slate-500" : "text-slate-400"
            )}
          >
            Hours of Service — 49 CFR Part 228
          </p>
        </div>
      </div>

      {/* Regulation Info Banner */}
      <div
        className={cn(
          "flex items-start gap-3 p-4 rounded-xl mb-6",
          isLight ? "bg-blue-50 border border-blue-200" : "bg-blue-500/10 border border-blue-500/20"
        )}
      >
        <Shield className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
        <div>
          <div
            className={cn(
              "text-sm font-semibold mb-1",
              isLight ? "text-slate-900" : "text-white"
            )}
          >
            FRA Hours of Service Rules
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div
              className={cn(
                "flex items-center gap-2",
                isLight ? "text-slate-600" : "text-slate-300"
              )}
            >
              <Timer className="w-3.5 h-3.5 text-blue-400" />
              <span>
                <strong>12-hour</strong> maximum on-duty period
              </span>
            </div>
            <div
              className={cn(
                "flex items-center gap-2",
                isLight ? "text-slate-600" : "text-slate-300"
              )}
            >
              <Moon className="w-3.5 h-3.5 text-indigo-400" />
              <span>
                <strong>10-hour</strong> undisturbed off-duty rest
              </span>
            </div>
            <div
              className={cn(
                "flex items-center gap-2",
                isLight ? "text-slate-600" : "text-slate-300"
              )}
            >
              <Activity className="w-3.5 h-3.5 text-amber-400" />
              <span>
                <strong>Limbo time</strong> tracked separately
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className={cn("rounded-xl border p-4", isLight ? "bg-white border-slate-200" : "bg-slate-800/60 border-slate-700/50")}>
          <div className="p-2 rounded-lg w-fit mb-2 bg-emerald-500/10">
            <Users className="w-5 h-5 text-emerald-400" />
          </div>
          <div className={cn("text-2xl font-bold", isLight ? "text-slate-900" : "text-white")}>
            {MOCK_CREW.length}
          </div>
          <div className={cn("text-xs mt-1", isLight ? "text-slate-500" : "text-slate-400")}>
            Total Crew
          </div>
        </div>
        <div className={cn("rounded-xl border p-4", isLight ? "bg-white border-slate-200" : "bg-slate-800/60 border-slate-700/50")}>
          <div className="p-2 rounded-lg w-fit mb-2 bg-blue-500/10">
            <Activity className="w-5 h-5 text-blue-400" />
          </div>
          <div className={cn("text-2xl font-bold", isLight ? "text-slate-900" : "text-white")}>
            {onDuty.length}
          </div>
          <div className={cn("text-xs mt-1", isLight ? "text-slate-500" : "text-slate-400")}>
            On Duty
          </div>
        </div>
        <div className={cn("rounded-xl border p-4", isLight ? "bg-white border-slate-200" : "bg-slate-800/60 border-slate-700/50")}>
          <div className="p-2 rounded-lg w-fit mb-2 bg-indigo-500/10">
            <Moon className="w-5 h-5 text-indigo-400" />
          </div>
          <div className={cn("text-2xl font-bold", isLight ? "text-slate-900" : "text-white")}>
            {resting.length}
          </div>
          <div className={cn("text-xs mt-1", isLight ? "text-slate-500" : "text-slate-400")}>
            Resting
          </div>
        </div>
        <div className={cn("rounded-xl border p-4", isLight ? "bg-white border-slate-200" : "bg-slate-800/60 border-slate-700/50")}>
          <div className="p-2 rounded-lg w-fit mb-2 bg-red-500/10">
            <AlertTriangle className="w-5 h-5 text-red-400" />
          </div>
          <div className={cn("text-2xl font-bold text-red-400")}>
            {approaching.length}
          </div>
          <div className={cn("text-xs mt-1", isLight ? "text-slate-500" : "text-slate-400")}>
            Approaching Limit
          </div>
        </div>
      </div>

      {/* Crew List */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="active">On Duty</TabsTrigger>
          <TabsTrigger value="resting">Off Duty</TabsTrigger>
          <TabsTrigger value="all">All Crew</TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          <div className="space-y-4">
            {onDuty.map((c) => (
              <Card key={c.id} className={cardBg}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold",
                          c.status === "approaching_limit"
                            ? "bg-red-500/20 text-red-400"
                            : "bg-blue-500/20 text-blue-400"
                        )}
                      >
                        {c.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </div>
                      <div>
                        <div
                          className={cn(
                            "font-medium text-sm",
                            isLight ? "text-slate-900" : "text-white"
                          )}
                        >
                          {c.name}
                        </div>
                        <div
                          className={cn(
                            "text-xs",
                            isLight ? "text-slate-500" : "text-slate-400"
                          )}
                        >
                          {c.role}
                        </div>
                      </div>
                    </div>
                    <Badge
                      className={
                        c.status === "approaching_limit"
                          ? "bg-red-500/20 text-red-400"
                          : "bg-emerald-500/20 text-emerald-400"
                      }
                    >
                      {c.status === "approaching_limit"
                        ? "Near Limit"
                        : "On Duty"}
                    </Badge>
                  </div>
                  <HoursBar
                    current={c.hoursOnDuty}
                    max={c.maxOnDuty}
                    label="On-Duty Hours (12h max)"
                    color="bg-blue-500"
                    isLight={isLight}
                  />
                  {c.limboHours > 0 && (
                    <div className="flex items-center gap-2 mt-2 text-xs">
                      <Activity className="w-3 h-3 text-amber-400" />
                      <span className="text-amber-400">
                        Limbo Time: {c.limboHours.toFixed(1)}h
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
            {onDuty.length === 0 && (
              <p className="text-center py-8 text-slate-500 text-sm">
                No crew currently on duty
              </p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="resting">
          <div className="space-y-4">
            {resting.map((c) => (
              <Card key={c.id} className={cardBg}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold bg-indigo-500/20 text-indigo-400">
                        {c.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </div>
                      <div>
                        <div
                          className={cn(
                            "font-medium text-sm",
                            isLight ? "text-slate-900" : "text-white"
                          )}
                        >
                          {c.name}
                        </div>
                        <div
                          className={cn(
                            "text-xs",
                            isLight ? "text-slate-500" : "text-slate-400"
                          )}
                        >
                          {c.role}
                        </div>
                      </div>
                    </div>
                    <Badge className="bg-indigo-500/20 text-indigo-400">
                      <Moon className="w-3 h-3 mr-1" />
                      Resting
                    </Badge>
                  </div>
                  <HoursBar
                    current={c.restHours}
                    max={10}
                    label="Rest Period (10h required)"
                    color="bg-indigo-500"
                    isLight={isLight}
                  />
                  <div className="flex items-center gap-2 mt-2 text-xs">
                    {c.restHours >= 10 ? (
                      <>
                        <CheckCircle className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-400">
                          Rest complete — eligible for duty
                        </span>
                      </>
                    ) : (
                      <>
                        <Clock className="w-3 h-3 text-indigo-400" />
                        <span className="text-indigo-400">
                          {(10 - c.restHours).toFixed(1)}h remaining
                        </span>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="all">
          <div className="space-y-4">
            {MOCK_CREW.map((c) => (
              <Card key={c.id} className={cardBg}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold",
                          c.status === "resting"
                            ? "bg-indigo-500/20 text-indigo-400"
                            : c.status === "approaching_limit"
                              ? "bg-red-500/20 text-red-400"
                              : "bg-blue-500/20 text-blue-400"
                        )}
                      >
                        {c.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </div>
                      <div>
                        <div
                          className={cn(
                            "font-medium text-sm",
                            isLight ? "text-slate-900" : "text-white"
                          )}
                        >
                          {c.name}
                        </div>
                        <div
                          className={cn(
                            "text-xs",
                            isLight ? "text-slate-500" : "text-slate-400"
                          )}
                        >
                          {c.role} — {c.hoursOnDuty.toFixed(1)}h on-duty
                        </div>
                      </div>
                    </div>
                    <Badge
                      className={
                        c.status === "resting"
                          ? "bg-indigo-500/20 text-indigo-400"
                          : c.status === "approaching_limit"
                            ? "bg-red-500/20 text-red-400"
                            : "bg-emerald-500/20 text-emerald-400"
                      }
                    >
                      {c.status.replace(/_/g, " ")}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
