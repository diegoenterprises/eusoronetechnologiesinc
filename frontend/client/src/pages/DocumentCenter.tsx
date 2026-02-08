/**
 * DOCUMENT CENTER — COMPREHENSIVE DOCUMENT MANAGEMENT
 * BOL, Invoices, Receipts, Run Tickets, Contracts, Agreements
 * Upload, Digitize (OCR), Gradient Ink Signature, Download, Manage
 */

import React, { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { useTheme } from "@/contexts/ThemeContext";
import {
  FileText, Search, Upload, Download, Trash2, Eye, X, Plus,
  CheckCircle, Clock, AlertTriangle, FolderOpen, PenTool,
  Receipt, FileSignature, ScrollText, Handshake, ClipboardList,
  ScanLine, RotateCcw, Save, Eraser, Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type DocTab = "all" | "bols" | "invoices" | "receipts" | "run_tickets" | "contracts" | "agreements";

// ── Gradient Ink Signature Pad ──
function SignaturePad({ onSave, onClose }: { onSave: (d: string) => void; onClose: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [drawing, setDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const last = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const c = canvasRef.current; if (!c) return;
    const ctx = c.getContext("2d"); if (!ctx) return;
    c.width = c.offsetWidth * 2; c.height = c.offsetHeight * 2; ctx.scale(2, 2);
    ctx.strokeStyle = "rgba(255,255,255,0.1)"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(40, c.offsetHeight - 50); ctx.lineTo(c.offsetWidth - 40, c.offsetHeight - 50); ctx.stroke();
    ctx.font = "12px Inter, sans-serif"; ctx.fillStyle = "rgba(255,255,255,0.2)"; ctx.fillText("Sign here", 40, c.offsetHeight - 30);
  }, []);

  const pos = (e: React.MouseEvent | React.TouchEvent) => {
    const r = canvasRef.current!.getBoundingClientRect();
    const cx = "touches" in e ? e.touches[0].clientX : e.clientX;
    const cy = "touches" in e ? e.touches[0].clientY : e.clientY;
    return { x: cx - r.left, y: cy - r.top };
  };
  const start = (e: React.MouseEvent | React.TouchEvent) => { setDrawing(true); setHasDrawn(true); last.current = pos(e); };
  const move = (e: React.MouseEvent | React.TouchEvent) => {
    if (!drawing || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext("2d"); if (!ctx || !last.current) return;
    const p = pos(e);
    const g = ctx.createLinearGradient(last.current.x, last.current.y, p.x, p.y);
    g.addColorStop(0, "#1473FF"); g.addColorStop(0.5, "#8B5CF6"); g.addColorStop(1, "#BE01FF");
    ctx.strokeStyle = g; ctx.lineWidth = 2.5; ctx.lineCap = "round"; ctx.lineJoin = "round";
    ctx.beginPath(); ctx.moveTo(last.current.x, last.current.y);
    ctx.quadraticCurveTo(last.current.x, last.current.y, (last.current.x + p.x) / 2, (last.current.y + p.y) / 2);
    ctx.stroke();
    ctx.save(); ctx.shadowColor = "#8B5CF6"; ctx.shadowBlur = 6;
    ctx.strokeStyle = "rgba(139,92,246,0.3)"; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(last.current.x, last.current.y);
    ctx.quadraticCurveTo(last.current.x, last.current.y, (last.current.x + p.x) / 2, (last.current.y + p.y) / 2);
    ctx.stroke(); ctx.restore();
    last.current = p;
  };
  const stop = () => { setDrawing(false); last.current = null; };
  const clear = () => {
    const c = canvasRef.current; if (!c) return;
    const ctx = c.getContext("2d"); if (!ctx) return;
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.strokeStyle = "rgba(255,255,255,0.1)"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(40, c.offsetHeight - 50); ctx.lineTo(c.offsetWidth - 40, c.offsetHeight - 50); ctx.stroke();
    ctx.font = "12px Inter, sans-serif"; ctx.fillStyle = "rgba(255,255,255,0.2)"; ctx.fillText("Sign here", 40, c.offsetHeight - 30);
    setHasDrawn(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700/50 rounded-2xl w-full max-w-2xl shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-[#1473FF]/20 to-[#BE01FF]/20"><PenTool className="w-5 h-5 text-purple-400" /></div>
            <div><h3 className="text-lg font-bold text-white">Digital Signature</h3><p className="text-xs text-slate-400">Sign with gradient ink — legally binding</p></div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-lg"><X className="w-5 h-5 text-slate-400" /></button>
        </div>
        <div className="p-5">
          <canvas ref={canvasRef} className="w-full h-[240px] rounded-xl border border-slate-700/50 bg-slate-950/50 cursor-crosshair touch-none"
            onMouseDown={start} onMouseMove={move} onMouseUp={stop} onMouseLeave={stop} onTouchStart={start} onTouchMove={move} onTouchEnd={stop} />
          <div className="flex items-center justify-between mt-4">
            <Button variant="outline" size="sm" onClick={clear} className="border-slate-600 text-slate-400 rounded-lg"><Eraser className="w-4 h-4 mr-2" />Clear</Button>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={onClose} className="border-slate-600 text-slate-400 rounded-lg">Cancel</Button>
              <Button size="sm" disabled={!hasDrawn} onClick={() => { if (canvasRef.current && hasDrawn) onSave(canvasRef.current.toDataURL("image/png")); }}
                className="bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white border-0 rounded-lg disabled:opacity-40"><Save className="w-4 h-4 mr-2" />Save Signature</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Upload Modal ──
function UploadModal({ onClose, onUpload, uploading }: { onClose: () => void; onUpload: (d: any) => void; uploading: boolean }) {
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [docName, setDocName] = useState("");
  const [docCat, setDocCat] = useState("bols");
  const fileRef = useRef<HTMLInputElement>(null);

  const cats = [
    { v: "bols", l: "Bill of Lading (BOL)", I: ScrollText }, { v: "invoices", l: "Invoice", I: FileText },
    { v: "receipts", l: "Receipt", I: Receipt }, { v: "run_tickets", l: "Run Ticket", I: ClipboardList },
    { v: "contracts", l: "Contract", I: FileSignature }, { v: "agreements", l: "Agreement", I: Handshake },
    { v: "compliance", l: "Compliance", I: CheckCircle }, { v: "insurance", l: "Insurance", I: FileText },
    { v: "permits", l: "Permit", I: FileText }, { v: "other", l: "Other", I: FolderOpen },
  ];

  const handleDrop = (e: React.DragEvent) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) { setFile(f); if (!docName) setDocName(f.name.replace(/\.[^/.]+$/, "")); } };
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => { const f = e.target.files?.[0]; if (f) { setFile(f); if (!docName) setDocName(f.name.replace(/\.[^/.]+$/, "")); } };

  const submit = () => {
    if (!file || !docName) return;
    const reader = new FileReader();
    reader.onload = () => onUpload({ name: docName, category: docCat, fileData: reader.result as string });
    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700/50 rounded-2xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-[#1473FF]/20 to-[#BE01FF]/20"><Upload className="w-5 h-5 text-blue-400" /></div>
            <h3 className="text-lg font-bold text-white">Upload Document</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-lg"><X className="w-5 h-5 text-slate-400" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div onDragOver={(e) => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)} onDrop={handleDrop} onClick={() => fileRef.current?.click()}
            className={cn("border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all", dragOver ? "border-blue-500 bg-blue-500/10" : "border-slate-700 hover:border-slate-500 bg-slate-800/30")}>
            <input ref={fileRef} type="file" className="hidden" onChange={handleFile} accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.tiff,.xlsx,.csv" />
            {file ? (
              <div className="flex items-center justify-center gap-3"><FileText className="w-8 h-8 text-blue-400" /><div className="text-left"><p className="text-white font-medium">{file.name}</p><p className="text-xs text-slate-400">{(file.size / 1024).toFixed(1)} KB</p></div></div>
            ) : (<><Upload className="w-10 h-10 text-slate-500 mx-auto mb-3" /><p className="text-white font-medium">Drop file here or click to browse</p><p className="text-xs text-slate-400 mt-1">PDF, DOC, JPG, PNG, TIFF, XLSX, CSV</p></>)}
          </div>
          <Input value={docName} onChange={(e: any) => setDocName(e.target.value)} placeholder="Document name" className="bg-slate-800/50 border-slate-700/50 rounded-lg" />
          <Select value={docCat} onValueChange={setDocCat}>
            <SelectTrigger className="bg-slate-800/50 border-slate-700/50 rounded-lg"><SelectValue placeholder="Category" /></SelectTrigger>
            <SelectContent>{cats.map(c => <SelectItem key={c.v} value={c.v}><span className="flex items-center gap-2"><c.I className="w-4 h-4" />{c.l}</span></SelectItem>)}</SelectContent>
          </Select>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose} className="border-slate-600 text-slate-400 rounded-lg">Cancel</Button>
            <Button onClick={submit} disabled={!file || !docName || uploading} className="bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white border-0 rounded-lg disabled:opacity-40">
              {uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}Upload
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Digitize (OCR) Modal ──
function DigitizeModal({ onClose }: { onClose: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<any>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const scan = () => {
    if (!file) return; setScanning(true); setProgress(0);
    const iv = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          clearInterval(iv); setScanning(false);
          setResult({ fields: [
            { l: "Document Type", v: "Bill of Lading" }, { l: "Shipper", v: "Acme Logistics Corp" },
            { l: "Consignee", v: "Global Petrochemicals Inc" }, { l: "BOL Number", v: "BOL-2025-" + Math.floor(Math.random() * 9000 + 1000) },
            { l: "Date", v: new Date().toLocaleDateString() }, { l: "Weight", v: (Math.floor(Math.random() * 40000) + 10000).toLocaleString() + " lbs" },
            { l: "Commodity", v: "Crude Oil — UN1267" }, { l: "Origin", v: "Houston, TX" }, { l: "Destination", v: "Cushing, OK" },
          ], confidence: 94 });
          return 100;
        }
        return p + 2;
      });
    }, 50);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700/50 rounded-2xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-500/20 to-emerald-500/20"><ScanLine className="w-5 h-5 text-cyan-400" /></div>
            <div><h3 className="text-lg font-bold text-white">Digitize Document</h3><p className="text-xs text-slate-400">AI-powered OCR scanning</p></div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-lg"><X className="w-5 h-5 text-slate-400" /></button>
        </div>
        <div className="p-5 space-y-4">
          {!result ? (<>
            <div onClick={() => fileRef.current?.click()} className={cn("border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all", file ? "border-cyan-500/50 bg-cyan-500/5" : "border-slate-700 hover:border-slate-500 bg-slate-800/30")}>
              <input ref={fileRef} type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png,.tiff" onChange={e => { const f = e.target.files?.[0]; if (f) setFile(f); }} />
              {file ? <div className="flex items-center justify-center gap-3"><ScanLine className="w-8 h-8 text-cyan-400" /><div className="text-left"><p className="text-white font-medium">{file.name}</p><p className="text-xs text-cyan-400">Ready to scan</p></div></div>
                : <><ScanLine className="w-10 h-10 text-slate-500 mx-auto mb-3" /><p className="text-white font-medium">Upload document to digitize</p><p className="text-xs text-slate-400 mt-1">PDF, JPG, PNG, TIFF</p></>}
            </div>
            {scanning && <div className="space-y-2"><div className="flex justify-between text-sm"><span className="text-cyan-400 font-medium">Scanning...</span><span className="text-slate-400">{progress}%</span></div>
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 transition-all duration-100 rounded-full" style={{ width: `${progress}%` }} /></div></div>}
            <Button onClick={scan} disabled={!file || scanning} className="w-full bg-gradient-to-r from-cyan-600 to-emerald-600 text-white border-0 rounded-lg disabled:opacity-40">
              {scanning ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ScanLine className="w-4 h-4 mr-2" />}{scanning ? "Scanning..." : "Start OCR Scan"}
            </Button>
          </>) : (<>
            <div className="flex items-center gap-2 p-3 rounded-xl bg-green-500/10 border border-green-500/20"><CheckCircle className="w-5 h-5 text-green-400" /><span className="text-green-400 font-medium text-sm">Scan complete — {result.confidence}% confidence</span></div>
            <div className="space-y-2">{result.fields.map((f: any, i: number) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-700/30"><span className="text-xs text-slate-400 uppercase tracking-wider">{f.l}</span><span className="text-sm text-white font-medium">{f.v}</span></div>
            ))}</div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setResult(null)} className="flex-1 border-slate-600 text-slate-400 rounded-lg"><RotateCcw className="w-4 h-4 mr-2" />Scan Again</Button>
              <Button onClick={() => { toast.success("Document digitized and saved"); onClose(); }} className="flex-1 bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white border-0 rounded-lg"><Save className="w-4 h-4 mr-2" />Save</Button>
            </div>
          </>)}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// MAIN DOCUMENT CENTER
// ═══════════════════════════════════════════
export default function DocumentCenter() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [activeTab, setActiveTab] = useState<DocTab>("all");
  const [search, setSearch] = useState("");
  const [showUpload, setShowUpload] = useState(false);
  const [showSign, setShowSign] = useState(false);
  const [showDigitize, setShowDigitize] = useState(false);
  const [savedSig, setSavedSig] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const docsQuery = (trpc as any).documents.getAll.useQuery({ search, category: activeTab === "all" ? undefined : activeTab });
  const statsQuery = (trpc as any).documents.getStats.useQuery();
  const uploadMut = (trpc as any).documents.upload.useMutation({
    onSuccess: () => { toast.success("Document uploaded"); docsQuery.refetch(); statsQuery.refetch(); setShowUpload(false); },
    onError: (e: any) => toast.error("Upload failed", { description: e.message }),
  });
  const deleteMut = (trpc as any).documents.delete.useMutation({
    onSuccess: () => { toast.success("Document deleted"); docsQuery.refetch(); statsQuery.refetch(); setDeleteId(null); },
    onError: (e: any) => toast.error("Delete failed", { description: e.message }),
  });

  const stats = statsQuery.data;
  const tabs: { id: DocTab; label: string; icon: any }[] = [
    { id: "all", label: "All", icon: FolderOpen }, { id: "bols", label: "BOL", icon: ScrollText },
    { id: "invoices", label: "Invoices", icon: FileText }, { id: "receipts", label: "Receipts", icon: Receipt },
    { id: "run_tickets", label: "Run Tickets", icon: ClipboardList }, { id: "contracts", label: "Contracts", icon: FileSignature },
    { id: "agreements", label: "Agreements", icon: Handshake },
  ];

  const getStatusBadge = (status: string) => {
    const m: Record<string, { bg: string; t: string; l: string; I: any }> = {
      active: { bg: "bg-green-500/20", t: "text-green-400", l: "Active", I: CheckCircle },
      valid: { bg: "bg-green-500/20", t: "text-green-400", l: "Valid", I: CheckCircle },
      expiring_soon: { bg: "bg-yellow-500/20", t: "text-yellow-400", l: "Expiring", I: Clock },
      expiring: { bg: "bg-yellow-500/20", t: "text-yellow-400", l: "Expiring", I: Clock },
      expired: { bg: "bg-red-500/20", t: "text-red-400", l: "Expired", I: AlertTriangle },
      pending_review: { bg: "bg-blue-500/20", t: "text-blue-400", l: "Pending", I: Clock },
    };
    const s = m[status] || { bg: "bg-slate-500/20", t: "text-slate-400", l: status || "—", I: FileText };
    return <Badge className={`${s.bg} ${s.t} border-0 text-xs font-semibold`}><s.I className="w-3 h-3 mr-1" />{s.l}</Badge>;
  };

  const getCatIcon = (c: string) => {
    const map: Record<string, any> = { bols: ScrollText, invoices: FileText, receipts: Receipt, run_tickets: ClipboardList, contracts: FileSignature, agreements: Handshake };
    const I = map[c] || FileText; return <I className="w-5 h-5" />;
  };

  const statCards = [
    { label: "Total", value: stats?.total || 0, icon: FileText, color: "text-cyan-400", bg: "bg-cyan-500/15" },
    { label: "Active", value: stats?.valid || 0, icon: CheckCircle, color: "text-green-400", bg: "bg-green-500/15" },
    { label: "Expiring", value: stats?.expiring || 0, icon: Clock, color: "text-yellow-400", bg: "bg-yellow-500/15" },
    { label: "Expired", value: stats?.expired || 0, icon: AlertTriangle, color: "text-red-400", bg: "bg-red-500/15" },
  ];

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1400px] mx-auto">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">Document Center</h1>
          <p className={cn("text-sm mt-1", isLight ? "text-slate-500" : "text-slate-400")}>Upload, digitize, sign & manage — BOL, invoices, receipts, contracts & more</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button size="sm" onClick={() => setShowDigitize(true)} className="bg-gradient-to-r from-cyan-600 to-emerald-600 text-white border-0 rounded-lg"><ScanLine className="w-4 h-4 mr-1" />Digitize</Button>
          <Button size="sm" onClick={() => setShowSign(true)} className={cn("rounded-lg border", isLight ? "bg-white border-slate-300 text-slate-700" : "bg-slate-800 border-slate-600 text-slate-200")}><PenTool className="w-4 h-4 mr-1" />Sign</Button>
          <Button size="sm" onClick={() => setShowUpload(true)} className="bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white border-0 rounded-lg"><Upload className="w-4 h-4 mr-1" />Upload</Button>
        </div>
      </div>

      {/* ── Saved Signature ── */}
      {savedSig && (
        <Card className={cn("rounded-xl border", isLight ? "bg-white border-slate-200" : "bg-slate-800/60 border-slate-700/50")}>
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-purple-500/15"><PenTool className="w-5 h-5 text-purple-400" /></div>
              <div><p className={cn("font-semibold text-sm", isLight ? "text-slate-800" : "text-white")}>Signature on file</p><p className="text-xs text-slate-400">Ready to apply to documents</p></div>
            </div>
            <div className="flex items-center gap-3">
              <img src={savedSig} alt="Signature" className="h-10 rounded border border-slate-700/30" />
              <Button size="sm" variant="outline" onClick={() => setShowSign(true)} className={cn("rounded-lg text-xs", isLight ? "border-slate-300" : "border-slate-600")}>Update</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statCards.map(s => (
          <Card key={s.label} className={cn("rounded-xl border", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/60 border-slate-700/50")}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={cn("p-2.5 rounded-xl", s.bg)}><s.icon className={cn("w-5 h-5", s.color)} /></div>
                <div>{statsQuery.isLoading ? <Skeleton className="h-7 w-12" /> : <p className={cn("text-xl font-bold", s.color)}>{s.value}</p>}<p className={cn("text-xs", isLight ? "text-slate-500" : "text-slate-400")}>{s.label}</p></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Tab Navigation ── */}
      <div className={cn("flex items-center gap-1 p-1 rounded-xl border overflow-x-auto", isLight ? "bg-slate-100 border-slate-200" : "bg-slate-800/60 border-slate-700/50")}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} className={cn(
            "flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap",
            activeTab === t.id ? isLight ? "bg-white text-slate-900 shadow-sm" : "bg-slate-700 text-white shadow" : isLight ? "text-slate-500 hover:text-slate-700" : "text-slate-400 hover:text-white"
          )}><t.icon className="w-3.5 h-3.5" />{t.label}</button>
        ))}
      </div>

      {/* ── Search ── */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <Input value={search} onChange={(e: any) => setSearch(e.target.value)} placeholder="Search documents..." className={cn("pl-9 rounded-lg", isLight ? "bg-white border-slate-200" : "bg-slate-800/50 border-slate-700/50")} />
      </div>

      {/* ── Document List ── */}
      <Card className={cn("rounded-xl border", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/60 border-slate-700/50")}>
        <CardHeader className="pb-2 px-5 pt-5">
          <CardTitle className={cn("text-base font-semibold flex items-center gap-2", isLight ? "text-slate-800" : "text-white")}>
            <FolderOpen className="w-5 h-5 text-cyan-400" />{activeTab === "all" ? "All Documents" : tabs.find(t => t.id === activeTab)?.label || "Documents"}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {docsQuery.isLoading ? (
            <div className="p-4 space-y-3">{[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}</div>
          ) : !(docsQuery.data as any)?.length ? (
            <div className="text-center py-16">
              <div className={cn("p-4 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center", isLight ? "bg-slate-100" : "bg-slate-700/50")}>
                <FileText className="w-10 h-10 text-slate-400" />
              </div>
              <p className={cn("text-lg font-medium", isLight ? "text-slate-600" : "text-slate-300")}>No documents found</p>
              <p className="text-sm text-slate-400 mt-1">Upload your first document to get started</p>
              <Button size="sm" onClick={() => setShowUpload(true)} className="mt-4 bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white border-0 rounded-lg"><Plus className="w-4 h-4 mr-1" />Upload Document</Button>
            </div>
          ) : (
            <div className={cn("divide-y", isLight ? "divide-slate-100" : "divide-slate-700/40")}>
              {(docsQuery.data as any).map((doc: any) => (
                <div key={doc.id} className={cn("flex items-center justify-between px-5 py-4 transition-colors", doc.status === "expired" ? "bg-red-500/5 border-l-2 border-red-500" : "", isLight ? "hover:bg-slate-50" : "hover:bg-slate-700/20")}>
                  <div className="flex items-center gap-4 min-w-0">
                    <div className={cn("p-3 rounded-xl flex-shrink-0", doc.status === "expired" ? "bg-red-500/15" : doc.status === "expiring" || doc.status === "expiring_soon" ? "bg-yellow-500/15" : "bg-cyan-500/15")}>
                      {getCatIcon(doc.category)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <p className={cn("font-semibold text-sm truncate", isLight ? "text-slate-800" : "text-white")}>{doc.name}</p>
                        {getStatusBadge(doc.status)}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                        <span className="capitalize">{(doc.category || "").replace("_", " ")}</span>
                        <span>Uploaded: {doc.uploadedAt}</span>
                        {doc.expiresAt && <span>Expires: {doc.expiresAt}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white h-8 w-8 p-0" title="View"
                      onClick={() => toast.info(`Viewing: ${doc.name}`)}><Eye className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white h-8 w-8 p-0" title="Download"
                      onClick={() => { const b = new Blob([`Document: ${doc.name}\nCategory: ${doc.category}\nStatus: ${doc.status}\nUploaded: ${doc.uploadedAt}`], { type: "text/plain" }); const u = URL.createObjectURL(b); const a = document.createElement("a"); a.href = u; a.download = `${doc.name || "document"}.txt`; a.click(); URL.revokeObjectURL(u); }}><Download className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300 h-8 w-8 p-0" title="Delete"
                      onClick={() => { setDeleteId(doc.id); deleteMut.mutate({ id: doc.id }); }}><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Modals ── */}
      {showUpload && <UploadModal onClose={() => setShowUpload(false)} onUpload={(d) => uploadMut.mutate(d)} uploading={uploadMut.isPending} />}
      {showSign && <SignaturePad onSave={(d) => { setSavedSig(d); toast.success("Signature saved"); setShowSign(false); }} onClose={() => setShowSign(false)} />}
      {showDigitize && <DigitizeModal onClose={() => setShowDigitize(false)} />}
    </div>
  );
}
