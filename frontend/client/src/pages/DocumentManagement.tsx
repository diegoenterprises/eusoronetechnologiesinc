/**
 * DOCUMENT MANAGEMENT CENTER
 * Comprehensive document lifecycle management: upload, classify, OCR,
 * templates, e-signatures, workflows, compliance vault, analytics.
 */

import React, { useState, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import {
  FileText, Search, Upload, Eye, X,
  CheckCircle, Clock, AlertTriangle, Shield,
  XCircle, RefreshCw, PenTool, History,
  ChevronRight, Loader2, Sparkles,
  FolderOpen, LayoutGrid, List as ListIcon, FileSignature,
  Archive, Workflow, BarChart3, FileCheck,
  ClipboardList, Plus,
  FileUp, ScanLine, Send, FilePlus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useTheme } from "@/contexts/ThemeContext";
import { useLocation } from "wouter";

// ============================================================================
// TYPES
// ============================================================================

type ActiveTab =
  | "dashboard"
  | "library"
  | "upload"
  | "templates"
  | "signatures"
  | "workflows"
  | "compliance"
  | "expiring"
  | "analytics"
  | "audit";

type ViewMode = "grid" | "list";

interface UploadFile {
  file: File;
  name: string;
  type: string;
  status: "pending" | "uploading" | "complete" | "error";
  progress: number;
  documentId?: string;
}

// ============================================================================
// STATUS BADGES
// ============================================================================

function statusBadge(status: string) {
  const cfg: Record<string, { bg: string; text: string; label: string }> = {
    draft: { bg: "bg-slate-500/15", text: "text-slate-400", label: "Draft" },
    uploaded: { bg: "bg-blue-500/15", text: "text-blue-400", label: "Uploaded" },
    processing: { bg: "bg-yellow-500/15", text: "text-yellow-400", label: "Processing" },
    classified: { bg: "bg-cyan-500/15", text: "text-cyan-400", label: "Classified" },
    extracted: { bg: "bg-indigo-500/15", text: "text-indigo-400", label: "Extracted" },
    pending_review: { bg: "bg-orange-500/15", text: "text-orange-400", label: "Pending Review" },
    approved: { bg: "bg-green-500/15", text: "text-green-400", label: "Approved" },
    rejected: { bg: "bg-red-500/15", text: "text-red-400", label: "Rejected" },
    signed: { bg: "bg-emerald-500/15", text: "text-emerald-400", label: "Signed" },
    archived: { bg: "bg-slate-500/15", text: "text-slate-400", label: "Archived" },
    expired: { bg: "bg-red-500/15", text: "text-red-400", label: "Expired" },
    expiring_soon: { bg: "bg-amber-500/15", text: "text-amber-400", label: "Expiring Soon" },
  };
  const c = cfg[status] || { bg: "bg-slate-500/15", text: "text-slate-400", label: status };
  return <Badge className={cn("text-xs font-semibold border-0", c.bg, c.text)}>{c.label}</Badge>;
}

function urgencyBadge(urgency: string) {
  const cfg: Record<string, { bg: string; text: string }> = {
    critical: { bg: "bg-red-500/15", text: "text-red-400" },
    high: { bg: "bg-orange-500/15", text: "text-orange-400" },
    medium: { bg: "bg-yellow-500/15", text: "text-yellow-400" },
    low: { bg: "bg-blue-500/15", text: "text-blue-400" },
  };
  const c = cfg[urgency] || cfg.medium;
  return (
    <Badge className={cn("text-xs font-bold border-0 uppercase", c.bg, c.text)}>
      {urgency}
    </Badge>
  );
}

// ============================================================================
// COMPLIANCE RING
// ============================================================================

function ComplianceRing({ score, size = 100 }: { score: number; size?: number }) {
  const r = (size - 10) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = score >= 80 ? "#22c55e" : score >= 50 ? "#eab308" : "#ef4444";

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={8} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={color} strokeWidth={8} strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1s ease" }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-xl font-black text-white">{score}%</span>
        <span className="text-xs text-slate-400">Score</span>
      </div>
    </div>
  );
}

// ============================================================================
// DOCUMENT TYPE LABELS
// ============================================================================

const DOC_TYPE_LABELS: Record<string, string> = {
  bol: "Bill of Lading",
  pod: "Proof of Delivery",
  invoice: "Invoice",
  permit: "Permit",
  insurance: "Insurance",
  medical_card: "Medical Card",
  registration: "Registration",
  inspection: "Inspection",
  contract: "Contract",
  rate_confirmation: "Rate Confirmation",
  lumper_receipt: "Lumper Receipt",
  scale_ticket: "Scale Ticket",
  fuel_receipt: "Fuel Receipt",
  toll_receipt: "Toll Receipt",
  hazmat_placard: "Hazmat Placard",
  ifta: "IFTA",
  irp: "IRP",
  w9: "W-9",
  operating_authority: "Operating Authority",
  broker_carrier_agreement: "Broker-Carrier Agreement",
  detention_receipt: "Detention Receipt",
  customs_form: "Customs Form",
  freight_bill: "Freight Bill",
  delivery_receipt: "Delivery Receipt",
  packing_list: "Packing List",
  other: "Other",
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function DocumentManagement() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<ActiveTab>("dashboard");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Data Queries ──
  const dashboardQuery = trpc.documentManagement.getDocumentDashboard.useQuery(undefined, {
    staleTime: 30_000,
  });

  const documentsQuery = trpc.documentManagement.getDocuments.useQuery(
    {
      type: typeFilter !== "all" ? (typeFilter as any) : undefined,
      status: statusFilter !== "all" ? (statusFilter as any) : undefined,
      search: searchQuery || undefined,
      page: 1,
      pageSize: 50,
    },
    { staleTime: 15_000 }
  );

  const templatesQuery = trpc.documentManagement.getDocumentTemplates.useQuery(undefined, {
    staleTime: 60_000,
    enabled: activeTab === "templates" || activeTab === "dashboard",
  });

  const workflowsQuery = trpc.documentManagement.getDocumentWorkflows.useQuery(undefined, {
    staleTime: 30_000,
    enabled: activeTab === "workflows" || activeTab === "dashboard",
  });

  const expiringQuery = trpc.documentManagement.getExpiringDocuments.useQuery(
    { daysAhead: 30, includeExpired: true },
    { staleTime: 30_000, enabled: activeTab === "expiring" || activeTab === "dashboard" }
  );

  const complianceQuery = trpc.documentManagement.getComplianceVault.useQuery(undefined, {
    staleTime: 60_000,
    enabled: activeTab === "compliance" || activeTab === "dashboard",
  });

  const analyticsQuery = trpc.documentManagement.getDocumentAnalytics.useQuery(undefined, {
    staleTime: 60_000,
    enabled: activeTab === "analytics",
  });

  const auditQuery = trpc.documentManagement.getAuditTrail.useQuery(
    { page: 1, pageSize: 50 },
    { staleTime: 30_000, enabled: activeTab === "audit" }
  );

  const selectedDocQuery = trpc.documentManagement.getDocumentById.useQuery(
    { id: selectedDocId! },
    { enabled: !!selectedDocId }
  );

  // ── Mutations ──
  const uploadMutation = trpc.documentManagement.uploadDocument.useMutation({
    onSuccess: () => {
      toast.success("Document uploaded successfully");
      documentsQuery.refetch();
      dashboardQuery.refetch();
    },
    onError: (err) => toast.error(`Upload failed: ${err.message}`),
  });

  const classifyMutation = trpc.documentManagement.classifyDocument.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        toast.success(`Classified as ${DOC_TYPE_LABELS[data.classification?.type || ""] || data.classification?.type} (${((data.classification?.confidence || 0) * 100).toFixed(0)}%)`);
        documentsQuery.refetch();
      }
    },
  });

  const extractMutation = trpc.documentManagement.extractDocumentData.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        toast.success(`Extracted ${data.fieldsExtracted} fields`);
        documentsQuery.refetch();
      }
    },
  });

  const archiveMutation = trpc.documentManagement.archiveDocument.useMutation({
    onSuccess: () => {
      toast.success("Document archived");
      documentsQuery.refetch();
      dashboardQuery.refetch();
    },
  });

  // ── Upload Handler ──
  const handleFileDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const files = Array.from(e.dataTransfer.files);
      processFiles(files);
    },
    []
  );

  const processFiles = useCallback((files: File[]) => {
    const newFiles: UploadFile[] = files.map((f) => ({
      file: f,
      name: f.name,
      type: "other",
      status: "pending" as const,
      progress: 0,
    }));
    setUploadFiles((prev) => [...prev, ...newFiles]);

    // Simulate upload for each file
    for (const uf of newFiles) {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(",")[1] || "";
        uploadMutation.mutate({
          name: uf.name,
          type: "other",
          mimeType: uf.file.type || "application/pdf",
          size: uf.file.size,
          fileData: base64,
          tags: [],
        });
        setUploadFiles((prev) =>
          prev.map((f) => (f.file === uf.file ? { ...f, status: "complete", progress: 100 } : f))
        );
      };
      reader.readAsDataURL(uf.file);
    }
  }, [uploadMutation]);

  // ── Navigation Items ──
  const navItems: Array<{ id: ActiveTab; label: string; icon: React.ReactNode; count?: number }> = [
    { id: "dashboard", label: "Dashboard", icon: <BarChart3 className="w-4 h-4" /> },
    { id: "library", label: "Document Library", icon: <FolderOpen className="w-4 h-4" />, count: dashboardQuery.data?.totalDocuments },
    { id: "upload", label: "Upload", icon: <Upload className="w-4 h-4" /> },
    { id: "templates", label: "Templates", icon: <ClipboardList className="w-4 h-4" />, count: dashboardQuery.data?.templatesAvailable },
    { id: "signatures", label: "E-Signatures", icon: <PenTool className="w-4 h-4" />, count: dashboardQuery.data?.pendingSignatures },
    { id: "workflows", label: "Workflows", icon: <Workflow className="w-4 h-4" />, count: dashboardQuery.data?.activeWorkflows },
    { id: "compliance", label: "Compliance Vault", icon: <Shield className="w-4 h-4" /> },
    { id: "expiring", label: "Expiring Docs", icon: <AlertTriangle className="w-4 h-4" />, count: dashboardQuery.data?.expiringSoon },
    { id: "analytics", label: "Analytics", icon: <BarChart3 className="w-4 h-4" /> },
    { id: "audit", label: "Audit Trail", icon: <History className="w-4 h-4" /> },
  ];

  return (
    <div className={isLight ? "min-h-screen bg-slate-50 text-slate-900" : "min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white"}>
      {/* Header */}
      <div className={cn("border-b backdrop-blur-sm px-6 py-4", isLight ? "border-slate-200 bg-white/80" : "border-white/5 bg-slate-900/50")}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h1 className={cn("text-xl font-bold", isLight ? "text-slate-900" : "text-white")}>Document Management</h1>
              <p className="text-xs text-slate-400">Upload, classify, sign, and manage all documents</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className={cn(isLight ? "border-slate-200 text-slate-600 hover:bg-slate-100" : "border-white/10 text-slate-300 hover:bg-white/5")}
              onClick={() => {
                dashboardQuery.refetch();
                documentsQuery.refetch();
              }}
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
              Refresh
            </Button>
            <Button
              size="sm"
              variant="outline"
              className={cn(isLight ? "border-slate-200 text-slate-600 hover:bg-slate-100" : "border-white/10 text-slate-300 hover:bg-white/5")}
              onClick={() => setLocation("/bulk-upload?type=bols")}
            >
              <Upload className="w-3.5 h-3.5 mr-1.5" />
              Bulk Import BOLs
            </Button>
            <Button
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => setActiveTab("upload")}
            >
              <Upload className="w-3.5 h-3.5 mr-1.5" />
              Upload Document
            </Button>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar Navigation */}
        <div className="w-56 border-r border-white/5 bg-slate-900/30 min-h-[calc(100vh-73px)]">
          <nav className="p-3 space-y-0.5">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={cn(
                  "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all",
                  activeTab === item.id
                    ? "bg-blue-500/15 text-blue-400 font-medium"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                )}
              >
                {item.icon}
                <span className="flex-1 text-left">{item.label}</span>
                {item.count !== undefined && item.count > 0 && (
                  <span className="text-xs bg-white/10 px-1.5 py-0.5 rounded-full font-medium">
                    {item.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6 overflow-auto max-h-[calc(100vh-73px)]">
          {activeTab === "dashboard" && <DashboardTab data={dashboardQuery.data} isLoading={dashboardQuery.isLoading} />}
          {activeTab === "library" && (
            <LibraryTab
              documents={documentsQuery.data}
              isLoading={documentsQuery.isLoading}
              viewMode={viewMode}
              setViewMode={setViewMode}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              typeFilter={typeFilter}
              setTypeFilter={setTypeFilter}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              onSelectDoc={setSelectedDocId}
              selectedDocId={selectedDocId}
              selectedDoc={selectedDocQuery.data}
              onClassify={(id) => classifyMutation.mutate({ documentId: id })}
              onExtract={(id) => extractMutation.mutate({ documentId: id })}
              onArchive={(id) => archiveMutation.mutate({ documentId: id, retentionPolicy: "7_years" })}
              classifying={classifyMutation.isPending}
              extracting={extractMutation.isPending}
            />
          )}
          {activeTab === "upload" && (
            <UploadTab
              files={uploadFiles}
              setFiles={setUploadFiles}
              onDrop={handleFileDrop}
              fileInputRef={fileInputRef}
              processFiles={processFiles}
              uploading={uploadMutation.isPending}
            />
          )}
          {activeTab === "templates" && (
            <TemplatesTab templates={templatesQuery.data} isLoading={templatesQuery.isLoading} />
          )}
          {activeTab === "signatures" && <SignaturesTab />}
          {activeTab === "workflows" && (
            <WorkflowsTab workflows={workflowsQuery.data} isLoading={workflowsQuery.isLoading} />
          )}
          {activeTab === "compliance" && (
            <ComplianceTab data={complianceQuery.data} isLoading={complianceQuery.isLoading} />
          )}
          {activeTab === "expiring" && (
            <ExpiringTab data={expiringQuery.data} isLoading={expiringQuery.isLoading} />
          )}
          {activeTab === "analytics" && (
            <AnalyticsTab data={analyticsQuery.data} isLoading={analyticsQuery.isLoading} />
          )}
          {activeTab === "audit" && (
            <AuditTab data={auditQuery.data} isLoading={auditQuery.isLoading} />
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// DASHBOARD TAB
// ============================================================================

function DashboardTab({ data, isLoading }: { data: any; isLoading: boolean }) {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  if (isLoading) return <LoadingSkeleton />;

  const stats = [
    { label: "Total Documents", value: data?.totalDocuments ?? 0, icon: <FileText className="w-5 h-5" />, color: "text-blue-400", bg: "bg-blue-500/10" },
    { label: "Pending Review", value: data?.pendingReview ?? 0, icon: <Clock className="w-5 h-5" />, color: "text-yellow-400", bg: "bg-yellow-500/10" },
    { label: "Expiring Soon", value: data?.expiringSoon ?? 0, icon: <AlertTriangle className="w-5 h-5" />, color: "text-orange-400", bg: "bg-orange-500/10" },
    { label: "Expired", value: data?.expired ?? 0, icon: <XCircle className="w-5 h-5" />, color: "text-red-400", bg: "bg-red-500/10" },
    { label: "Active Workflows", value: data?.activeWorkflows ?? 0, icon: <Workflow className="w-5 h-5" />, color: "text-purple-400", bg: "bg-purple-500/10" },
    { label: "Pending Signatures", value: data?.pendingSignatures ?? 0, icon: <PenTool className="w-5 h-5" />, color: "text-cyan-400", bg: "bg-cyan-500/10" },
  ];

  return (
    <div className="space-y-6">
      <h2 className={cn("text-lg font-semibold", isLight ? "text-slate-900" : "text-white")}>Document Dashboard</h2>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {stats.map((s) => (
          <Card key={s.label} className={cn(isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/50 border-white/5")}>
            <CardContent className="p-4">
              <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center mb-2", s.bg)}>
                <span className={s.color}>{s.icon}</span>
              </div>
              <p className={cn("text-2xl font-bold", isLight ? "text-slate-900" : "text-white")}>{s.value}</p>
              <p className="text-xs text-slate-400">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Category Breakdown + Recent Uploads */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className={cn(isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/50 border-white/5")}>
          <CardHeader className="pb-3">
            <CardTitle className={cn("text-sm", isLight ? "text-slate-900" : "text-white")}>Documents by Category</CardTitle>
          </CardHeader>
          <CardContent>
            {data?.byCategory?.length ? (
              <div className="space-y-2">
                {data.byCategory.map((cat: any) => (
                  <div key={cat.category} className="flex items-center justify-between">
                    <span className="text-sm text-slate-300 capitalize">{cat.category}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 h-2 bg-white/5 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full"
                          style={{ width: `${Math.min((cat.count / Math.max(data.totalDocuments, 1)) * 100, 100)}%` }}
                        />
                      </div>
                      <span className="text-xs text-slate-400 w-8 text-right">{cat.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">No documents yet</p>
            )}
          </CardContent>
        </Card>

        <Card className={cn(isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/50 border-white/5")}>
          <CardHeader className="pb-3">
            <CardTitle className={cn("text-sm", isLight ? "text-slate-900" : "text-white")}>Recent Uploads</CardTitle>
          </CardHeader>
          <CardContent>
            {data?.recentUploads?.length ? (
              <div className="space-y-2">
                {data.recentUploads.map((doc: any) => (
                  <div key={doc.id} className="flex items-center justify-between p-2 rounded-lg bg-white/[0.02]">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-blue-400" />
                      <div>
                        <p className={cn("text-sm", isLight ? "text-slate-900" : "text-white")}>{doc.name}</p>
                        <p className="text-xs text-slate-500">{DOC_TYPE_LABELS[doc.type] || doc.type}</p>
                      </div>
                    </div>
                    {statusBadge(doc.status)}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">No recent uploads</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Templates Available */}
      <Card className={cn(isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/50 border-white/5")}>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-white flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-blue-400" />
            Available Templates ({data?.templatesAvailable ?? 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-400">
            Generate BOLs, rate confirmations, invoices, and contracts from pre-built templates.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================================
// LIBRARY TAB
// ============================================================================

function LibraryTab({
  documents,
  isLoading,
  viewMode,
  setViewMode,
  searchQuery,
  setSearchQuery,
  typeFilter,
  setTypeFilter,
  statusFilter,
  setStatusFilter,
  onSelectDoc,
  selectedDocId,
  selectedDoc,
  onClassify,
  onExtract,
  onArchive,
  classifying,
  extracting,
}: {
  documents: any;
  isLoading: boolean;
  viewMode: ViewMode;
  setViewMode: (v: ViewMode) => void;
  searchQuery: string;
  setSearchQuery: (s: string) => void;
  typeFilter: string;
  setTypeFilter: (s: string) => void;
  statusFilter: string;
  setStatusFilter: (s: string) => void;
  onSelectDoc: (id: string | null) => void;
  selectedDocId: string | null;
  selectedDoc: any;
  onClassify: (id: string) => void;
  onExtract: (id: string) => void;
  onArchive: (id: string) => void;
  classifying: boolean;
  extracting: boolean;
}) {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className={cn("text-lg font-semibold", isLight ? "text-slate-900" : "text-white")}>Document Library</h2>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Search documents..."
              className={cn("pl-9 w-64 text-sm", isLight ? "bg-white border-slate-200 text-slate-900" : "bg-slate-800/50 border-white/10 text-white")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className={cn("w-40 text-sm", isLight ? "bg-white border-slate-200 text-slate-900" : "bg-slate-800/50 border-white/10 text-white")}>
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent className={cn(isLight ? "bg-white border-slate-200" : "bg-slate-800 border-white/10")}>
              <SelectItem value="all">All Types</SelectItem>
              {Object.entries(DOC_TYPE_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className={cn("w-36 text-sm", isLight ? "bg-white border-slate-200 text-slate-900" : "bg-slate-800/50 border-white/10 text-white")}>
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent className={cn(isLight ? "bg-white border-slate-200" : "bg-slate-800 border-white/10")}>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="uploaded">Uploaded</SelectItem>
              <SelectItem value="classified">Classified</SelectItem>
              <SelectItem value="pending_review">Pending Review</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="signed">Signed</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex border border-white/10 rounded-lg overflow-hidden">
            <button
              className={cn("p-2", viewMode === "grid" ? "bg-blue-500/15 text-blue-400" : "text-slate-400 hover:text-white")}
              onClick={() => setViewMode("grid")}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              className={cn("p-2", viewMode === "list" ? "bg-blue-500/15 text-blue-400" : "text-slate-400 hover:text-white")}
              onClick={() => setViewMode("list")}
            >
              <ListIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <LoadingSkeleton />
      ) : (
        <div className="flex gap-4">
          {/* Document list/grid */}
          <div className={cn("flex-1", selectedDocId ? "max-w-[60%]" : "")}>
            {!documents?.documents?.length ? (
              <Card className={cn(isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/50 border-white/5")}>
                <CardContent className="p-12 text-center">
                  <FolderOpen className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-400">No documents found</p>
                  <p className="text-xs text-slate-500 mt-1">Upload your first document to get started</p>
                </CardContent>
              </Card>
            ) : viewMode === "grid" ? (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                {documents.documents.map((doc: any) => (
                  <Card
                    key={doc.id}
                    className={cn(
                      "bg-slate-800/50 border-white/5 cursor-pointer hover:border-blue-500/30 transition-all",
                      selectedDocId === doc.id && "border-blue-500/50 ring-1 ring-blue-500/20"
                    )}
                    onClick={() => onSelectDoc(doc.id === selectedDocId ? null : doc.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
                          <FileText className="w-5 h-5 text-blue-400" />
                        </div>
                        {statusBadge(doc.status)}
                      </div>
                      <p className="text-sm font-medium text-white truncate">{doc.name}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{DOC_TYPE_LABELS[doc.type] || doc.type}</p>
                      <p className="text-xs text-slate-600 mt-1">
                        {new Date(doc.uploadedAt).toLocaleDateString()}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="space-y-1">
                {documents.documents.map((doc: any) => (
                  <div
                    key={doc.id}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-white/[0.03] transition-all",
                      selectedDocId === doc.id && "bg-blue-500/5 border border-blue-500/20"
                    )}
                    onClick={() => onSelectDoc(doc.id === selectedDocId ? null : doc.id)}
                  >
                    <FileText className="w-4 h-4 text-blue-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{doc.name}</p>
                      <p className="text-xs text-slate-500">{DOC_TYPE_LABELS[doc.type] || doc.type}</p>
                    </div>
                    <p className="text-xs text-slate-500">{new Date(doc.uploadedAt).toLocaleDateString()}</p>
                    {statusBadge(doc.status)}
                  </div>
                ))}
              </div>
            )}
            {documents && documents.totalPages > 1 && (
              <div className="flex justify-center mt-4">
                <p className="text-xs text-slate-500">
                  Page {documents.page} of {documents.totalPages} ({documents.total} documents)
                </p>
              </div>
            )}
          </div>

          {/* Detail Sidebar */}
          {selectedDocId && (
            <div className="w-[40%] min-w-[320px]">
              <Card className="bg-slate-800/50 border-white/5 sticky top-0">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className={cn("text-sm", isLight ? "text-slate-900" : "text-white")}>Document Details</CardTitle>
                    <button onClick={() => onSelectDoc(null)} className="text-slate-400 hover:text-white">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {selectedDoc ? (
                    <>
                      <div>
                        <p className="text-base font-medium text-white">{selectedDoc.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {statusBadge(selectedDoc.status)}
                          <span className="text-xs text-slate-400">
                            {DOC_TYPE_LABELS[selectedDoc.type] || selectedDoc.type}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <p className="text-slate-500">Uploaded</p>
                          <p className="text-slate-300">{new Date(selectedDoc.uploadedAt).toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-slate-500">Size</p>
                          <p className="text-slate-300">{(selectedDoc.size / 1024).toFixed(1)} KB</p>
                        </div>
                        <div>
                          <p className="text-slate-500">Version</p>
                          <p className="text-slate-300">v{selectedDoc.version}</p>
                        </div>
                        <div>
                          <p className="text-slate-500">Category</p>
                          <p className="text-slate-300 capitalize">{selectedDoc.category}</p>
                        </div>
                        {selectedDoc.expiresAt && (
                          <div className="col-span-2">
                            <p className="text-slate-500">Expires</p>
                            <p className="text-slate-300">{new Date(selectedDoc.expiresAt).toLocaleDateString()}</p>
                          </div>
                        )}
                      </div>

                      {selectedDoc.tags?.length > 0 && (
                        <div>
                          <p className="text-xs text-slate-500 mb-1">Tags</p>
                          <div className="flex flex-wrap gap-1">
                            {selectedDoc.tags.map((t: string) => (
                              <Badge key={t} className="text-xs bg-white/5 text-slate-300 border-0">{t}</Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {selectedDoc.classification && (
                        <div className="p-2 rounded-lg bg-cyan-500/5 border border-cyan-500/10">
                          <p className="text-xs text-cyan-400 font-medium flex items-center gap-1">
                            <Sparkles className="w-3 h-3" /> AI Classification
                          </p>
                          <p className="text-xs text-slate-300 mt-1">
                            {DOC_TYPE_LABELS[selectedDoc.classification.type] || selectedDoc.classification.type}
                            {" "}({(selectedDoc.classification.confidence * 100).toFixed(0)}% confidence)
                          </p>
                        </div>
                      )}

                      {selectedDoc.extractedData && Object.keys(selectedDoc.extractedData).length > 0 && (
                        <div>
                          <p className="text-xs text-slate-500 mb-1">Extracted Data</p>
                          <div className="space-y-1 max-h-40 overflow-auto">
                            {Object.entries(selectedDoc.extractedData).map(([key, val]) => (
                              <div key={key} className="flex justify-between text-xs">
                                <span className="text-slate-500 capitalize">{key.replace(/_/g, " ")}</span>
                                <span className="text-slate-300 text-right max-w-[60%] truncate">
                                  {typeof val === "object" ? JSON.stringify(val) : String(val)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex flex-wrap gap-2 pt-2 border-t border-white/5">
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-white/10 text-slate-300 text-xs hover:bg-white/5"
                          onClick={() => onClassify(selectedDoc.id)}
                          disabled={classifying}
                        >
                          {classifying ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Sparkles className="w-3 h-3 mr-1" />}
                          Classify
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-white/10 text-slate-300 text-xs hover:bg-white/5"
                          onClick={() => onExtract(selectedDoc.id)}
                          disabled={extracting}
                        >
                          {extracting ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <ScanLine className="w-3 h-3 mr-1" />}
                          Extract Data
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-white/10 text-slate-300 text-xs hover:bg-white/5"
                          onClick={() => onArchive(selectedDoc.id)}
                        >
                          <Archive className="w-3 h-3 mr-1" />
                          Archive
                        </Button>
                      </div>

                      {/* Audit Trail */}
                      {selectedDoc.auditTrail?.length > 0 && (
                        <div>
                          <p className="text-xs text-slate-500 mb-2">Audit Trail</p>
                          <div className="space-y-2 max-h-48 overflow-auto">
                            {selectedDoc.auditTrail.map((entry: any, i: number) => (
                              <div key={i} className="flex gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 flex-shrink-0" />
                                <div>
                                  <p className="text-xs text-slate-300">{entry.details}</p>
                                  <p className="text-xs text-slate-500">
                                    {new Date(entry.timestamp).toLocaleString()}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// UPLOAD TAB
// ============================================================================

function UploadTab({
  files,
  setFiles,
  onDrop,
  fileInputRef,
  processFiles,
  uploading,
}: {
  files: UploadFile[];
  setFiles: React.Dispatch<React.SetStateAction<UploadFile[]>>;
  onDrop: (e: React.DragEvent) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  processFiles: (files: File[]) => void;
  uploading: boolean;
}) {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const [dragActive, setDragActive] = useState(false);

  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      <h2 className={cn("text-lg font-semibold", isLight ? "text-slate-900" : "text-white")}>Upload Documents</h2>

      {/* Drag & Drop Zone */}
      <div
        className={cn(
          "border-2 border-dashed rounded-xl p-12 text-center transition-all cursor-pointer",
          dragActive
            ? "border-blue-500 bg-blue-500/5"
            : "border-white/10 bg-slate-800/30 hover:border-white/20"
        )}
        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(e) => { setDragActive(false); onDrop(e); }}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          accept=".pdf,.png,.jpg,.jpeg,.tiff,.doc,.docx,.xls,.xlsx"
          onChange={(e) => {
            if (e.target.files) processFiles(Array.from(e.target.files));
          }}
        />
        <FileUp className="w-12 h-12 text-blue-400 mx-auto mb-3" />
        <p className="text-white font-medium">Drag and drop files here</p>
        <p className="text-sm text-slate-400 mt-1">or click to browse</p>
        <p className="text-xs text-slate-500 mt-3">
          Supports PDF, PNG, JPG, TIFF, DOC, DOCX, XLS, XLSX
        </p>
      </div>

      {/* Upload Queue */}
      {files.length > 0 && (
        <Card className={cn(isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/50 border-white/5")}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className={cn("text-sm", isLight ? "text-slate-900" : "text-white")}>Upload Queue ({files.length})</CardTitle>
              <Button
                size="sm"
                variant="ghost"
                className="text-slate-400 hover:text-white text-xs"
                onClick={() => setFiles([])}
              >
                Clear All
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {files.map((f, i) => (
              <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-white/[0.02]">
                <FileText className="w-4 h-4 text-blue-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{f.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {f.status === "complete" ? (
                      <div className="flex items-center gap-1 text-green-400 text-xs">
                        <CheckCircle className="w-3 h-3" /> Complete
                      </div>
                    ) : f.status === "uploading" ? (
                      <div className="flex items-center gap-2 flex-1">
                        <Progress value={f.progress} className="h-1 flex-1" />
                        <span className="text-xs text-slate-400">{f.progress}%</span>
                      </div>
                    ) : f.status === "error" ? (
                      <div className="flex items-center gap-1 text-red-400 text-xs">
                        <XCircle className="w-3 h-3" /> Error
                      </div>
                    ) : (
                      <span className="text-xs text-slate-500">Pending</span>
                    )}
                  </div>
                </div>
                <button
                  className="text-slate-500 hover:text-red-400"
                  onClick={() => setFiles((prev) => prev.filter((_, idx) => idx !== i))}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* AI Features */}
      <Card className={cn(isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/50 border-white/5")}>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-cyan-500/10 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <p className={cn("text-sm font-medium", isLight ? "text-slate-900" : "text-white")}>AI Auto-Classification & OCR</p>
              <p className="text-xs text-slate-400">
                Documents are automatically classified and data is extracted using AI after upload.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================================
// TEMPLATES TAB
// ============================================================================

function TemplatesTab({ templates, isLoading }: { templates: any[] | undefined; isLoading: boolean }) {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  if (isLoading) return <LoadingSkeleton />;

  const templateIcons: Record<string, React.ReactNode> = {
    bol: <FileText className="w-5 h-5 text-blue-400" />,
    rate_confirmation: <FileCheck className="w-5 h-5 text-green-400" />,
    invoice: <ClipboardList className="w-5 h-5 text-purple-400" />,
    contract: <FileSignature className="w-5 h-5 text-orange-400" />,
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className={cn("text-lg font-semibold", isLight ? "text-slate-900" : "text-white")}>Document Templates</h2>
        <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
          <Plus className="w-3.5 h-3.5 mr-1.5" />
          Create Template
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {templates?.map((tpl) => (
          <Card key={tpl.id} className={cn("transition-all", isLight ? "bg-white border-slate-200 shadow-sm hover:border-blue-400/50" : "bg-slate-800/50 border-white/5 hover:border-blue-500/20")}>
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center flex-shrink-0">
                  {templateIcons[tpl.type] || <FileText className="w-5 h-5 text-slate-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn("text-sm font-medium", isLight ? "text-slate-900" : "text-white")}>{tpl.name}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{tpl.description}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs text-slate-500">{tpl.mergeFields.length} fields</span>
                    <span className="text-xs text-slate-500">Used {tpl.usageCount}x</span>
                    <Badge className="text-xs bg-blue-500/10 text-blue-400 border-0 capitalize">{tpl.type.replace(/_/g, " ")}</Badge>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button size="sm" className="bg-blue-600/80 hover:bg-blue-600 text-white text-xs flex-1">
                  <FilePlus className="w-3 h-3 mr-1" />
                  Generate
                </Button>
                <Button size="sm" variant="outline" className="border-white/10 text-slate-300 text-xs hover:bg-white/5">
                  <Eye className="w-3 h-3 mr-1" />
                  Preview
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {(!templates || templates.length === 0) && (
        <Card className={cn(isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/50 border-white/5")}>
          <CardContent className="p-12 text-center">
            <ClipboardList className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">No templates available</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ============================================================================
// SIGNATURES TAB
// ============================================================================

function SignaturesTab() {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className={cn("text-lg font-semibold", isLight ? "text-slate-900" : "text-white")}>E-Signature Tracker</h2>
        <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
          <Send className="w-3.5 h-3.5 mr-1.5" />
          New Signature Request
        </Button>
      </div>

      {/* Signature Workflow Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className={cn(isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/50 border-white/5")}>
          <CardContent className="p-5 text-center">
            <div className="w-12 h-12 bg-yellow-500/10 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Clock className="w-6 h-6 text-yellow-400" />
            </div>
            <p className={cn("text-2xl font-bold", isLight ? "text-slate-900" : "text-white")}>0</p>
            <p className="text-xs text-slate-400">Pending Signatures</p>
          </CardContent>
        </Card>
        <Card className={cn(isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/50 border-white/5")}>
          <CardContent className="p-5 text-center">
            <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="w-6 h-6 text-green-400" />
            </div>
            <p className={cn("text-2xl font-bold", isLight ? "text-slate-900" : "text-white")}>0</p>
            <p className="text-xs text-slate-400">Completed</p>
          </CardContent>
        </Card>
        <Card className={cn(isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/50 border-white/5")}>
          <CardContent className="p-5 text-center">
            <div className="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center mx-auto mb-3">
              <XCircle className="w-6 h-6 text-red-400" />
            </div>
            <p className={cn("text-2xl font-bold", isLight ? "text-slate-900" : "text-white")}>0</p>
            <p className="text-xs text-slate-400">Declined / Expired</p>
          </CardContent>
        </Card>
      </div>

      <Card className={cn(isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/50 border-white/5")}>
        <CardContent className="p-12 text-center">
          <PenTool className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">No signature requests yet</p>
          <p className="text-xs text-slate-500 mt-1">
            Send a document for e-signature from the Document Library
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================================
// WORKFLOWS TAB
// ============================================================================

function WorkflowsTab({ workflows, isLoading }: { workflows: any[] | undefined; isLoading: boolean }) {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  if (isLoading) return <LoadingSkeleton />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className={cn("text-lg font-semibold", isLight ? "text-slate-900" : "text-white")}>Document Workflows</h2>
        <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
          <Plus className="w-3.5 h-3.5 mr-1.5" />
          New Workflow
        </Button>
      </div>

      {workflows && workflows.length > 0 ? (
        <div className="space-y-3">
          {workflows.map((wf) => (
            <Card key={wf.id} className={cn(isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/50 border-white/5")}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className={cn("text-sm font-medium", isLight ? "text-slate-900" : "text-white")}>{wf.documentName}</p>
                    <p className="text-xs text-slate-400 capitalize">{wf.type.replace(/_/g, " ")} workflow</p>
                  </div>
                  {statusBadge(wf.status)}
                </div>
                <div className="flex items-center gap-2">
                  {wf.steps?.map((step: any, i: number) => (
                    <React.Fragment key={step.stepId}>
                      <div
                        className={cn(
                          "flex items-center gap-1.5 px-2 py-1 rounded text-xs",
                          step.status === "approved" ? "bg-green-500/10 text-green-400" :
                          step.status === "rejected" ? "bg-red-500/10 text-red-400" :
                          "bg-white/5 text-slate-400"
                        )}
                      >
                        {step.status === "approved" ? <CheckCircle className="w-3 h-3" /> :
                         step.status === "rejected" ? <XCircle className="w-3 h-3" /> :
                         <Clock className="w-3 h-3" />}
                        {step.assigneeName}
                      </div>
                      {i < wf.steps.length - 1 && (
                        <ChevronRight className="w-3 h-3 text-slate-600" />
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className={cn(isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/50 border-white/5")}>
          <CardContent className="p-12 text-center">
            <Workflow className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">No active workflows</p>
            <p className="text-xs text-slate-500 mt-1">
              Create an approval workflow for documents that need sign-off
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ============================================================================
// COMPLIANCE VAULT TAB
// ============================================================================

function ComplianceTab({ data, isLoading }: { data: any; isLoading: boolean }) {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  if (isLoading) return <LoadingSkeleton />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className={cn("text-lg font-semibold", isLight ? "text-slate-900" : "text-white")}>Compliance Vault</h2>
        <div className="flex items-center gap-3">
          {data?.overallScore !== undefined && (
            <ComplianceRing score={data.overallScore} size={64} />
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data?.regulations?.map((reg: any) => (
          <Card key={reg.regulation} className={cn(isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/50 border-white/5")}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center">
                    <Shield className="w-4 h-4 text-blue-400" />
                  </div>
                  <div>
                    <p className={cn("text-sm font-medium", isLight ? "text-slate-900" : "text-white")}>{reg.label}</p>
                    <p className="text-xs text-slate-400">{reg.description}</p>
                  </div>
                </div>
                <ComplianceRing score={reg.complianceScore} size={48} />
              </div>

              <div className="flex items-center gap-4 text-xs text-slate-400 mt-2">
                <span>{reg.totalUploaded} / {reg.totalRequired} uploaded</span>
              </div>

              <Progress
                value={reg.complianceScore}
                className="h-1.5 mt-2"
              />

              {reg.documents?.length > 0 && (
                <div className="mt-3 space-y-1">
                  {reg.documents.slice(0, 3).map((doc: any) => (
                    <div key={doc.id} className="flex items-center justify-between text-xs">
                      <span className="text-slate-300">{doc.name}</span>
                      {statusBadge(doc.status)}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {(!data?.regulations || data.regulations.length === 0) && (
        <Card className={cn(isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/50 border-white/5")}>
          <CardContent className="p-12 text-center">
            <Shield className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">No compliance documents yet</p>
            <p className="text-xs text-slate-500 mt-1">Upload compliance documents to track regulatory requirements</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ============================================================================
// EXPIRING DOCUMENTS TAB
// ============================================================================

function ExpiringTab({ data, isLoading }: { data: any; isLoading: boolean }) {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  if (isLoading) return <LoadingSkeleton />;

  return (
    <div className="space-y-4">
      <h2 className={cn("text-lg font-semibold", isLight ? "text-slate-900" : "text-white")}>Expiring Documents</h2>

      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-orange-500/5 border-orange-500/10">
          <CardContent className="p-5 text-center">
            <AlertTriangle className="w-8 h-8 text-orange-400 mx-auto mb-2" />
            <p className={cn("text-2xl font-bold", isLight ? "text-slate-900" : "text-white")}>{data?.totalExpiring ?? 0}</p>
            <p className="text-xs text-slate-400">Expiring Soon (30 days)</p>
          </CardContent>
        </Card>
        <Card className="bg-red-500/5 border-red-500/10">
          <CardContent className="p-5 text-center">
            <XCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
            <p className={cn("text-2xl font-bold", isLight ? "text-slate-900" : "text-white")}>{data?.totalExpired ?? 0}</p>
            <p className="text-xs text-slate-400">Already Expired</p>
          </CardContent>
        </Card>
      </div>

      {/* Expiring Soon */}
      {data?.expiring?.length > 0 && (
        <Card className={cn(isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/50 border-white/5")}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-400" />
              Expiring Soon
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.expiring.map((doc: any) => (
              <div key={doc.id} className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02]">
                <div className="flex items-center gap-3">
                  <FileText className="w-4 h-4 text-blue-400" />
                  <div>
                    <p className={cn("text-sm", isLight ? "text-slate-900" : "text-white")}>{doc.name}</p>
                    <p className="text-xs text-slate-400">{DOC_TYPE_LABELS[doc.type] || doc.type}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">{doc.daysUntilExpiry} days</span>
                  {urgencyBadge(doc.urgency)}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Already Expired */}
      {data?.expired?.length > 0 && (
        <Card className={cn(isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/50 border-white/5")}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-white flex items-center gap-2">
              <XCircle className="w-4 h-4 text-red-400" />
              Expired Documents
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.expired.map((doc: any) => (
              <div key={doc.id} className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02]">
                <div className="flex items-center gap-3">
                  <FileText className="w-4 h-4 text-red-400" />
                  <div>
                    <p className={cn("text-sm", isLight ? "text-slate-900" : "text-white")}>{doc.name}</p>
                    <p className="text-xs text-slate-400">{DOC_TYPE_LABELS[doc.type] || doc.type}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-red-400">{doc.daysExpired} days ago</span>
                  <Button size="sm" variant="outline" className="border-white/10 text-xs text-slate-300 hover:bg-white/5">
                    <RefreshCw className="w-3 h-3 mr-1" />
                    Renew
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {(!data?.expiring?.length && !data?.expired?.length) && (
        <Card className={cn(isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/50 border-white/5")}>
          <CardContent className="p-12 text-center">
            <CheckCircle className="w-12 h-12 text-green-500/50 mx-auto mb-3" />
            <p className="text-slate-400">No expiring or expired documents</p>
            <p className="text-xs text-slate-500 mt-1">All documents are current</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ============================================================================
// ANALYTICS TAB
// ============================================================================

function AnalyticsTab({ data, isLoading }: { data: any; isLoading: boolean }) {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  if (isLoading) return <LoadingSkeleton />;

  return (
    <div className="space-y-4">
      <h2 className={cn("text-lg font-semibold", isLight ? "text-slate-900" : "text-white")}>Document Analytics</h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className={cn(isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/50 border-white/5")}>
          <CardContent className="p-4">
            <p className={cn("text-2xl font-bold", isLight ? "text-slate-900" : "text-white")}>{data?.totalDocuments ?? 0}</p>
            <p className="text-xs text-slate-400">Total Documents</p>
          </CardContent>
        </Card>
        <Card className={cn(isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/50 border-white/5")}>
          <CardContent className="p-4">
            <p className={cn("text-2xl font-bold", isLight ? "text-slate-900" : "text-white")}>{data?.documentsThisMonth ?? 0}</p>
            <p className="text-xs text-slate-400">This Month</p>
          </CardContent>
        </Card>
        <Card className={cn(isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/50 border-white/5")}>
          <CardContent className="p-4">
            <p className={cn("text-2xl font-bold", isLight ? "text-slate-900" : "text-white")}>{data?.ocrAccuracy ?? 0}%</p>
            <p className="text-xs text-slate-400">OCR Accuracy</p>
          </CardContent>
        </Card>
        <Card className={cn(isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/50 border-white/5")}>
          <CardContent className="p-4">
            <p className={cn("text-2xl font-bold", isLight ? "text-slate-900" : "text-white")}>{data?.averageProcessingTime ?? "N/A"}</p>
            <p className="text-xs text-slate-400">Avg Processing Time</p>
          </CardContent>
        </Card>
      </div>

      {/* Upload Trend */}
      <Card className={cn(isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/50 border-white/5")}>
        <CardHeader className="pb-3">
          <CardTitle className={cn("text-sm", isLight ? "text-slate-900" : "text-white")}>Upload Trend (Last 4 Weeks)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-4 h-32">
            {data?.uploadTrend?.map((week: any, i: number) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full bg-blue-500/30 rounded-t-md transition-all"
                  style={{ height: `${Math.max((week.uploads / 30) * 100, 10)}%` }}
                />
                <span className="text-xs text-slate-500">{week.period}</span>
                <span className="text-xs text-slate-400">{week.uploads}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Type Breakdown + Signature/Workflow Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className={cn(isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/50 border-white/5")}>
          <CardHeader className="pb-3">
            <CardTitle className={cn("text-sm", isLight ? "text-slate-900" : "text-white")}>Top Document Types</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data?.topCategories?.map((cat: any) => (
              <div key={cat.type} className="flex items-center justify-between">
                <span className="text-xs text-slate-300">{DOC_TYPE_LABELS[cat.type] || cat.type}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">{cat.count}</span>
                  <Badge className="text-xs bg-blue-500/10 text-blue-400 border-0">{cat.percentage}%</Badge>
                </div>
              </div>
            ))}
            {(!data?.topCategories || data.topCategories.length === 0) && (
              <p className="text-xs text-slate-500">No data</p>
            )}
          </CardContent>
        </Card>

        <Card className={cn(isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/50 border-white/5")}>
          <CardHeader className="pb-3">
            <CardTitle className={cn("text-sm", isLight ? "text-slate-900" : "text-white")}>Signature Metrics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">Total Requests</span>
              <span className="text-white">{data?.signatureMetrics?.totalRequests ?? 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Completed</span>
              <span className="text-green-400">{data?.signatureMetrics?.completed ?? 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Pending</span>
              <span className="text-yellow-400">{data?.signatureMetrics?.pending ?? 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Avg Completion</span>
              <span className="text-white">{data?.signatureMetrics?.averageCompletionTime ?? "N/A"}</span>
            </div>
          </CardContent>
        </Card>

        <Card className={cn(isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/50 border-white/5")}>
          <CardHeader className="pb-3">
            <CardTitle className={cn("text-sm", isLight ? "text-slate-900" : "text-white")}>Workflow Metrics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">Total Workflows</span>
              <span className="text-white">{data?.workflowMetrics?.totalWorkflows ?? 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Completed</span>
              <span className="text-green-400">{data?.workflowMetrics?.completed ?? 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Active</span>
              <span className="text-blue-400">{data?.workflowMetrics?.active ?? 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Avg Approval</span>
              <span className="text-white">{data?.workflowMetrics?.averageApprovalTime ?? "N/A"}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ============================================================================
// AUDIT TRAIL TAB
// ============================================================================

function AuditTab({ data, isLoading }: { data: any; isLoading: boolean }) {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  if (isLoading) return <LoadingSkeleton />;

  return (
    <div className="space-y-4">
      <h2 className={cn("text-lg font-semibold", isLight ? "text-slate-900" : "text-white")}>Audit Trail</h2>

      {data?.entries?.length > 0 ? (
        <Card className={cn(isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/50 border-white/5")}>
          <CardContent className="p-4">
            <div className="space-y-3">
              {data.entries.map((entry: any, i: number) => (
                <div key={i} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="w-2 h-2 rounded-full bg-blue-400 mt-1.5" />
                    {i < data.entries.length - 1 && (
                      <div className="w-px flex-1 bg-white/5 mt-1" />
                    )}
                  </div>
                  <div className="flex-1 pb-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className={cn("text-sm", isLight ? "text-slate-900" : "text-white")}>{entry.details}</p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Document: {entry.documentName}
                        </p>
                      </div>
                      <span className="text-xs text-slate-500 flex-shrink-0 ml-4">
                        {new Date(entry.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <Badge className="text-xs bg-white/5 text-slate-400 border-0 mt-1 capitalize">
                      {entry.action.replace(/_/g, " ")}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
            {data.totalPages > 1 && (
              <p className="text-xs text-slate-500 text-center mt-4">
                Page {data.page} of {data.totalPages} ({data.total} entries)
              </p>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className={cn(isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/50 border-white/5")}>
          <CardContent className="p-12 text-center">
            <History className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">No audit trail entries yet</p>
            <p className="text-xs text-slate-500 mt-1">Document actions will appear here</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ============================================================================
// LOADING SKELETON
// ============================================================================

function LoadingSkeleton() {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  return (
    <div className="space-y-4">
      <Skeleton className={cn("h-8 w-48", isLight ? "bg-slate-100" : "bg-white/5")} />
      <div className="grid grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className={cn("h-32 rounded-xl", isLight ? "bg-slate-100" : "bg-white/5")} />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-4">
        {[1, 2].map((i) => (
          <Skeleton key={i} className={cn("h-48 rounded-xl", isLight ? "bg-slate-100" : "bg-white/5")} />
        ))}
      </div>
    </div>
  );
}
