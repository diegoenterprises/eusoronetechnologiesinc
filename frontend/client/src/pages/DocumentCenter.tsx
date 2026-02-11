/**
 * DOCUMENT CENTER — UNIVERSAL DOCUMENT MANAGEMENT
 * Upload any document → AI OCR reads, classifies & labels it automatically
 * Supports all file types: PDF, DOC, images, spreadsheets
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
  ScanLine, RotateCcw, Save, Eraser, Loader2, Sparkles, Brain, Tag
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type DocTab = "all" | "compliance" | "financial" | "contracts" | "operations" | "other";

// ── Gradient Ink Signature Pad ──
function SignaturePad({ onSave, onClose }: { onSave: (d: string) => void; onClose: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [drawing, setDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const strokes = useRef<{ x: number; y: number }[][]>([]);
  const currentStroke = useRef<{ x: number; y: number }[]>([]);

  const drawBaseline = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    ctx.strokeStyle = "rgba(255,255,255,0.08)"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(40, h - 50); ctx.lineTo(w - 40, h - 50); ctx.stroke();
    ctx.font = "12px Inter, sans-serif"; ctx.fillStyle = "rgba(255,255,255,0.15)"; ctx.fillText("Sign here", 40, h - 30);
  };

  const lerpColor = (t: number): string => {
    // 0-25% blue, 25-35% blue→violet, 35-65% violet→fuchsia, 65-100% fuchsia→pink
    const colors = [
      { r: 37, g: 99, b: 235 },   // #2563EB blue
      { r: 124, g: 58, b: 237 },  // #7C3AED violet
      { r: 192, g: 38, b: 211 },  // #C026D3 fuchsia
      { r: 224, g: 64, b: 160 },  // #E040A0 pink
    ];
    let c0, c1, frac;
    if (t <= 0.25) { return `rgb(${colors[0].r},${colors[0].g},${colors[0].b})`; }
    else if (t <= 0.35) { c0 = colors[0]; c1 = colors[1]; frac = (t - 0.25) / 0.10; }
    else if (t <= 0.65) { c0 = colors[1]; c1 = colors[2]; frac = (t - 0.35) / 0.30; }
    else { c0 = colors[2]; c1 = colors[3]; frac = (t - 0.65) / 0.35; }
    frac = Math.max(0, Math.min(1, frac));
    const r = Math.round(c0.r + (c1.r - c0.r) * frac);
    const g = Math.round(c0.g + (c1.g - c0.g) * frac);
    const b = Math.round(c0.b + (c1.b - c0.b) * frac);
    return `rgb(${r},${g},${b})`;
  };

  const redrawAll = () => {
    const c = canvasRef.current; if (!c) return;
    const ctx = c.getContext("2d"); if (!ctx) return;
    const w = c.offsetWidth, h = c.offsetHeight;
    ctx.clearRect(0, 0, c.width, c.height);
    drawBaseline(ctx, w, h);

    const all = [...strokes.current, ...(currentStroke.current.length > 0 ? [currentStroke.current] : [])];
    if (all.length === 0) return;

    // Compute cumulative distance for every point across all strokes
    const segments: { p0: { x: number; y: number }; p1: { x: number; y: number }; distStart: number; distEnd: number }[] = [];
    let totalDist = 0;
    for (const stroke of all) {
      for (let i = 1; i < stroke.length; i++) {
        const dx = stroke[i].x - stroke[i - 1].x, dy = stroke[i].y - stroke[i - 1].y;
        const d = Math.sqrt(dx * dx + dy * dy);
        segments.push({ p0: stroke[i - 1], p1: stroke[i], distStart: totalDist, distEnd: totalDist + d });
        totalDist += d;
      }
    }
    if (totalDist === 0) return;

    // Draw each segment with the correct color based on its position along the total line
    for (const seg of segments) {
      const t = (seg.distStart + seg.distEnd) / 2 / totalDist;
      const color = lerpColor(t);
      // Glow
      ctx.save(); ctx.shadowColor = color; ctx.shadowBlur = 10;
      ctx.strokeStyle = color.replace("rgb", "rgba").replace(")", ",0.18)"); ctx.lineWidth = 6; ctx.lineCap = "round"; ctx.lineJoin = "round";
      ctx.beginPath(); ctx.moveTo(seg.p0.x, seg.p0.y); ctx.lineTo(seg.p1.x, seg.p1.y); ctx.stroke();
      ctx.restore();
      // Main stroke
      ctx.save(); ctx.shadowColor = color; ctx.shadowBlur = 3;
      ctx.strokeStyle = color; ctx.lineWidth = 2.2; ctx.lineCap = "round"; ctx.lineJoin = "round";
      ctx.beginPath(); ctx.moveTo(seg.p0.x, seg.p0.y); ctx.lineTo(seg.p1.x, seg.p1.y); ctx.stroke();
      ctx.restore();
    }
  };

  useEffect(() => {
    const c = canvasRef.current; if (!c) return;
    const ctx = c.getContext("2d"); if (!ctx) return;
    c.width = c.offsetWidth * 2; c.height = c.offsetHeight * 2; ctx.scale(2, 2);
    drawBaseline(ctx, c.offsetWidth, c.offsetHeight);
  }, []);

  const pos = (e: React.MouseEvent | React.TouchEvent) => {
    const c = canvasRef.current!;
    const r = c.getBoundingClientRect();
    const cx = "touches" in e ? e.touches[0].clientX : e.clientX;
    const cy = "touches" in e ? e.touches[0].clientY : e.clientY;
    // Scale from CSS display size to canvas logical coordinate space
    const scaleX = c.offsetWidth / r.width;
    const scaleY = c.offsetHeight / r.height;
    return { x: (cx - r.left) * scaleX, y: (cy - r.top) * scaleY };
  };
  const start = (e: React.MouseEvent | React.TouchEvent) => { setDrawing(true); setHasDrawn(true); currentStroke.current = [pos(e)]; };
  const move = (e: React.MouseEvent | React.TouchEvent) => {
    if (!drawing) return;
    currentStroke.current.push(pos(e));
    redrawAll();
  };
  const stop = () => {
    if (currentStroke.current.length > 1) strokes.current.push([...currentStroke.current]);
    currentStroke.current = [];
    setDrawing(false);
    redrawAll();
  };
  const clear = () => {
    strokes.current = []; currentStroke.current = [];
    const c = canvasRef.current; if (!c) return;
    const ctx = c.getContext("2d"); if (!ctx) return;
    ctx.clearRect(0, 0, c.width, c.height);
    drawBaseline(ctx, c.offsetWidth, c.offsetHeight);
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
          <canvas ref={canvasRef} className="w-full h-[240px] rounded-xl border border-slate-700/50 bg-black cursor-crosshair touch-none"
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
  const [docCat, setDocCat] = useState("other");
  const fileRef = useRef<HTMLInputElement>(null);

  const cats = [
    { v: "compliance", l: "Compliance", I: CheckCircle },
    { v: "financial", l: "Financial", I: FileText },
    { v: "contracts", l: "Contract", I: FileSignature },
    { v: "operations", l: "Operations", I: ClipboardList },
    { v: "insurance", l: "Insurance", I: FileText },
    { v: "license", l: "License / Permit", I: FileText },
    { v: "report", l: "Report", I: FileText },
    { v: "correspondence", l: "Correspondence", I: FileText },
    { v: "other", l: "Other", I: FolderOpen },
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


// ── Document Digitize by ESANG AI ──
function DigitizeModal({ onClose, onDigitized }: { onClose: () => void; onDigitized: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<any>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const digitizeMut = (trpc as any).documents.digitize.useMutation();

  const readBase64 = (f: File): Promise<string> =>
    new Promise((res) => { const r = new FileReader(); r.onload = () => res(r.result as string); r.readAsDataURL(f); });

  const scan = async () => {
    if (!file) return;
    setScanning(true);
    try {
      const base64 = await readBase64(file);
      const res = await digitizeMut.mutateAsync({ fileData: base64, filename: file.name, autoSave: true });
      setResult(res);
      toast.success("ESANG AI analysis complete — document saved");
      onDigitized();
    } catch (err: any) {
      console.error("[Digitize]", err);
      toast.error("Digitize failed", { description: err?.message || "Try again" });
    } finally {
      setScanning(false);
    }
  };

  const classification = result?.classification;
  const ocr = result?.ocr;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700/50 rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-500/20 to-emerald-500/20"><Brain className="w-5 h-5 text-cyan-400" /></div>
            <div><h3 className="text-lg font-bold text-white">Document Digitize</h3><p className="text-xs text-slate-400">Powered by ESANG AI — auto-classify & extract</p></div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-lg"><X className="w-5 h-5 text-slate-400" /></button>
        </div>
        <div className="p-5 space-y-4">
          {!result ? (<>
            <div onClick={() => fileRef.current?.click()} className={cn("border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all", file ? "border-cyan-500/50 bg-cyan-500/5" : "border-slate-700 hover:border-slate-500 bg-slate-800/30")}>
              <input ref={fileRef} type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png,.tiff,.doc,.docx" onChange={e => { const f = e.target.files?.[0]; if (f) setFile(f); }} />
              {file ? <div className="flex items-center justify-center gap-3"><ScanLine className="w-8 h-8 text-cyan-400" /><div className="text-left"><p className="text-white font-medium">{file.name}</p><p className="text-xs text-cyan-400">Ready for ESANG AI analysis</p></div></div>
                : <><Sparkles className="w-10 h-10 text-slate-500 mx-auto mb-3" /><p className="text-white font-medium">Upload document to digitize</p><p className="text-xs text-slate-400 mt-1">PDF, DOC, JPG, PNG, TIFF — ESANG AI reads & classifies automatically</p></>}
            </div>
            {scanning && <div className="flex items-center gap-3 p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20"><Loader2 className="w-5 h-5 text-cyan-400 animate-spin" /><div><p className="text-cyan-400 font-medium text-sm">ESANG AI analyzing document...</p><p className="text-xs text-slate-400">Digitizing → extracting text → classifying</p></div></div>}
            <Button onClick={scan} disabled={!file || scanning} className="w-full bg-gradient-to-r from-cyan-600 to-emerald-600 text-white border-0 rounded-lg disabled:opacity-40">
              {scanning ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Brain className="w-4 h-4 mr-2" />}{scanning ? "Analyzing..." : "Digitize with ESANG AI"}
            </Button>
          </>) : (<>
            {/* AI Results */}
            <div className="flex items-center gap-2 p-3 rounded-xl bg-green-500/10 border border-green-500/20">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <span className="text-green-400 font-medium text-sm">ESANG AI analysis complete — {classification?.confidence || 0}% confidence</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/30">
              <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Document Type</p>
              <p className="text-white font-semibold">{classification?.documentTitle || file?.name}</p>
              <div className="flex items-center gap-2 mt-2">
                <Badge className="bg-cyan-500/20 text-cyan-400 border-0 text-xs">{classification?.category}</Badge>
                <Badge className="bg-purple-500/20 text-purple-400 border-0 text-xs">{classification?.subcategory}</Badge>
              </div>
            </div>
            {classification?.summary && (
              <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/30">
                <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Summary</p>
                <p className="text-sm text-slate-200">{classification.summary}</p>
              </div>
            )}
            {classification?.extractedFields && Object.keys(classification.extractedFields).length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs text-slate-400 uppercase tracking-wider">Extracted Fields</p>
                {Object.entries(classification.extractedFields).map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-800/50 border border-slate-700/30">
                    <span className="text-xs text-slate-400">{k}</span>
                    <span className="text-sm text-white font-medium">{String(v)}</span>
                  </div>
                ))}
              </div>
            )}
            {classification?.suggestedTags?.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap">
                <Tag className="w-3.5 h-3.5 text-slate-400" />
                {classification.suggestedTags.map((t: string) => (
                  <Badge key={t} className="bg-slate-700/50 text-slate-300 border-0 text-xs">{t}</Badge>
                ))}
              </div>
            )}
            {ocr && (
              <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/30">
                <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Document Digitize by ESANG AI — {ocr.lineCount || ocr.lines?.length || 0} lines extracted</p>
                <p className="text-xs text-slate-500 mt-1 line-clamp-3">{ocr.textPreview || ocr.text?.slice(0, 200)}</p>
              </div>
            )}
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => { setResult(null); setFile(null); }} className="flex-1 border-slate-600 text-slate-400 rounded-lg"><RotateCcw className="w-4 h-4 mr-2" />Scan Another</Button>
              <Button onClick={onClose} className="flex-1 bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white border-0 rounded-lg"><CheckCircle className="w-4 h-4 mr-2" />Done</Button>
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

  // Signature persistence — load from DB
  const sigQuery = (trpc as any).documents.getSignature.useQuery();
  const saveSignatureMut = (trpc as any).documents.saveSignature.useMutation({
    onSuccess: () => { sigQuery.refetch(); toast.success("Signature saved to your account"); },
    onError: (e: any) => toast.error("Failed to save signature", { description: e.message }),
  });
  const deleteSignatureMut = (trpc as any).documents.deleteSignature.useMutation({
    onSuccess: () => { setSavedSig(null); sigQuery.refetch(); toast.success("Signature deleted"); },
    onError: (e: any) => toast.error("Failed to delete signature", { description: e.message }),
  });

  // Sync DB signature into local state
  useEffect(() => {
    if (sigQuery.data?.signatureData) setSavedSig(sigQuery.data.signatureData);
  }, [sigQuery.data]);

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
    { id: "all", label: "All", icon: FolderOpen },
    { id: "compliance", label: "Compliance", icon: CheckCircle },
    { id: "financial", label: "Financial", icon: FileText },
    { id: "contracts", label: "Contracts", icon: FileSignature },
    { id: "operations", label: "Operations", icon: ClipboardList },
    { id: "other", label: "Other", icon: FolderOpen },
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
    const map: Record<string, any> = { compliance: CheckCircle, financial: FileText, contracts: FileSignature, operations: ClipboardList, other: FolderOpen };
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
          <p className={cn("text-sm mt-1", isLight ? "text-slate-500" : "text-slate-400")}>Upload, manage & organize all your important documents with AI-powered classification</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button size="sm" onClick={() => setShowDigitize(true)} className="bg-gradient-to-r from-cyan-600 to-emerald-600 text-white border-0 rounded-lg"><Brain className="w-4 h-4 mr-1" />Digitize</Button>
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
              <Button size="sm" variant="outline" onClick={() => deleteSignatureMut.mutate({})} disabled={deleteSignatureMut.isPending} className={cn("rounded-lg text-xs text-red-400 hover:text-red-300", isLight ? "border-red-300 hover:bg-red-50" : "border-red-500/30 hover:bg-red-500/10")}>
                <Trash2 className="w-3.5 h-3.5 mr-1" />{deleteSignatureMut.isPending ? "..." : "Delete"}
              </Button>
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
      {showSign && <SignaturePad onSave={(d) => { setSavedSig(d); saveSignatureMut.mutate({ signatureData: d }); setShowSign(false); }} onClose={() => setShowSign(false)} />}
      {showDigitize && <DigitizeModal onClose={() => setShowDigitize(false)} onDigitized={() => { docsQuery.refetch(); statsQuery.refetch(); }} />}
    </div>
  );
}
