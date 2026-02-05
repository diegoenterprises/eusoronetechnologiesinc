/**
 * SAFETY INCIDENT INVESTIGATION PAGE - 100% Dynamic
 */
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { SignatureCanvas, SignatureData } from "@/components/ui/signature-canvas";
import { trpc } from "@/lib/trpc";
import { useRoute, useLocation } from "wouter";
import { AlertTriangle, User, Truck, Camera, ChevronLeft, CheckCircle, Upload, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function SafetyIncidentInvestigation() {
  const [, navigate] = useLocation();
  const [, params] = useRoute("/safety/incident/:incidentId");
  const incidentId = params?.incidentId;
  const [activeTab, setActiveTab] = useState("details");
  const [showSignature, setShowSignature] = useState(false);
  const [findings, setFindings] = useState("");

  const incidentQuery = (trpc as any).safety.getIncident.useQuery({ id: incidentId || "" });
  const userQuery = (trpc as any).users.me.useQuery();
  const closeMutation = (trpc as any).safety.closeIncident.useMutation({
    onSuccess: () => { toast.success("Investigation closed"); navigate("/safety/incidents"); },
  });

  const incident = incidentQuery.data;
  const user = userQuery.data;

  const handleSign = (sig: SignatureData) => {
    closeMutation.mutate({ id: incidentId!, resolution: findings } as any);
  };

  if (incidentQuery.isLoading) return <div className="p-6 space-y-4"><Skeleton className="h-12 w-64" /><Skeleton className="h-96 w-full rounded-xl" /></div>;

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/safety/incidents")} className="text-slate-400 hover:text-white"><ChevronLeft className="w-6 h-6" /></Button>
        <div className="flex-1"><h1 className="text-3xl font-bold bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">Incident Investigation</h1><p className="text-slate-400 text-sm mt-1">Case #{incident?.incidentNumber}</p></div>
        <Badge className={cn("border-0", incident?.status === "open" ? "bg-red-500/20 text-red-400" : "bg-green-500/20 text-green-400")}>{incident?.status}</Badge>
      </div>

      {showSignature ? (
        <SignatureCanvas signerName={user?.name || "Safety Manager"} signerRole="Safety Manager" documentName={`Investigation #${incident?.incidentNumber}`} documentType="Investigation Closure" onSave={handleSign} onCancel={() => setShowSignature(false)} />
      ) : (
        <>
          <Card className="bg-gradient-to-r from-red-500/10 to-orange-500/10 border-red-500/30 rounded-xl">
            <CardContent className="p-6 grid grid-cols-4 gap-4">
              <div><p className="text-slate-400 text-sm">Date</p><p className="text-white font-medium">{incident?.date ? new Date(incident.date).toLocaleString() : 'N/A'}</p></div>
              <div><p className="text-slate-400 text-sm">Location</p><p className="text-white font-medium">{incident?.location?.city || 'N/A'}, {incident?.location?.state || ''}</p></div>
              <div><p className="text-slate-400 text-sm">Type</p><Badge className="bg-red-500/20 text-red-400 border-0">{incident?.type}</Badge></div>
              <div><p className="text-slate-400 text-sm">Severity</p><Badge className="bg-orange-500/20 text-orange-400 border-0">{incident?.severity}</Badge></div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-4">
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardHeader className="pb-3"><CardTitle className="text-white flex items-center gap-2"><User className="w-5 h-5 text-cyan-400" />Driver</CardTitle></CardHeader>
              <CardContent><p className="text-white font-medium">{incident?.driver?.name}</p><p className="text-slate-400 text-sm">CDL: {(incident?.driver as any)?.cdlNumber || "N/A"}</p></CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardHeader className="pb-3"><CardTitle className="text-white flex items-center gap-2"><Truck className="w-5 h-5 text-purple-400" />Vehicle</CardTitle></CardHeader>
              <CardContent><p className="text-white font-medium">Unit #{incident?.vehicle?.unitNumber}</p><p className="text-slate-400 text-sm">{incident?.vehicle?.make}</p></CardContent>
            </Card>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-1">
              <TabsTrigger value="details" className="rounded-md">Details</TabsTrigger>
              <TabsTrigger value="findings" className="rounded-md">Findings</TabsTrigger>
            </TabsList>
            <TabsContent value="details" className="mt-6">
              <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
                <CardContent className="p-6"><p className="text-white">{incident?.description}</p></CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="findings" className="mt-6">
              <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
                <CardContent className="p-6 space-y-4">
                  <Textarea value={findings} onChange={(e: any) => setFindings(e.target.value)} placeholder="Enter investigation findings..." className="bg-slate-700/50 border-slate-600/50 rounded-lg min-h-[150px]" />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => navigate("/safety/incidents")} className="bg-slate-700/50 border-slate-600/50 rounded-lg">Cancel</Button>
            <Button onClick={() => setShowSignature(true)} disabled={!findings} className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg"><CheckCircle className="w-4 h-4 mr-2" />Close Investigation</Button>
          </div>
        </>
      )}
    </div>
  );
}
