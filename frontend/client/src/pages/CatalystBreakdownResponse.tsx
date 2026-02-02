/**
 * CATALYST BREAKDOWN RESPONSE PAGE - 100% Dynamic
 */
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { useRoute, useLocation } from "wouter";
import { AlertTriangle, Wrench, MapPin, Phone, User, ChevronLeft, Send, CheckCircle, Building } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function CatalystBreakdownResponse() {
  const [, navigate] = useLocation();
  const [, params] = useRoute("/catalyst/breakdown/:incidentId");
  const incidentId = params?.incidentId;
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [action, setAction] = useState("");

  const incidentQuery = trpc.zeun.getBreakdown.useQuery({ id: incidentId || "" });
  const providersQuery = trpc.zeun.getNearbyProviders.useQuery({ incidentId: incidentId || "" });
  const dispatchMutation = trpc.zeun.dispatchRepair.useMutation({
    onSuccess: () => { toast.success("Repair dispatched"); incidentQuery.refetch(); },
  });

  const incident = incidentQuery.data;
  const providers = providersQuery.data || [];

  if (incidentQuery.isLoading) return <div className="p-6 space-y-4"><Skeleton className="h-12 w-64" /><Skeleton className="h-96 w-full rounded-xl" /></div>;

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/catalyst/exceptions")} className="text-slate-400 hover:text-white"><ChevronLeft className="w-6 h-6" /></Button>
        <div className="flex-1"><h1 className="text-3xl font-bold bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">Breakdown Response</h1><p className="text-slate-400 text-sm mt-1">Incident #{incident?.incidentNumber}</p></div>
        <Badge className={cn("border-0", incident?.status === "reported" ? "bg-red-500/20 text-red-400" : "bg-yellow-500/20 text-yellow-400")}>{incident?.status}</Badge>
      </div>

      <Card className="bg-gradient-to-r from-red-500/20 to-orange-500/20 border-red-500/50 rounded-xl">
        <CardContent className="p-4 flex items-center gap-4">
          <div className="p-3 rounded-full bg-red-500/20"><AlertTriangle className="w-8 h-8 text-red-400" /></div>
          <div><p className="text-white font-bold text-lg">{incident?.issueType}</p><p className="text-slate-300">{incident?.description}</p></div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-4"><div className="flex items-center gap-2 text-slate-400 mb-2"><MapPin className="w-4 h-4" />Location</div><p className="text-white">{incident?.location?.address}</p></CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-4"><div className="flex items-center gap-2 text-slate-400 mb-2"><User className="w-4 h-4" />Driver</div><p className="text-white">{incident?.driver?.name}</p><p className="text-cyan-400 text-sm">{incident?.driver?.phone}</p></CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardHeader className="pb-3"><CardTitle className="text-white flex items-center gap-2"><Wrench className="w-5 h-5 text-cyan-400" />Service Providers</CardTitle></CardHeader>
          <CardContent>
            {providers.length === 0 ? <div className="text-center py-8"><Building className="w-8 h-8 text-slate-500 mx-auto mb-2" /><p className="text-slate-400">No providers nearby</p></div> : (
              <div className="space-y-3">
                {providers.map((p: any) => (
                  <div key={p.id} onClick={() => setSelectedProvider(p.id)} className={cn("p-4 rounded-lg border-2 cursor-pointer", selectedProvider === p.id ? "bg-cyan-500/10 border-cyan-500/50" : "bg-slate-700/30 border-slate-600/30")}>
                    <div className="flex items-center justify-between"><div><p className="text-white font-medium">{p.name}</p><p className="text-slate-400 text-sm">{p.address}</p></div><div className="text-right"><p className="text-cyan-400">{p.distance} mi</p><p className="text-slate-400 text-sm">ETA: {p.eta}</p></div></div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardHeader className="pb-3"><CardTitle className="text-white">Actions</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Select value={action} onValueChange={setAction}><SelectTrigger className="bg-slate-700/50 border-slate-600/50 rounded-lg"><SelectValue placeholder="Select action" /></SelectTrigger><SelectContent><SelectItem value="dispatch_repair">Dispatch Repair</SelectItem><SelectItem value="tow_vehicle">Tow Vehicle</SelectItem><SelectItem value="send_relief">Send Relief Driver</SelectItem></SelectContent></Select>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes..." className="bg-slate-700/50 border-slate-600/50 rounded-lg" />
            <Button onClick={() => dispatchMutation.mutate({ incidentId: incidentId!, providerId: selectedProvider!, action, notes })} disabled={!selectedProvider || !action} className="w-full bg-gradient-to-r from-cyan-600 to-emerald-600 rounded-lg"><Send className="w-4 h-4 mr-2" />Dispatch</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
