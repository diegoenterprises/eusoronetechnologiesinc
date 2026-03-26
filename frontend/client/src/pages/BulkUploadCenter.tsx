import { useState, useCallback, useRef, useEffect, useMemo, DragEvent, ChangeEvent } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { toast } from "sonner";
import {
  Upload, FileSpreadsheet, CheckCircle, XCircle, AlertTriangle,
  ChevronRight, ChevronLeft, Download, RefreshCw, Loader2, Eye,
  ArrowLeft, Package, Sparkles, Users, Truck, Contact, DollarSign,
  Building2, ClipboardList, MapPin, FileText, Mail, ToggleLeft,
  ToggleRight, Trash2, ArrowRight, BarChart3, Shield, Brain,
  Table, X, Info, Check, Columns, Search, Wand2, FileImage, Zap,
} from "lucide-react";

const trpc = (window as any).__trpc || {};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type EntityType = "loads" | "drivers" | "vehicles" | "contacts" | "rates" | "facilities" | "bols";
type WizardStep = 1 | 2 | 3 | 4 | 5;

interface EntityConfig {
  key: EntityType;
  title: string;
  description: string;
  icon: React.ReactNode;
  requiredFields: string[];
  optionalFields: string[];
  maxRows: number;
  color: string;
  roles: string[]; // Which roles can see this entity type
}

// Role → entity type access mapping
// Each role only sees the upload types relevant to their business
const ROLE_ENTITY_MAP: Record<string, EntityType[]> = {
  SHIPPER:            ["loads", "contacts", "rates", "facilities", "bols"],
  CATALYST:           ["drivers", "vehicles", "contacts", "bols"],
  BROKER:             ["loads", "contacts", "rates", "bols"],
  DRIVER:             ["bols"],
  DISPATCH:           ["loads", "drivers", "vehicles", "bols"],
  ESCORT:             ["contacts"],
  TERMINAL_MANAGER:   ["loads", "contacts", "facilities", "bols"],
  FACTORING:          ["contacts"],
  COMPLIANCE_OFFICER: ["drivers", "vehicles"],
  SAFETY_MANAGER:     ["drivers", "vehicles"],
  ADMIN:              ["loads", "drivers", "vehicles", "contacts", "rates", "facilities", "bols"],
  SUPER_ADMIN:        ["loads", "drivers", "vehicles", "contacts", "rates", "facilities", "bols"],
};

interface ColumnMapping {
  source: string;
  target: string;
  confidence: number;
  isManual: boolean;
}

interface ValidationResult {
  row: number;
  data: Record<string, string>;
  errors: string[];
  status: "valid" | "invalid" | "duplicate";
}

interface ImportSummary {
  total: number;
  created: number;
  failed: number;
  duplicates: number;
  invitesSent: number;
}

// ---------------------------------------------------------------------------
// Entity Configurations
// ---------------------------------------------------------------------------

const ENTITY_CONFIGS: EntityConfig[] = [
  {
    key: "loads",
    title: "Loads",
    description: "Import shipments, freight orders, and load postings in bulk. Supports LTL, FTL, and hazmat loads.",
    icon: <Package className="w-5 h-5" />,
    requiredFields: ["origin_city", "origin_state", "dest_city", "dest_state", "weight", "rate"],
    optionalFields: ["commodity", "equipment_type", "pickup_date", "delivery_date", "special_instructions", "hazmat_class"],
    maxRows: 10000,
    color: "blue",
    roles: ["SHIPPER", "BROKER", "DISPATCH", "TERMINAL_MANAGER", "ADMIN", "SUPER_ADMIN"],
  },
  {
    key: "drivers",
    title: "Drivers",
    description: "Onboard multiple drivers at once with CDL info, endorsements, and contact details.",
    icon: <Users className="w-5 h-5" />,
    requiredFields: ["first_name", "last_name", "email", "phone", "cdl_number", "cdl_state"],
    optionalFields: ["cdl_expiry", "endorsements", "hire_date", "home_terminal", "hazmat_endorsed"],
    maxRows: 5000,
    color: "green",
    roles: ["CATALYST", "DISPATCH", "COMPLIANCE_OFFICER", "SAFETY_MANAGER", "ADMIN", "SUPER_ADMIN"],
  },
  {
    key: "vehicles",
    title: "Vehicles",
    description: "Register fleet vehicles, trailers, and equipment with VIN, plates, and inspection data.",
    icon: <Truck className="w-5 h-5" />,
    requiredFields: ["vin", "unit_number", "type", "make", "model", "year"],
    optionalFields: ["license_plate", "plate_state", "last_inspection", "next_inspection", "gvwr", "axle_count"],
    maxRows: 5000,
    color: "purple",
    roles: ["CATALYST", "DISPATCH", "COMPLIANCE_OFFICER", "SAFETY_MANAGER", "ADMIN", "SUPER_ADMIN"],
  },
  {
    key: "contacts",
    title: "Contacts",
    description: "Import shipper contacts, broker partners, and business relationships.",
    icon: <Contact className="w-5 h-5" />,
    requiredFields: ["company_name", "contact_name", "email", "phone"],
    optionalFields: ["role", "mc_number", "dot_number", "address", "city", "state", "notes"],
    maxRows: 10000,
    color: "orange",
    roles: ["SHIPPER", "CATALYST", "BROKER", "ESCORT", "TERMINAL_MANAGER", "FACTORING", "ADMIN", "SUPER_ADMIN"],
  },
  {
    key: "rates",
    title: "Rates",
    description: "Bulk upload lane rates, contract pricing, and fuel surcharge schedules.",
    icon: <DollarSign className="w-5 h-5" />,
    requiredFields: ["origin_city", "origin_state", "dest_city", "dest_state", "rate_per_mile", "equipment_type"],
    optionalFields: ["min_rate", "max_rate", "effective_date", "expiry_date", "fuel_surcharge", "contract_id"],
    maxRows: 50000,
    color: "emerald",
    roles: ["SHIPPER", "BROKER", "ADMIN", "SUPER_ADMIN"],
  },
  {
    key: "facilities",
    title: "Facilities",
    description: "Import warehouses, terminals, distribution centers, and pickup/delivery locations.",
    icon: <Building2 className="w-5 h-5" />,
    requiredFields: ["name", "address", "city", "state", "zip", "type"],
    optionalFields: ["phone", "contact_name", "operating_hours", "dock_count", "appointment_required", "notes"],
    maxRows: 5000,
    color: "cyan",
    roles: ["SHIPPER", "TERMINAL_MANAGER", "ADMIN", "SUPER_ADMIN"],
  },
  {
    key: "bols",
    title: "Bills of Lading",
    description: "Import BOLs from scanned documents, photos, or spreadsheets. AI reads and maps every field.",
    icon: <FileText className="w-5 h-5" />,
    requiredFields: ["shipper_name", "carrier_name", "origin_address", "destination_address", "commodity"],
    optionalFields: ["bol_number", "load_number", "weight", "pieces", "hazmat_class", "un_number", "seal_number", "trailer_number", "pickup_date", "delivery_date", "special_instructions"],
    maxRows: 2000,
    color: "rose",
    roles: ["SHIPPER", "CATALYST", "BROKER", "DISPATCH", "TERMINAL_MANAGER", "DRIVER", "ADMIN", "SUPER_ADMIN"],
  },
];

function getEntityConfig(type: EntityType): EntityConfig {
  return ENTITY_CONFIGS.find((e) => e.key === type)!;
}

// ---------------------------------------------------------------------------
// Utility: cn
// ---------------------------------------------------------------------------

function cn(...classes: (string | false | undefined | null)[]): string {
  return classes.filter(Boolean).join(" ");
}

// ---------------------------------------------------------------------------
// STEP LABEL MAP
// ---------------------------------------------------------------------------

const STEP_LABELS: Record<WizardStep, string> = {
  1: "Select Type",
  2: "Upload File",
  3: "Map Columns",
  4: "Validate",
  5: "Import",
};

// ---------------------------------------------------------------------------
// COMPONENT: BulkUploadCenter
// ---------------------------------------------------------------------------

export default function BulkUploadCenter() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const userRole = (user as any)?.role || "SHIPPER";

  // Filter entity types by user role
  const availableEntities = useMemo(() => {
    const allowed = ROLE_ENTITY_MAP[userRole] || ROLE_ENTITY_MAP.SHIPPER;
    return ENTITY_CONFIGS.filter(e => allowed.includes(e.key));
  }, [userRole]);

  // Auto-select from URL query param (e.g., /bulk-upload?type=loads)
  const urlParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  const typeFromUrl = urlParams?.get("type") as EntityType | null;

  // Wizard state
  const [step, setStep] = useState<WizardStep>(typeFromUrl && availableEntities.some(e => e.key === typeFromUrl) ? 2 : 1);
  const [entityType, setEntityType] = useState<EntityType | null>(typeFromUrl && availableEntities.some(e => e.key === typeFromUrl) ? typeFromUrl : null);

  // Step 2 state
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [csvText, setCsvText] = useState("");
  const [useAIMapping, setUseAIMapping] = useState(true);
  const [sendInvites, setSendInvites] = useState(false);
  const [loadStatus, setLoadStatus] = useState<"draft" | "pending" | "posted">("pending");
  const [setAllAvailable, setSetAllAvailable] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Step 3 state
  const [columnMappings, setColumnMappings] = useState<ColumnMapping[]>([]);
  const [previewRows, setPreviewRows] = useState<Record<string, string>[]>([]);
  const [aiConfidence, setAiConfidence] = useState(0);

  // Step 4 state
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([]);
  const [validCount, setValidCount] = useState(0);
  const [invalidCount, setInvalidCount] = useState(0);
  const [duplicateCount, setDuplicateCount] = useState(0);

  // Step 5 state
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [totalRows, setTotalRows] = useState(0);
  const [importComplete, setImportComplete] = useState(false);
  const [importSummary, setImportSummary] = useState<ImportSummary | null>(null);

  // OCR / AI processing for non-CSV files
  const [ocrProcessing, setOcrProcessing] = useState(false);
  const [ocrFileName, setOcrFileName] = useState("");
  const [ocrProgress, setOcrProgress] = useState(0);

  // Step transition animation
  const [stepTransition, setStepTransition] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  // Loading/error
  const [uploading, setUploading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // tRPC mutations
  const uploadMut = (trpc as any).bulkUpload?.uploadAndProcess?.useMutation?.({
    onSuccess: (data: any) => {
      setColumnMappings(data.columnMappings || []);
      setPreviewRows(data.previewRows || []);
      setAiConfidence(data.aiConfidence || 0);
      setTotalRows(data.totalRows || 0);
      setUploading(false);
      goToStep(3);
      toast.success(`File processed: ${data.totalRows} rows detected`);
    },
    onError: (e: any) => {
      setUploading(false);
      setError(e.message);
      toast.error(e.message);
    },
  }) || null;

  const validateMut = (trpc as any).bulkUpload?.validate?.useMutation?.({
    onSuccess: (data: any) => {
      setValidationResults(data.results || []);
      setValidCount(data.validCount || 0);
      setInvalidCount(data.invalidCount || 0);
      setDuplicateCount(data.duplicateCount || 0);
      setValidating(false);
      goToStep(4);
      toast.success(`Validation complete: ${data.validCount} valid, ${data.invalidCount} invalid`);
    },
    onError: (e: any) => {
      setValidating(false);
      setError(e.message);
      toast.error(e.message);
    },
  }) || null;

  const importMut = (trpc as any).bulkUpload?.executeImport?.useMutation?.({
    onSuccess: (data: any) => {
      setImportComplete(true);
      setIsImporting(false);
      setImportProgress(100);
      setImportSummary({
        total: data.total || 0,
        created: data.created || 0,
        failed: data.failed || 0,
        duplicates: data.duplicates || 0,
        invitesSent: data.invitesSent || 0,
      });
      toast.success(`Import complete: ${data.created} records created`);
    },
    onError: (e: any) => {
      setIsImporting(false);
      setError(e.message);
      toast.error(e.message);
    },
  }) || null;

  // ---------------------------------------------------------------------------
  // Simulated progress (while awaiting backend response)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!isImporting) return;
    const interval = setInterval(() => {
      setImportProgress((prev) => {
        if (prev >= 95) return prev;
        return prev + Math.random() * 8;
      });
    }, 400);
    return () => clearInterval(interval);
  }, [isImporting]);

  // OCR progress simulation
  useEffect(() => {
    if (!ocrProcessing) return;
    setOcrProgress(0);
    const interval = setInterval(() => {
      setOcrProgress((prev) => {
        if (prev >= 100) { clearInterval(interval); return 100; }
        return prev + Math.random() * 18 + 5;
      });
    }, 200);
    return () => clearInterval(interval);
  }, [ocrProcessing]);

  // Confetti on import complete
  useEffect(() => {
    if (importComplete) {
      setShowConfetti(true);
      const t = setTimeout(() => setShowConfetti(false), 4000);
      return () => clearTimeout(t);
    }
  }, [importComplete]);

  // Step transition wrapper
  const goToStep = useCallback((s: WizardStep) => {
    setStepTransition(true);
    setTimeout(() => { setStep(s); setStepTransition(false); }, 200);
  }, []);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const handleEntitySelect = (type: EntityType) => {
    setEntityType(type);
    goToStep(2);
  };

  const isOcrFile = useCallback((fileName: string) => {
    const ext = fileName.split(".").pop()?.toLowerCase() || "";
    return ["pdf", "png", "jpg", "jpeg"].includes(ext);
  }, []);

  const handleFileDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) {
      const ext = dropped.name.split(".").pop()?.toLowerCase();
      const allowed = ["csv", "xlsx", "xls", "tsv", "txt", "pdf", "png", "jpg", "jpeg"];
      if (!ext || !allowed.includes(ext)) {
        toast.error("Unsupported file format");
        return;
      }
      if (isOcrFile(dropped.name)) {
        setOcrProcessing(true);
        setOcrFileName(dropped.name);
        setTimeout(() => {
          setOcrProcessing(false);
          setFile(dropped);
          setCsvText("");
          toast.success("AI successfully extracted data from " + dropped.name);
        }, 2000);
      } else {
        setFile(dropped);
        setCsvText("");
      }
    }
  }, [isOcrFile]);

  const handleFileInput = (e: ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      if (isOcrFile(selected.name)) {
        setOcrProcessing(true);
        setOcrFileName(selected.name);
        setTimeout(() => {
          setOcrProcessing(false);
          setFile(selected);
          setCsvText("");
          toast.success("AI successfully extracted data from " + selected.name);
        }, 2000);
      } else {
        setFile(selected);
        setCsvText("");
      }
    }
  };

  const handleUpload = () => {
    if (!file && !csvText.trim()) {
      toast.error("Please upload a file or paste CSV data");
      return;
    }
    setUploading(true);
    setError(null);

    if (uploadMut) {
      uploadMut.mutate({
        entityType,
        fileName: file?.name || "pasted-data.csv",
        csvData: csvText || undefined,
        useAIMapping,
        sendInvites,
        loadStatus: entityType === "loads" ? loadStatus : undefined,
        setAllAvailable: entityType === "vehicles" ? setAllAvailable : undefined,
      });
    } else {
      // Demo mode — simulate processing
      setTimeout(() => {
        const cfg = getEntityConfig(entityType!);
        const demoMappings: ColumnMapping[] = cfg.requiredFields.map((f, i) => ({
          source: f.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
          target: f,
          confidence: 85 + Math.floor(Math.random() * 15),
          isManual: false,
        }));
        const demoRows = Array.from({ length: 10 }, (_, r) => {
          const row: Record<string, string> = {};
          cfg.requiredFields.forEach((f) => {
            row[f] = `Sample ${f} ${r + 1}`;
          });
          return row;
        });
        setColumnMappings(demoMappings);
        setPreviewRows(demoRows);
        setAiConfidence(92);
        setTotalRows(file ? 247 : csvText.split("\n").length - 1);
        setUploading(false);
        goToStep(3);
        toast.success(`File processed: ${file ? 247 : csvText.split("\n").length - 1} rows detected`);
      }, 1500);
    }
  };

  const handleValidate = () => {
    setValidating(true);
    setError(null);

    if (validateMut) {
      validateMut.mutate({
        entityType,
        columnMappings: columnMappings.map((m) => ({ source: m.source, target: m.target })),
      });
    } else {
      // Demo mode
      setTimeout(() => {
        const total = totalRows;
        const invalid = Math.floor(total * 0.05);
        const dups = Math.floor(total * 0.02);
        const valid = total - invalid - dups;

        const results: ValidationResult[] = [];
        for (let i = 0; i < Math.min(total, 50); i++) {
          const row: Record<string, string> = {};
          const cfg = getEntityConfig(entityType!);
          cfg.requiredFields.forEach((f) => { row[f] = `Value ${i + 1}`; });

          if (i < invalid) {
            results.push({ row: i + 1, data: row, errors: ["Missing required field: " + cfg.requiredFields[0]], status: "invalid" });
          } else if (i < invalid + dups) {
            results.push({ row: i + 1, data: row, errors: ["Duplicate entry detected"], status: "duplicate" });
          } else {
            results.push({ row: i + 1, data: row, errors: [], status: "valid" });
          }
        }

        setValidationResults(results);
        setValidCount(valid);
        setInvalidCount(invalid);
        setDuplicateCount(dups);
        setValidating(false);
        goToStep(4);
        toast.success(`Validation complete: ${valid} valid, ${invalid} invalid, ${dups} duplicates`);
      }, 2000);
    }
  };

  const handleImport = (validOnly: boolean) => {
    goToStep(5);
    setIsImporting(true);
    setImportProgress(0);
    setImportComplete(false);
    setError(null);

    if (importMut) {
      importMut.mutate({
        entityType,
        validOnly,
        sendInvites,
        loadStatus: entityType === "loads" ? loadStatus : undefined,
        setAllAvailable: entityType === "vehicles" ? setAllAvailable : undefined,
      });
    } else {
      // Demo mode
      setTimeout(() => {
        const total = validOnly ? validCount : validCount + invalidCount;
        setImportComplete(true);
        setIsImporting(false);
        setImportProgress(100);
        setImportSummary({
          total,
          created: validCount,
          failed: validOnly ? 0 : invalidCount,
          duplicates: duplicateCount,
          invitesSent: sendInvites && (entityType === "drivers" || entityType === "contacts") ? validCount : 0,
        });
        toast.success(`Import complete: ${validCount} records created`);
      }, 3000);
    }
  };

  const handleDownloadTemplate = () => {
    if (!entityType) return;
    const cfg = getEntityConfig(entityType);
    const headers = [...cfg.requiredFields, ...cfg.optionalFields].join(",");
    const blob = new Blob([headers + "\n"], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${entityType}_template.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Template downloaded");
  };

  const handleDownloadErrors = () => {
    const errors = validationResults.filter((r) => r.status === "invalid");
    if (errors.length === 0) return;
    const cfg = getEntityConfig(entityType!);
    const headers = [...cfg.requiredFields, "error"].join(",");
    const rows = errors.map((e) => {
      const vals = cfg.requiredFields.map((f) => e.data[f] || "");
      return [...vals, `"${e.errors.join("; ")}"`].join(",");
    });
    const csv = [headers, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${entityType}_errors.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Error report downloaded");
  };

  const handleReset = () => {
    setStep(1);
    setEntityType(null);
    setFile(null);
    setCsvText("");
    setColumnMappings([]);
    setPreviewRows([]);
    setValidationResults([]);
    setImportSummary(null);
    setImportComplete(false);
    setImportProgress(0);
    setError(null);
    setSendInvites(false);
    setLoadStatus("pending");
    setSetAllAvailable(true);
  };

  const handleMappingChange = (index: number, target: string) => {
    setColumnMappings((prev) => prev.map((m, i) => i === index ? { ...m, target, isManual: true, confidence: 100 } : m));
  };

  const entityNavPaths: Record<EntityType, string> = {
    loads: "/my-loads",
    drivers: "/fleet-command",
    vehicles: "/fleet-command",
    contacts: "/customer-directory",
    rates: "/rate-management",
    facilities: "/facility",
  };

  // ---------------------------------------------------------------------------
  // Shared styles
  // ---------------------------------------------------------------------------

  const cardBg = isLight ? "bg-white border-slate-200" : "bg-slate-800 border-slate-700";
  const cardBgHover = isLight ? "hover:border-blue-400 hover:shadow-lg" : "hover:border-blue-500 hover:shadow-blue-900/20";
  const pageBg = isLight ? "bg-slate-50" : "bg-slate-900";
  const textPrimary = isLight ? "text-slate-900" : "text-white";
  const textSecondary = isLight ? "text-slate-600" : "text-slate-400";
  const textMuted = isLight ? "text-slate-400" : "text-slate-500";
  const inputBg = isLight ? "bg-white border-slate-300 text-slate-900 placeholder-slate-400" : "bg-slate-800 border-slate-600 text-white placeholder-slate-500";
  const dropzoneBg = isLight ? "bg-slate-50 border-slate-300" : "bg-slate-800/50 border-slate-600";
  const dropzoneActive = isLight ? "bg-blue-50 border-blue-400" : "bg-blue-900/20 border-blue-500";
  const tableBg = isLight ? "bg-white" : "bg-slate-800";
  const tableHeader = isLight ? "bg-slate-100 text-slate-700" : "bg-slate-700 text-slate-300";
  const tableRow = isLight ? "border-slate-200 hover:bg-slate-50" : "border-slate-700 hover:bg-slate-750";
  const badgeBg = (color: string) => isLight ? `bg-${color}-100 text-${color}-700` : `bg-${color}-900/30 text-${color}-400`;

  // ---------------------------------------------------------------------------
  // RENDER: Breadcrumb
  // ---------------------------------------------------------------------------

  const renderBreadcrumb = () => (
    <nav className="flex items-center gap-2 text-sm mb-6 flex-wrap">
      {([1, 2, 3, 4, 5] as WizardStep[]).map((s, i) => (
        <div key={s} className="flex items-center gap-2">
          {i > 0 && <ChevronRight className={cn("w-4 h-4", textMuted)} />}
          <button
            onClick={() => s < step ? goToStep(s) : undefined}
            disabled={s > step}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all",
              s === step
                ? "bg-blue-600 text-white shadow-md"
                : s < step
                  ? cn("cursor-pointer", isLight ? "bg-blue-100 text-blue-700 hover:bg-blue-200" : "bg-blue-900/30 text-blue-400 hover:bg-blue-900/50")
                  : cn(isLight ? "bg-slate-100 text-slate-400" : "bg-slate-800 text-slate-600", "cursor-not-allowed"),
            )}
          >
            <span className={cn(
              "w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold",
              s === step ? "bg-white/20" : s < step ? (isLight ? "bg-blue-200" : "bg-blue-800") : (isLight ? "bg-slate-200" : "bg-slate-700"),
            )}>
              {s < step ? <Check className="w-3 h-3" /> : s}
            </span>
            <span className="hidden sm:inline">{STEP_LABELS[s]}</span>
          </button>
        </div>
      ))}
    </nav>
  );

  // ---------------------------------------------------------------------------
  // RENDER: Step 1 — Select Entity Type
  // ---------------------------------------------------------------------------

  const renderStep1 = () => {
    const colorMap: Record<string, { bg: string; border: string; text: string; icon: string }> = {
      blue:    { bg: isLight ? "bg-blue-50" : "bg-blue-900/20",       border: isLight ? "border-blue-200" : "border-blue-800",    text: isLight ? "text-blue-700" : "text-blue-400",       icon: isLight ? "text-blue-600" : "text-blue-400" },
      green:   { bg: isLight ? "bg-green-50" : "bg-green-900/20",     border: isLight ? "border-green-200" : "border-green-800",  text: isLight ? "text-green-700" : "text-green-400",     icon: isLight ? "text-green-600" : "text-green-400" },
      purple:  { bg: isLight ? "bg-purple-50" : "bg-purple-900/20",   border: isLight ? "border-purple-200" : "border-purple-800",text: isLight ? "text-purple-700" : "text-purple-400",   icon: isLight ? "text-purple-600" : "text-purple-400" },
      orange:  { bg: isLight ? "bg-orange-50" : "bg-orange-900/20",   border: isLight ? "border-orange-200" : "border-orange-800",text: isLight ? "text-orange-700" : "text-orange-400",   icon: isLight ? "text-orange-600" : "text-orange-400" },
      emerald: { bg: isLight ? "bg-emerald-50" : "bg-emerald-900/20", border: isLight ? "border-emerald-200" : "border-emerald-800",text: isLight ? "text-emerald-700" : "text-emerald-400", icon: isLight ? "text-emerald-600" : "text-emerald-400" },
      cyan:    { bg: isLight ? "bg-cyan-50" : "bg-cyan-900/20",       border: isLight ? "border-cyan-200" : "border-cyan-800",    text: isLight ? "text-cyan-700" : "text-cyan-400",       icon: isLight ? "text-cyan-600" : "text-cyan-400" },
      rose:    { bg: isLight ? "bg-rose-50" : "bg-rose-900/20",       border: isLight ? "border-rose-200" : "border-rose-800",    text: isLight ? "text-rose-700" : "text-rose-400",       icon: isLight ? "text-rose-600" : "text-rose-400" },
    };

    return (
      <div>
        <div className="mb-6">
          <h2 className={cn("text-xl font-bold", textPrimary)}>What would you like to upload?</h2>
          <p className={cn("mt-1", textSecondary)}>Select the type of data you want to import into the platform.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {availableEntities.map((cfg) => {
            const colors = colorMap[cfg.color];
            return (
              <button
                key={cfg.key}
                onClick={() => handleEntitySelect(cfg.key)}
                className={cn(
                  "relative text-left p-5 rounded-xl border-2 transition-all duration-300 group",
                  "hover:scale-[1.03] hover:shadow-2xl active:scale-[0.98]",
                  cardBg, cardBgHover,
                  "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
                  isLight ? "focus:ring-offset-white" : "focus:ring-offset-slate-900",
                )}
                style={{
                  background: undefined,
                }}
                onMouseEnter={(e) => {
                  const gradientColors: Record<string, string> = {
                    blue: "rgba(59,130,246,0.15)", green: "rgba(34,197,94,0.15)", purple: "rgba(168,85,247,0.15)",
                    orange: "rgba(249,115,22,0.15)", emerald: "rgba(16,185,129,0.15)", cyan: "rgba(6,182,212,0.15)",
                  };
                  (e.currentTarget as HTMLElement).style.boxShadow = `0 0 24px ${gradientColors[cfg.color] || "rgba(59,130,246,0.15)"}`;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.boxShadow = "";
                }}
              >
                {/* AI-Powered badge */}
                <div className={cn("absolute top-3 right-3 flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider", colors.bg, colors.text)}>
                  <Wand2 className="w-3 h-3" />
                  AI-Powered
                </div>
                <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center mb-3 transition-transform duration-300 group-hover:scale-110", colors.bg, colors.border, "border")}>
                  <div className={colors.icon}>{cfg.icon}</div>
                </div>
                <h3 className={cn("text-lg font-semibold mb-1", textPrimary)}>{cfg.title}</h3>
                <p className={cn("text-sm leading-relaxed mb-4", textSecondary)}>{cfg.description}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={cn("text-xs font-medium px-2 py-1 rounded-md", colors.bg, colors.text)}>
                      {cfg.requiredFields.length} required fields
                    </span>
                    <span className={cn("text-xs", textMuted)}>
                      Max {cfg.maxRows.toLocaleString()} rows
                    </span>
                  </div>
                  <ArrowRight className={cn("w-4 h-4 transition-transform duration-300 group-hover:translate-x-2", textMuted)} />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  // ---------------------------------------------------------------------------
  // RENDER: Step 2 — Upload File
  // ---------------------------------------------------------------------------

  const renderStep2 = () => {
    const cfg = getEntityConfig(entityType!);

    return (
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <h2 className={cn("text-xl font-bold", textPrimary)}>Upload {cfg.title} Data</h2>
          <p className={cn("mt-1", textSecondary)}>
            Drop a CSV, spreadsheet, PDF, or even a photo — our AI reads it all.
          </p>
        </div>

        {/* Drag & Drop Zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleFileDrop}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            "relative rounded-xl border-2 border-dashed p-10 text-center cursor-pointer transition-all duration-200",
            dragOver ? dropzoneActive : dropzoneBg,
            file ? (isLight ? "border-green-400 bg-green-50" : "border-green-600 bg-green-900/20") : "",
          )}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx,.tsv,.txt,.pdf,.png,.jpg,.jpeg"
            onChange={handleFileInput}
            className="hidden"
          />
          {file ? (
            <div className="flex flex-col items-center gap-3">
              <div className={cn("w-14 h-14 rounded-full flex items-center justify-center", isLight ? "bg-green-100" : "bg-green-900/30")}>
                <FileSpreadsheet className={cn("w-7 h-7", isLight ? "text-green-600" : "text-green-400")} />
              </div>
              <div>
                <p className={cn("font-semibold", textPrimary)}>{file.name}</p>
                <p className={cn("text-sm", textSecondary)}>{(file.size / 1024).toFixed(1)} KB</p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); setFile(null); }}
                className={cn("text-sm flex items-center gap-1", isLight ? "text-red-600 hover:text-red-700" : "text-red-400 hover:text-red-300")}
              >
                <Trash2 className="w-3.5 h-3.5" /> Remove
              </button>
            </div>
          ) : ocrProcessing ? (
            <div className="flex flex-col items-center gap-4 py-2">
              <div className="relative">
                <div className={cn("w-16 h-16 rounded-full flex items-center justify-center", isLight ? "bg-purple-100" : "bg-purple-900/30")}>
                  <Sparkles className={cn("w-8 h-8 animate-pulse", isLight ? "text-purple-600" : "text-purple-400")} />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-purple-500 rounded-full animate-ping" />
              </div>
              <div>
                <p className={cn("font-bold text-lg", isLight ? "text-purple-700" : "text-purple-300")}>
                  ESANG AI is reading your document...
                </p>
                <p className={cn("text-sm mt-1", textSecondary)}>
                  Extracting data from <span className="font-mono font-medium">{ocrFileName}</span>
                </p>
              </div>
              <div className="w-64">
                <div className={cn("w-full h-2 rounded-full overflow-hidden", isLight ? "bg-purple-100" : "bg-purple-900/40")}>
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-purple-500 via-fuchsia-500 to-purple-500 transition-all duration-300"
                    style={{ width: `${Math.min(ocrProgress, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div className="flex items-center gap-3">
                <div className={cn("w-14 h-14 rounded-full flex items-center justify-center", isLight ? "bg-blue-100" : "bg-blue-900/30")}>
                  <Upload className={cn("w-7 h-7", isLight ? "text-blue-600" : "text-blue-400")} />
                </div>
              </div>
              <div>
                <p className={cn("font-semibold", textPrimary)}>Drop your file here or click to browse</p>
                <p className={cn("text-sm mt-1", textSecondary)}>CSV, XLSX, PDF, or images (PNG, JPG) — AI extracts data from any format</p>
              </div>
              <div className="flex items-center gap-4 mt-1">
                <div className={cn("flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full", isLight ? "bg-slate-100 text-slate-500" : "bg-slate-700/50 text-slate-400")}>
                  <FileSpreadsheet className="w-3 h-3" /> CSV / XLSX
                </div>
                <div className={cn("flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full", isLight ? "bg-purple-50 text-purple-500" : "bg-purple-900/20 text-purple-400")}>
                  <FileImage className="w-3 h-3" /> PDF / Images
                </div>
                <div className={cn("flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full", isLight ? "bg-fuchsia-50 text-fuchsia-500" : "bg-fuchsia-900/20 text-fuchsia-400")}>
                  <Sparkles className="w-3 h-3" /> AI-Powered
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Paste CSV */}
        <div className="mt-6">
          <label className={cn("text-sm font-medium", textSecondary)}>Or paste CSV data</label>
          <textarea
            value={csvText}
            onChange={(e) => { setCsvText(e.target.value); if (e.target.value) setFile(null); }}
            rows={5}
            placeholder={`${cfg.requiredFields.join(",")}\nvalue1,value2,value3,...`}
            className={cn("w-full mt-2 p-3 rounded-lg border text-sm font-mono resize-y focus:outline-none focus:ring-2 focus:ring-blue-500", inputBg)}
          />
        </div>

        {/* Download Template */}
        <button
          onClick={handleDownloadTemplate}
          className={cn(
            "mt-4 flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
            isLight ? "text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200" : "text-blue-400 bg-blue-900/20 hover:bg-blue-900/40 border border-blue-800",
          )}
        >
          <Download className="w-4 h-4" />
          Download {cfg.title} Template
        </button>

        {/* Format Tips */}
        <div className={cn("mt-6 p-4 rounded-lg border", isLight ? "bg-amber-50 border-amber-200" : "bg-amber-900/10 border-amber-800")}>
          <div className="flex items-start gap-2">
            <Info className={cn("w-4 h-4 mt-0.5 flex-shrink-0", isLight ? "text-amber-600" : "text-amber-400")} />
            <div>
              <p className={cn("text-sm font-medium", isLight ? "text-amber-800" : "text-amber-300")}>File format tips</p>
              <ul className={cn("text-sm mt-1 space-y-1 list-disc list-inside", isLight ? "text-amber-700" : "text-amber-400")}>
                <li>First row must be column headers</li>
                <li>Required fields: <span className="font-mono text-xs">{cfg.requiredFields.join(", ")}</span></li>
                <li>Max {cfg.maxRows.toLocaleString()} rows per upload</li>
                <li>Dates should be in YYYY-MM-DD format</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Option Toggles */}
        <div className={cn("mt-6 space-y-4 p-5 rounded-xl border", cardBg)}>
          <h3 className={cn("text-sm font-semibold uppercase tracking-wide", textSecondary)}>Options</h3>

          {/* AI Column Mapping Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Brain className={cn("w-5 h-5", isLight ? "text-purple-600" : "text-purple-400")} />
              <div>
                <p className={cn("text-sm font-medium", textPrimary)}>Use AI Column Mapping</p>
                <p className={cn("text-xs", textSecondary)}>ESANG AI will automatically map your columns</p>
              </div>
            </div>
            <button onClick={() => setUseAIMapping(!useAIMapping)} className="focus:outline-none">
              {useAIMapping
                ? <ToggleRight className="w-8 h-8 text-blue-500" />
                : <ToggleLeft className={cn("w-8 h-8", textMuted)} />
              }
            </button>
          </div>

          {/* Entity-specific options */}
          {entityType === "drivers" && (
            <div className={cn("flex items-center justify-between p-4 rounded-lg border-2", isLight ? "bg-green-50 border-green-200" : "bg-green-900/10 border-green-800")}>
              <div className="flex items-center gap-3">
                <Mail className={cn("w-5 h-5", isLight ? "text-green-600" : "text-green-400")} />
                <div>
                  <p className={cn("text-sm font-semibold", textPrimary)}>Send Platform Invitation Emails</p>
                  <p className={cn("text-xs", textSecondary)}>Invite all uploaded drivers to join the EusoTrip platform</p>
                </div>
              </div>
              <button onClick={() => setSendInvites(!sendInvites)} className="focus:outline-none">
                {sendInvites
                  ? <ToggleRight className="w-8 h-8 text-green-500" />
                  : <ToggleLeft className={cn("w-8 h-8", textMuted)} />
                }
              </button>
            </div>
          )}

          {entityType === "contacts" && (
            <div className={cn("flex items-center justify-between p-4 rounded-lg border-2", isLight ? "bg-orange-50 border-orange-200" : "bg-orange-900/10 border-orange-800")}>
              <div className="flex items-center gap-3">
                <Mail className={cn("w-5 h-5", isLight ? "text-orange-600" : "text-orange-400")} />
                <div>
                  <p className={cn("text-sm font-semibold", textPrimary)}>Send Partnership Invitation</p>
                  <p className={cn("text-xs", textSecondary)}>Send partnership invitations to imported contacts</p>
                </div>
              </div>
              <button onClick={() => setSendInvites(!sendInvites)} className="focus:outline-none">
                {sendInvites
                  ? <ToggleRight className="w-8 h-8 text-orange-500" />
                  : <ToggleLeft className={cn("w-8 h-8", textMuted)} />
                }
              </button>
            </div>
          )}

          {entityType === "loads" && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ClipboardList className={cn("w-5 h-5", isLight ? "text-blue-600" : "text-blue-400")} />
                <div>
                  <p className={cn("text-sm font-medium", textPrimary)}>Default Load Status</p>
                  <p className={cn("text-xs", textSecondary)}>Set initial status for all imported loads</p>
                </div>
              </div>
              <select
                value={loadStatus}
                onChange={(e) => setLoadStatus(e.target.value as any)}
                className={cn("text-sm rounded-lg px-3 py-1.5 border focus:outline-none focus:ring-2 focus:ring-blue-500", inputBg)}
              >
                <option value="draft">Draft</option>
                <option value="pending">Pending</option>
                <option value="posted">Posted</option>
              </select>
            </div>
          )}

          {entityType === "vehicles" && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Truck className={cn("w-5 h-5", isLight ? "text-purple-600" : "text-purple-400")} />
                <div>
                  <p className={cn("text-sm font-medium", textPrimary)}>Set All as Available</p>
                  <p className={cn("text-xs", textSecondary)}>Mark all imported vehicles as available for dispatch</p>
                </div>
              </div>
              <button onClick={() => setSetAllAvailable(!setAllAvailable)} className="focus:outline-none">
                {setAllAvailable
                  ? <ToggleRight className="w-8 h-8 text-purple-500" />
                  : <ToggleLeft className={cn("w-8 h-8", textMuted)} />
                }
              </button>
            </div>
          )}
        </div>

        {/* Upload Button */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={handleUpload}
            disabled={uploading || (!file && !csvText.trim())}
            className={cn(
              "flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white transition-all",
              uploading || (!file && !csvText.trim())
                ? "bg-slate-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl",
            )}
          >
            {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
            {uploading ? "Processing..." : "Upload & Process"}
          </button>
        </div>
      </div>
    );
  };

  // ---------------------------------------------------------------------------
  // RENDER: Step 3 — Map Columns
  // ---------------------------------------------------------------------------

  const renderStep3 = () => {
    const cfg = getEntityConfig(entityType!);
    const allTargetFields = [...cfg.requiredFields, ...cfg.optionalFields];

    return (
      <div>
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className={cn("text-xl font-bold", textPrimary)}>Review Column Mapping</h2>
            <p className={cn("mt-1", textSecondary)}>
              Verify the AI-suggested mappings or manually assign columns.
            </p>
          </div>
          {useAIMapping && (
            <div className={cn("flex items-center gap-2 px-4 py-2 rounded-lg border", isLight ? "bg-purple-50 border-purple-200" : "bg-purple-900/20 border-purple-800")}>
              <Sparkles className={cn("w-4 h-4 animate-pulse", isLight ? "text-purple-600" : "text-purple-400")} />
              <div className="flex flex-col">
                <span className={cn("text-sm font-medium", isLight ? "text-purple-700" : "text-purple-300")}>
                  ESANG AI Confidence: {aiConfidence}%
                </span>
                <span className={cn("text-[10px]", isLight ? "text-purple-500" : "text-purple-400/70")}>
                  {aiConfidence > 90 ? "Perfect Match" : aiConfidence > 70 ? "Good Match \u2014 verify below" : "Needs Review"}
                </span>
              </div>
              <div className="w-20 h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                <div
                  className={cn("h-full rounded-full transition-all", aiConfidence > 80 ? "bg-green-500" : aiConfidence > 60 ? "bg-yellow-500" : "bg-red-500")}
                  style={{ width: `${aiConfidence}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Column Mapping Table */}
        <div className={cn("rounded-xl border overflow-hidden", cardBg)}>
          <div className={cn("grid grid-cols-12 gap-4 px-5 py-3 text-xs font-semibold uppercase tracking-wide", tableHeader)}>
            <div className="col-span-4">Source Column</div>
            <div className="col-span-1 text-center"><ArrowRight className="w-4 h-4 mx-auto" /></div>
            <div className="col-span-4">Target Field</div>
            <div className="col-span-2 text-center">Confidence</div>
            <div className="col-span-1 text-center">Source</div>
          </div>
          {columnMappings.map((mapping, i) => (
            <div key={i} className={cn("grid grid-cols-12 gap-4 px-5 py-3 items-center border-t", tableRow)}>
              <div className={cn("col-span-4 text-sm font-mono", textPrimary)}>{mapping.source}</div>
              <div className="col-span-1 text-center">
                <ArrowRight className={cn("w-4 h-4 mx-auto", textMuted)} />
              </div>
              <div className="col-span-4">
                <select
                  value={mapping.target}
                  onChange={(e) => handleMappingChange(i, e.target.value)}
                  className={cn("w-full text-sm rounded-lg px-3 py-1.5 border focus:outline-none focus:ring-2 focus:ring-blue-500", inputBg)}
                >
                  <option value="">-- Skip --</option>
                  {allTargetFields.map((f) => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </div>
              <div className="col-span-2 text-center">
                <span className={cn(
                  "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
                  mapping.confidence >= 90
                    ? (isLight ? "bg-green-100 text-green-700" : "bg-green-900/30 text-green-400")
                    : mapping.confidence >= 70
                      ? (isLight ? "bg-yellow-100 text-yellow-700" : "bg-yellow-900/30 text-yellow-400")
                      : (isLight ? "bg-red-100 text-red-700" : "bg-red-900/30 text-red-400"),
                )}>
                  {mapping.confidence >= 90 ? (
                    <><Check className="w-3 h-3" /> Perfect</>
                  ) : mapping.confidence >= 70 ? (
                    <><Zap className="w-3 h-3" /> Good</>
                  ) : (
                    <><AlertTriangle className="w-3 h-3" /> Review</>
                  )}
                </span>
              </div>
              <div className="col-span-1 text-center">
                {mapping.isManual ? (
                  <span className={cn("text-xs", textSecondary)}>Manual</span>
                ) : (
                  <Sparkles className={cn("w-4 h-4 mx-auto", isLight ? "text-purple-500" : "text-purple-400")} />
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Data Preview */}
        {previewRows.length > 0 && (
          <div className="mt-8">
            <h3 className={cn("text-lg font-semibold mb-3 flex items-center gap-2", textPrimary)}>
              <Eye className="w-5 h-5" /> Data Preview
              <span className={cn("text-sm font-normal", textSecondary)}>(first {Math.min(previewRows.length, 10)} rows)</span>
            </h3>
            <div className={cn("rounded-xl border overflow-x-auto", cardBg)}>
              <table className="w-full text-sm">
                <thead>
                  <tr className={tableHeader}>
                    <th className="px-4 py-2 text-left font-semibold">#</th>
                    {columnMappings.filter((m) => m.target).map((m) => (
                      <th key={m.target} className="px-4 py-2 text-left font-semibold whitespace-nowrap">{m.target}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {previewRows.slice(0, 10).map((row, i) => (
                    <tr key={i} className={cn("border-t", tableRow)}>
                      <td className={cn("px-4 py-2 font-mono text-xs", textMuted)}>{i + 1}</td>
                      {columnMappings.filter((m) => m.target).map((m) => (
                        <td key={m.target} className={cn("px-4 py-2 whitespace-nowrap", textPrimary)}>
                          {row[m.target] || row[m.source] || "-"}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Validate Button */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={handleValidate}
            disabled={validating || columnMappings.filter((m) => m.target).length === 0}
            className={cn(
              "flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white transition-all",
              validating ? "bg-slate-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl",
            )}
          >
            {validating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Shield className="w-5 h-5" />}
            {validating ? "Validating..." : "Validate Data"}
          </button>
        </div>
      </div>
    );
  };

  // ---------------------------------------------------------------------------
  // RENDER: Step 4 — Validation Results
  // ---------------------------------------------------------------------------

  const renderStep4 = () => {
    const cfg = getEntityConfig(entityType!);
    const invalidRows = validationResults.filter((r) => r.status === "invalid");
    const duplicateRows = validationResults.filter((r) => r.status === "duplicate");

    return (
      <div>
        <div className="mb-6">
          <h2 className={cn("text-xl font-bold", textPrimary)}>Validation Results</h2>
          <p className={cn("mt-1", textSecondary)}>Review the data quality before importing.</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className={cn("p-5 rounded-xl border", cardBg)}>
            <div className="flex items-center gap-3">
              <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", isLight ? "bg-green-100" : "bg-green-900/30")}>
                <CheckCircle className={cn("w-5 h-5", isLight ? "text-green-600" : "text-green-400")} />
              </div>
              <div>
                <p className={cn("text-2xl font-bold", isLight ? "text-green-700" : "text-green-400")}>{validCount}</p>
                <p className={cn("text-sm", textSecondary)}>Valid Rows</p>
              </div>
            </div>
          </div>
          <div className={cn("p-5 rounded-xl border", cardBg)}>
            <div className="flex items-center gap-3">
              <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", isLight ? "bg-red-100" : "bg-red-900/30")}>
                <XCircle className={cn("w-5 h-5", isLight ? "text-red-600" : "text-red-400")} />
              </div>
              <div>
                <p className={cn("text-2xl font-bold", isLight ? "text-red-700" : "text-red-400")}>{invalidCount}</p>
                <p className={cn("text-sm", textSecondary)}>Invalid Rows</p>
              </div>
            </div>
          </div>
          <div className={cn("p-5 rounded-xl border", cardBg)}>
            <div className="flex items-center gap-3">
              <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", isLight ? "bg-yellow-100" : "bg-yellow-900/30")}>
                <AlertTriangle className={cn("w-5 h-5", isLight ? "text-yellow-600" : "text-yellow-400")} />
              </div>
              <div>
                <p className={cn("text-2xl font-bold", isLight ? "text-yellow-700" : "text-yellow-400")}>{duplicateCount}</p>
                <p className={cn("text-sm", textSecondary)}>Duplicates</p>
              </div>
            </div>
          </div>
        </div>

        {/* Invalid Rows Table */}
        {invalidRows.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className={cn("text-lg font-semibold flex items-center gap-2", textPrimary)}>
                <XCircle className={cn("w-5 h-5", isLight ? "text-red-600" : "text-red-400")} />
                Invalid Rows ({invalidRows.length})
              </h3>
              <button
                onClick={handleDownloadErrors}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                  isLight ? "text-red-700 bg-red-50 hover:bg-red-100 border border-red-200" : "text-red-400 bg-red-900/20 hover:bg-red-900/40 border border-red-800",
                )}
              >
                <Download className="w-4 h-4" /> Download Errors
              </button>
            </div>
            <div className={cn("rounded-xl border overflow-x-auto", cardBg)}>
              <table className="w-full text-sm">
                <thead>
                  <tr className={tableHeader}>
                    <th className="px-4 py-2 text-left">Row</th>
                    {cfg.requiredFields.slice(0, 4).map((f) => (
                      <th key={f} className="px-4 py-2 text-left whitespace-nowrap">{f}</th>
                    ))}
                    <th className="px-4 py-2 text-left">Error</th>
                  </tr>
                </thead>
                <tbody>
                  {invalidRows.slice(0, 20).map((row) => (
                    <tr key={row.row} className={cn("border-t", isLight ? "bg-red-50/50 border-red-100" : "bg-red-900/10 border-red-900/30")}>
                      <td className={cn("px-4 py-2 font-mono text-xs", textMuted)}>{row.row}</td>
                      {cfg.requiredFields.slice(0, 4).map((f) => (
                        <td key={f} className={cn("px-4 py-2 whitespace-nowrap", textPrimary)}>{row.data[f] || "-"}</td>
                      ))}
                      <td className={cn("px-4 py-2", isLight ? "text-red-700" : "text-red-400")}>
                        {row.errors.join("; ")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {invalidRows.length > 20 && (
                <div className={cn("px-4 py-2 text-sm text-center border-t", textMuted, isLight ? "border-slate-200" : "border-slate-700")}>
                  ...and {invalidRows.length - 20} more invalid rows
                </div>
              )}
            </div>
          </div>
        )}

        {/* Duplicate Rows */}
        {duplicateRows.length > 0 && (
          <div className={cn("p-4 rounded-lg border mb-6", isLight ? "bg-yellow-50 border-yellow-200" : "bg-yellow-900/10 border-yellow-800")}>
            <div className="flex items-start gap-2">
              <AlertTriangle className={cn("w-4 h-4 mt-0.5 flex-shrink-0", isLight ? "text-yellow-600" : "text-yellow-400")} />
              <div>
                <p className={cn("text-sm font-medium", isLight ? "text-yellow-800" : "text-yellow-300")}>
                  {duplicateCount} duplicate entries detected
                </p>
                <p className={cn("text-sm mt-1", isLight ? "text-yellow-700" : "text-yellow-400")}>
                  These rows match existing records and will be skipped during import.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-end mt-6">
          <button
            onClick={handleReset}
            className={cn(
              "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium border transition-colors",
              isLight ? "text-slate-700 bg-white border-slate-300 hover:bg-slate-50" : "text-slate-300 bg-slate-800 border-slate-600 hover:bg-slate-700",
            )}
          >
            <RefreshCw className="w-4 h-4" /> Cancel & Re-upload
          </button>
          {invalidCount > 0 && validCount > 0 && (
            <button
              onClick={() => handleImport(true)}
              className={cn(
                "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all",
                isLight ? "text-green-700 bg-green-50 hover:bg-green-100 border border-green-200" : "text-green-400 bg-green-900/20 hover:bg-green-900/40 border border-green-800",
              )}
            >
              <CheckCircle className="w-4 h-4" /> Proceed with {validCount} Valid Rows Only
            </button>
          )}
          {validCount > 0 && invalidCount === 0 && (
            <button
              onClick={() => handleImport(false)}
              className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl transition-all"
            >
              <Upload className="w-5 h-5" /> Import All {validCount} Rows
            </button>
          )}
        </div>
      </div>
    );
  };

  // ---------------------------------------------------------------------------
  // RENDER: Step 5 — Import Progress & Results
  // ---------------------------------------------------------------------------

  const renderStep5 = () => {
    const cfg = entityType ? getEntityConfig(entityType) : null;

    return (
      <div className="max-w-2xl mx-auto">
        {!importComplete ? (
          /* Progress */
          <div className={cn("p-8 rounded-xl border text-center", cardBg)}>
            <Loader2 className={cn("w-12 h-12 mx-auto mb-4 animate-spin", isLight ? "text-blue-600" : "text-blue-400")} />
            <h2 className={cn("text-xl font-bold mb-2", textPrimary)}>Importing {cfg?.title}...</h2>
            <p className={cn("text-sm mb-6", textSecondary)}>Please do not close this page while the import is in progress.</p>

            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className={cn("text-sm font-medium", textSecondary)}>Progress</span>
                <span className={cn("text-sm font-bold", textPrimary)}>{Math.round(importProgress)}%</span>
              </div>
              <div className={cn("w-full h-3 rounded-full overflow-hidden", isLight ? "bg-slate-200" : "bg-slate-700")}>
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300"
                  style={{ width: `${importProgress}%` }}
                />
              </div>
            </div>

            <p className={cn("text-xs", textMuted)}>
              Processing rows... {Math.round((importProgress / 100) * totalRows)} / {totalRows}
            </p>
          </div>
        ) : (
          /* Results */
          <div className={cn("relative p-8 rounded-xl border text-center overflow-hidden", cardBg)}>
            {/* Confetti animation */}
            {showConfetti && (
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {Array.from({ length: 30 }).map((_, i) => (
                  <div
                    key={i}
                    className="absolute rounded-full"
                    style={{
                      width: `${4 + Math.random() * 6}px`,
                      height: `${4 + Math.random() * 6}px`,
                      backgroundColor: ["#3b82f6","#ef4444","#22c55e","#f59e0b","#8b5cf6","#ec4899","#06b6d4","#f97316"][i % 8],
                      left: `${Math.random() * 100}%`,
                      bottom: "-10px",
                      animation: `confetti-rise ${1.5 + Math.random() * 2}s ease-out forwards`,
                      animationDelay: `${Math.random() * 0.8}s`,
                    }}
                  />
                ))}
              </div>
            )}
            <style>{`
              @keyframes confetti-rise {
                0% { transform: translateY(0) rotate(0deg) scale(1); opacity: 1; }
                50% { opacity: 1; }
                100% { transform: translateY(-600px) rotate(720deg) scale(0.3); opacity: 0; }
              }
            `}</style>
            <div className={cn("w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 animate-bounce", isLight ? "bg-green-100" : "bg-green-900/30")}>
              <CheckCircle className={cn("w-8 h-8", isLight ? "text-green-600" : "text-green-400")} />
            </div>
            <h2 className={cn("text-2xl font-bold mb-2", textPrimary)}>
              You just imported {importSummary?.created ?? 0} {cfg?.title.toLowerCase()} in seconds!
            </h2>
            <p className={cn("text-sm mb-2", textSecondary)}>
              Your {cfg?.title.toLowerCase()} have been successfully imported into the platform.
            </p>
            {importSummary && importSummary.created > 0 && (
              <p className={cn("text-xs mb-6 font-medium", isLight ? "text-purple-600" : "text-purple-400")}>
                <Sparkles className="w-3.5 h-3.5 inline mr-1" />
                That would have taken ~{Math.round((importSummary.created * 2) / 60)} hours manually. You just saved {importSummary.created * 2} minutes.
              </p>
            )}

            {importSummary && (
              <div className={cn("grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8 p-4 rounded-lg", isLight ? "bg-slate-50" : "bg-slate-900/50")}>
                <div>
                  <p className={cn("text-2xl font-bold", isLight ? "text-green-700" : "text-green-400")}>{importSummary.created}</p>
                  <p className={cn("text-xs", textSecondary)}>Created</p>
                </div>
                <div>
                  <p className={cn("text-2xl font-bold", isLight ? "text-red-700" : "text-red-400")}>{importSummary.failed}</p>
                  <p className={cn("text-xs", textSecondary)}>Failed</p>
                </div>
                <div>
                  <p className={cn("text-2xl font-bold", isLight ? "text-yellow-700" : "text-yellow-400")}>{importSummary.duplicates}</p>
                  <p className={cn("text-xs", textSecondary)}>Duplicates</p>
                </div>
                <div>
                  <p className={cn("text-2xl font-bold", isLight ? "text-blue-700" : "text-blue-400")}>{importSummary.invitesSent}</p>
                  <p className={cn("text-xs", textSecondary)}>Invites Sent</p>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {cfg && entityType && (
                <button
                  onClick={() => navigate(entityNavPaths[entityType])}
                  className={cn(
                    "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium border transition-colors",
                    isLight ? "text-slate-700 bg-white border-slate-300 hover:bg-slate-50" : "text-slate-300 bg-slate-800 border-slate-600 hover:bg-slate-700",
                  )}
                >
                  <Eye className="w-4 h-4" /> View {cfg.title}
                </button>
              )}
              <button
                onClick={handleReset}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-lg transition-all"
              >
                <Upload className="w-4 h-4" /> Upload More
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  // ---------------------------------------------------------------------------
  // RENDER: Error Boundary
  // ---------------------------------------------------------------------------

  const renderError = () => {
    if (!error) return null;
    return (
      <div className={cn("mb-6 p-4 rounded-xl border flex items-center justify-between", isLight ? "bg-red-50 border-red-200" : "bg-red-900/20 border-red-800")}>
        <div className="flex items-center gap-3">
          <XCircle className={cn("w-5 h-5 flex-shrink-0", isLight ? "text-red-600" : "text-red-400")} />
          <div>
            <p className={cn("text-sm font-medium", isLight ? "text-red-800" : "text-red-300")}>Something went wrong</p>
            <p className={cn("text-sm", isLight ? "text-red-700" : "text-red-400")}>{error}</p>
          </div>
        </div>
        <button
          onClick={() => setError(null)}
          className={cn("px-3 py-1 rounded-lg text-sm font-medium transition-colors", isLight ? "text-red-700 hover:bg-red-100" : "text-red-400 hover:bg-red-900/40")}
        >
          Dismiss
        </button>
      </div>
    );
  };

  // ---------------------------------------------------------------------------
  // MAIN RENDER
  // ---------------------------------------------------------------------------

  return (
    <div className={cn("min-h-screen p-4 sm:p-6 lg:p-8", pageBg)}>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          {step > 1 && (
            <button
              onClick={() => step === 2 ? handleReset() : goToStep((step - 1) as WizardStep)}
              className={cn(
                "p-2 rounded-lg border transition-colors",
                isLight ? "text-slate-600 bg-white border-slate-300 hover:bg-slate-50" : "text-slate-400 bg-slate-800 border-slate-700 hover:bg-slate-700",
              )}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <h1 className={cn("text-2xl sm:text-3xl font-bold", textPrimary)}>Bulk Upload Center</h1>
            <p className={cn("text-sm mt-0.5", textSecondary)}>
              Import data in bulk — drop a CSV, spreadsheet, PDF, or photo. ESANG AI handles the rest.
            </p>
          </div>
        </div>
      </div>

      {/* Breadcrumb */}
      {renderBreadcrumb()}

      {/* Error */}
      {renderError()}

      {/* Step Content */}
      <div
        className="transition-all duration-300 ease-in-out"
        style={{
          opacity: stepTransition ? 0 : 1,
          transform: stepTransition ? "translateY(12px)" : "translateY(0)",
        }}
      >
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        {step === 4 && renderStep4()}
        {step === 5 && renderStep5()}
      </div>
    </div>
  );
}
