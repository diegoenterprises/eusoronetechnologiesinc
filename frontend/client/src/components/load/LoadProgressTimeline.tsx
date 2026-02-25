/**
 * LoadProgressTimeline — Visual journey of a load through its lifecycle
 *
 * Shows completed, current, and upcoming states as a clean horizontal or
 * vertical timeline with timestamps and actor info.
 */

import { motion } from "framer-motion";
import { HelpCircle } from "lucide-react";
import { STATE_META, ICON_MAP } from "./LoadStatusBadge";

// Canonical display order (happy path)
const HAPPY_PATH: string[] = [
  "DRAFT", "POSTED", "BIDDING", "AWARDED", "ACCEPTED", "ASSIGNED", "CONFIRMED",
  "EN_ROUTE_PICKUP", "AT_PICKUP", "LOADING", "LOADED",
  "IN_TRANSIT",
  "AT_DELIVERY", "UNLOADING", "UNLOADED",
  "POD_PENDING", "DELIVERED",
  "INVOICED", "PAID", "COMPLETE",
];

const GRADIENT_BG = "linear-gradient(135deg, #1473FF, #BE01FF)";
const GRADIENT_TEXT: Record<string, string> = { background: GRADIENT_BG, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" };
const GRAD_GLOW = "0 0 14px rgba(20,115,255,0.5), 0 0 14px rgba(190,1,255,0.3)";
const GradSvgDefs = () => (
  <svg width="0" height="0" aria-hidden="true" className="absolute pointer-events-none">
    <defs>
      <linearGradient id="tl-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#1473FF" />
        <stop offset="100%" stopColor="#BE01FF" />
      </linearGradient>
    </defs>
  </svg>
);

interface HistoryEntry {
  fromState?: string;
  toState: string;
  actorName?: string;
  actorRole?: string;
  createdAt?: string;
}

interface LoadProgressTimelineProps {
  currentState: string;
  stateHistory?: HistoryEntry[];
  variant?: "horizontal" | "vertical";
  compact?: boolean;
  className?: string;
}

export default function LoadProgressTimeline({
  currentState,
  stateHistory = [],
  variant = "horizontal",
  compact = false,
  className = "",
}: LoadProgressTimelineProps) {
  const normalized = currentState.toUpperCase().replace(/-/g, "_");

  // Build visited set from history
  const visitedStates = new Set<string>();
  const timestamps: Record<string, string> = {};
  const actors: Record<string, string> = {};
  for (const entry of stateHistory) {
    const s = entry.toState.toUpperCase().replace(/-/g, "_");
    visitedStates.add(s);
    if (entry.createdAt) timestamps[s] = entry.createdAt;
    if (entry.actorName) actors[s] = entry.actorName;
  }
  visitedStates.add(normalized);

  // Determine which milestones to show
  const currentIdx = HAPPY_PATH.indexOf(normalized);
  const milestones = compact
    ? HAPPY_PATH.filter((_, i) => i % 3 === 0 || i === HAPPY_PATH.length - 1 || HAPPY_PATH[i] === normalized)
    : HAPPY_PATH;

  if (variant === "vertical") {
    return (
      <div className={`relative flex flex-col gap-0 ${className}`}>
        <GradSvgDefs />
        {milestones.map((state, i) => {
          const meta = STATE_META[state];
          if (!meta) return null;
          const idx = HAPPY_PATH.indexOf(state);
          const isCurrent = state === normalized;
          const isCompleted = visitedStates.has(state) && !isCurrent;
          const isPast = idx < currentIdx;
          const isFuture = !isCompleted && !isCurrent;
          const ts = timestamps[state];

          return (
            <div key={state} className={`flex items-stretch gap-3 ${isFuture ? "opacity-40" : ""}`}>
              {/* Connector line + dot */}
              <div className="flex flex-col items-center w-6">
                {i > 0 && (
                  <div
                    className={`w-0.5 flex-1 min-h-[12px] ${isPast || isCompleted ? "" : "bg-slate-300 dark:bg-slate-700"}`}
                    style={isPast || isCompleted ? { background: GRADIENT_BG } : undefined}
                  />
                )}
                <motion.div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{
                    background: GRADIENT_BG,
                    boxShadow: isCurrent ? GRAD_GLOW : "none",
                  }}
                  animate={isCurrent ? { scale: [1, 1.3, 1] } : {}}
                  transition={isCurrent ? { duration: 2, repeat: Infinity } : {}}
                />
                {i < milestones.length - 1 && (
                  <div
                    className={`w-0.5 flex-1 min-h-[12px] ${isPast || isCompleted ? "" : "bg-slate-300 dark:bg-slate-700"}`}
                    style={isPast || isCompleted ? { background: GRADIENT_BG } : undefined}
                  />
                )}
              </div>

              {/* Label */}
              <div className="pb-3 pt-1">
                <div className="flex items-center gap-1.5">
                  {(() => { const IC = ICON_MAP[meta.icon] || HelpCircle; return <IC size={14} style={{ color: meta.color }} />; })()}
                  <span className="text-sm font-medium" style={GRADIENT_TEXT}>
                    {meta.displayName}
                  </span>
                </div>
                {ts && (
                  <p className="text-[10px] text-slate-500 dark:text-gray-500 mt-0.5 pl-6">
                    {new Date(ts).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    {actors[state] ? ` · ${actors[state]}` : ""}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // Horizontal variant
  return (
    <div className={`relative flex items-center gap-0 overflow-x-auto pb-2 ${className}`}>
      <GradSvgDefs />
      {milestones.map((state, i) => {
        const meta = STATE_META[state];
        if (!meta) return null;
        const idx = HAPPY_PATH.indexOf(state);
        const isCurrent = state === normalized;
        const isCompleted = visitedStates.has(state) && !isCurrent;
        const isPast = idx < currentIdx;
        const isFuture = !isCompleted && !isCurrent;

        return (
          <div key={state} className="flex items-center flex-shrink-0">
            {/* Node */}
            <div className={`flex flex-col items-center ${isFuture ? "opacity-30" : ""}`}>
              <motion.div
                className="w-8 h-8 rounded-full p-[2px]"
                style={{
                  background: GRADIENT_BG,
                  boxShadow: isCurrent ? GRAD_GLOW : "none",
                }}
                animate={isCurrent ? { scale: [1, 1.1, 1] } : {}}
                transition={isCurrent ? { duration: 2, repeat: Infinity } : {}}
              >
                <div className="w-full h-full rounded-full flex items-center justify-center bg-white dark:bg-slate-900">
                  {(() => { const IC = ICON_MAP[meta.icon] || HelpCircle; return <IC size={14} style={{ color: meta.color }} />; })()}
                </div>
              </motion.div>
              {!compact && (
                <span
                  className="text-[9px] mt-1 font-medium text-center max-w-[56px] leading-tight"
                  style={GRADIENT_TEXT}
                >
                  {meta.displayName}
                </span>
              )}
            </div>

            {/* Connector */}
            {i < milestones.length - 1 && (
              <div
                className={`h-0.5 w-4 mx-0.5 flex-shrink-0 ${isPast || isCompleted ? "" : "bg-slate-300 dark:bg-slate-700"}`}
                style={isPast || isCompleted ? { background: GRADIENT_BG } : undefined}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
