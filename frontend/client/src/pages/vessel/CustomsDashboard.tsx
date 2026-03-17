/**
 * CUSTOMS DASHBOARD — V5 Multi-Modal
 * Customs broker dashboard: active entries, holds, cleared today,
 * ISF filing deadlines, duty payment tracker, HTS classification
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Shield,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Clock,
  DollarSign,
  FileText,
  Search as SearchIcon,
  Calendar,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";

// Mock customs data
const MOCK_ENTRIES = [
  {
    id: 1,
    entryNumber: "ENT-2026-00451",
    bookingRef: "VB-2026-0034",
    importerName: "Pacific Electronics Inc",
    htsCode: "8471.30.0100",
    entryType: "Consumption (01)",
    value: 245000,
    duty: 0,
    status: "cleared",
    filedDate: "2026-03-12",
  },
  {
    id: 2,
    entryNumber: "ENT-2026-00452",
    bookingRef: "VB-2026-0038",
    importerName: "Midwest Auto Parts LLC",
    htsCode: "8708.99.8180",
    entryType: "Consumption (01)",
    value: 182000,
    duty: 4550,
    status: "hold",
    filedDate: "2026-03-14",
  },
  {
    id: 3,
    entryNumber: "ENT-2026-00453",
    bookingRef: "VB-2026-0041",
    importerName: "Fashion Forward Imports",
    htsCode: "6104.63.2011",
    entryType: "Consumption (01)",
    value: 98000,
    duty: 15680,
    status: "pending",
    filedDate: "2026-03-15",
  },
  {
    id: 4,
    entryNumber: "ENT-2026-00454",
    bookingRef: "VB-2026-0042",
    importerName: "GlobalTech Semiconductors",
    htsCode: "8542.31.0000",
    entryType: "FTZ (06)",
    value: 520000,
    duty: 0,
    status: "cleared",
    filedDate: "2026-03-15",
  },
  {
    id: 5,
    entryNumber: "ENT-2026-00455",
    bookingRef: "VB-2026-0045",
    importerName: "GreenLeaf Organics",
    htsCode: "0804.50.6045",
    entryType: "Consumption (01)",
    value: 67000,
    duty: 3685,
    status: "pending",
    filedDate: "2026-03-16",
  },
];

const ISF_DEADLINES = [
  { bookingRef: "VB-2026-0048", vessel: "MSC FLORA", deadline: "2026-03-18T12:00:00", status: "on_track" },
  { bookingRef: "VB-2026-0050", vessel: "MAERSK EDMONTON", deadline: "2026-03-17T08:00:00", status: "urgent" },
  { bookingRef: "VB-2026-0052", vessel: "CMA CGM SAADE", deadline: "2026-03-20T12:00:00", status: "on_track" },
];

function statusBadge(status: string) {
  if (status === "cleared" || status === "on_track")
    return "bg-emerald-500/20 text-emerald-400";
  if (status === "hold" || status === "urgent")
    return "bg-red-500/20 text-red-400";
  return "bg-amber-500/20 text-amber-400";
}

export default function CustomsDashboard() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [tab, setTab] = useState("entries");
  const [search, setSearch] = useState("");

  const bg = isLight ? "bg-slate-50" : "bg-[#0a0a0a]";
  const cardBg = cn(
    "border",
    isLight
      ? "bg-white border-slate-200"
      : "bg-slate-800/60 border-slate-700/50"
  );

  const clearedToday = MOCK_ENTRIES.filter((e) => e.status === "cleared").length;
  const holds = MOCK_ENTRIES.filter((e) => e.status === "hold").length;
  const pending = MOCK_ENTRIES.filter((e) => e.status === "pending").length;
  const totalDuty = MOCK_ENTRIES.reduce((s, e) => s + e.duty, 0);

  const filteredEntries = MOCK_ENTRIES.filter(
    (e) =>
      !search ||
      e.entryNumber.toLowerCase().includes(search.toLowerCase()) ||
      e.importerName.toLowerCase().includes(search.toLowerCase()) ||
      e.htsCode.includes(search)
  );

  return (
    <div className={cn("min-h-screen p-6", bg)}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-indigo-500/10">
          <Shield className="w-6 h-6 text-indigo-400" />
        </div>
        <div>
          <h1
            className={cn(
              "text-2xl font-bold",
              isLight ? "text-slate-900" : "text-white"
            )}
          >
            Customs Dashboard
          </h1>
          <p
            className={cn(
              "text-sm",
              isLight ? "text-slate-500" : "text-slate-400"
            )}
          >
            CBP entries, ISF filings &amp; duty management
          </p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className={cn("rounded-xl border p-4", isLight ? "bg-white border-slate-200" : "bg-slate-800/60 border-slate-700/50")}>
          <div className="p-2 rounded-lg w-fit mb-2 bg-emerald-500/10">
            <CheckCircle className="w-5 h-5 text-emerald-400" />
          </div>
          <div className={cn("text-2xl font-bold", isLight ? "text-slate-900" : "text-white")}>
            {clearedToday}
          </div>
          <div className={cn("text-xs mt-1", isLight ? "text-slate-500" : "text-slate-400")}>
            Cleared
          </div>
        </div>
        <div className={cn("rounded-xl border p-4", isLight ? "bg-white border-slate-200" : "bg-slate-800/60 border-slate-700/50")}>
          <div className="p-2 rounded-lg w-fit mb-2 bg-red-500/10">
            <XCircle className="w-5 h-5 text-red-400" />
          </div>
          <div className={cn("text-2xl font-bold text-red-400")}>{holds}</div>
          <div className={cn("text-xs mt-1", isLight ? "text-slate-500" : "text-slate-400")}>
            On Hold
          </div>
        </div>
        <div className={cn("rounded-xl border p-4", isLight ? "bg-white border-slate-200" : "bg-slate-800/60 border-slate-700/50")}>
          <div className="p-2 rounded-lg w-fit mb-2 bg-amber-500/10">
            <Clock className="w-5 h-5 text-amber-400" />
          </div>
          <div className={cn("text-2xl font-bold", isLight ? "text-slate-900" : "text-white")}>
            {pending}
          </div>
          <div className={cn("text-xs mt-1", isLight ? "text-slate-500" : "text-slate-400")}>
            Pending Review
          </div>
        </div>
        <div className={cn("rounded-xl border p-4", isLight ? "bg-white border-slate-200" : "bg-slate-800/60 border-slate-700/50")}>
          <div className="p-2 rounded-lg w-fit mb-2 bg-blue-500/10">
            <DollarSign className="w-5 h-5 text-blue-400" />
          </div>
          <div className={cn("text-2xl font-bold", isLight ? "text-slate-900" : "text-white")}>
            ${totalDuty.toLocaleString()}
          </div>
          <div className={cn("text-xs mt-1", isLight ? "text-slate-500" : "text-slate-400")}>
            Total Duty
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="entries">
            <FileText className="w-3.5 h-3.5 mr-1" />
            Entries
          </TabsTrigger>
          <TabsTrigger value="isf">
            <Calendar className="w-3.5 h-3.5 mr-1" />
            ISF Deadlines
          </TabsTrigger>
          <TabsTrigger value="hts">
            <SearchIcon className="w-3.5 h-3.5 mr-1" />
            HTS Lookup
          </TabsTrigger>
        </TabsList>

        {/* Entries Tab */}
        <TabsContent value="entries">
          <div className="relative mb-4">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              className="pl-9"
              placeholder="Search by entry #, importer, or HTS code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="space-y-3">
            {filteredEntries.map((e) => (
              <Card key={e.id} className={cardBg}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <FileText
                        className={cn(
                          "w-4 h-4",
                          e.status === "cleared"
                            ? "text-emerald-400"
                            : e.status === "hold"
                              ? "text-red-400"
                              : "text-amber-400"
                        )}
                      />
                      <div>
                        <div
                          className={cn(
                            "font-medium text-sm",
                            isLight ? "text-slate-900" : "text-white"
                          )}
                        >
                          {e.entryNumber}
                        </div>
                        <div
                          className={cn(
                            "text-xs",
                            isLight ? "text-slate-500" : "text-slate-400"
                          )}
                        >
                          {e.importerName} — Booking: {e.bookingRef}
                        </div>
                      </div>
                    </div>
                    <Badge className={statusBadge(e.status)}>
                      {e.status}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-xs">
                    <div>
                      <span className="text-slate-500">HTS: </span>
                      <span
                        className={cn(
                          "font-mono",
                          isLight ? "text-slate-700" : "text-slate-300"
                        )}
                      >
                        {e.htsCode}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500">Type: </span>
                      <span
                        className={
                          isLight ? "text-slate-700" : "text-slate-300"
                        }
                      >
                        {e.entryType}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500">Value: </span>
                      <span
                        className={
                          isLight ? "text-slate-700" : "text-slate-300"
                        }
                      >
                        ${e.value.toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500">Duty: </span>
                      <span
                        className={
                          e.duty > 0
                            ? "text-amber-400"
                            : isLight
                              ? "text-slate-700"
                              : "text-slate-300"
                        }
                      >
                        ${e.duty.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* ISF Deadlines Tab */}
        <TabsContent value="isf">
          <Card className={cardBg}>
            <CardHeader>
              <CardTitle
                className={cn(
                  "text-sm flex items-center gap-2",
                  isLight ? "text-slate-900" : "text-white"
                )}
              >
                <Calendar className="w-4 h-4 text-amber-400" />
                ISF 10+2 Filing Deadlines
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className={cn(
                  "p-3 rounded-lg mb-4 text-xs",
                  isLight ? "bg-amber-50" : "bg-amber-500/10"
                )}
              >
                <AlertTriangle className="w-4 h-4 text-amber-400 inline mr-2" />
                ISF must be filed 24 hours before vessel loading at foreign port
              </div>
              <div className="space-y-3">
                {ISF_DEADLINES.map((isf, i) => (
                  <div
                    key={i}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-lg",
                      isLight ? "bg-slate-50" : "bg-slate-700/20"
                    )}
                  >
                    <div>
                      <div
                        className={cn(
                          "font-medium text-sm",
                          isLight ? "text-slate-900" : "text-white"
                        )}
                      >
                        {isf.bookingRef}
                      </div>
                      <div
                        className={cn(
                          "text-xs",
                          isLight ? "text-slate-500" : "text-slate-400"
                        )}
                      >
                        Vessel: {isf.vessel} — Due:{" "}
                        {new Date(isf.deadline).toLocaleString()}
                      </div>
                    </div>
                    <Badge className={statusBadge(isf.status)}>
                      {isf.status.replace(/_/g, " ")}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* HTS Lookup Tab */}
        <TabsContent value="hts">
          <Card className={cardBg}>
            <CardHeader>
              <CardTitle
                className={cn(
                  "text-sm flex items-center gap-2",
                  isLight ? "text-slate-900" : "text-white"
                )}
              >
                <SearchIcon className="w-4 h-4 text-blue-400" />
                HTS Classification Tool
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-w-md">
                <Input
                  placeholder="Enter HTS code or product description..."
                  className="mb-4"
                />
                <div
                  className={cn(
                    "p-4 rounded-lg text-center",
                    isLight ? "bg-slate-50" : "bg-slate-700/20"
                  )}
                >
                  <SearchIcon
                    className={cn(
                      "w-8 h-8 mx-auto mb-2",
                      isLight ? "text-slate-300" : "text-slate-600"
                    )}
                  />
                  <p
                    className={cn(
                      "text-sm",
                      isLight ? "text-slate-400" : "text-slate-500"
                    )}
                  >
                    Enter an HTS code or product description to look up tariff
                    rates, duty percentages, and trade program eligibility
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
