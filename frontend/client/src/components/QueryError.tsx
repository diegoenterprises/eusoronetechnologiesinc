/**
 * WS-P1-009: Reusable error state for tRPC query failures
 * Use this component across all pages to handle API errors gracefully
 */
import { AlertTriangle, RotateCcw, Home } from "lucide-react";

interface QueryErrorProps {
  error?: { message?: string } | null;
  title?: string;
  message?: string;
  onRetry?: () => void;
  compact?: boolean;
}

export default function QueryError({
  error,
  title = "Something went wrong",
  message,
  onRetry,
  compact = false,
}: QueryErrorProps) {
  const errorMsg = message || error?.message || "We couldn't load this data. Please try again.";

  if (compact) {
    return (
      <div className="flex items-center gap-3 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
        <AlertTriangle size={18} className="text-red-400 shrink-0" />
        <p className="text-sm text-red-300 flex-1">{errorMsg}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md bg-red-500/20 text-red-300 hover:bg-red-500/30 transition-colors"
          >
            <RotateCcw size={12} />
            Retry
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-16 px-6">
      <div className="w-14 h-14 rounded-full bg-red-500/15 flex items-center justify-center mb-5">
        <AlertTriangle size={28} className="text-red-400" />
      </div>
      <h3 className="text-lg font-semibold text-white mb-1.5">{title}</h3>
      <p className="text-sm text-slate-400 text-center max-w-md mb-6">{errorMsg}</p>
      <div className="flex gap-3">
        {onRetry && (
          <button
            onClick={onRetry}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white text-sm font-medium hover:from-[#1260DD] hover:to-[#A801DD] transition-colors"
          >
            <RotateCcw size={14} />
            Try Again
          </button>
        )}
        <button
          onClick={() => (window.location.href = "/")}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-700 text-white text-sm hover:bg-slate-600 transition-colors"
        >
          <Home size={14} />
          Dashboard
        </button>
      </div>
    </div>
  );
}
