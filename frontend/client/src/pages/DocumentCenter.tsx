/**
 * DOCUMENT CENTER v2.0 — Fused Smart Compliance + AI Digitization
 * Role-based requirements, expiration tracking, compliance scoring,
 * Gemini AI document classification, drag-drop multi-file upload,
 * document preview, organization by category, auto-seed on first visit.
 */

import React, { useState, useCallback, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import { useTheme } from "@/contexts/ThemeContext";
import {
  FileText, Search, Upload, Download, Trash2, Eye, X,
  CheckCircle, Clock, AlertTriangle, Shield, ShieldCheck,
  XCircle, ArrowUpCircle, RefreshCw, ExternalLink,
  ChevronDown, ChevronRight, Filter, Loader2, Sparkles,
  FolderOpen, CreditCard, Truck, Users, Scale, Briefcase,
  GraduationCap, ScrollText, MapPin, Building2, Lock, File,
  LayoutGrid, List as ListIcon
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// ── Types ──
type DocTab = "all" | "missing" | "expiring" | "pending" | "rejected" | "verified";

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  CDL: <CreditCard className="w-4 h-4" />,
  DOT: <Shield className="w-4 h-4" />,
  HAZ: <AlertTriangle className="w-4 h-4" />,
  INS: <ShieldCheck className="w-4 h-4" />,
  TAX: <Scale className="w-4 h-4" />,
  EMP: <Users className="w-4 h-4" />,
  VEH: <Truck className="w-4 h-4" />,
  SAF: <GraduationCap className="w-4 h-4" />,
  OPS: <FolderOpen className="w-4 h-4" />,
  COM: <Building2 className="w-4 h-4" />,
  LEG: <ScrollText className="w-4 h-4" />,
  STATE: <MapPin className="w-4 h-4" />,
  AUT: <Briefcase className="w-4 h-4" />,
};

const CATEGORY_LABELS: Record<string, string> = {
  CDL: "Driver License", DOT: "DOT/FMCSA", HAZ: "Hazmat", INS: "Insurance",
  TAX: "Tax Forms", EMP: "Employment", VEH: "Vehicle", SAF: "Safety",
  OPS: "Operations", COM: "Compliance", LEG: "Legal", STATE: "State", AUT: "Authority",
};

function statusBadge(status: string, isLight: boolean) {
  const cfg: Record<string, { bg: string; text: string; label: string }> = {
    VERIFIED: { bg: "bg-green-500/15", text: "text-green-400", label: "Verified" },
    PENDING_REVIEW: { bg: "bg-blue-500/15", text: "text-blue-400", label: "Pending Review" },
    NOT_UPLOADED: { bg: "bg-slate-500/15", text: "text-slate-400", label: "Not Uploaded" },
    EXPIRING_SOON: { bg: "bg-yellow-500/15", text: "text-yellow-400", label: "Expiring Soon" },
    EXPIRED: { bg: "bg-red-500/15", text: "text-red-400", label: "Expired" },
    REJECTED: { bg: "bg-red-500/15", text: "text-red-400", label: "Rejected" },
    UPLOADING: { bg: "bg-blue-500/15", text: "text-blue-400", label: "Uploading..." },
    WAIVED: { bg: "bg-slate-500/15", text: "text-slate-400", label: "Waived" },
    NOT_APPLICABLE: { bg: "bg-slate-500/15", text: "text-slate-400", label: "N/A" },
  };
  const c = cfg[status] || cfg.NOT_UPLOADED;
  return <Badge className={cn("text-[10px] font-semibold border-0", c.bg, c.text)}>{c.label}</Badge>;
}

function severityBadge(severity: string) {
  const cfg: Record<string, { bg: string; text: string }> = {
    CRITICAL: { bg: "bg-red-500/15", text: "text-red-400" },
    HIGH: { bg: "bg-orange-500/15", text: "text-orange-400" },
    MEDIUM: { bg: "bg-yellow-500/15", text: "text-yellow-400" },
    LOW: { bg: "bg-blue-500/15", text: "text-blue-400" },
  };
  const c = cfg[severity] || cfg.MEDIUM;
  return <Badge className={cn("text-[10px] font-bold border-0 uppercase", c.bg, c.text)}>{severity}</Badge>;
}

// ── Compliance Score Ring ──
function ComplianceRing({ score, size = 120 }: { score: number; size?: number }) {
  const r = (size - 12) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = score >= 80 ? "#22c55e" : score >= 50 ? "#eab308" : "#ef4444";

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={10} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={color} strokeWidth={10} strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1s ease" }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-2xl font-black text-white">{score}%</span>
        <span className="text-[10px] text-slate-400 font-medium">Compliance</span>
      </div>
    </div>
  );
}

// ── Auto-detect category from filename ──
const AUTO_DETECT_RULES: { pattern: RegExp; category: string }[] = [
  { pattern: /insur|liabil|cargo\s*ins|workers?\s*comp|bipd|certificate\s*of\s*ins/i, category: "INS" },
  { pattern: /bol|bill\s*of\s*lading|pod|proof\s*of\s*delivery|rate\s*con|delivery\s*receipt|run\s*ticket|waybill|manifest|dispatch/i, category: "OPS" },
  { pattern: /permit|authority|mc\s*auth|dot\s*auth|oversize|hazmat\s*perm|operating\s*auth/i, category: "AUT" },
  { pattern: /cdl|medical\s*card|drug\s*test|training|dot\s*physical|ifta|safety\s*cert|hazmat\s*end/i, category: "CDL" },
  { pattern: /invoice|receipt|payment|factoring|settlement|remittance/i, category: "TAX" },
  { pattern: /contract|agreement|lease|broker|shipper|terms/i, category: "LEG" },
  { pattern: /w-?9|ein|articles?\s*of\s*inc|business\s*lic|tax\s*id|corp/i, category: "COM" },
  { pattern: /registration|inspection|maintenance|tire|vin|title|vehicle/i, category: "VEH" },
];
function detectCategoryFromName(filename: string): string {
  for (const rule of AUTO_DETECT_RULES) {
    if (rule.pattern.test(filename)) return rule.category;
  }
  return "";
}

// ── Upload Modal — Drag-drop, multi-file, Smart Digitize (Gemini AI) ──
function UploadModal({
  onClose,
  documentTypes,
  onUpload,
  uploading,
  onUploaded,
}: {
  onClose: () => void;
  documentTypes: any[];
  onUpload: (data: any) => void;
  uploading: boolean;
  onUploaded: () => void;
}) {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<{ file: File; docTypeId: string; docNumber: string; issuedBy: string; state: string; issuedDate: string; expiresAt: string }[]>([]);
  const [converting, setConverting] = useState(false);
  const [digitizing, setDigitizing] = useState(false);
  const [digitizeResults, setDigitizeResults] = useState<any[]>([]);
  const digitizeMutation = (trpc as any).documents?.digitize?.useMutation?.() || null;

  const addFiles = useCallback((fileList: FileList | File[]) => {
    const arr = Array.from(fileList).map(f => {
      const detected = detectCategoryFromName(f.name);
      const matchedType = detected ? documentTypes.find((t: any) => t.category === detected) : null;
      return {
        file: f,
        docTypeId: matchedType?.id || "",
        docNumber: "",
        issuedBy: "",
        state: "",
        issuedDate: "",
        expiresAt: "",
      };
    });
    setFiles(prev => [...prev, ...arr]);
    setDigitizeResults([]);
  }, [documentTypes]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
  }, [addFiles]);

  const removeFile = (idx: number) => {
    setFiles(prev => prev.filter((_, i) => i !== idx));
    setDigitizeResults(prev => prev.filter((_, i) => i !== idx));
  };
  const updateFile = (idx: number, patch: Partial<typeof files[0]>) =>
    setFiles(prev => prev.map((f, i) => i === idx ? { ...f, ...patch } : f));

  const readFileAsBase64 = (file: File): Promise<string> =>
    new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });

  // Standard upload
  const handleUpload = async () => {
    const valid = files.filter(f => f.docTypeId && f.file);
    if (!valid.length) {
      toast.error("Select a document type for each file");
      return;
    }
    setConverting(true);
    try {
      for (const entry of valid) {
        const base64Full = await readFileAsBase64(entry.file);
        const base64 = base64Full.split(",")[1] || base64Full;
        onUpload({
          documentTypeId: entry.docTypeId,
          fileName: entry.file.name,
          fileBase64: base64,
          mimeType: entry.file.type,
          documentNumber: entry.docNumber || undefined,
          issuedBy: entry.issuedBy || undefined,
          issuedByState: entry.state || undefined,
          issuedDate: entry.issuedDate || undefined,
          expiresAt: entry.expiresAt || undefined,
        });
      }
    } catch (err) {
      console.error("Upload failed:", err);
      toast.error("Upload failed");
    } finally {
      setConverting(false);
    }
  };

  // Smart Digitize: Gemini AI reads the document, classifies it, extracts fields
  const handleDigitize = async () => {
    if (!files.length || !digitizeMutation) {
      toast.error("Smart Digitize requires files to analyze");
      return;
    }
    setDigitizing(true);
    const results: any[] = [];
    try {
      for (let i = 0; i < files.length; i++) {
        const entry = files[i];
        const base64 = await readFileAsBase64(entry.file);
        const result = await digitizeMutation.mutateAsync({
          fileData: base64,
          filename: entry.file.name,
          autoSave: true,
        });
        results.push(result);
        if (result.classification) {
          const aiCat = result.classification.category;
          const matchedType = documentTypes.find((t: any) =>
            t.category === aiCat || t.name?.toLowerCase().includes(aiCat?.toLowerCase())
          );
          updateFile(i, {
            docTypeId: matchedType?.id || entry.docTypeId,
            expiresAt: result.classification.suggestedExpiryDate || entry.expiresAt,
          });
        }
      }
      setDigitizeResults(results);
      onUploaded();
      toast.success("AI analysis complete - documents classified and saved");
    } catch (err) {
      console.error("Digitize failed:", err);
      toast.error("Smart Digitize failed");
    } finally {
      setDigitizing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        className={cn("w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col", isLight ? "bg-white border border-slate-200" : "bg-slate-900 border border-slate-700")}
        style={{ maxHeight: "85vh" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className={cn("flex items-center justify-between p-5 border-b shrink-0", isLight ? "border-slate-200" : "border-slate-800")}>
          <div>
            <h2 className={cn("text-lg font-semibold", isLight ? "text-slate-900" : "text-white")}>Upload Documents</h2>
            <p className={cn("text-sm mt-0.5", isLight ? "text-slate-500" : "text-slate-400")}>Drag files or browse. Use Smart Digitize for AI-powered classification.</p>
          </div>
          <button onClick={onClose} className={cn("p-1.5 rounded-lg transition-colors", isLight ? "hover:bg-slate-100 text-slate-500" : "hover:bg-slate-800 text-slate-400 hover:text-white")}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="p-5 overflow-y-auto flex-1">
          {/* Drop zone */}
          <div
            className={cn(
              "border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer",
              isDragging
                ? "border-blue-400 bg-blue-500/10"
                : isLight ? "border-slate-300 hover:border-blue-400 bg-slate-50" : "border-slate-700 hover:border-slate-500 bg-slate-800/30"
            )}
            onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className={cn("w-10 h-10 mx-auto mb-3", isDragging ? "text-blue-400" : "text-slate-400")} />
            <p className={cn("font-medium", isLight ? "text-slate-700" : "text-white")}>
              {isDragging ? "Drop files here" : "Drag & drop files here"}
            </p>
            <p className={cn("text-sm mt-1", isLight ? "text-slate-400" : "text-slate-500")}>or click to browse - PDF, JPG, PNG, DOCX | Max 10MB</p>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx,.csv,.tiff,.heic"
              className="hidden"
              onChange={e => e.target.files && addFiles(e.target.files)}
            />
          </div>

          {/* File list */}
          {files.length > 0 && (
            <div className="mt-4 space-y-3">
              {files.map((entry, idx) => {
                const aiResult = digitizeResults[idx];
                return (
                  <div key={idx} className={cn("rounded-xl overflow-hidden border", isLight ? "bg-slate-50 border-slate-200" : "bg-slate-800/60 border-slate-700/50")}>
                    <div className="flex items-start gap-3 p-3">
                      <div className={cn("p-2 rounded-lg shrink-0", isLight ? "bg-blue-50" : "bg-blue-500/15")}>
                        <File className="w-4 h-4 text-blue-400" />
                      </div>
                      <div className="flex-1 min-w-0 space-y-2">
                        <p className={cn("text-sm font-medium truncate", isLight ? "text-slate-800" : "text-white")}>{entry.file.name}</p>
                        <p className={cn("text-[11px]", isLight ? "text-slate-400" : "text-slate-500")}>{(entry.file.size / 1024).toFixed(0)} KB</p>
                        {/* Document type selector */}
                        <Select value={entry.docTypeId} onValueChange={(v) => updateFile(idx, { docTypeId: v })}>
                          <SelectTrigger className={cn("h-8 text-xs", isLight ? "bg-white border-slate-300" : "bg-slate-700 border-slate-600")}>
                            <SelectValue placeholder="Select document type..." />
                          </SelectTrigger>
                          <SelectContent className="max-h-60">
                            {documentTypes.map((t: any) => (
                              <SelectItem key={t.id} value={t.id}>
                                <span className="flex items-center gap-2">
                                  {CATEGORY_ICONS[t.category] || <FileText className="w-3 h-3" />}
                                  <span>{t.name}</span>
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {/* Compact metadata row */}
                        <div className="grid grid-cols-3 gap-2">
                          <Input value={entry.docNumber} onChange={(e) => updateFile(idx, { docNumber: e.target.value })} placeholder="Doc #" className={cn("h-7 text-xs", isLight ? "" : "bg-slate-700 border-slate-600")} />
                          <Input value={entry.state} onChange={(e) => updateFile(idx, { state: e.target.value.toUpperCase().slice(0, 2) })} placeholder="ST" maxLength={2} className={cn("h-7 text-xs", isLight ? "" : "bg-slate-700 border-slate-600")} />
                          <Input type="date" value={entry.expiresAt} onChange={(e) => updateFile(idx, { expiresAt: e.target.value })} className={cn("h-7 text-xs", isLight ? "" : "bg-slate-700 border-slate-600")} />
                        </div>
                      </div>
                      <button onClick={() => removeFile(idx)} className="p-1 text-slate-500 hover:text-red-400 shrink-0">
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* AI Classification Result */}
                    {aiResult && (
                      <div className="px-3 pb-3">
                        <div className={cn("rounded-lg p-3 space-y-2 border", isLight ? "bg-purple-50 border-purple-200" : "bg-gradient-to-r from-purple-500/10 to-blue-500/10 border-purple-500/20")}>
                          <div className="flex items-center gap-2">
                            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                            <span className="text-[11px] text-purple-400 font-medium uppercase tracking-wider">AI Classification</span>
                            <span className="text-[10px] text-slate-500 ml-auto">{aiResult.classification?.confidence}% confidence</span>
                          </div>
                          <p className={cn("text-sm", isLight ? "text-slate-700" : "text-white")}>{aiResult.classification?.summary}</p>
                          <div className="flex flex-wrap gap-1.5">
                            <Badge className="bg-purple-500/15 text-purple-400 border-0 text-[10px]">
                              {aiResult.classification?.category}
                            </Badge>
                            {aiResult.ocr?.lineCount && (
                              <Badge className="bg-slate-500/15 text-slate-400 border-0 text-[10px]">
                                {aiResult.ocr.lineCount} lines extracted
                              </Badge>
                            )}
                          </div>
                          {aiResult.classification?.extractedFields && Object.keys(aiResult.classification.extractedFields).length > 0 && (
                            <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-1">
                              {Object.entries(aiResult.classification.extractedFields).slice(0, 6).map(([key, val]) => (
                                <div key={key} className="flex justify-between text-[11px]">
                                  <span className="text-slate-500">{key}</span>
                                  <span className={cn("font-medium truncate ml-2", isLight ? "text-slate-700" : "text-slate-300")}>{String(val)}</span>
                                </div>
                              ))}
                            </div>
                          )}
                          {aiResult.savedId && (
                            <p className="text-[10px] text-green-400 font-medium">Saved to document center</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={cn("flex items-center justify-between p-5 border-t shrink-0", isLight ? "border-slate-200" : "border-slate-800")}>
          <p className={cn("text-xs", isLight ? "text-slate-400" : "text-slate-500")}>{files.length} file{files.length !== 1 ? "s" : ""} selected</p>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose} className={isLight ? "text-slate-600" : "text-slate-400"}>Cancel</Button>
            {digitizeMutation && (
              <Button
                disabled={!files.length || uploading || digitizing || converting}
                onClick={handleDigitize}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white border-0"
              >
                {digitizing ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Analyzing...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5" />
                    Smart Digitize
                  </span>
                )}
              </Button>
            )}
            <Button
              disabled={!files.length || !files.some(f => f.docTypeId) || uploading || digitizing || converting}
              onClick={handleUpload}
              className="bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white border-0 hover:opacity-90"
            >
              {(uploading || converting) && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
              Upload
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Document Center Page ──
export default function DocumentCenter() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [activeTab, setActiveTab] = useState<DocTab>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showUpload, setShowUpload] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [autoSeeding, setAutoSeeding] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<{ name: string; blobUrl: string; mime: string } | null>(null);

  // ── Data queries ──
  const centerQuery = (trpc as any).documentCenter.getDocumentCenter.useQuery(undefined, {
    staleTime: 30000,
    retry: 2,
  });
  const docTypesQuery = (trpc as any).documentCenter.getDocumentTypes.useQuery(undefined, {
    staleTime: 60000,
  });

  // ── Mutations ──
  const uploadMut = (trpc as any).documentCenter.uploadDocument.useMutation({
    onSuccess: () => {
      toast.success("Document uploaded successfully");
      setShowUpload(false);
      centerQuery.refetch();
    },
    onError: (err: any) => toast.error(err.message || "Upload failed"),
  });

  const deleteMut = (trpc as any).documentCenter.deleteDocument.useMutation({
    onSuccess: () => {
      toast.success("Document removed");
      centerQuery.refetch();
    },
    onError: (err: any) => toast.error(err.message || "Delete failed"),
  });

  const seedTypesMut = (trpc as any).documentCenter.seedDocumentTypes.useMutation({
    onSuccess: () => {
      docTypesQuery.refetch();
      seedReqsMut.mutate();
    },
    onError: () => setAutoSeeding(false),
  });

  const seedReqsMut = (trpc as any).documentCenter.seedDocumentRequirements.useMutation({
    onSuccess: () => {
      centerQuery.refetch();
      setAutoSeeding(false);
    },
    onError: () => setAutoSeeding(false),
  });

  // ── Auto-seed on first visit if no documents/requirements exist ──
  const needsSeedCheck = !centerQuery.isLoading && (centerQuery.data?.documents?.all || []).length === 0;
  useEffect(() => {
    if (needsSeedCheck && !autoSeeding && !seedTypesMut.isPending && !seedReqsMut.isPending) {
      setAutoSeeding(true);
      seedTypesMut.mutate();
    }
  }, [needsSeedCheck]);

  // ── Derived data ──
  const data = centerQuery.data;
  const summary = data?.summary || { complianceScore: 0, canOperate: false, totalRequired: 0, totalCompleted: 0, totalMissing: 0, totalExpiring: 0, totalIssues: 0 };
  const urgentActions: any[] = data?.urgentActions || [];
  const allDocs: any[] = data?.documents?.all || [];

  const tabDocs: Record<DocTab, any[]> = {
    all: allDocs,
    missing: data?.documents?.missing || [],
    expiring: data?.documents?.expiring || [],
    pending: data?.documents?.pending || [],
    rejected: data?.documents?.rejected || [],
    verified: data?.documents?.verified || [],
  };

  // Filter by search + category
  let filteredDocs = tabDocs[activeTab];
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    filteredDocs = filteredDocs.filter((d: any) =>
      d.documentTypeName?.toLowerCase().includes(q) || d.documentTypeId?.toLowerCase().includes(q)
    );
  }
  if (categoryFilter && categoryFilter !== "all") {
    filteredDocs = filteredDocs.filter((d: any) => d.category === categoryFilter);
  }

  // Group by category
  const grouped = filteredDocs.reduce((acc: Record<string, any[]>, doc: any) => {
    const cat = doc.category || "OTHER";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(doc);
    return acc;
  }, {});
  const categoryKeys = Object.keys(grouped).sort();

  const toggleCategory = (cat: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  // Unique categories for filter
  const uniqueCategories = Array.from(new Set(allDocs.map((d: any) => d.category).filter(Boolean)));

  const tabs: { key: DocTab; label: string; count: number }[] = [
    { key: "all", label: "All", count: allDocs.length },
    { key: "missing", label: "Missing", count: (data?.documents?.missing || []).length },
    { key: "expiring", label: "Expiring", count: (data?.documents?.expiring || []).length },
    { key: "pending", label: "Pending", count: (data?.documents?.pending || []).length },
    { key: "rejected", label: "Rejected", count: (data?.documents?.rejected || []).length },
    { key: "verified", label: "Verified", count: (data?.documents?.verified || []).length },
  ];

  // ── Loading state ──
  if (centerQuery.isLoading) {
    return (
      <div className="space-y-4 max-w-7xl mx-auto">
        <Skeleton className="h-10 w-64 rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  // ── Empty state: no requirements found (need seed) ──
  const needsSeed = allDocs.length === 0 && !centerQuery.isLoading;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className={cn("text-2xl font-bold", isLight ? "text-slate-900" : "text-white")}>
            Document Center
          </h1>
          <p className={cn("text-sm mt-1", isLight ? "text-slate-500" : "text-slate-400")}>
            Smart compliance tracking with role-based requirements
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => centerQuery.refetch()}
            variant="outline"
            size="sm"
            className={cn("gap-1.5", isLight ? "" : "border-slate-700 text-slate-300")}
          >
            <RefreshCw className={cn("w-3.5 h-3.5", centerQuery.isFetching ? "animate-spin" : "")} />
            Refresh
          </Button>
          <Button
            onClick={() => setShowUpload(true)}
            size="sm"
            className="gap-1.5 bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white border-0 hover:opacity-90"
          >
            <Upload className="w-3.5 h-3.5" />
            Upload Document
          </Button>
        </div>
      </div>

      {/* Auto-seeding indicator (replaces old manual seed buttons) */}
      {needsSeed && (
        <Card className={cn("border-dashed border-2", isLight ? "border-blue-300 bg-blue-50" : "border-blue-500/30 bg-blue-500/5")}>
          <CardContent className="py-8 text-center">
            <Loader2 className={cn("w-10 h-10 mx-auto mb-3 animate-spin", isLight ? "text-blue-500" : "text-blue-400")} />
            <h3 className={cn("text-lg font-bold mb-2", isLight ? "text-slate-900" : "text-white")}>Setting Up Your Document Center</h3>
            <p className={cn("text-sm max-w-md mx-auto", isLight ? "text-slate-600" : "text-slate-400")}>
              Loading 80+ federal document types and role-based compliance requirements. This only happens once...
            </p>
          </CardContent>
        </Card>
      )}

      {/* Compliance Dashboard */}
      {!needsSeed && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            {/* Compliance Score Ring */}
            <Card className={cn("lg:col-span-1 flex items-center justify-center", isLight ? "bg-white border-slate-200" : "bg-slate-800/50 border-slate-700/50")}>
              <CardContent className="py-6 flex flex-col items-center">
                <ComplianceRing score={summary.complianceScore} />
                <div className="mt-3 text-center">
                  {summary.canOperate ? (
                    <Badge className="bg-green-500/15 text-green-400 border-0 text-xs gap-1">
                      <CheckCircle className="w-3 h-3" /> Can Operate
                    </Badge>
                  ) : (
                    <Badge className="bg-red-500/15 text-red-400 border-0 text-xs gap-1">
                      <XCircle className="w-3 h-3" /> Blocked
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Stats Grid */}
            <div className="lg:col-span-2 grid grid-cols-2 gap-3">
              {[
                { label: "Required", value: summary.totalRequired, icon: FileText, color: "text-blue-400", bg: "bg-blue-500/10" },
                { label: "Completed", value: summary.totalCompleted, icon: CheckCircle, color: "text-green-400", bg: "bg-green-500/10" },
                { label: "Missing", value: summary.totalMissing, icon: AlertTriangle, color: "text-yellow-400", bg: "bg-yellow-500/10" },
                { label: "Issues", value: summary.totalIssues, icon: XCircle, color: "text-red-400", bg: "bg-red-500/10" },
              ].map((stat) => (
                <Card key={stat.label} className={cn(isLight ? "bg-white border-slate-200" : "bg-slate-800/50 border-slate-700/50")}>
                  <CardContent className="py-4 px-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className={cn("p-1.5 rounded-lg", stat.bg)}>
                        <stat.icon className={cn("w-4 h-4", stat.color)} />
                      </div>
                      <span className={cn("text-xs font-medium", isLight ? "text-slate-500" : "text-slate-400")}>{stat.label}</span>
                    </div>
                    <p className={cn("text-2xl font-bold", isLight ? "text-slate-900" : "text-white")}>{stat.value}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Urgent Actions */}
            <Card className={cn("lg:col-span-2", isLight ? "bg-white border-slate-200" : "bg-slate-800/50 border-slate-700/50")}>
              <CardHeader className="pb-2">
                <CardTitle className={cn("text-sm font-semibold flex items-center gap-2", isLight ? "text-slate-900" : "text-white")}>
                  <AlertTriangle className="w-4 h-4 text-orange-400" />
                  Urgent Actions
                  {urgentActions.length > 0 && (
                    <Badge className="bg-red-500/15 text-red-400 border-0 text-[10px]">{urgentActions.length}</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 max-h-[200px] overflow-y-auto">
                {urgentActions.length === 0 ? (
                  <div className="text-center py-4">
                    <CheckCircle className="w-8 h-8 mx-auto text-green-400 mb-2" />
                    <p className={cn("text-sm font-medium", isLight ? "text-slate-600" : "text-slate-300")}>All clear</p>
                    <p className="text-xs text-slate-400">No urgent actions required</p>
                  </div>
                ) : (
                  urgentActions.map((action: any, i: number) => (
                    <div key={i} className={cn("flex items-start gap-3 p-2.5 rounded-lg", isLight ? "bg-slate-50" : "bg-slate-700/30")}>
                      <div className="flex-shrink-0 mt-0.5">
                        {action.severity === "CRITICAL" ? <XCircle className="w-4 h-4 text-red-400" /> :
                         action.severity === "HIGH" ? <AlertTriangle className="w-4 h-4 text-orange-400" /> :
                         <Clock className="w-4 h-4 text-yellow-400" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className={cn("text-xs font-semibold truncate", isLight ? "text-slate-800" : "text-white")}>{action.documentTypeName}</span>
                          {severityBadge(action.severity)}
                        </div>
                        <p className="text-[11px] text-slate-400 line-clamp-2">{action.message}</p>
                      </div>
                      {action.blocksOperations && (
                        <Lock className="w-3.5 h-3.5 text-red-400 flex-shrink-0 mt-0.5" />
                      )}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          {/* Progress Bar */}
          {summary.totalRequired > 0 && (
            <div className={cn("px-4 py-3 rounded-xl", isLight ? "bg-white border border-slate-200" : "bg-slate-800/50 border border-slate-700/50")}>
              <div className="flex items-center justify-between mb-2">
                <span className={cn("text-xs font-semibold", isLight ? "text-slate-700" : "text-slate-300")}>
                  Document Completion
                </span>
                <span className="text-xs text-slate-400">
                  {summary.totalCompleted} / {summary.totalRequired}
                </span>
              </div>
              <Progress
                value={summary.totalRequired > 0 ? (summary.totalCompleted / summary.totalRequired) * 100 : 0}
                className="h-2.5 bg-slate-700/30"
              />
            </div>
          )}

          {/* Tabs + Filter + Search */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center gap-1 overflow-x-auto pb-1">
              {tabs.map((tab) => (
                <Button
                  key={tab.key}
                  variant={activeTab === tab.key ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setActiveTab(tab.key)}
                  className={cn(
                    "gap-1.5 text-xs whitespace-nowrap",
                    activeTab === tab.key
                      ? "bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white border-0"
                      : isLight ? "text-slate-600 hover:text-slate-900" : "text-slate-400 hover:text-white"
                  )}
                >
                  {tab.label}
                  {tab.count > 0 && (
                    <span className={cn(
                      "text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1",
                      activeTab === tab.key ? "bg-white/20" : "bg-slate-500/20"
                    )}>
                      {tab.count}
                    </span>
                  )}
                </Button>
              ))}
            </div>
            <div className="flex items-center gap-2 sm:ml-auto">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search documents..."
                  className={cn("h-8 pl-8 w-48 text-xs", isLight ? "" : "bg-slate-800 border-slate-600")}
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className={cn("h-8 w-36 text-xs", isLight ? "" : "bg-slate-800 border-slate-600")}>
                  <Filter className="w-3 h-3 mr-1" />
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {uniqueCategories.map((cat: string) => (
                    <SelectItem key={cat} value={cat}>
                      <span className="flex items-center gap-1.5">
                        {CATEGORY_ICONS[cat]} {CATEGORY_LABELS[cat] || cat}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Document List grouped by category */}
          <div className="space-y-3">
            {filteredDocs.length === 0 ? (
              <Card className={cn(isLight ? "bg-white border-slate-200" : "bg-slate-800/50 border-slate-700/50")}>
                <CardContent className="py-12 text-center">
                  <FolderOpen className="w-12 h-12 mx-auto text-slate-500 mb-3" />
                  <p className={cn("text-sm font-medium", isLight ? "text-slate-600" : "text-slate-300")}>
                    {activeTab === "all" ? "No documents found" : `No ${activeTab} documents`}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    {searchQuery ? "Try a different search term" : "Upload documents to get started"}
                  </p>
                </CardContent>
              </Card>
            ) : (
              categoryKeys.map((cat) => {
                const docs = grouped[cat];
                const isExpanded = expandedCategories.has(cat) || categoryKeys.length <= 3;

                return (
                  <Card key={cat} className={cn(isLight ? "bg-white border-slate-200" : "bg-slate-800/50 border-slate-700/50")}>
                    <button
                      onClick={() => toggleCategory(cat)}
                      className={cn(
                        "w-full flex items-center justify-between px-5 py-3 text-left",
                        isLight ? "hover:bg-slate-50" : "hover:bg-slate-700/20"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn("p-2 rounded-lg", isLight ? "bg-slate-100" : "bg-slate-700/50")}>
                          {CATEGORY_ICONS[cat] || <FileText className="w-4 h-4 text-slate-400" />}
                        </div>
                        <div>
                          <span className={cn("text-sm font-semibold", isLight ? "text-slate-800" : "text-white")}>
                            {CATEGORY_LABELS[cat] || cat}
                          </span>
                          <span className="text-xs text-slate-400 ml-2">({docs.length})</span>
                        </div>
                      </div>
                      {isExpanded ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                    </button>

                    {isExpanded && (
                      <div className={cn("divide-y", isLight ? "divide-slate-100" : "divide-slate-700/30")}>
                        {docs.map((doc: any) => (
                          <div
                            key={doc.documentTypeId}
                            className={cn(
                              "flex items-center justify-between px-5 py-3.5 transition-colors",
                              doc.status === "EXPIRED" ? "bg-red-500/5 border-l-2 border-red-500" :
                              doc.status === "REJECTED" ? "bg-red-500/5 border-l-2 border-red-400" :
                              doc.status === "NOT_UPLOADED" && doc.isBlocking ? "bg-yellow-500/5 border-l-2 border-yellow-500" : "",
                              isLight ? "hover:bg-slate-50" : "hover:bg-slate-700/20"
                            )}
                          >
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              {doc.downloadTemplateUrl ? (
                                <a
                                  href={doc.downloadTemplateUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  title={`Download ${doc.documentTypeName} form`}
                                  className={cn(
                                    "p-2.5 rounded-xl flex-shrink-0 cursor-pointer transition-all hover:scale-110 hover:ring-2 hover:ring-blue-500/40",
                                    doc.status === "VERIFIED" ? "bg-green-500/10 hover:bg-green-500/20" :
                                    doc.status === "EXPIRED" || doc.status === "REJECTED" ? "bg-red-500/10 hover:bg-red-500/20" :
                                    doc.status === "EXPIRING_SOON" ? "bg-yellow-500/10 hover:bg-yellow-500/20" :
                                    doc.status === "NOT_UPLOADED" ? "bg-slate-500/10 hover:bg-blue-500/15" :
                                    "bg-blue-500/10 hover:bg-blue-500/20"
                                  )}
                                  onClick={(e) => { e.stopPropagation(); }}
                                >
                                  <Download className="w-4 h-4 text-blue-400" />
                                </a>
                              ) : (
                                <div className={cn(
                                  "p-2.5 rounded-xl flex-shrink-0",
                                  doc.status === "VERIFIED" ? "bg-green-500/10" :
                                  doc.status === "EXPIRED" || doc.status === "REJECTED" ? "bg-red-500/10" :
                                  doc.status === "EXPIRING_SOON" ? "bg-yellow-500/10" :
                                  doc.status === "NOT_UPLOADED" ? "bg-slate-500/10" :
                                  "bg-blue-500/10"
                                )}>
                                  {doc.status === "VERIFIED" ? <CheckCircle className="w-4 h-4 text-green-400" /> :
                                   doc.status === "EXPIRED" ? <XCircle className="w-4 h-4 text-red-400" /> :
                                   doc.status === "REJECTED" ? <XCircle className="w-4 h-4 text-red-400" /> :
                                   doc.status === "EXPIRING_SOON" ? <Clock className="w-4 h-4 text-yellow-400" /> :
                                   doc.status === "NOT_UPLOADED" ? <ArrowUpCircle className="w-4 h-4 text-slate-400" /> :
                                   doc.status === "PENDING_REVIEW" ? <Clock className="w-4 h-4 text-blue-400" /> :
                                   <FileText className="w-4 h-4 text-slate-400" />}
                                </div>
                              )}
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className={cn("text-sm font-semibold truncate", isLight ? "text-slate-800" : "text-white")}>{doc.documentTypeName}</p>
                                  {statusBadge(doc.status, isLight)}
                                  {doc.isBlocking && doc.status === "NOT_UPLOADED" && (
                                    <Badge className="bg-red-500/10 text-red-400 border-0 text-[9px] gap-0.5">
                                      <Lock className="w-2.5 h-2.5" /> Required
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-0.5">
                                  {doc.expiresAt && <span>Expires: {doc.expiresAt}</span>}
                                  {doc.daysUntilExpiry !== null && doc.daysUntilExpiry >= 0 && (
                                    <span className={doc.daysUntilExpiry <= 30 ? "text-yellow-400" : ""}>
                                      {doc.daysUntilExpiry} days left
                                    </span>
                                  )}
                                  {doc.rejectionReason && <span className="text-red-400 truncate max-w-[200px]">{doc.rejectionReason}</span>}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                              {doc.downloadTemplateUrl && (
                                <a href={doc.downloadTemplateUrl} target="_blank" rel="noreferrer" title="Download form">
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-400 hover:text-blue-400">
                                    <Download className="w-4 h-4" />
                                  </Button>
                                </a>
                              )}
                              {(doc.status === "NOT_UPLOADED" || doc.status === "EXPIRED" || doc.status === "REJECTED") && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 text-slate-400 hover:text-green-400"
                                  title="Upload"
                                  onClick={() => setShowUpload(true)}
                                >
                                  <Upload className="w-4 h-4" />
                                </Button>
                              )}
                              {doc.currentDocumentId && (
                                <>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-400 hover:text-white" title="View">
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="ghost" size="sm"
                                    className="h-8 w-8 p-0 text-red-400/60 hover:text-red-400"
                                    title="Remove"
                                    onClick={() => {
                                      if (confirm("Remove this document?")) {
                                        deleteMut.mutate({ documentId: doc.currentDocumentId });
                                      }
                                    }}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </Card>
                );
              })
            )}
          </div>

          {/* Next Expiration */}
          {data?.nextExpiration && (
            <Card className={cn("border-l-4 border-yellow-500", isLight ? "bg-yellow-50 border-yellow-200" : "bg-yellow-500/5 border-slate-700/50")}>
              <CardContent className="py-3 px-5 flex items-center gap-3">
                <Clock className="w-5 h-5 text-yellow-400 flex-shrink-0" />
                <div>
                  <span className={cn("text-sm font-semibold", isLight ? "text-slate-800" : "text-white")}>Next Expiration: </span>
                  <span className="text-sm text-yellow-400 font-medium">{data.nextExpiration.date}</span>
                  <span className="text-xs text-slate-400 ml-2">({data.nextExpiration.documentTypeId})</span>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Upload Modal */}
      {showUpload && (
        <UploadModal
          onClose={() => setShowUpload(false)}
          documentTypes={docTypesQuery.data || []}
          onUpload={(d) => uploadMut.mutate(d)}
          uploading={uploadMut.isPending}
          onUploaded={() => centerQuery.refetch()}
        />
      )}

      {/* Document Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={() => { if (previewDoc?.blobUrl) URL.revokeObjectURL(previewDoc.blobUrl); setPreviewDoc(null); }}>
          <div className={cn("rounded-2xl w-full max-w-4xl mx-4 shadow-2xl flex flex-col border", isLight ? "bg-white border-slate-200" : "bg-slate-900 border-slate-700")} style={{ height: '85vh' }} onClick={e => e.stopPropagation()}>
            <div className={cn("flex items-center justify-between p-4 border-b shrink-0", isLight ? "border-slate-200" : "border-slate-800")}>
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 rounded-lg bg-blue-500/15">
                  <FileText className="w-5 h-5 text-blue-400" />
                </div>
                <div className="min-w-0">
                  <h3 className={cn("font-semibold truncate", isLight ? "text-slate-900" : "text-white")}>{previewDoc.name}</h3>
                  <p className="text-xs text-slate-500">{previewDoc.mime || 'Document'}</p>
                </div>
              </div>
              <button onClick={() => { if (previewDoc?.blobUrl) URL.revokeObjectURL(previewDoc.blobUrl); setPreviewDoc(null); }} className={cn("p-1.5 rounded-lg transition-colors", isLight ? "hover:bg-slate-100 text-slate-500" : "hover:bg-slate-800 text-slate-400 hover:text-white")}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className={cn("flex-1 overflow-auto rounded-b-2xl", isLight ? "bg-slate-50" : "bg-slate-950")}>
              {previewDoc.mime === 'application/pdf' ? (
                <iframe src={previewDoc.blobUrl} className="w-full h-full border-0" title={previewDoc.name} />
              ) : previewDoc.mime?.startsWith('image/') ? (
                <div className="flex items-center justify-center p-8 h-full overflow-auto">
                  <img src={previewDoc.blobUrl} alt={previewDoc.name} className="max-w-full max-h-full object-contain rounded-lg" />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center p-8">
                  <FileText className="w-16 h-16 text-slate-600 mb-4" />
                  <p className={cn("text-lg font-medium", isLight ? "text-slate-800" : "text-white")}>Preview not available</p>
                  <p className="text-slate-500 text-sm mt-1">This file type cannot be previewed inline.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
