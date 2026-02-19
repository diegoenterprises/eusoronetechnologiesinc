/**
 * ApprovalGateCard — Approval request card with approve/deny flow
 *
 * Displays pending approval requests with:
 * - Gate context (what transition is being gated)
 * - Escalation countdown timer
 * - Approve/Deny buttons with confirmation
 * - Resolution status display
 */

import { useState, useEffect } from "react";
import {
  ShieldCheck, ShieldX, Clock, AlertTriangle, CheckCircle2,
  XCircle, Loader2, ChevronDown, ChevronUp, User,
} from "lucide-react";

interface ApprovalRequest {
  id: number;
  loadId: number | string;
  loadNumber?: string;
  loadStatus?: string;
  gateId: string;
  transitionId: string;
  status: "PENDING" | "APPROVED" | "DENIED" | "EXPIRED" | "ESCALATED";
  requestedAt: string;
  expiresAt?: string;
  resolvedBy?: number;
  resolvedAt?: string;
  notes?: string;
}

interface ApprovalGateCardProps {
  approval: ApprovalRequest;
  onApprove: (approvalId: number, notes?: string) => void;
  onDeny: (approvalId: number, reason: string) => void;
  loading?: boolean;
  compact?: boolean;
  className?: string;
}

const GATE_LABELS: Record<string, { label: string; description: string; severity: "low" | "medium" | "high" }> = {
  rate_approval: { label: "Rate Approval", description: "Load rate exceeds threshold and requires authorization", severity: "medium" },
  hazmat_clearance: { label: "Hazmat Clearance", description: "Hazmat shipment requires safety compliance verification", severity: "high" },
  oversize_permit: { label: "Oversize Permit", description: "Oversized load requires permit verification", severity: "high" },
  payment_approval: { label: "Payment Approval", description: "Payment amount requires financial authorization", severity: "medium" },
  dispute_review: { label: "Dispute Review", description: "Load dispute requires management review", severity: "high" },
  hold_release: { label: "Hold Release", description: "Load hold requires authorization to release", severity: "medium" },
  cancellation_approval: { label: "Cancellation Approval", description: "Load cancellation requires authorization", severity: "high" },
  route_deviation: { label: "Route Deviation", description: "Driver has deviated from planned route", severity: "medium" },
  detention_waiver: { label: "Detention Waiver", description: "Detention charges waiver requires approval", severity: "low" },
};

const SEVERITY_STYLES = {
  low: {
    bg: "bg-blue-500/10 border-blue-500/20",
    text: "text-blue-400",
    icon: "text-blue-500",
    badge: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  },
  medium: {
    bg: "bg-amber-500/10 border-amber-500/20",
    text: "text-amber-400",
    icon: "text-amber-500",
    badge: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  },
  high: {
    bg: "bg-red-500/10 border-red-500/20",
    text: "text-red-400",
    icon: "text-red-500",
    badge: "bg-red-500/15 text-red-400 border-red-500/30",
  },
};

function formatTimeRemaining(expiresAt: string): { text: string; urgent: boolean; expired: boolean } {
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return { text: "Expired", urgent: true, expired: true };
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(mins / 60);
  if (hrs > 0) return { text: `${hrs}h ${mins % 60}m remaining`, urgent: hrs < 1, expired: false };
  if (mins > 10) return { text: `${mins}m remaining`, urgent: false, expired: false };
  return { text: `${mins}m remaining`, urgent: true, expired: false };
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString("en-US", {
    month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
  });
}

export default function ApprovalGateCard({
  approval,
  onApprove,
  onDeny,
  loading = false,
  compact = false,
  className = "",
}: ApprovalGateCardProps) {
  const [showDenyReason, setShowDenyReason] = useState(false);
  const [denyReason, setDenyReason] = useState("");
  const [approveNotes, setApproveNotes] = useState("");
  const [showDetails, setShowDetails] = useState(false);
  const [timeLeft, setTimeLeft] = useState<{ text: string; urgent: boolean; expired: boolean } | null>(null);

  const gate = GATE_LABELS[approval.gateId] || {
    label: approval.gateId.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()),
    description: "Requires authorization to proceed",
    severity: "medium" as const,
  };
  const styles = SEVERITY_STYLES[gate.severity];
  const isPending = approval.status === "PENDING";

  // Escalation countdown
  useEffect(() => {
    if (!approval.expiresAt || !isPending) return;
    const update = () => setTimeLeft(formatTimeRemaining(approval.expiresAt!));
    update();
    const interval = setInterval(update, 30000);
    return () => clearInterval(interval);
  }, [approval.expiresAt, isPending]);

  const statusIcon = {
    PENDING: <Clock className="w-5 h-5 text-amber-500" />,
    APPROVED: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
    DENIED: <XCircle className="w-5 h-5 text-red-500" />,
    EXPIRED: <AlertTriangle className="w-5 h-5 text-slate-400" />,
    ESCALATED: <AlertTriangle className="w-5 h-5 text-red-500 animate-pulse" />,
  }[approval.status];

  if (compact && !isPending) {
    return (
      <div className={`flex items-center gap-3 py-2 px-3 rounded-lg border border-slate-700/30 bg-slate-800/30 ${className}`}>
        {statusIcon}
        <span className="text-xs text-slate-400 flex-1">{gate.label}</span>
        <span className="text-[10px] text-slate-500 uppercase font-medium">{approval.status}</span>
      </div>
    );
  }

  return (
    <div className={`rounded-xl border ${styles.bg} ${className}`}>
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          {statusIcon}
          <div>
            <p className="text-sm font-semibold text-white">{gate.label}</p>
            {approval.loadNumber && (
              <p className="text-[10px] text-slate-400">Load {approval.loadNumber}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isPending && timeLeft && (
            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${
              timeLeft.expired ? "bg-red-500/15 text-red-400 border-red-500/30" :
              timeLeft.urgent ? "bg-amber-500/15 text-amber-400 border-amber-500/30 animate-pulse" :
              "bg-slate-700/50 text-slate-400 border-slate-600/50"
            }`}>
              <Clock className="w-3 h-3 inline mr-1" />
              {timeLeft.text}
            </span>
          )}
          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${styles.badge}`}>
            {gate.severity}
          </span>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-slate-400 hover:text-white transition-colors"
          >
            {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Description (expanded) */}
      {showDetails && (
        <div className="px-4 pb-3 space-y-2">
          <p className="text-xs text-slate-400 leading-relaxed">{gate.description}</p>
          <div className="flex items-center gap-4 text-[10px] text-slate-500">
            <span>Requested: {formatDate(approval.requestedAt)}</span>
            {approval.transitionId && <span>Transition: {approval.transitionId}</span>}
          </div>
          {approval.resolvedAt && (
            <div className="flex items-center gap-2 text-[10px] text-slate-500">
              <User className="w-3 h-3" />
              <span>Resolved {formatDate(approval.resolvedAt)}</span>
              {approval.notes && <span>— {approval.notes}</span>}
            </div>
          )}
        </div>
      )}

      {/* Action buttons (only for PENDING) */}
      {isPending && (
        <div className="px-4 pb-4 space-y-3">
          {showDenyReason ? (
            <div className="space-y-2">
              <textarea
                value={denyReason}
                onChange={(e) => setDenyReason(e.target.value)}
                placeholder="Reason for denial (required)"
                className="w-full bg-slate-900/50 border border-slate-700/50 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-red-500/50 resize-none"
                rows={2}
              />
              <div className="flex gap-2">
                <button
                  onClick={() => { if (denyReason.trim()) onDeny(approval.id, denyReason); }}
                  disabled={!denyReason.trim() || loading}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-semibold hover:bg-red-500/30 transition-colors disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldX className="w-3.5 h-3.5" />}
                  Confirm Deny
                </button>
                <button
                  onClick={() => { setShowDenyReason(false); setDenyReason(""); }}
                  className="px-3 py-2 rounded-lg border border-slate-700/50 text-xs text-slate-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => onApprove(approval.id, approveNotes || undefined)}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-semibold hover:bg-emerald-500/30 transition-colors disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                Approve
              </button>
              <button
                onClick={() => setShowDenyReason(true)}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold hover:bg-red-500/20 transition-colors disabled:opacity-50"
              >
                <ShieldX className="w-3.5 h-3.5" />
                Deny
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * ApprovalBadge — Notification badge for pending approvals count
 */
export function ApprovalBadge({ count, className = "" }: { count: number; className?: string }) {
  if (count <= 0) return null;
  return (
    <span className={`inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold animate-pulse ${className}`}>
      {count > 99 ? "99+" : count}
    </span>
  );
}
