/**
 * LoadStatusBadge — Status indicator with Lucide icons
 *
 * Renders a load's current lifecycle state as a refined badge with:
 * - Color-coded background from STATE_METADATA
 * - Lucide icon (NO emojis)
 * - Optional label
 * - Subtle pulse animation for active/in-progress states
 */

import { motion } from "framer-motion";
import {
  FileEdit, Megaphone, Scale, Clock, Award, XCircle, Hourglass,
  CheckCircle, Truck, ThumbsUp, Navigation, MapPin, KeyRound,
  Package, AlertTriangle, Pause, Siren, ClipboardCheck, RefreshCw,
  CheckCircle2, FileText, Zap, DollarSign, Flag, Ban, Hand,
  HelpCircle,
  type LucideIcon,
} from "lucide-react";

// ═══════════════════════════════════════════════════════════════
// ICON MAP — Lucide component lookup
// ═══════════════════════════════════════════════════════════════

const ICON_MAP: Record<string, LucideIcon> = {
  FileEdit, Megaphone, Scale, Clock, Award, XCircle, Hourglass,
  CheckCircle, Truck, ThumbsUp, Navigation, MapPin, KeyRound,
  Package, AlertTriangle, Pause, Siren, ClipboardCheck, RefreshCw,
  CheckCircle2, FileText, Zap, DollarSign, Flag, Ban, Hand,
  HelpCircle, PartyPopper: CheckCircle2,
};

// ═══════════════════════════════════════════════════════════════
// STATE METADATA (mirrors server/services/loadLifecycle/stateMachine.ts)
// ═══════════════════════════════════════════════════════════════

const STATE_META: Record<string, { displayName: string; icon: string; color: string; bgColor: string; category: string; isFinal?: boolean; isException?: boolean }> = {
  DRAFT:               { displayName: "Draft",              icon: "FileEdit",       color: "#94a3b8", bgColor: "#1e293b", category: "CREATION" },
  POSTED:              { displayName: "Posted",             icon: "Megaphone",      color: "#3b82f6", bgColor: "#1e3a5f", category: "CREATION" },
  BIDDING:             { displayName: "Bidding",            icon: "Scale",          color: "#8b5cf6", bgColor: "#2e1065", category: "CREATION" },
  EXPIRED:             { displayName: "Expired",            icon: "Clock",          color: "#6b7280", bgColor: "#1f2937", category: "CREATION", isFinal: true },
  AWARDED:             { displayName: "Awarded",            icon: "Award",          color: "#f59e0b", bgColor: "#451a03", category: "ASSIGNMENT" },
  DECLINED:            { displayName: "Declined",           icon: "XCircle",        color: "#ef4444", bgColor: "#450a0a", category: "ASSIGNMENT", isException: true },
  LAPSED:              { displayName: "Lapsed",             icon: "Hourglass",      color: "#6b7280", bgColor: "#1f2937", category: "ASSIGNMENT", isException: true },
  ACCEPTED:            { displayName: "Accepted",           icon: "CheckCircle",    color: "#22c55e", bgColor: "#052e16", category: "ASSIGNMENT" },
  ASSIGNED:            { displayName: "Assigned",           icon: "Truck",          color: "#06b6d4", bgColor: "#083344", category: "ASSIGNMENT" },
  CONFIRMED:           { displayName: "Confirmed",          icon: "ThumbsUp",       color: "#10b981", bgColor: "#064e3b", category: "ASSIGNMENT" },
  EN_ROUTE_PICKUP:     { displayName: "En Route Pickup",    icon: "Navigation",     color: "#3b82f6", bgColor: "#1e3a5f", category: "EXECUTION" },
  AT_PICKUP:           { displayName: "At Pickup",          icon: "MapPin",         color: "#f59e0b", bgColor: "#451a03", category: "EXECUTION" },
  PICKUP_CHECKIN:      { displayName: "Pickup Check-In",    icon: "KeyRound",       color: "#8b5cf6", bgColor: "#2e1065", category: "EXECUTION" },
  LOADING:             { displayName: "Loading",            icon: "Package",        color: "#f97316", bgColor: "#431407", category: "EXECUTION" },
  LOADING_EXCEPTION:   { displayName: "Loading Exception",  icon: "AlertTriangle",  color: "#ef4444", bgColor: "#450a0a", category: "EXECUTION", isException: true },
  LOADED:              { displayName: "Loaded",             icon: "CheckCircle",    color: "#22c55e", bgColor: "#052e16", category: "EXECUTION" },
  IN_TRANSIT:          { displayName: "In Transit",         icon: "Truck",          color: "#3b82f6", bgColor: "#1e3a5f", category: "EXECUTION" },
  TRANSIT_HOLD:        { displayName: "Transit Hold",       icon: "Pause",          color: "#f59e0b", bgColor: "#451a03", category: "EXECUTION" },
  TRANSIT_EXCEPTION:   { displayName: "Transit Exception",  icon: "Siren",          color: "#ef4444", bgColor: "#450a0a", category: "EXECUTION", isException: true },
  AT_DELIVERY:         { displayName: "At Delivery",        icon: "MapPin",         color: "#10b981", bgColor: "#064e3b", category: "EXECUTION" },
  DELIVERY_CHECKIN:    { displayName: "Delivery Check-In",  icon: "KeyRound",       color: "#8b5cf6", bgColor: "#2e1065", category: "EXECUTION" },
  UNLOADING:           { displayName: "Unloading",          icon: "Package",        color: "#f97316", bgColor: "#431407", category: "EXECUTION" },
  UNLOADING_EXCEPTION: { displayName: "Unloading Exception",icon: "AlertTriangle",  color: "#ef4444", bgColor: "#450a0a", category: "EXECUTION", isException: true },
  UNLOADED:            { displayName: "Unloaded",           icon: "CheckCircle",    color: "#22c55e", bgColor: "#052e16", category: "EXECUTION" },
  POD_PENDING:         { displayName: "POD Pending",        icon: "ClipboardCheck", color: "#8b5cf6", bgColor: "#2e1065", category: "COMPLETION" },
  POD_REJECTED:        { displayName: "POD Rejected",       icon: "RefreshCw",      color: "#ef4444", bgColor: "#450a0a", category: "COMPLETION", isException: true },
  DELIVERED:           { displayName: "Delivered",          icon: "CheckCircle2",   color: "#22c55e", bgColor: "#052e16", category: "COMPLETION" },
  INVOICED:            { displayName: "Invoiced",           icon: "FileText",       color: "#06b6d4", bgColor: "#083344", category: "FINANCIAL" },
  DISPUTED:            { displayName: "Disputed",           icon: "Zap",            color: "#ef4444", bgColor: "#450a0a", category: "FINANCIAL", isException: true },
  PAID:                { displayName: "Paid",               icon: "DollarSign",     color: "#22c55e", bgColor: "#052e16", category: "FINANCIAL" },
  COMPLETE:            { displayName: "Complete",           icon: "Flag",           color: "#10b981", bgColor: "#064e3b", category: "FINANCIAL", isFinal: true },
  CANCELLED:           { displayName: "Cancelled",          icon: "Ban",            color: "#6b7280", bgColor: "#1f2937", category: "EXCEPTION", isFinal: true },
  ON_HOLD:             { displayName: "On Hold",            icon: "Hand",           color: "#f59e0b", bgColor: "#451a03", category: "EXCEPTION", isException: true },
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

const ICON_SIZES: Record<string, number> = { xs: 10, sm: 12, md: 14, lg: 16 };

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
    displayName: state, icon: "HelpCircle", color: "#6b7280", bgColor: "#1f2937", category: "EXCEPTION",
  };

  const isActive = ACTIVE_STATES.has(normalized) && animated;
  const IconComponent = ICON_MAP[meta.icon] || HelpCircle;
  const iconPx = ICON_SIZES[size] || 14;

  const sizeClasses: Record<string, string> = {
    xs: "text-[10px] px-1.5 py-0.5 gap-0.5",
    sm: "text-xs px-2 py-0.5 gap-1",
    md: "text-sm px-2.5 py-1 gap-1.5",
    lg: "text-base px-3 py-1.5 gap-2",
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
      {showIcon && <IconComponent size={iconPx} />}
      {showLabel && <span>{meta.displayName}</span>}
    </motion.span>
  );
}

export { STATE_META, ICON_MAP };
