/**
 * SPECTRA-MATCH™ Oil Identification Page
 * Multi-Modal Adaptive Crude Oil Identification System
 * 
 * For Terminal Managers and Drivers to identify crude oil origin
 * using API Gravity, BS&W, Boiling Point, and Sulfur Content
 * 
 * 100% Dynamic - Uses tRPC queries
 */

import React, { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import {
  Droplets,
  Thermometer,
  Activity,
  CheckCircle,
  AlertTriangle,
  Beaker,
  Target,
  Save,
  RotateCcw,
  ChevronRight,
  Sparkles,
  MapPin,
  Clock,
  FileText,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function SpectraMatch() {
  // Input state
  const [apiGravity, setApiGravity] = useState<number>(39.6);
  const [bsw, setBsw] = useState<number>(0.3);
  const [boilingPoint, setBoilingPoint] = useState<number | undefined>(180);
  const [sulfur, setSulfur] = useState<number | undefined>(0.24);
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  // Queries
  const crudeTypesQuery = trpc.spectraMatch.getCrudeTypes.useQuery();
  const historyQuery = trpc.spectraMatch.getHistory.useQuery({ limit: 5 });
  
  // Mutations
  const identifyMutation = trpc.spectraMatch.identify.useMutation();
  const saveToRunTicketMutation = trpc.spectraMatch.saveToRunTicket.useMutation();

  const handleIdentify = () => {
    identifyMutation.mutate({
      apiGravity,
      bsw,
      boilingPoint,
      sulfur,
    });
  };

  const handleReset = () => {
    setApiGravity(39.6);
    setBsw(0.3);
    setBoilingPoint(180);
    setSulfur(0.24);
  };

  const handleSaveToRunTicket = () => {
    if (!identifyMutation.data) return;
    
    saveToRunTicketMutation.mutate({
      loadId: `LD-${Date.now()}`,
      crudeId: identifyMutation.data.primaryMatch.id,
      confidence: identifyMutation.data.primaryMatch.confidence,
      parameters: {
        apiGravity,
        bsw,
        boilingPoint,
        sulfur,
      },
    });
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return "text-green-400";
    if (confidence >= 75) return "text-yellow-400";
    return "text-orange-400";
  };

  const getAccuracyColor = (accuracy: string) => {
    switch (accuracy) {
      case "Very High": return "bg-green-500/20 text-green-400";
      case "High": return "bg-emerald-500/20 text-emerald-400";
      case "Good": return "bg-yellow-500/20 text-yellow-400";
      default: return "bg-orange-500/20 text-orange-400";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-gradient-to-r from-cyan-500 to-purple-500">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
              SPECTRA-MATCH™
            </h1>
            <p className="text-slate-400 text-sm">Multi-Modal Crude Oil Identification</p>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-3">
          <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
            <Sparkles className="w-3 h-3 mr-1" />
            ESANG AI™ Powered
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Input Parameters */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="bg-slate-900/50 border-slate-700/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-white flex items-center gap-2">
                <Beaker className="w-5 h-5 text-cyan-400" />
                Sample Parameters
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* API Gravity */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-slate-300 flex items-center gap-2">
                    <Droplets className="w-4 h-4 text-blue-400" />
                    API Gravity
                  </Label>
                  <span className="text-lg font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                    {apiGravity.toFixed(1)}°
                  </span>
                </div>
                <Slider
                  value={[apiGravity]}
                  onValueChange={(v) => setApiGravity(v[0])}
                  min={10}
                  max={70}
                  step={0.1}
                  className="py-2"
                />
                <p className="text-xs text-slate-500">Range: 10° (heavy) to 70° (condensate)</p>
              </div>

              {/* BS&W */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-slate-300 flex items-center gap-2">
                    <Droplets className="w-4 h-4 text-amber-400" />
                    BS&W (Basic Sediment & Water)
                  </Label>
                  <span className="text-lg font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                    {bsw.toFixed(2)}%
                  </span>
                </div>
                <Slider
                  value={[bsw]}
                  onValueChange={(v) => setBsw(v[0])}
                  min={0}
                  max={3}
                  step={0.01}
                  className="py-2"
                />
                <p className="text-xs text-slate-500">Water and sediment content percentage</p>
              </div>

              {/* Advanced Parameters Toggle */}
              <Button
                variant="ghost"
                className="w-full text-slate-400 hover:text-white"
                onClick={() => setShowAdvanced(!showAdvanced)}
              >
                {showAdvanced ? "Hide" : "Show"} Advanced Parameters
                <ChevronRight className={cn("w-4 h-4 ml-2 transition-transform", showAdvanced && "rotate-90")} />
              </Button>

              {showAdvanced && (
                <>
                  {/* Boiling Point */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-slate-300 flex items-center gap-2">
                        <Thermometer className="w-4 h-4 text-red-400" />
                        Boiling Point
                      </Label>
                      <span className="text-lg font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                        {boilingPoint}°C
                      </span>
                    </div>
                    <Slider
                      value={[boilingPoint || 180]}
                      onValueChange={(v) => setBoilingPoint(v[0])}
                      min={50}
                      max={500}
                      step={5}
                      className="py-2"
                    />
                  </div>

                  {/* Sulfur Content */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-slate-300 flex items-center gap-2">
                        <Activity className="w-4 h-4 text-yellow-400" />
                        Sulfur Content
                      </Label>
                      <span className="text-lg font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                        {sulfur?.toFixed(2)}%
                      </span>
                    </div>
                    <Slider
                      value={[sulfur || 0.24]}
                      onValueChange={(v) => setSulfur(v[0])}
                      min={0}
                      max={5}
                      step={0.01}
                      className="py-2"
                    />
                  </div>
                </>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  className="flex-1 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600"
                  onClick={handleIdentify}
                  disabled={identifyMutation.isPending}
                >
                  {identifyMutation.isPending ? (
                    <>Analyzing...</>
                  ) : (
                    <>
                      <Target className="w-4 h-4 mr-2" />
                      Identify Origin
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={handleReset} className="border-slate-600">
                  <RotateCcw className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Recent History */}
          <Card className="bg-slate-900/50 border-slate-700/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-white flex items-center gap-2 text-base">
                <Clock className="w-4 h-4 text-slate-400" />
                Recent Identifications
              </CardTitle>
            </CardHeader>
            <CardContent>
              {historyQuery.isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : (
                <div className="space-y-2">
                  {historyQuery.data?.identifications.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/30"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-white text-sm font-medium">{item.crudeType}</span>
                        <Badge className="bg-green-500/20 text-green-400 text-xs">
                          {item.confidence}%
                        </Badge>
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        API: {item.apiGravity}° | BS&W: {item.bsw}%
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Results Section */}
        <div className="lg:col-span-2 space-y-6">
          {identifyMutation.data ? (
            <>
              {/* Primary Match */}
              <Card className="bg-slate-900/50 border-slate-700/50 overflow-hidden">
                <div className="h-1 bg-gradient-to-r from-cyan-500 to-purple-500" />
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <h2 className="text-2xl font-bold text-white mb-2">
                        {identifyMutation.data.primaryMatch.name}
                      </h2>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-purple-500/20 text-purple-400">
                          {identifyMutation.data.primaryMatch.type}
                        </Badge>
                        <span className="text-slate-400 text-sm flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {identifyMutation.data.primaryMatch.region}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={cn("text-4xl font-bold", getConfidenceColor(identifyMutation.data.primaryMatch.confidence))}>
                        {identifyMutation.data.primaryMatch.confidence}%
                      </div>
                      <div className="text-slate-400 text-sm">Match Confidence</div>
                    </div>
                  </div>

                  {/* Confidence Ring */}
                  <div className="flex justify-center mb-6">
                    <div className="relative w-40 h-40">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle
                          cx="80"
                          cy="80"
                          r="70"
                          fill="none"
                          stroke="rgba(100,100,100,0.2)"
                          strokeWidth="10"
                        />
                        <circle
                          cx="80"
                          cy="80"
                          r="70"
                          fill="none"
                          stroke="url(#gradient)"
                          strokeWidth="10"
                          strokeLinecap="round"
                          strokeDasharray={`${(identifyMutation.data.primaryMatch.confidence / 100) * 440} 440`}
                        />
                        <defs>
                          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#06b6d4" />
                            <stop offset="100%" stopColor="#a855f7" />
                          </linearGradient>
                        </defs>
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-1" />
                          <span className="text-white text-sm">Verified</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Characteristics */}
                  <div className="flex flex-wrap gap-2 justify-center">
                    {identifyMutation.data.primaryMatch.characteristics.map((char, i) => (
                      <Badge key={i} variant="outline" className="border-slate-600 text-slate-300">
                        {char}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Parameter Analysis */}
              <Card className="bg-slate-900/50 border-slate-700/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-white">Adaptive Parameter Analysis</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {Object.entries(identifyMutation.data.parameterAnalysis).map(([key, param]) => (
                    <div key={key} className="p-4 rounded-lg bg-slate-800/30 border border-slate-700/30">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-slate-300 capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                        <span className="text-lg font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                          {param.value}{(param as any).weightUnit || param.unit}
                        </span>
                      </div>
                      <Progress value={param.score} className="h-2 mb-2" />
                      <div className="flex items-center justify-between text-xs">
                        <Badge className={getAccuracyColor(param.accuracy)}>
                          {param.accuracy}
                        </Badge>
                        <span className="text-purple-400">Weight: {param.weight}</span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Alternative Matches */}
              <Card className="bg-slate-900/50 border-slate-700/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-white">Alternative Matches</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {identifyMutation.data.alternativeMatches.map((match) => (
                      <div
                        key={match.id}
                        className="p-4 rounded-lg bg-slate-800/30 border border-slate-700/30 text-center"
                      >
                        <div className="text-white font-medium mb-1">{match.name.split(' ')[0]}</div>
                        <div className="text-2xl font-bold text-cyan-400 mb-1">{match.confidence}%</div>
                        <div className="text-xs text-slate-500">{match.type}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                  onClick={handleSaveToRunTicket}
                  disabled={saveToRunTicketMutation.isPending}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {saveToRunTicketMutation.isPending ? "Saving..." : "Confirm & Save to Run Ticket"}
                </Button>
                <Button variant="outline" className="border-slate-600 text-slate-300">
                  <FileText className="w-4 h-4 mr-2" />
                  Generate BOL
                </Button>
              </div>
            </>
          ) : (
            /* Empty State */
            <Card className="bg-slate-900/50 border-slate-700/50">
              <CardContent className="py-16 text-center">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-r from-cyan-500/20 to-purple-500/20 flex items-center justify-center">
                  <Activity className="w-10 h-10 text-purple-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  Enter Sample Parameters
                </h3>
                <p className="text-slate-400 max-w-md mx-auto mb-6">
                  Input the crude oil sample parameters (API Gravity, BS&W, etc.) and click
                  "Identify Origin" to determine the most likely crude oil source.
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  <Badge variant="outline" className="border-slate-600 text-slate-400">
                    API Gravity
                  </Badge>
                  <Badge variant="outline" className="border-slate-600 text-slate-400">
                    BS&W
                  </Badge>
                  <Badge variant="outline" className="border-slate-600 text-slate-400">
                    Boiling Point
                  </Badge>
                  <Badge variant="outline" className="border-slate-600 text-slate-400">
                    Sulfur Content
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Crude Oil Database Reference */}
          <Card className="bg-slate-900/50 border-slate-700/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-base">Known Crude Oil Types</CardTitle>
            </CardHeader>
            <CardContent>
              {crudeTypesQuery.isLoading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {[...Array(6)].map((_, i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {crudeTypesQuery.data?.slice(0, 6).map((crude) => (
                    <div
                      key={crude.id}
                      className="p-3 rounded-lg bg-slate-800/30 border border-slate-700/30"
                    >
                      <div className="text-white text-sm font-medium mb-1">{crude.name}</div>
                      <div className="text-xs text-slate-500">{crude.type}</div>
                      <div className="text-xs text-cyan-400 mt-1">{crude.apiGravityRange}</div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
