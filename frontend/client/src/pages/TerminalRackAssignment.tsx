/**
 * TERMINAL RACK ASSIGNMENT PAGE - 100% Dynamic
 */
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import { Fuel, Truck, Clock, CheckCircle, AlertTriangle, Play, Gauge, Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function TerminalRackAssignment() {
  const [selectedRack, setSelectedRack] = useState<string | null>(null);
  const racksQuery = (trpc as any).terminals.getRacks.useQuery();
  const queueQuery = (trpc as any).terminals.getAppointments.useQuery({});
  const scadaQuery = (trpc as any).terminals.getScadaStats.useQuery(undefined, { refetchInterval: 5000 });

  const assignMutation = (trpc as any).terminals.createAppointment.useMutation({
    onSuccess: () => { toast.success("Assigned"); queueQuery.refetch(); racksQuery.refetch(); },
  });
  const startMutation = (trpc as any).terminals.startLoading.useMutation({
    onSuccess: () => { toast.success("Loading started"); racksQuery.refetch(); },
  });

  const racks = racksQuery.data || [];
  const queue = queueQuery.data || [];
  const scada = scadaQuery.data;

  const getColor = (s: string) => s === "available" ? "bg-green-500/20 border-green-500/30" : s === "loading" ? "bg-cyan-500/20 border-cyan-500/30" : "bg-slate-500/20 border-slate-500/30";

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">Rack Assignment</h1><p className="text-slate-400 text-sm mt-1">Manage loading racks</p></div>
        <Badge className={cn("border-0", (scada as any)?.connected || scada?.terminalsOnline ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400")}><Activity className="w-3 h-3 mr-1" />SCADA</Badge>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl"><CardContent className="p-4 flex items-center gap-3"><div className="p-2 rounded-lg bg-green-500/20"><Fuel className="w-5 h-5 text-green-400" /></div><div><p className="text-2xl font-bold text-white">{(scada as any)?.availableRacks || scada?.activeRacks || 0}</p><p className="text-xs text-slate-400">Available</p></div></CardContent></Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl"><CardContent className="p-4 flex items-center gap-3"><div className="p-2 rounded-lg bg-cyan-500/20"><Gauge className="w-5 h-5 text-cyan-400" /></div><div><p className="text-2xl font-bold text-white">{(scada as any)?.activeLoading || scada?.activeFlows || 0}</p><p className="text-xs text-slate-400">Loading</p></div></CardContent></Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl"><CardContent className="p-4 flex items-center gap-3"><div className="p-2 rounded-lg bg-yellow-500/20"><Truck className="w-5 h-5 text-yellow-400" /></div><div><p className="text-2xl font-bold text-white">{queue.length}</p><p className="text-xs text-slate-400">Queue</p></div></CardContent></Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl"><CardContent className="p-4 flex items-center gap-3"><div className="p-2 rounded-lg bg-purple-500/20"><Gauge className="w-5 h-5 text-purple-400" /></div><div><p className="text-2xl font-bold text-white">{(scada as any)?.flowRate || scada?.totalThroughput || 0}</p><p className="text-xs text-slate-400">GPM</p></div></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardHeader className="pb-3"><CardTitle className="text-white flex items-center gap-2"><Fuel className="w-5 h-5 text-orange-400" />Loading Racks</CardTitle></CardHeader>
          <CardContent>
            {racksQuery.isLoading ? <div className="grid grid-cols-3 gap-4">{Array(6).fill(0).map((_: any, i: number) => <Skeleton key={i} className="h-40 rounded-lg" />)}</div> : (
              <div className="grid grid-cols-3 gap-4">
                {racks.map((r: any) => (
                  <div key={r.id} onClick={() => setSelectedRack(r.id)} className={cn("p-4 rounded-lg border-2 cursor-pointer", getColor(r.status), selectedRack === r.id && "ring-2 ring-cyan-400")}>
                    <div className="flex items-center justify-between mb-2"><span className="text-white font-bold">{r.name}</span><Badge className="border-0 text-xs">{r.status}</Badge></div>
                    {r.status === "loading" && <><Progress value={r.loadingProgress} className="h-2 mb-1" /><p className="text-xs text-slate-400">{r.loadingProgress}%</p></>}
                    {r.status === "available" && <div className="flex items-center gap-1 text-green-400 text-sm"><CheckCircle className="w-4 h-4" />Ready</div>}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardHeader className="pb-3"><CardTitle className="text-white flex items-center gap-2"><Truck className="w-5 h-5 text-yellow-400" />Queue</CardTitle></CardHeader>
          <CardContent>
            {queue.length === 0 ? <div className="text-center py-8"><Truck className="w-8 h-8 text-slate-500 mx-auto mb-2" /><p className="text-slate-400 text-sm">No trucks</p></div> : (
              <div className="space-y-3">
                {queue.map((q: any, i: number) => (
                  <div key={q.id} className="p-3 rounded-lg bg-slate-700/30">
                    <div className="flex items-center justify-between mb-1"><span className="text-white font-medium">{q.truckNumber}</span><span className="text-xs text-slate-400">{q.product}</span></div>
                    <div className="flex items-center gap-2 text-xs text-slate-400"><Clock className="w-3 h-3" />{q.waitTime}m</div>
                    {selectedRack && <Button size="sm" className="w-full mt-2 bg-gradient-to-r from-cyan-600 to-emerald-600 rounded-lg" onClick={() => assignMutation.mutate({ terminalId: selectedRack, carrierId: q.id, driverId: "", truckNumber: q.truckNumber, productId: "", quantity: 0, scheduledDate: "", scheduledTime: "" } as any)}>Assign</Button>}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
