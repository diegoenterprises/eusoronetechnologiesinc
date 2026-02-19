/**
 * LoadProgressTimeline — Visual journey of a load through its lifecycle
 *
 * Shows completed, current, and upcoming states as a clean horizontal or
 * vertical timeline with timestamps and actor info.
 */

import { motion } from "framer-motion";
import { STATE_META } from "./LoadStatusBadge";

// Canonical display order (happy path)
const HAPPY_PATH: string[] = [
  "DRAFT", "POSTED", "BIDDING", "AWARDED", "ACCEPTED", "ASSIGNED", "CONFIRMED",
  "EN_ROUTE_PICKUP", "AT_PICKUP", "LOADING", "LOADED",
  "IN_TRANSIT",
  "AT_DELIVERY", "UNLOADING", "UNLOADED",
  "POD_PENDING", "DELIVERED",
  "INVOICED", "PAID", "COMPLETE",
];

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
      <div className={`flex flex-col gap-0 ${className}`}>
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
            <div key={state} className="flex items-stretch gap-3">
              {/* Connector line + dot */}
              <div className="flex flex-col items-center w-6">
                {i > 0 && (
                  <div
                    className="w-0.5 flex-1 min-h-[12px]"
                    style={{ backgroundColor: isPast || isCompleted ? meta.color : "#334155" }}
                  />
                )}
                <motion.div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{
                    backgroundColor: isCurrent ? meta.color : isCompleted ? meta.color : "#334155",
                    border: isCurrent ? `2px solid ${meta.color}` : "none",
                    boxShadow: isCurrent ? `0 0 8px ${meta.color}60` : "none",
                  }}
                  animate={isCurrent ? { scale: [1, 1.3, 1] } : {}}
                  transition={isCurrent ? { duration: 2, repeat: Infinity } : {}}
                />
                {i < milestones.length - 1 && (
                  <div
                    className="w-0.5 flex-1 min-h-[12px]"
                    style={{ backgroundColor: isPast || isCompleted ? meta.color : "#334155" }}
                  />
                )}
              </div>

              {/* Label */}
              <div className={`pb-3 pt-1 ${isFuture ? "opacity-40" : ""}`}>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm">{meta.icon}</span>
                  <span
                    className={`text-sm font-medium ${isCurrent ? "text-white" : isCompleted ? "text-gray-300" : "text-gray-500"}`}
                  >
                    {meta.displayName}
                  </span>
                </div>
                {ts && (
                  <p className="text-[10px] text-gray-500 mt-0.5 pl-6">
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
    <div className={`flex items-center gap-0 overflow-x-auto pb-2 ${className}`}>
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
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm"
                style={{
                  backgroundColor: isCurrent ? meta.bgColor : isCompleted ? `${meta.color}20` : "#1e293b",
                  border: `2px solid ${isCurrent ? meta.color : isCompleted ? meta.color : "#334155"}`,
                  boxShadow: isCurrent ? `0 0 12px ${meta.color}40` : "none",
                }}
                animate={isCurrent ? { scale: [1, 1.1, 1] } : {}}
                transition={isCurrent ? { duration: 2, repeat: Infinity } : {}}
              >
                {meta.icon}
              </motion.div>
              {!compact && (
                <span
                  className={`text-[9px] mt-1 font-medium text-center max-w-[56px] leading-tight ${
                    isCurrent ? "text-white" : isCompleted ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  {meta.displayName}
                </span>
              )}
            </div>

            {/* Connector */}
            {i < milestones.length - 1 && (
              <div
                className="h-0.5 w-4 mx-0.5 flex-shrink-0"
                style={{
                  backgroundColor: isPast || isCompleted ? meta.color : "#334155",
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
