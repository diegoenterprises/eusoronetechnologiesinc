/**
 * PRE-TRIP CHECKLIST PAGE
 * 100% Dynamic - No mock data
 * UI Style: Gradient headers, stat cards with icons, rounded cards
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  ClipboardCheck, CheckCircle, AlertTriangle, Truck,
  Send, Camera
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function PreTripChecklist() {
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [notes, setNotes] = useState("");
  const [defects, setDefects] = useState<string[]>([]);

  const checklistQuery = trpc.drivers.getPreTripChecklist.useQuery();
  const vehicleQuery = trpc.drivers.getCurrentVehicle.useQuery();

  const submitMutation = trpc.drivers.submitPreTripInspection.useMutation({
    onSuccess: () => { toast.success("Pre-trip inspection submitted"); setCheckedItems({}); setNotes(""); setDefects([]); },
    onError: (error) => toast.error("Failed", { description: error.message }),
  });

  const toggleItem = (itemId: string, hasDefect: boolean = false) => {
    setCheckedItems(prev => ({ ...prev, [itemId]: !prev[itemId] }));
    if (hasDefect) {
      setDefects(prev => prev.includes(itemId) ? prev.filter(d => d !== itemId) : [...prev, itemId]);
    }
  };

  const handleSubmit = () => {
    submitMutation.mutate({ checkedItems, notes, defects });
  };

  const allChecked = checklistQuery.data?.categories?.every((cat: any) => cat.items.every((item: any) => checkedItems[item.id]));

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">Pre-Trip Checklist</h1>
          <p className="text-slate-400 text-sm mt-1">Complete your vehicle inspection</p>
        </div>
      </div>

      {vehicleQuery.isLoading ? <Skeleton className="h-24 w-full rounded-xl" /> : vehicleQuery.data && (
        <Card className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border-cyan-500/30 rounded-xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-cyan-500/20"><Truck className="w-8 h-8 text-cyan-400" /></div>
              <div>
                <p className="text-white font-bold text-lg">{vehicleQuery.data.number}</p>
                <p className="text-sm text-slate-400">{vehicleQuery.data.make} {vehicleQuery.data.model} | {vehicleQuery.data.year}</p>
                <p className="text-xs text-slate-500">VIN: {vehicleQuery.data.vin}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {checklistQuery.isLoading ? (
        <div className="space-y-4">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-48 w-full rounded-xl" />)}</div>
      ) : (
        <>
          {checklistQuery.data?.categories?.map((category: any) => (
            <Card key={category.id} className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-white text-lg flex items-center gap-2">
                  <ClipboardCheck className="w-5 h-5 text-cyan-400" />
                  {category.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {category.items.map((item: any) => (
                  <div key={item.id} className={cn("p-3 rounded-lg border flex items-center justify-between", defects.includes(item.id) ? "bg-red-500/10 border-red-500/30" : checkedItems[item.id] ? "bg-green-500/10 border-green-500/30" : "bg-slate-700/30 border-slate-600/50")}>
                    <div className="flex items-center gap-3">
                      <Checkbox checked={checkedItems[item.id] || false} onCheckedChange={() => toggleItem(item.id)} className="border-slate-500" />
                      <div>
                        <p className="text-white">{item.name}</p>
                        {item.description && <p className="text-xs text-slate-500">{item.description}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {checkedItems[item.id] && !defects.includes(item.id) && <CheckCircle className="w-5 h-5 text-green-400" />}
                      {defects.includes(item.id) && <AlertTriangle className="w-5 h-5 text-red-400" />}
                      <Button size="sm" variant={defects.includes(item.id) ? "destructive" : "outline"} className={cn("rounded-lg text-xs", !defects.includes(item.id) && "bg-slate-700/50 border-slate-600/50")} onClick={() => toggleItem(item.id, true)}>
                        {defects.includes(item.id) ? "Defect Noted" : "Report Defect"}
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}

          {defects.length > 0 && (
            <Card className="bg-gradient-to-r from-red-500/10 to-orange-500/10 border-red-500/30 rounded-xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-white text-lg flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                  Defects Reported ({defects.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {defects.map(defectId => {
                    const item = checklistQuery.data?.categories?.flatMap((c: any) => c.items).find((i: any) => i.id === defectId);
                    return <Badge key={defectId} className="bg-red-500/20 text-red-400 border-0">{item?.name}</Badge>;
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
            <CardHeader className="pb-3"><CardTitle className="text-white text-lg">Notes</CardTitle></CardHeader>
            <CardContent>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Add any additional notes..." className="bg-slate-700/50 border-slate-600/50 rounded-lg min-h-[100px]" />
            </CardContent>
          </Card>

          <div className="flex items-center justify-between">
            <Button variant="outline" className="bg-slate-800/50 border-slate-700/50 hover:bg-slate-700 rounded-lg">
              <Camera className="w-4 h-4 mr-2" />Add Photos
            </Button>
            <Button className="bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 rounded-lg" onClick={handleSubmit} disabled={!allChecked || submitMutation.isPending}>
              <Send className="w-4 h-4 mr-2" />Submit Inspection
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
