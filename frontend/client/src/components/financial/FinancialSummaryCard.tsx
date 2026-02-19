/**
 * FinancialSummaryCard — Comprehensive load financial breakdown
 *
 * Displays line haul, fuel surcharge, hazmat surcharge, detention,
 * demurrage, layover charges, and totals with expandable line items.
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  DollarSign, ChevronDown, ChevronUp, Fuel, AlertTriangle,
  Clock, Truck, Receipt, Ban,
} from "lucide-react";

interface TimerSnapshot {
  id: number;
  type: string;
  status: string;
  elapsedMinutes: number;
  billableMinutes: number;
  currentCharge: number;
  hourlyRate: number;
  currency: string;
}

interface FinancialSummaryProps {
  loadId: string;
  lineHaul: number;
  distance: number;
  fuelSurcharge: number;
  hazmatSurcharge: number;
  detentionCharges: number;
  demurrageCharges: number;
  layoverCharges: number;
  totalAccessorials: number;
  totalCharges: number;
  activeTimers?: TimerSnapshot[];
  timerHistory?: TimerSnapshot[];
  currency?: string;
  className?: string;
}

function fmt(amount: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
}

interface LineItemProps {
  icon: React.ReactNode;
  label: string;
  amount: number;
  currency: string;
  detail?: string;
  variant?: "normal" | "accent" | "danger";
}

function LineItem({ icon, label, amount, currency, detail, variant = "normal" }: LineItemProps) {
  const colorMap = {
    normal: "text-gray-300",
    accent: "text-cyan-400",
    danger: "text-red-400",
  };
  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-2.5">
        <span className="text-gray-500">{icon}</span>
        <div>
          <p className="text-sm text-gray-300">{label}</p>
          {detail && <p className="text-[10px] text-gray-600">{detail}</p>}
        </div>
      </div>
      <span className={`text-sm font-mono font-medium tabular-nums ${colorMap[variant]}`}>
        {amount > 0 ? fmt(amount, currency) : "—"}
      </span>
    </div>
  );
}

export default function FinancialSummaryCard({
  lineHaul,
  distance,
  fuelSurcharge,
  hazmatSurcharge,
  detentionCharges,
  demurrageCharges,
  layoverCharges,
  totalAccessorials,
  totalCharges,
  activeTimers = [],
  timerHistory = [],
  currency = "USD",
  className = "",
}: FinancialSummaryProps) {
  const [expanded, setExpanded] = useState(false);
  const hasAccessorials = totalAccessorials > 0;
  const hasActiveTimers = activeTimers.length > 0;

  return (
    <motion.div
      className={`rounded-2xl overflow-hidden ${className}`}
      style={{
        background: "linear-gradient(135deg, #0f172a 0%, #020617 100%)",
        border: "1px solid #1e293b",
      }}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-4 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-900/40 flex items-center justify-center">
            <DollarSign size={16} className="text-emerald-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Financial Summary</h3>
            <p className="text-[10px] text-gray-500">{distance > 0 ? `${distance.toFixed(0)} mi` : "—"}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xl font-mono font-bold text-white tabular-nums">{fmt(totalCharges, currency)}</p>
          <p className="text-[10px] text-gray-500">Total</p>
        </div>
      </div>

      {/* Active timer warning */}
      {hasActiveTimers && (
        <motion.div
          className="mx-4 mb-2 px-3 py-2 rounded-lg bg-red-950/30 border border-red-900/20 flex items-center gap-2"
          animate={{ opacity: [0.8, 1, 0.8] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Clock size={12} className="text-red-400 flex-shrink-0" />
          <span className="text-[11px] text-red-300">
            {activeTimers.length} active timer{activeTimers.length > 1 ? "s" : ""} —{" "}
            {activeTimers.map(t => `${t.type} ${fmt(t.currentCharge)}`).join(", ")}
          </span>
        </motion.div>
      )}

      {/* Primary line items */}
      <div className="px-5 divide-y divide-gray-800/60">
        <LineItem
          icon={<Truck size={14} />}
          label="Line Haul"
          amount={lineHaul}
          currency={currency}
          detail={distance > 0 ? `${fmt(lineHaul / distance)}/mi` : undefined}
        />
        <LineItem
          icon={<Fuel size={14} />}
          label="Fuel Surcharge"
          amount={fuelSurcharge}
          currency={currency}
          detail={distance > 0 ? `$0.58/mi × ${distance.toFixed(0)} mi` : undefined}
          variant="accent"
        />
        {hazmatSurcharge > 0 && (
          <LineItem
            icon={<AlertTriangle size={14} />}
            label="Hazmat Surcharge"
            amount={hazmatSurcharge}
            currency={currency}
            detail="15% of line haul"
            variant="danger"
          />
        )}
      </div>

      {/* Accessorials toggle */}
      {(hasAccessorials || timerHistory.length > 0) && (
        <div className="px-5 pt-2">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center justify-between w-full py-2 text-sm text-gray-400 hover:text-gray-200 transition-colors"
          >
            <span className="flex items-center gap-1.5">
              <Receipt size={14} />
              Accessorial Charges
              {hasAccessorials && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-900/40 text-amber-300 font-medium">
                  {fmt(totalAccessorials)}
                </span>
              )}
            </span>
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden divide-y divide-gray-800/40"
              >
                {detentionCharges > 0 && (
                  <LineItem
                    icon={<Clock size={14} />}
                    label="Detention"
                    amount={detentionCharges}
                    currency={currency}
                    detail="Waiting at pickup"
                    variant="danger"
                  />
                )}
                {demurrageCharges > 0 && (
                  <LineItem
                    icon={<Clock size={14} />}
                    label="Demurrage"
                    amount={demurrageCharges}
                    currency={currency}
                    detail="Waiting at delivery"
                    variant="danger"
                  />
                )}
                {layoverCharges > 0 && (
                  <LineItem
                    icon={<Clock size={14} />}
                    label="Layover"
                    amount={layoverCharges}
                    currency={currency}
                    detail="HOS rest period"
                  />
                )}
                {detentionCharges === 0 && demurrageCharges === 0 && layoverCharges === 0 && (
                  <div className="flex items-center gap-2 py-3">
                    <Ban size={12} className="text-gray-600" />
                    <span className="text-xs text-gray-600">No accessorial charges</span>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Total bar */}
      <div className="mt-2 px-5 py-3 bg-gray-900/60 border-t border-gray-800/60">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-300">Total Charges</span>
          <span className="text-lg font-mono font-bold text-white tabular-nums">
            {fmt(totalCharges, currency)}
          </span>
        </div>
        {hasAccessorials && (
          <p className="text-[10px] text-gray-500 mt-0.5 text-right">
            Includes {fmt(totalAccessorials)} in accessorials
          </p>
        )}
      </div>
    </motion.div>
  );
}
