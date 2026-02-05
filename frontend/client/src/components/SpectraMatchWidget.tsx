/**
 * SPECTRA-MATCH™ EMBEDDABLE WIDGET
 * Compact version of the crude oil identification system
 * for embedding into Load Creation, Terminal SCADA, BOL, Run Tickets, etc.
 * 
 * Usage:
 *   <SpectraMatchWidget 
 *     onIdentify={(result) => setOilType(result)}
 *     compact={true}
 *     loadId="LD-12345"
 *   />
 */

import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  Activity, Droplets, Target, CheckCircle, ChevronDown, ChevronUp,
  Sparkles, Save,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface SpectraMatchResult {
  primaryMatch: {
    id: string;
    name: string;
    type: string;
    region: string;
    confidence: number;
    characteristics: string[];
  };
  parameterAnalysis: Record<string, any>;
  alternativeMatches: Array<{ id: string; name: string; type: string; confidence: number }>;
}

interface SpectraMatchWidgetProps {
  onIdentify?: (result: SpectraMatchResult) => void;
  onSaveToLoad?: (crudeId: string, confidence: number) => void;
  loadId?: string;
  compact?: boolean;
  showSaveButton?: boolean;
  defaultApiGravity?: number;
  defaultBsw?: number;
  className?: string;
}

export default function SpectraMatchWidget({
  onIdentify,
  onSaveToLoad,
  loadId,
  compact = false,
  showSaveButton = true,
  defaultApiGravity = 39.6,
  defaultBsw = 0.3,
  className,
}: SpectraMatchWidgetProps) {
  const [apiGravity, setApiGravity] = useState(defaultApiGravity);
  const [bsw, setBsw] = useState(defaultBsw);
  const [expanded, setExpanded] = useState(!compact);

  const identifyMutation = (trpc as any).spectraMatch.identify.useMutation({
    onSuccess: (data: SpectraMatchResult) => {
      onIdentify?.(data);
      toast.success(`Identified: ${data.primaryMatch.name} (${data.primaryMatch.confidence}% confidence)`);
    },
  });

  const saveToRunTicketMutation = (trpc as any).spectraMatch.saveToRunTicket.useMutation({
    onSuccess: () => {
      toast.success("SpectraMatch result saved to load");
    },
  });

  const handleIdentify = () => {
    identifyMutation.mutate({ apiGravity, bsw });
  };

  const handleSave = () => {
    if (!identifyMutation.data || !loadId) return;
    if (onSaveToLoad) {
      onSaveToLoad(identifyMutation.data.primaryMatch.id, identifyMutation.data.primaryMatch.confidence);
    } else {
      saveToRunTicketMutation.mutate({
        loadId,
        crudeId: identifyMutation.data.primaryMatch.id,
        confidence: identifyMutation.data.primaryMatch.confidence,
        parameters: { apiGravity, bsw },
      });
    }
  };

  const result = identifyMutation.data as SpectraMatchResult | undefined;

  return (
    <Card className={cn("bg-slate-900/50 border-slate-700/50 overflow-hidden", className)}>
      {/* Gradient top bar */}
      <div className="h-1 bg-gradient-to-r from-cyan-500 to-purple-500" />

      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2 text-sm">
            <div className="p-1.5 rounded bg-gradient-to-r from-cyan-500/20 to-purple-500/20">
              <Activity className="w-4 h-4 text-purple-400" />
            </div>
            SPECTRA-MATCH™
            <Badge className="bg-purple-500/20 text-purple-400 border-0 text-[10px] px-1.5 py-0">
              <Sparkles className="w-2.5 h-2.5 mr-0.5" />
              AI
            </Badge>
          </CardTitle>
          {compact && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
              className="text-slate-400 hover:text-white h-7 w-7 p-0"
            >
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          )}
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="space-y-4 pt-0">
          {/* Parameters */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-slate-400 text-xs flex items-center gap-1">
                  <Droplets className="w-3 h-3 text-blue-400" />
                  API Gravity
                </Label>
                <span className="text-sm font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                  {apiGravity.toFixed(1)}°
                </span>
              </div>
              <Slider
                value={[apiGravity]}
                onValueChange={(v: any) => setApiGravity(v[0])}
                min={10}
                max={70}
                step={0.1}
                className="py-1"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-slate-400 text-xs flex items-center gap-1">
                  <Droplets className="w-3 h-3 text-amber-400" />
                  BS&W
                </Label>
                <span className="text-sm font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                  {bsw.toFixed(2)}%
                </span>
              </div>
              <Slider
                value={[bsw]}
                onValueChange={(v: any) => setBsw(v[0])}
                min={0}
                max={3}
                step={0.01}
                className="py-1"
              />
            </div>
          </div>

          {/* Identify Button */}
          <Button
            size="sm"
            className="w-full bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 h-8 text-xs"
            onClick={handleIdentify}
            disabled={identifyMutation.isPending}
          >
            {identifyMutation.isPending ? "Analyzing..." : (
              <>
                <Target className="w-3 h-3 mr-1.5" />
                Identify Crude Origin
              </>
            )}
          </Button>

          {/* Result */}
          {result && (
            <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-white font-semibold text-sm">{result.primaryMatch.name}</div>
                  <div className="text-xs text-slate-400">{result.primaryMatch.type} • {result.primaryMatch.region}</div>
                </div>
                <div className="text-right">
                  <div className={cn(
                    "text-2xl font-bold",
                    result.primaryMatch.confidence >= 90 ? "text-green-400" :
                    result.primaryMatch.confidence >= 75 ? "text-yellow-400" : "text-orange-400"
                  )}>
                    {result.primaryMatch.confidence}%
                  </div>
                  <div className="text-[10px] text-slate-500">Confidence</div>
                </div>
              </div>

              {/* Mini confidence bar */}
              <Progress value={result.primaryMatch.confidence} className="h-1.5" />

              {/* Characteristics */}
              <div className="flex flex-wrap gap-1">
                {result.primaryMatch.characteristics.slice(0, 3).map((c: string, i: number) => (
                  <Badge key={i} variant="outline" className="border-slate-600 text-slate-400 text-[10px] px-1.5 py-0">
                    {c}
                  </Badge>
                ))}
              </div>

              {/* Alternatives */}
              {result.alternativeMatches.length > 0 && (
                <div className="flex gap-2 overflow-x-auto">
                  {result.alternativeMatches.slice(0, 3).map((alt: any) => (
                    <div key={alt.id} className="flex-shrink-0 px-2 py-1 rounded bg-slate-800 text-[10px]">
                      <span className="text-slate-300">{alt.name.split(" ")[0]}</span>
                      <span className="text-cyan-400 ml-1">{alt.confidence}%</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Save button */}
              {showSaveButton && loadId && (
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full border-green-500/30 text-green-400 hover:bg-green-500/10 h-7 text-xs"
                  onClick={handleSave}
                  disabled={saveToRunTicketMutation.isPending}
                >
                  <Save className="w-3 h-3 mr-1" />
                  {saveToRunTicketMutation.isPending ? "Saving..." : "Save to Load"}
                </Button>
              )}
            </div>
          )}
        </CardContent>
      )}

      {/* Compact collapsed state */}
      {compact && !expanded && result && (
        <CardContent className="pt-0 pb-3">
          <div className="flex items-center justify-between">
            <span className="text-white text-sm font-medium">{result.primaryMatch.name}</span>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-3.5 h-3.5 text-green-400" />
              <span className="text-green-400 font-bold text-sm">{result.primaryMatch.confidence}%</span>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
