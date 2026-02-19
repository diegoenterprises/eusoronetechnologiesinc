/**
 * LoadStatusBadge — Jony Ive–grade status indicator
 *
 * Renders a load's current lifecycle state as a refined badge with:
 * - Color-coded background from STATE_METADATA
 * - Emoji icon
 * - Optional label
 * - Subtle pulse animation for active/in-progress states
 */

import { motion } from "framer-motion";

// ═══════════════════════════════════════════════════════════════
// STATE METADATA (mirrors server/services/loadLifecycle/stateMachine.ts)
// ═══════════════════════════════════════════════════════════════

const STATE_META: Record<string, { displayName: string; icon: string; color: string; bgColor: string; category: string; isFinal?: boolean; isException?: boolean }> = {
  DRAFT:               { displayName: "Draft",              icon: "📝", color: "#94a3b8", bgColor: "#1e293b", category: "CREATION" },
  POSTED:              { displayName: "Posted",             icon: "📢", color: "#3b82f6", bgColor: "#1e3a5f", category: "CREATION" },
  BIDDING:             { displayName: "Bidding",            icon: "⚖️", color: "#8b5cf6", bgColor: "#2e1065", category: "CREATION" },
  EXPIRED:             { displayName: "Expired",            icon: "⏰", color: "#6b7280", bgColor: "#1f2937", category: "CREATION", isFinal: true },
  AWARDED:             { displayName: "Awarded",            icon: "🏆", color: "#f59e0b", bgColor: "#451a03", category: "ASSIGNMENT" },
  DECLINED:            { displayName: "Declined",           icon: "❌", color: "#ef4444", bgColor: "#450a0a", category: "ASSIGNMENT", isException: true },
  LAPSED:              { displayName: "Lapsed",             icon: "⏳", color: "#6b7280", bgColor: "#1f2937", category: "ASSIGNMENT", isException: true },
  ACCEPTED:            { displayName: "Accepted",           icon: "✅", color: "#22c55e", bgColor: "#052e16", category: "ASSIGNMENT" },
  ASSIGNED:            { displayName: "Assigned",           icon: "🚛", color: "#06b6d4", bgColor: "#083344", category: "ASSIGNMENT" },
  CONFIRMED:           { displayName: "Confirmed",          icon: "👍", color: "#10b981", bgColor: "#064e3b", category: "ASSIGNMENT" },
  EN_ROUTE_PICKUP:     { displayName: "En Route Pickup",    icon: "🛣️", color: "#3b82f6", bgColor: "#1e3a5f", category: "EXECUTION" },
  AT_PICKUP:           { displayName: "At Pickup",          icon: "📍", color: "#f59e0b", bgColor: "#451a03", category: "EXECUTION" },
  PICKUP_CHECKIN:      { displayName: "Pickup Check-In",    icon: "🔑", color: "#8b5cf6", bgColor: "#2e1065", category: "EXECUTION" },
  LOADING:             { displayName: "Loading",            icon: "📦", color: "#f97316", bgColor: "#431407", category: "EXECUTION" },
  LOADING_EXCEPTION:   { displayName: "Loading Exception",  icon: "⚠️", color: "#ef4444", bgColor: "#450a0a", category: "EXECUTION", isException: true },
  LOADED:              { displayName: "Loaded",             icon: "✅", color: "#22c55e", bgColor: "#052e16", category: "EXECUTION" },
  IN_TRANSIT:          { displayName: "In Transit",         icon: "🚚", color: "#3b82f6", bgColor: "#1e3a5f", category: "EXECUTION" },
  TRANSIT_HOLD:        { displayName: "Transit Hold",       icon: "⏸️", color: "#f59e0b", bgColor: "#451a03", category: "EXECUTION" },
  TRANSIT_EXCEPTION:   { displayName: "Transit Exception",  icon: "🚨", color: "#ef4444", bgColor: "#450a0a", category: "EXECUTION", isException: true },
  AT_DELIVERY:         { displayName: "At Delivery",        icon: "📍", color: "#10b981", bgColor: "#064e3b", category: "EXECUTION" },
  DELIVERY_CHECKIN:    { displayName: "Delivery Check-In",  icon: "🔑", color: "#8b5cf6", bgColor: "#2e1065", category: "EXECUTION" },
  UNLOADING:           { displayName: "Unloading",          icon: "📦", color: "#f97316", bgColor: "#431407", category: "EXECUTION" },
  UNLOADING_EXCEPTION: { displayName: "Unloading Exception",icon: "⚠️", color: "#ef4444", bgColor: "#450a0a", category: "EXECUTION", isException: true },
  UNLOADED:            { displayName: "Unloaded",           icon: "✅", color: "#22c55e", bgColor: "#052e16", category: "EXECUTION" },
  POD_PENDING:         { displayName: "POD Pending",        icon: "📋", color: "#8b5cf6", bgColor: "#2e1065", category: "COMPLETION" },
  POD_REJECTED:        { displayName: "POD Rejected",       icon: "🔄", color: "#ef4444", bgColor: "#450a0a", category: "COMPLETION", isException: true },
  DELIVERED:           { displayName: "Delivered",          icon: "🎉", color: "#22c55e", bgColor: "#052e16", category: "COMPLETION" },
  INVOICED:            { displayName: "Invoiced",           icon: "🧾", color: "#06b6d4", bgColor: "#083344", category: "FINANCIAL" },
  DISPUTED:            { displayName: "Disputed",           icon: "⚡", color: "#ef4444", bgColor: "#450a0a", category: "FINANCIAL", isException: true },
  PAID:                { displayName: "Paid",               icon: "💰", color: "#22c55e", bgColor: "#052e16", category: "FINANCIAL" },
  COMPLETE:            { displayName: "Complete",           icon: "🏁", color: "#10b981", bgColor: "#064e3b", category: "FINANCIAL", isFinal: true },
  CANCELLED:           { displayName: "Cancelled",          icon: "🚫", color: "#6b7280", bgColor: "#1f2937", category: "EXCEPTION", isFinal: true },
  ON_HOLD:             { displayName: "On Hold",            icon: "✋", color: "#f59e0b", bgColor: "#451a03", category: "EXCEPTION", isException: true },
};

// Active states that should pulse
const ACTIVE_STATES = new Set([
  "EN_ROUTE_PICKUP", "AT_PICKUP", "LOADING", "IN_TRANSIT",
  "AT_DELIVERY", "UNLOADING", "TRANSIT_HOLD",
]);

// ═══════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════

interface LoadStatusBadgeProps {
  state: string;
  size?: "xs" | "sm" | "md" | "lg";
  showLabel?: boolean;
  showIcon?: boolean;
  animated?: boolean;
  className?: string;
}

export default function LoadStatusBadge({
  state,
  size = "md",
  showLabel = true,
  showIcon = true,
  animated = true,
  className = "",
}: LoadStatusBadgeProps) {
  const normalized = state.toUpperCase().replace(/-/g, "_");
  const meta = STATE_META[normalized] || {
    displayName: state, icon: "❓", color: "#6b7280", bgColor: "#1f2937", category: "EXCEPTION",
  };

  const isActive = ACTIVE_STATES.has(normalized) && animated;

  const sizeClasses: Record<string, string> = {
    xs: "text-[10px] px-1.5 py-0.5 gap-0.5",
    sm: "text-xs px-2 py-0.5 gap-1",
    md: "text-sm px-2.5 py-1 gap-1.5",
    lg: "text-base px-3 py-1.5 gap-2",
  };

  const iconSizes: Record<string, string> = {
    xs: "text-[10px]",
    sm: "text-xs",
    md: "text-sm",
    lg: "text-lg",
  };

  return (
    <motion.span
      className={`inline-flex items-center rounded-full font-medium whitespace-nowrap select-none ${sizeClasses[size]} ${className}`}
      style={{
        backgroundColor: meta.bgColor,
        color: meta.color,
        border: `1px solid ${meta.color}20`,
      }}
      animate={isActive ? {
        boxShadow: [
          `0 0 0px ${meta.color}00`,
          `0 0 8px ${meta.color}40`,
          `0 0 0px ${meta.color}00`,
        ],
      } : {}}
      transition={isActive ? { duration: 2, repeat: Infinity, ease: "easeInOut" } : {}}
    >
      {showIcon && <span className={iconSizes[size]}>{meta.icon}</span>}
      {showLabel && <span>{meta.displayName}</span>}
    </motion.span>
  );
}

export { STATE_META };
