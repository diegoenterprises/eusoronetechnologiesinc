/**
 * DetentionTimer — Real-time financial timer display
 *
 * Shows countdown during free time (green) and accumulating charges
 * during billable time (red). Updates every second.
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, DollarSign, AlertTriangle } from "lucide-react";

interface DetentionTimerProps {
  type: "DETENTION" | "DEMURRAGE" | "LAYOVER";
  status: "FREE_TIME" | "BILLING" | "STOPPED" | "WAIVED";
  startedAt: string | Date;
  freeTimeMinutes: number;
  hourlyRate: number;
  currentCharge?: number;
  currency?: string;
  className?: string;
}

function formatDuration(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = Math.floor(totalSeconds % 60);
  if (h > 0) return `${h}h ${m.toString().padStart(2, "0")}m ${s.toString().padStart(2, "0")}s`;
  return `${m}m ${s.toString().padStart(2, "0")}s`;
}

function formatCurrency(amount: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
}

const TYPE_LABELS: Record<string, string> = {
  DETENTION: "Detention",
  DEMURRAGE: "Demurrage",
  LAYOVER: "Layover",
};

const LAYOVER_FLAT_RATE = 350;

export default function DetentionTimer({
  type,
  status,
  startedAt,
  freeTimeMinutes,
  hourlyRate,
  currentCharge: initialCharge,
  currency = "USD",
  className = "",
}: DetentionTimerProps) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (status === "STOPPED" || status === "WAIVED") return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [status]);

  const start = new Date(startedAt).getTime();
  const freeTimeEnd = start + freeTimeMinutes * 60 * 1000;
  const elapsedSeconds = Math.max(0, (now - start) / 1000);
  const freeTimeRemainingSeconds = Math.max(0, (freeTimeEnd - now) / 1000);
  const billableSeconds = Math.max(0, (now - freeTimeEnd) / 1000);
  const isBilling = freeTimeRemainingSeconds <= 0 && status !== "STOPPED" && status !== "WAIVED";

  let liveCharge = 0;
  if (status === "STOPPED" || status === "WAIVED") {
    liveCharge = initialCharge ?? 0;
  } else if (type === "LAYOVER") {
    liveCharge = Math.ceil(elapsedSeconds / 86400) * LAYOVER_FLAT_RATE;
  } else if (isBilling) {
    liveCharge = (billableSeconds / 3600) * hourlyRate;
  }
  liveCharge = Math.round(liveCharge * 100) / 100;

  const isStopped = status === "STOPPED" || status === "WAIVED";
  const progressPct = freeTimeMinutes > 0
    ? Math.min(100, (elapsedSeconds / (freeTimeMinutes * 60)) * 100)
    : 100;

  return (
    <motion.div
      className={`rounded-xl overflow-hidden ${className}`}
      style={{
        background: isStopped
          ? "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)"
          : isBilling
            ? "linear-gradient(135deg, #450a0a 0%, #1c0404 100%)"
            : "linear-gradient(135deg, #052e16 0%, #022c22 100%)",
        border: `1px solid ${isStopped ? "#334155" : isBilling ? "#dc262640" : "#16a34a30"}`,
      }}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2">
        <div className="flex items-center gap-2">
          <Clock size={14} className={isBilling ? "text-red-400" : "text-emerald-400"} />
          <span className="text-xs font-semibold tracking-wide uppercase text-gray-300">
            {TYPE_LABELS[type] || type}
          </span>
        </div>
        <span
          className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
            isStopped
              ? "bg-gray-700 text-gray-400"
              : isBilling
                ? "bg-red-900/60 text-red-300"
                : "bg-emerald-900/60 text-emerald-300"
          }`}
        >
          {isStopped ? (status === "WAIVED" ? "Waived" : "Stopped") : isBilling ? "Billing" : "Free Time"}
        </span>
      </div>

      {/* Main display */}
      <div className="px-4 pb-2">
        <AnimatePresence mode="wait">
          {!isBilling && !isStopped ? (
            <motion.div key="free" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <p className="text-[10px] text-gray-500 mb-0.5">Free time remaining</p>
              <p className="text-2xl font-mono font-bold text-emerald-400 tabular-nums tracking-tight">
                {formatDuration(freeTimeRemainingSeconds)}
              </p>
            </motion.div>
          ) : (
            <motion.div key="bill" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="flex items-baseline gap-2">
                <DollarSign size={16} className={isStopped ? "text-gray-400" : "text-red-400"} />
                <motion.span
                  className={`text-3xl font-mono font-bold tabular-nums tracking-tight ${isStopped ? "text-gray-300" : "text-red-400"}`}
                  key={Math.floor(liveCharge)}
                  initial={{ scale: 1.05 }}
                  animate={{ scale: 1 }}
                >
                  {formatCurrency(liveCharge, currency)}
                </motion.span>
              </div>
              {!isStopped && (
                <p className="text-[10px] text-gray-500 mt-0.5">
                  {type === "LAYOVER"
                    ? `${formatCurrency(LAYOVER_FLAT_RATE)}/day flat rate`
                    : `${formatCurrency(hourlyRate)}/hr · ${formatDuration(billableSeconds)} billable`}
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Progress bar */}
      {!isStopped && (
        <div className="px-4 pb-3">
          <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{
                backgroundColor: isBilling ? "#ef4444" : "#22c55e",
              }}
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(progressPct, 100)}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[9px] text-gray-600">{formatDuration(elapsedSeconds)} elapsed</span>
            {freeTimeMinutes > 0 && (
              <span className="text-[9px] text-gray-600">{freeTimeMinutes}min free</span>
            )}
          </div>
        </div>
      )}

      {/* Billing warning */}
      {isBilling && !isStopped && (
        <motion.div
          className="flex items-center gap-1.5 px-4 py-2 bg-red-950/40 border-t border-red-900/30"
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <AlertTriangle size={12} className="text-red-400" />
          <span className="text-[10px] text-red-300 font-medium">
            Charges accruing at {formatCurrency(hourlyRate)}/hr
          </span>
        </motion.div>
      )}
    </motion.div>
  );
}
