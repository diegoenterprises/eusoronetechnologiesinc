/**
 * OfflineSyncBar — Global sync status indicator for the web app
 *
 * Shows connection status, pending actions, sync progress, and failed count.
 * Sticky bar at the top of the viewport when offline or syncing.
 */

import { useState } from "react";
import { useOfflineSync } from "@/hooks/useOfflineSync";
import {
  Cloud, CloudOff, RefreshCw, AlertTriangle, CheckCircle, WifiOff, Loader2,
} from "lucide-react";

export function OfflineSyncBar() {
  const {
    isOnline, isSyncing, pendingCount, failedCount,
    lastSyncedAt, connectionQuality, syncProgress, totalToSync,
    forceSync,
  } = useOfflineSync();
  const [expanded, setExpanded] = useState(false);

  // Don't show if online, not syncing, and nothing pending
  if (isOnline && !isSyncing && pendingCount === 0 && failedCount === 0) {
    return null;
  }

  const formatTimeAgo = (date: Date | null): string => {
    if (!date) return "Never";
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return "Just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  const getBgColor = () => {
    if (!isOnline) return "bg-amber-50 border-amber-200";
    if (failedCount > 0) return "bg-red-50 border-red-200";
    if (isSyncing) return "bg-blue-50 border-blue-200";
    return "bg-emerald-50 border-emerald-200";
  };

  const getTextColor = () => {
    if (!isOnline) return "text-amber-800";
    if (failedCount > 0) return "text-red-800";
    if (isSyncing) return "text-blue-800";
    return "text-emerald-800";
  };

  return (
    <div className={`sticky top-0 z-50 border-b px-4 py-2 ${getBgColor()} transition-all duration-300`}>
      <div className="flex items-center justify-between max-w-screen-2xl mx-auto">
        {/* Left: Status */}
        <div className="flex items-center gap-2">
          {!isOnline ? (
            <WifiOff className="h-4 w-4 text-amber-600" />
          ) : isSyncing ? (
            <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
          ) : failedCount > 0 ? (
            <AlertTriangle className="h-4 w-4 text-red-600" />
          ) : (
            <Cloud className="h-4 w-4 text-emerald-600" />
          )}

          <span className={`text-sm font-medium ${getTextColor()}`}>
            {!isOnline
              ? "You're offline"
              : isSyncing
                ? `Syncing ${syncProgress}/${totalToSync}...`
                : failedCount > 0
                  ? `${failedCount} action${failedCount !== 1 ? "s" : ""} failed`
                  : `${pendingCount} pending`}
          </span>

          {pendingCount > 0 && !isOnline && (
            <span className="text-xs text-amber-600 ml-1">
              ({pendingCount} action{pendingCount !== 1 ? "s" : ""} will sync when reconnected)
            </span>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          {connectionQuality !== "offline" && connectionQuality !== "good" && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">
              {connectionQuality === "slow" ? "Slow connection" : "Poor connection"}
            </span>
          )}

          {lastSyncedAt && (
            <span className="text-xs text-gray-500">
              Last sync: {formatTimeAgo(lastSyncedAt)}
            </span>
          )}

          {isOnline && !isSyncing && pendingCount > 0 && (
            <button
              onClick={forceSync}
              className="flex items-center gap-1 text-xs font-medium text-blue-700 hover:text-blue-900 px-2 py-1 rounded hover:bg-blue-100 transition-colors"
            >
              <RefreshCw className="h-3 w-3" />
              Sync Now
            </button>
          )}

          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs text-gray-500 hover:text-gray-700"
          >
            {expanded ? "Hide" : "Details"}
          </button>
        </div>
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className="mt-2 pt-2 border-t border-gray-200/50 max-w-screen-2xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full ${isOnline ? "bg-emerald-500" : "bg-amber-500"}`} />
              <span className="text-gray-600">Status:</span>
              <span className="font-medium">{isOnline ? "Online" : "Offline"}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Cloud className="h-3 w-3 text-blue-500" />
              <span className="text-gray-600">Pending:</span>
              <span className="font-medium">{pendingCount}</span>
            </div>
            <div className="flex items-center gap-1.5">
              {failedCount > 0 ? (
                <AlertTriangle className="h-3 w-3 text-red-500" />
              ) : (
                <CheckCircle className="h-3 w-3 text-emerald-500" />
              )}
              <span className="text-gray-600">Failed:</span>
              <span className={`font-medium ${failedCount > 0 ? "text-red-600" : ""}`}>{failedCount}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <RefreshCw className="h-3 w-3 text-gray-400" />
              <span className="text-gray-600">Quality:</span>
              <span className="font-medium capitalize">{connectionQuality}</span>
            </div>
          </div>

          {/* Sync Progress Bar */}
          {isSyncing && totalToSync > 0 && (
            <div className="mt-2">
              <div className="h-1.5 bg-blue-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all duration-300"
                  style={{ width: `${Math.round((syncProgress / totalToSync) * 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
