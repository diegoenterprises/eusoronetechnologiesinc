import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Layers, ChevronDown, ChevronRight, DollarSign, CheckCircle,
  Clock, AlertTriangle, CreditCard, FileText, Plus, RefreshCw,
  Truck, User, Building, Filter, Download, X, Sparkles,
} from "lucide-react";

const STATUS_CONFIG: Record<string, { color: string; label: string; icon: any }> = {
  draft: { color: "bg-slate-500/20 text-slate-400", label: "Draft", icon: FileText },
  pending_approval: { color: "bg-yellow-500/20 text-yellow-400", label: "Pending Approval", icon: Clock },
  approved: { color: "bg-green-500/20 text-green-400", label: "Approved", icon: CheckCircle },
  processing: { color: "bg-blue-500/20 text-blue-400", label: "Processing", icon: RefreshCw },
  paid: { color: "bg-emerald-500/20 text-emerald-400", label: "Paid", icon: DollarSign },
  failed: { color: "bg-red-500/20 text-red-400", label: "Failed", icon: AlertTriangle },
  disputed: { color: "bg-orange-500/20 text-orange-400", label: "Disputed", icon: AlertTriangle },
};

const TYPE_CONFIG: Record<string, { color: string; label: string; icon: any }> = {
  shipper_payable: { color: "bg-purple-500/20 text-purple-400", label: "Shipper Payable", icon: Building },
  carrier_receivable: { color: "bg-cyan-500/20 text-cyan-400", label: "Carrier Receivable", icon: Truck },
  driver_payable: { color: "bg-amber-500/20 text-amber-400", label: "Driver Payable", icon: User },
};

export default function SettlementBatching() {
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [expandedBatch, setExpandedBatch] = useState<number | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  // Create batch form state
  const [createType, setCreateType] = useState<string>("carrier_receivable");
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [loadIdsText, setLoadIdsText] = useState("");

  const utils = (trpc as any).useUtils?.() || (trpc as any).useContext?.();

  // Queries
  const batchesQuery = (trpc as any).settlementBatching.getBatches.useQuery(
    {
      ...(statusFilter ? { status: statusFilter } : {}),
      ...(typeFilter ? { batchType: typeFilter } : {}),
    },
    { refetchInterval: 30000 }
  );
  const batches: any[] = batchesQuery.data?.batches || [];

  // Expanded batch detail
  const detailQuery = (trpc as any).settlementBatching.getBatchDetail.useQuery(
    { batchId: expandedBatch! },
    { enabled: !!expandedBatch }
  );
  const detail = detailQuery.data as any;

  // Mutations
  const createMut = (trpc as any).settlementBatching.createBatch.useMutation({
    onSuccess: (data: any) => {
      toast.success(`Batch ${data.batchNumber} created — ${data.totalLoads} loads, $${data.totalAmount.toLocaleString()}`);
      setShowCreate(false);
      setPeriodStart(""); setPeriodEnd(""); setLoadIdsText("");
      batchesQuery.refetch();
    },
    onError: (e: any) => toast.error(e.message || "Failed to create batch"),
  });

  const approveMut = (trpc as any).settlementBatching.approveBatch.useMutation({
    onSuccess: () => { toast.success("Batch approved"); batchesQuery.refetch(); },
    onError: (e: any) => toast.error(e.message || "Approval failed"),
  });

  const payMut = (trpc as any).settlementBatching.processBatchPayment.useMutation({
    onSuccess: (data: any) => { toast.success(`Payment processed — ${data.transactionId}`); batchesQuery.refetch(); },
    onError: (e: any) => toast.error(e.message || "Payment failed"),
  });

  const removeMut = (trpc as any).settlementBatching.removeFromBatch.useMutation({
    onSuccess: () => { toast.success("Item removed"); detailQuery.refetch(); batchesQuery.refetch(); },
    onError: (e: any) => toast.error(e.message),
  });

  const autoBatchMut = (trpc as any).settlementBatching.autoBatch.useMutation({
    onSuccess: (data: any) => {
      if (data.batchesCreated > 0) {
        toast.success(`Auto-batch: ${data.batchesCreated} batches created — ${data.totalLoads} loads`);
      } else {
        toast.info("No unbatched settlements found");
      }
      batchesQuery.refetch();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const handleCreate = () => {
    if (!periodStart || !periodEnd) return toast.error("Select date range");
    const ids = loadIdsText.split(/[,\s]+/).map(Number).filter(n => n > 0);
    if (ids.length === 0) return toast.error("Enter at least one load ID");
    createMut.mutate({
      batchType: createType,
      periodStart,
      periodEnd,
      loadIds: ids,
    });
  };

  const fmt = (v: any) => {
    const n = Number(v);
    return isNaN(n) ? "$0.00" : `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-slate-950 text-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06] bg-slate-900/50 shrink-0">
        <div className="flex items-center gap-3">
          <Layers className="w-5 h-5 text-emerald-400" />
          <h1 className="text-lg font-bold">Settlement Batching</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs text-purple-400 hover:text-purple-300"
            onClick={() => autoBatchMut.mutate()}
            disabled={autoBatchMut.isPending}
          >
            <Sparkles className="w-3.5 h-3.5 mr-1" />Auto-Batch
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs text-slate-400"
            onClick={() => batchesQuery.refetch()}
          >
            <RefreshCw className={cn("w-3.5 h-3.5 mr-1", batchesQuery.isFetching && "animate-spin")} />
            Refresh
          </Button>
          <Button
            size="sm"
            className="h-7 px-3 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={() => setShowCreate(!showCreate)}
          >
            <Plus className="w-3.5 h-3.5 mr-1" />Create Batch
          </Button>
        </div>
      </div>

      {/* Create Batch Panel */}
      {showCreate && (
        <div className="px-4 py-3 border-b border-white/[0.06] bg-slate-900/80 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">New Settlement Batch</h3>
            <button className="text-slate-500 hover:text-white" onClick={() => setShowCreate(false)}>
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-4 gap-3">
            <div>
              <label className="text-[10px] text-slate-500 uppercase mb-1 block">Batch Type</label>
              <select
                value={createType}
                onChange={e => setCreateType(e.target.value)}
                className="w-full h-8 text-xs bg-white/[0.04] border border-white/[0.08] rounded-md px-2 text-white"
              >
                <option value="shipper_payable">Shipper Payable</option>
                <option value="carrier_receivable">Carrier Receivable</option>
                <option value="driver_payable">Driver Payable</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] text-slate-500 uppercase mb-1 block">Period Start</label>
              <Input
                type="date"
                value={periodStart}
                onChange={e => setPeriodStart(e.target.value)}
                className="h-8 text-xs bg-white/[0.04] border-white/[0.08] text-white"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-500 uppercase mb-1 block">Period End</label>
              <Input
                type="date"
                value={periodEnd}
                onChange={e => setPeriodEnd(e.target.value)}
                className="h-8 text-xs bg-white/[0.04] border-white/[0.08] text-white"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-500 uppercase mb-1 block">Load IDs (comma-separated)</label>
              <div className="flex gap-2">
                <Input
                  value={loadIdsText}
                  onChange={e => setLoadIdsText(e.target.value)}
                  placeholder="1, 2, 3..."
                  className="h-8 text-xs bg-white/[0.04] border-white/[0.08] text-white flex-1"
                />
                <Button
                  size="sm"
                  className="h-8 px-3 text-xs bg-emerald-600 hover:bg-emerald-700"
                  onClick={handleCreate}
                  disabled={createMut.isPending}
                >
                  {createMut.isPending ? "Creating..." : "Create"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-white/[0.06] bg-slate-900/30">
        <Filter className="w-3.5 h-3.5 text-slate-500" />
        <span className="text-[10px] text-slate-500 mr-1">Status:</span>
        {["", "draft", "pending_approval", "approved", "processing", "paid", "failed"].map(s => (
          <button
            key={s}
            className={cn(
              "text-[10px] px-2 py-0.5 rounded border transition-all",
              statusFilter === s ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400" : "border-white/[0.06] text-slate-400 hover:bg-white/[0.04]"
            )}
            onClick={() => setStatusFilter(s)}
          >
            {s || "All"}
          </button>
        ))}
        <span className="text-white/[0.06] mx-1">|</span>
        <span className="text-[10px] text-slate-500 mr-1">Type:</span>
        {["", "shipper_payable", "carrier_receivable", "driver_payable"].map(t => (
          <button
            key={t}
            className={cn(
              "text-[10px] px-2 py-0.5 rounded border transition-all capitalize",
              typeFilter === t ? "border-cyan-500/50 bg-cyan-500/10 text-cyan-400" : "border-white/[0.06] text-slate-400 hover:bg-white/[0.04]"
            )}
            onClick={() => setTypeFilter(t)}
          >
            {t ? t.replace(/_/g, " ") : "All"}
          </button>
        ))}
        <span className="ml-auto text-[10px] text-slate-500">
          {batches.length} batch{batches.length !== 1 ? "es" : ""}
        </span>
      </div>

      {/* Batch List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {batchesQuery.isLoading ? (
          <div className="flex items-center justify-center py-20 text-slate-500 text-sm">Loading batches...</div>
        ) : batches.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500 text-sm">
            <Layers className="w-10 h-10 mb-3 opacity-30" />
            No settlement batches found
            <p className="text-xs mt-1 text-slate-600">Create a batch or run Auto-Batch to get started</p>
          </div>
        ) : (
          batches.map((b: any) => {
            const sc = STATUS_CONFIG[b.status] || STATUS_CONFIG.draft;
            const tc = TYPE_CONFIG[b.batchType] || TYPE_CONFIG.carrier_receivable;
            const StatusIcon = sc.icon;
            const TypeIcon = tc.icon;
            const isExpanded = expandedBatch === b.id;

            return (
              <Card key={b.id} className="bg-white/[0.02] border-white/[0.06] overflow-hidden">
                {/* Batch row */}
                <div
                  className="flex items-center gap-4 px-4 py-3 cursor-pointer hover:bg-white/[0.02] transition-colors"
                  onClick={() => setExpandedBatch(isExpanded ? null : b.id)}
                >
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />
                  )}

                  {/* Batch number */}
                  <div className="w-40 shrink-0">
                    <div className="text-sm font-semibold text-white">{b.batchNumber}</div>
                    <div className="text-[10px] text-slate-500">
                      {b.periodStart} → {b.periodEnd}
                    </div>
                  </div>

                  {/* Type */}
                  <Badge className={cn("text-[10px] border-0 gap-1 shrink-0", tc.color)}>
                    <TypeIcon className="w-3 h-3" />{tc.label}
                  </Badge>

                  {/* Loads */}
                  <div className="text-center w-16 shrink-0">
                    <div className="text-sm font-medium text-white">{b.totalLoads}</div>
                    <div className="text-[10px] text-slate-500">loads</div>
                  </div>

                  {/* Amounts */}
                  <div className="flex-1 grid grid-cols-4 gap-2 text-center">
                    <div>
                      <div className="text-[10px] text-slate-500">Subtotal</div>
                      <div className="text-xs text-slate-300">{fmt(b.subtotalAmount)}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-500">FSC</div>
                      <div className="text-xs text-slate-300">{fmt(b.fscAmount)}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-500">Accessorial</div>
                      <div className="text-xs text-slate-300">{fmt(b.accessorialAmount)}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-500">Deductions</div>
                      <div className="text-xs text-red-400">{fmt(b.deductionAmount)}</div>
                    </div>
                  </div>

                  {/* Total */}
                  <div className="w-28 text-right shrink-0">
                    <div className="text-sm font-bold text-emerald-400">{fmt(b.totalAmount)}</div>
                    <div className="text-[10px] text-slate-500">total</div>
                  </div>

                  {/* Status */}
                  <Badge className={cn("text-[10px] border-0 gap-1 shrink-0 w-32 justify-center", sc.color)}>
                    <StatusIcon className="w-3 h-3" />{sc.label}
                  </Badge>

                  {/* Actions */}
                  <div className="flex gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                    {(b.status === "draft" || b.status === "pending_approval") && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-[10px] text-green-400 hover:text-green-300"
                        onClick={() => approveMut.mutate({ batchId: b.id })}
                        disabled={approveMut.isPending}
                      >
                        <CheckCircle className="w-3 h-3 mr-0.5" />Approve
                      </Button>
                    )}
                    {b.status === "approved" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-[10px] text-blue-400 hover:text-blue-300"
                        onClick={() => payMut.mutate({ batchId: b.id })}
                        disabled={payMut.isPending}
                      >
                        <CreditCard className="w-3 h-3 mr-0.5" />Pay
                      </Button>
                    )}
                  </div>
                </div>

                {/* Expanded items */}
                {isExpanded && (
                  <div className="border-t border-white/[0.04] bg-white/[0.01]">
                    {detailQuery.isLoading ? (
                      <div className="py-6 text-center text-slate-500 text-xs">Loading items...</div>
                    ) : !detail?.items?.length ? (
                      <div className="py-6 text-center text-slate-500 text-xs">No items in this batch</div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="text-[10px] text-slate-500 uppercase border-b border-white/[0.04]">
                              <th className="px-4 py-2 text-left">Load #</th>
                              <th className="px-3 py-2 text-left">Pickup</th>
                              <th className="px-3 py-2 text-left">Delivery</th>
                              <th className="px-3 py-2 text-right">Line Amount</th>
                              <th className="px-3 py-2 text-right">FSC</th>
                              <th className="px-3 py-2 text-right">Accessorial</th>
                              <th className="px-3 py-2 text-right">Deductions</th>
                              <th className="px-3 py-2 text-right">Net Amount</th>
                              {b.status === "draft" && <th className="px-3 py-2 text-center">Actions</th>}
                            </tr>
                          </thead>
                          <tbody>
                            {detail.items.map((item: any) => (
                              <tr key={item.id} className="border-b border-white/[0.02] hover:bg-white/[0.02]">
                                <td className="px-4 py-2 font-medium text-white">{item.loadNumber || `#${item.loadId}`}</td>
                                <td className="px-3 py-2 text-slate-400">{item.pickupDate || "—"}</td>
                                <td className="px-3 py-2 text-slate-400">{item.deliveryDate || "—"}</td>
                                <td className="px-3 py-2 text-right text-slate-300">{fmt(item.lineAmount)}</td>
                                <td className="px-3 py-2 text-right text-slate-300">{fmt(item.fscAmount)}</td>
                                <td className="px-3 py-2 text-right text-slate-300">{fmt(item.accessorialAmount)}</td>
                                <td className="px-3 py-2 text-right text-red-400">{fmt(item.deductions)}</td>
                                <td className="px-3 py-2 text-right font-medium text-emerald-400">{fmt(item.netAmount)}</td>
                                {b.status === "draft" && (
                                  <td className="px-3 py-2 text-center">
                                    <button
                                      className="text-red-400 hover:text-red-300 text-[10px]"
                                      onClick={() => removeMut.mutate({ batchId: b.id, settlementId: item.settlementId })}
                                    >
                                      <X className="w-3 h-3 inline" /> Remove
                                    </button>
                                  </td>
                                )}
                              </tr>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr className="border-t border-white/[0.06] font-semibold">
                              <td className="px-4 py-2 text-white" colSpan={3}>Totals ({detail.items.length} items)</td>
                              <td className="px-3 py-2 text-right text-white">{fmt(detail.batch?.subtotalAmount)}</td>
                              <td className="px-3 py-2 text-right text-white">{fmt(detail.batch?.fscAmount)}</td>
                              <td className="px-3 py-2 text-right text-white">{fmt(detail.batch?.accessorialAmount)}</td>
                              <td className="px-3 py-2 text-right text-red-400">{fmt(detail.batch?.deductionAmount)}</td>
                              <td className="px-3 py-2 text-right text-emerald-400 text-sm">{fmt(detail.batch?.totalAmount)}</td>
                              {b.status === "draft" && <td />}
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    )}

                    {/* Batch footer info */}
                    <div className="flex items-center justify-between px-4 py-2 border-t border-white/[0.04] text-[10px] text-slate-500">
                      <div className="flex gap-4">
                        {b.approvedBy && <span>Approved by user #{b.approvedBy}</span>}
                        {b.approvedAt && <span>at {new Date(b.approvedAt).toLocaleString()}</span>}
                        {b.paidAt && <span className="text-emerald-400">Paid {new Date(b.paidAt).toLocaleString()}</span>}
                        {b.stripePaymentId && <span>Stripe: {b.stripePaymentId}</span>}
                      </div>
                      <span>Created {new Date(b.createdAt).toLocaleString()}</span>
                    </div>
                  </div>
                )}
              </Card>
            );
          })
        )}
      </div>

      {/* Summary bar */}
      <div className="flex items-center justify-between px-4 py-2 border-t border-white/[0.06] bg-slate-900/50 text-xs shrink-0">
        <div className="flex gap-4 text-slate-400">
          <span>
            <span className="text-white font-medium">{batches.filter((b: any) => b.status === "draft").length}</span> draft
          </span>
          <span>
            <span className="text-yellow-400 font-medium">{batches.filter((b: any) => b.status === "pending_approval").length}</span> pending
          </span>
          <span>
            <span className="text-green-400 font-medium">{batches.filter((b: any) => b.status === "approved").length}</span> approved
          </span>
          <span>
            <span className="text-emerald-400 font-medium">{batches.filter((b: any) => b.status === "paid").length}</span> paid
          </span>
        </div>
        <div className="text-slate-400">
          Total value: <span className="text-emerald-400 font-semibold">
            {fmt(batches.reduce((sum: number, b: any) => sum + (Number(b.totalAmount) || 0), 0))}
          </span>
        </div>
      </div>
    </div>
  );
}
