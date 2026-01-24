/**
 * ELD LOGS PAGE
 * Electronic Logging Device management and compliance per 49 CFR 395
 * Based on 04_DRIVER_USER_JOURNEY.md and 08_COMPLIANCE_OFFICER_USER_JOURNEY.md
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Clock, Truck, User, Calendar, Download, Upload, Search,
  AlertTriangle, CheckCircle, FileText, Filter, RefreshCw,
  ChevronLeft, ChevronRight, Eye, Edit, Shield, Activity
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type DutyStatus = "off_duty" | "sleeper" | "driving" | "on_duty";

interface ELDRecord {
  id: string;
  driverId: string;
  driverName: string;
  date: string;
  status: "certified" | "pending" | "violation" | "edited";
  totalDriving: number;
  totalOnDuty: number;
  totalOffDuty: number;
  totalSleeper: number;
  violations: string[];
  edits: number;
  vehicle: string;
}

interface DailyLogEntry {
  id: string;
  status: DutyStatus;
  startTime: string;
  endTime: string;
  duration: number;
  location: string;
  odometer?: number;
  notes?: string;
  edited?: boolean;
}

const STATUS_CONFIG: Record<DutyStatus, { color: string; bgColor: string; label: string }> = {
  off_duty: { color: "text-slate-400", bgColor: "bg-slate-500", label: "Off Duty" },
  sleeper: { color: "text-purple-400", bgColor: "bg-purple-500", label: "Sleeper" },
  driving: { color: "text-green-400", bgColor: "bg-green-500", label: "Driving" },
  on_duty: { color: "text-yellow-400", bgColor: "bg-yellow-500", label: "On Duty" },
};

export default function ELDLogs() {
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedDriver, setSelectedDriver] = useState("all");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [searchTerm, setSearchTerm] = useState("");

  const drivers = [
    { id: "d1", name: "Mike Johnson" },
    { id: "d2", name: "Sarah Williams" },
    { id: "d3", name: "David Brown" },
    { id: "d4", name: "Emily Martinez" },
    { id: "d5", name: "Chris Taylor" },
  ];

  const eldRecords: ELDRecord[] = [
    { id: "eld_001", driverId: "d1", driverName: "Mike Johnson", date: "2025-01-23", status: "pending", totalDriving: 420, totalOnDuty: 510, totalOffDuty: 840, totalSleeper: 0, violations: [], edits: 0, vehicle: "TRK-4521" },
    { id: "eld_002", driverId: "d2", driverName: "Sarah Williams", date: "2025-01-23", status: "certified", totalDriving: 480, totalOnDuty: 540, totalOffDuty: 900, totalSleeper: 0, violations: [], edits: 0, vehicle: "TRK-3892" },
    { id: "eld_003", driverId: "d3", driverName: "David Brown", date: "2025-01-23", status: "violation", totalDriving: 690, totalOnDuty: 750, totalOffDuty: 690, totalSleeper: 0, violations: ["Exceeded 11-hour driving limit"], edits: 1, vehicle: "TRK-2156" },
    { id: "eld_004", driverId: "d4", driverName: "Emily Martinez", date: "2025-01-23", status: "certified", totalDriving: 390, totalOnDuty: 450, totalOffDuty: 990, totalSleeper: 0, violations: [], edits: 0, vehicle: "TRK-5543" },
    { id: "eld_005", driverId: "d5", driverName: "Chris Taylor", date: "2025-01-23", status: "edited", totalDriving: 450, totalOnDuty: 510, totalOffDuty: 930, totalSleeper: 0, violations: [], edits: 2, vehicle: "TRK-7821" },
    { id: "eld_006", driverId: "d1", driverName: "Mike Johnson", date: "2025-01-22", status: "certified", totalDriving: 480, totalOnDuty: 540, totalOffDuty: 900, totalSleeper: 0, violations: [], edits: 0, vehicle: "TRK-4521" },
    { id: "eld_007", driverId: "d2", driverName: "Sarah Williams", date: "2025-01-22", status: "certified", totalDriving: 450, totalOnDuty: 510, totalOffDuty: 930, totalSleeper: 0, violations: [], edits: 0, vehicle: "TRK-3892" },
  ];

  const selectedDayLog: DailyLogEntry[] = [
    { id: "e1", status: "off_duty", startTime: "00:00", endTime: "06:00", duration: 360, location: "Houston, TX" },
    { id: "e2", status: "on_duty", startTime: "06:00", endTime: "06:30", duration: 30, location: "Houston, TX", notes: "Pre-trip inspection" },
    { id: "e3", status: "driving", startTime: "06:30", endTime: "10:30", duration: 240, location: "En route", odometer: 12450 },
    { id: "e4", status: "on_duty", startTime: "10:30", endTime: "11:00", duration: 30, location: "Rest Area I-45", notes: "30-min break" },
    { id: "e5", status: "driving", startTime: "11:00", endTime: "14:00", duration: 180, location: "En route", odometer: 12720 },
    { id: "e6", status: "on_duty", startTime: "14:00", endTime: "14:30", duration: 30, location: "Dallas Terminal", notes: "Delivery" },
    { id: "e7", status: "off_duty", startTime: "14:30", endTime: "23:59", duration: 569, location: "Dallas, TX" },
  ];

  const complianceStats = {
    totalDrivers: 45,
    compliant: 42,
    violations: 2,
    pendingCertification: 5,
    averageDriving: 7.2,
    unidentifiedDriving: 0.5,
  };

  const formatDuration = (minutes: number) => {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hrs}h ${mins}m`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "certified": return "bg-green-500/20 text-green-400";
      case "pending": return "bg-yellow-500/20 text-yellow-400";
      case "violation": return "bg-red-500/20 text-red-400";
      case "edited": return "bg-blue-500/20 text-blue-400";
      default: return "bg-slate-500/20 text-slate-400";
    }
  };

  const filteredRecords = eldRecords.filter(record => {
    if (selectedDriver !== "all" && record.driverId !== selectedDriver) return false;
    if (searchTerm && !record.driverName.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const navigateDate = (direction: number) => {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() + direction);
    setSelectedDate(current.toISOString().split("T")[0]);
  };

  const exportLogs = () => {
    toast.success("ELD logs exported", {
      description: "CSV file download started",
    });
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">ELD Logs</h1>
          <p className="text-slate-400 text-sm">Electronic Logging Device compliance per 49 CFR 395</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="border-slate-600">
            <Upload className="w-4 h-4 mr-2" />
            Import
          </Button>
          <Button variant="outline" className="border-slate-600" onClick={exportLogs}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Compliance Stats */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-white">{complianceStats.totalDrivers}</p>
            <p className="text-xs text-slate-400">Total Drivers</p>
          </CardContent>
        </Card>
        <Card className="bg-green-500/10 border-green-500/30">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-400">{complianceStats.compliant}</p>
            <p className="text-xs text-slate-400">Compliant</p>
          </CardContent>
        </Card>
        <Card className="bg-red-500/10 border-red-500/30">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-red-400">{complianceStats.violations}</p>
            <p className="text-xs text-slate-400">Violations</p>
          </CardContent>
        </Card>
        <Card className="bg-yellow-500/10 border-yellow-500/30">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-yellow-400">{complianceStats.pendingCertification}</p>
            <p className="text-xs text-slate-400">Pending</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-blue-400">{complianceStats.averageDriving}h</p>
            <p className="text-xs text-slate-400">Avg Driving</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-purple-400">{complianceStats.unidentifiedDriving}h</p>
            <p className="text-xs text-slate-400">Unidentified</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-slate-800 border border-slate-700">
          <TabsTrigger value="overview" className="data-[state=active]:bg-blue-600">Overview</TabsTrigger>
          <TabsTrigger value="daily" className="data-[state=active]:bg-blue-600">Daily Logs</TabsTrigger>
          <TabsTrigger value="violations" className="data-[state=active]:bg-blue-600">Violations</TabsTrigger>
          <TabsTrigger value="edits" className="data-[state=active]:bg-blue-600">Edit History</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white">Driver Logs</CardTitle>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <Input
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search drivers..."
                      className="pl-9 w-48 bg-slate-700/50 border-slate-600"
                    />
                  </div>
                  <Select value={selectedDriver} onValueChange={setSelectedDriver}>
                    <SelectTrigger className="w-40 bg-slate-700/50 border-slate-600">
                      <SelectValue placeholder="All Drivers" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Drivers</SelectItem>
                      {drivers.map(d => (
                        <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {filteredRecords.map((record) => (
                  <div
                    key={record.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-slate-700/30 hover:bg-slate-700/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-slate-600 flex items-center justify-center">
                        <User className="w-5 h-5 text-slate-400" />
                      </div>
                      <div>
                        <p className="text-white font-medium">{record.driverName}</p>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <span>{record.vehicle}</span>
                          <span>-</span>
                          <span>{record.date}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      {/* Time Summary */}
                      <div className="hidden md:flex items-center gap-4 text-sm">
                        <div className="text-center">
                          <p className="text-green-400 font-medium">{formatDuration(record.totalDriving)}</p>
                          <p className="text-xs text-slate-500">Driving</p>
                        </div>
                        <div className="text-center">
                          <p className="text-yellow-400 font-medium">{formatDuration(record.totalOnDuty)}</p>
                          <p className="text-xs text-slate-500">On-Duty</p>
                        </div>
                        <div className="text-center">
                          <p className="text-slate-400 font-medium">{formatDuration(record.totalOffDuty)}</p>
                          <p className="text-xs text-slate-500">Off-Duty</p>
                        </div>
                      </div>

                      {/* Status & Actions */}
                      <div className="flex items-center gap-3">
                        {record.violations.length > 0 && (
                          <AlertTriangle className="w-4 h-4 text-red-400" />
                        )}
                        {record.edits > 0 && (
                          <Badge className="bg-blue-500/20 text-blue-400 text-xs">
                            {record.edits} edit{record.edits > 1 ? "s" : ""}
                          </Badge>
                        )}
                        <Badge className={getStatusBadge(record.status)}>
                          {record.status}
                        </Badge>
                        <Button variant="ghost" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Daily Logs Tab */}
        <TabsContent value="daily" className="mt-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white">Daily Log Detail</CardTitle>
                <div className="flex items-center gap-3">
                  <Select value={selectedDriver} onValueChange={setSelectedDriver}>
                    <SelectTrigger className="w-40 bg-slate-700/50 border-slate-600">
                      <SelectValue placeholder="Select Driver" />
                    </SelectTrigger>
                    <SelectContent>
                      {drivers.map(d => (
                        <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => navigateDate(-1)}>
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-slate-700/50">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <span className="text-white">{new Date(selectedDate).toLocaleDateString()}</span>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => navigateDate(1)}
                      disabled={selectedDate === new Date().toISOString().split("T")[0]}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Graph Grid */}
              <div className="mb-6">
                <div className="flex items-center gap-4 mb-2">
                  {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                    <div key={key} className="flex items-center gap-1 text-xs">
                      <div className={cn("w-3 h-3 rounded", config.bgColor)} />
                      <span className={config.color}>{config.label}</span>
                    </div>
                  ))}
                </div>
                
                <div className="relative h-24 bg-slate-700/30 rounded-lg overflow-hidden">
                  {/* Hour markers */}
                  <div className="absolute inset-x-0 top-0 flex">
                    {Array.from({ length: 25 }, (_, i) => (
                      <div key={i} className="flex-1 border-l border-slate-600 text-[10px] text-slate-500 pl-0.5">
                        {i % 4 === 0 && i.toString().padStart(2, "0")}
                      </div>
                    ))}
                  </div>
                  
                  {/* Status bars */}
                  <div className="absolute inset-0 pt-4">
                    {selectedDayLog.map((entry) => {
                      const startHour = parseInt(entry.startTime.split(":")[0]) + parseInt(entry.startTime.split(":")[1]) / 60;
                      const width = entry.duration / (24 * 60) * 100;
                      const left = startHour / 24 * 100;
                      
                      return (
                        <div
                          key={entry.id}
                          className={cn("absolute h-12 top-6 rounded", STATUS_CONFIG[entry.status].bgColor)}
                          style={{ left: `${left}%`, width: `${width}%` }}
                          title={`${STATUS_CONFIG[entry.status].label}: ${entry.startTime} - ${entry.endTime}`}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Log Entries */}
              <div className="space-y-2">
                {selectedDayLog.map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-700/30">
                    <div className="flex items-center gap-3">
                      <div className={cn("w-3 h-8 rounded", STATUS_CONFIG[entry.status].bgColor)} />
                      <div>
                        <p className={cn("font-medium", STATUS_CONFIG[entry.status].color)}>
                          {STATUS_CONFIG[entry.status].label}
                        </p>
                        <p className="text-xs text-slate-500">{entry.location}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {entry.notes && (
                        <span className="text-xs text-slate-400">{entry.notes}</span>
                      )}
                      {entry.odometer && (
                        <span className="text-xs text-slate-500">ODO: {entry.odometer.toLocaleString()}</span>
                      )}
                      <div className="text-right">
                        <p className="text-white text-sm">{entry.startTime} - {entry.endTime}</p>
                        <p className="text-xs text-slate-500">{formatDuration(entry.duration)}</p>
                      </div>
                      {entry.edited && (
                        <Badge className="bg-blue-500/20 text-blue-400 text-xs">Edited</Badge>
                      )}
                      <Button variant="ghost" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Summary */}
              <div className="mt-6 grid grid-cols-4 gap-4 p-4 rounded-lg bg-slate-700/30">
                <div className="text-center">
                  <p className="text-green-400 font-bold">7h 0m</p>
                  <p className="text-xs text-slate-500">Driving</p>
                </div>
                <div className="text-center">
                  <p className="text-yellow-400 font-bold">8h 30m</p>
                  <p className="text-xs text-slate-500">On-Duty</p>
                </div>
                <div className="text-center">
                  <p className="text-slate-400 font-bold">15h 29m</p>
                  <p className="text-xs text-slate-500">Off-Duty</p>
                </div>
                <div className="text-center">
                  <p className="text-purple-400 font-bold">0h 0m</p>
                  <p className="text-xs text-slate-500">Sleeper</p>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-4 flex justify-end gap-3">
                <Button variant="outline" className="border-slate-600">
                  <Download className="w-4 h-4 mr-2" />
                  Export PDF
                </Button>
                <Button className="bg-green-600 hover:bg-green-700">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Certify Log
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Violations Tab */}
        <TabsContent value="violations" className="mt-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                HOS Violations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {eldRecords.filter(r => r.violations.length > 0).map((record) => (
                  <div key={record.id} className="p-4 rounded-lg bg-red-500/10 border border-red-500/30">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <AlertTriangle className="w-5 h-5 text-red-400" />
                        <div>
                          <p className="text-white font-medium">{record.driverName}</p>
                          <p className="text-xs text-slate-500">{record.date} - {record.vehicle}</p>
                        </div>
                      </div>
                      <Button size="sm" variant="outline" className="border-red-500/50 text-red-400">
                        Review
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {record.violations.map((violation, idx) => (
                        <p key={idx} className="text-sm text-red-300">- {violation}</p>
                      ))}
                    </div>
                  </div>
                ))}
                {eldRecords.filter(r => r.violations.length > 0).length === 0 && (
                  <div className="text-center py-8">
                    <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
                    <p className="text-slate-400">No violations found</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Edit History Tab */}
        <TabsContent value="edits" className="mt-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Edit className="w-5 h-5 text-blue-400" />
                Edit History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {eldRecords.filter(r => r.edits > 0).map((record) => (
                  <div key={record.id} className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Edit className="w-5 h-5 text-blue-400" />
                        <div>
                          <p className="text-white font-medium">{record.driverName}</p>
                          <p className="text-xs text-slate-500">{record.date} - {record.edits} edit(s)</p>
                        </div>
                      </div>
                      <Button size="sm" variant="outline" className="border-blue-500/50 text-blue-400">
                        View Changes
                      </Button>
                    </div>
                  </div>
                ))}
                {eldRecords.filter(r => r.edits > 0).length === 0 && (
                  <div className="text-center py-8">
                    <FileText className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-400">No edits recorded</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
