/**
 * COLONIAL PIPELINE SCENARIO — Training & readiness simulation
 * Hour-by-hour breakdown of how EusoTrip would have responded to
 * the 2021 Colonial Pipeline ransomware attack.
 * 
 * NO MOCK DATA - All data from tRPC queries
 */

import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'wouter';
import {
  ArrowLeft, Flame, Shield, Clock, Users, Truck, Target,
  CheckCircle, AlertTriangle, Activity, Zap, Radio, Flag,
  Star, Award, Globe, Eye, TrendingUp, MapPin
} from 'lucide-react';

export default function EmergencyScenario() {
  const scenarioQuery = (trpc as any).emergencyResponse.getColonialPipelineScenario.useQuery();
  const data = scenarioQuery.data;

  if (scenarioQuery.isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4">{[...Array(6)].map((_: any, i: number) => <Skeleton key={i} className="h-48" />)}</div>
      </div>
    );
  }

  const phases = [
    { key: 'hour_0_to_2', label: 'Hour 0-2', icon: AlertTriangle, color: 'red' },
    { key: 'hour_2_to_6', label: 'Hour 2-6', icon: Radio, color: 'orange' },
    { key: 'hour_6_to_24', label: 'Hour 6-24', icon: Truck, color: 'yellow' },
    { key: 'day_2_to_3', label: 'Day 2-3', icon: Users, color: 'blue' },
    { key: 'day_4_to_6', label: 'Day 4-6', icon: CheckCircle, color: 'green' },
  ];

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/emergency/command-center">
          <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-red-400 to-yellow-400 bg-clip-text text-transparent flex items-center gap-2">
            <Flame className="h-6 w-6 text-red-400" />
            Colonial Pipeline Scenario
          </h1>
          <p className="text-slate-400 text-sm">How EusoTrip would have responded — May 7-12, 2021</p>
        </div>
      </div>

      {/* What Happened */}
      <Card className="bg-gradient-to-r from-red-900/30 to-slate-800/50 border-red-500/30 rounded-xl">
        <CardHeader>
          <CardTitle className="text-red-400 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            {data?.scenario?.name} — {data?.scenario?.date}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {data?.scenario?.what_happened?.map((fact: string, i: number) => (
              <div key={i} className="flex items-start gap-3 py-1.5">
                <div className="w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center mt-0.5 shrink-0">
                  <span className="text-xs text-red-400 font-bold">{i + 1}</span>
                </div>
                <p className="text-sm text-slate-300">{fact}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* EusoTrip Response Timeline */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-slate-200 flex items-center gap-2">
          <Shield className="w-6 h-6 text-blue-400" />
          How EusoTrip Would Have Responded
        </h2>

        {phases.map((phase) => {
          const phaseData = (data?.how_eusotrip_would_have_responded as any)?.[phase.key];
          if (!phaseData) return null;
          return (
            <Card key={phase.key} className={`bg-slate-800/50 border-slate-700/50 rounded-xl border-l-4 border-l-${phase.color}-500`}>
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-slate-200">
                  <div className={`p-2 rounded-full bg-${phase.color}-500/20`}>
                    <phase.icon className={`w-5 h-5 text-${phase.color}-400`} />
                  </div>
                  <div>
                    <span className="text-lg">{phase.label}</span>
                    <Badge className={`ml-2 bg-${phase.color}-500/20 text-${phase.color}-400 border-${phase.color}-500/30`}>
                      {phaseData.phase}
                    </Badge>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {phaseData.actions?.map((action: string, i: number) => (
                    <div key={i} className="flex items-start gap-3 py-1.5">
                      <CheckCircle className={`w-4 h-4 text-${phase.color}-400 mt-0.5 shrink-0`} />
                      <p className="text-sm text-slate-300">{action}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Estimated Impact */}
      {data?.how_eusotrip_would_have_responded?.estimated_impact && (
        <Card className="bg-gradient-to-r from-green-900/20 to-blue-900/20 border-green-500/30 rounded-xl">
          <CardHeader>
            <CardTitle className="text-green-400 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Estimated Impact — What Could Have Been
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(data.how_eusotrip_would_have_responded.estimated_impact).map(([key, value]: [string, any]) => (
                <div key={key} className="p-4 rounded-lg bg-slate-800/50 border border-slate-700/30">
                  <p className="text-xs text-slate-500 capitalize">{key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').trim()}</p>
                  <p className="text-sm font-bold text-green-400 mt-1">{value}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* The Vision */}
      {data?.the_vision && (
        <Card className="bg-gradient-to-r from-blue-900/30 to-purple-900/20 border-blue-500/30 rounded-xl">
          <CardHeader>
            <CardTitle className="text-blue-400 flex items-center gap-2">
              <Eye className="w-5 h-5" />
              The Vision
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-lg bg-blue-900/20 border border-blue-500/20">
              <p className="text-sm text-blue-200 italic leading-relaxed">{data.the_vision.statement}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700/30">
                <div className="flex items-center gap-2 mb-2">
                  <Globe className="w-4 h-4 text-purple-400" />
                  <p className="text-xs font-bold text-purple-400">GOVERNMENT VALUE</p>
                </div>
                <p className="text-sm text-slate-300">{data.the_vision.government_value}</p>
              </div>
              <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700/30">
                <div className="flex items-center gap-2 mb-2">
                  <Truck className="w-4 h-4 text-yellow-400" />
                  <p className="text-xs font-bold text-yellow-400">DRIVER VALUE</p>
                </div>
                <p className="text-sm text-slate-300">{data.the_vision.driver_value}</p>
              </div>
              <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700/30">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-4 h-4 text-green-400" />
                  <p className="text-xs font-bold text-green-400">CITIZEN VALUE</p>
                </div>
                <p className="text-sm text-slate-300">{data.the_vision.citizen_value}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
