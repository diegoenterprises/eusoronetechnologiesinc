import { useState } from "react";
import {
  RefreshCw, Play, Pause, CheckCircle, XCircle, Clock, AlertTriangle,
  Activity, Database, Wifi, Server, ChevronDown, ChevronUp,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";

export default function SyncDashboard() {
  const [expandedJob, setExpandedJob] = useState<string | null>(null);
  const [logSource, setLogSource] = useState<string | undefined>(undefined);

  const syncStatus = trpc.hotZones.getSyncStatus.useQuery(undefined, { refetchInterval: 5000 });
  const syncLog = trpc.hotZones.getSyncLog.useQuery({ limit: 30, sourceName: logSource }, { refetchInterval: 10000 });
  const dataEventsQ = trpc.hotZones.getDataEvents.useQuery({ limit: 20 }, { refetchInterval: 10000 });

  const triggerSync = trpc.hotZones.triggerSync.useMutation({
    onSuccess: () => syncStatus.refetch(),
  });
  const setSyncEnabled = trpc.hotZones.setSyncJobEnabled.useMutation({
    onSuccess: () => syncStatus.refetch(),
  });

  const data = syncStatus.data;
  if (!data) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
        Loading sync dashboard...
      </div>
    );
  }

  const { orchestrator, jobs, cache, events } = data;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Data Sync Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Hot Zones data orchestrator -- 22+ government data sources
          </p>
        </div>
        <button
          onClick={() => syncStatus.refetch()}
          className="flex items-center gap-2 px-3 py-2 rounded-md bg-primary text-primary-foreground text-sm hover:opacity-90"
        >
          <RefreshCw className={cn("h-4 w-4", syncStatus.isFetching && "animate-spin")} />
          Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <SummaryCard icon={Server} label="Total Jobs" value={orchestrator.totalJobs} color="text-blue-600" />
        <SummaryCard icon={CheckCircle} label="Enabled" value={orchestrator.enabledJobs} color="text-emerald-600" />
        <SummaryCard icon={Activity} label="Running" value={orchestrator.runningJobs} color="text-amber-600" />
        <SummaryCard icon={XCircle} label="Failed" value={orchestrator.failedJobs} color="text-red-600" />
        <SummaryCard icon={Pause} label="Disabled" value={orchestrator.disabledJobs} color="text-gray-500" />
      </div>

      {/* Cache Stats */}
      <div className="rounded-lg border bg-card p-4">
        <h2 className="text-sm font-semibold flex items-center gap-2 mb-3">
          <Database className="h-4 w-4" /> Smart Cache
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Total Keys:</span>{" "}
            <span className="font-medium">{cache.totalKeys}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Fresh:</span>{" "}
            <span className="font-medium text-emerald-600">{cache.freshKeys}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Stale:</span>{" "}
            <span className="font-medium text-amber-600">{cache.staleKeys}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Refreshing:</span>{" "}
            <span className="font-medium text-blue-600">{cache.pendingRefreshes.length}</span>
          </div>
        </div>
      </div>

      {/* Critical Events Banner */}
      {events.critical > 0 && (
        <div className="rounded-lg border border-red-300 bg-red-50 dark:bg-red-900/20 p-4 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0" />
          <div>
            <span className="font-semibold text-red-700 dark:text-red-400">
              {events.critical} Critical Event{events.critical > 1 ? "s" : ""}
            </span>
            <span className="text-sm text-red-600 dark:text-red-300 ml-2">in the last hour</span>
          </div>
        </div>
      )}

      {/* Jobs Table */}
      <div className="rounded-lg border bg-card overflow-hidden">
        <div className="px-4 py-3 border-b bg-muted/30">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <Wifi className="h-4 w-4" /> Sync Jobs ({jobs.length})
          </h2>
        </div>
        <div className="divide-y">
          {jobs.map((job) => (
            <div key={job.id}>
              <div
                className="flex items-center gap-3 px-4 py-3 hover:bg-muted/20 cursor-pointer"
                onClick={() => setExpandedJob(expandedJob === job.id ? null : job.id)}
              >
                {/* Status indicator */}
                <span className={cn("h-2.5 w-2.5 rounded-full flex-shrink-0",
                  job.running ? "bg-blue-500 animate-pulse" :
                  !job.enabled ? "bg-gray-400" :
                  job.consecutiveFailures > 0 ? "bg-red-500" :
                  "bg-emerald-500"
                )} />

                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{job.label}</div>
                  <div className="text-xs text-muted-foreground">{job.schedule}</div>
                </div>

                <div className="hidden md:flex items-center gap-4 text-xs text-muted-foreground">
                  <span>{job.totalSuccesses}/{job.totalRuns} OK</span>
                  {job.lastSuccessAt && (
                    <span title={job.lastSuccessAt}>
                      <Clock className="h-3 w-3 inline mr-1" />
                      {formatAge(job.lastSuccessAt)}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); triggerSync.mutate({ jobId: job.id }); }}
                    disabled={triggerSync.isPending || job.running}
                    className="p-1.5 rounded hover:bg-muted transition-colors"
                    title="Run now"
                  >
                    <Play className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSyncEnabled.mutate({ jobId: job.id, enabled: !job.enabled });
                    }}
                    className={cn("p-1.5 rounded hover:bg-muted transition-colors",
                      !job.enabled && "text-red-500"
                    )}
                    title={job.enabled ? "Disable" : "Enable"}
                  >
                    {job.enabled ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5 text-emerald-600" />}
                  </button>
                  {expandedJob === job.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </div>

              {/* Expanded details */}
              {expandedJob === job.id && (
                <div className="px-4 py-3 bg-muted/10 border-t text-xs space-y-2">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <Detail label="Data Type" value={job.dataType} />
                    <Detail label="Total Runs" value={String(job.totalRuns)} />
                    <Detail label="Successes" value={String(job.totalSuccesses)} />
                    <Detail label="Failures" value={String(job.totalFailures)} highlight={job.totalFailures > 0} />
                    <Detail label="Consecutive Failures" value={String(job.consecutiveFailures)} highlight={job.consecutiveFailures > 0} />
                    <Detail label="Last Run" value={job.lastRunAt ? formatAge(job.lastRunAt) : "Never"} />
                    <Detail label="Last Success" value={job.lastSuccessAt ? formatAge(job.lastSuccessAt) : "Never"} />
                    <Detail label="Enabled" value={job.enabled ? "Yes" : "No"} highlight={!job.enabled} />
                  </div>
                  {job.lastError && (
                    <div className="mt-2 p-2 rounded bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 font-mono text-[11px] break-all">
                      {job.lastError}
                    </div>
                  )}
                  {job.disabledReason && (
                    <div className="mt-2 p-2 rounded bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 text-[11px]">
                      {job.disabledReason}
                    </div>
                  )}
                  <button
                    onClick={() => setLogSource(job.id)}
                    className="text-primary hover:underline"
                  >
                    View sync logs for this job
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Recent Events */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="rounded-lg border bg-card overflow-hidden">
          <div className="px-4 py-3 border-b bg-muted/30">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" /> Recent Events
            </h2>
          </div>
          <div className="divide-y max-h-80 overflow-y-auto">
            {(dataEventsQ.data?.events || []).map((evt, i) => (
              <div key={i} className="px-4 py-2 text-xs flex items-start gap-2">
                <span className={cn("mt-0.5 h-2 w-2 rounded-full flex-shrink-0",
                  evt.severity === "CRITICAL" ? "bg-red-500" :
                  evt.severity === "WARNING" ? "bg-amber-500" : "bg-blue-400"
                )} />
                <div className="flex-1">
                  <div className="font-medium">{evt.type}</div>
                  <div className="text-muted-foreground">{evt.summary}</div>
                  <div className="text-muted-foreground mt-0.5">{formatAge(evt.timestamp)}</div>
                </div>
              </div>
            ))}
            {(!dataEventsQ.data?.events || dataEventsQ.data.events.length === 0) && (
              <div className="p-4 text-center text-sm text-muted-foreground">No recent events</div>
            )}
          </div>
        </div>

        {/* Sync Logs */}
        <div className="rounded-lg border bg-card overflow-hidden">
          <div className="px-4 py-3 border-b bg-muted/30 flex items-center justify-between">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <Database className="h-4 w-4" /> Sync Logs
              {logSource && <span className="text-muted-foreground font-normal">({logSource})</span>}
            </h2>
            {logSource && (
              <button onClick={() => setLogSource(undefined)} className="text-xs text-primary hover:underline">
                Show all
              </button>
            )}
          </div>
          <div className="divide-y max-h-80 overflow-y-auto">
            {(syncLog.data?.logs || []).map((log: any, i: number) => (
              <div key={i} className="px-4 py-2 text-xs flex items-center gap-2">
                <span className={cn("h-2 w-2 rounded-full flex-shrink-0",
                  log.status === "SUCCESS" ? "bg-emerald-500" :
                  log.status === "FAILED" ? "bg-red-500" :
                  "bg-blue-400"
                )} />
                <span className="font-medium w-24 truncate">{log.sourceName}</span>
                <span className={cn("px-1.5 py-0.5 rounded text-[10px] font-medium",
                  log.status === "SUCCESS" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" :
                  log.status === "FAILED" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
                  "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                )}>
                  {log.status}
                </span>
                <span className="text-muted-foreground flex-1 text-right">
                  {log.startedAt ? formatAge(typeof log.startedAt === "string" ? log.startedAt : new Date(log.startedAt).toISOString()) : ""}
                </span>
              </div>
            ))}
            {(!syncLog.data?.logs || syncLog.data.logs.length === 0) && (
              <div className="p-4 text-center text-sm text-muted-foreground">No sync logs</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: number; color: string }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
        <Icon className={cn("h-3.5 w-3.5", color)} />
        {label}
      </div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}

function Detail({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <span className="text-muted-foreground">{label}:</span>{" "}
      <span className={cn("font-medium", highlight && "text-red-600")}>{value}</span>
    </div>
  );
}

function formatAge(isoString: string): string {
  const seconds = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
  if (seconds < 0) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}
