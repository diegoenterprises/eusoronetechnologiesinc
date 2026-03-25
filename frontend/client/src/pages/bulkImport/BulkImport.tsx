import { useState, useCallback, DragEvent, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Upload, FileSpreadsheet, CheckCircle, XCircle, AlertTriangle,
  ChevronRight, Download, RefreshCw, Loader2, Eye, ArrowLeft,
  Clock, Package, Sparkles,
} from "lucide-react";

type Step = "upload" | "validate" | "import" | "results";

export default function BulkImport() {
  const [step, setStep] = useState<Step>("upload");
  const [csvText, setCsvText] = useState("");
  const [fileName, setFileName] = useState("");
  const [jobId, setJobId] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Mutations
  const [aiInfo, setAiInfo] = useState<{ confidence: number; notes: string; columnMapping: Record<string, string> } | null>(null);

  const uploadMut = (trpc as any).bulkImport.uploadCSV.useMutation({
    onSuccess: (data: any) => {
      setJobId(data.jobId);
      if (data.aiMapping) {
        setAiInfo(data.aiMapping);
        toast.success(`Uploaded ${data.totalRows} rows — ESANG AI mapped columns (${data.aiMapping.confidence}% confidence)`);
      } else {
        toast.success(`Uploaded ${data.totalRows} rows`);
      }
      setStep("validate");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const validateMut = (trpc as any).bulkImport.validateImport.useMutation({
    onSuccess: (data: any) => {
      toast.success(`Validated: ${data.validRows} valid, ${data.invalidRows} invalid`);
      statusQuery.refetch();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const executeMut = (trpc as any).bulkImport.executeImport.useMutation({
    onSuccess: (data: any) => {
      toast.success(`Imported ${data.createdCount} loads`);
      setStep("results");
      statusQuery.refetch();
    },
    onError: (e: any) => toast.error(e.message),
  });

  // Queries
  const statusQuery = (trpc as any).bulkImport.getImportStatus.useQuery(
    { jobId: jobId! },
    { enabled: !!jobId }
  );
  const status = statusQuery.data as any;

  const historyQuery = (trpc as any).bulkImport.getImportHistory.useQuery(
    {},
    { enabled: step === "upload" }
  );
  const history: any[] = historyQuery.data?.jobs || [];

  const templateQuery = (trpc as any).bulkImport.downloadTemplate.useQuery(undefined, { enabled: false });

  const errorsQuery = (trpc as any).bulkImport.downloadErrors.useQuery(
    { jobId: jobId! },
    { enabled: false }
  );

  const handleFile = useCallback((file: File) => {
    if (!file.name.endsWith(".csv")) {
      toast.error("Only .csv files accepted");
      return;
    }
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setCsvText(text);
    };
    reader.readAsText(file);
  }, []);

  const handleDrop = useCallback((e: DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleUpload = () => {
    if (!csvText || !fileName) return;
    uploadMut.mutate({ csvText, fileName });
  };

  const handleDownloadTemplate = async () => {
    const result = await templateQuery.refetch();
    if (result.data) {
      const blob = new Blob([result.data.csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = result.data.fileName; a.click();
      URL.revokeObjectURL(url);
    }
  };

  const handleDownloadErrors = async () => {
    const result = await errorsQuery.refetch();
    if (result.data?.csv) {
      const blob = new Blob([result.data.csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = result.data.fileName; a.click();
      URL.revokeObjectURL(url);
    }
  };

  const reset = () => {
    setStep("upload"); setCsvText(""); setFileName(""); setJobId(null);
  };

  const rows = status?.rows || [];
  const validCount = rows.filter((r: any) => r.status === "valid" || r.status === "created").length;
  const invalidCount = rows.filter((r: any) => r.status === "invalid" || r.status === "failed").length;

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-slate-950 text-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06] bg-slate-900/50 shrink-0">
        <div className="flex items-center gap-3">
          <Upload className="w-5 h-5 text-violet-400" />
          <h1 className="text-lg font-bold">Bulk Load Import</h1>
        </div>
        {step !== "upload" && (
          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-slate-400" onClick={reset}>
            <ArrowLeft className="w-3.5 h-3.5 mr-1" />Start Over
          </Button>
        )}
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-white/[0.06] bg-slate-900/30">
        {(["upload", "validate", "import", "results"] as Step[]).map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            {i > 0 && <ChevronRight className="w-3 h-3 text-slate-600" />}
            <div className={cn(
              "flex items-center gap-1.5 text-xs px-2 py-1 rounded",
              step === s ? "bg-violet-500/20 text-violet-400 font-semibold" :
              (["upload", "validate", "import", "results"].indexOf(step) > i) ? "text-emerald-400" : "text-slate-500"
            )}>
              <span className="w-4 h-4 rounded-full border text-xs flex items-center justify-center">
                {(["upload", "validate", "import", "results"].indexOf(step) > i) ? "\u2713" : i + 1}
              </span>
              {s === "upload" ? "Upload" : s === "validate" ? "Validate" : s === "import" ? "Import" : "Results"}
            </div>
          </div>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">

        {/* STEP 1: UPLOAD */}
        {step === "upload" && (
          <div className="max-w-2xl mx-auto space-y-6">
            {/* Drop zone */}
            <div
              className={cn(
                "border-2 border-dashed rounded-xl p-12 text-center transition-all cursor-pointer",
                dragOver ? "border-violet-400 bg-violet-500/10" : "border-white/[0.08] hover:border-white/[0.15] bg-white/[0.01]"
              )}
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
            >
              <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }} />
              <FileSpreadsheet className="w-12 h-12 mx-auto mb-3 text-slate-500" />
              {fileName ? (
                <>
                  <div className="text-sm font-semibold text-white">{fileName}</div>
                  <div className="text-xs text-slate-400 mt-1">{csvText.split("\n").length - 1} data rows detected</div>
                </>
              ) : (
                <>
                  <div className="text-sm text-slate-400">Drag & drop a CSV file here</div>
                  <div className="text-xs text-slate-500 mt-1">or click to browse</div>
                </>
              )}
            </div>

            <div className="flex items-center justify-between">
              <Button variant="ghost" size="sm" className="text-xs text-violet-400" onClick={handleDownloadTemplate}>
                <Download className="w-3.5 h-3.5 mr-1" />Download Template
              </Button>
              <Button
                size="sm"
                className="h-8 px-4 text-xs bg-violet-600 hover:bg-violet-700"
                onClick={handleUpload}
                disabled={!csvText || uploadMut.isPending}
              >
                {uploadMut.isPending ? <><Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />Uploading...</> : <>Upload & Continue<ChevronRight className="w-3.5 h-3.5 ml-1" /></>}
              </Button>
            </div>

            {/* Import History */}
            {history.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-slate-500 uppercase">Import History</h3>
                {history.slice(0, 5).map((j: any) => (
                  <Card key={j.id} className="bg-white/[0.02] border-white/[0.06] px-4 py-2 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileSpreadsheet className="w-4 h-4 text-slate-500" />
                      <div>
                        <div className="text-xs font-medium text-white">{j.fileName}</div>
                        <div className="text-xs text-slate-500">{new Date(j.createdAt).toLocaleString()}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-400">{j.totalRows} rows</span>
                      <Badge className={cn("text-xs border-0",
                        j.status === "completed" ? "bg-emerald-500/20 text-emerald-400" :
                        j.status === "failed" ? "bg-red-500/20 text-red-400" : "bg-slate-500/20 text-slate-400"
                      )}>{j.status}</Badge>
                      {j.successCount > 0 && <span className="text-xs text-emerald-400">{j.successCount} created</span>}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* STEP 2: VALIDATE */}
        {step === "validate" && (
          <div className="space-y-4">
            {/* ESANG AI Info */}
            {aiInfo && (
              <div className="flex items-center gap-3 px-4 py-2.5 rounded-lg bg-violet-500/10 border border-violet-500/20">
                <Sparkles className="w-4 h-4 text-violet-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-semibold text-violet-300">ESANG AI Column Mapping</span>
                  <span className="text-xs text-violet-400/70 ml-2">{aiInfo.confidence}% confidence</span>
                  {aiInfo.notes && <span className="text-xs text-slate-400 ml-2">— {aiInfo.notes}</span>}
                </div>
                <Badge className="bg-violet-500/20 text-violet-400 border-0 text-xs">AI-Enhanced</Badge>
              </div>
            )}

            {/* Summary bar */}
            <div className="flex items-center gap-4">
              <Badge className="bg-emerald-500/20 text-emerald-400 border-0 text-xs gap-1">
                <CheckCircle className="w-3 h-3" />{validCount} valid
              </Badge>
              <Badge className="bg-red-500/20 text-red-400 border-0 text-xs gap-1">
                <XCircle className="w-3 h-3" />{invalidCount} invalid
              </Badge>
              <span className="text-xs text-slate-500">{rows.length} total rows</span>

              <div className="ml-auto flex gap-2">
                {status?.status === "uploaded" && (
                  <Button size="sm" className="h-7 px-3 text-xs bg-amber-600 hover:bg-amber-700"
                    onClick={() => validateMut.mutate({ jobId: jobId! })}
                    disabled={validateMut.isPending}
                  >
                    {validateMut.isPending ? <><Loader2 className="w-3 h-3 mr-1 animate-spin" />Validating...</> : <>
                      <Sparkles className="w-3 h-3 mr-1" />Run Validation</>}
                  </Button>
                )}
                {status?.status === "validated" && (
                  <Button size="sm" className="h-7 px-3 text-xs bg-violet-600 hover:bg-violet-700"
                    onClick={() => setStep("import")}
                    disabled={validCount === 0}
                  >
                    Proceed to Import<ChevronRight className="w-3 h-3 ml-1" />
                  </Button>
                )}
              </div>
            </div>

            {/* Row table */}
            <div className="overflow-x-auto rounded-lg border border-white/[0.06]">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-xs text-slate-500 uppercase border-b border-white/[0.06] bg-white/[0.02]">
                    <th className="px-3 py-2 text-left w-12">#</th>
                    <th className="px-3 py-2 text-left">Status</th>
                    <th className="px-3 py-2 text-left">Pickup</th>
                    <th className="px-3 py-2 text-left">Delivery</th>
                    <th className="px-3 py-2 text-left">Pickup Date</th>
                    <th className="px-3 py-2 text-left">Delivery Date</th>
                    <th className="px-3 py-2 text-left">Cargo</th>
                    <th className="px-3 py-2 text-left">Errors</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r: any) => {
                    const raw = typeof r.rawData === "string" ? JSON.parse(r.rawData) : (r.rawData || {});
                    return (
                      <tr key={r.rowNumber} className={cn("border-b border-white/[0.02] hover:bg-white/[0.02]",
                        r.status === "invalid" && "bg-red-500/5",
                        r.status === "created" && "bg-emerald-500/5"
                      )}>
                        <td className="px-3 py-2 text-slate-500">{r.rowNumber}</td>
                        <td className="px-3 py-2">
                          {r.status === "valid" || r.status === "created" ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> :
                           r.status === "invalid" || r.status === "failed" ? <XCircle className="w-3.5 h-3.5 text-red-400" /> :
                           <Clock className="w-3.5 h-3.5 text-slate-500" />}
                        </td>
                        <td className="px-3 py-2 text-slate-300">{raw.pickupLocation || "—"}</td>
                        <td className="px-3 py-2 text-slate-300">{raw.deliveryLocation || "—"}</td>
                        <td className="px-3 py-2 text-slate-300">{raw.pickupDate || "—"}</td>
                        <td className="px-3 py-2 text-slate-300">{raw.deliveryDate || "—"}</td>
                        <td className="px-3 py-2 text-slate-300">{raw.cargoType || "—"}</td>
                        <td className="px-3 py-2">
                          {r.errors && Array.isArray(r.errors) && r.errors.length > 0 ? (
                            <span className="text-red-400 text-xs">{r.errors.join("; ")}</span>
                          ) : r.loadId ? (
                            <span className="text-emerald-400 text-xs">Load #{r.loadId}</span>
                          ) : null}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* STEP 3: IMPORT */}
        {step === "import" && (
          <div className="max-w-lg mx-auto space-y-6 py-8">
            <Card className="bg-white/[0.02] border-white/[0.06] p-6 space-y-4">
              <h3 className="text-sm font-semibold text-white">Confirm Import</h3>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="rounded bg-emerald-500/5 border border-emerald-500/10 py-3">
                  <div className="text-2xl font-bold text-emerald-400">{validCount}</div>
                  <div className="text-xs text-slate-500 uppercase">Loads to Create</div>
                </div>
                <div className="rounded bg-red-500/5 border border-red-500/10 py-3">
                  <div className="text-2xl font-bold text-red-400">{invalidCount}</div>
                  <div className="text-xs text-slate-500 uppercase">Will Be Skipped</div>
                </div>
              </div>
              <div className="text-xs text-slate-400">
                {validCount} valid rows will be imported as new loads. Invalid rows will be skipped and available in the error report.
              </div>
              <Button
                className="w-full h-10 bg-violet-600 hover:bg-violet-700"
                onClick={() => executeMut.mutate({ jobId: jobId!, skipInvalid: true })}
                disabled={executeMut.isPending || validCount === 0}
              >
                {executeMut.isPending ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Importing...</>
                ) : (
                  <><Package className="w-4 h-4 mr-2" />Import {validCount} Load{validCount !== 1 ? "s" : ""}</>
                )}
              </Button>
            </Card>
          </div>
        )}

        {/* STEP 4: RESULTS */}
        {step === "results" && (
          <div className="max-w-lg mx-auto space-y-6 py-8">
            <Card className="bg-white/[0.02] border-white/[0.06] p-6 space-y-4 text-center">
              <CheckCircle className="w-12 h-12 mx-auto text-emerald-400" />
              <h3 className="text-lg font-bold text-white">Import Complete</h3>
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded bg-white/[0.02] border border-white/[0.04] py-2">
                  <div className="text-xl font-bold text-white">{status?.totalRows || 0}</div>
                  <div className="text-xs text-slate-500">Total Rows</div>
                </div>
                <div className="rounded bg-emerald-500/5 border border-emerald-500/10 py-2">
                  <div className="text-xl font-bold text-emerald-400">{status?.successCount || 0}</div>
                  <div className="text-xs text-slate-500">Created</div>
                </div>
                <div className="rounded bg-red-500/5 border border-red-500/10 py-2">
                  <div className="text-xl font-bold text-red-400">{status?.failCount || 0}</div>
                  <div className="text-xs text-slate-500">Failed</div>
                </div>
              </div>
              <div className="flex gap-2 justify-center pt-2">
                {(status?.failCount || 0) > 0 && (
                  <Button variant="ghost" size="sm" className="text-xs text-red-400" onClick={handleDownloadErrors}>
                    <Download className="w-3.5 h-3.5 mr-1" />Download Errors
                  </Button>
                )}
                <Button size="sm" className="text-xs bg-violet-600 hover:bg-violet-700" onClick={reset}>
                  <RefreshCw className="w-3.5 h-3.5 mr-1" />Import Another
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
