/**
 * PrimaryActionButton — The single most important action for a load's current state
 *
 * Fixed at the bottom of the screen, prominent, with confirmation dialog,
 * loading state, and success animation.
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send, Award, CheckCircle, ThumbsUp, Navigation, LogIn, Package,
  Truck, Clock, Play, AlertTriangle, FileCheck, DollarSign, XCircle,
  Pause, Upload, RefreshCw, Check, X, UserPlus, CheckCircle2,
  AlertCircle, Loader2,
} from "lucide-react";

const ICON_MAP: Record<string, React.ReactNode> = {
  Send: <Send size={18} />,
  Award: <Award size={18} />,
  Check: <Check size={18} />,
  CheckCircle: <CheckCircle size={18} />,
  CheckCircle2: <CheckCircle2 size={18} />,
  ThumbsUp: <ThumbsUp size={18} />,
  Navigation: <Navigation size={18} />,
  LogIn: <LogIn size={18} />,
  Package: <Package size={18} />,
  Truck: <Truck size={18} />,
  Clock: <Clock size={18} />,
  Play: <Play size={18} />,
  AlertTriangle: <AlertTriangle size={18} />,
  FileCheck: <FileCheck size={18} />,
  DollarSign: <DollarSign size={18} />,
  XCircle: <XCircle size={18} />,
  Pause: <Pause size={18} />,
  Upload: <Upload size={18} />,
  RefreshCw: <RefreshCw size={18} />,
  UserPlus: <UserPlus size={18} />,
  AlertCircle: <AlertCircle size={18} />,
  X: <X size={18} />,
};

interface UIAction {
  component: string;
  location: string;
  label: string;
  icon?: string;
  variant: "primary" | "secondary" | "danger" | "success";
  requiresConfirmation?: boolean;
  confirmationMessage?: string;
}

interface PrimaryActionButtonProps {
  action: UIAction;
  transitionId: string;
  disabled?: boolean;
  disabledReason?: string;
  loading?: boolean;
  onExecute: (transitionId: string) => void;
  className?: string;
}

const VARIANT_STYLES: Record<string, { bg: string; hover: string; text: string; glow: string }> = {
  primary: {
    bg: "bg-blue-600",
    hover: "hover:bg-blue-500",
    text: "text-white",
    glow: "0 0 20px rgba(59,130,246,0.3)",
  },
  secondary: {
    bg: "bg-gray-700",
    hover: "hover:bg-gray-600",
    text: "text-gray-200",
    glow: "none",
  },
  danger: {
    bg: "bg-red-600",
    hover: "hover:bg-red-500",
    text: "text-white",
    glow: "0 0 20px rgba(239,68,68,0.3)",
  },
  success: {
    bg: "bg-emerald-600",
    hover: "hover:bg-emerald-500",
    text: "text-white",
    glow: "0 0 20px rgba(16,185,129,0.3)",
  },
};

export default function PrimaryActionButton({
  action,
  transitionId,
  disabled = false,
  disabledReason,
  loading = false,
  onExecute,
  className = "",
}: PrimaryActionButtonProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showDisabledTip, setShowDisabledTip] = useState(false);

  const style = VARIANT_STYLES[action.variant] || VARIANT_STYLES.primary;
  const icon = action.icon ? ICON_MAP[action.icon] : null;

  const handleClick = () => {
    if (disabled) {
      setShowDisabledTip(true);
      setTimeout(() => setShowDisabledTip(false), 3000);
      return;
    }
    if (action.requiresConfirmation) {
      setShowConfirm(true);
    } else {
      handleExecute();
    }
  };

  const handleExecute = () => {
    setShowConfirm(false);
    onExecute(transitionId);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);
  };

  if (action.location === "automatic") return null;

  return (
    <>
      {/* Disabled tooltip */}
      <AnimatePresence>
        {showDisabledTip && disabledReason && (
          <motion.div
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-gray-800 border border-gray-700 rounded-xl shadow-xl max-w-sm"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
          >
            <p className="text-xs text-gray-300">{disabledReason}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirmation dialog */}
      <AnimatePresence>
        {showConfirm && (
          <motion.div
            className="fixed inset-0 z-50 flex items-end justify-center pb-6 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowConfirm(false)}
          >
            <motion.div
              className="bg-gray-900 border border-gray-700 rounded-2xl p-5 mx-4 max-w-md w-full shadow-2xl"
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <p className="text-sm text-gray-200 mb-4">
                {action.confirmationMessage || `Confirm: ${action.label}?`}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 py-2.5 rounded-xl bg-gray-800 text-gray-300 text-sm font-medium hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleExecute}
                  className={`flex-1 py-2.5 rounded-xl ${style.bg} ${style.text} text-sm font-medium ${style.hover} transition-colors`}
                >
                  {action.label}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main button */}
      <motion.button
        className={`
          flex items-center justify-center gap-2.5 w-full py-3.5 rounded-2xl
          text-base font-semibold transition-all duration-200
          ${disabled ? "bg-gray-800 text-gray-500 cursor-not-allowed" : `${style.bg} ${style.text} ${style.hover}`}
          ${className}
        `}
        style={{ boxShadow: disabled ? "none" : style.glow }}
        onClick={handleClick}
        disabled={loading}
        whileTap={disabled ? {} : { scale: 0.97 }}
      >
        {loading ? (
          <Loader2 size={18} className="animate-spin" />
        ) : showSuccess ? (
          <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}>
            <CheckCircle size={18} />
          </motion.span>
        ) : (
          icon
        )}
        <span>{showSuccess ? "Done" : action.label}</span>
      </motion.button>
    </>
  );
}
