/**
 * ELD LOGS PAGE
 * 100% Dynamic - No mock data
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  Clock, Calendar, AlertTriangle, CheckCircle, FileText,
  ChevronLeft, ChevronRight, Download, Send, User,
  Truck, MapPin, Activity, Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function ELDLogs() {
  const [activeTab, setActiveTab] = useState("current");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [selectedDriver, setSelectedDriver] = useState<string>("");

  const driversQuery = trpc.drivers.list.useQuery({ limit: 50 });
  const currentStatusQuery = trpc.hos.getCurrentStatus.useQuery({ driverId: selectedDriver }, { enabled: !!selectedDriver });
  const dailyLogQuery = trpc.hos.getDailyLog.useQuery({ driverId: selectedDriver, date: selectedDate }, { enabled: !!selectedDriver });
  const violationsQuery = trpc.hos.getViolations.useQuery({ driverId: selectedDriver }, { enabled: !!selectedDriver });

  const certifyMutation = trpc.hos.certifyLog.useMutation({
    onSuccess: () => { toast.success("Log certified"); dailyLogQuery.refetch(); },
    onError: (error) => toast.error("Failed to certify", { description: error.message }),
  });

  // Auto-select first driver
  React.useEffect(() => {
    if (driversQuery.data?.drivers?.length && !selectedDriver) {
      setSelectedDriver(driversQuery.data.drivers[0].id);
    }
  }, [driversQuery.data, selectedDriver]);

  if (driversQuery.error) {
    return (
      <div className="p-6 text-center">
        <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <p className="text-red-400">Error loading ELD data</p>
        <Button className="mt-4" onClick={() => driversQuery.refetch()}>Retry</Button>
      </div>
    );
  }

  const navigateDate = (direction: number) => {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() + direction);
    setSelectedDate(current.toISOString().split("T")[0]);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "driving": return "bg-green-500/20 text-green-400";
      case "on_duty": return "bg-blue-500/20 text-blue-400";
      case "sleeper": return "bg-purple-500/20 text-purple-400";
      case "off_duty": return "bg-slate-500/20 text-slate-400";
      default: return "bg-slate-500/20 text-slate-400";
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const current = currentStatusQuery.data;
  const dailyLog = dailyLogQuery.data;

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">ELD Logs</h1>
          <p className="text-slate-400 text-sm">Hours of Service tracking and compliance</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedDriver} onValueChange={setSelectedDriver}>
            <SelectTrigger className="w-48 bg-slate-700/50 border-slate-600">
              <SelectValue placeholder="Select Driver" />
            </SelectTrigger>
            <SelectContent>
              {driversQuery.isLoading ? (
                <div className="p-2"><Skeleton className="h-6 w-full" /></div>
              ) : (
                driversQuery.data?.drivers?.map(d => (
                  <SelectItem key={d.id} value={d.id}>{d.firstName} {d.lastName}</SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          <Button variant="outline" className="border-slate-600"><Download className="w-4 h-4 mr-2" />Export</Button>
        </div>
      </div>

      {/* Current Status */}
      <Card className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/30">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 rounded-full bg-slate-700 flex items-center justify-center">
                <User className="w-8 h-8 text-slate-400" />
              </div>
              <div>
                {currentStatusQuery.isLoading ? (
                  <>
                    <Skeleton className="h-8 w-48 mb-2" />
                    <Skeleton className="h-6 w-32" />
                  </>
                ) : (
                  <>
                    <h2 className="text-2xl font-bold text-white">{current?.driverName}</h2>
                    <div className="flex items-center gap-3 mt-2">
                      <Badge className={getStatusColor(current?.currentStatus || "")}>{current?.currentStatus?.replace("_", " ")}</Badge>
                      <span className="text-slate-400">Since {current?.statusSince}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center gap-8">
              {currentStatusQuery.isLoading ? (
                [1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-24" />)
              ) : (
                <>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-green-400">{formatDuration(current?.available?.driving || 0)}</p>
                    <p className="text-xs text-slate-400">Drive Time Left</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-blue-400">{formatDuration(current?.available?.onDuty || 0)}</p>
                    <p className="text-xs text-slate-400">On-Duty Left</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-purple-400">{formatDuration(current?.available?.cycle || 0)}</p>
                    <p className="text-xs text-slate-400">Cycle Left</p>
                  </div>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* HOS Limits */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {currentStatusQuery.isLoading ? (
          [1, 2, 3, 4].map((i) => <Card key={i} className="bg-slate-800/50 border-slate-700"><CardContent className="p-4"><Skeleton className="h-16 w-full" /></CardContent></Card>)
        ) : (
          <>
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-400 text-sm">11-Hour Driving</span>
                  <span className="text-white font-medium">{formatDuration(current?.used?.driving || 0)} / 11h</span>
                </div>
                <Progress value={((current?.used?.driving || 0) / 660) * 100} className="h-2" />
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-400 text-sm">14-Hour Window</span>
                  <span className="text-white font-medium">{formatDuration(current?.used?.window || 0)} / 14h</span>
                </div>
                <Progress value={((current?.used?.window || 0) / 840) * 100} className="h-2" />
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-400 text-sm">30-Min Break</span>
                  <span className={cn("font-medium", current?.breakRequired ? "text-yellow-400" : "text-green-400")}>
                    {current?.breakRequired ? "Required" : "Not Required"}
                  </span>
                </div>
                <Progress value={current?.breakRequired ? 100 : 0} className="h-2" />
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-400 text-sm">70-Hour Cycle</span>
                  <span className="text-white font-medium">{formatDuration(current?.used?.cycle || 0)} / 70h</span>
                </div>
                <Progress value={((current?.used?.cycle || 0) / 4200) * 100} className="h-2" />
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Date Navigation */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigateDate(-1)}><ChevronLeft className="w-5 h-5" /></Button>
        <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-700/50">
          <Calendar className="w-4 h-4 text-slate-400" />
          <span className="text-white font-medium">{new Date(selectedDate).toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" })}</span>
        </div>
        <Button variant="ghost" size="sm" onClick={() => navigateDate(1)}><ChevronRight className="w-5 h-5" /></Button>
        <Button variant="outline" size="sm" className="border-slate-600" onClick={() => setSelectedDate(new Date().toISOString().split("T")[0])}>Today</Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-slate-800 border border-slate-700">
          <TabsTrigger value="current" className="data-[state=active]:bg-blue-600">Daily Log</TabsTrigger>
          <TabsTrigger value="graph" className="data-[state=active]:bg-blue-600">Graph View</TabsTrigger>
          <TabsTrigger value="violations" className="data-[state=active]:bg-blue-600">
            Violations ({violationsQuery.data?.length || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="current" className="mt-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white">Log Entries</CardTitle>
                <div className="flex items-center gap-2">
                  {dailyLog?.certified ? (
                    <Badge className="bg-green-500/20 text-green-400"><CheckCircle className="w-3 h-3 mr-1" />Certified</Badge>
                  ) : (
                    <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => certifyMutation.mutate({ driverId: selectedDriver, date: selectedDate })} disabled={certifyMutation.isPending}>
                      {certifyMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircle className="w-4 h-4 mr-2" />Certify Log</>}
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {dailyLogQuery.isLoading ? (
                <div className="space-y-3">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
              ) : dailyLog?.entries?.length === 0 ? (
                <p className="text-slate-400 text-center py-8">No log entries for this date</p>
              ) : (
                <div className="space-y-3">
                  {dailyLog?.entries?.map((entry) => (
                    <div key={entry.id} className="flex items-center justify-between p-4 rounded-lg bg-slate-700/30">
                      <div className="flex items-center gap-4">
                        <div className={cn("w-3 h-3 rounded-full", entry.status === "driving" ? "bg-green-500" : entry.status === "on_duty" ? "bg-blue-500" : entry.status === "sleeper" ? "bg-purple-500" : "bg-slate-500")} />
                        <div>
                          <p className="text-white font-medium capitalize">{entry.status?.replace("_", " ")}</p>
                          <p className="text-sm text-slate-400">{entry.startTime} - {entry.endTime || "Current"}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="text-white font-medium">{formatDuration(entry.duration)}</p>
                          <p className="text-xs text-slate-500">Duration</p>
                        </div>
                        {entry.location && (
                          <div className="flex items-center gap-1 text-slate-400">
                            <MapPin className="w-4 h-4" />
                            <span className="text-sm">{entry.location}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="graph" className="mt-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader><CardTitle className="text-white">24-Hour Graph</CardTitle></CardHeader>
            <CardContent>
              <div className="h-48 bg-slate-700/30 rounded-lg flex items-center justify-center">
                <Activity className="w-12 h-12 text-slate-600" />
              </div>
              <div className="flex items-center justify-center gap-6 mt-4">
                <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-slate-500" /><span className="text-sm text-slate-400">Off Duty</span></div>
                <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-purple-500" /><span className="text-sm text-slate-400">Sleeper</span></div>
                <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-green-500" /><span className="text-sm text-slate-400">Driving</span></div>
                <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-blue-500" /><span className="text-sm text-slate-400">On Duty</span></div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="violations" className="mt-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader><CardTitle className="text-white flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-red-400" />HOS Violations</CardTitle></CardHeader>
            <CardContent>
              {violationsQuery.isLoading ? (
                <div className="space-y-3">{[1, 2].map((i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
              ) : violationsQuery.data?.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
                  <p className="text-slate-400">No violations</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {violationsQuery.data?.map((violation) => (
                    <div key={violation.id} className="flex items-center justify-between p-4 rounded-lg bg-red-500/10 border border-red-500/30">
                      <div className="flex items-center gap-4">
                        <AlertTriangle className="w-5 h-5 text-red-400" />
                        <div>
                          <p className="text-white font-medium">{violation.type}</p>
                          <p className="text-sm text-slate-400">{violation.description}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-red-400 font-medium">{violation.severity}</p>
                        <p className="text-xs text-slate-500">{violation.date}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
