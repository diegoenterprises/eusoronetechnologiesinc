/**
 * CUSTOMER PORTAL & CRM PAGE
 * Comprehensive customer management hub with self-service portal,
 * CRM, onboarding, rate management, contracts, shipment visibility,
 * claims, scorecard, communications, feedback, and document sharing.
 */

import { useState, useMemo } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useTheme } from "@/contexts/ThemeContext";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  LayoutDashboard,
  Users,
  ClipboardCheck,
  DollarSign,
  FileText,
  Truck,
  BarChart3,
  Trophy,
  AlertTriangle,
  MessageSquare,
  Star,
  FolderOpen,
  FileBarChart,
  Code,
  ShoppingCart,
  Receipt,
  Search,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle2,
  XCircle,
  ChevronRight,
  ArrowUpRight,
  Package,
  Target,
  Send,
  Plus,
  Filter,
} from "lucide-react";

// ─── Tab Definitions ─────────────────────────────────────────────────────────

type TabId =
  | "dashboard"
  | "directory"
  | "onboarding"
  | "rates"
  | "contracts"
  | "shipments"
  | "claims"
  | "scorecard"
  | "communications"
  | "feedback"
  | "documents"
  | "billing";

interface TabDef {
  id: TabId;
  label: string;
  icon: React.ReactNode;
}

const TABS: TabDef[] = [
  { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard size={16} /> },
  { id: "directory", label: "Directory", icon: <Users size={16} /> },
  { id: "onboarding", label: "Onboarding", icon: <ClipboardCheck size={16} /> },
  { id: "rates", label: "Rates", icon: <DollarSign size={16} /> },
  { id: "contracts", label: "Contracts", icon: <FileText size={16} /> },
  { id: "shipments", label: "Shipments", icon: <Truck size={16} /> },
  { id: "claims", label: "Claims", icon: <AlertTriangle size={16} /> },
  { id: "scorecard", label: "Scorecard", icon: <Trophy size={16} /> },
  { id: "communications", label: "Comms", icon: <MessageSquare size={16} /> },
  { id: "feedback", label: "Feedback", icon: <Star size={16} /> },
  { id: "documents", label: "Documents", icon: <FolderOpen size={16} /> },
  { id: "billing", label: "Billing", icon: <Receipt size={16} /> },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatCurrency(n: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

function formatNumber(n: number): string {
  return new Intl.NumberFormat("en-US").format(n);
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    active: "border-emerald-600 text-emerald-400 bg-emerald-600/10",
    delivered: "border-emerald-600 text-emerald-400 bg-emerald-600/10",
    in_transit: "border-teal-600 text-teal-400 bg-teal-600/10",
    assigned: "border-blue-600 text-blue-400 bg-blue-600/10",
    pending: "border-yellow-600 text-yellow-400 bg-yellow-600/10",
    open: "border-amber-600 text-amber-400 bg-amber-600/10",
    in_review: "border-purple-600 text-purple-400 bg-purple-600/10",
    resolved: "border-emerald-600 text-emerald-400 bg-emerald-600/10",
    denied: "border-red-600 text-red-400 bg-red-600/10",
    overdue: "border-red-600 text-red-400 bg-red-600/10",
    paid: "border-emerald-600 text-emerald-400 bg-emerald-600/10",
    expired: "border-gray-600 text-slate-400 bg-gray-600/10",
    draft: "border-gray-600 text-slate-400 bg-gray-600/10",
    met: "border-emerald-600 text-emerald-400 bg-emerald-600/10",
    warning: "border-yellow-600 text-yellow-400 bg-yellow-600/10",
    missed: "border-red-600 text-red-400 bg-red-600/10",
  };
  const cls = colors[status] || "border-gray-600 text-slate-400 bg-gray-600/10";
  return (
    <Badge variant="outline" className={cls + " capitalize text-xs"}>
      {status.replace(/_/g, " ")}
    </Badge>
  );
}

// ─── KPI Card ────────────────────────────────────────────────────────────────

function KPICard({ label, value, icon, trend, subtitle, isLight }: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: "up" | "down" | "neutral";
  subtitle?: string;
  isLight?: boolean;
}) {
  return (
    <Card className={isLight ? "bg-white border-slate-200 shadow-sm p-5 hover:border-teal-400/50 transition-colors" : "bg-gray-900/80 border-gray-700/50 p-5 hover:border-teal-700/50 transition-colors"}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className={`text-xs uppercase tracking-wider ${isLight ? "text-slate-500" : "text-slate-400"}`}>{label}</p>
          <p className={`text-2xl font-bold ${isLight ? "text-slate-900" : "text-white"}`}>{value}</p>
          {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
        </div>
        <div className={`p-2.5 rounded-lg ${isLight ? "bg-teal-50" : "bg-teal-600/15"}`}>
          <span className={isLight ? "text-teal-600" : "text-teal-400"}>{icon}</span>
        </div>
      </div>
      {trend && (
        <div className="mt-3 flex items-center gap-1">
          {trend === "up" && <TrendingUp size={12} className="text-emerald-400" />}
          {trend === "down" && <TrendingDown size={12} className="text-red-400" />}
          <span className={`text-xs ${trend === "up" ? "text-emerald-400" : trend === "down" ? "text-red-400" : "text-slate-400"}`}>
            {trend === "up" ? "Improving" : trend === "down" ? "Declining" : "Stable"}
          </span>
        </div>
      )}
    </Card>
  );
}

// ─── Section Wrapper ─────────────────────────────────────────────────────────

function Section({ title, description, children, action, isLight }: {
  title: string;
  description?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  isLight?: boolean;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`text-lg font-semibold ${isLight ? "text-slate-900" : "text-white"}`}>{title}</h2>
          {description && <p className={`text-sm ${isLight ? "text-slate-500" : "text-slate-400"}`}>{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

// ─── Dashboard Tab ───────────────────────────────────────────────────────────

function DashboardTab({ customerId }: { customerId?: string }) {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const dashQ = trpc.customerPortal.getCustomerDashboard.useQuery(
    customerId ? { customerId } : undefined
  );

  if (dashQ.isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i: number) => <Skeleton key={i} className={isLight ? "h-28 bg-slate-100" : "h-28 bg-gray-800"} />)}
        </div>
      </div>
    );
  }

  const d = dashQ.data || {
    activeShipments: 0, deliveredLast90Days: 0, totalSpend: 0,
    onTimeDeliveryRate: 0, openClaims: 0, pendingInvoices: 0,
    npsScore: 0, avgTransitTime: 0,
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard label="Active Shipments" value={formatNumber(d.activeShipments)} icon={<Truck size={20} />} trend="neutral" />
        <KPICard label="Delivered (90d)" value={formatNumber(d.deliveredLast90Days)} icon={<Package size={20} />} trend="up" />
        <KPICard label="Total Spend" value={formatCurrency(d.totalSpend)} icon={<DollarSign size={20} />} />
        <KPICard label="On-Time Rate" value={`${d.onTimeDeliveryRate}%`} icon={<Target size={20} />} trend={d.onTimeDeliveryRate >= 95 ? "up" : "down"} />
        <KPICard label="Open Claims" value={d.openClaims} icon={<AlertTriangle size={20} />} />
        <KPICard label="Pending Invoices" value={d.pendingInvoices} icon={<Receipt size={20} />} />
        <KPICard label="NPS Score" value={d.npsScore} icon={<Star size={20} />} trend={d.npsScore >= 70 ? "up" : "down"} />
        <KPICard label="Avg Transit" value={`${d.avgTransitTime} days`} icon={<Clock size={20} />} />
      </div>
    </div>
  );
}

// ─── Directory Tab ───────────────────────────────────────────────────────────

function DirectoryTab({ onSelectCustomer }: { onSelectCustomer: (id: string) => void }) {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const [search, setSearch] = useState("");

  // Uses the existing portal token list as the "directory" of customers
  const tokensQ = trpc.customerPortal.listPortalAccess.useQuery();

  const tokens = useMemo(() => {
    const list = tokensQ.data?.tokens || [];
    if (!search) return list;
    const q = search.toLowerCase();
    return list.filter((t: any) =>
      (t.customerName || "").toLowerCase().includes(q) ||
      (t.customerEmail || "").toLowerCase().includes(q)
    );
  }, [tokensQ.data, search]);

  return (
    <Section title="Customer Directory" description="Search and manage customer accounts">
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
          <Input
            placeholder="Search customers..."
            value={search}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
            className={isLight ? "pl-10 bg-white border-slate-200 text-slate-900 placeholder:text-slate-400" : "pl-10 bg-gray-800/50 border-gray-700 text-white placeholder:text-slate-500"}
          />
        </div>
        <Button variant="outline" className={isLight ? "border-slate-200 text-slate-600 hover:bg-slate-100" : "border-gray-600 text-slate-300 hover:bg-gray-700"}>
          <Filter size={16} className="mr-2" /> Filter
        </Button>
      </div>

      {tokensQ.isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i: number) => <Skeleton key={i} className={isLight ? "h-20 bg-slate-100" : "h-20 bg-gray-800"} />)}
        </div>
      ) : tokens.length === 0 ? (
        <Card className={isLight ? "bg-white border-slate-200 shadow-sm p-12 text-center" : "bg-gray-900/80 border-gray-700/50 p-12 text-center"}>
          <Users className="mx-auto mb-3 text-slate-500" size={40} />
          <p className="text-slate-400">No customers found</p>
          <p className="text-sm text-slate-500 mt-1">Create portal access tokens to add customers</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {tokens.map((t: any) => (
            <Card
              key={t.tokenId}
              className={isLight ? "bg-white border-slate-200 shadow-sm p-4 hover:border-teal-400/50 transition-colors cursor-pointer" : "bg-gray-900/80 border-gray-700/50 p-4 hover:border-teal-700/50 transition-colors cursor-pointer"}
              onClick={() => onSelectCustomer(String(t.tokenId))}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-teal-600/20 flex items-center justify-center">
                    <Building2 className="text-teal-400" size={18} />
                  </div>
                  <div>
                    <p className={`font-medium ${isLight ? "text-slate-900" : "text-white"}`}>{t.customerName}</p>
                    <p className="text-xs text-slate-400">{t.customerEmail || "No email"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm text-slate-300">{t.loadCount} loads</p>
                    <p className="text-xs text-slate-500">
                      {t.lastAccessAt ? `Last: ${new Date(t.lastAccessAt).toLocaleDateString()}` : "Never accessed"}
                    </p>
                  </div>
                  <StatusBadge status={t.isActive ? "active" : "expired"} />
                  <ChevronRight size={16} className="text-slate-500" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </Section>
  );
}

// ─── Onboarding Tab ──────────────────────────────────────────────────────────

function OnboardingTab({ customerId }: { customerId: string }) {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const obQ = trpc.customerPortal.getCustomerOnboarding.useQuery({ customerId });
  const completeMut = trpc.customerPortal.completeOnboardingStep.useMutation({
    onSuccess: () => obQ.refetch(),
  });

  if (obQ.isLoading) {
    return <Skeleton className={isLight ? "h-64 bg-slate-100" : "h-64 bg-gray-800"} />;
  }

  const data = obQ.data || { steps: [], progressPercent: 0, completedSteps: 0, totalSteps: 8 };

  return (
    <Section
      title="Customer Onboarding"
      description={`${data.completedSteps} of ${data.totalSteps} steps completed`}
    >
      {/* Progress bar */}
      <div className={`w-full rounded-full h-3 overflow-hidden ${isLight ? "bg-slate-200" : "bg-gray-800"}`}>
        <div
          className="h-full rounded-full bg-gradient-to-r from-teal-500 to-emerald-500 transition-all duration-500"
          style={{ width: `${data.progressPercent}%` }}
        />
      </div>
      <p className="text-sm text-slate-400 mt-1">{data.progressPercent}% complete</p>

      <div className="space-y-3 mt-4">
        {data.steps.map((step: any) => (
          <Card
            key={step.id}
            className={`border p-4 transition-colors ${
              step.completed
                ? "bg-emerald-950/30 border-emerald-800/40"
                : "bg-gray-900/80 border-gray-700/50 hover:border-teal-700/50"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  step.completed ? "bg-emerald-600/30" : "bg-gray-700/50"
                }`}>
                  {step.completed
                    ? <CheckCircle2 size={16} className="text-emerald-400" />
                    : <span className="text-xs text-slate-400 font-medium">{step.order}</span>
                  }
                </div>
                <div>
                  <p className={`font-medium ${step.completed ? "text-emerald-300" : "text-white"}`}>{step.label}</p>
                  <p className="text-xs text-slate-500">{step.description}</p>
                </div>
              </div>
              {!step.completed && (
                <Button
                  size="sm"
                  className="bg-teal-600 hover:bg-teal-700 text-white"
                  onClick={() => completeMut.mutate({ customerId, stepId: step.id })}
                  disabled={completeMut.isPending}
                >
                  Complete
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>
    </Section>
  );
}

// ─── Rates Tab ───────────────────────────────────────────────────────────────

function RatesTab({ customerId }: { customerId?: string }) {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const ratesQ = trpc.customerPortal.getRateManagement.useQuery(
    customerId ? { customerId } : undefined
  );

  if (ratesQ.isLoading) {
    return <Skeleton className={isLight ? "h-64 bg-slate-100" : "h-64 bg-gray-800"} />;
  }

  const data = ratesQ.data || { rates: [], summary: { totalLanes: 0, avgRatePerMile: 0, contractedLanes: 0 } };

  return (
    <Section
      title="Rate Management"
      description="Lane pricing, tariffs, and contracted rates"
      action={
        <Button size="sm" className="bg-teal-600 hover:bg-teal-700 text-white">
          <Plus size={14} className="mr-1" /> New Quote
        </Button>
      }
    >
      <div className="grid grid-cols-3 gap-4 mb-6">
        <KPICard label="Total Lanes" value={data.summary.totalLanes} icon={<BarChart3 size={18} />} />
        <KPICard label="Avg Rate/Mile" value={`$${data.summary.avgRatePerMile}`} icon={<DollarSign size={18} />} />
        <KPICard label="Contracted Lanes" value={data.summary.contractedLanes} icon={<FileText size={18} />} />
      </div>

      {data.rates.length === 0 ? (
        <Card className={isLight ? "bg-white border-slate-200 shadow-sm p-12 text-center" : "bg-gray-900/80 border-gray-700/50 p-12 text-center"}>
          <DollarSign className="mx-auto mb-3 text-slate-500" size={40} />
          <p className="text-slate-400">No rate data available</p>
        </Card>
      ) : (
        <Card className={isLight ? "bg-white border-slate-200 shadow-sm overflow-hidden" : "bg-gray-900/80 border-gray-700/50 overflow-hidden"}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={isLight ? "border-b border-slate-200 bg-slate-50" : "border-b border-gray-700/50 bg-gray-800/50"}>
                  <th className="text-left p-3 text-slate-400 font-medium">Origin</th>
                  <th className="text-left p-3 text-slate-400 font-medium">Destination</th>
                  <th className="text-right p-3 text-slate-400 font-medium">Rate</th>
                  <th className="text-right p-3 text-slate-400 font-medium">$/Mile</th>
                  <th className="text-right p-3 text-slate-400 font-medium">Miles</th>
                  <th className="text-left p-3 text-slate-400 font-medium">Equipment</th>
                  <th className="text-left p-3 text-slate-400 font-medium">Type</th>
                </tr>
              </thead>
              <tbody>
                {data.rates.slice(0, 20).map((r: any) => (
                  <tr key={r.id} className={isLight ? "border-b border-slate-100 hover:bg-slate-50 transition-colors" : "border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors"}>
                    <td className={`p-3 ${isLight ? "text-slate-900" : "text-white"}`}>{r.origin}</td>
                    <td className={`p-3 ${isLight ? "text-slate-900" : "text-white"}`}>{r.destination}</td>
                    <td className="p-3 text-right text-emerald-400 font-medium">{formatCurrency(r.rate)}</td>
                    <td className="p-3 text-right text-slate-300">${r.ratePerMile}</td>
                    <td className="p-3 text-right text-slate-300">{formatNumber(r.distance)}</td>
                    <td className="p-3 text-slate-300">{r.equipmentType}</td>
                    <td className="p-3"><StatusBadge status={r.rateType} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </Section>
  );
}

// ─── Contracts Tab ───────────────────────────────────────────────────────────

function ContractsTab({ customerId }: { customerId?: string }) {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const contractsQ = trpc.customerPortal.getContractManagement.useQuery(
    customerId ? { customerId } : undefined
  );

  if (contractsQ.isLoading) {
    return <Skeleton className={isLight ? "h-64 bg-slate-100" : "h-64 bg-gray-800"} />;
  }

  const data = contractsQ.data || { contracts: [], summary: { totalContracts: 0, activeContracts: 0, totalContractedValue: 0, expiringIn30Days: 0, renewalsPending: 0 } };

  return (
    <Section
      title="Contract Management"
      description="Active contracts, terms, volumes, and rates"
      action={
        <Button size="sm" className="bg-teal-600 hover:bg-teal-700 text-white">
          <Plus size={14} className="mr-1" /> New Contract
        </Button>
      }
    >
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <KPICard label="Total Contracts" value={data.summary.totalContracts} icon={<FileText size={18} />} />
        <KPICard label="Active" value={data.summary.activeContracts} icon={<CheckCircle2 size={18} />} />
        <KPICard label="Contracted Value" value={formatCurrency(data.summary.totalContractedValue)} icon={<DollarSign size={18} />} />
        <KPICard label="Expiring (30d)" value={data.summary.expiringIn30Days} icon={<Clock size={18} />} />
        <KPICard label="Renewals Pending" value={data.summary.renewalsPending} icon={<RefreshCw size={18} />} />
      </div>

      {data.contracts.length === 0 ? (
        <Card className={isLight ? "bg-white border-slate-200 shadow-sm p-12 text-center" : "bg-gray-900/80 border-gray-700/50 p-12 text-center"}>
          <FileText className="mx-auto mb-3 text-slate-500" size={40} />
          <p className="text-slate-400">No contracts found</p>
          <p className="text-sm text-slate-500 mt-1">Create a new contract to get started</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {data.contracts.map((c: any) => (
            <Card key={c.id} className={isLight ? "bg-white border-slate-200 shadow-sm p-4 hover:border-teal-400/50 transition-colors" : "bg-gray-900/80 border-gray-700/50 p-4 hover:border-teal-700/50 transition-colors"}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`font-medium ${isLight ? "text-slate-900" : "text-white"}`}>{c.contractNumber}</p>
                  <p className="text-sm text-slate-400">{c.customerName} -- {c.type}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right text-sm">
                    <p className="text-slate-300">{formatCurrency(c.totalValue)}</p>
                    <p className="text-xs text-slate-500">{c.daysUntilExpiry}d until expiry</p>
                  </div>
                  <StatusBadge status={c.status} />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </Section>
  );
}

// ─── Shipments Tab ───────────────────────────────────────────────────────────

function ShipmentsTab({ customerId }: { customerId?: string }) {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const [statusFilter, setStatusFilter] = useState("all");
  const shipmentsQ = trpc.customerPortal.getShipmentVisibility.useQuery(
    { customerId, status: statusFilter !== "all" ? statusFilter : undefined }
  );

  if (shipmentsQ.isLoading) {
    return <Skeleton className={isLight ? "h-64 bg-slate-100" : "h-64 bg-gray-800"} />;
  }

  const data = shipmentsQ.data || { shipments: [], total: 0 };

  const statuses = ["all", "assigned", "in_transit", "at_pickup", "at_delivery", "delivered"];

  return (
    <Section
      title="Shipment Visibility"
      description={`${data.total} total shipments`}
    >
      <div className="flex gap-2 mb-4 flex-wrap">
        {statuses.map(s => (
          <Button
            key={s}
            size="sm"
            variant={statusFilter === s ? "default" : "outline"}
            className={statusFilter === s
              ? "bg-teal-600 hover:bg-teal-700 text-white"
              : "border-gray-600 text-slate-300 hover:bg-gray-700"
            }
            onClick={() => setStatusFilter(s)}
          >
            {s === "all" ? "All" : s.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
          </Button>
        ))}
      </div>

      {data.shipments.length === 0 ? (
        <Card className={isLight ? "bg-white border-slate-200 shadow-sm p-12 text-center" : "bg-gray-900/80 border-gray-700/50 p-12 text-center"}>
          <Truck className="mx-auto mb-3 text-slate-500" size={40} />
          <p className="text-slate-400">No shipments found</p>
        </Card>
      ) : (
        <Card className={isLight ? "bg-white border-slate-200 shadow-sm overflow-hidden" : "bg-gray-900/80 border-gray-700/50 overflow-hidden"}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={isLight ? "border-b border-slate-200 bg-slate-50" : "border-b border-gray-700/50 bg-gray-800/50"}>
                  <th className="text-left p-3 text-slate-400 font-medium">Load #</th>
                  <th className="text-left p-3 text-slate-400 font-medium">Origin</th>
                  <th className="text-left p-3 text-slate-400 font-medium">Destination</th>
                  <th className="text-left p-3 text-slate-400 font-medium">Status</th>
                  <th className="text-left p-3 text-slate-400 font-medium">Equipment</th>
                  <th className="text-right p-3 text-slate-400 font-medium">Rate</th>
                  <th className="text-left p-3 text-slate-400 font-medium">Updated</th>
                </tr>
              </thead>
              <tbody>
                {data.shipments.map((s: any) => (
                  <tr key={s.id} className={isLight ? "border-b border-slate-100 hover:bg-slate-50 transition-colors" : "border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors"}>
                    <td className="p-3 text-teal-400 font-medium">{s.loadNumber}</td>
                    <td className={`p-3 ${isLight ? "text-slate-900" : "text-white"}`}>{s.origin}</td>
                    <td className={`p-3 ${isLight ? "text-slate-900" : "text-white"}`}>{s.destination}</td>
                    <td className="p-3"><StatusBadge status={s.status} /></td>
                    <td className="p-3 text-slate-300">{s.equipment}</td>
                    <td className="p-3 text-right text-emerald-400">{s.rate > 0 ? formatCurrency(s.rate) : "--"}</td>
                    <td className="p-3 text-slate-400 text-xs">
                      {s.lastUpdate ? new Date(s.lastUpdate).toLocaleDateString() : "--"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </Section>
  );
}

// ─── Claims Tab ──────────────────────────────────────────────────────────────

function ClaimsTab({ customerId }: { customerId?: string }) {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const claimsQ = trpc.customerPortal.getClaimsManagement.useQuery(
    customerId ? { customerId } : undefined
  );

  if (claimsQ.isLoading) {
    return <Skeleton className={isLight ? "h-64 bg-slate-100" : "h-64 bg-gray-800"} />;
  }

  const data = claimsQ.data || { claims: [], summary: { totalClaims: 0, openClaims: 0, totalClaimValue: 0, avgResolutionDays: 0 } };

  return (
    <Section
      title="Claims Management"
      description="File and track freight claims"
      action={
        <Button size="sm" className="bg-teal-600 hover:bg-teal-700 text-white">
          <Plus size={14} className="mr-1" /> File Claim
        </Button>
      }
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KPICard label="Total Claims" value={data.summary.totalClaims} icon={<AlertTriangle size={18} />} />
        <KPICard label="Open Claims" value={data.summary.openClaims} icon={<Clock size={18} />} />
        <KPICard label="Claim Value" value={formatCurrency(data.summary.totalClaimValue)} icon={<DollarSign size={18} />} />
        <KPICard label="Avg Resolution" value={`${data.summary.avgResolutionDays}d`} icon={<CheckCircle2 size={18} />} />
      </div>

      {data.claims.length === 0 ? (
        <Card className={isLight ? "bg-white border-slate-200 shadow-sm p-12 text-center" : "bg-gray-900/80 border-gray-700/50 p-12 text-center"}>
          <CheckCircle2 className="mx-auto mb-3 text-emerald-500" size={40} />
          <p className="text-slate-400">No claims filed</p>
          <p className="text-sm text-slate-500 mt-1">All shipments are claims-free</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {data.claims.map((c: any) => (
            <Card key={c.id} className={isLight ? "bg-white border-slate-200 shadow-sm p-4" : "bg-gray-900/80 border-gray-700/50 p-4"}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`font-medium ${isLight ? "text-slate-900" : "text-white"}`}>{c.claimNumber}</p>
                  <p className="text-sm text-slate-400">{c.type} -- {c.description}</p>
                </div>
                <div className="flex items-center gap-4">
                  <p className="text-emerald-400 font-medium">{formatCurrency(c.amount)}</p>
                  <StatusBadge status={c.status} />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </Section>
  );
}

// ─── Scorecard Tab ───────────────────────────────────────────────────────────

function ScorecardTab({ customerId }: { customerId: string }) {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const scorecardQ = trpc.customerPortal.getCustomerScorecard.useQuery({ customerId });

  if (scorecardQ.isLoading) {
    return <Skeleton className={isLight ? "h-64 bg-slate-100" : "h-64 bg-gray-800"} />;
  }

  const data = scorecardQ.data || { overallScore: 0, kpis: [], period: "", trend: "stable" };

  return (
    <Section title="Performance Scorecard" description={`Period: ${data.period}`}>
      {/* Overall Score */}
      <Card className={isLight ? "bg-white border-slate-200 shadow-sm p-6 mb-6" : "bg-gray-900/80 border-gray-700/50 p-6 mb-6"}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-400">Overall Score</p>
            <p className={`text-5xl font-bold mt-1 ${isLight ? "text-slate-900" : "text-white"}`}>{data.overallScore}</p>
            <p className="text-sm text-slate-400 mt-1 capitalize">Trend: {data.trend}</p>
          </div>
          <div className={`w-24 h-24 rounded-full border-4 flex items-center justify-center ${
            data.overallScore >= 90 ? "border-emerald-500" :
            data.overallScore >= 70 ? "border-teal-500" :
            data.overallScore >= 50 ? "border-yellow-500" : "border-red-500"
          }`}>
            <Trophy size={36} className={
              data.overallScore >= 90 ? "text-emerald-400" :
              data.overallScore >= 70 ? "text-teal-400" :
              data.overallScore >= 50 ? "text-yellow-400" : "text-red-400"
            } />
          </div>
        </div>
      </Card>

      {/* KPIs */}
      <div className="space-y-3">
        {data.kpis.map((kpi: any) => (
          <Card key={kpi.name} className={isLight ? "bg-white border-slate-200 shadow-sm p-4" : "bg-gray-900/80 border-gray-700/50 p-4"}>
            <div className="flex items-center justify-between mb-2">
              <p className={`font-medium ${isLight ? "text-slate-900" : "text-white"}`}>{kpi.name}</p>
              <StatusBadge status={kpi.status} />
            </div>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className={`w-full rounded-full h-2 overflow-hidden ${isLight ? "bg-slate-200" : "bg-gray-800"}`}>
                  <div
                    className={`h-full rounded-full transition-all ${
                      kpi.status === "met" ? "bg-emerald-500" :
                      kpi.status === "warning" ? "bg-yellow-500" : "bg-red-500"
                    }`}
                    style={{ width: `${Math.min(100, (kpi.actual / kpi.target) * 100)}%` }}
                  />
                </div>
              </div>
              <div className="text-sm text-slate-300 whitespace-nowrap">
                <span className={`font-medium ${isLight ? "text-slate-900" : "text-white"}`}>{kpi.actual}</span>
                <span className="text-slate-500"> / {kpi.target} {kpi.unit}</span>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </Section>
  );
}

// ─── Communications Tab ──────────────────────────────────────────────────────

function CommunicationsTab({ customerId }: { customerId: string }) {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const commsQ = trpc.customerPortal.getCustomerCommunications.useQuery({
    customerId,
    type: "all",
    page: 1,
    limit: 20,
  });

  if (commsQ.isLoading) {
    return <Skeleton className={isLight ? "h-64 bg-slate-100" : "h-64 bg-gray-800"} />;
  }

  const data = commsQ.data || { communications: [], total: 0 };

  return (
    <Section
      title="Communication Center"
      description="Message history and notifications"
      action={
        <Button size="sm" className="bg-teal-600 hover:bg-teal-700 text-white">
          <Send size={14} className="mr-1" /> Send Message
        </Button>
      }
    >
      {data.communications.length === 0 ? (
        <Card className={isLight ? "bg-white border-slate-200 shadow-sm p-12 text-center" : "bg-gray-900/80 border-gray-700/50 p-12 text-center"}>
          <MessageSquare className="mx-auto mb-3 text-slate-500" size={40} />
          <p className="text-slate-400">No communications yet</p>
          <p className="text-sm text-slate-500 mt-1">Send a notification to start communicating</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {data.communications.map((c: any) => (
            <Card key={c.id} className={isLight ? "bg-white border-slate-200 shadow-sm p-4" : "bg-gray-900/80 border-gray-700/50 p-4"}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="border-teal-600 text-teal-400 bg-teal-600/10 text-xs">
                    {c.type}
                  </Badge>
                  <span className="text-xs text-slate-500">{c.direction}</span>
                </div>
                <StatusBadge status={c.status} />
              </div>
              <p className="font-medium text-white text-sm">{c.subject}</p>
              <p className="text-xs text-slate-400 mt-1 line-clamp-2">{c.body}</p>
              <p className="text-xs text-slate-500 mt-2">{new Date(c.timestamp).toLocaleString()}</p>
            </Card>
          ))}
        </div>
      )}
    </Section>
  );
}

// ─── Feedback Tab ────────────────────────────────────────────────────────────

function FeedbackTab({ customerId }: { customerId?: string }) {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const fbQ = trpc.customerPortal.getCustomerFeedback.useQuery(
    customerId ? { customerId } : undefined
  );

  if (fbQ.isLoading) {
    return <Skeleton className={isLight ? "h-64 bg-slate-100" : "h-64 bg-gray-800"} />;
  }

  const data = fbQ.data || { npsScore: 0, totalResponses: 0, promoters: 0, passives: 0, detractors: 0, recentFeedback: [] };

  return (
    <Section title="Customer Feedback & NPS" description="Satisfaction surveys and Net Promoter Score">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <Card className={isLight ? "bg-white border-slate-200 shadow-sm p-5 col-span-1" : "bg-gray-900/80 border-gray-700/50 p-5 col-span-1"}>
          <p className="text-xs text-slate-400 uppercase tracking-wider">NPS Score</p>
          <p className={`text-4xl font-bold mt-1 ${
            data.npsScore >= 70 ? "text-emerald-400" :
            data.npsScore >= 30 ? "text-teal-400" :
            data.npsScore >= 0 ? "text-yellow-400" : "text-red-400"
          }`}>{data.npsScore}</p>
        </Card>
        <KPICard label="Responses" value={data.totalResponses} icon={<Users size={18} />} />
        <KPICard label="Promoters" value={data.promoters} icon={<TrendingUp size={18} />} />
        <KPICard label="Passives" value={data.passives} icon={<ArrowUpRight size={18} />} />
        <KPICard label="Detractors" value={data.detractors} icon={<TrendingDown size={18} />} />
      </div>

      {data.recentFeedback.length === 0 ? (
        <Card className={isLight ? "bg-white border-slate-200 shadow-sm p-12 text-center" : "bg-gray-900/80 border-gray-700/50 p-12 text-center"}>
          <Star className="mx-auto mb-3 text-slate-500" size={40} />
          <p className="text-slate-400">No feedback received yet</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {data.recentFeedback.map((f: any) => (
            <Card key={f.id} className={isLight ? "bg-white border-slate-200 shadow-sm p-4" : "bg-gray-900/80 border-gray-700/50 p-4"}>
              <div className="flex items-center gap-2 mb-2">
                {Array.from({ length: 5 }, (_, i) => (
                  <Star key={i} size={14} className={i < f.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-600"} />
                ))}
                <span className="text-xs text-slate-400 ml-2">NPS: {f.npsScore}</span>
              </div>
              <p className={`text-sm ${isLight ? "text-slate-900" : "text-white"}`}>{f.comment}</p>
              <p className="text-xs text-slate-500 mt-2">{f.category} -- {new Date(f.submittedAt).toLocaleDateString()}</p>
            </Card>
          ))}
        </div>
      )}
    </Section>
  );
}

// ─── Documents Tab ───────────────────────────────────────────────────────────

function DocumentsTab({ customerId }: { customerId: string }) {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const docsQ = trpc.customerPortal.getCustomerDocuments.useQuery({
    customerId,
    type: "all",
    page: 1,
    limit: 20,
  });

  if (docsQ.isLoading) {
    return <Skeleton className={isLight ? "h-64 bg-slate-100" : "h-64 bg-gray-800"} />;
  }

  const data = docsQ.data || { documents: [], total: 0 };

  return (
    <Section title="Document Sharing Portal" description="PODs, BOLs, invoices, contracts">
      {data.documents.length === 0 ? (
        <Card className={isLight ? "bg-white border-slate-200 shadow-sm p-12 text-center" : "bg-gray-900/80 border-gray-700/50 p-12 text-center"}>
          <FolderOpen className="mx-auto mb-3 text-slate-500" size={40} />
          <p className="text-slate-400">No documents shared yet</p>
          <p className="text-sm text-slate-500 mt-1">Documents will appear here once shipments are completed</p>
        </Card>
      ) : (
        <Card className={isLight ? "bg-white border-slate-200 shadow-sm overflow-hidden" : "bg-gray-900/80 border-gray-700/50 overflow-hidden"}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={isLight ? "border-b border-slate-200 bg-slate-50" : "border-b border-gray-700/50 bg-gray-800/50"}>
                  <th className="text-left p-3 text-slate-400 font-medium">Document</th>
                  <th className="text-left p-3 text-slate-400 font-medium">Type</th>
                  <th className="text-left p-3 text-slate-400 font-medium">Load</th>
                  <th className="text-left p-3 text-slate-400 font-medium">Uploaded</th>
                  <th className="text-left p-3 text-slate-400 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.documents.map((doc: any) => (
                  <tr key={doc.id} className={isLight ? "border-b border-slate-100 hover:bg-slate-50" : "border-b border-gray-800/50 hover:bg-gray-800/30"}>
                    <td className="p-3 text-teal-400">{doc.name}</td>
                    <td className="p-3"><StatusBadge status={doc.type} /></td>
                    <td className="p-3 text-slate-300">{doc.loadId || "--"}</td>
                    <td className="p-3 text-slate-400 text-xs">{new Date(doc.uploadedAt).toLocaleDateString()}</td>
                    <td className="p-3"><StatusBadge status={doc.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </Section>
  );
}

// ─── Billing Tab ─────────────────────────────────────────────────────────────

function BillingTab({ customerId }: { customerId?: string }) {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const billingQ = trpc.customerPortal.getCustomerBilling.useQuery(
    customerId ? { customerId } : undefined
  );

  if (billingQ.isLoading) {
    return <Skeleton className={isLight ? "h-64 bg-slate-100" : "h-64 bg-gray-800"} />;
  }

  const data = billingQ.data || { invoices: [], summary: { totalOutstanding: 0, totalPaid: 0, overdueAmount: 0, averageDaysToPay: 0 }, total: 0 };

  return (
    <Section title="Billing & Invoices" description="Payment history and invoice tracking">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KPICard label="Outstanding" value={formatCurrency(data.summary.totalOutstanding)} icon={<Clock size={18} />} />
        <KPICard label="Total Paid" value={formatCurrency(data.summary.totalPaid)} icon={<CheckCircle2 size={18} />} />
        <KPICard label="Overdue" value={formatCurrency(data.summary.overdueAmount)} icon={<XCircle size={18} />} />
        <KPICard label="Avg Days to Pay" value={`${data.summary.averageDaysToPay}d`} icon={<BarChart3 size={18} />} />
      </div>

      {data.invoices.length === 0 ? (
        <Card className={isLight ? "bg-white border-slate-200 shadow-sm p-12 text-center" : "bg-gray-900/80 border-gray-700/50 p-12 text-center"}>
          <Receipt className="mx-auto mb-3 text-slate-500" size={40} />
          <p className="text-slate-400">No invoices found</p>
        </Card>
      ) : (
        <Card className={isLight ? "bg-white border-slate-200 shadow-sm overflow-hidden" : "bg-gray-900/80 border-gray-700/50 overflow-hidden"}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={isLight ? "border-b border-slate-200 bg-slate-50" : "border-b border-gray-700/50 bg-gray-800/50"}>
                  <th className="text-left p-3 text-slate-400 font-medium">Invoice #</th>
                  <th className="text-right p-3 text-slate-400 font-medium">Amount</th>
                  <th className="text-left p-3 text-slate-400 font-medium">Status</th>
                  <th className="text-left p-3 text-slate-400 font-medium">Issued</th>
                  <th className="text-left p-3 text-slate-400 font-medium">Due</th>
                </tr>
              </thead>
              <tbody>
                {data.invoices.map((inv: any) => (
                  <tr key={inv.id} className={isLight ? "border-b border-slate-100 hover:bg-slate-50" : "border-b border-gray-800/50 hover:bg-gray-800/30"}>
                    <td className="p-3 text-teal-400 font-medium">{inv.invoiceNumber}</td>
                    <td className={`p-3 text-right ${isLight ? "text-slate-900" : "text-white"}`}>{formatCurrency(inv.amount)}</td>
                    <td className="p-3"><StatusBadge status={inv.status} /></td>
                    <td className="p-3 text-slate-400 text-xs">{new Date(inv.issuedDate).toLocaleDateString()}</td>
                    <td className="p-3 text-slate-400 text-xs">{new Date(inv.dueDate).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </Section>
  );
}

// ─── Main Page Component ─────────────────────────────────────────────────────

export default function CustomerPortalPage() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [activeTab, setActiveTab] = useState<TabId>("dashboard");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");

  const handleSelectCustomer = (id: string) => {
    setSelectedCustomerId(id);
    setActiveTab("dashboard");
  };

  const renderTab = () => {
    switch (activeTab) {
      case "dashboard":
        return <DashboardTab customerId={selectedCustomerId || undefined} />;
      case "directory":
        return <DirectoryTab onSelectCustomer={handleSelectCustomer} />;
      case "onboarding":
        return selectedCustomerId
          ? <OnboardingTab customerId={selectedCustomerId} />
          : <Card className={isLight ? "bg-white border-slate-200 shadow-sm p-12 text-center" : "bg-gray-900/80 border-gray-700/50 p-12 text-center"}><p className="text-slate-400">Select a customer from the Directory tab first</p></Card>;
      case "rates":
        return <RatesTab customerId={selectedCustomerId || undefined} />;
      case "contracts":
        return <ContractsTab customerId={selectedCustomerId || undefined} />;
      case "shipments":
        return <ShipmentsTab customerId={selectedCustomerId || undefined} />;
      case "claims":
        return <ClaimsTab customerId={selectedCustomerId || undefined} />;
      case "scorecard":
        return selectedCustomerId
          ? <ScorecardTab customerId={selectedCustomerId} />
          : <Card className={isLight ? "bg-white border-slate-200 shadow-sm p-12 text-center" : "bg-gray-900/80 border-gray-700/50 p-12 text-center"}><p className="text-slate-400">Select a customer from the Directory tab first</p></Card>;
      case "communications":
        return selectedCustomerId
          ? <CommunicationsTab customerId={selectedCustomerId} />
          : <Card className={isLight ? "bg-white border-slate-200 shadow-sm p-12 text-center" : "bg-gray-900/80 border-gray-700/50 p-12 text-center"}><p className="text-slate-400">Select a customer from the Directory tab first</p></Card>;
      case "feedback":
        return <FeedbackTab customerId={selectedCustomerId || undefined} />;
      case "documents":
        return selectedCustomerId
          ? <DocumentsTab customerId={selectedCustomerId} />
          : <Card className={isLight ? "bg-white border-slate-200 shadow-sm p-12 text-center" : "bg-gray-900/80 border-gray-700/50 p-12 text-center"}><p className="text-slate-400">Select a customer from the Directory tab first</p></Card>;
      case "billing":
        return <BillingTab customerId={selectedCustomerId || undefined} />;
      default:
        return null;
    }
  };

  return (
    <div className={isLight ? "min-h-screen bg-slate-50 text-slate-900 p-6" : "min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6"}>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-transparent">
              Customer Portal & CRM
            </h1>
            <p className={`mt-1 ${isLight ? "text-slate-500" : "text-slate-400"}`}>
              Manage customer relationships, contracts, and self-service portal
              {selectedCustomerId && (
                <span className="text-teal-400 ml-2">
                  -- Customer #{selectedCustomerId}
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {selectedCustomerId && (
              <Button
                variant="outline"
                className={isLight ? "border-slate-200 text-slate-600 hover:bg-slate-100" : "border-gray-600 text-slate-300 hover:bg-gray-700"}
                onClick={() => setSelectedCustomerId("")}
              >
                Clear Selection
              </Button>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className={`flex gap-1 overflow-x-auto pb-1 scrollbar-thin ${isLight ? "scrollbar-track-slate-100 scrollbar-thumb-slate-300" : "scrollbar-track-gray-900 scrollbar-thumb-gray-700"}`}>
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? isLight ? "bg-teal-50 text-teal-700 border border-teal-300" : "bg-teal-600/20 text-teal-400 border border-teal-600/40"
                  : isLight ? "text-slate-500 hover:text-slate-900 hover:bg-slate-100 border border-transparent" : "text-slate-400 hover:text-white hover:bg-gray-800/50 border border-transparent"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="min-h-[400px]">
          {renderTab()}
        </div>
      </div>
    </div>
  );
}
