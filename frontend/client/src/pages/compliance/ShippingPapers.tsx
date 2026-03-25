/**
 * SHIPPING PAPERS — Consolidated (Task 5.3.1)
 * Merges: BOLGeneration.tsx, BOLManagement.tsx → ShippingPapers.tsx
 * Tabs: Manage BOLs | Generate BOL | OCR Scanner
 */

import React, { useState, useRef, lazy, Suspense } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  FilePlus, FileText, ScanLine, Upload, CheckCircle,
  AlertTriangle, FileSearch, Copy, Loader2, Tag
} from "lucide-react";

const BOLGenerationTab = lazy(() => import("../BOLGeneration"));
const BOLManagementTab = lazy(() => import("../BOLManagement"));

function TabLoader() {
  return (
    <div className="p-4 space-y-4">
      <Skeleton className="h-8 w-64 rounded-lg" />
      <Skeleton className="h-48 w-full rounded-xl" />
    </div>
  );
}

// ── OCR Scanner Tab ──────────────────────────────────────────────────────────
function OCRScannerTab() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [result, setResult] = useState<any>(null);

  const digitizeMutation = (trpc as any).documents?.digitize?.useMutation?.({
    onSuccess: (data: any) => {
      setResult(data);
      toast.success("Document scanned successfully", {
        description: `${data.ocr?.engine || "OCR"} — ${data.ocr?.lineCount || 0} lines extracted`,
      });
    },
    onError: (err: any) => toast.error("Scan failed", { description: err.message }),
  }) || { mutate: () => toast.info("OCR service unavailable"), isPending: false };

  const handleFile = (file: File) => {
    if (!file) return;
    const maxSize = 20 * 1024 * 1024;
    if (file.size > maxSize) { toast.error("File too large (max 20MB)"); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setResult(null);
      digitizeMutation.mutate({ fileData: base64, filename: file.name, autoSave: true });
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragActive(false);
    if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
  };

  const copyText = () => {
    if (result?.ocr?.textPreview) {
      navigator.clipboard.writeText(result.ocr.textPreview);
      toast.success("Copied to clipboard");
    }
  };

  return (
    <div className="space-y-6 pt-2">
      {/* Upload Zone */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-[#1473FF] to-[#BE01FF]" />
        <CardContent className="p-6">
          <div
            onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${
              dragActive
                ? "border-[#1473FF] bg-[#1473FF]/10"
                : "border-slate-600/50 hover:border-slate-500 hover:bg-slate-700/20"
            }`}
          >
            {digitizeMutation.isPending ? (
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-10 h-10 text-[#1473FF] animate-spin" />
                <p className="text-white font-medium">Scanning document...</p>
                <p className="text-slate-400 text-sm">PaddleOCR + AI classification in progress</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <div className="p-4 rounded-full bg-gradient-to-r from-[#1473FF]/20 to-[#BE01FF]/20">
                  <Upload className="w-8 h-8 text-[#1473FF]" />
                </div>
                <p className="text-white font-medium">Drop a document here or click to upload</p>
                <p className="text-slate-400 text-sm">Supports PDF, PNG, JPG — Max 20MB</p>
                <p className="text-slate-500 text-xs">BOLs, rate sheets, insurance docs, permits, and more</p>
              </div>
            )}
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.tiff"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {result && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Classification */}
          <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-lg flex items-center gap-2">
                <Tag className="w-5 h-5 text-[#BE01FF]" />
                AI Classification
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 flex-wrap">
                <Badge className="bg-[#1473FF]/20 text-[#1473FF] border-0 text-sm px-3 py-1">
                  {result.classification?.category || "unknown"}
                </Badge>
                <Badge className="bg-purple-500/20 text-purple-400 border-0 text-sm px-3 py-1">
                  {result.classification?.subcategory || "general"}
                </Badge>
                <Badge className={`border-0 text-sm px-3 py-1 ${
                  (result.classification?.confidence || 0) >= 80
                    ? "bg-green-500/20 text-green-400"
                    : (result.classification?.confidence || 0) >= 50
                      ? "bg-yellow-500/20 text-yellow-400"
                      : "bg-red-500/20 text-red-400"
                }`}>
                  {result.classification?.confidence || 0}% confidence
                </Badge>
              </div>

              {result.classification?.documentTitle && (
                <div>
                  <p className="text-xs text-slate-400 mb-1">Document Title</p>
                  <p className="text-white font-medium">{result.classification.documentTitle}</p>
                </div>
              )}
              {result.classification?.summary && (
                <div>
                  <p className="text-xs text-slate-400 mb-1">Summary</p>
                  <p className="text-sm text-slate-300">{result.classification.summary}</p>
                </div>
              )}

              {/* Extracted Fields */}
              {result.classification?.extractedFields && Object.keys(result.classification.extractedFields).length > 0 && (
                <div>
                  <p className="text-xs text-slate-400 mb-2">Extracted Fields</p>
                  <div className="space-y-1.5">
                    {Object.entries(result.classification.extractedFields).map(([key, val]: [string, any]) => (
                      <div key={key} className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-slate-700/30">
                        <span className="text-xs text-slate-400 capitalize">{key.replace(/_/g, " ")}</span>
                        <span className="text-sm text-white font-medium">{String(val)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tags */}
              {result.classification?.suggestedTags?.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {result.classification.suggestedTags.map((tag: string, i: number) => (
                    <Badge key={i} className="bg-slate-700/50 text-slate-300 border-slate-600/50 text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}

              {result.savedId && (
                <div className="flex items-center gap-2 pt-2 border-t border-slate-700/50">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <p className="text-sm text-green-400">Saved to Document Center (ID: {result.savedId})</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Extracted Text */}
          <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white text-lg flex items-center gap-2">
                  <FileSearch className="w-5 h-5 text-[#1473FF]" />
                  OCR Output
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge className="bg-slate-700/50 text-slate-300 border-0 text-xs">
                    {result.ocr?.engine || "unknown"}
                  </Badge>
                  <Badge className="bg-slate-700/50 text-slate-300 border-0 text-xs">
                    {result.ocr?.lineCount || 0} lines
                  </Badge>
                  <Button size="sm" variant="ghost" className="text-slate-400 hover:text-white h-7 w-7 p-0" onClick={copyText}>
                    <Copy className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="bg-slate-900/50 rounded-xl p-4 max-h-[400px] overflow-y-auto border border-slate-700/30">
                <pre className="text-sm text-slate-300 whitespace-pre-wrap font-mono leading-relaxed">
                  {result.ocr?.textPreview || "No text extracted"}
                </pre>
              </div>
              {(result.ocr?.avgConfidence || 0) > 0 && (
                <div className="flex items-center gap-2 mt-3">
                  <div className="flex-1 h-2 rounded-full bg-slate-700/50 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#1473FF] to-[#BE01FF]"
                      style={{ width: `${Math.round((result.ocr.avgConfidence || 0) * 100)}%` }}
                    />
                  </div>
                  <span className="text-xs text-slate-400">
                    {Math.round((result.ocr.avgConfidence || 0) * 100)}% avg confidence
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────
export default function ShippingPapers() {
  const [activeTab, setActiveTab] = useState("manage");

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
          Shipping Papers
        </h1>
        <p className="text-slate-400 text-sm mt-1">Bill of Lading generation, management, and OCR document scanning</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="manage"><FileText className="w-4 h-4 mr-1.5" />Manage BOLs</TabsTrigger>
          <TabsTrigger value="generate"><FilePlus className="w-4 h-4 mr-1.5" />Generate BOL</TabsTrigger>
          <TabsTrigger value="ocr"><ScanLine className="w-4 h-4 mr-1.5" />OCR Scanner</TabsTrigger>
        </TabsList>
        <TabsContent value="manage">
          <Suspense fallback={<TabLoader />}><div className="[&>div]:!p-0"><BOLManagementTab /></div></Suspense>
        </TabsContent>
        <TabsContent value="generate">
          <Suspense fallback={<TabLoader />}><div className="[&>div]:!p-0"><BOLGenerationTab /></div></Suspense>
        </TabsContent>
        <TabsContent value="ocr">
          <OCRScannerTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
