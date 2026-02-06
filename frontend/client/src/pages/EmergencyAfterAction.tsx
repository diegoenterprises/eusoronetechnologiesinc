/**
 * EMERGENCY AFTER-ACTION REPORT — Post-crisis analysis viewer
 * Shows operation summary, mobilization stats, driver recognition,
 * timeline, and lessons learned.
 * 
 * NO MOCK DATA - All data from tRPC queries
 */

import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Link } from 'wouter';
import {
  ArrowLeft, FileText, Shield, Clock, Users, Truck, Target,
  CheckCircle, Award, AlertTriangle, Activity, Flame, Star,
  BookOpen, TrendingUp, MapPin
} from 'lucide-react';

export default function EmergencyAfterAction() {
  const [selectedOp, setSelectedOp] = useState('');

  const operationsQuery = (trpc as any).emergencyResponse.getOperations.useQuery({ status: 'ALL' });
  const reportQuery = (trpc as any).emergencyResponse.getAfterActionReport.useQuery(
    { operationId: selectedOp },
    { enabled: !!selectedOp }
  );

  const report = reportQuery.data;

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/emergency/command-center">
          <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent flex items-center gap-2">
            <FileText className="h-6 w-6 text-yellow-400" />
            After-Action Report
          </h1>
          <p className="text-slate-400 text-sm">Post-crisis analysis, recognition, and lessons learned</p>
        </div>
      </div>

      {/* Operation Selector */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardContent className="p-4">
          <Label>Select Operation</Label>
          <Select value={selectedOp} onValueChange={setSelectedOp}>
            <SelectTrigger className="bg-slate-800 border-slate-700 mt-2">
              <SelectValue placeholder="Select a completed operation..." />
            </SelectTrigger>
            <SelectContent>
              {operationsQuery.data?.operations?.map((op: any) => (
                <SelectItem key={op.id} value={op.id}>
                  {op.codeName} — {op.name} ({op.status})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {reportQuery.isLoading && selectedOp && (
        <div className="grid gap-4">{[...Array(4)].map((_: any, i: number) => <Skeleton key={i} className="h-40" />)}</div>
      )}

      {report && (
        <>
          {/* Operation Summary */}
          <Card className="bg-gradient-to-r from-slate-800/80 to-blue-900/20 border-slate-700/50 rounded-xl">
            <CardHeader>
              <CardTitle className="text-slate-200 flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-400" />
                Operation Summary — {report.operation?.codeName}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Operation', value: report.operation?.name, icon: Shield },
                  { label: 'Threat Level', value: report.operation?.threatLevel, icon: AlertTriangle },
                  { label: 'Duration', value: report.operation?.duration, icon: Clock },
                  { label: 'Status', value: report.operation?.status, icon: Activity },
                ].map((item, i) => (
                  <div key={i} className="p-3 rounded-lg bg-slate-800/50">
                    <div className="flex items-center gap-1 text-xs text-slate-500 mb-1">
                      <item.icon className="w-3 h-3" />{item.label}
                    </div>
                    <p className="text-sm font-medium text-slate-200">{item.value}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Mobilization Stats + Impact */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardHeader>
                <CardTitle className="text-slate-200 flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-400" />
                  Mobilization Statistics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {[
                  { label: 'Orders Sent', value: report.mobilization?.totalOrdersSent },
                  { label: 'Drivers Notified', value: report.mobilization?.totalDriversNotified?.toLocaleString() },
                  { label: 'Total Responses', value: report.mobilization?.totalResponses },
                  { label: 'Acceptance Rate', value: report.mobilization?.acceptanceRate },
                  { label: 'Avg Response Time', value: `${report.mobilization?.averageResponseTimeMinutes} min` },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-slate-700/30 last:border-0">
                    <span className="text-sm text-slate-400">{item.label}</span>
                    <span className="text-sm font-medium text-slate-200">{item.value}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardHeader>
                <CardTitle className="text-slate-200 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-400" />
                  Operational Impact
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {[
                  { label: 'Total Loads Delivered', value: report.impact?.totalLoadsDelivered?.toLocaleString() },
                  { label: 'Total Miles Hauled', value: report.impact?.totalMilesHauled?.toLocaleString() },
                  { label: 'Est. Gallons Delivered', value: report.impact?.estimatedGallonsDelivered?.toLocaleString() },
                  { label: 'Stations Resupplied', value: report.impact?.estimatedStationsResupplied?.toLocaleString() },
                  { label: 'Drivers Completed', value: report.impact?.driversCompleted },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-slate-700/30 last:border-0">
                    <span className="text-sm text-slate-400">{item.label}</span>
                    <span className="text-sm font-bold text-green-400">{item.value}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Driver Recognition */}
          <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
            <CardHeader>
              <CardTitle className="text-slate-200 flex items-center gap-2">
                <Award className="w-5 h-5 text-yellow-400" />
                Driver Recognition
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Top Drivers */}
                <div>
                  <p className="text-sm font-medium text-slate-300 mb-3">Top Emergency Responders</p>
                  {report.recognition?.topDrivers?.length > 0 ? (
                    <div className="space-y-2">
                      {report.recognition.topDrivers.map((driver: any, i: number) => (
                        <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-slate-800/70">
                          <div className="flex items-center gap-2">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-yellow-500/30 text-yellow-400' : i === 1 ? 'bg-slate-400/30 text-slate-300' : i === 2 ? 'bg-orange-500/30 text-orange-400' : 'bg-slate-700/50 text-slate-400'}`}>
                              {i + 1}
                            </div>
                            <span className="text-sm text-slate-200">{driver.name}</span>
                          </div>
                          <div className="text-xs text-slate-400">
                            {driver.loadsCompleted} loads | {driver.milesHauled} mi
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500 italic">No completed drivers yet</p>
                  )}
                </div>

                {/* Badges Awarded */}
                <div>
                  <p className="text-sm font-medium text-slate-300 mb-3">Badges Awarded</p>
                  <div className="flex flex-wrap gap-2">
                    {report.recognition?.badgesAwarded?.map((badge: string, i: number) => (
                      <Badge key={i} className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                        <Star className="w-3 h-3 mr-1" />{badge}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lessons Learned */}
          <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
            <CardHeader>
              <CardTitle className="text-slate-200 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-purple-400" />
                Lessons Learned
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {report.lessonsLearned?.map((lesson: string, i: number) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-slate-800/70 border border-slate-700/30">
                    <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
                    <p className="text-sm text-slate-300">{lesson}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
            <CardHeader>
              <CardTitle className="text-slate-200 flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-400" />
                Full Operations Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {report.timeline?.map((entry: any, i: number) => (
                  <div key={i} className={`flex items-start gap-3 p-3 rounded-lg border ${entry.severity === 'CRITICAL' ? 'bg-red-900/20 border-red-500/30' : entry.severity === 'WARNING' ? 'bg-yellow-900/20 border-yellow-500/30' : 'bg-slate-800/70 border-slate-700/30'}`}>
                    <div className={`p-1 rounded-full mt-0.5 ${entry.severity === 'CRITICAL' ? 'bg-red-500/30' : entry.severity === 'WARNING' ? 'bg-yellow-500/30' : 'bg-blue-500/30'}`}>
                      {entry.severity === 'CRITICAL' ? <AlertTriangle className="w-3 h-3 text-red-400" /> : entry.severity === 'WARNING' ? <Flame className="w-3 h-3 text-yellow-400" /> : <Activity className="w-3 h-3 text-blue-400" />}
                    </div>
                    <div className="flex-1">
                      <span className="text-sm font-semibold text-slate-200">{entry.event}</span>
                      <p className="text-xs text-slate-400 mt-0.5">{entry.details}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{new Date(entry.timestamp).toLocaleString()} — {entry.author}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {!selectedOp && (
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-12 text-center text-slate-500">
            <FileText className="w-16 h-16 mx-auto mb-4 opacity-20" />
            <p className="text-lg">Select an operation to view its after-action report</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
