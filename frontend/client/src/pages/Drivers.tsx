/**
 * DRIVERS PAGE
 * 100% Dynamic - No mock data
 * Theme-aware | Brand gradient | Shipper design standard
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  Users, Search, Plus, Eye, Phone, Clock, CheckCircle,
  AlertTriangle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";
import { useTheme } from "@/contexts/ThemeContext";

export default function Drivers() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");

  const driversQuery = (trpc as any).drivers.list.useQuery({ limit: 50 });

  const cardCls = cn("rounded-2xl border", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/60 border-slate-700/50");
  const valCls = cn("font-medium text-sm", isLight ? "text-slate-800" : "text-white");

  const statusBadge = (s: string) => {
    const m: Record<string, string> = {
      active: "bg-green-500/15 text-green-500 border-green-500/30",
      driving: "bg-blue-500/15 text-blue-500 border-blue-500/30",
      off_duty: "bg-slate-500/15 text-slate-400 border-slate-500/30",
      inactive: "bg-red-500/15 text-red-500 border-red-500/30",
    };
    return <Badge className={cn("border text-xs font-bold", m[s] || "bg-slate-500/15 text-slate-400 border-slate-500/30")}>{s?.replace("_", " ").replace(/\b\w/g, c => c.toUpperCase()) || "Unknown"}</Badge>;
  };

  const filteredDrivers = (driversQuery.data as any)?.filter((driver: any) => {
    return !searchTerm || 
      driver.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      driver.cdlNumber?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const totalDrivers = (driversQuery.data as any)?.length || 0;
  const activeDrivers = (driversQuery.data as any)?.filter((d: any) => d.status === "active" || d.status === "driving").length || 0;
  const drivingNow = (driversQuery.data as any)?.filter((d: any) => d.status === "driving").length || 0;
  const lowHOS = (driversQuery.data as any)?.filter((d: any) => d.hosRemaining && d.hosRemaining < 2).length || 0;

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1200px] mx-auto">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">Drivers</h1>
          <p className={cn("text-sm mt-1", isLight ? "text-slate-500" : "text-slate-400")}>Manage your driver roster and assignments</p>
        </div>
        <Button className="bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white rounded-xl font-bold text-sm" onClick={() => setLocation("/driver/management")}>
          <Plus className="w-4 h-4 mr-2" />Add Driver
        </Button>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total", value: totalDrivers, icon: <Users className="w-5 h-5" />, color: "text-blue-500", bg: "bg-blue-500/15" },
          { label: "Active", value: activeDrivers, icon: <CheckCircle className="w-5 h-5" />, color: "text-green-500", bg: "bg-green-500/15" },
          { label: "Driving", value: drivingNow, icon: <Clock className="w-5 h-5" />, color: "text-cyan-500", bg: "bg-cyan-500/15" },
          { label: "Low HOS", value: lowHOS, icon: <AlertTriangle className="w-5 h-5" />, color: "text-yellow-500", bg: "bg-yellow-500/15" },
        ].map((stat) => (
          <Card key={stat.label} className={cardCls}>
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className={cn("p-3 rounded-xl", stat.bg)}>
                  <span className={stat.color}>{stat.icon}</span>
                </div>
                <div>
                  {driversQuery.isLoading ? (
                    <Skeleton className={cn("h-8 w-12 rounded-lg", isLight ? "bg-slate-200" : "")} />
                  ) : (
                    <p className={cn("text-2xl font-bold", stat.color)}>{stat.value}</p>
                  )}
                  <p className="text-xs text-slate-400">{stat.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Search ── */}
      <div className={cn("relative max-w-md rounded-xl border", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/60 border-slate-700/50")}>
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <Input
          value={searchTerm}
          onChange={(e: any) => setSearchTerm(e.target.value)}
          placeholder="Search drivers..."
          className={cn("pl-9 border-0 rounded-xl focus-visible:ring-0", isLight ? "bg-transparent" : "bg-transparent text-white placeholder:text-slate-400")}
        />
      </div>

      {/* ── Drivers List ── */}
      <Card className={cardCls}>
        <CardContent className="p-0">
          {driversQuery.isLoading ? (
            <div className="p-4 space-y-3">{[1, 2, 3, 4].map((i: number) => <Skeleton key={i} className={cn("h-20 w-full rounded-xl", isLight ? "bg-slate-100" : "")} />)}</div>
          ) : filteredDrivers?.length === 0 ? (
            <div className="text-center py-16">
              <div className={cn("p-4 rounded-full w-16 h-16 mx-auto mb-3 flex items-center justify-center", isLight ? "bg-slate-100" : "bg-slate-700/50")}>
                <Users className="w-8 h-8 text-slate-400" />
              </div>
              <p className={cn("font-medium", isLight ? "text-slate-600" : "text-slate-300")}>No drivers found</p>
              <p className="text-sm text-slate-400 mt-1">Add your first driver to get started</p>
              <Button className="mt-4 bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white rounded-xl font-bold" onClick={() => setLocation("/driver/management")}>
                <Plus className="w-4 h-4 mr-2" />Add Driver
              </Button>
            </div>
          ) : (
            <div className={cn("divide-y", isLight ? "divide-slate-100" : "divide-slate-700/30")}>
              {filteredDrivers?.map((driver: any) => (
                <div key={driver.id} className={cn("p-4 transition-colors", isLight ? "hover:bg-slate-50" : "hover:bg-slate-700/20")}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={cn("p-3 rounded-xl",
                        driver.status === "driving" ? "bg-blue-500/15" : driver.status === "active" ? "bg-green-500/15" : "bg-slate-500/15"
                      )}>
                        <Users className={cn("w-5 h-5",
                          driver.status === "driving" ? "text-blue-500" : driver.status === "active" ? "text-green-500" : "text-slate-400"
                        )} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <p className={valCls}>{driver.name}</p>
                          {statusBadge(driver.status)}
                        </div>
                        <p className="text-sm text-slate-400">{driver.truckNumber} · CDL: {driver.cdlNumber}</p>
                        {driver.hosRemaining !== undefined && (
                          <p className={cn("text-xs", driver.hosRemaining < 2 ? "text-yellow-500 font-medium" : "text-slate-400")}>
                            HOS: {driver.hosRemaining}h remaining
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button variant="ghost" size="sm" className={cn("rounded-lg", isLight ? "text-slate-400 hover:text-slate-700" : "text-slate-400 hover:text-white")}>
                        <Phone className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="outline" className={cn("rounded-xl text-xs font-bold", isLight ? "border-slate-200 hover:bg-slate-50" : "border-slate-700 hover:bg-slate-700")} onClick={() => setLocation(`/drivers/${driver.id}`)}>
                        <Eye className="w-3.5 h-3.5 mr-1" />View
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
