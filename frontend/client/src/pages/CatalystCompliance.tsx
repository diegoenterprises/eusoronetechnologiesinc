/**
 * CATALYST COMPLIANCE - MC Authority, DOT, Insurance, FMCSA
 * Premium redesign — real data from DB, no mock data
 * Theme-aware | Brand gradient | Sonner toasts
 */
import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { useTheme } from "@/contexts/ThemeContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Shield, CheckCircle2, XCircle, AlertTriangle, Clock, Upload, Award,
  Scale, DollarSign, Truck, RefreshCw, FileText, Search, ChevronRight,
  Building2, ShieldCheck, ShieldAlert, TrendingUp, Eye
} from "lucide-react";

type DocFilter = "all" | "authority" | "insurance" | "safety" | "financial";

export default function CatalystCompliance() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [uploadOpen, setUploadOpen] = useState(false);
  const [selectedType, setSelectedType] = useState("");
  const [expirationDate, setExpirationDate] = useState("");
  const [activeTab, setActiveTab] = useState<DocFilter>("all");
  const [searchTerm, setSearchTerm] = useState("");

  // ── Real data queries ──
  const statsQuery = (trpc as any).compliance?.getDashboardStats?.useQuery?.() || { data: null, isLoading: false, refetch: () => {} };
  const requirementsQuery = (trpc as any).compliance?.getDocumentRequirements?.useQuery?.({ userType: "catalyst" }) || { data: null, isLoading: false };
  const userDocsQuery = (trpc as any).documents?.getAll?.useQuery?.({ category: undefined }) || { data: null, isLoading: false, refetch: () => {} };
  const expiringQuery = (trpc as any).compliance?.getExpiringItems?.useQuery?.({ limit: 10 }) || { data: null, isLoading: false };

  const uploadMutation = (trpc as any).compliance?.uploadDocument?.useMutation?.({
    onSuccess: () => { toast.success("Document uploaded successfully"); setUploadOpen(false); setSelectedType(""); setExpirationDate(""); userDocsQuery.refetch?.(); statsQuery.refetch?.(); },
    onError: (err: any) => { toast.error(err?.message || "Upload failed"); },
  }) || { mutate: () => {}, isPending: false };

  const stats = statsQuery.data;
  const requirements = (requirementsQuery.data as any[]) || [];
  const userDocs = (userDocsQuery.data as any[]) || [];
  const expiringItems = (expiringQuery.data as any[]) || [];

  // Cross-reference requirements with uploaded docs
  const uploadedTypes = new Set(userDocs.map((d: any) => d.category?.toLowerCase()));

  const enrichedDocs = useMemo(() => {
    return requirements.map((req: any) => {
      const uploaded = userDocs.find((d: any) => d.category?.toLowerCase() === req.type?.toLowerCase());
      let status: "verified" | "pending" | "expiring" | "missing" = "missing";
      let expiryDate: string | null = null;

      if (uploaded) {
        if (uploaded.status === "expired") status = "expiring";
        else if (uploaded.status === "pending" || uploaded.status === "processing") status = "pending";
        else status = "verified";
        expiryDate = uploaded.expiryDate || null;
      }

      return { ...req, status, expiryDate, uploadedDoc: uploaded };
    });
  }, [requirements, userDocs]);

  const verifiedCount = enrichedDocs.filter(d => d.status === "verified").length;
  const pendingCount = enrichedDocs.filter(d => d.status === "pending").length;
  const expiringCount = enrichedDocs.filter(d => d.status === "expiring").length + (stats?.expiringDocs || 0);
  const missingCount = enrichedDocs.filter(d => d.status === "missing").length;
  const totalReq = enrichedDocs.length || 1;
  const score = stats?.complianceScore ?? Math.round((verifiedCount / totalReq) * 100);

  const filteredDocs = enrichedDocs.filter((d: any) => {
    const matchesTab = activeTab === "all" || d.category === activeTab;
    const matchesSearch = !searchTerm || d.name?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case "authority": return <Award className="w-5 h-5 text-blue-400" />;
      case "insurance": return <Shield className="w-5 h-5 text-green-400" />;
      case "safety": return <Scale className="w-5 h-5 text-amber-400" />;
      case "financial": return <DollarSign className="w-5 h-5 text-purple-400" />;
      default: return <FileText className="w-5 h-5 text-slate-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "verified": return <Badge className="bg-green-500/20 text-green-400 border-0 text-xs font-semibold"><CheckCircle2 className="w-3 h-3 mr-1" />Verified</Badge>;
      case "pending": return <Badge className="bg-yellow-500/20 text-yellow-400 border-0 text-xs font-semibold"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case "expiring": return <Badge className="bg-orange-500/20 text-orange-400 border-0 text-xs font-semibold"><AlertTriangle className="w-3 h-3 mr-1" />Expiring</Badge>;
      case "missing": return <Badge className="bg-red-500/20 text-red-400 border-0 text-xs font-semibold"><XCircle className="w-3 h-3 mr-1" />Missing</Badge>;
      default: return <Badge className="bg-slate-500/20 text-slate-400 border-0 text-xs">{status}</Badge>;
    }
  };

  const handleUpload = () => {
    if (!selectedType) { toast.error("Select a document type"); return; }
    uploadMutation.mutate({ documentType: selectedType, expirationDate: expirationDate || undefined, userType: "catalyst" });
  };

  const filterTabs: { id: DocFilter; label: string }[] = [
    { id: "all", label: "All" },
    { id: "authority", label: "Authority" },
    { id: "insurance", label: "Insurance" },
    { id: "safety", label: "Safety" },
    { id: "financial", label: "Financial" },
  ];

  const isLoading = statsQuery.isLoading || requirementsQuery.isLoading;

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1400px] mx-auto">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
            Catalyst Compliance
          </h1>
          <p className={cn("text-sm mt-1", isLight ? "text-slate-500" : "text-slate-400")}>
            FMCSA, DOT, Insurance & Authority Documents
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            className="bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white border-0 rounded-xl"
            onClick={() => setUploadOpen(true)}
          >
            <Upload className="w-4 h-4 mr-2" />Upload Document
          </Button>
          <Button variant="outline" size="sm" className={cn("rounded-lg", isLight ? "border-slate-200 hover:bg-slate-50" : "bg-slate-700/50 border-slate-600/50 hover:bg-slate-700")} onClick={() => { statsQuery.refetch?.(); userDocsQuery.refetch?.(); }}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* ── Compliance Score Hero ── */}
      <div className={cn("rounded-2xl overflow-hidden border", isLight ? "bg-white border-slate-200 shadow-lg" : "bg-slate-800/60 border-slate-700/50")}>
        <div className="bg-gradient-to-r from-[#1473FF]/10 to-[#BE01FF]/10 p-6 md:p-8">

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 items-center">
            {/* Score */}
            <div className="col-span-2 md:col-span-1 flex flex-col items-center">
              {isLoading ? <Skeleton className="h-20 w-20 rounded-full" /> : (
                <div className="relative w-24 h-24">
                  <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="42" fill="none" strokeWidth="8" className={isLight ? "stroke-slate-200" : "stroke-white/10"} />
                    <circle cx="50" cy="50" r="42" fill="none" strokeWidth="8" strokeLinecap="round" strokeDasharray={`${score * 2.64} 264`} stroke="url(#scoreGrad)" />
                    <defs><linearGradient id="scoreGrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#1473FF" /><stop offset="100%" stopColor="#BE01FF" /></linearGradient></defs>
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className={cn("text-2xl font-bold", isLight ? "text-slate-800" : "text-white")}>{score}%</span>
                  </div>
                </div>
              )}
              <p className={cn("text-xs font-medium mt-2", isLight ? "text-slate-500" : "text-slate-400")}>Compliance Score</p>
            </div>
            {/* Stat Cards */}
            {[
              { label: "Verified", value: verifiedCount, icon: <CheckCircle2 className="w-5 h-5" />, color: "text-green-400", bg: "bg-green-500/15" },
              { label: "Pending", value: pendingCount, icon: <Clock className="w-5 h-5" />, color: "text-yellow-400", bg: "bg-yellow-500/15" },
              { label: "Expiring", value: expiringCount, icon: <AlertTriangle className="w-5 h-5" />, color: "text-orange-400", bg: "bg-orange-500/15" },
              { label: "Missing", value: missingCount, icon: <XCircle className="w-5 h-5" />, color: "text-red-400", bg: "bg-red-500/15" },
            ].map((s) => (
              <div key={s.label} className={cn("p-4 rounded-2xl text-center", isLight ? "bg-white/70 border border-slate-200/60 backdrop-blur-sm" : "bg-white/[0.06] border border-white/[0.08] backdrop-blur-md")}>
                <div className={cn("w-10 h-10 rounded-xl mx-auto mb-2 flex items-center justify-center", s.bg)}>
                  <span className={s.color}>{s.icon}</span>
                </div>
                {isLoading ? <Skeleton className="h-8 w-12 mx-auto" /> : (
                  <p className={cn("text-2xl font-bold", s.color)}>{s.value}</p>
                )}
                <p className={cn("text-xs font-medium", isLight ? "text-slate-500" : "text-slate-400")}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Expiring Soon Alert ── */}
      {expiringItems.length > 0 && (
        <Card className={cn("rounded-xl border", isLight ? "bg-orange-50 border-orange-200" : "bg-orange-500/10 border-orange-500/30")}>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <ShieldAlert className={cn("w-5 h-5 mt-0.5 flex-shrink-0", isLight ? "text-orange-600" : "text-orange-400")} />
              <div className="flex-1">
                <p className={cn("font-semibold text-sm", isLight ? "text-orange-700" : "text-orange-300")}>Documents Expiring Soon</p>
                <div className="mt-2 space-y-1">
                  {expiringItems.slice(0, 3).map((item: any) => (
                    <div key={item.id} className={cn("flex items-center justify-between text-sm", isLight ? "text-orange-600/80" : "text-orange-200/80")}>
                      <span>{item.type} — {item.driver}</span>
                      <span className="font-medium">{item.daysRemaining}d left</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Search + Filters ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            value={searchTerm}
            onChange={(e: any) => setSearchTerm(e.target.value)}
            placeholder="Search documents..."
            className={cn("pl-9 rounded-lg", isLight ? "bg-white border-slate-200" : "bg-slate-800/50 border-slate-700/50")}
          />
        </div>
        <div className="flex items-center gap-1 overflow-x-auto">
          {filterTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all",
                activeTab === tab.id
                  ? "bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white shadow-md"
                  : isLight
                    ? "bg-slate-100 text-slate-500 hover:bg-slate-200"
                    : "bg-slate-800 text-slate-400 hover:bg-slate-700"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Document Checklist ── */}
      <Card className={cn("rounded-xl overflow-hidden border", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/50 border-slate-700/50")}>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-3">{[1,2,3,4,5].map((i: number) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div>
          ) : filteredDocs.length === 0 ? (
            <div className="text-center py-16">
              <div className={cn("p-4 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center", isLight ? "bg-slate-100" : "bg-slate-700/50")}>
                <FileText className="w-10 h-10 text-slate-400" />
              </div>
              <p className={cn("text-lg font-medium", isLight ? "text-slate-600" : "text-slate-300")}>No documents found</p>
              <p className="text-sm text-slate-400 mt-1">Upload your compliance documents to get started</p>
            </div>
          ) : (
            <div className={cn("divide-y", isLight ? "divide-slate-100" : "divide-slate-700/30")}>
              {filteredDocs.map((doc: any) => (
                <div key={doc.type} className={cn("flex items-center justify-between px-5 py-4 transition-colors", isLight ? "hover:bg-slate-50" : "hover:bg-white/[0.02]")}>
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "p-2.5 rounded-xl border",
                      doc.status === "verified" ? "bg-green-500/10 border-green-500/20" :
                      doc.status === "pending" ? "bg-yellow-500/10 border-yellow-500/20" :
                      doc.status === "expiring" ? "bg-orange-500/10 border-orange-500/20" :
                      isLight ? "bg-slate-50 border-slate-200" : "bg-white/[0.04] border-white/[0.06]"
                    )}>
                      {getCategoryIcon(doc.category)}
                    </div>
                    <div>
                      <p className={cn("font-semibold text-sm", isLight ? "text-slate-800" : "text-white")}>{doc.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={cn("text-xs", isLight ? "text-slate-400" : "text-slate-500")}>
                          {doc.required ? "Required" : "Optional"} · {doc.category}
                        </span>
                        {doc.expiryDate && (
                          <span className="text-xs text-slate-400">· Expires {new Date(doc.expiryDate).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {getStatusBadge(doc.status)}
                    {doc.status === "missing" && (
                      <Button
                        size="sm"
                        className="bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white border-0 text-xs rounded-lg h-8"
                        onClick={() => { setSelectedType(doc.type); setUploadOpen(true); }}
                      >
                        <Upload className="w-3 h-3 mr-1" />Upload
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Footer Count ── */}
      {filteredDocs.length > 0 && (
        <p className="text-center text-slate-500 text-xs">
          Showing {filteredDocs.length} of {enrichedDocs.length} document{enrichedDocs.length !== 1 ? "s" : ""}
          {verifiedCount > 0 && <span> · <span className="text-green-400">{verifiedCount} verified</span></span>}
          {missingCount > 0 && <span> · <span className="text-red-400">{missingCount} missing</span></span>}
        </p>
      )}

      {/* ── Upload Dialog ── */}
      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent
          className={cn("sm:max-w-md rounded-2xl", isLight ? "border-slate-200" : "border-slate-700/50")}
          style={isLight ? {} : { background: "linear-gradient(180deg, #161d35 0%, #0d1224 100%)" }}
        >
          <DialogHeader>
            <DialogTitle className={cn("text-lg font-bold", isLight ? "text-slate-800" : "text-white")}>Upload Compliance Document</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label className={cn("text-sm font-medium", isLight ? "text-slate-700" : "text-slate-300")}>Document Type</Label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className={cn("mt-1.5 rounded-xl", isLight ? "bg-slate-50 border-slate-200" : "bg-slate-900/50 border-slate-600")}>
                  <SelectValue placeholder="Select document type" />
                </SelectTrigger>
                <SelectContent>
                  {requirements.map((r: any) => (
                    <SelectItem key={r.type} value={r.type}>{r.name}{r.required ? " *" : ""}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className={cn("text-sm font-medium", isLight ? "text-slate-700" : "text-slate-300")}>Expiration Date</Label>
              <Input type="date" value={expirationDate} onChange={(e: any) => setExpirationDate(e.target.value)} className={cn("mt-1.5 rounded-xl", isLight ? "bg-slate-50 border-slate-200" : "bg-slate-900/50 border-slate-600")} />
            </div>
            <div>
              <Label className={cn("text-sm font-medium", isLight ? "text-slate-700" : "text-slate-300")}>Upload File</Label>
              <Input type="file" accept=".pdf,.jpg,.png,.jpeg" className={cn("mt-1.5 rounded-xl", isLight ? "bg-slate-50 border-slate-200" : "bg-slate-900/50 border-slate-600")} />
            </div>
            <Button
              className="w-full bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white border-0 rounded-xl py-5 font-semibold"
              onClick={handleUpload}
              disabled={!selectedType || uploadMutation.isPending}
            >
              {uploadMutation.isPending ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
              Upload Document
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
