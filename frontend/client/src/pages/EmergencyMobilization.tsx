/**
 * EMERGENCY MOBILIZATION — Admin "Call to Haul" & "I Want You" Order Issuing
 * This is where admins send mobilization orders to drivers during a crisis.
 * 
 * NO MOCK DATA - All data from tRPC queries
 */

import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Link } from 'wouter';
import {
  ArrowLeft, Radio, Megaphone, Users, Target, Send, Truck, Shield,
  MapPin, Zap, Clock, CheckCircle, AlertTriangle, Flag
} from 'lucide-react';

export default function EmergencyMobilization() {
  const [activeTab, setActiveTab] = useState('issue');
  const [form, setForm] = useState({
    operationId: '',
    type: 'CALL_TO_HAUL' as string,
    title: '',
    message: '',
    urgency: 'IMMEDIATE' as string,
    states: '',
    radiusMiles: 200,
    hazmatCertified: false,
    tankerEndorsed: false,
    minExperienceYears: 0,
    surgePayMultiplier: 2,
    bonusXp: 3000,
    bonusMiles: 5000,
    specialBadge: '',
    cashBonus: 0,
    missionTemplate: '',
  });

  const operationsQuery = (trpc as any).emergencyResponse.getOperations.useQuery({ status: 'ACTIVE' });
  const missionsQuery = (trpc as any).emergencyResponse.getEmergencyMissionTemplates.useQuery();

  const issueMutation = (trpc as any).emergencyResponse.issueMobilizationOrder.useMutation({
    onSuccess: () => {
      setForm(f => ({ ...f, title: '', message: '' }));
      operationsQuery.refetch();
    },
  });

  if (operationsQuery.isError) {
    return (
      <div className="p-6">
        <Card className="bg-red-900/20 border-red-500/30 rounded-xl">
          <CardContent className="p-8 text-center">
            <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-red-400" />
            <h2 className="text-lg font-bold text-red-400">Failed to Load Operations</h2>
            <p className="text-sm text-slate-400 mt-2">{(operationsQuery.error as any)?.message || 'Could not connect to emergency response backend.'}</p>
            <Button onClick={() => operationsQuery.refetch()} className="mt-4 bg-red-600 hover:bg-red-700">Retry</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleIssue = () => {
    const states = form.states.split(',').map((s: string) => s.trim()).filter(Boolean);
    issueMutation.mutate({
      operationId: form.operationId,
      type: form.type,
      title: form.title,
      message: form.message,
      urgency: form.urgency,
      targetAudience: {
        states: states.length > 0 ? states : undefined,
        radiusMiles: form.radiusMiles > 0 ? form.radiusMiles : undefined,
        hazmatCertified: form.hazmatCertified || undefined,
        tankerEndorsed: form.tankerEndorsed || undefined,
        minExperienceYears: form.minExperienceYears > 0 ? form.minExperienceYears : undefined,
      },
      incentives: {
        surgePayMultiplier: form.surgePayMultiplier,
        bonusXp: form.bonusXp,
        bonusMiles: form.bonusMiles,
        specialBadge: form.specialBadge || undefined,
        cashBonus: form.cashBonus > 0 ? form.cashBonus : undefined,
      },
      missionTemplate: form.missionTemplate || undefined,
    });
  };

  const mobilizationTypes = [
    { value: 'CALL_TO_HAUL', label: 'Call to Haul', icon: Megaphone, description: 'Mass alert to all drivers in affected region', color: 'red' },
    { value: 'I_WANT_YOU', label: 'I Want You', icon: Flag, description: 'Targeted Uncle Sam-style recruitment for qualified drivers', color: 'blue' },
    { value: 'STRATEGIC_REPOSITION', label: 'Strategic Reposition', icon: MapPin, description: 'Move drivers to staging areas at pipeline terminals', color: 'green' },
    { value: 'CONVOY_FORM', label: 'Convoy Formation', icon: Truck, description: 'Organize escorted emergency fuel convoys', color: 'purple' },
    { value: 'GENERAL_ALERT', label: 'General Alert', icon: Radio, description: 'Broadcast situational awareness to all drivers', color: 'yellow' },
  ];

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/emergency/command-center">
          <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent flex items-center gap-2">
            <Radio className="h-6 w-6 text-blue-400" />
            Driver Mobilization
          </h1>
          <p className="text-slate-400 text-sm">Issue Call to Haul & I Want You orders to mobilize drivers</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-slate-800/50 border border-slate-700/50">
          <TabsTrigger value="issue">Issue Order</TabsTrigger>
          <TabsTrigger value="history">Order History</TabsTrigger>
        </TabsList>

        {/* Issue Order Tab */}
        <TabsContent value="issue" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Select Operation */}
              <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
                <CardHeader>
                  <CardTitle className="text-slate-200 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-red-400" />
                    Active Operation
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {operationsQuery.isLoading ? <Skeleton className="h-10" /> : (
                    <Select value={form.operationId} onValueChange={v => setForm(f => ({ ...f, operationId: v }))}>
                      <SelectTrigger className="bg-slate-800 border-slate-700">
                        <SelectValue placeholder="Select active emergency operation..." />
                      </SelectTrigger>
                      <SelectContent>
                        {operationsQuery.data?.operations?.filter((op: any) => op.status === 'ACTIVE' || op.status === 'ESCALATED').map((op: any) => (
                          <SelectItem key={op.id} value={op.id}>
                            {op.codeName} — {op.name} ({op.threatLevel})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  {!form.operationId && (
                    <p className="text-xs text-yellow-400 mt-2 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      An active emergency operation must be declared first
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Mobilization Type Selection */}
              <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
                <CardHeader>
                  <CardTitle className="text-slate-200">Mobilization Type</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {mobilizationTypes.map(mt => (
                      <div
                        key={mt.value}
                        className={`p-4 rounded-lg border cursor-pointer transition-all ${form.type === mt.value ? `border-${mt.color}-500/50 bg-${mt.color}-500/10` : 'border-slate-700/30 bg-slate-800/50 hover:border-slate-600'}`}
                        onClick={() => setForm(f => ({ ...f, type: mt.value }))}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-full bg-${mt.color}-500/20`}>
                            <mt.icon className={`w-5 h-5 text-${mt.color}-400`} />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-200">{mt.label}</p>
                            <p className="text-xs text-slate-400">{mt.description}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Message Content */}
              <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
                <CardHeader>
                  <CardTitle className="text-slate-200">Message</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Title</Label>
                      <Input
                        placeholder={form.type === 'I_WANT_YOU' ? 'YOUR COUNTRY NEEDS YOU — Charlotte NC' : 'Emergency Fuel Run — Colonial Pipeline Corridor'}
                        value={form.title}
                        onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                        className="bg-slate-800 border-slate-700"
                      />
                    </div>
                    <div>
                      <Label>Urgency</Label>
                      <Select value={form.urgency} onValueChange={v => setForm(f => ({ ...f, urgency: v }))}>
                        <SelectTrigger className="bg-slate-800 border-slate-700"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ROUTINE">Routine</SelectItem>
                          <SelectItem value="PRIORITY">Priority</SelectItem>
                          <SelectItem value="IMMEDIATE">Immediate</SelectItem>
                          <SelectItem value="FLASH">FLASH (Critical)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label>Message Body</Label>
                    <Textarea
                      placeholder="Colonial Pipeline shut down. 45% of East Coast fuel supply offline. We need tanker drivers in the SE corridor immediately. 3x surge pay, 5000 bonus XP, Pipeline Patriot badge. Answer the call."
                      value={form.message}
                      onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                      className="bg-slate-800 border-slate-700"
                      rows={4}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Target Audience */}
              <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
                <CardHeader>
                  <CardTitle className="text-slate-200 flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-400" />
                    Target Audience
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Target States (comma-separated)</Label>
                    <Input
                      placeholder="GA, SC, NC, VA, MD, DC"
                      value={form.states}
                      onChange={e => setForm(f => ({ ...f, states: e.target.value }))}
                      className="bg-slate-800 border-slate-700"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Radius (miles from center)</Label>
                      <Input type="number" value={form.radiusMiles} onChange={e => setForm(f => ({ ...f, radiusMiles: Number(e.target.value) }))} className="bg-slate-800 border-slate-700" />
                    </div>
                    <div>
                      <Label>Min Experience (years)</Label>
                      <Input type="number" value={form.minExperienceYears} onChange={e => setForm(f => ({ ...f, minExperienceYears: Number(e.target.value) }))} className="bg-slate-800 border-slate-700" />
                    </div>
                  </div>
                  <div className="flex gap-6">
                    <div className="flex items-center gap-3">
                      <Switch checked={form.tankerEndorsed} onCheckedChange={v => setForm(f => ({ ...f, tankerEndorsed: v }))} />
                      <Label>Tanker Endorsed Only</Label>
                    </div>
                    <div className="flex items-center gap-3">
                      <Switch checked={form.hazmatCertified} onCheckedChange={v => setForm(f => ({ ...f, hazmatCertified: v }))} />
                      <Label>Hazmat Certified Only</Label>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Incentives */}
              <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
                <CardHeader>
                  <CardTitle className="text-slate-200 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-yellow-400" />
                    Incentives
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <Label>Surge Pay</Label>
                      <Select value={String(form.surgePayMultiplier)} onValueChange={v => setForm(f => ({ ...f, surgePayMultiplier: Number(v) }))}>
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
                    <div>
                      <Label>Bonus XP</Label>
                      <Input type="number" value={form.bonusXp} onChange={e => setForm(f => ({ ...f, bonusXp: Number(e.target.value) }))} className="bg-slate-800 border-slate-700" />
                    </div>
                    <div>
                      <Label>Bonus Haul Miles</Label>
                      <Input type="number" value={form.bonusMiles} onChange={e => setForm(f => ({ ...f, bonusMiles: Number(e.target.value) }))} className="bg-slate-800 border-slate-700" />
                    </div>
                    <div>
                      <Label>Cash Bonus ($)</Label>
                      <Input type="number" value={form.cashBonus || ''} onChange={e => setForm(f => ({ ...f, cashBonus: Number(e.target.value) }))} className="bg-slate-800 border-slate-700" placeholder="Optional" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <Label>Linked Mission Template</Label>
                    <Select value={form.missionTemplate} onValueChange={v => setForm(f => ({ ...f, missionTemplate: v }))}>
                      <SelectTrigger className="bg-slate-800 border-slate-700">
                        <SelectValue placeholder="Optional — link a mission from The Haul" />
                      </SelectTrigger>
                      <SelectContent>
                        {missionsQuery.data?.missions?.map((m: any) => (
                          <SelectItem key={m.code} value={m.code}>{m.name} (+{m.baseXpReward} XP)</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Send Button */}
              <Button
                onClick={handleIssue}
                disabled={issueMutation.isPending || !form.operationId || !form.title || !form.message}
                className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white text-lg py-6"
              >
                <Send className="w-5 h-5 mr-2" />
                {issueMutation.isPending ? 'Sending Mobilization...' : form.type === 'I_WANT_YOU' ? 'SEND "I WANT YOU" ORDER' : form.type === 'CALL_TO_HAUL' ? 'ISSUE CALL TO HAUL' : 'SEND MOBILIZATION ORDER'}
              </Button>

              {issueMutation.data && (
                <Card className="bg-green-900/20 border-green-500/30 rounded-xl">
                  <CardContent className="p-4 flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <div>
                      <p className="text-sm font-medium text-green-400">Mobilization Order Sent</p>
                      <p className="text-xs text-slate-400">{issueMutation.data.message}</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar - Preview */}
            <div className="space-y-6">
              <Card className={`rounded-xl border-2 ${form.type === 'I_WANT_YOU' ? 'bg-gradient-to-b from-blue-900/40 to-red-900/20 border-blue-500/30' : form.type === 'CALL_TO_HAUL' ? 'bg-gradient-to-b from-red-900/40 to-orange-900/20 border-red-500/30' : 'bg-slate-800/50 border-slate-700/50'}`}>
                <CardHeader>
                  <CardTitle className="text-sm text-slate-400">Message Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      {form.type === 'I_WANT_YOU' && <Flag className="w-6 h-6 text-blue-400" />}
                      {form.type === 'CALL_TO_HAUL' && <Megaphone className="w-6 h-6 text-red-400" />}
                      {form.type === 'CONVOY_FORM' && <Truck className="w-6 h-6 text-purple-400" />}
                      {form.type === 'STRATEGIC_REPOSITION' && <MapPin className="w-6 h-6 text-green-400" />}
                      {form.type === 'GENERAL_ALERT' && <Radio className="w-6 h-6 text-yellow-400" />}
                      <Badge className={form.urgency === 'FLASH' ? 'bg-red-500/30 text-red-300 animate-pulse' : form.urgency === 'IMMEDIATE' ? 'bg-orange-500/30 text-orange-300' : 'bg-yellow-500/30 text-yellow-300'}>{form.urgency}</Badge>
                    </div>
                    <h3 className="font-bold text-lg text-slate-100">{form.title || 'Order Title'}</h3>
                    <p className="text-sm text-slate-300">{form.message || 'Message body will appear here...'}</p>
                    <div className="border-t border-slate-700/50 pt-3 space-y-2">
                      <div className="flex items-center gap-2 text-xs text-yellow-400">
                        <Zap className="w-3 h-3" />{form.surgePayMultiplier}x Surge Pay
                      </div>
                      <div className="flex items-center gap-2 text-xs text-blue-400">
                        <Target className="w-3 h-3" />+{form.bonusXp} XP | +{form.bonusMiles} Haul Miles
                      </div>
                      {form.cashBonus > 0 && (
                        <div className="flex items-center gap-2 text-xs text-green-400">
                          <CheckCircle className="w-3 h-3" />${form.cashBonus} Cash Bonus
                        </div>
                      )}
                    </div>
                    {form.states && (
                      <div className="flex items-center gap-1 text-xs text-slate-500">
                        <MapPin className="w-3 h-3" />
                        {form.states}
                      </div>
                    )}
                    <div className="flex gap-2 text-xs text-slate-500">
                      {form.tankerEndorsed && <Badge variant="outline" className="text-xs">Tanker</Badge>}
                      {form.hazmatCertified && <Badge variant="outline" className="text-xs">Hazmat</Badge>}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
                <CardHeader>
                  <CardTitle className="text-sm text-slate-400">Quick Reference</CardTitle>
                </CardHeader>
                <CardContent className="text-xs text-slate-500 space-y-2">
                  <p><strong className="text-slate-300">FLASH</strong> — Life/safety threat, highest priority</p>
                  <p><strong className="text-slate-300">IMMEDIATE</strong> — Action required within hours</p>
                  <p><strong className="text-slate-300">PRIORITY</strong> — Action required within 24 hours</p>
                  <p><strong className="text-slate-300">ROUTINE</strong> — Informational awareness</p>
                  <div className="border-t border-slate-700/50 pt-2 mt-3">
                    <p className="text-slate-400 italic">"When pipelines fail, truckers prevail."</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="mt-6">
          <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
            <CardHeader>
              <CardTitle className="text-slate-200 flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-400" />
                Mobilization Order History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {operationsQuery.isLoading ? (
                <div className="space-y-3">{[...Array(5)].map((_: any, i: number) => <Skeleton key={i} className="h-16" />)}</div>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <Radio className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p>Mobilization history will appear here after orders are issued.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
