/**
 * EMERGENCY SUPPLY IMPACT ANALYSIS — Model disruption scenarios
 * Calculates supply shortfall, tanker loads needed, drivers needed,
 * price impact, station outages, and panic buying risk.
 * 
 * NO MOCK DATA - All data from tRPC queries
 */

import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'wouter';
import {
  ArrowLeft, BarChart3, AlertTriangle, Truck, Users, Fuel, TrendingUp,
  MapPin, Clock, Activity, Zap, Shield, Flame, Info
} from 'lucide-react';

export default function EmergencySupplyAnalysis() {
  const [pipelineId, setPipelineId] = useState('colonial');
  const [supplyReduction, setSupplyReduction] = useState(45);
  const [customStates, setCustomStates] = useState('');
  const [runAnalysis, setRunAnalysis] = useState(false);

  const pipelineQuery = (trpc as any).emergencyResponse.getPipelineCorridorData.useQuery();

  const analysisQuery = (trpc as any).emergencyResponse.getSupplyImpactAnalysis.useQuery(
    {
      pipelineId,
      supplyReductionPercent: supplyReduction,
      affectedStates: customStates ? customStates.split(',').map((s: string) => s.trim()).filter(Boolean) : undefined,
    },
    { enabled: runAnalysis }
  );

  const analysis = analysisQuery.data;

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/emergency/command-center">
          <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-blue-400" />
            Supply Impact Analysis
          </h1>
          <p className="text-slate-400 text-sm">Model fuel disruption scenarios and mobilization requirements</p>
        </div>
      </div>

      {/* Scenario Builder */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader>
          <CardTitle className="text-slate-200 flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-400" />
            Scenario Parameters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Pipeline System</Label>
              <Select value={pipelineId} onValueChange={setPipelineId}>
                <SelectTrigger className="bg-slate-800 border-slate-700"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {pipelineQuery.data?.allPipelines?.map((p: any) => (
                    <SelectItem key={p.id} value={p.id}>{p.name} ({(p.bpd / 1000000).toFixed(1)}M bbl/day)</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Supply Reduction (%)</Label>
              <Input type="number" min={5} max={100} value={supplyReduction} onChange={e => setSupplyReduction(Number(e.target.value))} className="bg-slate-800 border-slate-700" />
            </div>
            <div>
              <Label>Custom States (optional, comma-sep)</Label>
              <Input placeholder="GA, SC, NC, VA" value={customStates} onChange={e => setCustomStates(e.target.value)} className="bg-slate-800 border-slate-700" />
            </div>
          </div>
          <Button onClick={() => setRunAnalysis(true)} className="mt-4 bg-blue-600 hover:bg-blue-700">
            <BarChart3 className="w-4 h-4 mr-2" />
            Run Analysis
          </Button>
        </CardContent>
      </Card>

      {/* Analysis Results */}
      {analysisQuery.isLoading && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(8)].map((_: any, i: number) => <Skeleton key={i} className="h-28" />)}
        </div>
      )}

      {analysis && (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-red-900/20 border-red-500/30 rounded-xl">
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-red-500/20"><Flame className="w-5 h-5 text-red-400" /></div>
                  <div>
                    <p className="text-lg font-bold text-red-400">{analysis.analysis?.supplyShortfall}</p>
                    <p className="text-xs text-slate-400">Supply Shortfall</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-orange-900/20 border-orange-500/30 rounded-xl">
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-orange-500/20"><Truck className="w-5 h-5 text-orange-400" /></div>
                  <div>
                    <p className="text-lg font-bold text-orange-400">{analysis.analysis?.tankerLoadsNeeded?.toLocaleString()}</p>
                    <p className="text-xs text-slate-400">Tanker Loads/Day</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-blue-900/20 border-blue-500/30 rounded-xl">
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-blue-500/20"><Users className="w-5 h-5 text-blue-400" /></div>
                  <div>
                    <p className="text-lg font-bold text-blue-400">{analysis.analysis?.driversNeeded?.toLocaleString()}</p>
                    <p className="text-xs text-slate-400">Drivers Needed</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-green-900/20 border-green-500/30 rounded-xl">
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-green-500/20"><TrendingUp className="w-5 h-5 text-green-400" /></div>
                  <div>
                    <p className="text-lg font-bold text-green-400">{analysis.analysis?.estimatedPriceImpact}</p>
                    <p className="text-xs text-slate-400">Price Impact</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Analysis */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Impact Assessment */}
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardHeader>
                <CardTitle className="text-slate-200 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-400" />
                  Impact Assessment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { label: 'Normal Daily Consumption', value: analysis.analysis?.normalDailyConsumption },
                  { label: 'Supply Shortfall', value: analysis.analysis?.supplyShortfall },
                  { label: 'Panic Buying Risk', value: analysis.analysis?.panicBuyingRisk },
                  { label: 'Station Outage Estimate', value: analysis.analysis?.estimatedStationOutages },
                  { label: 'Time to Empty Stations', value: analysis.analysis?.timeToEmptyStations },
                  { label: 'Price Impact', value: analysis.analysis?.estimatedPriceImpact },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-slate-700/30 last:border-0">
                    <span className="text-sm text-slate-400">{item.label}</span>
                    <span className={`text-sm font-medium ${
                      String(item.value).includes('HIGH') || String(item.value).includes('87%') ? 'text-red-400' :
                      String(item.value).includes('MODERATE') ? 'text-yellow-400' : 'text-slate-200'
                    }`}>{item.value}</span>
                  </div>
                ))}
                <div className="mt-2">
                  <p className="text-xs text-slate-500">Affected States</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {analysis.affectedStates?.map((st: string) => (
                      <Badge key={st} variant="outline" className="text-xs">{st}</Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Mobilization Recommendation */}
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardHeader>
                <CardTitle className="text-slate-200 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-blue-400" />
                  Mobilization Recommendation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 rounded-lg bg-red-900/20 border border-red-500/20">
                  <p className="text-sm font-bold text-red-400">{analysis.recommendation?.mobilizationType}</p>
                </div>
                {[
                  { label: 'Suggested Surge Pay', value: `${analysis.recommendation?.suggestedSurgePay}x`, icon: Zap },
                  { label: 'HOS Waiver Recommended', value: analysis.recommendation?.hosWaiverRecommended ? 'YES' : 'No', icon: Clock },
                  { label: 'Est. Drivers Available (30%)', value: Math.round(analysis.recommendation?.estimatedDriversAvailable || 0).toLocaleString(), icon: Users },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-slate-700/30 last:border-0">
                    <span className="text-sm text-slate-400 flex items-center gap-2"><item.icon className="w-4 h-4" />{item.label}</span>
                    <span className={`text-sm font-medium ${item.value === 'YES' ? 'text-green-400' : 'text-slate-200'}`}>{item.value}</span>
                  </div>
                ))}

                {/* Zone Suggestions */}
                <div className="mt-3">
                  <p className="text-xs text-slate-500 mb-2">Suggested Zones by State</p>
                  <div className="space-y-1">
                    {analysis.recommendation?.suggestedZones?.slice(0, 8).map((zone: any, i: number) => (
                      <div key={i} className="flex items-center justify-between py-1.5 px-2 rounded bg-slate-800/70">
                        <span className="text-xs text-slate-300 flex items-center gap-1"><MapPin className="w-3 h-3" />{zone.state}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-400">{zone.driversNeeded} drivers</span>
                          <Badge className={zone.priority === 'CRITICAL' ? 'bg-red-500/20 text-red-400 text-xs' : 'bg-orange-500/20 text-orange-400 text-xs'}>{zone.priority}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Historical Reference */}
          {analysis.historicalReference && (
            <Card className="bg-gradient-to-r from-slate-800/80 to-red-900/20 border-slate-700/50 rounded-xl">
              <CardHeader>
                <CardTitle className="text-slate-200 flex items-center gap-2">
                  <Info className="w-5 h-5 text-blue-400" />
                  Historical Reference
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {[
                    { label: 'Event', value: analysis.historicalReference.event },
                    { label: 'Supply Reduction', value: analysis.historicalReference.supplyReduction },
                    { label: 'Duration', value: analysis.historicalReference.duration },
                    { label: 'Station Outages', value: analysis.historicalReference.stationOutages },
                    { label: 'Price Impact', value: analysis.historicalReference.priceImpact },
                    { label: 'Presidential Action', value: analysis.historicalReference.presidentialAction },
                  ].map((item, i) => (
                    <div key={i} className="p-3 rounded-lg bg-slate-800/50">
                      <p className="text-xs text-slate-500">{item.label}</p>
                      <p className="text-sm text-slate-200 mt-1">{item.value}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 p-3 rounded-lg bg-blue-900/20 border border-blue-500/20">
                  <p className="text-sm text-blue-300 italic">{analysis.historicalReference.lesson}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
