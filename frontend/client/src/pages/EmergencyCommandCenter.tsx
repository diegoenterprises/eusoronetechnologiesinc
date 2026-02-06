/**
 * EMERGENCY COMMAND CENTER — Admin Situational Awareness Dashboard
 * The nerve center for crisis operations. Declare emergencies, monitor
 * mobilization, track drivers, and coordinate response.
 * 
 * NO MOCK DATA - All data from tRPC queries
 */

import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useLocation } from 'wouter';
import {
  AlertTriangle, Shield, Users, Truck, MapPin, Clock, Activity,
  Zap, Radio, Target, Flag, ChevronRight, Plus, Eye, BarChart3,
  Siren, Globe, FileText, Flame, TrendingUp
} from 'lucide-react';

export default function EmergencyCommandCenter() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState('situational');
  const [showDeclareDialog, setShowDeclareDialog] = useState(false);

  // Declare emergency form state
  const [declareForm, setDeclareForm] = useState({
    name: '',
    codeName: '',
    threatLevel: 'HIGH' as string,
    infrastructureType: 'PIPELINE' as string,
    affectedInfrastructure: '',
    affectedStates: '' as string,
    fuelSupplyReduction: 45,
    affectedPopulation: 0,
    estimatedDuration: '',
    economicImpact: '',
    commandNotes: '',
    governmentPartner: '',
    federalDirective: '',
    hosWaiverActive: false,
    surgePayMultiplier: 2,
  });

  const situationalQuery = (trpc as any).emergencyResponse.getSituationalAwareness.useQuery();
  const operationsQuery = (trpc as any).emergencyResponse.getOperations.useQuery({ status: 'ALL' });
  const pipelineQuery = (trpc as any).emergencyResponse.getPipelineCorridorData.useQuery();
  const missionsQuery = (trpc as any).emergencyResponse.getEmergencyMissionTemplates.useQuery();

  const declareMutation = (trpc as any).emergencyResponse.declareEmergency.useMutation({
    onSuccess: () => {
      setShowDeclareDialog(false);
      operationsQuery.refetch();
      situationalQuery.refetch();
    },
  });

  const sit = situationalQuery.data;
  const ops = operationsQuery.data;

  const threatColors: Record<string, string> = {
    NORMAL: 'bg-green-500/20 text-green-400 border-green-500/30',
    ELEVATED: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    HIGH: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    SEVERE: 'bg-red-500/20 text-red-400 border-red-500/30',
    CRITICAL: 'bg-red-600/30 text-red-300 border-red-500/50 animate-pulse',
  };

  const threatBgColors: Record<string, string> = {
    NORMAL: 'from-green-900/30 to-green-800/10',
    ELEVATED: 'from-yellow-900/30 to-yellow-800/10',
    HIGH: 'from-orange-900/30 to-orange-800/10',
    SEVERE: 'from-red-900/30 to-red-800/10',
    CRITICAL: 'from-red-900/50 to-red-800/20',
  };

  const handleDeclare = () => {
    const states = declareForm.affectedStates.split(',').map((s: string) => s.trim()).filter(Boolean);
    declareMutation.mutate({
      name: declareForm.name,
      codeName: declareForm.codeName,
      threatLevel: declareForm.threatLevel,
      infrastructureType: declareForm.infrastructureType,
      affectedInfrastructure: declareForm.affectedInfrastructure,
      affectedStates: states,
      estimatedImpact: {
        fuelSupplyReduction: declareForm.fuelSupplyReduction,
        affectedPopulation: declareForm.affectedPopulation,
        estimatedDuration: declareForm.estimatedDuration,
        economicImpact: declareForm.economicImpact,
      },
      commandNotes: declareForm.commandNotes,
      governmentPartner: declareForm.governmentPartner || undefined,
      federalDirective: declareForm.federalDirective || undefined,
      hosWaiverActive: declareForm.hosWaiverActive,
      surgePayMultiplier: declareForm.surgePayMultiplier,
    });
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with Threat Level Banner */}
      <div className={`rounded-xl p-6 bg-gradient-to-r ${threatBgColors[sit?.threatLevel || 'NORMAL']} border ${sit?.threatLevel === 'CRITICAL' ? 'border-red-500/50' : 'border-slate-700/50'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-full ${sit?.threatLevel === 'CRITICAL' || sit?.threatLevel === 'SEVERE' ? 'bg-red-500/30 animate-pulse' : 'bg-slate-700/50'}`}>
              <Shield className={`w-8 h-8 ${sit?.threatLevel === 'CRITICAL' ? 'text-red-400' : sit?.threatLevel === 'SEVERE' ? 'text-red-400' : sit?.threatLevel === 'HIGH' ? 'text-orange-400' : 'text-green-400'}`} />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
                Emergency Command Center
              </h1>
              <p className="text-slate-400 text-sm mt-1">Infrastructure crisis management & driver mobilization</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge className={`text-lg px-4 py-2 ${threatColors[sit?.threatLevel || 'NORMAL']}`}>
              {sit?.threatLevel || 'NORMAL'}
            </Badge>
            <Dialog open={showDeclareDialog} onOpenChange={setShowDeclareDialog}>
              <DialogTrigger asChild>
                <Button className="bg-red-600 hover:bg-red-700 text-white">
                  <Siren className="w-4 h-4 mr-2" />
                  Declare Emergency
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-slate-900 border-slate-700">
                <DialogHeader>
                  <DialogTitle className="text-xl text-red-400 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" />
                    Declare Emergency Operation
                  </DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Operation Name</Label>
                      <Input placeholder="Colonial Pipeline Disruption" value={declareForm.name} onChange={e => setDeclareForm(f => ({ ...f, name: e.target.value }))} className="bg-slate-800 border-slate-700" />
                    </div>
                    <div>
                      <Label>Code Name</Label>
                      <Input placeholder="PIPELINE SHIELD" value={declareForm.codeName} onChange={e => setDeclareForm(f => ({ ...f, codeName: e.target.value }))} className="bg-slate-800 border-slate-700" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Threat Level</Label>
                      <Select value={declareForm.threatLevel} onValueChange={v => setDeclareForm(f => ({ ...f, threatLevel: v }))}>
                        <SelectTrigger className="bg-slate-800 border-slate-700"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ELEVATED">ELEVATED</SelectItem>
                          <SelectItem value="HIGH">HIGH</SelectItem>
                          <SelectItem value="SEVERE">SEVERE</SelectItem>
                          <SelectItem value="CRITICAL">CRITICAL</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Infrastructure Type</Label>
                      <Select value={declareForm.infrastructureType} onValueChange={v => setDeclareForm(f => ({ ...f, infrastructureType: v }))}>
                        <SelectTrigger className="bg-slate-800 border-slate-700"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PIPELINE">Pipeline</SelectItem>
                          <SelectItem value="REFINERY">Refinery</SelectItem>
                          <SelectItem value="TERMINAL">Terminal</SelectItem>
                          <SelectItem value="PORT">Port</SelectItem>
                          <SelectItem value="RAIL">Rail</SelectItem>
                          <SelectItem value="POWER_GRID">Power Grid</SelectItem>
                          <SelectItem value="HIGHWAY">Highway</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label>Affected Infrastructure</Label>
                    <Input placeholder="Colonial Pipeline System — 5,500mi Houston TX to Linden NJ" value={declareForm.affectedInfrastructure} onChange={e => setDeclareForm(f => ({ ...f, affectedInfrastructure: e.target.value }))} className="bg-slate-800 border-slate-700" />
                  </div>
                  <div>
                    <Label>Affected States (comma-separated)</Label>
                    <Input placeholder="TX, LA, MS, AL, GA, SC, NC, VA, MD, PA, NJ" value={declareForm.affectedStates} onChange={e => setDeclareForm(f => ({ ...f, affectedStates: e.target.value }))} className="bg-slate-800 border-slate-700" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Fuel Supply Reduction (%)</Label>
                      <Input type="number" value={declareForm.fuelSupplyReduction} onChange={e => setDeclareForm(f => ({ ...f, fuelSupplyReduction: Number(e.target.value) }))} className="bg-slate-800 border-slate-700" />
                    </div>
                    <div>
                      <Label>Affected Population</Label>
                      <Input type="number" placeholder="50000000" value={declareForm.affectedPopulation || ''} onChange={e => setDeclareForm(f => ({ ...f, affectedPopulation: Number(e.target.value) }))} className="bg-slate-800 border-slate-700" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Estimated Duration</Label>
                      <Input placeholder="5-7 days" value={declareForm.estimatedDuration} onChange={e => setDeclareForm(f => ({ ...f, estimatedDuration: e.target.value }))} className="bg-slate-800 border-slate-700" />
                    </div>
                    <div>
                      <Label>Surge Pay Multiplier</Label>
                      <Select value={String(declareForm.surgePayMultiplier)} onValueChange={v => setDeclareForm(f => ({ ...f, surgePayMultiplier: Number(v) }))}>
                        <SelectTrigger className="bg-slate-800 border-slate-700"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1.5">1.5x</SelectItem>
                          <SelectItem value="2">2x</SelectItem>
                          <SelectItem value="2.5">2.5x</SelectItem>
                          <SelectItem value="3">3x</SelectItem>
                          <SelectItem value="4">4x</SelectItem>
                          <SelectItem value="5">5x</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label>Economic Impact Estimate</Label>
                    <Input placeholder="$500M - $1B estimated disruption" value={declareForm.economicImpact} onChange={e => setDeclareForm(f => ({ ...f, economicImpact: e.target.value }))} className="bg-slate-800 border-slate-700" />
                  </div>
                  <div>
                    <Label>Command Notes</Label>
                    <Textarea placeholder="Ransomware attack on pipeline billing systems. Full shutdown as precaution..." value={declareForm.commandNotes} onChange={e => setDeclareForm(f => ({ ...f, commandNotes: e.target.value }))} className="bg-slate-800 border-slate-700" rows={3} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Government Partner (optional)</Label>
                      <Input placeholder="FEMA, DOE" value={declareForm.governmentPartner} onChange={e => setDeclareForm(f => ({ ...f, governmentPartner: e.target.value }))} className="bg-slate-800 border-slate-700" />
                    </div>
                    <div>
                      <Label>Federal Directive (optional)</Label>
                      <Input placeholder="Executive Order 14028" value={declareForm.federalDirective} onChange={e => setDeclareForm(f => ({ ...f, federalDirective: e.target.value }))} className="bg-slate-800 border-slate-700" />
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                    <Switch checked={declareForm.hosWaiverActive} onCheckedChange={v => setDeclareForm(f => ({ ...f, hosWaiverActive: v }))} />
                    <div>
                      <p className="text-sm font-medium">HOS Emergency Waiver Active</p>
                      <p className="text-xs text-slate-400">DOT has waived Hours of Service limits for emergency hauling</p>
                    </div>
                  </div>
                  <Button onClick={handleDeclare} disabled={declareMutation.isPending || !declareForm.name || !declareForm.codeName} className="w-full bg-red-600 hover:bg-red-700 text-white text-lg py-6">
                    <Siren className="w-5 h-5 mr-2" />
                    {declareMutation.isPending ? 'Declaring...' : 'DECLARE EMERGENCY OPERATION'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        {[
          { label: 'Active Ops', value: sit?.activeOperations || 0, icon: Siren, color: 'red' },
          { label: 'Mobilized Drivers', value: sit?.mobilizedDrivers || 0, icon: Users, color: 'blue' },
          { label: 'En Route', value: sit?.driversEnRoute || 0, icon: Truck, color: 'yellow' },
          { label: 'On Station', value: sit?.driversOnStation || 0, icon: MapPin, color: 'green' },
          { label: 'Hauling', value: sit?.driversHauling || 0, icon: Activity, color: 'purple' },
          { label: 'Loads Delivered', value: sit?.totalLoadsDelivered || 0, icon: Target, color: 'orange' },
        ].map((stat, i) => (
          <Card key={i} className="bg-slate-800/50 border-slate-700/50 rounded-xl">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full bg-${stat.color}-500/20`}>
                  {situationalQuery.isLoading ? <Skeleton className="w-5 h-5 rounded-full" /> : <stat.icon className={`w-5 h-5 text-${stat.color}-400`} />}
                </div>
                <div>
                  {situationalQuery.isLoading ? <Skeleton className="h-7 w-12" /> : (
                    <p className={`text-xl font-bold text-${stat.color}-400`}>{stat.value.toLocaleString()}</p>
                  )}
                  <p className="text-xs text-slate-400">{stat.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-slate-800/50 border border-slate-700/50">
          <TabsTrigger value="situational">Situational Awareness</TabsTrigger>
          <TabsTrigger value="operations">Operations</TabsTrigger>
          <TabsTrigger value="pipeline">Pipeline Intel</TabsTrigger>
          <TabsTrigger value="missions">Emergency Missions</TabsTrigger>
        </TabsList>

        {/* Situational Awareness Tab */}
        <TabsContent value="situational" className="mt-6 space-y-6">
          {/* Recent Timeline */}
          <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-200">
                <Clock className="w-5 h-5 text-blue-400" />
                Operations Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              {situationalQuery.isLoading ? (
                <div className="space-y-3">{[...Array(5)].map((_: any, i: number) => <Skeleton key={i} className="h-12" />)}</div>
              ) : sit?.recentTimeline?.length > 0 ? (
                <div className="space-y-3">
                  {sit.recentTimeline.map((entry: any, i: number) => (
                    <div key={i} className={`flex items-start gap-3 p-3 rounded-lg border ${entry.severity === 'CRITICAL' ? 'bg-red-900/20 border-red-500/30' : entry.severity === 'WARNING' ? 'bg-yellow-900/20 border-yellow-500/30' : 'bg-slate-800/50 border-slate-700/30'}`}>
                      <div className={`p-1 rounded-full mt-0.5 ${entry.severity === 'CRITICAL' ? 'bg-red-500/30' : entry.severity === 'WARNING' ? 'bg-yellow-500/30' : 'bg-blue-500/30'}`}>
                        {entry.severity === 'CRITICAL' ? <AlertTriangle className="w-4 h-4 text-red-400" /> : entry.severity === 'WARNING' ? <Flame className="w-4 h-4 text-yellow-400" /> : <Activity className="w-4 h-4 text-blue-400" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">{entry.operationCode}</Badge>
                          <span className="text-sm font-semibold text-slate-200">{entry.event}</span>
                        </div>
                        <p className="text-sm text-slate-400 mt-1">{entry.details}</p>
                        <p className="text-xs text-slate-500 mt-1">{new Date(entry.timestamp).toLocaleString()} — {entry.author}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-slate-500">
                  <Shield className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="text-lg">All Clear — No Active Emergency Operations</p>
                  <p className="text-sm mt-1">System monitoring normal. Pipeline systems operational.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Navigation Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl hover:border-blue-500/30 cursor-pointer transition-all" onClick={() => setLocation('/emergency/mobilization')}>
              <CardContent className="p-6 flex items-center gap-4">
                <div className="p-3 rounded-full bg-blue-500/20"><Radio className="w-6 h-6 text-blue-400" /></div>
                <div className="flex-1">
                  <p className="font-semibold text-slate-200">Issue Mobilization</p>
                  <p className="text-xs text-slate-400">Call to Haul / I Want You</p>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-500" />
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl hover:border-green-500/30 cursor-pointer transition-all" onClick={() => setLocation('/emergency/supply-analysis')}>
              <CardContent className="p-6 flex items-center gap-4">
                <div className="p-3 rounded-full bg-green-500/20"><BarChart3 className="w-6 h-6 text-green-400" /></div>
                <div className="flex-1">
                  <p className="font-semibold text-slate-200">Supply Impact Analysis</p>
                  <p className="text-xs text-slate-400">Model disruption scenarios</p>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-500" />
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl hover:border-purple-500/30 cursor-pointer transition-all" onClick={() => setLocation('/emergency/government-liaison')}>
              <CardContent className="p-6 flex items-center gap-4">
                <div className="p-3 rounded-full bg-purple-500/20"><Globe className="w-6 h-6 text-purple-400" /></div>
                <div className="flex-1">
                  <p className="font-semibold text-slate-200">Government Liaison</p>
                  <p className="text-xs text-slate-400">FEMA, DOE, DOT contacts</p>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-500" />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Operations Tab */}
        <TabsContent value="operations" className="mt-6 space-y-4">
          {operationsQuery.isLoading ? (
            <div className="space-y-4">{[...Array(3)].map((_: any, i: number) => <Skeleton key={i} className="h-32" />)}</div>
          ) : ops?.operations?.length > 0 ? (
            ops.operations.map((op: any) => (
              <Card key={op.id} className={`bg-slate-800/50 border-slate-700/50 rounded-xl ${op.status === 'ACTIVE' || op.status === 'ESCALATED' ? 'border-l-4 border-l-red-500' : ''}`}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-full ${op.status === 'ACTIVE' || op.status === 'ESCALATED' ? 'bg-red-500/20' : 'bg-slate-700/50'}`}>
                        <Shield className={`w-6 h-6 ${op.status === 'ACTIVE' || op.status === 'ESCALATED' ? 'text-red-400' : 'text-slate-400'}`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-lg text-slate-200">{op.codeName}</h3>
                          <Badge className={threatColors[op.threatLevel]}>{op.threatLevel}</Badge>
                          <Badge variant={op.status === 'ACTIVE' ? 'destructive' : op.status === 'ESCALATED' ? 'destructive' : 'secondary'}>{op.status}</Badge>
                        </div>
                        <p className="text-sm text-slate-400 mt-1">{op.name}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(op.declaredAt).toLocaleString()}</span>
                          <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{op.affectedStates?.join(', ')}</span>
                          <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3" />{op.estimatedImpact?.fuelSupplyReduction}% supply reduction</span>
                        </div>
                        <div className="flex items-center gap-2 mt-3">
                          {op.hosWaiverActive && <Badge variant="outline" className="text-xs text-green-400 border-green-500/30">HOS Waiver Active</Badge>}
                          <Badge variant="outline" className="text-xs text-yellow-400 border-yellow-500/30">{op.surgePayMultiplier}x Surge Pay</Badge>
                          <Badge variant="outline" className="text-xs">{op.mobilizationZones?.length || 0} Zones</Badge>
                        </div>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setLocation(`/emergency/operation/${op.id}`)}>
                      <Eye className="w-4 h-4 mr-1" />Detail
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-12 text-center text-slate-500">
                <Shield className="w-16 h-16 mx-auto mb-4 opacity-20" />
                <p className="text-lg font-medium">No Emergency Operations</p>
                <p className="text-sm mt-1">All systems normal. Use "Declare Emergency" to activate the Command Center.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Pipeline Intelligence Tab */}
        <TabsContent value="pipeline" className="mt-6 space-y-6">
          {pipelineQuery.isLoading ? (
            <div className="space-y-4">{[...Array(5)].map((_: any, i: number) => <Skeleton key={i} className="h-20" />)}</div>
          ) : (
            <>
              {/* Colonial Pipeline Detail Card */}
              <Card className="bg-gradient-to-r from-slate-800/80 to-red-900/20 border-slate-700/50 rounded-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-400">
                    <Flame className="w-5 h-5" />
                    {pipelineQuery.data?.colonialPipeline?.name} — Critical Infrastructure
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="p-3 rounded-lg bg-slate-800/50">
                      <p className="text-xs text-slate-400">Length</p>
                      <p className="text-lg font-bold text-slate-200">{pipelineQuery.data?.colonialPipeline?.length?.toLocaleString()} mi</p>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-800/50">
                      <p className="text-xs text-slate-400">Capacity</p>
                      <p className="text-lg font-bold text-slate-200">{(pipelineQuery.data?.colonialPipeline?.capacity / 1000000)?.toFixed(1)}M bbl/day</p>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-800/50">
                      <p className="text-xs text-slate-400">States</p>
                      <p className="text-lg font-bold text-slate-200">{pipelineQuery.data?.colonialPipeline?.states?.length}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-800/50">
                      <p className="text-xs text-slate-400">Key Terminals</p>
                      <p className="text-lg font-bold text-slate-200">{pipelineQuery.data?.colonialPipeline?.keyTerminals?.length}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-slate-300">Terminal Corridor</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {pipelineQuery.data?.colonialPipeline?.keyTerminals?.map((terminal: any, i: number) => (
                        <div key={i} className="p-2 rounded bg-slate-800/70 border border-slate-700/30">
                          <p className="text-xs font-medium text-slate-300">{terminal.name}</p>
                          <p className="text-xs text-slate-500">{terminal.city}, {terminal.state} — {(terminal.capacity / 1000).toFixed(0)}K bbl/day</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* All Pipeline Systems */}
              <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-slate-200">
                    <Activity className="w-5 h-5 text-blue-400" />
                    US Pipeline Systems Intelligence
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {pipelineQuery.data?.allPipelines?.map((pipeline: any) => (
                      <div key={pipeline.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/70 border border-slate-700/30 hover:border-blue-500/30 transition-all">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-full bg-blue-500/10">
                            <Activity className="w-4 h-4 text-blue-400" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-200">{pipeline.name}</p>
                            <p className="text-xs text-slate-500">{pipeline.route}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-6 text-right">
                          <div>
                            <p className="text-sm font-bold text-slate-300">{pipeline.miles?.toLocaleString()} mi</p>
                            <p className="text-xs text-slate-500">Length</p>
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-300">{(pipeline.bpd / 1000000).toFixed(1)}M</p>
                            <p className="text-xs text-slate-500">bbl/day</p>
                          </div>
                          <div className="flex gap-1">
                            {pipeline.products?.slice(0, 2).map((p: string, j: number) => (
                              <Badge key={j} variant="outline" className="text-xs">{p}</Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Emergency Missions Tab */}
        <TabsContent value="missions" className="mt-6 space-y-6">
          {missionsQuery.isLoading ? (
            <div className="space-y-4">{[...Array(6)].map((_: any, i: number) => <Skeleton key={i} className="h-24" />)}</div>
          ) : (
            <>
              <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-slate-200">
                    <Target className="w-5 h-5 text-orange-400" />
                    Emergency Mission Templates
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {missionsQuery.data?.missions?.map((mission: any, i: number) => (
                    <div key={i} className="flex items-center justify-between p-4 rounded-lg bg-slate-800/70 border border-slate-700/30">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${mission.priority === 'CRITICAL' ? 'bg-red-500/20' : 'bg-orange-500/20'}`}>
                          <Target className={`w-5 h-5 ${mission.priority === 'CRITICAL' ? 'text-red-400' : 'text-orange-400'}`} />
                        </div>
                        <div>
                          <p className="font-medium text-slate-200">{mission.name}</p>
                          <p className="text-xs text-slate-400 mt-0.5">{mission.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="text-yellow-400 border-yellow-500/30">+{mission.baseXpReward} XP</Badge>
                        <Badge variant="outline" className="text-blue-400 border-blue-500/30">+{mission.baseMilesReward} Miles</Badge>
                        <Badge className={mission.priority === 'CRITICAL' ? 'bg-red-500/20 text-red-400' : 'bg-orange-500/20 text-orange-400'}>{mission.priority}</Badge>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-slate-200">
                    <Flag className="w-5 h-5 text-yellow-400" />
                    Emergency Badges
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {missionsQuery.data?.badges?.map((badge: any, i: number) => (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/70 border border-slate-700/30">
                        <div className={`p-2 rounded-full ${badge.tier === 'diamond' ? 'bg-cyan-500/20' : badge.tier === 'legendary' ? 'bg-yellow-500/20' : badge.tier === 'epic' ? 'bg-purple-500/20' : badge.tier === 'platinum' ? 'bg-slate-400/20' : 'bg-yellow-700/20'}`}>
                          <Flag className={`w-5 h-5 ${badge.tier === 'diamond' ? 'text-cyan-400' : badge.tier === 'legendary' ? 'text-yellow-400' : badge.tier === 'epic' ? 'text-purple-400' : badge.tier === 'platinum' ? 'text-slate-300' : 'text-yellow-600'}`} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-slate-200">{badge.name}</p>
                            <Badge variant="outline" className="text-xs capitalize">{badge.tier}</Badge>
                          </div>
                          <p className="text-xs text-slate-400">{badge.description}</p>
                        </div>
                        <p className="text-sm font-bold text-yellow-400">+{badge.xp?.toLocaleString()} XP</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
