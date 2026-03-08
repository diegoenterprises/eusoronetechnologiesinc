/**
 * NATURAL LANGUAGE LOAD CREATION PAGE (GAP-339)
 * Type a sentence → AI parses into structured load form → review & submit.
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  Sparkles, Send, MapPin, Truck, Package, DollarSign, Calendar,
  Weight, AlertTriangle, Thermometer, ArrowRight, CheckCircle,
  XCircle, Lightbulb, RefreshCw, Zap, FileText, Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";

const CONFIDENCE_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  high: { color: "text-emerald-400", bg: "bg-emerald-500/10", label: "High Confidence" },
  medium: { color: "text-amber-400", bg: "bg-amber-500/10", label: "Medium Confidence" },
  low: { color: "text-red-400", bg: "bg-red-500/10", label: "Low Confidence" },
};

function getConfidenceLevel(pct: number) {
  if (pct >= 60) return "high";
  if (pct >= 30) return "medium";
  return "low";
}

export default function NLLoadCreatorPage() {
  const [input, setInput] = useState("");
  const [parsed, setParsed] = useState<any>(null);
  const [showExamples, setShowExamples] = useState(true);

  const parseMutation = (trpc as any).nlLoadCreator?.parseLoadText?.useMutation?.({
    onSuccess: (data: any) => {
      setParsed(data);
      if (data?.success) setShowExamples(false);
    },
  }) || { mutate: () => {}, isLoading: false };

  const examplesQuery = (trpc as any).nlLoadCreator?.getExamples?.useQuery?.() || { data: null };
  const examples = examplesQuery.data || [];

  const handleParse = () => {
    if (!input.trim()) return;
    parseMutation.mutate({ text: input.trim() });
  };

  const handleExample = (text: string) => {
    setInput(text);
    parseMutation.mutate({ text });
  };

  const load = parsed?.parsed;
  const confLevel = load ? getConfidenceLevel(load.confidence) : "low";
  const conf = CONFIDENCE_CONFIG[confLevel];

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
            Natural Language Load Creator
          </h1>
          <p className="text-slate-400 text-sm mt-1">Describe your load in plain English — AI builds the form</p>
        </div>
        <Badge variant="outline" className="text-[9px] border-violet-500/30 text-violet-400">
          <Sparkles className="w-3 h-3 mr-1" />AI-Powered
        </Badge>
      </div>

      {/* Input Area */}
      <Card className="bg-slate-800/50 border-violet-500/20 rounded-xl border">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-5 h-5 text-violet-400" />
            <span className="text-sm font-semibold text-white">Describe your load</span>
          </div>
          <div className="flex gap-2">
            <Input
              placeholder='e.g. "Flatbed from Houston TX to Dallas TX, 40000 lbs steel coils, pickup next Monday, $2800"'
              value={input}
              onChange={(e: any) => setInput(e.target.value)}
              onKeyDown={(e: any) => e.key === "Enter" && handleParse()}
              className="bg-slate-900/50 border-slate-700 text-white text-sm flex-1"
            />
            <Button
              onClick={handleParse}
              disabled={!input.trim() || parseMutation.isLoading}
              className="bg-gradient-to-r from-violet-500 to-purple-600 min-w-[120px]"
            >
              {parseMutation.isLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <><Zap className="w-4 h-4 mr-1" />Parse</>
              )}
            </Button>
          </div>

          {/* Quick tips */}
          <div className="flex items-center gap-4 mt-2 text-[9px] text-slate-500">
            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> "from X to Y"</span>
            <span className="flex items-center gap-1"><Truck className="w-3 h-3" /> equipment type</span>
            <span className="flex items-center gap-1"><Weight className="w-3 h-3" /> weight in lbs</span>
            <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" /> rate or $/mile</span>
            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> dates</span>
            <span className="flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> hazmat flags</span>
          </div>
        </CardContent>
      </Card>

      {/* Loading */}
      {parseMutation.isLoading && (
        <div className="space-y-3">
          <Skeleton className="h-12 bg-slate-700/30 rounded-xl" />
          <Skeleton className="h-48 bg-slate-700/30 rounded-xl" />
        </div>
      )}

      {/* Parsed Result */}
      {parsed && load && !parseMutation.isLoading && (
        <div className="space-y-4">
          {/* Confidence Banner */}
          <Card className={cn("rounded-xl border", conf.bg, `border-${confLevel === "high" ? "emerald" : confLevel === "medium" ? "amber" : "red"}-500/20`)}>
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {parsed.success ? (
                    <CheckCircle className={cn("w-5 h-5", conf.color)} />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-400" />
                  )}
                  <span className={cn("text-sm font-semibold", conf.color)}>{conf.label}</span>
                  <span className="text-[10px] text-slate-500">
                    {load.parsedFields.length} fields extracted
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-20 h-2 rounded-full bg-slate-700/50 overflow-hidden">
                    <div
                      className={cn("h-full rounded-full transition-all", confLevel === "high" ? "bg-emerald-500" : confLevel === "medium" ? "bg-amber-500" : "bg-red-500")}
                      style={{ width: `${load.confidence}%` }}
                    />
                  </div>
                  <span className={cn("text-sm font-bold font-mono", conf.color)}>{load.confidence}%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Parsed Fields Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Route Card */}
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs text-white flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-blue-400" />Route
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="flex-1 p-2 rounded-lg bg-slate-900/30 border border-slate-700/30">
                    <p className="text-[8px] text-slate-500 uppercase">Origin</p>
                    <p className={cn("text-sm font-semibold", load.originCity ? "text-white" : "text-slate-600")}>
                      {load.originCity || "Not specified"}
                      {load.originState && <span className="text-slate-400 ml-1">{load.originState}</span>}
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-500 flex-shrink-0" />
                  <div className="flex-1 p-2 rounded-lg bg-slate-900/30 border border-slate-700/30">
                    <p className="text-[8px] text-slate-500 uppercase">Destination</p>
                    <p className={cn("text-sm font-semibold", load.destinationCity ? "text-white" : "text-slate-600")}>
                      {load.destinationCity || "Not specified"}
                      {load.destinationState && <span className="text-slate-400 ml-1">{load.destinationState}</span>}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Equipment & Cargo */}
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs text-white flex items-center gap-2">
                  <Truck className="w-4 h-4 text-cyan-400" />Equipment & Cargo
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-3">
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 rounded-lg bg-slate-900/30">
                    <p className="text-[8px] text-slate-500">Equipment</p>
                    <p className={cn("text-[11px] font-semibold capitalize", load.equipmentType ? "text-white" : "text-slate-600")}>
                      {load.equipmentType?.replace(/_/g, " ") || "Not specified"}
                    </p>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-900/30">
                    <p className="text-[8px] text-slate-500">Cargo Type</p>
                    <p className={cn("text-[11px] font-semibold capitalize", load.cargoType ? "text-white" : "text-slate-600")}>
                      {load.cargoType?.replace(/_/g, " ") || "Not specified"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  {load.hazmat && <Badge variant="outline" className="text-[8px] border-red-500/30 text-red-400"><AlertTriangle className="w-3 h-3 mr-0.5" />Hazmat</Badge>}
                  {load.temperatureControlled && <Badge variant="outline" className="text-[8px] border-blue-500/30 text-blue-400"><Thermometer className="w-3 h-3 mr-0.5" />Temp Controlled</Badge>}
                  {load.oversized && <Badge variant="outline" className="text-[8px] border-orange-500/30 text-orange-400"><Package className="w-3 h-3 mr-0.5" />Oversized</Badge>}
                </div>
              </CardContent>
            </Card>

            {/* Weight & Dimensions */}
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs text-white flex items-center gap-2">
                  <Weight className="w-4 h-4 text-amber-400" />Weight & Quantity
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-3">
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 rounded-lg bg-slate-900/30">
                    <p className="text-[8px] text-slate-500">Weight</p>
                    <p className={cn("text-sm font-bold font-mono", load.weight ? "text-white" : "text-slate-600")}>
                      {load.weight ? `${load.weight.toLocaleString()} ${load.weightUnit}` : "—"}
                    </p>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-900/30">
                    <p className="text-[8px] text-slate-500">Pallets</p>
                    <p className={cn("text-sm font-bold font-mono", load.palletCount ? "text-white" : "text-slate-600")}>
                      {load.palletCount || "—"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Schedule & Rate */}
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs text-white flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-green-400" />Schedule & Rate
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-3">
                <div className="grid grid-cols-3 gap-2">
                  <div className="p-2 rounded-lg bg-slate-900/30">
                    <p className="text-[8px] text-slate-500">Pickup</p>
                    <p className={cn("text-[10px] font-semibold", load.pickupDate ? "text-white" : "text-slate-600")}>
                      {load.pickupDate || "—"}
                    </p>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-900/30">
                    <p className="text-[8px] text-slate-500">Delivery</p>
                    <p className={cn("text-[10px] font-semibold", load.deliveryDate ? "text-white" : "text-slate-600")}>
                      {load.deliveryDate || "—"}
                    </p>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-900/30">
                    <p className="text-[8px] text-slate-500">Rate</p>
                    <p className={cn("text-sm font-bold font-mono", load.rate ? "text-emerald-400" : "text-slate-600")}>
                      {load.rate ? `$${load.rate.toLocaleString()}` : "—"}
                      {load.rateType === "per_mile" && <span className="text-[8px] text-slate-400">/mi</span>}
                    </p>
                  </div>
                </div>
                {load.urgency !== "standard" && (
                  <Badge variant="outline" className={cn("text-[8px] mt-2", load.urgency === "asap" ? "border-red-500/30 text-red-400" : "border-amber-500/30 text-amber-400")}>
                    <Clock className="w-3 h-3 mr-0.5" />{load.urgency.toUpperCase()}
                  </Badge>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Extracted Entities */}
          {parsed.extractedEntities?.length > 0 && (
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-violet-400" />Extracted Entities
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-3">
                <div className="flex flex-wrap gap-1.5">
                  {parsed.extractedEntities.map((e: any, i: number) => (
                    <div key={i} className="flex items-center gap-1 px-2 py-1 rounded-lg bg-violet-500/10 border border-violet-500/20">
                      <span className="text-[9px] text-violet-300 font-mono">{e.type}</span>
                      <span className="text-[10px] text-white font-semibold">{e.text}</span>
                      <span className="text-[8px] text-slate-500">{Math.round(e.confidence * 100)}%</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Suggestions */}
          {load.suggestions?.length > 0 && (
            <Card className="bg-slate-800/50 border-amber-500/20 rounded-xl border">
              <CardContent className="p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Lightbulb className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-semibold text-amber-400">Suggestions to improve</span>
                </div>
                <div className="space-y-1">
                  {load.suggestions.map((s: string, i: number) => (
                    <p key={i} className="text-[10px] text-slate-400">• {s}</p>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <Button className="bg-gradient-to-r from-emerald-500 to-green-600" disabled={!parsed.success}>
              <FileText className="w-4 h-4 mr-2" />Create Load from Parsed Data
            </Button>
            <Button variant="outline" className="border-slate-600 text-slate-300" onClick={() => { setParsed(null); setInput(""); setShowExamples(true); }}>
              <RefreshCw className="w-4 h-4 mr-2" />Start Over
            </Button>
          </div>
        </div>
      )}

      {/* Examples */}
      {showExamples && examples.length > 0 && !parseMutation.isLoading && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-semibold text-white">Example Prompts</span>
            <span className="text-[9px] text-slate-500">Click any to try</span>
          </div>
          {examples.map((cat: any) => (
            <Card key={cat.category} className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-3">
                <p className="text-[10px] font-semibold text-slate-400 uppercase mb-2">{cat.category}</p>
                <div className="space-y-1.5">
                  {cat.examples.map((ex: string, i: number) => (
                    <button
                      key={i}
                      onClick={() => handleExample(ex)}
                      className="w-full text-left px-3 py-2 rounded-lg bg-slate-900/30 border border-slate-700/30 hover:border-violet-500/30 hover:bg-violet-500/5 transition-all group"
                    >
                      <p className="text-[11px] text-slate-300 group-hover:text-white transition-colors">
                        "{ex}"
                      </p>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!parsed && !showExamples && !parseMutation.isLoading && (
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-12 text-center">
            <div className="inline-flex p-4 rounded-2xl bg-violet-500/10 border border-violet-500/20 mb-4">
              <Sparkles className="w-8 h-8 text-violet-400" />
            </div>
            <p className="text-lg font-semibold text-white">AI Load Creator</p>
            <p className="text-sm text-slate-400 mt-1">Type a load description and we'll extract all the details</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
