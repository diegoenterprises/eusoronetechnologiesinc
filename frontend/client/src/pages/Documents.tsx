/**
 * DOCUMENT CENTER
 * Intelligent document management for the entire platform.
 * Smart auto-categorization, drag-and-drop upload, real DB storage.
 */

import React, { useState, useRef, useCallback } from "react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  FileText, Upload, Search, Download, Eye, Clock, Trash2,
  CheckCircle, AlertTriangle, Folder, Shield, Truck, Receipt,
  FileSignature, Building2, CreditCard, ClipboardList, X,
  LayoutGrid, List, Filter, ChevronDown, Plus, File,
  CalendarDays, Tag, ArrowUpDown, FolderOpen
} from "lucide-react";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// CATEGORY DEFINITIONS — single source of truth for the whole platform
// ---------------------------------------------------------------------------
const DOC_CATEGORIES = [
  { id: "all",         label: "All Documents",       icon: Folder,         color: "blue" },
  { id: "compliance",  label: "Compliance & Certs",  icon: CheckCircle,   color: "cyan" },
  { id: "insurance",   label: "Insurance",           icon: Shield,         color: "emerald" },
  { id: "permits",     label: "Permits & Authority", icon: ClipboardList, color: "purple" },
  { id: "operations",  label: "Operations",          icon: Truck,         color: "orange" },
  { id: "financial",   label: "Financial",           icon: CreditCard,    color: "green" },
  { id: "contracts",   label: "Contracts",           icon: FileSignature, color: "pink" },
  { id: "company",     label: "Company",             icon: Building2,     color: "indigo" },
  { id: "vehicle",     label: "Vehicle & Equipment", icon: Truck,         color: "amber" },
  { id: "other",       label: "Other",               icon: FileText,      color: "slate" },
] as const;

type CategoryId = typeof DOC_CATEGORIES[number]["id"];

// Maps filename patterns to category for auto-detection
const AUTO_DETECT_RULES: { pattern: RegExp; category: CategoryId }[] = [
  { pattern: /insur|liabil|cargo\s*ins|workers?\s*comp|bipd|certificate\s*of\s*ins/i, category: "insurance" },
  { pattern: /bol|bill\s*of\s*lading|pod|proof\s*of\s*delivery|rate\s*con|delivery\s*receipt|run\s*ticket|waybill|manifest|weight\s*ticket|dispatch/i, category: "operations" },
  { pattern: /permit|authority|mc\s*auth|dot\s*auth|oversize|hazmat\s*perm|operating\s*auth/i, category: "permits" },
  { pattern: /cdl|medical\s*card|drug\s*test|training|dot\s*physical|ifta|safety\s*cert|hazmat\s*end/i, category: "compliance" },
  { pattern: /invoice|receipt|payment|factoring|settlement|remittance/i, category: "financial" },
  { pattern: /contract|agreement|lease|broker.*catalyst|shipper.*catalyst|terms/i, category: "contracts" },
  { pattern: /w-?9|ein|articles?\s*of\s*inc|business\s*lic|tax\s*id|corp/i, category: "company" },
  { pattern: /registration|inspection|maintenance|tire|vin|title|vehicle/i, category: "vehicle" },
];

function detectCategory(filename: string): CategoryId {
  for (const rule of AUTO_DETECT_RULES) {
    if (rule.pattern.test(filename)) return rule.category;
  }
  return "other";
}

function getCategoryMeta(id: string) {
  return DOC_CATEGORIES.find(c => c.id === id) || DOC_CATEGORIES[DOC_CATEGORIES.length - 1];
}

function colorClasses(color: string) {
  const map: Record<string, { bg: string; text: string; ring: string }> = {
    blue:    { bg: "bg-blue-500/15",    text: "text-blue-400",    ring: "ring-blue-500/30" },
    emerald: { bg: "bg-emerald-500/15", text: "bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent", ring: "ring-emerald-500/30" },
    purple:  { bg: "bg-purple-500/15",  text: "text-purple-400",  ring: "ring-purple-500/30" },
    cyan:    { bg: "bg-cyan-500/15",    text: "text-cyan-400",    ring: "ring-cyan-500/30" },
    orange:  { bg: "bg-orange-500/15",  text: "text-orange-400",  ring: "ring-orange-500/30" },
    green:   { bg: "bg-green-500/15",   text: "text-green-400",   ring: "ring-green-500/30" },
    pink:    { bg: "bg-pink-500/15",    text: "text-pink-400",    ring: "ring-pink-500/30" },
    indigo:  { bg: "bg-indigo-500/15",  text: "text-indigo-400",  ring: "ring-indigo-500/30" },
    amber:   { bg: "bg-amber-500/15",   text: "text-amber-400",   ring: "ring-amber-500/30" },
    slate:   { bg: "bg-slate-500/15",   text: "text-slate-400",   ring: "ring-slate-500/30" },
  };
  return map[color] || map.slate;
}

// ---------------------------------------------------------------------------
// UPLOAD MODAL
// ---------------------------------------------------------------------------
function UploadModal({ open, onClose, onUploaded }: { open: boolean; onClose: () => void; onUploaded: () => void }) {
  const [files, setFiles] = useState<{ file: File; category: CategoryId; expiry: string; name: string }[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [digitizing, setDigitizing] = useState(false);
  const [digitizeResults, setDigitizeResults] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadMutation = (trpc as any).documents.upload.useMutation();
  const digitizeMutation = (trpc as any).documents.digitize.useMutation();

  const addFiles = useCallback((fileList: FileList | File[]) => {
    const arr = Array.from(fileList).map(f => ({
      file: f,
      name: f.name,
      category: detectCategory(f.name),
      expiry: "",
    }));
    setFiles(prev => [...prev, ...arr]);
    setDigitizeResults([]);
  }, []);

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

  // Standard upload (manual category)
  const handleUpload = async () => {
    if (!files.length) return;
    setUploading(true);
    try {
      for (const entry of files) {
        const base64 = await readFileAsBase64(entry.file);
        await uploadMutation.mutateAsync({
          name: entry.name,
          category: entry.category,
          fileData: base64,
          expirationDate: entry.expiry || undefined,
        });
      }
      setFiles([]);
      setDigitizeResults([]);
      onUploaded();
      onClose();
    } catch (err) {
      console.error("Upload failed:", err);
    } finally {
      setUploading(false);
    }
  };

  // Smart Digitize: OCR + ESANG AI classification + auto-save
  const handleDigitize = async () => {
    if (!files.length) return;
    setDigitizing(true);
    const results: any[] = [];
    try {
      for (let i = 0; i < files.length; i++) {
        const entry = files[i];
        const base64 = await readFileAsBase64(entry.file);
        const result = await digitizeMutation.mutateAsync({
          fileData: base64,
          filename: entry.name,
          autoSave: true,
        });
        results.push(result);
        // Update the file entry with AI-detected category + expiry
        if (result.classification) {
          const detectedCat = result.classification.category as CategoryId;
          const validCats = DOC_CATEGORIES.map(c => c.id);
          updateFile(i, {
            category: validCats.includes(detectedCat) ? detectedCat : "other",
            name: result.classification.documentTitle || entry.name,
            expiry: result.classification.suggestedExpiryDate || "",
          });
        }
      }
      setDigitizeResults(results);
      onUploaded();
    } catch (err) {
      console.error("Digitize failed:", err);
    } finally {
      setDigitizing(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl mx-4 shadow-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        {/* Modal header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-white">Upload Documents</h2>
            <p className="text-sm text-slate-400 mt-0.5">Drag files or browse. Use Smart Digitize for AI-powered classification.</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drop zone + files */}
        <div className="p-5 overflow-y-auto flex-1">
          <div
            className={cn(
              "border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer",
              isDragging
                ? "border-cyan-400 bg-cyan-500/10"
                : "border-slate-700 hover:border-slate-500 bg-slate-800/30"
            )}
            onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className={cn("w-10 h-10 mx-auto mb-3", isDragging ? "text-cyan-400" : "text-slate-500")} />
            <p className="text-white font-medium">
              {isDragging ? "Drop files here" : "Drag & drop files here"}
            </p>
            <p className="text-slate-500 text-sm mt-1">or click to browse - PDF, JPG, PNG, DOCX</p>
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
                const catMeta = getCategoryMeta(entry.category);
                const cc = colorClasses(catMeta.color);
                const aiResult = digitizeResults[idx];
                return (
                  <div key={idx} className="rounded-xl bg-slate-800/60 border border-slate-700/50 overflow-hidden">
                    <div className="flex items-start gap-3 p-3">
                      <div className={cn("p-2 rounded-lg shrink-0", cc.bg)}>
                        <File className={cn("w-4 h-4", cc.text)} />
                      </div>
                      <div className="flex-1 min-w-0 space-y-2">
                        <input
                          value={entry.name}
                          onChange={e => updateFile(idx, { name: e.target.value })}
                          className="w-full bg-transparent text-white text-sm font-medium outline-none border-b border-transparent focus:border-slate-600 pb-0.5"
                        />
                        <div className="flex gap-2 flex-wrap">
                          <select
                            value={entry.category}
                            onChange={e => updateFile(idx, { category: e.target.value as CategoryId })}
                            className="bg-slate-700 text-white text-xs rounded-lg px-2 py-1 border border-slate-600 outline-none"
                          >
                            {DOC_CATEGORIES.filter(c => c.id !== "all").map(c => (
                              <option key={c.id} value={c.id}>{c.label}</option>
                            ))}
                          </select>
                          <input
                            type="date"
                            value={entry.expiry}
                            onChange={e => updateFile(idx, { expiry: e.target.value })}
                            placeholder="Expiry date"
                            className="bg-slate-700 text-white text-xs rounded-lg px-2 py-1 border border-slate-600 outline-none"
                          />
                        </div>
                        <p className="text-[11px] text-slate-500">
                          {(entry.file.size / 1024).toFixed(0)} KB
                          {entry.category !== "other" && !aiResult && (
                            <span className={cn("ml-2", cc.text)}>Auto-detected: {catMeta.label}</span>
                          )}
                        </p>
                      </div>
                      <button onClick={() => removeFile(idx)} className="p-1 text-slate-500 hover:text-red-400 shrink-0">
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* AI Classification Result */}
                    {aiResult && (
                      <div className="px-3 pb-3">
                        <div className="bg-gradient-to-r from-purple-500/10 to-cyan-500/10 border border-purple-500/20 rounded-lg p-3 space-y-2">
                          <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
                            <span className="text-[11px] text-purple-300 font-medium uppercase tracking-wider">ESANG AI Classification</span>
                            <span className="text-[10px] text-slate-500 ml-auto">via {aiResult.ocr?.engine === "paddleocr" ? "PaddleOCR" : "ESANG AI Vision"}</span>
                          </div>
                          <p className="text-white text-sm">{aiResult.classification?.summary}</p>
                          <div className="flex flex-wrap gap-1.5">
                            <Badge className="bg-purple-500/15 text-purple-300 border-0 text-[10px]">
                              {aiResult.classification?.category}/{aiResult.classification?.subcategory}
                            </Badge>
                            <Badge className="bg-cyan-500/15 text-cyan-300 border-0 text-[10px]">
                              {aiResult.classification?.confidence}% confidence
                            </Badge>
                            <Badge className="bg-slate-500/15 text-slate-300 border-0 text-[10px]">
                              {aiResult.ocr?.lineCount} lines extracted
                            </Badge>
                          </div>
                          {aiResult.classification?.extractedFields && Object.keys(aiResult.classification.extractedFields).length > 0 && (
                            <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-1">
                              {Object.entries(aiResult.classification.extractedFields).slice(0, 6).map(([key, val]) => (
                                <div key={key} className="flex justify-between text-[11px]">
                                  <span className="text-slate-500">{key}</span>
                                  <span className="text-slate-300 font-medium truncate ml-2">{String(val)}</span>
                                </div>
                              ))}
                            </div>
                          )}
                          {aiResult.classification?.suggestedTags?.length > 0 && (
                            <div className="flex gap-1 flex-wrap">
                              {aiResult.classification.suggestedTags.map((tag: string) => (
                                <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-700/60 text-slate-400">{tag}</span>
                              ))}
                            </div>
                          )}
                          {aiResult.savedId && (
                            <p className="text-[10px] text-green-400">Saved to document center</p>
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
        <div className="flex items-center justify-between p-5 border-t border-slate-800 shrink-0">
          <p className="text-xs text-slate-500">{files.length} file{files.length !== 1 ? "s" : ""} selected</p>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose} className="text-slate-400">Cancel</Button>
            <Button
              disabled={!files.length || uploading || digitizing}
              onClick={handleDigitize}
              className="bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700"
            >
              {digitizing ? (
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Analyzing...
                </span>
              ) : "Smart Digitize"}
            </Button>
            <Button
              disabled={!files.length || uploading || digitizing}
              onClick={handleUpload}
              className="bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700"
            >
              {uploading ? "Uploading..." : "Upload"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// STATUS HELPERS
// ---------------------------------------------------------------------------
function statusBadge(status: string) {
  switch (status) {
    case "active":
      return <Badge className="bg-green-500/15 text-green-400 border-0 text-[11px]">Active</Badge>;
    case "expiring_soon":
    case "expiring":
      return <Badge className="bg-yellow-500/15 text-yellow-400 border-0 text-[11px]">Expiring</Badge>;
    case "expired":
      return <Badge className="bg-red-500/15 text-red-400 border-0 text-[11px]">Expired</Badge>;
    case "pending":
    case "pending_review":
      return <Badge className="bg-blue-500/15 text-blue-400 border-0 text-[11px]">Pending</Badge>;
    default:
      return <Badge className="bg-slate-500/15 text-slate-400 border-0 text-[11px]">{status}</Badge>;
  }
}

function formatBytes(bytes: number) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

// ---------------------------------------------------------------------------
// MAIN COMPONENT
// ---------------------------------------------------------------------------
export default function Documents() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState<CategoryId>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [showUpload, setShowUpload] = useState(false);
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "name">("newest");

  const docsQuery = (trpc as any).documents.getAll.useQuery(
    { search: searchTerm || undefined, category: activeCategory === "all" ? undefined : activeCategory },
    { refetchInterval: 30000 }
  );
  const statsQuery = (trpc as any).documents.getStats.useQuery(undefined, { refetchInterval: 30000 });
  const deleteMutation = (trpc as any).documents.delete.useMutation({
    onSuccess: () => { docsQuery.refetch(); statsQuery.refetch(); },
  });

  // Surface agreements as documents (contracts category)
  const agreementsQuery = (trpc as any).agreements?.list?.useQuery?.({ limit: 50 }, { refetchInterval: 60000 }) || { data: null };
  const agRaw = agreementsQuery.data;
  const agList: any[] = Array.isArray(agRaw) ? agRaw : Array.isArray(agRaw?.agreements) ? agRaw.agreements : [];
  const agreementDocs = agList.map((a: any) => ({
    id: `agr_${a.id}`,
    name: `${a.agreementType || "Agreement"} — ${a.agreementNumber || `#${a.id}`}`,
    category: "contracts",
    status: a.status === "signed" || a.status === "active" ? "active" : a.status === "expired" ? "expired" : a.status === "draft" ? "pending" : (a.status || "active"),
    uploadedAt: a.createdAt || new Date().toISOString(),
    expiryDate: a.expirationDate || null,
    size: 0,
    isAgreement: true,
  }));
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [previewDoc, setPreviewDoc] = useState<{ name: string; blobUrl: string; mime: string } | null>(null);

  // Build direct binary file URL (bypasses tRPC JSON for large files)
  const getFileUrl = (docId: string, download?: boolean) => {
    const numericId = docId.replace(/\D/g, '');
    return `/api/documents/${numericId}/file${download ? '?download=true' : ''}`;
  };

  // Infer MIME type from document type field or file extension
  const inferMime = (doc: any): string => {
    const t = (doc.type || doc.mimeType || '').toLowerCase();
    if (t.includes('pdf')) return 'application/pdf';
    if (t.includes('png')) return 'image/png';
    if (t.includes('jpg') || t.includes('jpeg')) return 'image/jpeg';
    if (t.includes('gif')) return 'image/gif';
    if (t.includes('doc') && !t.includes('docx')) return 'application/msword';
    if (t.includes('docx')) return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    if (t.includes('xls') && !t.includes('xlsx')) return 'application/vnd.ms-excel';
    if (t.includes('xlsx')) return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    // Try extension from name
    const name = (doc.name || '').toLowerCase();
    if (name.endsWith('.pdf')) return 'application/pdf';
    if (name.endsWith('.png')) return 'image/png';
    if (name.endsWith('.jpg') || name.endsWith('.jpeg')) return 'image/jpeg';
    if (name.endsWith('.gif')) return 'image/gif';
    if (name.endsWith('.docx')) return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    if (name.endsWith('.doc')) return 'application/msword';
    return 'application/pdf'; // default fallback
  };

  // Ensure filename has proper extension for download
  const ensureExtension = (name: string, mime: string): string => {
    if (!name) name = 'document';
    if (name.includes('.')) return name;
    const extMap: Record<string, string> = {
      'application/pdf': '.pdf', 'image/png': '.png', 'image/jpeg': '.jpg', 'image/gif': '.gif',
      'application/msword': '.doc', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
      'application/vnd.ms-excel': '.xls', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
    };
    return name + (extMap[mime] || '.pdf');
  };

  const handleDownload = useCallback(async (doc: any) => {
    setDownloadingId(doc.id);
    try {
      // Fetch via binary endpoint to get proper content
      const response = await fetch(getFileUrl(doc.id, true));
      if (!response.ok) throw new Error('Download failed');
      const blob = await response.blob();
      const mime = blob.type || inferMime(doc);
      const fileName = ensureExtension(doc.name || 'document', mime);
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
      toast.success(`Downloaded ${fileName}`);
    } catch (err) {
      console.error("Download error:", err);
      toast.error("Download failed");
    } finally {
      setDownloadingId(null);
    }
  }, []);

  const handleView = useCallback(async (doc: any) => {
    try {
      // Fetch the file to determine its actual content type
      const response = await fetch(getFileUrl(doc.id));
      if (!response.ok) throw new Error('Could not load document');
      const blob = await response.blob();
      const mime = blob.type || inferMime(doc);
      const blobUrl = URL.createObjectURL(blob);
      setPreviewDoc({ name: doc.name || 'Document', blobUrl, mime });
    } catch (err) {
      console.error("Preview error:", err);
      toast.error("Could not load document preview");
    }
  }, []);

  const stats = statsQuery.data || { total: 0, active: 0, expiring: 0, expired: 0 };

  // Merge uploaded docs + agreements into a single list
  const allDocs = [...(docsQuery.data || []), ...agreementDocs];

  // Client-side filtering + sorting
  const documents = allDocs
    .filter((d: any) => {
      if (statusFilter !== "all" && d.status !== statusFilter) return false;
      return true;
    })
    .sort((a: any, b: any) => {
      if (sortBy === "name") return (a.name || "").localeCompare(b.name || "");
      if (sortBy === "oldest") return (a.uploadedAt || "").localeCompare(b.uploadedAt || "");
      return (b.uploadedAt || "").localeCompare(a.uploadedAt || "");
    });

  const categoryCounts: Record<string, number> = {};
  allDocs.forEach((d: any) => {
    categoryCounts[d.category] = (categoryCounts[d.category] || 0) + 1;
  });

  return (
    <div className="p-4 md:p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
            Document Center
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Securely store, digitize, and manage all your operational and compliance documents
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setShowUpload(true)}
            className="bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 rounded-lg shadow-lg shadow-purple-900/20"
          >
            <Eye className="w-4 h-4 mr-2" />Digitize
          </Button>
          <Button
            onClick={() => setShowUpload(true)}
            className="bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 rounded-lg shadow-lg shadow-cyan-900/20"
          >
            <Upload className="w-4 h-4 mr-2" />Upload
          </Button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Total", value: stats.total, icon: Folder, color: "blue" },
          { label: "Active", value: stats.active, icon: CheckCircle, color: "green" },
          { label: "Expiring", value: stats.expiring, icon: Clock, color: "yellow" },
          { label: "Expired", value: stats.expired, icon: AlertTriangle, color: "red" },
        ].map(s => (
          <Card key={s.label} className="bg-slate-800/50 border-slate-700/50 rounded-xl hover:border-slate-600/50 transition-colors">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={cn("p-2.5 rounded-xl", `bg-${s.color}-500/15`)}>
                <s.icon className={cn("w-5 h-5", `text-${s.color}-400`)} />
              </div>
              <div>
                {statsQuery.isLoading ? (
                  <Skeleton className="h-7 w-10" />
                ) : (
                  <p className={cn("text-2xl font-bold", `text-${s.color}-400`)}>{s.value}</p>
                )}
                <p className="text-[11px] text-slate-500 uppercase tracking-wider">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Category chips */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {DOC_CATEGORIES.map(cat => {
          const count = cat.id === "all" ? stats.total : (categoryCounts[cat.id] || 0);
          const isActive = activeCategory === cat.id;
          const cc = colorClasses(cat.color);
          const Icon = cat.icon;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition-all border",
                isActive
                  ? `${cc.bg} ${cc.text} border-transparent ring-1 ${cc.ring}`
                  : "bg-slate-800/40 text-slate-400 border-slate-700/50 hover:bg-slate-800 hover:text-white"
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              {cat.label}
              {count > 0 && (
                <span className={cn(
                  "text-[10px] px-1.5 py-0.5 rounded-full font-medium",
                  isActive ? `${cc.bg} ${cc.text}` : "bg-slate-700 text-slate-400"
                )}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Toolbar: search + filters + view toggle */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <Input
            value={searchTerm}
            onChange={(e: any) => setSearchTerm(e.target.value)}
            placeholder="Search by name, type, or tag..."
            className="pl-9 bg-slate-800/50 border-slate-700/50 rounded-lg focus:border-cyan-500/50 h-9 text-sm"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="bg-slate-800 text-slate-300 text-xs rounded-lg px-2.5 py-1.5 border border-slate-700 outline-none hover:border-slate-600"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="expiring_soon">Expiring</option>
            <option value="expired">Expired</option>
            <option value="pending">Pending</option>
          </select>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as any)}
            className="bg-slate-800 text-slate-300 text-xs rounded-lg px-2.5 py-1.5 border border-slate-700 outline-none hover:border-slate-600"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="name">Name A-Z</option>
          </select>

          {/* View toggle */}
          <div className="flex bg-slate-800 rounded-lg border border-slate-700 p-0.5">
            <button
              onClick={() => setViewMode("list")}
              className={cn("p-1.5 rounded-md transition-colors", viewMode === "list" ? "bg-slate-700 text-white" : "text-slate-500 hover:text-white")}
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={cn("p-1.5 rounded-md transition-colors", viewMode === "grid" ? "bg-slate-700 text-white" : "text-slate-500 hover:text-white")}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Document list / grid */}
      {docsQuery.isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
        </div>
      ) : documents.length === 0 ? (
        <Card className="bg-slate-800/30 border-slate-700/50 rounded-xl">
          <CardContent className="py-20 text-center">
            <div className="p-5 rounded-2xl bg-slate-800/60 w-20 h-20 mx-auto mb-5 flex items-center justify-center">
              <FolderOpen className="w-10 h-10 text-slate-600" />
            </div>
            <p className="text-slate-300 text-lg font-medium">No documents yet</p>
            <p className="text-slate-500 text-sm mt-1 max-w-sm mx-auto">
              Upload your first document to get started. We'll auto-detect the category and classify it with AI.
            </p>
            <Button
              onClick={() => setShowUpload(true)}
              className="mt-5 bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 rounded-lg"
            >
              <Upload className="w-4 h-4 mr-2" />Upload Documents
            </Button>
          </CardContent>
        </Card>
      ) : viewMode === "list" ? (
        /* LIST VIEW */
        <Card className="bg-slate-800/30 border-slate-700/50 rounded-xl overflow-hidden">
          <div className="divide-y divide-slate-700/40">
            {documents.map((doc: any) => {
              const catMeta = getCategoryMeta(doc.category);
              const cc = colorClasses(catMeta.color);
              const Icon = catMeta.icon;
              return (
                <div key={doc.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-700/15 transition-colors group">
                  <div className={cn("p-2.5 rounded-xl shrink-0", cc.bg)}>
                    <Icon className={cn("w-5 h-5", cc.text)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{doc.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={cn("text-[11px]", cc.text)}>{catMeta.label}</span>
                      {doc.uploadedAt && (
                        <span className="text-[11px] text-slate-500">{doc.uploadedAt}</span>
                      )}
                      {doc.size > 0 && (
                        <span className="text-[11px] text-slate-600">{formatBytes(doc.size)}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {statusBadge(doc.status)}
                    <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-700 transition-colors"
                        onClick={() => handleView(doc)}
                        title="Preview document"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-700 transition-colors"
                        onClick={() => handleDownload(doc)}
                        title="Download document"
                      >
                        {downloadingId === doc.id ? <span className="w-3.5 h-3.5 border-2 border-slate-400/30 border-t-white rounded-full animate-spin inline-block" /> : <Download className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        onClick={() => deleteMutation.mutate({ id: doc.id })}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      ) : (
        /* GRID VIEW */
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {documents.map((doc: any) => {
            const catMeta = getCategoryMeta(doc.category);
            const cc = colorClasses(catMeta.color);
            const Icon = catMeta.icon;
            return (
              <Card key={doc.id} className="bg-slate-800/40 border-slate-700/50 rounded-xl hover:border-slate-600/50 transition-all group cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className={cn("p-2.5 rounded-xl", cc.bg)}>
                      <Icon className={cn("w-5 h-5", cc.text)} />
                    </div>
                    {statusBadge(doc.status)}
                  </div>
                  <p className="text-white text-sm font-medium truncate">{doc.name}</p>
                  <p className={cn("text-[11px] mt-1", cc.text)}>{catMeta.label}</p>
                  {doc.uploadedAt && (
                    <p className="text-[11px] text-slate-500 mt-0.5">{doc.uploadedAt}</p>
                  )}
                  <div className="flex gap-1 mt-3 pt-3 border-t border-slate-700/40 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-700 transition-colors"
                      onClick={() => handleView(doc)}
                      title="Preview document"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-700 transition-colors"
                      onClick={() => handleDownload(doc)}
                      title="Download document"
                    >
                      {downloadingId === doc.id ? <span className="w-3.5 h-3.5 border-2 border-slate-400/30 border-t-white rounded-full animate-spin inline-block" /> : <Download className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors ml-auto"
                      onClick={() => deleteMutation.mutate({ id: doc.id })}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Document Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={() => { if (previewDoc?.blobUrl) URL.revokeObjectURL(previewDoc.blobUrl); setPreviewDoc(null); }}>
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl mx-4 shadow-2xl flex flex-col" style={{ height: '85vh' }} onClick={e => e.stopPropagation()}>
            {/* Preview Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 rounded-lg bg-blue-500/15">
                  <FileText className="w-5 h-5 text-blue-400" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-white font-semibold truncate">{previewDoc.name}</h3>
                  <p className="text-xs text-slate-500">{previewDoc.mime || 'Document'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  size="sm"
                  className="bg-gradient-to-r from-cyan-600 to-emerald-600 text-white rounded-lg text-xs"
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = previewDoc.blobUrl;
                    link.download = ensureExtension(previewDoc.name, previewDoc.mime);
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                >
                  <Download className="w-3.5 h-3.5 mr-1" />Download
                </Button>
                <button
                  onClick={() => setPreviewDoc(null)}
                  className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            {/* Preview Content */}
            <div className="flex-1 overflow-auto bg-slate-950 rounded-b-2xl">
              {previewDoc.mime === 'application/pdf' ? (
                <iframe
                  src={previewDoc.blobUrl}
                  className="w-full h-full border-0"
                  title={previewDoc.name}
                />
              ) : previewDoc.mime.startsWith('image/') ? (
                <div className="flex items-center justify-center p-8 h-full overflow-auto">
                  <img src={previewDoc.blobUrl} alt={previewDoc.name} className="max-w-full max-h-full object-contain rounded-lg" />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center p-8">
                  <FileText className="w-16 h-16 text-slate-600 mb-4" />
                  <p className="text-white text-lg font-medium">Preview not available</p>
                  <p className="text-slate-500 text-sm mt-1">This file type cannot be previewed. Use the Download button above.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Upload modal */}
      <UploadModal
        open={showUpload}
        onClose={() => setShowUpload(false)}
        onUploaded={() => { docsQuery.refetch(); statsQuery.refetch(); }}
      />
    </div>
  );
}
