/**
 * DATA MIGRATION & SYSTEM STRESS TESTING PAGE
 * 100% Dynamic - No mock data
 * UI Style: Gradient headers, stat cards with icons, rounded cards, dark theme
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  Database, Upload, Download, Activity, Shield,
  CheckCircle, Clock, AlertTriangle, XCircle,
  Play, RefreshCw, FileText, Settings, Zap,
  Server, HardDrive, Cpu, BarChart3, ArrowRight,
  Search, ArrowUpDown, Eye, Trash2, Copy, Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useTheme } from "@/contexts/ThemeContext";

// ────────────────────────────────────────
// Status badge helper
// ────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "completed":
    case "healthy":
    case "passed":
    case "stable":
      return <Badge className="bg-green-500/20 text-green-400 border-0"><CheckCircle className="w-3 h-3 mr-1" />{status}</Badge>;
    case "running":
    case "importing":
    case "processing":
    case "validating":
      return <Badge className="bg-blue-500/20 text-blue-400 border-0"><Clock className="w-3 h-3 mr-1" />{status}</Badge>;
    case "warning":
    case "degraded":
    case "beta":
      return <Badge className="bg-yellow-500/20 text-yellow-400 border-0"><AlertTriangle className="w-3 h-3 mr-1" />{status}</Badge>;
    case "failed":
    case "error":
    case "critical":
      return <Badge className="bg-red-500/20 text-red-400 border-0"><XCircle className="w-3 h-3 mr-1" />{status}</Badge>;
    default:
      return <Badge className="bg-slate-500/20 text-slate-400 border-0">{status}</Badge>;
  }
}

function StatCard({ icon: Icon, label, value, sub, color = "cyan", isLight }: {
  icon: React.ElementType; label: string; value: string | number; sub?: string; color?: string; isLight?: boolean;
}) {
  const colorMapDark: Record<string, string> = {
    cyan: "from-cyan-600/20 to-cyan-800/10 border-cyan-700/30",
    green: "from-green-600/20 to-green-800/10 border-green-700/30",
    blue: "from-blue-600/20 to-blue-800/10 border-blue-700/30",
    yellow: "from-yellow-600/20 to-yellow-800/10 border-yellow-700/30",
    red: "from-red-600/20 to-red-800/10 border-red-700/30",
    purple: "from-purple-600/20 to-purple-800/10 border-purple-700/30",
    slate: "from-slate-600/20 to-slate-800/10 border-slate-700/30",
  };
  const colorMapLight: Record<string, string> = {
    cyan: "bg-white border-slate-200 shadow-sm",
    green: "bg-white border-slate-200 shadow-sm",
    blue: "bg-white border-slate-200 shadow-sm",
    yellow: "bg-white border-slate-200 shadow-sm",
    red: "bg-white border-slate-200 shadow-sm",
    purple: "bg-white border-slate-200 shadow-sm",
    slate: "bg-white border-slate-200 shadow-sm",
  };
  return (
    <Card className={cn("border rounded-xl", isLight ? (colorMapLight[color] || colorMapLight.cyan) : cn("bg-gradient-to-br", colorMapDark[color] || colorMapDark.cyan))}>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={cn("p-2 rounded-lg", isLight ? "bg-slate-100" : "bg-slate-800/50")}><Icon className={cn("w-5 h-5", isLight ? "text-slate-600" : "text-slate-300")} /></div>
          <div>
            <p className={cn("text-xs", isLight ? "text-slate-500" : "text-slate-400")}>{label}</p>
            <p className={cn("text-xl font-bold", isLight ? "text-slate-900" : "text-white")}>{value}</p>
            {sub && <p className="text-xs text-slate-500">{sub}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ────────────────────────────────────────
// TAB: Migration Dashboard
// ────────────────────────────────────────
function MigrationDashboardTab() {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const dashQ = (trpc as any).dataMigration.getMigrationDashboard.useQuery(undefined, { refetchInterval: 5000 });
  const sourcesQ = (trpc as any).dataMigration.getSupportedSources.useQuery();
  const historyQ = (trpc as any).dataMigration.getMigrationHistory.useQuery({ page: 1, limit: 10 });

  const [selectedSource, setSelectedSource] = useState("");
  const [selectedEntities, setSelectedEntities] = useState<string[]>([]);

  const startMut = (trpc as any).dataMigration.startMigration.useMutation({
    onSuccess: (d: any) => { toast.success(`Migration started (Job ${d.jobId})`); dashQ.refetch(); historyQ.refetch(); },
    onError: (e: any) => toast.error("Migration failed", { description: e.message }),
  });

  const dash = dashQ.data;
  const sources = sourcesQ.data?.sources || [];

  const entityOptions = ["loads", "drivers", "carriers", "shippers", "equipment", "rates", "contacts", "invoices"];

  const toggleEntity = (e: string) => {
    setSelectedEntities((prev) => prev.includes(e) ? prev.filter((x) => x !== e) : [...prev, e]);
  };

  if (dashQ.isLoading) {
    return <div className="space-y-4">{Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-24 bg-slate-800/50 rounded-xl" />)}</div>;
  }

  return (
    <div className="space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard icon={Activity} label="Active Jobs" value={dash?.activeJobs || 0} color="blue" />
        <StatCard icon={CheckCircle} label="Completed" value={dash?.completedMigrations || 0} color="green" />
        <StatCard icon={XCircle} label="Failed" value={dash?.failedMigrations || 0} color="red" />
        <StatCard icon={Database} label="Records Migrated" value={(dash?.totalRecordsMigrated || 0).toLocaleString()} color="cyan" />
        <StatCard icon={BarChart3} label="Quality Score" value={`${dash?.dataQualityScore || 0}%`} color="purple" />
      </div>

      {/* Start new migration */}
      <Card className={cn("rounded-xl border", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-900/50 border-slate-700/50")}>
        <CardHeader><CardTitle className="text-white flex items-center gap-2"><Upload className="w-5 h-5 text-cyan-400" /> Start New Migration</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-slate-400 mb-2">Source TMS Platform</p>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
              {sources.map((s: any) => (
                <button
                  key={s.id}
                  onClick={() => setSelectedSource(s.id)}
                  className={cn(
                    "p-3 rounded-lg border text-left transition-all text-sm",
                    selectedSource === s.id
                      ? "border-cyan-500 bg-cyan-500/10 text-cyan-300"
                      : "border-slate-700 bg-slate-800/50 text-slate-300 hover:border-slate-500",
                  )}
                >
                  <div className="font-medium truncate">{s.name}</div>
                  <StatusBadge status={s.status} />
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-sm text-slate-400 mb-2">Entity Types to Import</p>
            <div className="flex flex-wrap gap-2">
              {entityOptions.map((e) => (
                <button
                  key={e}
                  onClick={() => toggleEntity(e)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg border text-sm capitalize transition-all",
                    selectedEntities.includes(e)
                      ? "border-cyan-500 bg-cyan-500/10 text-cyan-300"
                      : "border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-500",
                  )}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>
          <Button
            className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 rounded-lg"
            disabled={!selectedSource || selectedEntities.length === 0 || startMut.isPending}
            onClick={() => startMut.mutate({ source: selectedSource, entityTypes: selectedEntities })}
          >
            <Play className="w-4 h-4 mr-2" />{startMut.isPending ? "Starting..." : "Start Migration"}
          </Button>
        </CardContent>
      </Card>

      {/* Active / recent jobs */}
      <Card className={cn("rounded-xl border", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-900/50 border-slate-700/50")}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white flex items-center gap-2"><Clock className="w-5 h-5 text-blue-400" /> Recent Jobs</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => { dashQ.refetch(); historyQ.refetch(); }}><RefreshCw className="w-4 h-4" /></Button>
          </div>
        </CardHeader>
        <CardContent>
          {(dash?.recentJobs || []).length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-6">No migration jobs yet. Start your first migration above.</p>
          ) : (
            <div className="space-y-3">
              {(dash?.recentJobs || []).map((j: any) => (
                <div key={j.id} className={cn("p-3 rounded-lg border", isLight ? "bg-slate-50 border-slate-200" : "bg-slate-800/50 border-slate-700/50")}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white capitalize">{j.source}</span>
                      <StatusBadge status={j.status} />
                    </div>
                    <span className="text-xs text-slate-500">{new Date(j.startedAt).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-400">
                    <span>{j.entityTypes.join(", ")}</span>
                    <span>{j.processedRecords.toLocaleString()} / {j.totalRecords.toLocaleString()} records</span>
                    {j.failedRecords > 0 && <span className="text-red-400">{j.failedRecords} failed</span>}
                  </div>
                  <Progress value={j.progress} className="mt-2 h-1.5" />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ────────────────────────────────────────
// TAB: Field Mapping
// ────────────────────────────────────────
function FieldMappingTab() {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const [source, setSource] = useState("mcleod");
  const [entityType, setEntityType] = useState("loads");

  const mappingQ = (trpc as any).dataMigration.getFieldMapping.useQuery({ source, entityType });
  const saveMut = (trpc as any).dataMigration.configureFieldMapping.useMutation({
    onSuccess: () => toast.success("Field mapping saved"),
    onError: (e: any) => toast.error("Save failed", { description: e.message }),
  });

  const mappings = mappingQ.data?.mappings || [];
  const transforms = mappingQ.data?.availableTransforms || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-4">
        <div>
          <p className="text-xs text-slate-400 mb-1">Source TMS</p>
          <Select value={source} onValueChange={setSource}>
            <SelectTrigger className="w-48 bg-slate-800 border-slate-700 text-slate-200"><SelectValue /></SelectTrigger>
            <SelectContent>
              {["mcleod", "tmw", "mercurygate", "aljex", "tailwind", "csv", "excel"].map((s) => (
                <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <p className="text-xs text-slate-400 mb-1">Entity Type</p>
          <Select value={entityType} onValueChange={setEntityType}>
            <SelectTrigger className="w-48 bg-slate-800 border-slate-700 text-slate-200"><SelectValue /></SelectTrigger>
            <SelectContent>
              {["loads", "drivers", "carriers", "shippers", "equipment", "rates", "contacts", "invoices"].map((e) => (
                <SelectItem key={e} value={e} className="capitalize">{e}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card className={cn("rounded-xl border", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-900/50 border-slate-700/50")}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white flex items-center gap-2"><Settings className="w-5 h-5 text-purple-400" /> Field Mappings</CardTitle>
            <Button
              size="sm"
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-lg"
              disabled={saveMut.isPending}
              onClick={() => saveMut.mutate({ source, entityType, mappings })}
            >
              {saveMut.isPending ? "Saving..." : "Save Mapping"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {mappingQ.isLoading ? (
            <div className="space-y-2">{Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-10 bg-slate-800/50" />)}</div>
          ) : mappings.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-6">No default mappings for this combination. Add custom mappings below.</p>
          ) : (
            <div className="space-y-1">
              <div className="grid grid-cols-12 gap-2 text-xs text-slate-500 font-medium px-2 py-1">
                <div className="col-span-4">Source Field</div>
                <div className="col-span-1 text-center"><ArrowRight className="w-3 h-3 mx-auto" /></div>
                <div className="col-span-3">Target Field</div>
                <div className="col-span-2">Transform</div>
                <div className="col-span-2">Required</div>
              </div>
              {mappings.map((m: any, i: number) => (
                <div key={i} className={cn("grid grid-cols-12 gap-2 items-center p-2 rounded-lg border", isLight ? "bg-slate-50 border-slate-200" : "bg-slate-800/30 border-slate-700/30")}>
                  <div className="col-span-4 text-sm text-slate-300 font-mono">{m.sourceField}</div>
                  <div className="col-span-1 text-center"><ArrowRight className="w-3 h-3 text-slate-600" /></div>
                  <div className="col-span-3 text-sm text-cyan-400 font-mono">{m.targetField}</div>
                  <div className="col-span-2 text-xs text-slate-400">{m.transform || "none"}</div>
                  <div className="col-span-2">
                    {m.required ? <Badge className="bg-red-500/20 text-red-400 border-0 text-xs">Required</Badge>
                      : <Badge className="bg-slate-600/20 text-slate-500 border-0 text-xs">Optional</Badge>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {transforms.length > 0 && (
            <div className="mt-6">
              <p className="text-xs text-slate-400 mb-2">Available Transforms</p>
              <div className="flex flex-wrap gap-2">
                {transforms.map((t: any) => (
                  <span key={t.id} className="text-xs bg-slate-800/50 border border-slate-700/30 rounded px-2 py-1 text-slate-400" title={t.description}>
                    {t.id}
                  </span>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ────────────────────────────────────────
// TAB: Bulk Import
// ────────────────────────────────────────
function BulkImportTab() {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const templatesQ = (trpc as any).dataMigration.getBulkImportTemplates.useQuery();
  const templates = templatesQ.data?.templates || [];

  return (
    <div className="space-y-6">
      <Card className={cn("rounded-xl border", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-900/50 border-slate-700/50")}>
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2"><FileText className="w-5 h-5 text-green-400" /> Import Templates</CardTitle>
        </CardHeader>
        <CardContent>
          {templatesQ.isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">{Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-28 bg-slate-800/50 rounded-xl" />)}</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {templates.map((t: any) => (
                <div key={t.id} className={cn("p-4 rounded-xl border transition-all", isLight ? "bg-white border-slate-200 hover:border-slate-400 shadow-sm" : "bg-slate-800/40 border-slate-700/40 hover:border-slate-600/60")}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-white">{t.name}</span>
                    <Badge className="bg-slate-600/20 text-slate-400 border-0 text-xs uppercase">{t.format}</Badge>
                  </div>
                  <p className="text-xs text-slate-500 mb-3">{t.description}</p>
                  <p className="text-xs text-slate-600 mb-3">{t.columns.length} columns: {t.columns.slice(0, 4).join(", ")}{t.columns.length > 4 ? ` +${t.columns.length - 4} more` : ""}</p>
                  <Button size="sm" variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700/50 rounded-lg w-full">
                    <Download className="w-3 h-3 mr-2" />Download Template
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className={cn("rounded-xl border", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-900/50 border-slate-700/50")}>
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2"><Upload className="w-5 h-5 text-blue-400" /> Upload Data File</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border-2 border-dashed border-slate-700 rounded-xl p-12 text-center hover:border-slate-500 transition-all cursor-pointer">
            <Upload className="w-10 h-10 text-slate-500 mx-auto mb-3" />
            <p className="text-sm text-slate-400">Drag & drop your CSV, Excel, or JSON file here</p>
            <p className="text-xs text-slate-600 mt-1">Or click to browse files</p>
            <p className="text-xs text-slate-600 mt-4">Supported: .csv, .xlsx, .json (max 50MB)</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ────────────────────────────────────────
// TAB: Data Quality
// ────────────────────────────────────────
function DataQualityTab() {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const qualityQ = (trpc as any).dataMigration.getDataQualityReport.useQuery({});
  const cleanupMut = (trpc as any).dataMigration.cleanupDuplicates.useMutation({
    onSuccess: (d: any) => toast.success(`Found ${d.duplicatesFound} duplicates, merged ${d.recordsMerged}`),
    onError: (e: any) => toast.error("Cleanup failed", { description: e.message }),
  });

  const data = qualityQ.data;

  if (qualityQ.isLoading) {
    return <div className="space-y-4">{Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-40 bg-slate-800/50 rounded-xl" />)}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard icon={BarChart3} label="Overall Quality Score" value={`${Math.round(data?.overallScore || 0)}%`} color="green" />
        <StatCard icon={Search} label="Last Analyzed" value={data?.lastAnalyzed ? new Date(data.lastAnalyzed).toLocaleString() : "N/A"} color="slate" />
        <StatCard icon={Database} label="Entities Analyzed" value={data?.entities?.length || 0} color="blue" />
      </div>

      {(data?.entities || []).map((entity: any) => (
        <Card key={entity.entityType} className={cn("rounded-xl border", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-900/50 border-slate-700/50")}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-white capitalize">{entity.entityType} ({entity.totalRecords.toLocaleString()} records)</CardTitle>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="border-slate-600 text-slate-300 rounded-lg"
                  disabled={cleanupMut.isPending}
                  onClick={() => cleanupMut.mutate({ entityType: entity.entityType, strategy: "merge", dryRun: true })}
                >
                  <Eye className="w-3 h-3 mr-1" />Preview Duplicates
                </Button>
                <Button
                  size="sm"
                  className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 rounded-lg"
                  disabled={cleanupMut.isPending}
                  onClick={() => cleanupMut.mutate({ entityType: entity.entityType, strategy: "merge" })}
                >
                  <Trash2 className="w-3 h-3 mr-1" />Merge Duplicates
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-400">{Math.round(entity.completenessScore)}%</p>
                <p className="text-xs text-slate-500">Completeness</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-400">{Math.round(entity.accuracyScore)}%</p>
                <p className="text-xs text-slate-500">Accuracy</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-yellow-400">{entity.duplicates}</p>
                <p className="text-xs text-slate-500">Duplicates</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-400">{entity.missingRequiredFields}</p>
                <p className="text-xs text-slate-500">Missing Fields</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-400">{entity.inconsistencies}</p>
                <p className="text-xs text-slate-500">Inconsistencies</p>
              </div>
            </div>
            {entity.topIssues?.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-slate-400 font-medium">Top Issues</p>
                {entity.topIssues.map((issue: any, i: number) => (
                  <div key={i} className={cn("flex items-center justify-between p-2 rounded-lg border", isLight ? "bg-slate-50 border-slate-200" : "bg-slate-800/30 border-slate-700/30")}>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400 font-mono">{issue.field}</span>
                      <span className="text-xs text-slate-300">{issue.issue}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500">{issue.count} records</span>
                      <StatusBadge status={issue.severity} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ────────────────────────────────────────
// TAB: System Health
// ────────────────────────────────────────
function SystemHealthTab() {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const healthQ = (trpc as any).dataMigration.getSystemHealthDashboard.useQuery(undefined, { refetchInterval: 10000 });
  const metricsQ = (trpc as any).dataMigration.getPerformanceMetrics.useQuery(undefined, { refetchInterval: 10000 });
  const capacityQ = (trpc as any).dataMigration.getSystemCapacityPlanning.useQuery();

  const health = healthQ.data;
  const metrics = metricsQ.data;
  const capacity = capacityQ.data;

  if (healthQ.isLoading) {
    return <div className="space-y-4">{Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-32 bg-slate-800/50 rounded-xl" />)}</div>;
  }

  return (
    <div className="space-y-6">
      {/* System overview stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Server} label="System Status" value={health?.status || "unknown"} sub={`Uptime: ${health?.uptimeFormatted}`} color={health?.status === "healthy" ? "green" : "yellow"} />
        <StatCard icon={Cpu} label="Memory Usage" value={`${health?.memory?.percentUsed || 0}%`} sub={`${health?.memory?.heapUsed || 0}MB / ${health?.memory?.heapTotal || 0}MB`} color="blue" />
        <StatCard icon={Activity} label="Avg Response Time" value={`${Math.round(metrics?.api?.avgResponseTime || 0)}ms`} sub={`P95: ${Math.round(metrics?.api?.p95ResponseTime || 0)}ms`} color="cyan" />
        <StatCard icon={Database} label="DB Response" value={`${health?.database?.responseTime || 0}ms`} sub={`${health?.database?.activeConnections || 0} connections`} color="purple" />
      </div>

      {/* Services status */}
      <Card className={cn("rounded-xl border", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-900/50 border-slate-700/50")}>
        <CardHeader><CardTitle className="text-white flex items-center gap-2"><Server className="w-5 h-5 text-green-400" /> Service Status</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {(health?.services || []).map((svc: any) => (
              <div key={svc.name} className={cn("flex items-center justify-between p-3 rounded-lg border", isLight ? "bg-slate-50 border-slate-200" : "bg-slate-800/40 border-slate-700/30")}>
                <div className="flex items-center gap-2">
                  <div className={cn("w-2 h-2 rounded-full", svc.status === "healthy" ? "bg-green-500" : svc.status === "degraded" ? "bg-yellow-500" : "bg-red-500")} />
                  <span className="text-sm text-slate-300">{svc.name}</span>
                </div>
                <span className="text-xs text-slate-500">{svc.latency}ms</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Slowest endpoints */}
      {metrics?.api?.slowestEndpoints && (
        <Card className={cn("rounded-xl border", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-900/50 border-slate-700/50")}>
          <CardHeader><CardTitle className="text-white flex items-center gap-2"><Zap className="w-5 h-5 text-yellow-400" /> Slowest Endpoints</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {metrics.api.slowestEndpoints.map((ep: any, i: number) => (
                <div key={i} className={cn("flex items-center justify-between p-2 rounded-lg", isLight ? "bg-slate-50" : "bg-slate-800/30")}>
                  <span className="text-sm text-slate-300 font-mono">{ep.endpoint}</span>
                  <Badge className={cn(
                    "border-0 text-xs",
                    ep.avgMs < 100 ? "bg-green-500/20 text-green-400" : ep.avgMs < 200 ? "bg-yellow-500/20 text-yellow-400" : "bg-red-500/20 text-red-400",
                  )}>
                    {ep.avgMs}ms
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Capacity projections */}
      {capacity?.projections && (
        <Card className={cn("rounded-xl border", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-900/50 border-slate-700/50")}>
          <CardHeader><CardTitle className="text-white flex items-center gap-2"><BarChart3 className="w-5 h-5 text-purple-400" /> Capacity Planning</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {capacity.projections.map((p: any, i: number) => (
                <div key={i} className={cn("p-3 rounded-lg border", isLight ? "bg-slate-50 border-slate-200" : "bg-slate-800/30 border-slate-700/30")}>
                  <p className="text-sm font-medium text-white mb-2">{p.period}</p>
                  <div className="space-y-1 text-xs text-slate-400">
                    <p><HardDrive className="w-3 h-3 inline mr-1" />Storage: {p.storageNeeded}</p>
                    <p><Cpu className="w-3 h-3 inline mr-1" />Compute: {p.computeNeeded}</p>
                    <p><Activity className="w-3 h-3 inline mr-1" />Bandwidth: {p.bandwidthNeeded}</p>
                  </div>
                </div>
              ))}
            </div>

            {capacity.recommendations && (
              <div className="mt-4 space-y-2">
                <p className="text-xs text-slate-400 font-medium">Recommendations</p>
                {capacity.recommendations.map((r: any, i: number) => (
                  <div key={i} className={cn("flex items-center gap-2 p-2 rounded-lg", isLight ? "bg-slate-50" : "bg-slate-800/20")}>
                    <StatusBadge status={r.priority} />
                    <span className="text-xs text-slate-300">{r.message}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ────────────────────────────────────────
// TAB: Stress Testing
// ────────────────────────────────────────
function StressTestTab() {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const [testType, setTestType] = useState("api_load");
  const [concurrentUsers, setConcurrentUsers] = useState("100");
  const [duration, setDuration] = useState("60");
  const [rps, setRps] = useState("50");
  const [activeTestId, setActiveTestId] = useState<string | null>(null);

  const historyQ = (trpc as any).dataMigration.getLoadTestHistory.useQuery({ page: 1, limit: 10 });
  const resultsQ = (trpc as any).dataMigration.getStressTestResults.useQuery(
    { testId: activeTestId || "" },
    { enabled: !!activeTestId, refetchInterval: activeTestId ? 2000 : false },
  );

  const runMut = (trpc as any).dataMigration.runStressTest.useMutation({
    onSuccess: (d: any) => { toast.success(`Stress test started (${d.testId})`); setActiveTestId(d.testId); historyQ.refetch(); },
    onError: (e: any) => toast.error("Test failed", { description: e.message }),
  });

  const results = resultsQ.data;

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card className={cn("rounded-xl border", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-900/50 border-slate-700/50")}>
        <CardHeader><CardTitle className="text-white flex items-center gap-2"><Zap className="w-5 h-5 text-orange-400" /> Run Stress Test</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-slate-400 mb-1">Test Type</p>
              <Select value={testType} onValueChange={setTestType}>
                <SelectTrigger className={cn(isLight ? "bg-white border-slate-200 text-slate-900" : "bg-slate-800 border-slate-700 text-slate-200")}><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["api_load", "db_stress", "concurrent_users", "peak_simulation", "endurance", "spike", "soak", "breakpoint"].map((t) => (
                    <SelectItem key={t} value={t}>{t.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-1">Concurrent Users</p>
              <Input type="number" value={concurrentUsers} onChange={(e) => setConcurrentUsers(e.target.value)} className={cn(isLight ? "bg-white border-slate-200 text-slate-900" : "bg-slate-800 border-slate-700 text-slate-200")} />
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-1">Duration (seconds)</p>
              <Input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} className={cn(isLight ? "bg-white border-slate-200 text-slate-900" : "bg-slate-800 border-slate-700 text-slate-200")} />
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-1">Requests/Second</p>
              <Input type="number" value={rps} onChange={(e) => setRps(e.target.value)} className={cn(isLight ? "bg-white border-slate-200 text-slate-900" : "bg-slate-800 border-slate-700 text-slate-200")} />
            </div>
          </div>
          <Button
            className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 rounded-lg"
            disabled={runMut.isPending}
            onClick={() => runMut.mutate({
              type: testType as any,
              concurrentUsers: parseInt(concurrentUsers) || 100,
              durationSeconds: parseInt(duration) || 60,
              requestsPerSecond: parseInt(rps) || 50,
            })}
          >
            <Play className="w-4 h-4 mr-2" />{runMut.isPending ? "Starting..." : "Run Stress Test"}
          </Button>
        </CardContent>
      </Card>

      {/* Active test results */}
      {results?.found && (
        <Card className={cn("rounded-xl border", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-900/50 border-slate-700/50")}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-white flex items-center gap-2"><BarChart3 className="w-5 h-5 text-blue-400" /> Test Results</CardTitle>
              <StatusBadge status={results.status} />
            </div>
          </CardHeader>
          <CardContent>
            {results.status === "running" ? (
              <div className="text-center py-8">
                <RefreshCw className="w-8 h-8 text-blue-400 animate-spin mx-auto mb-3" />
                <p className="text-sm text-slate-400">Test in progress...</p>
              </div>
            ) : results.results ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatCard icon={Activity} label="Total Requests" value={results.results.totalRequests.toLocaleString()} color="blue" />
                  <StatCard icon={CheckCircle} label="Success Rate" value={`${(100 - results.results.errorRate).toFixed(1)}%`} color="green" />
                  <StatCard icon={Zap} label="Avg Response" value={`${results.results.avgResponseTime}ms`} color="cyan" />
                  <StatCard icon={BarChart3} label="Throughput" value={`${results.results.throughputMbps} MB/s`} color="purple" />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className={cn("p-3 rounded-lg text-center", isLight ? "bg-slate-50" : "bg-slate-800/30")}>
                    <p className="text-lg font-bold text-slate-200">{results.results.p50ResponseTime}ms</p>
                    <p className="text-xs text-slate-500">P50</p>
                  </div>
                  <div className={cn("p-3 rounded-lg text-center", isLight ? "bg-slate-50" : "bg-slate-800/30")}>
                    <p className="text-lg font-bold text-slate-200">{results.results.p95ResponseTime}ms</p>
                    <p className="text-xs text-slate-500">P95</p>
                  </div>
                  <div className={cn("p-3 rounded-lg text-center", isLight ? "bg-slate-50" : "bg-slate-800/30")}>
                    <p className="text-lg font-bold text-slate-200">{results.results.p99ResponseTime}ms</p>
                    <p className="text-xs text-slate-500">P99</p>
                  </div>
                  <div className={cn("p-3 rounded-lg text-center", isLight ? "bg-slate-50" : "bg-slate-800/30")}>
                    <p className="text-lg font-bold text-slate-200">{results.results.maxResponseTime}ms</p>
                    <p className="text-xs text-slate-500">Max</p>
                  </div>
                </div>

                {results.results.bottlenecks?.length > 0 && (
                  <div>
                    <p className="text-xs text-slate-400 font-medium mb-2">Bottlenecks Identified</p>
                    <div className="space-y-2">
                      {results.results.bottlenecks.map((b: any, i: number) => (
                        <div key={i} className={cn("flex items-center justify-between p-2 rounded-lg border", isLight ? "bg-slate-50 border-slate-200" : "bg-slate-800/30 border-slate-700/30")}>
                          <div className="flex items-center gap-2">
                            <StatusBadge status={b.severity} />
                            <span className="text-sm text-slate-300">{b.component}</span>
                          </div>
                          <span className="text-xs text-slate-400">{b.metric}: {typeof b.value === 'number' ? b.value.toFixed(1) : b.value} (threshold: {b.threshold})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </CardContent>
        </Card>
      )}

      {/* Test history */}
      <Card className={cn("rounded-xl border", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-900/50 border-slate-700/50")}>
        <CardHeader><CardTitle className="text-white flex items-center gap-2"><Clock className="w-5 h-5 text-slate-400" /> Test History</CardTitle></CardHeader>
        <CardContent>
          {(historyQ.data?.tests || []).length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-6">No stress tests run yet.</p>
          ) : (
            <div className="space-y-2">
              {historyQ.data.tests.map((t: any) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg border border-slate-700/30 cursor-pointer hover:border-slate-600/50"
                  onClick={() => setActiveTestId(t.id)}
                >
                  <div className="flex items-center gap-3">
                    <StatusBadge status={t.status} />
                    <span className="text-sm text-slate-300 capitalize">{t.type.replace(/_/g, " ")}</span>
                    <span className="text-xs text-slate-500">{t.concurrentUsers} users, {t.durationSeconds}s</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    {t.avgResponseTime && <span>{t.avgResponseTime.toFixed(0)}ms avg</span>}
                    {t.errorRate != null && <span>{t.errorRate.toFixed(1)}% errors</span>}
                    <span>{new Date(t.startedAt).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ────────────────────────────────────────
// TAB: Disaster Recovery
// ────────────────────────────────────────
function DisasterRecoveryTab() {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const drPlanQ = (trpc as any).dataMigration.getDisasterRecoveryPlan.useQuery();
  const backupQ = (trpc as any).dataMigration.getBackupStatus.useQuery(undefined, { refetchInterval: 30000 });
  const [activeDrTestId, setActiveDrTestId] = useState<string | null>(null);

  const drResultsQ = (trpc as any).dataMigration.getDrTestResults.useQuery(
    { testId: activeDrTestId || "" },
    { enabled: !!activeDrTestId, refetchInterval: activeDrTestId ? 2000 : false },
  );

  const runDrMut = (trpc as any).dataMigration.runDrRecoveryTest.useMutation({
    onSuccess: (d: any) => { toast.success(`DR test started (${d.testId})`); setActiveDrTestId(d.testId); },
    onError: (e: any) => toast.error("DR test failed", { description: e.message }),
  });

  const plan = drPlanQ.data?.plan;
  const backup = backupQ.data;
  const drResults = drResultsQ.data;

  if (drPlanQ.isLoading) {
    return <div className="space-y-4">{Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-40 bg-slate-800/50 rounded-xl" />)}</div>;
  }

  return (
    <div className="space-y-6">
      {/* Backup Status */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={HardDrive} label="Last Backup" value={backup?.lastBackup ? new Date(backup.lastBackup.timestamp).toLocaleTimeString() : "N/A"} sub={backup?.lastBackup?.status} color="green" />
        <StatCard icon={Database} label="Backup Storage" value={backup?.storage?.totalUsed || "N/A"} sub={`${backup?.storage?.percentUsed || 0}% used`} color="blue" />
        <StatCard icon={Shield} label="RTO Target" value={`${plan?.rtoTarget || 0}s`} sub="Recovery Time Objective" color="cyan" />
        <StatCard icon={Shield} label="RPO Target" value={`${plan?.rpoTarget || 0}s`} sub="Recovery Point Objective" color="purple" />
      </div>

      {/* DR Plan */}
      <Card className={cn("rounded-xl border", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-900/50 border-slate-700/50")}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white flex items-center gap-2"><Shield className="w-5 h-5 text-cyan-400" /> Disaster Recovery Plan</CardTitle>
            <div className="flex gap-2">
              {(["backup_restore", "failover", "full_drill"] as const).map((type) => (
                <Button
                  key={type}
                  size="sm"
                  className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 rounded-lg"
                  disabled={runDrMut.isPending}
                  onClick={() => runDrMut.mutate({ type })}
                >
                  <Play className="w-3 h-3 mr-1" />{type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {(plan?.components || []).map((c: any, i: number) => (
              <div key={i} className={cn("p-3 rounded-lg border", isLight ? "bg-slate-50 border-slate-200" : "bg-slate-800/30 border-slate-700/30")}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-white">{c.name}</span>
                  <div className="flex gap-3 text-xs text-slate-500">
                    <span>RTO: {c.rto}s</span>
                    <span>RPO: {c.rpo}s</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-400">
                  <p>Backup: {c.backup}</p>
                  <p>Recovery: {c.recovery}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Test schedule */}
          {plan?.testSchedule && (
            <div className="mt-6">
              <p className="text-xs text-slate-400 font-medium mb-2">Test Schedule</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {plan.testSchedule.map((s: any, i: number) => (
                  <div key={i} className={cn("p-3 rounded-lg border", isLight ? "bg-slate-50 border-slate-200" : "bg-slate-800/30 border-slate-700/30")}>
                    <p className="text-sm text-white font-medium">{s.type}</p>
                    <p className="text-xs text-slate-500">Frequency: {s.frequency}</p>
                    <p className="text-xs text-slate-500">Last: {new Date(s.lastRun).toLocaleDateString()}</p>
                    <p className="text-xs text-cyan-400">Next: {new Date(s.nextRun).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* DR Test Results */}
      {drResults?.found && (
        <Card className={cn("rounded-xl border", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-900/50 border-slate-700/50")}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-white flex items-center gap-2"><Activity className="w-5 h-5 text-green-400" /> DR Test Results</CardTitle>
              <StatusBadge status={drResults.status} />
            </div>
          </CardHeader>
          <CardContent>
            {drResults.status === "running" ? (
              <div className="text-center py-8">
                <RefreshCw className="w-8 h-8 text-blue-400 animate-spin mx-auto mb-3" />
                <p className="text-sm text-slate-400">DR test in progress...</p>
              </div>
            ) : drResults.results ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className={cn("p-3 rounded-lg text-center", isLight ? "bg-slate-50" : "bg-slate-800/30")}>
                    <p className={cn("text-2xl font-bold", drResults.results.rtoActual <= drResults.results.rtoTarget ? "text-green-400" : "text-red-400")}>
                      {drResults.results.rtoActual}s
                    </p>
                    <p className="text-xs text-slate-500">RTO Actual (target: {drResults.results.rtoTarget}s)</p>
                  </div>
                  <div className={cn("p-3 rounded-lg text-center", isLight ? "bg-slate-50" : "bg-slate-800/30")}>
                    <p className={cn("text-2xl font-bold", drResults.results.rpoActual <= drResults.results.rpoTarget ? "text-green-400" : "text-red-400")}>
                      {drResults.results.rpoActual}s
                    </p>
                    <p className="text-xs text-slate-500">RPO Actual (target: {drResults.results.rpoTarget}s)</p>
                  </div>
                  <div className={cn("p-3 rounded-lg text-center", isLight ? "bg-slate-50" : "bg-slate-800/30")}>
                    <p className="text-2xl font-bold text-blue-400">{drResults.results.failoverTime}s</p>
                    <p className="text-xs text-slate-500">Failover Time</p>
                  </div>
                  <div className={cn("p-3 rounded-lg text-center", isLight ? "bg-slate-50" : "bg-slate-800/30")}>
                    <p className="text-2xl font-bold text-green-400">{drResults.results.dataIntegrity.toFixed(1)}%</p>
                    <p className="text-xs text-slate-500">Data Integrity</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-xs text-slate-400 font-medium">Recovery Steps</p>
                  {drResults.results.stepsCompleted.map((step: any, i: number) => (
                    <div key={i} className="flex items-center justify-between p-2 bg-slate-800/20 rounded-lg">
                      <div className="flex items-center gap-2">
                        <StatusBadge status={step.status} />
                        <span className="text-sm text-slate-300">{step.step}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span>{step.duration}s</span>
                        <span>{step.notes}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="text-center pt-2">
                  {drResults.results.passed
                    ? <Badge className="bg-green-500/20 text-green-400 border-0 text-sm px-4 py-1"><CheckCircle className="w-4 h-4 mr-2" />DR Test PASSED</Badge>
                    : <Badge className="bg-red-500/20 text-red-400 border-0 text-sm px-4 py-1"><XCircle className="w-4 h-4 mr-2" />DR Test FAILED</Badge>
                  }
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      )}

      {/* Recent backups */}
      <Card className={cn("rounded-xl border", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-900/50 border-slate-700/50")}>
        <CardHeader><CardTitle className="text-white flex items-center gap-2"><HardDrive className="w-5 h-5 text-blue-400" /> Recent Backups</CardTitle></CardHeader>
        <CardContent>
          {(backup?.recentBackups || []).length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-6">No backup data available.</p>
          ) : (
            <div className="space-y-2">
              {backup.recentBackups.map((b: any) => (
                <div key={b.id} className={cn("flex items-center justify-between p-2 rounded-lg border", isLight ? "bg-slate-50 border-slate-200" : "bg-slate-800/30 border-slate-700/30")}>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={b.status} />
                    <span className="text-sm text-slate-300 capitalize">{b.type}</span>
                    <span className="text-xs text-slate-500">{b.size}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span>{b.duration}s</span>
                    <span>{new Date(b.timestamp).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ────────────────────────────────────────
// TAB: Export
// ────────────────────────────────────────
function ExportTab() {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const optionsQ = (trpc as any).dataMigration.getExportOptions.useQuery();
  const [selectedFormat, setSelectedFormat] = useState("csv");
  const [selectedScope, setSelectedScope] = useState("loads");

  const exportMut = (trpc as any).dataMigration.exportData.useMutation({
    onSuccess: (d: any) => toast.success(`Export started: ${d.recordCount} records in ${d.format.toUpperCase()}`),
    onError: (e: any) => toast.error("Export failed", { description: e.message }),
  });

  const formats = optionsQ.data?.formats || [];
  const scopes = optionsQ.data?.scopes || [];

  return (
    <div className="space-y-6">
      <Card className={cn("rounded-xl border", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-900/50 border-slate-700/50")}>
        <CardHeader><CardTitle className="text-white flex items-center gap-2"><Download className="w-5 h-5 text-green-400" /> Export Data</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-slate-400 mb-2">Format</p>
            <div className="flex flex-wrap gap-2">
              {formats.map((f: any) => (
                <button
                  key={f.id}
                  onClick={() => setSelectedFormat(f.id)}
                  className={cn(
                    "px-3 py-2 rounded-lg border text-sm transition-all",
                    selectedFormat === f.id
                      ? "border-green-500 bg-green-500/10 text-green-300"
                      : "border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-500",
                  )}
                >
                  <div className="font-medium">{f.name}</div>
                  <div className="text-xs opacity-70">{f.description}</div>
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-sm text-slate-400 mb-2">Data Scope</p>
            <div className="flex flex-wrap gap-2">
              {scopes.map((s: any) => (
                <button
                  key={s.id}
                  onClick={() => setSelectedScope(s.id)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg border text-sm transition-all",
                    selectedScope === s.id
                      ? "border-green-500 bg-green-500/10 text-green-300"
                      : "border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-500",
                  )}
                >
                  {s.name}
                </button>
              ))}
            </div>
          </div>
          <Button
            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-lg"
            disabled={exportMut.isPending}
            onClick={() => exportMut.mutate({ format: selectedFormat, scope: selectedScope })}
          >
            <Download className="w-4 h-4 mr-2" />{exportMut.isPending ? "Exporting..." : "Export Data"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// ────────────────────────────────────────
// MAIN PAGE
// ────────────────────────────────────────
export default function DataMigration() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  return (
    <div className={isLight ? "min-h-screen bg-slate-50 text-slate-900 p-4 md:p-6 space-y-6" : "p-4 md:p-6 space-y-6"}>
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
          Data Migration & System Testing
        </h1>
        <p className={cn("text-sm mt-1", isLight ? "text-slate-500" : "text-slate-400")}>
          Import data from other TMS platforms, run system stress tests, and manage disaster recovery
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="migration" className="w-full">
        <TabsList className={cn("border rounded-xl p-1 flex-wrap h-auto gap-1", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/50 border-slate-700/50")}>
          <TabsTrigger value="migration" className="data-[state=active]:bg-slate-700 rounded-lg text-xs sm:text-sm">
            <Upload className="w-4 h-4 mr-1.5" />Migration
          </TabsTrigger>
          <TabsTrigger value="mapping" className="data-[state=active]:bg-slate-700 rounded-lg text-xs sm:text-sm">
            <ArrowUpDown className="w-4 h-4 mr-1.5" />Field Mapping
          </TabsTrigger>
          <TabsTrigger value="import" className="data-[state=active]:bg-slate-700 rounded-lg text-xs sm:text-sm">
            <FileText className="w-4 h-4 mr-1.5" />Bulk Import
          </TabsTrigger>
          <TabsTrigger value="quality" className="data-[state=active]:bg-slate-700 rounded-lg text-xs sm:text-sm">
            <Search className="w-4 h-4 mr-1.5" />Data Quality
          </TabsTrigger>
          <TabsTrigger value="export" className="data-[state=active]:bg-slate-700 rounded-lg text-xs sm:text-sm">
            <Download className="w-4 h-4 mr-1.5" />Export
          </TabsTrigger>
          <TabsTrigger value="health" className="data-[state=active]:bg-slate-700 rounded-lg text-xs sm:text-sm">
            <Activity className="w-4 h-4 mr-1.5" />System Health
          </TabsTrigger>
          <TabsTrigger value="stress" className="data-[state=active]:bg-slate-700 rounded-lg text-xs sm:text-sm">
            <Zap className="w-4 h-4 mr-1.5" />Stress Test
          </TabsTrigger>
          <TabsTrigger value="dr" className="data-[state=active]:bg-slate-700 rounded-lg text-xs sm:text-sm">
            <Shield className="w-4 h-4 mr-1.5" />DR & Backup
          </TabsTrigger>
        </TabsList>

        <TabsContent value="migration" className="mt-4"><MigrationDashboardTab /></TabsContent>
        <TabsContent value="mapping" className="mt-4"><FieldMappingTab /></TabsContent>
        <TabsContent value="import" className="mt-4"><BulkImportTab /></TabsContent>
        <TabsContent value="quality" className="mt-4"><DataQualityTab /></TabsContent>
        <TabsContent value="export" className="mt-4"><ExportTab /></TabsContent>
        <TabsContent value="health" className="mt-4"><SystemHealthTab /></TabsContent>
        <TabsContent value="stress" className="mt-4"><StressTestTab /></TabsContent>
        <TabsContent value="dr" className="mt-4"><DisasterRecoveryTab /></TabsContent>
      </Tabs>
    </div>
  );
}
