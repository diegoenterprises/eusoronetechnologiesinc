/**
 * RAIL DOCUMENTS — Document Management for Rail Shipments
 * Tabs: Waybills | BOLs | Hazmat Papers | Customs | All
 * Upload, preview, download, and manage rail freight documentation.
 */

import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  FileText,
  Download,
  Upload,
  Search,
  Filter,
  Eye,
  Trash2,
  Plus,
  CheckCircle,
  Clock,
  AlertTriangle,
  XCircle,
  File,
  FileCheck,
  FilePlus,
  FileWarning,
  Shield,
  Globe,
  Package,
  Train,
  ChevronDown,
  ChevronRight,
  X,
  Paperclip,
  Calendar,
  Hash,
  ExternalLink,
  MoreHorizontal,
  Printer,
  Send,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";
import { Link } from "wouter";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
interface RailDocument {
  id: string;
  type: "waybill" | "bol" | "hazmat" | "customs" | "inspection" | "rate_sheet" | "invoice" | "pod";
  shipmentNumber: string;
  shipmentId: number;
  documentNumber: string;
  title: string;
  status: "draft" | "active" | "pending_review" | "approved" | "expired" | "rejected";
  createdAt: string;
  updatedAt: string;
  fileSize: string;
  fileType: string;
  uploadedBy: string;
  notes?: string;
}

/* ------------------------------------------------------------------ */
/*  Status & type config                                               */
/* ------------------------------------------------------------------ */
const DOC_STATUS_COLORS: Record<string, string> = {
  draft: "bg-slate-500/20 text-slate-400",
  active: "bg-emerald-500/20 text-emerald-400",
  pending_review: "bg-yellow-500/20 text-yellow-400",
  approved: "bg-green-500/20 text-green-400",
  expired: "bg-red-500/20 text-red-400",
  rejected: "bg-red-500/20 text-red-400",
};

const DOC_TYPE_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  waybill: { label: "Waybill", icon: <FileText className="w-4 h-4" />, color: "text-blue-400" },
  bol: { label: "Bill of Lading", icon: <FileCheck className="w-4 h-4" />, color: "text-indigo-400" },
  hazmat: { label: "Hazmat Paper", icon: <FileWarning className="w-4 h-4" />, color: "text-amber-400" },
  customs: { label: "Customs Doc", icon: <Globe className="w-4 h-4" />, color: "text-teal-400" },
  inspection: { label: "Inspection", icon: <Shield className="w-4 h-4" />, color: "text-purple-400" },
  rate_sheet: { label: "Rate Sheet", icon: <File className="w-4 h-4" />, color: "text-cyan-400" },
  invoice: { label: "Invoice", icon: <FileText className="w-4 h-4" />, color: "text-emerald-400" },
  pod: { label: "Proof of Delivery", icon: <FileCheck className="w-4 h-4" />, color: "text-green-400" },
};

/* ------------------------------------------------------------------ */
/*  Mock documents                                                     */
/* ------------------------------------------------------------------ */
const MOCK_DOCUMENTS: RailDocument[] = [
  { id: "D-001", type: "waybill", shipmentNumber: "RS-14201", shipmentId: 1, documentNumber: "WB-88201", title: "Waybill — Grain CHI to LAX", status: "active", createdAt: "2026-03-28T10:00:00Z", updatedAt: "2026-03-28T10:00:00Z", fileSize: "245 KB", fileType: "PDF", uploadedBy: "System" },
  { id: "D-002", type: "waybill", shipmentNumber: "RS-14198", shipmentId: 2, documentNumber: "WB-88198", title: "Waybill — Chemicals HOU to ATL", status: "active", createdAt: "2026-03-27T14:30:00Z", updatedAt: "2026-03-27T14:30:00Z", fileSize: "312 KB", fileType: "PDF", uploadedBy: "System" },
  { id: "D-003", type: "bol", shipmentNumber: "RS-14201", shipmentId: 1, documentNumber: "BOL-44501", title: "BOL — 45 Covered Hoppers Grain", status: "approved", createdAt: "2026-03-28T08:00:00Z", updatedAt: "2026-03-28T12:00:00Z", fileSize: "189 KB", fileType: "PDF", uploadedBy: "Rail Ops" },
  { id: "D-004", type: "bol", shipmentNumber: "RS-14195", shipmentId: 3, documentNumber: "BOL-44498", title: "BOL — 110 Open Hoppers Coal", status: "pending_review", createdAt: "2026-03-27T09:00:00Z", updatedAt: "2026-03-27T09:00:00Z", fileSize: "202 KB", fileType: "PDF", uploadedBy: "Shipper" },
  { id: "D-005", type: "hazmat", shipmentNumber: "RS-14198", shipmentId: 2, documentNumber: "HZ-22101", title: "Hazmat Shipping Paper — Class 3 Chemicals", status: "approved", createdAt: "2026-03-27T11:00:00Z", updatedAt: "2026-03-27T15:00:00Z", fileSize: "178 KB", fileType: "PDF", uploadedBy: "Safety Dept" },
  { id: "D-006", type: "hazmat", shipmentNumber: "RS-14188", shipmentId: 4, documentNumber: "HZ-22098", title: "Hazmat Emergency Response — Tank Cars", status: "active", createdAt: "2026-03-26T13:00:00Z", updatedAt: "2026-03-26T13:00:00Z", fileSize: "156 KB", fileType: "PDF", uploadedBy: "Safety Dept" },
  { id: "D-007", type: "customs", shipmentNumber: "RS-14192", shipmentId: 5, documentNumber: "CUS-9901", title: "Customs Declaration — Cross-Border Rail", status: "pending_review", createdAt: "2026-03-26T16:00:00Z", updatedAt: "2026-03-26T16:00:00Z", fileSize: "340 KB", fileType: "PDF", uploadedBy: "Customs Agent" },
  { id: "D-008", type: "customs", shipmentNumber: "RS-14192", shipmentId: 5, documentNumber: "CUS-9902", title: "USMCA Certificate of Origin", status: "draft", createdAt: "2026-03-26T16:30:00Z", updatedAt: "2026-03-26T16:30:00Z", fileSize: "128 KB", fileType: "PDF", uploadedBy: "Shipper" },
  { id: "D-009", type: "inspection", shipmentNumber: "RS-14201", shipmentId: 1, documentNumber: "INS-55601", title: "FRA Inspection — Pre-Departure", status: "approved", createdAt: "2026-03-28T06:00:00Z", updatedAt: "2026-03-28T07:00:00Z", fileSize: "412 KB", fileType: "PDF", uploadedBy: "Inspector" },
  { id: "D-010", type: "rate_sheet", shipmentNumber: "RS-14201", shipmentId: 1, documentNumber: "RT-7701", title: "BNSF Rate Agreement — Grain Lane", status: "active", createdAt: "2026-03-20T10:00:00Z", updatedAt: "2026-03-20T10:00:00Z", fileSize: "98 KB", fileType: "PDF", uploadedBy: "Procurement" },
  { id: "D-011", type: "invoice", shipmentNumber: "RS-14190", shipmentId: 6, documentNumber: "INV-33401", title: "Invoice — Lumber MEM to DAL", status: "active", createdAt: "2026-03-25T09:00:00Z", updatedAt: "2026-03-25T09:00:00Z", fileSize: "145 KB", fileType: "PDF", uploadedBy: "Billing" },
  { id: "D-012", type: "pod", shipmentNumber: "RS-14190", shipmentId: 6, documentNumber: "POD-8801", title: "Proof of Delivery — Seattle Terminal", status: "approved", createdAt: "2026-03-28T22:45:00Z", updatedAt: "2026-03-29T01:00:00Z", fileSize: "567 KB", fileType: "PDF", uploadedBy: "Terminal" },
  { id: "D-013", type: "waybill", shipmentNumber: "RS-14195", shipmentId: 3, documentNumber: "WB-88195", title: "Waybill — Coal KC to SEA", status: "active", createdAt: "2026-03-27T08:00:00Z", updatedAt: "2026-03-27T08:00:00Z", fileSize: "278 KB", fileType: "PDF", uploadedBy: "System" },
  { id: "D-014", type: "bol", shipmentNumber: "RS-14188", shipmentId: 4, documentNumber: "BOL-44495", title: "BOL — 20 Tank Cars Chemicals", status: "approved", createdAt: "2026-03-26T10:00:00Z", updatedAt: "2026-03-26T14:00:00Z", fileSize: "195 KB", fileType: "PDF", uploadedBy: "Shipper" },
  { id: "D-015", type: "waybill", shipmentNumber: "RS-14202", shipmentId: 7, documentNumber: "WB-88202", title: "Waybill — Autos DEN to STL", status: "draft", createdAt: "2026-03-29T07:00:00Z", updatedAt: "2026-03-29T07:00:00Z", fileSize: "220 KB", fileType: "PDF", uploadedBy: "System" },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */
function SkeletonRows({ rows = 5, cols = 6 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-3 p-4">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-3">
          {Array.from({ length: cols }).map((_, j) => (
            <Skeleton key={j} className="h-5 flex-1 rounded" />
          ))}
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  SECTION: Upload Document Form                                      */
/* ------------------------------------------------------------------ */
function UploadDocumentForm({ isLight, text, muted, cardBg, onClose }: {
  isLight: boolean; text: string; muted: string; cardBg: string; onClose: () => void;
}) {
  const [docType, setDocType] = useState("waybill");
  const [shipmentNumber, setShipmentNumber] = useState("");
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const inputCls = cn("h-9 text-sm", isLight ? "bg-white border-slate-300" : "bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400");

  const handleUpload = () => {
    if (!file) { toast.error("Please select a file"); return; }
    if (!shipmentNumber) { toast.error("Please enter a shipment number"); return; }
    setUploading(true);
    setTimeout(() => {
      setUploading(false);
      toast.success(`Document uploaded: ${file.name}`);
      onClose();
    }, 1500);
  };

  return (
    <Card className={cn("border mb-4", cardBg)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className={cn("flex items-center gap-2 text-lg", text)}>
            <Upload className="w-5 h-5 text-blue-400" /> Upload Document
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-7 w-7 p-0">
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          <div>
            <label className={cn("text-xs font-medium mb-1 block", muted)}>Document Type</label>
            <select
              className={cn("w-full h-9 rounded-md border text-sm px-3", isLight ? "bg-white border-slate-300" : "bg-slate-700/50 border-slate-600 text-white")}
              value={docType}
              onChange={e => setDocType(e.target.value)}
            >
              <option value="waybill">Waybill</option>
              <option value="bol">Bill of Lading</option>
              <option value="hazmat">Hazmat Paper</option>
              <option value="customs">Customs Document</option>
              <option value="inspection">Inspection Report</option>
              <option value="rate_sheet">Rate Sheet</option>
              <option value="invoice">Invoice</option>
              <option value="pod">Proof of Delivery</option>
            </select>
          </div>
          <div>
            <label className={cn("text-xs font-medium mb-1 block", muted)}>Shipment #</label>
            <Input placeholder="e.g. RS-14201" value={shipmentNumber} onChange={e => setShipmentNumber(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={cn("text-xs font-medium mb-1 block", muted)}>Title</label>
            <Input placeholder="Document title" value={title} onChange={e => setTitle(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={cn("text-xs font-medium mb-1 block", muted)}>Notes (optional)</label>
            <Input placeholder="Additional notes" value={notes} onChange={e => setNotes(e.target.value)} className={inputCls} />
          </div>
        </div>

        {/* File drop zone */}
        <div
          className={cn(
            "rounded-lg border-2 border-dashed p-6 text-center transition-colors cursor-pointer",
            file
              ? (isLight ? "border-blue-300 bg-blue-50" : "border-blue-500/30 bg-blue-500/5")
              : (isLight ? "border-slate-300 hover:border-blue-300 hover:bg-blue-50/50" : "border-slate-600 hover:border-blue-500/30 hover:bg-blue-500/5")
          )}
          onClick={() => document.getElementById("rail-doc-upload")?.click()}
        >
          <input
            id="rail-doc-upload"
            type="file"
            className="hidden"
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.xlsx"
            onChange={e => setFile(e.target.files?.[0] || null)}
          />
          {file ? (
            <div className="flex items-center justify-center gap-3">
              <Paperclip className="w-5 h-5 text-blue-500" />
              <div>
                <div className={cn("font-medium text-sm", text)}>{file.name}</div>
                <div className={cn("text-xs", muted)}>{(file.size / 1024).toFixed(1)} KB</div>
              </div>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={e => { e.stopPropagation(); setFile(null); }}>
                <X className="w-3.5 h-3.5" />
              </Button>
            </div>
          ) : (
            <div>
              <Upload className={cn("w-8 h-8 mx-auto mb-2", muted)} />
              <p className={cn("text-sm", text)}>Click to upload or drag and drop</p>
              <p className={cn("text-xs mt-1", muted)}>PDF, DOC, XLSX, JPG, PNG (max 10MB)</p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" size="sm" onClick={onClose} className={cn("h-8", isLight ? "border-slate-300" : "border-slate-600 text-slate-300")}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleUpload} disabled={uploading} className="h-8 bg-blue-600 hover:bg-blue-700 text-white">
            {uploading ? <RefreshCw className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Upload className="w-3.5 h-3.5 mr-1" />}
            {uploading ? "Uploading..." : "Upload Document"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  SECTION: Document Preview                                          */
/* ------------------------------------------------------------------ */
function DocumentPreview({ doc, isLight, text, muted, cardBg, onClose }: {
  doc: RailDocument; isLight: boolean; text: string; muted: string; cardBg: string; onClose: () => void;
}) {
  const typeConfig = DOC_TYPE_CONFIG[doc.type] || { label: doc.type, icon: <File className="w-4 h-4" />, color: "text-slate-400" };

  return (
    <Card className={cn("border mb-4", cardBg)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={typeConfig.color}>{typeConfig.icon}</div>
            <CardTitle className={cn("text-lg", text)}>{doc.title}</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className={cn("h-7 text-xs", isLight ? "border-slate-300" : "border-slate-600 text-slate-300")}>
              <Printer className="w-3 h-3 mr-1" /> Print
            </Button>
            <Button variant="outline" size="sm" className={cn("h-7 text-xs", isLight ? "border-slate-300" : "border-slate-600 text-slate-300")}>
              <Send className="w-3 h-3 mr-1" /> Share
            </Button>
            <Button variant="outline" size="sm" className={cn("h-7 text-xs", isLight ? "border-slate-300" : "border-slate-600 text-slate-300")}>
              <Download className="w-3 h-3 mr-1" /> Download
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose} className="h-7 w-7 p-0">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Document metadata */}
        <div className={cn("grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 p-3 rounded-lg border", isLight ? "bg-slate-50 border-slate-200" : "bg-slate-800/40 border-slate-700/40")}>
          <div>
            <div className={cn("text-xs", muted)}>Document #</div>
            <div className={cn("text-sm font-medium", text)}>{doc.documentNumber}</div>
          </div>
          <div>
            <div className={cn("text-xs", muted)}>Shipment</div>
            <Link href={`/rail/shipments`}>
              <div className={cn("text-sm font-medium", isLight ? "text-blue-600" : "text-blue-400")}>{doc.shipmentNumber}</div>
            </Link>
          </div>
          <div>
            <div className={cn("text-xs", muted)}>Type</div>
            <div className="flex items-center gap-1">
              <span className={typeConfig.color}>{typeConfig.icon}</span>
              <span className={cn("text-sm", text)}>{typeConfig.label}</span>
            </div>
          </div>
          <div>
            <div className={cn("text-xs", muted)}>Status</div>
            <Badge className={cn("text-xs", DOC_STATUS_COLORS[doc.status])}>{doc.status.replace(/_/g, " ")}</Badge>
          </div>
          <div>
            <div className={cn("text-xs", muted)}>Created</div>
            <div className={cn("text-sm", text)}>{new Date(doc.createdAt).toLocaleString()}</div>
          </div>
          <div>
            <div className={cn("text-xs", muted)}>Updated</div>
            <div className={cn("text-sm", text)}>{new Date(doc.updatedAt).toLocaleString()}</div>
          </div>
          <div>
            <div className={cn("text-xs", muted)}>File</div>
            <div className={cn("text-sm", text)}>{doc.fileType} — {doc.fileSize}</div>
          </div>
          <div>
            <div className={cn("text-xs", muted)}>Uploaded By</div>
            <div className={cn("text-sm", text)}>{doc.uploadedBy}</div>
          </div>
        </div>

        {/* Document preview area */}
        <div className={cn(
          "rounded-xl border flex items-center justify-center",
          isLight ? "bg-slate-100 border-slate-200" : "bg-slate-900 border-slate-700/40"
        )} style={{ minHeight: 300 }}>
          <div className={cn("text-center", muted)}>
            <FileText className="w-16 h-16 mx-auto mb-3 opacity-20" />
            <p className={cn("text-sm font-medium", text)}>{doc.title}</p>
            <p className="text-xs mt-1">{doc.fileType} Document — {doc.fileSize}</p>
            <Button size="sm" className="mt-3 h-8 bg-blue-600 hover:bg-blue-700 text-white text-xs">
              <Download className="w-3.5 h-3.5 mr-1" /> Download to View
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  SECTION: Document Row                                              */
/* ------------------------------------------------------------------ */
function DocumentRow({ doc, isLight, text, muted, onPreview }: {
  doc: RailDocument; isLight: boolean; text: string; muted: string; onPreview: (doc: RailDocument) => void;
}) {
  const typeConfig = DOC_TYPE_CONFIG[doc.type] || { label: doc.type, icon: <File className="w-4 h-4" />, color: "text-slate-400" };

  return (
    <div className={cn("grid grid-cols-7 gap-3 px-4 py-3 text-sm border-b last:border-b-0 transition-colors cursor-pointer",
      isLight ? "hover:bg-slate-50 border-slate-100" : "hover:bg-slate-700/20 border-slate-700/20"
    )} onClick={() => onPreview(doc)}>
      <div className="flex items-center gap-2">
        <span className={typeConfig.color}>{typeConfig.icon}</span>
        <span className={cn("font-medium text-xs", text)}>{typeConfig.label}</span>
      </div>
      <span className={cn("font-medium", isLight ? "text-blue-600" : "text-blue-400")}>{doc.shipmentNumber}</span>
      <span className={cn("truncate", text)} title={doc.title}>{doc.title}</span>
      <span className={cn("text-xs", muted)}>{doc.documentNumber}</span>
      <span className={cn("text-xs", muted)}>{new Date(doc.createdAt).toLocaleDateString()}</span>
      <Badge className={cn("w-fit text-xs", DOC_STATUS_COLORS[doc.status])}>{doc.status.replace(/_/g, " ")}</Badge>
      <div className="flex items-center gap-1.5">
        <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={e => { e.stopPropagation(); toast.success("Downloading..."); }}>
          <Download className="w-3.5 h-3.5 text-slate-400" />
        </Button>
        <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={e => { e.stopPropagation(); onPreview(doc); }}>
          <Eye className="w-3.5 h-3.5 text-slate-400" />
        </Button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  SECTION: Document List                                             */
/* ------------------------------------------------------------------ */
function DocumentList({ documents, isLight, text, muted, cardBg, onPreview }: {
  documents: RailDocument[];
  isLight: boolean;
  text: string;
  muted: string;
  cardBg: string;
  onPreview: (doc: RailDocument) => void;
}) {
  return (
    <Card className={cn("border", cardBg)}>
      <CardContent className="p-0">
        <div className={cn("grid grid-cols-7 gap-3 px-4 py-2.5 text-xs font-medium border-b",
          isLight ? "text-slate-500 bg-slate-50 border-slate-200" : "text-slate-400 bg-slate-800/40 border-slate-700/40"
        )}>
          <span>Type</span>
          <span>Shipment #</span>
          <span>Title</span>
          <span>Doc #</span>
          <span>Created</span>
          <span>Status</span>
          <span>Actions</span>
        </div>

        {documents.length === 0 ? (
          <div className={cn("text-center py-12", muted)}>
            <FileText className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No documents found</p>
            <p className="text-xs mt-1">Upload a document or adjust your search</p>
          </div>
        ) : (
          documents.map(doc => (
            <DocumentRow key={doc.id} doc={doc} isLight={isLight} text={text} muted={muted} onPreview={onPreview} />
          ))
        )}

        {documents.length > 0 && (
          <div className={cn("px-4 py-2 text-xs border-t", isLight ? "text-slate-400 border-slate-200 bg-slate-50" : "text-slate-500 border-slate-700/40 bg-slate-800/20")}>
            Showing {documents.length} document{documents.length !== 1 ? "s" : ""}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  SECTION: Stats cards                                               */
/* ------------------------------------------------------------------ */
function DocStatsRow({ isLight, text, muted }: { isLight: boolean; text: string; muted: string }) {
  const stats = useMemo(() => {
    const byType: Record<string, number> = {};
    const byStatus: Record<string, number> = {};
    MOCK_DOCUMENTS.forEach(d => {
      byType[d.type] = (byType[d.type] || 0) + 1;
      byStatus[d.status] = (byStatus[d.status] || 0) + 1;
    });
    return { total: MOCK_DOCUMENTS.length, byType, byStatus };
  }, []);

  const cards = [
    { label: "Total Documents", value: stats.total, accent: "blue", icon: <FileText className="w-4 h-4" /> },
    { label: "Pending Review", value: stats.byStatus["pending_review"] || 0, accent: "amber", icon: <Clock className="w-4 h-4" /> },
    { label: "Approved", value: stats.byStatus["approved"] || 0, accent: "emerald", icon: <CheckCircle className="w-4 h-4" /> },
    { label: "Waybills", value: stats.byType["waybill"] || 0, accent: "cyan", icon: <File className="w-4 h-4" /> },
  ];

  const accentMap: Record<string, string> = {
    blue: isLight ? "bg-blue-50 text-blue-600" : "bg-blue-500/10 text-blue-400",
    amber: isLight ? "bg-amber-50 text-amber-600" : "bg-amber-500/10 text-amber-400",
    emerald: isLight ? "bg-emerald-50 text-emerald-600" : "bg-emerald-500/10 text-emerald-400",
    cyan: isLight ? "bg-cyan-50 text-cyan-600" : "bg-cyan-500/10 text-cyan-400",
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {cards.map(c => (
        <div key={c.label} className={cn(
          "rounded-xl border p-3 transition-all hover:scale-[1.02]",
          isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/60 border-slate-700/50"
        )}>
          <div className={cn("p-1.5 rounded-lg w-fit mb-1.5", accentMap[c.accent])}>{c.icon}</div>
          <div className={cn("text-xl font-bold", text)}>{c.value}</div>
          <div className={cn("text-xs", muted)}>{c.label}</div>
        </div>
      ))}
    </div>
  );
}

/* ================================================================== */
/*  MAIN COMPONENT                                                     */
/* ================================================================== */
export default function RailDocuments() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");
  const [showUpload, setShowUpload] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<RailDocument | null>(null);

  /* Style tokens */
  const bg = isLight ? "bg-slate-50" : "bg-[#0a0a0a]";
  const cardBg = cn(isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/60 border-slate-700/50");
  const text = isLight ? "text-slate-900" : "text-white";
  const muted = isLight ? "text-slate-500" : "text-slate-400";

  /* Filter documents by tab and search */
  const filtered = useMemo(() => {
    let docs = [...MOCK_DOCUMENTS];

    /* Tab filter */
    if (tab === "waybills") docs = docs.filter(d => d.type === "waybill");
    else if (tab === "bols") docs = docs.filter(d => d.type === "bol");
    else if (tab === "hazmat") docs = docs.filter(d => d.type === "hazmat");
    else if (tab === "customs") docs = docs.filter(d => d.type === "customs");
    /* "all" shows everything */

    /* Search filter */
    if (search) {
      const q = search.toLowerCase();
      docs = docs.filter(d =>
        d.title.toLowerCase().includes(q) ||
        d.shipmentNumber.toLowerCase().includes(q) ||
        d.documentNumber.toLowerCase().includes(q) ||
        d.type.includes(q)
      );
    }

    /* Sort by date desc */
    docs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return docs;
  }, [tab, search]);

  return (
    <div className={cn("min-h-screen p-6 space-y-5", bg)}>
      {/* ---- Header ---- */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className={cn("p-2.5 rounded-xl", isLight ? "bg-indigo-50" : "bg-indigo-500/10")}>
            <FileText className="w-7 h-7 text-indigo-500" />
          </div>
          <div>
            <h1 className={cn("text-2xl font-bold", text)}>Rail Documents</h1>
            <p className={cn("text-sm", muted)}>Manage waybills, BOLs, hazmat papers, and customs documents</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => { setShowUpload(!showUpload); setPreviewDoc(null); }}
            className={cn("h-9", showUpload ? "bg-blue-500/10 border-blue-500/30 text-blue-500" : (isLight ? "border-slate-300" : "border-slate-600 text-slate-300 hover:bg-slate-700/50"))}
          >
            <Upload className="w-4 h-4 mr-1" /> Upload Document
          </Button>
        </div>
      </div>

      {/* ---- Stats ---- */}
      <DocStatsRow isLight={isLight} text={text} muted={muted} />

      {/* ---- Upload Form ---- */}
      {showUpload && (
        <UploadDocumentForm isLight={isLight} text={text} muted={muted} cardBg={cardBg} onClose={() => setShowUpload(false)} />
      )}

      {/* ---- Document Preview ---- */}
      {previewDoc && (
        <DocumentPreview doc={previewDoc} isLight={isLight} text={text} muted={muted} cardBg={cardBg} onClose={() => setPreviewDoc(null)} />
      )}

      {/* ---- Search ---- */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          className={cn("pl-9 h-10", isLight ? "bg-white border-slate-300" : "bg-slate-800/60 border-slate-700 text-white placeholder:text-slate-400")}
          placeholder="Search by title, shipment #, document #..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* ---- Tabs ---- */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className={cn(isLight ? "bg-slate-100" : "bg-slate-800/60")}>
          <TabsTrigger value="all" className="text-sm">All ({MOCK_DOCUMENTS.length})</TabsTrigger>
          <TabsTrigger value="waybills" className="text-sm">Waybills ({MOCK_DOCUMENTS.filter(d => d.type === "waybill").length})</TabsTrigger>
          <TabsTrigger value="bols" className="text-sm">BOLs ({MOCK_DOCUMENTS.filter(d => d.type === "bol").length})</TabsTrigger>
          <TabsTrigger value="hazmat" className="text-sm">Hazmat ({MOCK_DOCUMENTS.filter(d => d.type === "hazmat").length})</TabsTrigger>
          <TabsTrigger value="customs" className="text-sm">Customs ({MOCK_DOCUMENTS.filter(d => d.type === "customs").length})</TabsTrigger>
        </TabsList>

        {/* All tabs share the same content, just filtered differently */}
        <div className="mt-4">
          <DocumentList
            documents={filtered}
            isLight={isLight}
            text={text}
            muted={muted}
            cardBg={cardBg}
            onPreview={doc => { setPreviewDoc(doc); setShowUpload(false); }}
          />
        </div>
      </Tabs>

      {/* ---- Document Compliance Notice ---- */}
      <ComplianceNotice isLight={isLight} text={text} muted={muted} cardBg={cardBg} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  SECTION: Document Compliance Notice                                */
/* ------------------------------------------------------------------ */
function ComplianceNotice({ isLight, text, muted, cardBg }: {
  isLight: boolean; text: string; muted: string; cardBg: string;
}) {
  const requirements = [
    { doc: "Waybill", rule: "AAR Circular OT-55 — Required for all rail shipments before departure", status: "compliant" as const },
    { doc: "Bill of Lading", rule: "49 CFR Part 174 — Must accompany all freight shipments", status: "compliant" as const },
    { doc: "Hazmat Shipping Papers", rule: "49 CFR 172.200-204 — Required for all hazardous materials", status: "review" as const },
    { doc: "Emergency Response Info", rule: "49 CFR 172.602 — Must be accessible to train crew", status: "compliant" as const },
    { doc: "Customs Declaration", rule: "CBP Form 7501 — Required for cross-border rail shipments", status: "pending" as const },
    { doc: "USMCA Certificate", rule: "Required for duty-free treatment under USMCA", status: "pending" as const },
  ];

  const statusIcon: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
    compliant: { icon: <CheckCircle className="w-3.5 h-3.5" />, label: "Compliant", color: "text-emerald-500" },
    review: { icon: <AlertTriangle className="w-3.5 h-3.5" />, label: "Needs Review", color: "text-amber-500" },
    pending: { icon: <Clock className="w-3.5 h-3.5" />, label: "Pending", color: "text-blue-500" },
  };

  return (
    <Card className={cn("border", cardBg)}>
      <CardHeader className="pb-3">
        <CardTitle className={cn("flex items-center gap-2 text-lg", text)}>
          <Shield className="w-5 h-5 text-purple-400" /> Document Compliance
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {requirements.map((r, idx) => {
            const s = statusIcon[r.status];
            return (
              <div key={idx} className={cn(
                "flex items-center justify-between rounded-lg border px-3 py-2.5 transition-colors",
                isLight ? "border-slate-200 hover:bg-slate-50" : "border-slate-700/40 hover:bg-slate-700/20"
              )}>
                <div className="flex items-center gap-3">
                  <div className={s.color}>{s.icon}</div>
                  <div>
                    <div className={cn("text-sm font-medium", text)}>{r.doc}</div>
                    <div className={cn("text-xs", muted)}>{r.rule}</div>
                  </div>
                </div>
                <Badge className={cn("text-xs",
                  r.status === "compliant" ? "bg-emerald-500/20 text-emerald-400" :
                  r.status === "review" ? "bg-amber-500/20 text-amber-400" :
                  "bg-blue-500/20 text-blue-400"
                )}>
                  {s.label}
                </Badge>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
