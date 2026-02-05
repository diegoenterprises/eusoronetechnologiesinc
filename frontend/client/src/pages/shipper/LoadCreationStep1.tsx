/**
 * LOAD CREATION STEP 1 - Product & Hazmat Classification
 * 100% Dynamic - ESANG AI suggests hazmat classification
 */
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Package, AlertTriangle, Sparkles, ChevronRight } from "lucide-react";
import { useLocation } from "wouter";

export default function LoadCreationStep1() {
  const [, navigate] = useLocation();
  const [productName, setProductName] = useState("");
  const [hazmatClass, setHazmatClass] = useState("");

  const classifyMutation = trpc.esang.classifyHazmat.useMutation();
  const hazmatClassesQuery = trpc.loads.list.useQuery({});

  const handleAISuggest = () => {
    if (productName) classifyMutation.mutate({ productName });
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-cyan-600 to-emerald-600 flex items-center justify-center text-white font-bold">1</div>
          <span className="text-white font-medium">Product Info</span>
        </div>
        <div className="h-px flex-1 bg-slate-700" />
        {[2,3,4,5,6,7].map(n => <div key={n} className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-slate-400">{n}</div>)}
      </div>

      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader><CardTitle className="text-white flex items-center gap-2"><Package className="w-5 h-5 text-cyan-400" />Product & Classification</CardTitle></CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label className="text-slate-300">Product Name</Label>
            <div className="flex gap-2">
              <Input value={productName} onChange={(e) => setProductName(e.target.value)} placeholder="e.g., Gasoline, Diesel Fuel, Crude Oil" className="bg-slate-700/50 border-slate-600/50 rounded-lg" />
              <Button onClick={handleAISuggest} disabled={!productName || classifyMutation.isPending} className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg">
                <Sparkles className="w-4 h-4 mr-2" />ESANG AI
              </Button>
            </div>
          </div>

          {classifyMutation.data && (
            <Card className="bg-purple-500/10 border-purple-500/30 rounded-lg">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2"><Sparkles className="w-4 h-4 text-purple-400" /><span className="text-purple-400 font-medium">AI Suggestion</span></div>
                <p className="text-white">Class {classifyMutation.data.class}: {(classifyMutation.data as any).name || classifyMutation.data.properName}</p>
                <p className="text-slate-400 text-sm mt-1">{(classifyMutation.data as any).description || ""}</p>
                <Button size="sm" className="mt-3" onClick={() => setHazmatClass(classifyMutation.data.class)}>Use This Classification</Button>
              </CardContent>
            </Card>
          )}

          <div className="space-y-2">
            <Label className="text-slate-300">Hazmat Classification</Label>
            {hazmatClassesQuery.isLoading ? <Skeleton className="h-10 w-full" /> : (
              <Select value={hazmatClass} onValueChange={setHazmatClass}>
                <SelectTrigger className="bg-slate-700/50 border-slate-600/50 rounded-lg"><SelectValue placeholder="Select hazmat class" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Not Hazardous</SelectItem>
                  {hazmatClassesQuery.data?.map((c: any) => <SelectItem key={c.class} value={c.class}>Class {c.class}: {c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
          </div>

          {hazmatClass && hazmatClass !== "none" && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
              <AlertTriangle className="w-5 h-5 text-yellow-400" />
              <span className="text-yellow-400 text-sm">Hazmat shipment - Additional documentation required</span>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={() => navigate("/shipper/load-creation/step-2")} className="bg-gradient-to-r from-cyan-600 to-emerald-600 rounded-lg">
          Continue <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
