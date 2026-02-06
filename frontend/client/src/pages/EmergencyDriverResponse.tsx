/**
 * EMERGENCY DRIVER RESPONSE — Driver-facing mobilization acceptance screen
 * Drivers see active mobilization orders and can accept/decline.
 * Shows "I Want You" poster-style callouts and mission details.
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
import { Progress } from '@/components/ui/progress';
import { Link } from 'wouter';
import {
  ArrowLeft, Shield, Flag, Truck, MapPin, Zap, Clock, CheckCircle,
  AlertTriangle, Target, Radio, Users, Star, Award, XCircle, Navigation
} from 'lucide-react';

export default function EmergencyDriverResponse() {
  const [selectedStatus, setSelectedStatus] = useState<Record<string, string>>({});

  const mobilizationsQuery = (trpc as any).emergencyResponse.getMyMobilizations.useQuery();

  const respondMutation = (trpc as any).emergencyResponse.respondToMobilization.useMutation({
    onSuccess: () => mobilizationsQuery.refetch(),
  });

  const updateStatusMutation = (trpc as any).emergencyResponse.updateMobilizationStatus.useMutation({
    onSuccess: () => mobilizationsQuery.refetch(),
  });

  const data = mobilizationsQuery.data;

  const urgencyColors: Record<string, string> = {
    FLASH: 'bg-red-500/30 text-red-300 border-red-500/50 animate-pulse',
    IMMEDIATE: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    PRIORITY: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    ROUTINE: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  };

  const TypeIcon = ({ type }: { type: string }) => {
    switch (type) {
      case 'CALL_TO_HAUL': return <Radio className="w-8 h-8 text-red-400" />;
      case 'I_WANT_YOU': return <Flag className="w-8 h-8 text-blue-400" />;
      case 'STRATEGIC_REPOSITION': return <MapPin className="w-8 h-8 text-green-400" />;
      case 'CONVOY_FORM': return <Truck className="w-8 h-8 text-purple-400" />;
      case 'GENERAL_ALERT': return <AlertTriangle className="w-8 h-8 text-yellow-400" />;
      default: return <Radio className="w-8 h-8 text-red-400" />;
    }
  };

  if (mobilizationsQuery.isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4">{[...Array(3)].map((_: any, i: number) => <Skeleton key={i} className="h-48" />)}</div>
      </div>
    );
  }

  if (mobilizationsQuery.isError) {
    return (
      <div className="p-6">
        <Card className="bg-red-900/20 border-red-500/30 rounded-xl">
          <CardContent className="p-8 text-center">
            <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-red-400" />
            <h2 className="text-lg font-bold text-red-400">Failed to Load Mobilizations</h2>
            <p className="text-sm text-slate-400 mt-2">{(mobilizationsQuery.error as any)?.message || 'Could not connect to emergency response backend.'}</p>
            <Button onClick={() => mobilizationsQuery.refetch()} className="mt-4 bg-red-600 hover:bg-red-700">Retry</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/the-haul/the-haul">
          <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent flex items-center gap-2">
            <Shield className="h-6 w-6 text-blue-400" />
            Emergency Mobilization
          </h1>
          <p className="text-slate-400 text-sm">Your country needs you. Answer the call.</p>
        </div>
        {data?.myActiveResponses?.length > 0 && (
          <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-lg px-3 py-1">
            {data.myActiveResponses.length} Active
          </Badge>
        )}
      </div>

      {/* Driver Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-full bg-green-500/20"><CheckCircle className="w-5 h-5 text-green-400" /></div>
            <div>
              <p className="text-xl font-bold text-green-400">{data?.myCompletedResponses?.length || 0}</p>
              <p className="text-xs text-slate-400">Missions Done</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-full bg-blue-500/20"><Target className="w-5 h-5 text-blue-400" /></div>
            <div>
              <p className="text-xl font-bold text-blue-400">{data?.totalLoadsCompleted || 0}</p>
              <p className="text-xs text-slate-400">Emergency Loads</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-full bg-yellow-500/20"><Navigation className="w-5 h-5 text-yellow-400" /></div>
            <div>
              <p className="text-xl font-bold text-yellow-400">{(data?.totalMilesHauled || 0).toLocaleString()}</p>
              <p className="text-xs text-slate-400">Emergency Miles</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-full bg-purple-500/20"><Award className="w-5 h-5 text-purple-400" /></div>
            <div>
              <p className="text-xl font-bold text-purple-400">{data?.myActiveResponses?.length || 0}</p>
              <p className="text-xs text-slate-400">Active Now</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Mobilization Orders */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
          <Radio className="w-5 h-5 text-red-400" />
          Active Mobilization Orders
        </h2>

        {data?.availableOrders?.length > 0 ? (
          data.availableOrders.map((order: any) => (
            <Card key={order.id} className={`rounded-xl border-2 transition-all ${
              order.type === 'I_WANT_YOU' ? 'bg-gradient-to-r from-blue-900/30 to-red-900/20 border-blue-500/30' :
              order.type === 'CALL_TO_HAUL' ? 'bg-gradient-to-r from-red-900/30 to-orange-900/20 border-red-500/30' :
              'bg-slate-800/50 border-slate-700/50'
            }`}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Type & Urgency Header */}
                    <div className="flex items-center gap-3 mb-3">
                      <TypeIcon type={order.type} />
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge className={urgencyColors[order.urgency]}>{order.urgency}</Badge>
                          <Badge variant="outline" className="text-xs capitalize">{order.type.replace(/_/g, ' ')}</Badge>
                        </div>
                        {order.operation && (
                          <p className="text-xs text-slate-500 mt-1">Operation: {order.operation.codeName} — Threat Level: {order.operation.threatLevel}</p>
                        )}
                      </div>
                    </div>

                    {/* Title & Message */}
                    <h3 className="text-xl font-bold text-slate-100">{order.title}</h3>
                    <p className="text-sm text-slate-300 mt-2">{order.message}</p>

                    {/* Incentives */}
                    <div className="flex flex-wrap gap-3 mt-4">
                      <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-yellow-500/10 border border-yellow-500/20">
                        <Zap className="w-4 h-4 text-yellow-400" />
                        <span className="text-sm font-bold text-yellow-400">{order.incentives?.surgePayMultiplier}x Pay</span>
                      </div>
                      <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20">
                        <Star className="w-4 h-4 text-blue-400" />
                        <span className="text-sm font-bold text-blue-400">+{order.incentives?.bonusXp} XP</span>
                      </div>
                      <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20">
                        <Target className="w-4 h-4 text-green-400" />
                        <span className="text-sm font-bold text-green-400">+{order.incentives?.bonusMiles} Miles</span>
                      </div>
                      {order.incentives?.cashBonus > 0 && (
                        <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                          <CheckCircle className="w-4 h-4 text-emerald-400" />
                          <span className="text-sm font-bold text-emerald-400">${order.incentives.cashBonus} Bonus</span>
                        </div>
                      )}
                    </div>

                    {/* Metadata */}
                    <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(order.sentAt).toLocaleString()}</span>
                      <span className="flex items-center gap-1"><Users className="w-3 h-3" />{order.recipientCount} drivers notified</span>
                      <span className="flex items-center gap-1"><CheckCircle className="w-3 h-3" />{order.acceptCount} accepted</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="ml-4 flex flex-col gap-2 min-w-[140px]">
                    {!order.myResponse ? (
                      <>
                        <Button
                          onClick={() => respondMutation.mutate({ mobilizationOrderId: order.id, accept: true })}
                          disabled={respondMutation.isPending}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          <Flag className="w-4 h-4 mr-2" />
                          ACCEPT
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => respondMutation.mutate({ mobilizationOrderId: order.id, accept: false })}
                          disabled={respondMutation.isPending}
                          className="border-slate-600 text-slate-400"
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Decline
                        </Button>
                      </>
                    ) : order.myResponse.status === 'ACCEPTED' || order.myResponse.status === 'EN_ROUTE' || order.myResponse.status === 'ON_STATION' || order.myResponse.status === 'HAULING' ? (
                      <div className="space-y-2">
                        <Badge className="w-full justify-center bg-green-500/20 text-green-400 border-green-500/30">
                          {order.myResponse.status}
                        </Badge>
                        <Select
                          value={selectedStatus[order.myResponse.id] || ''}
                          onValueChange={v => setSelectedStatus(s => ({ ...s, [order.myResponse.id]: v }))}
                        >
                          <SelectTrigger className="bg-slate-800 border-slate-700 text-xs">
                            <SelectValue placeholder="Update status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="EN_ROUTE">En Route</SelectItem>
                            <SelectItem value="ON_STATION">On Station</SelectItem>
                            <SelectItem value="HAULING">Hauling</SelectItem>
                            <SelectItem value="COMPLETED">Completed</SelectItem>
                          </SelectContent>
                        </Select>
                        {selectedStatus[order.myResponse.id] && (
                          <Button
                            size="sm"
                            className="w-full bg-blue-600 hover:bg-blue-700"
                            onClick={() => {
                              updateStatusMutation.mutate({
                                responseId: order.myResponse.id,
                                status: selectedStatus[order.myResponse.id],
                              });
                              setSelectedStatus(s => {
                                const next = { ...s };
                                delete next[order.myResponse.id];
                                return next;
                              });
                            }}
                            disabled={updateStatusMutation.isPending}
                          >
                            Update
                          </Button>
                        )}
                      </div>
                    ) : order.myResponse.status === 'COMPLETED' ? (
                      <Badge className="w-full justify-center bg-blue-500/20 text-blue-400 border-blue-500/30">
                        <CheckCircle className="w-4 h-4 mr-1" />
                        COMPLETED
                      </Badge>
                    ) : (
                      <Badge className="w-full justify-center bg-slate-500/20 text-slate-400">
                        DECLINED
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
            <CardContent className="p-12 text-center">
              <Shield className="w-16 h-16 mx-auto mb-4 text-slate-600 opacity-30" />
              <p className="text-lg font-medium text-slate-400">No Active Mobilization Orders</p>
              <p className="text-sm text-slate-500 mt-1">All clear. No emergency operations require driver mobilization at this time.</p>
              <p className="text-xs text-slate-600 mt-3 italic">"Stay ready so you don't have to get ready."</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Completed Emergency Missions */}
      {data?.myCompletedResponses?.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
            <Award className="w-5 h-5 text-yellow-400" />
            Completed Emergency Missions
          </h2>
          {data.myCompletedResponses.map((resp: any) => (
            <Card key={resp.id} className="bg-slate-800/50 border-slate-700/50 rounded-xl border-l-4 border-l-green-500">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-green-500/20">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-200">Emergency Response Mission</p>
                    <p className="text-xs text-slate-400">{resp.loadsCompleted} loads | {resp.milesHauled} miles | Completed {resp.completedAt ? new Date(resp.completedAt).toLocaleDateString() : 'N/A'}</p>
                  </div>
                </div>
                <Badge variant="outline" className="text-green-400 border-green-500/30">COMPLETED</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
