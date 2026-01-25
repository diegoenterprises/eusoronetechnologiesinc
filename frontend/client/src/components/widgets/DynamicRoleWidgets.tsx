/**
 * DYNAMIC ROLE WIDGETS
 * 100% Dynamic - Uses tRPC queries
 * Role-specific dashboard widgets with real data
 */

import React from 'react';
import { trpc } from '@/lib/trpc';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Truck, MapPin, Clock, AlertTriangle, Package, DollarSign,
  Shield, FileCheck, Activity, TrendingUp, Users, Wrench,
  Droplets, CheckCircle, XCircle, Calendar, Navigation
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ============= DRIVER WIDGETS =============

export const DriverHOSWidget: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { data, isLoading } = trpc.drivers.getMyHOSStatus.useQuery();

  if (isLoading) {
    return <Skeleton className="h-32 w-full rounded-lg" />;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-400">Current Status</span>
        <Badge className={cn(
          data?.status === 'driving' ? 'bg-green-500/20 text-green-400' :
          data?.status === 'on_duty' ? 'bg-blue-500/20 text-blue-400' :
          'bg-slate-500/20 text-slate-400'
        )}>
          {data?.status?.replace('_', ' ').toUpperCase()}
        </Badge>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="p-2 rounded-lg bg-green-900/20 border border-green-500/30">
          <p className="text-xs text-slate-400">Driving Left</p>
          <p className="text-lg font-bold text-green-400">{data?.drivingRemaining}</p>
        </div>
        <div className="p-2 rounded-lg bg-blue-900/20 border border-blue-500/30">
          <p className="text-xs text-slate-400">On-Duty Left</p>
          <p className="text-lg font-bold text-blue-400">{data?.onDutyRemaining}</p>
        </div>
      </div>
      {!compact && (
        <div className="p-2 rounded-lg bg-purple-900/20 border border-purple-500/30">
          <p className="text-xs text-slate-400">70hr Cycle Remaining</p>
          <p className="text-lg font-bold text-purple-400">{data?.cycleRemaining}</p>
        </div>
      )}
    </div>
  );
};

export const DriverCurrentLoadWidget: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { data, isLoading } = trpc.drivers.getCurrentAssignment.useQuery();

  if (isLoading) {
    return <Skeleton className="h-40 w-full rounded-lg" />;
  }

  if (!data) {
    return (
      <div className="p-4 text-center">
        <Package className="w-8 h-8 text-slate-500 mx-auto mb-2" />
        <p className="text-slate-400 text-sm">No active assignment</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-white font-bold">{data.loadNumber}</span>
        <Badge className="bg-green-500/20 text-green-400">{data.status?.replace('_', ' ')}</Badge>
      </div>
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm">
          <Package className="w-4 h-4 text-cyan-400" />
          <span className="text-white">{data.commodity}</span>
          {data.hazmat && (
            <Badge className="bg-orange-500/20 text-orange-400 text-xs">HAZMAT</Badge>
          )}
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <MapPin className="w-4 h-4" />
          <span>{data.origin?.city} → {data.destination?.city}</span>
        </div>
      </div>
      {!compact && (
        <>
          <div className="w-full">
            <div className="flex justify-between text-xs text-slate-400 mb-1">
              <span>Progress</span>
              <span>{data.milesCompleted}/{data.totalMiles} mi</span>
            </div>
            <Progress value={(data.milesCompleted / data.totalMiles) * 100} className="h-2" />
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">ETA</span>
            <span className="text-white font-medium">{data.eta}</span>
          </div>
        </>
      )}
    </div>
  );
};

export const DriverVehicleWidget: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { data, isLoading } = trpc.drivers.getAssignedVehicle.useQuery();

  if (isLoading) {
    return <Skeleton className="h-32 w-full rounded-lg" />;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Truck className="w-5 h-5 text-cyan-400" />
          <span className="text-white font-bold">{data?.unitNumber}</span>
        </div>
        <Badge className={cn(
          data?.status === 'operational' ? 'bg-green-500/20 text-green-400' :
          'bg-yellow-500/20 text-yellow-400'
        )}>
          {data?.status}
        </Badge>
      </div>
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="p-2 rounded-lg bg-slate-700/30">
          <p className="text-xs text-slate-500">Fuel</p>
          <p className="text-white font-medium">{data?.fuelLevel}%</p>
        </div>
        <div className="p-2 rounded-lg bg-slate-700/30">
          <p className="text-xs text-slate-500">DEF</p>
          <p className="text-white font-medium">{data?.defLevel}%</p>
        </div>
      </div>
      {!compact && (
        <div className="p-2 rounded-lg bg-amber-900/20 border border-amber-500/30">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">Next Service</span>
            <span className="text-sm font-medium text-amber-400">{data?.daysToService} days</span>
          </div>
        </div>
      )}
    </div>
  );
};

// ============= CATALYST/DISPATCH WIDGETS =============

export const CatalystFleetStatusWidget: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { data, isLoading } = trpc.catalysts.getFleetStats.useQuery();

  if (isLoading) {
    return <Skeleton className="h-32 w-full rounded-lg" />;
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        <div className="p-2 rounded-lg bg-green-900/20 text-center">
          <p className="text-xl font-bold text-green-400">{data?.inTransit}</p>
          <p className="text-xs text-slate-400">In Transit</p>
        </div>
        <div className="p-2 rounded-lg bg-blue-900/20 text-center">
          <p className="text-xl font-bold text-blue-400">{data?.loading}</p>
          <p className="text-xs text-slate-400">Loading</p>
        </div>
        <div className="p-2 rounded-lg bg-emerald-900/20 text-center">
          <p className="text-xl font-bold text-emerald-400">{data?.available}</p>
          <p className="text-xs text-slate-400">Available</p>
        </div>
      </div>
      {!compact && (
        <div className="grid grid-cols-2 gap-2">
          <div className="p-2 rounded-lg bg-orange-900/20 border border-orange-500/30">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-400" />
              <div>
                <p className="text-lg font-bold text-orange-400">{data?.issues}</p>
                <p className="text-xs text-slate-400">Issues</p>
              </div>
            </div>
          </div>
          <div className="p-2 rounded-lg bg-slate-700/30">
            <p className="text-lg font-bold text-white">{data?.utilization}%</p>
            <p className="text-xs text-slate-400">Utilization</p>
          </div>
        </div>
      )}
    </div>
  );
};

export const CatalystExceptionsWidget: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { data, isLoading } = trpc.catalysts.getExceptionStats.useQuery();

  if (isLoading) {
    return <Skeleton className="h-24 w-full rounded-lg" />;
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <div className="p-3 rounded-lg bg-red-900/20 border border-red-500/30">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <div>
              <p className="text-2xl font-bold text-red-400">{data?.critical}</p>
              <p className="text-xs text-slate-400">Critical</p>
            </div>
          </div>
        </div>
        <div className="p-3 rounded-lg bg-yellow-900/20 border border-yellow-500/30">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-yellow-400" />
            <div>
              <p className="text-2xl font-bold text-yellow-400">{data?.open}</p>
              <p className="text-xs text-slate-400">Open</p>
            </div>
          </div>
        </div>
      </div>
      {!compact && (
        <div className="flex items-center justify-between p-2 rounded-lg bg-green-900/20 border border-green-500/30">
          <span className="text-sm text-slate-400">Resolved Today</span>
          <span className="text-lg font-bold text-green-400">{data?.resolvedToday}</span>
        </div>
      )}
    </div>
  );
};

// ============= TERMINAL MANAGER WIDGETS =============

export const TerminalBaysWidget: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { data, isLoading } = trpc.terminals.getBayStats.useQuery();

  if (isLoading) {
    return <Skeleton className="h-32 w-full rounded-lg" />;
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        <div className="p-2 rounded-lg bg-green-900/20 text-center">
          <p className="text-xl font-bold text-green-400">{data?.available}</p>
          <p className="text-xs text-slate-400">Available</p>
        </div>
        <div className="p-2 rounded-lg bg-blue-900/20 text-center">
          <p className="text-xl font-bold text-blue-400">{data?.loading}</p>
          <p className="text-xs text-slate-400">Loading</p>
        </div>
        <div className="p-2 rounded-lg bg-yellow-900/20 text-center">
          <p className="text-xl font-bold text-yellow-400">{data?.maintenance}</p>
          <p className="text-xs text-slate-400">Maint.</p>
        </div>
      </div>
      {!compact && (
        <div className="p-2 rounded-lg bg-slate-700/30">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-slate-400">Utilization</span>
            <span className="text-sm font-bold text-white">{data?.utilization}%</span>
          </div>
          <Progress value={data?.utilization || 0} className="h-2" />
        </div>
      )}
    </div>
  );
};

export const TerminalInventoryWidget: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { data, isLoading } = trpc.terminals.getInventoryStats.useQuery();

  if (isLoading) {
    return <Skeleton className="h-32 w-full rounded-lg" />;
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <div className="p-3 rounded-lg bg-cyan-900/20 border border-cyan-500/30">
          <Droplets className="w-5 h-5 text-cyan-400 mb-1" />
          <p className="text-xl font-bold text-cyan-400">
            {((data?.currentInventory || 0) / 1000).toFixed(0)}K
          </p>
          <p className="text-xs text-slate-400">Total Gallons</p>
        </div>
        <div className="p-3 rounded-lg bg-purple-900/20 border border-purple-500/30">
          <Activity className="w-5 h-5 text-purple-400 mb-1" />
          <p className="text-xl font-bold text-purple-400">{data?.utilization}%</p>
          <p className="text-xs text-slate-400">Utilization</p>
        </div>
      </div>
      {!compact && (data?.lowLevelAlerts || 0) > 0 && (
        <div className="p-2 rounded-lg bg-red-900/20 border border-red-500/30">
          <p className="text-sm text-red-400 font-medium">{data?.lowLevelAlerts} Low Level Alert(s)</p>
        </div>
      )}
    </div>
  );
};

// ============= ESCORT WIDGETS =============

export const EscortUpcomingJobsWidget: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { data, isLoading } = trpc.escorts.getUpcomingJobs.useQuery();

  if (isLoading) {
    return <Skeleton className="h-32 w-full rounded-lg" />;
  }

  return (
    <div className="space-y-2">
      {data?.slice(0, compact ? 2 : 3).map((job: any) => (
        <div key={job.id} className="p-2 rounded-lg bg-slate-700/30 border border-slate-600/30">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-white font-medium">{job.convoyName}</span>
            <Badge className={cn(
              job.position === 'lead' ? 'bg-cyan-500/20 text-cyan-400' :
              job.position === 'chase' ? 'bg-orange-500/20 text-orange-400' :
              'bg-purple-500/20 text-purple-400'
            )}>
              {job.position}
            </Badge>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>{job.date} - {job.route}</span>
            <span className="text-green-400 font-medium">${job.rate}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export const EscortPermitsWidget: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { data, isLoading } = trpc.escorts.getPermitStats.useQuery();

  if (isLoading) {
    return <Skeleton className="h-24 w-full rounded-lg" />;
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <div className="p-3 rounded-lg bg-green-900/20 border border-green-500/30">
          <Shield className="w-5 h-5 text-green-400 mb-1" />
          <p className="text-xl font-bold text-green-400">{data?.activePermits}</p>
          <p className="text-xs text-slate-400">Active Permits</p>
        </div>
        <div className="p-3 rounded-lg bg-blue-900/20 border border-blue-500/30">
          <MapPin className="w-5 h-5 text-blue-400 mb-1" />
          <p className="text-xl font-bold text-blue-400">{data?.statesCovered}</p>
          <p className="text-xs text-slate-400">States</p>
        </div>
      </div>
      {!compact && (data?.expiringSoon || 0) > 0 && (
        <div className="p-2 rounded-lg bg-yellow-900/20 border border-yellow-500/30">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-yellow-400" />
            <span className="text-sm text-yellow-400">{data?.expiringSoon} permit(s) expiring soon</span>
          </div>
        </div>
      )}
    </div>
  );
};

// ============= COMPLIANCE WIDGETS =============

export const ComplianceViolationsWidget: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { data, isLoading } = trpc.compliance.getViolationStats.useQuery();

  if (isLoading) {
    return <Skeleton className="h-24 w-full rounded-lg" />;
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        <div className="p-2 rounded-lg bg-red-900/20 text-center">
          <p className="text-xl font-bold text-red-400">{data?.open}</p>
          <p className="text-xs text-slate-400">Open</p>
        </div>
        <div className="p-2 rounded-lg bg-orange-900/20 text-center">
          <p className="text-xl font-bold text-orange-400">{data?.critical}</p>
          <p className="text-xs text-slate-400">Critical</p>
        </div>
        <div className="p-2 rounded-lg bg-green-900/20 text-center">
          <p className="text-xl font-bold text-green-400">{data?.resolved}</p>
          <p className="text-xs text-slate-400">Resolved</p>
        </div>
      </div>
      {!compact && (
        <div className="p-2 rounded-lg bg-slate-700/30">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">Avg Resolution</span>
            <span className="text-lg font-bold text-cyan-400">{data?.avgResolutionDays} days</span>
          </div>
        </div>
      )}
    </div>
  );
};

// ============= SAFETY WIDGETS =============

export const SafetyIncidentsWidget: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { data, isLoading } = trpc.safety.getIncidentStats.useQuery();

  if (isLoading) {
    return <Skeleton className="h-32 w-full rounded-lg" />;
  }

  return (
    <div className="space-y-3">
      <div className="p-4 rounded-lg bg-gradient-to-r from-green-900/30 to-emerald-900/30 border border-green-500/30 text-center">
        <p className="text-3xl font-bold text-green-400">{data?.daysWithoutIncident}</p>
        <p className="text-xs text-slate-300">Days Without Incident</p>
      </div>
      {!compact && (
        <div className="grid grid-cols-2 gap-2">
          <div className="p-2 rounded-lg bg-blue-900/20 text-center">
            <p className="text-xl font-bold text-blue-400">{data?.open}</p>
            <p className="text-xs text-slate-400">Open</p>
          </div>
          <div className="p-2 rounded-lg bg-purple-900/20 text-center">
            <p className="text-xl font-bold text-purple-400">{data?.investigating}</p>
            <p className="text-xs text-slate-400">Investigating</p>
          </div>
        </div>
      )}
    </div>
  );
};

export const SafetyCSAScoresWidget: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { data, isLoading } = trpc.safety.getCSAScores.useQuery();

  if (isLoading) {
    return <Skeleton className="h-32 w-full rounded-lg" />;
  }

  const scores = data?.basics || [];
  
  return (
    <div className="space-y-2">
      {scores.slice(0, compact ? 3 : 5).map((score: any, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <span className="text-xs text-slate-400 w-24 truncate">{score.name}</span>
          <div className="flex-1">
            <Progress 
              value={score.percentile} 
              className={cn(
                "h-2",
                score.percentile > 75 ? "[&>div]:bg-red-500" :
                score.percentile > 50 ? "[&>div]:bg-yellow-500" :
                "[&>div]:bg-green-500"
              )}
            />
          </div>
          <span className={cn(
            "text-xs font-medium w-8",
            score.percentile > 75 ? "text-red-400" :
            score.percentile > 50 ? "text-yellow-400" :
            "text-green-400"
          )}>
            {score.percentile}%
          </span>
        </div>
      ))}
    </div>
  );
};

// ============= BROKER WIDGETS =============

export const BrokerMarketplaceWidget: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { data, isLoading } = trpc.brokers.getMarketplaceStats.useQuery();

  if (isLoading) {
    return <Skeleton className="h-24 w-full rounded-lg" />;
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <div className="p-3 rounded-lg bg-blue-900/20 border border-blue-500/30">
          <Package className="w-5 h-5 text-blue-400 mb-1" />
          <p className="text-xl font-bold text-blue-400">{data?.availableLoads}</p>
          <p className="text-xs text-slate-400">Available</p>
        </div>
        <div className="p-3 rounded-lg bg-green-900/20 border border-green-500/30">
          <TrendingUp className="w-5 h-5 text-green-400 mb-1" />
          <p className="text-xl font-bold text-green-400">{data?.pendingMatches}</p>
          <p className="text-xs text-slate-400">Pending Matches</p>
        </div>
      </div>
      {!compact && (
        <div className="p-2 rounded-lg bg-purple-900/20 border border-purple-500/30">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">Avg Margin</span>
            <span className="text-lg font-bold text-purple-400">{data?.avgMargin?.toFixed(1)}%</span>
          </div>
        </div>
      )}
    </div>
  );
};

export const BrokerCommissionWidget: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { data, isLoading } = trpc.brokers.getCommissionSummary.useQuery({});

  if (isLoading) {
    return <Skeleton className="h-24 w-full rounded-lg" />;
  }

  const totalCommission = data?.breakdown?.reduce((sum: number, b: any) => sum + b.amount, 0) || 0;
  const totalLoads = data?.breakdown?.reduce((sum: number, b: any) => sum + b.loads, 0) || 0;

  return (
    <div className="space-y-3">
      <div className="p-4 rounded-lg bg-gradient-to-r from-green-900/30 to-emerald-900/30 border border-green-500/30">
        <DollarSign className="w-6 h-6 text-green-400 mb-1" />
        <p className="text-2xl font-bold text-green-400">
          ${totalCommission.toLocaleString()}
        </p>
        <p className="text-xs text-slate-400">This Month</p>
      </div>
      {!compact && (
        <div className="grid grid-cols-2 gap-2 text-center">
          <div className="p-2 rounded-lg bg-slate-700/30">
            <p className="text-sm font-bold text-white">{totalLoads}</p>
            <p className="text-xs text-slate-400">Loads</p>
          </div>
          <div className="p-2 rounded-lg bg-slate-700/30">
            <p className="text-sm font-bold text-white">${data?.total?.toLocaleString() || 0}</p>
            <p className="text-xs text-slate-400">Total</p>
          </div>
        </div>
      )}
    </div>
  );
};
