/**
 * SPECTRA-MATCH™ Oil Identification Page
 * Multi-Modal Adaptive Crude Oil Identification System
 * 
 * For Terminal Managers and Drivers to identify crude oil origin
 * using API Gravity, BS&W, Boiling Point, and Sulfur Content
 * 
 * 100% Dynamic - Uses tRPC queries
 * Theme-aware | Jony Ive design | Platform standard
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
import { Textarea } from '@/components/ui/textarea';
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
  MapPin,
  Clock,
  FileText,
  Brain,
  Flame,
  TrendingUp,
  MessageSquare,
  Send,
  Shield,
  BarChart3,
  Loader2,
} from 'lucide-react';
import { EsangIcon } from '@/components/EsangIcon';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useTheme } from '@/contexts/ThemeContext';

export default function SpectraMatch() {
  const { theme } = useTheme();
  const isLight = theme === "light";

  const [apiGravity, setApiGravity] = useState<number>(39.6);
  const [bsw, setBsw] = useState<number>(0.3);
  const [boilingPoint, setBoilingPoint] = useState<number | undefined>(180);
  const [sulfur, setSulfur] = useState<number | undefined>(0.24);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [aiQuestion, setAiQuestion] = useState("");
  const [aiResponse, setAiResponse] = useState<string | null>(null);

  const crudeTypesQuery = (trpc as any).spectraMatch.getCrudeTypes.useQuery();
  const historyQuery = (trpc as any).spectraMatch.getHistory.useQuery({ limit: 5 });
  const learningStatsQuery = (trpc as any).spectraMatch.getLearningStats.useQuery();

  const identifyMutation = (trpc as any).spectraMatch.identify.useMutation({
    onSuccess: (data: any) => {
      if (data.esangVerified) {
        toast.success("ESANG AI verified identification");
      }
    },
  });
  const saveToRunTicketMutation = (trpc as any).spectraMatch.saveToRunTicket.useMutation();
  const askAIMutation = (trpc as any).spectraMatch.askAboutProduct.useMutation({
    onSuccess: (data: any) => {
      setAiResponse(data.message);
    },
  });

  const handleIdentify = () => {
    identifyMutation.mutate({ apiGravity, bsw, boilingPoint, sulfur });
  };

  const handleAskAI = () => {
    if (!aiQuestion.trim()) return;
    askAIMutation.mutate({ question: aiQuestion, productName: identifyMutation.data?.primaryMatch?.name });
    setAiQuestion("");
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
      parameters: { apiGravity, bsw, boilingPoint, sulfur },
    });
  };

  const getConfidenceColor = (c: number) =>
    c >= 90 ? (isLight ? "text-emerald-600" : "text-green-400") :
    c >= 75 ? (isLight ? "text-amber-600" : "text-yellow-400") :
    (isLight ? "text-orange-600" : "text-orange-400");

  const getAccuracyBadge = (a: string) => {
    const m: Record<string, string> = {
      "Very High": isLight ? "bg-emerald-100 text-emerald-700 border-emerald-200" : "bg-green-500/20 text-green-400 border-green-500/30",
      "High": isLight ? "bg-blue-100 text-blue-700 border-blue-200" : "bg-blue-500/20 text-blue-400 border-blue-500/30",
      "Good": isLight ? "bg-amber-100 text-amber-700 border-amber-200" : "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    };
    return m[a] || (isLight ? "bg-orange-100 text-orange-700 border-orange-200" : "bg-orange-500/20 text-orange-400 border-orange-500/30");
  };

  // Theme classes
  const cardCls = cn("rounded-2xl border", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/60 border-slate-700/50");
  const titleCls = cn("text-lg font-semibold", isLight ? "text-slate-800" : "text-white");
  const subtextCls = cn("text-sm", isLight ? "text-slate-500" : "text-slate-400");
  const cellCls = cn("p-4 rounded-xl border", isLight ? "bg-slate-50 border-slate-200" : "bg-slate-800/50 border-slate-700/30");
  const labelCls = cn("flex items-center gap-2 text-sm font-medium", isLight ? "text-slate-700" : "text-slate-300");
  const valCls = cn("text-lg font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent");

  const result = identifyMutation.data;

  // Integration-powered: auto-detect products from connected TAS
  const catalogQ = (trpc as any).spectraMatch?.getTerminalProductCatalog?.useQuery?.(undefined, { staleTime: 60000 }) || { data: null };
  const autoIdMut = (trpc as any).spectraMatch?.autoIdentifyFromTerminal?.useMutation?.({
    onSuccess: (data: any) => {
      if (data?.matched && data.suggestedParams) {
        setApiGravity(data.suggestedParams.apiGravity || 39.6);
        setBsw(data.suggestedParams.bsw || 0.3);
        if (data.suggestedParams.sulfur) setSulfur(data.suggestedParams.sulfur);
        toast.success(`Auto-populated specs for ${data.crudeName}`, { description: `${data.confidence}% match from TAS inventory` });
      }
    },
  }) || { mutate: () => {}, isPending: false };

  const catalog = catalogQ.data as any;
  const hasTAS = catalog?.connected && catalog?.products?.length > 0;

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1200px] mx-auto">

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">SPECTRA-MATCH</h1>
          <p className={subtextCls}>Multi-modal adaptive crude oil identification</p>
        </div>
        <div className="flex items-center gap-2">
          {hasTAS && (
            <Badge className={cn("text-xs border", isLight ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20")}>
              <Activity className="w-3 h-3 mr-1" />{catalog.providerLabel} Connected
            </Badge>
          )}
          <Badge className="bg-gradient-to-r from-[#BE01FF] to-[#1473FF] text-white border-0 text-xs">
            <EsangIcon className="w-3 h-3 mr-1" />ESANG AI Powered
          </Badge>
        </div>
      </div>

      {/* ═══ TAS PRODUCT CATALOG — Auto-populate from connected integrations ═══ */}
      {hasTAS && (
        <div className={cn("rounded-2xl border p-4", isLight ? "bg-blue-50/50 border-blue-200/60" : "bg-blue-500/[0.04] border-blue-500/10")}>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#1473FF]/20 to-[#BE01FF]/20 flex items-center justify-center">
              <Target className="w-4 h-4 text-[#1473FF]" />
            </div>
            <div>
              <p className={cn("text-sm font-semibold", isLight ? "text-slate-800" : "text-white")}>
                Auto-Detect from {catalog.providerLabel}
              </p>
              <p className={cn("text-[10px]", isLight ? "text-slate-500" : "text-white/40")}>
                Click a product to auto-populate SpectraMatch parameters
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {(catalog.products as any[]).map((p: any) => (
              <button
                key={p.name}
                onClick={() => autoIdMut.mutate({ productName: p.name })}
                disabled={autoIdMut.isPending}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                  p.spectraMatchReady
                    ? isLight
                      ? "bg-white border border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300"
                      : "bg-white/[0.06] border border-blue-500/20 text-blue-400 hover:bg-blue-500/10"
                    : isLight
                      ? "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                      : "bg-white/[0.04] border border-white/[0.06] text-white/50 hover:bg-white/[0.08]"
                )}
              >
                {p.spectraMatchReady && <Activity className="w-3 h-3" />}
                {p.name}
                {p.percentFull != null && (
                  <span className={cn("text-[9px] px-1.5 py-0.5 rounded-md",
                    p.percentFull > 60 ? "bg-emerald-500/10 text-emerald-500" : p.percentFull > 20 ? "bg-amber-500/10 text-amber-500" : "bg-red-500/10 text-red-500"
                  )}>
                    {p.percentFull}%
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Left: Input Panel ── */}
        <div className="lg:col-span-1 space-y-6">
          <Card className={cardCls}>
            <CardHeader className="pb-3">
              <CardTitle className={cn("flex items-center gap-2", titleCls)}>
                <Beaker className="w-5 h-5 text-blue-500" />
                Sample Parameters
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* API Gravity */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className={labelCls}><Droplets className="w-4 h-4 text-blue-500" />API Gravity</Label>
                  <span className={valCls}>{apiGravity.toFixed(1)}</span>
                </div>
                <Slider value={[apiGravity]} onValueChange={(v: any) => setApiGravity(v[0])} min={10} max={70} step={0.1} className="py-2" />
                <p className={cn("text-xs", isLight ? "text-slate-400" : "text-slate-500")}>10 (heavy) to 70 (condensate)</p>
              </div>

              {/* BS&W */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className={labelCls}><Droplets className="w-4 h-4 text-amber-500" />BS&W</Label>
                  <span className={valCls}>{bsw.toFixed(2)}%</span>
                </div>
                <Slider value={[bsw]} onValueChange={(v: any) => setBsw(v[0])} min={0} max={3} step={0.01} className="py-2" />
                <p className={cn("text-xs", isLight ? "text-slate-400" : "text-slate-500")}>Basic Sediment & Water content</p>
              </div>

              {/* Advanced Toggle */}
              <button
                className={cn("w-full text-center text-xs font-medium py-2 rounded-lg transition-colors", isLight ? "text-slate-500 hover:bg-slate-100" : "text-slate-400 hover:bg-slate-700/30")}
                onClick={() => setShowAdvanced(!showAdvanced)}
              >
                {showAdvanced ? "Hide" : "Show"} Advanced
                <ChevronRight className={cn("w-3.5 h-3.5 ml-1 inline transition-transform", showAdvanced && "rotate-90")} />
              </button>

              {showAdvanced && (
                <div className="space-y-6">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className={labelCls}><Thermometer className="w-4 h-4 text-red-500" />Boiling Point</Label>
                      <span className={valCls}>{boilingPoint}°C</span>
                    </div>
                    <Slider value={[boilingPoint || 180]} onValueChange={(v: any) => setBoilingPoint(v[0])} min={50} max={500} step={5} className="py-2" />
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className={labelCls}><Activity className="w-4 h-4 text-yellow-500" />Sulfur Content</Label>
                      <span className={valCls}>{sulfur?.toFixed(2)}%</span>
                    </div>
                    <Slider value={[sulfur || 0.24]} onValueChange={(v: any) => setSulfur(v[0])} min={0} max={5} step={0.01} className="py-2" />
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <Button className="flex-1 bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white rounded-xl font-bold" onClick={handleIdentify} disabled={identifyMutation.isPending}>
                  {identifyMutation.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Analyzing...</> : <><Target className="w-4 h-4 mr-2" />Identify Origin</>}
                </Button>
                <Button variant="outline" onClick={handleReset} className={cn("rounded-xl", isLight ? "border-slate-200" : "border-slate-600")}>
                  <RotateCcw className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Recent History */}
          <Card className={cardCls}>
            <CardHeader className="pb-3">
              <CardTitle className={cn("flex items-center gap-2 text-base", isLight ? "text-slate-800" : "text-white")}>
                <Clock className="w-4 h-4 text-slate-400" />Recent Identifications
              </CardTitle>
            </CardHeader>
            <CardContent>
              {historyQuery.isLoading ? (
                <div className="space-y-2"><Skeleton className={cn("h-12 w-full rounded-lg", isLight ? "bg-slate-100" : "")} /><Skeleton className={cn("h-12 w-full rounded-lg", isLight ? "bg-slate-100" : "")} /></div>
              ) : (
                <div className="space-y-2">
                  {(historyQuery.data as any)?.identifications.map((item: any) => (
                    <div key={item.id} className={cellCls}>
                      <div className="flex items-center justify-between">
                        <span className={cn("text-sm font-medium", isLight ? "text-slate-800" : "text-white")}>{item.crudeType}</span>
                        <Badge className={cn("text-xs font-bold border", isLight ? "bg-emerald-100 text-emerald-700 border-emerald-200" : "bg-green-500/20 text-green-400 border-green-500/30")}>{item.confidence}%</Badge>
                      </div>
                      <p className={cn("text-xs mt-1", isLight ? "text-slate-400" : "text-slate-500")}>API: {item.apiGravity} | BS&W: {item.bsw}%</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── Right: Results ── */}
        <div className="lg:col-span-2 space-y-6">
          {result ? (
            <>
              {/* Primary Match */}
              <Card className={cn("overflow-hidden", cardCls)}>
                <div className="h-1 bg-gradient-to-r from-[#1473FF] to-[#BE01FF]" />
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <h2 className={cn("text-2xl font-bold mb-2", isLight ? "text-slate-900" : "text-white")}>{result.primaryMatch.name}</h2>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-gradient-to-r from-[#1473FF]/15 to-[#BE01FF]/15 text-purple-600 dark:text-purple-400 border-0">{result.primaryMatch.type}</Badge>
                        <span className={cn("text-sm flex items-center gap-1", subtextCls)}><MapPin className="w-3 h-3" />{result.primaryMatch.region}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={cn("text-4xl font-bold tracking-tight", getConfidenceColor(result.primaryMatch.confidence))}>{result.primaryMatch.confidence}%</div>
                      <p className={cn("text-xs", subtextCls)}>Match Confidence</p>
                    </div>
                  </div>

                  {/* Confidence Ring */}
                  <div className="flex justify-center mb-6">
                    <div className="relative w-36 h-36">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160">
                        <circle cx="80" cy="80" r="68" fill="none" stroke={isLight ? "#e2e8f0" : "rgba(100,100,100,0.2)"} strokeWidth="8" />
                        <circle cx="80" cy="80" r="68" fill="none" stroke="url(#smGradient)" strokeWidth="8" strokeLinecap="round" strokeDasharray={`${(result.primaryMatch.confidence / 100) * 427} 427`} />
                        <defs><linearGradient id="smGradient" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#1473FF" /><stop offset="100%" stopColor="#BE01FF" /></linearGradient></defs>
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          <CheckCircle className={cn("w-7 h-7 mx-auto mb-1", isLight ? "text-emerald-500" : "text-green-400")} />
                          <span className={cn("text-xs font-medium", isLight ? "text-slate-600" : "text-white")}>Verified</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Characteristics */}
                  <div className="flex flex-wrap gap-2 justify-center">
                    {result.primaryMatch.characteristics.map((c: any, i: number) => (
                      <Badge key={i} variant="outline" className={cn("text-xs", isLight ? "border-slate-300 text-slate-600" : "border-slate-600 text-slate-300")}>{c}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Parameter Analysis */}
              <Card className={cardCls}>
                <CardHeader className="pb-3">
                  <CardTitle className={cn(isLight ? "text-slate-800" : "text-white")}>Adaptive Parameter Analysis</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {Object.entries(result.parameterAnalysis).map(([key, param]) => (
                    <div key={key} className={cellCls}>
                      <div className="flex items-center justify-between mb-3">
                        <span className={cn("capitalize text-sm", isLight ? "text-slate-700" : "text-slate-300")}>{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                        <span className={valCls}>{(param as any).value}{(param as any).weightUnit || (param as any).unit}</span>
                      </div>
                      <Progress value={(param as any).score} className="h-1.5 mb-2" />
                      <div className="flex items-center justify-between text-xs">
                        <Badge className={cn("border text-xs font-bold", getAccuracyBadge((param as any).accuracy))}>{(param as any).accuracy}</Badge>
                        <span className={cn("font-medium", isLight ? "text-purple-600" : "text-purple-400")}>Weight: {(param as any).weight}</span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Alternative Matches */}
              <Card className={cardCls}>
                <CardHeader className="pb-3">
                  <CardTitle className={cn(isLight ? "text-slate-800" : "text-white")}>Alternative Matches</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {result.alternativeMatches.map((match: any) => (
                      <div key={match.id} className={cn("text-center", cellCls)}>
                        <p className={cn("font-medium text-sm mb-1", isLight ? "text-slate-800" : "text-white")}>{match.name.split(' ')[0]}</p>
                        <p className="text-2xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">{match.confidence}%</p>
                        <p className={cn("text-xs mt-1", subtextCls)}>{match.type}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* ESANG AI Intelligence Panel */}
              {result?.esangAI && (
                <Card className={cn("border", isLight ? "bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200" : "bg-gradient-to-br from-purple-500/5 to-blue-500/5 border-purple-500/30")}>
                  <CardHeader className="pb-3">
                    <CardTitle className={cn("flex items-center gap-2", isLight ? "text-slate-800" : "text-white")}>
                      <Brain className="w-5 h-5 text-purple-500" />ESANG AI Intelligence
                      <Badge className="bg-gradient-to-r from-[#BE01FF] to-[#1473FF] text-white border-0 text-xs ml-auto">
                        <EsangIcon className="w-3 h-3 mr-1" />{result.esangAI.poweredBy}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* Reasoning */}
                    <div className={cn("p-4 rounded-xl border", isLight ? "bg-white border-slate-200" : "bg-slate-800/50 border-slate-700/30")}>
                      <div className="flex items-center gap-2 mb-2">
                        <Target className="w-4 h-4 text-blue-500" />
                        <span className={cn("text-sm font-semibold", isLight ? "text-slate-700" : "text-white")}>Reasoning</span>
                      </div>
                      <p className={cn("text-sm leading-relaxed", isLight ? "text-slate-600" : "text-slate-300")}>{result.esangAI.reasoning}</p>
                    </div>

                    {/* Safety Notes */}
                    {result.esangAI.safetyNotes?.length > 0 && (
                      <div className={cn("p-4 rounded-xl border", isLight ? "bg-amber-50 border-amber-200" : "bg-yellow-500/5 border-yellow-500/20")}>
                        <div className="flex items-center gap-2 mb-2">
                          <Shield className={cn("w-4 h-4", isLight ? "text-amber-600" : "text-yellow-400")} />
                          <span className={cn("text-sm font-semibold", isLight ? "text-amber-700" : "text-yellow-400")}>Safety Notes</span>
                        </div>
                        <div className="space-y-1.5">
                          {result.esangAI.safetyNotes.map((note: string, i: number) => (
                            <div key={i} className={cn("flex items-start gap-2 text-sm", isLight ? "text-slate-600" : "text-slate-300")}>
                              <Flame className={cn("w-3.5 h-3.5 mt-0.5 flex-shrink-0", isLight ? "text-orange-500" : "text-orange-400")} />
                              <span>{note}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Market Context */}
                    {result.esangAI.marketContext && (
                      <div className={cn("p-4 rounded-xl border", isLight ? "bg-white border-slate-200" : "bg-slate-800/50 border-slate-700/30")}>
                        <div className="flex items-center gap-2 mb-2">
                          <TrendingUp className={cn("w-4 h-4", isLight ? "text-emerald-600" : "text-green-400")} />
                          <span className={cn("text-sm font-semibold", isLight ? "text-slate-700" : "text-white")}>Market Context</span>
                        </div>
                        <p className={cn("text-sm", isLight ? "text-slate-600" : "text-slate-300")}>{result.esangAI.marketContext}</p>
                      </div>
                    )}

                    {/* Learning Insight */}
                    {result.esangAI.learningInsight && (
                      <div className={cn("p-4 rounded-xl border", isLight ? "bg-purple-50 border-purple-200" : "bg-purple-500/5 border-purple-500/20")}>
                        <div className="flex items-center gap-2 mb-2">
                          <Brain className={cn("w-4 h-4", isLight ? "text-purple-600" : "text-purple-400")} />
                          <span className={cn("text-sm font-semibold", isLight ? "text-purple-700" : "text-purple-400")}>Learning Insight</span>
                        </div>
                        <p className={cn("text-sm italic", isLight ? "text-slate-500" : "text-slate-400")}>{result.esangAI.learningInsight}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Ask ESANG AI */}
              <Card className={cardCls}>
                <CardHeader className="pb-3">
                  <CardTitle className={cn("flex items-center gap-2 text-base", isLight ? "text-slate-800" : "text-white")}>
                    <MessageSquare className="w-4 h-4 text-blue-500" />Ask ESANG AI About This Product
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex gap-2">
                    <Textarea
                      value={aiQuestion}
                      onChange={(e: any) => setAiQuestion(e.target.value)}
                      placeholder="Ask anything about this product..."
                      className={cn("min-h-[60px] resize-none rounded-xl", isLight ? "bg-slate-50 border-slate-200 text-slate-800" : "bg-slate-800/50 border-slate-700/50 text-white")}
                      onKeyDown={(e: any) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleAskAI())}
                    />
                    <Button className="bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white px-3 rounded-xl" onClick={handleAskAI} disabled={askAIMutation.isPending || !aiQuestion.trim()}>
                      {askAIMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </Button>
                  </div>
                  {aiResponse && (
                    <div className={cn("p-4 rounded-xl border", isLight ? "bg-purple-50 border-purple-200" : "bg-purple-500/5 border-purple-500/20")}>
                      <div className="flex items-center gap-2 mb-2">
                        <EsangIcon className="w-3.5 h-3.5 text-purple-500" />
                        <span className={cn("text-xs font-semibold", isLight ? "text-purple-700" : "text-purple-400")}>ESANG AI Response</span>
                      </div>
                      <p className={cn("text-sm leading-relaxed whitespace-pre-wrap", isLight ? "text-slate-600" : "text-slate-300")}>{aiResponse}</p>
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {["Safety handling procedures?", "DOT placard requirements?", "Compatible with other products?", "Current market pricing?"].map((q) => (
                      <Button key={q} variant="outline" size="sm" className={cn("text-xs h-7 rounded-lg", isLight ? "border-slate-200 text-slate-500 hover:bg-slate-50" : "border-slate-700 text-slate-400 hover:text-white")} onClick={() => setAiQuestion(q)}>
                        {q}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Actions */}
              <div className="flex gap-3">
                <Button className="flex-1 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-xl font-bold" onClick={handleSaveToRunTicket} disabled={saveToRunTicketMutation.isPending}>
                  <Save className="w-4 h-4 mr-2" />{saveToRunTicketMutation.isPending ? "Saving..." : "Confirm & Save to Run Ticket"}
                </Button>
                <Button variant="outline" className={cn("rounded-xl", isLight ? "border-slate-200 text-slate-600" : "border-slate-600 text-slate-300")}>
                  <FileText className="w-4 h-4 mr-2" />Generate BOL
                </Button>
              </div>
            </>
          ) : (
            /* Empty State */
            <Card className={cardCls}>
              <CardContent className="py-16 text-center">
                <div className={cn("w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center", isLight ? "bg-gradient-to-br from-blue-100 to-purple-100" : "bg-gradient-to-br from-[#1473FF]/20 to-[#BE01FF]/20")}>
                  <Activity className={cn("w-10 h-10", isLight ? "text-purple-500" : "text-purple-400")} />
                </div>
                <h3 className={cn("text-xl font-semibold mb-2", isLight ? "text-slate-800" : "text-white")}>Enter Sample Parameters</h3>
                <p className={cn("max-w-md mx-auto mb-6", subtextCls)}>
                  Input the crude oil sample parameters and click "Identify Origin" to determine the most likely crude oil source.
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {["API Gravity", "BS&W", "Boiling Point", "Sulfur Content"].map((p) => (
                    <Badge key={p} variant="outline" className={cn("text-xs", isLight ? "border-slate-300 text-slate-500" : "border-slate-600 text-slate-400")}>{p}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Learning Stats */}
          <Card className={cn("border", isLight ? "bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200" : "bg-gradient-to-br from-purple-500/5 to-blue-500/5 border-purple-500/30")}>
            <CardHeader className="pb-3">
              <CardTitle className={cn("flex items-center gap-2 text-base", isLight ? "text-slate-800" : "text-white")}>
                <BarChart3 className="w-4 h-4 text-purple-500" />SPECTRA-MATCH Learning Stats
                <Badge className="bg-gradient-to-r from-[#BE01FF] to-[#1473FF] text-white border-0 text-[10px] ml-auto"><EsangIcon className="w-2.5 h-2.5 mr-0.5" />ESANG AI</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {learningStatsQuery.isLoading ? (
                <div className="space-y-2"><Skeleton className={cn("h-16 w-full rounded-lg", isLight ? "bg-slate-100" : "")} /><Skeleton className={cn("h-16 w-full rounded-lg", isLight ? "bg-slate-100" : "")} /></div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: "Identifications", value: learningStatsQuery.data?.totalIdentifications || 0, color: "text-blue-500" },
                      { label: "Avg Confidence", value: `${learningStatsQuery.data?.avgConfidence || 0}%`, color: "" },
                      { label: "Trend", value: learningStatsQuery.data?.recentTrend === "Improving" ? "Up" : learningStatsQuery.data?.recentTrend === "Declining" ? "Down" : "--", color: learningStatsQuery.data?.recentTrend === "Improving" ? (isLight ? "text-emerald-600" : "text-green-400") : learningStatsQuery.data?.recentTrend === "Declining" ? "text-red-500" : (isLight ? "text-slate-400" : "text-yellow-400") },
                    ].map((s) => (
                      <div key={s.label} className={cn("p-3 rounded-xl text-center", isLight ? "bg-white border border-slate-200" : "bg-slate-800/50")}>
                        <p className={cn("text-2xl font-bold", s.color || "bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent")}>{s.value}</p>
                        <p className={cn("text-[10px]", subtextCls)}>{s.label}</p>
                      </div>
                    ))}
                  </div>
                  {learningStatsQuery.data?.topProducts?.length > 0 && (
                    <div>
                      <p className={cn("text-xs mb-2", subtextCls)}>Most Identified Products</p>
                      <div className="space-y-1">
                        {learningStatsQuery.data.topProducts.map((p: any) => (
                          <div key={p.product} className={cn("flex items-center justify-between p-2 rounded-lg", isLight ? "bg-white border border-slate-200" : "bg-slate-800/30")}>
                            <span className={cn("text-sm", isLight ? "text-slate-800" : "text-white")}>{p.product}</span>
                            <Badge className={cn("border-0 text-xs font-bold", isLight ? "bg-blue-100 text-blue-600" : "bg-cyan-500/20 text-cyan-400")}>{p.count}x</Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Crude Oil Database */}
          <Card className={cardCls}>
            <CardHeader className="pb-3">
              <CardTitle className={cn("text-base", isLight ? "text-slate-800" : "text-white")}>Known Crude Oil Types</CardTitle>
            </CardHeader>
            <CardContent>
              {crudeTypesQuery.isLoading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">{[...Array(6)].map((_: any, i: number) => <Skeleton key={i} className={cn("h-20 w-full rounded-lg", isLight ? "bg-slate-100" : "")} />)}</div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {(crudeTypesQuery.data as any)?.slice(0, 6).map((crude: any) => (
                    <div key={crude.id} className={cellCls}>
                      <p className={cn("text-sm font-medium mb-1", isLight ? "text-slate-800" : "text-white")}>{crude.name}</p>
                      <p className={cn("text-xs", subtextCls)}>{crude.type}</p>
                      <p className={cn("text-xs mt-1", isLight ? "text-blue-600" : "text-cyan-400")}>{crude.apiGravityRange}</p>
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
