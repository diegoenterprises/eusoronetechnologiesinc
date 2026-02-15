/**
 * APPROVAL GATE COMPONENT
 * Shows an approval status screen when users try to access gated features.
 * Replaces the page content with a firm but professional waiting screen.
 */

import { useAuth } from "@/_core/hooks/useAuth";
import { getApprovalStatus, getApprovalChecklist, getStatusLabel, type ApprovalStatus } from "@/lib/approvalGating";
import { motion } from "framer-motion";
import { Shield, Clock, CheckCircle, XCircle, Lock, ArrowLeft, AlertTriangle } from "lucide-react";
import { useLocation } from "wouter";

interface ApprovalGateProps {
  children: React.ReactNode;
}

export default function ApprovalGate({ children }: ApprovalGateProps) {
  const { user } = useAuth();
  const status = getApprovalStatus(user);

  if (status === "approved") {
    return <>{children}</>;
  }

  if (status === "suspended") {
    return <SuspendedScreen />;
  }

  return <PendingReviewScreen role={user?.role || "DRIVER"} />;
}

function PendingReviewScreen({ role }: { role: string }) {
  const [, navigate] = useLocation();
  const checklist = getApprovalChecklist(role);

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-lg w-full"
      >
        {/* Header card */}
        <div className="bg-gray-900/80 backdrop-blur-xl border border-gray-800/60 rounded-2xl p-8 text-center mb-6">
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 flex items-center justify-center"
          >
            <Clock className="w-10 h-10 text-amber-400" />
          </motion.div>

          <h1 className="text-2xl font-bold text-white mb-2">
            Account Under Review
          </h1>
          <p className="text-gray-400 text-sm leading-relaxed mb-6">
            Your registration is being reviewed by our compliance team.
            This process typically takes 1-2 business days. You can explore
            your dashboard, update your profile, and send messages while you wait.
          </p>

          {/* Status badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20">
            <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-amber-300 text-sm font-medium">Pending Review</span>
          </div>
        </div>

        {/* Verification checklist */}
        <div className="bg-gray-900/80 backdrop-blur-xl border border-gray-800/60 rounded-2xl p-6 mb-6">
          <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">
            Verification Progress
          </h2>
          <div className="space-y-3">
            {checklist.map((item, index) => {
              const isComplete = index === 0; // Only "Account created" is done
              const isInProgress = index === 1;
              return (
                <motion.div
                  key={item.key}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center gap-3"
                >
                  {isComplete ? (
                    <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                  ) : isInProgress ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="w-5 h-5 flex-shrink-0"
                    >
                      <Clock className="w-5 h-5 text-amber-400" />
                    </motion.div>
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-gray-600 flex-shrink-0" />
                  )}
                  <span className={`text-sm ${isComplete ? "text-gray-300" : isInProgress ? "text-amber-300" : "text-gray-500"}`}>
                    {item.label}
                  </span>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* What you can do */}
        <div className="bg-gray-900/80 backdrop-blur-xl border border-gray-800/60 rounded-2xl p-6 mb-6">
          <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-3">
            While You Wait
          </h2>
          <ul className="space-y-2 text-sm text-gray-400">
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              Complete your profile information
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              Explore the dashboard and settings
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              Send and receive messages
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              Read platform news and updates
            </li>
            <li className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-gray-500 flex-shrink-0" />
              <span className="text-gray-500">Loads, marketplace, and billing unlock after approval</span>
            </li>
            <li className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-gray-500 flex-shrink-0" />
              <span className="text-gray-500">ESANG AI unlocks after approval</span>
            </li>
          </ul>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3">
          <button
            onClick={() => navigate("/")}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
          <button
            onClick={() => navigate("/support")}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white text-sm font-medium transition-colors"
          >
            Contact Support
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function SuspendedScreen() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-lg w-full"
      >
        <div className="bg-gray-900/80 backdrop-blur-xl border border-red-900/30 rounded-2xl p-8 text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center">
            <AlertTriangle className="w-10 h-10 text-red-400" />
          </div>

          <h1 className="text-2xl font-bold text-white mb-2">
            Account Suspended
          </h1>
          <p className="text-gray-400 text-sm leading-relaxed mb-6">
            Your account access has been temporarily suspended.
            This may be due to a compliance review, missing documentation,
            or a policy violation. Please contact our support team for assistance.
          </p>

          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/10 border border-red-500/20 mb-6">
            <XCircle className="w-4 h-4 text-red-400" />
            <span className="text-red-300 text-sm font-medium">Suspended</span>
          </div>

          <div className="flex gap-3 mt-4">
            <button
              onClick={() => navigate("/")}
              className="flex-1 px-4 py-3 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-medium transition-colors"
            >
              Back to Dashboard
            </button>
            <button
              onClick={() => navigate("/support")}
              className="flex-1 px-4 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-medium transition-colors"
            >
              Contact Support
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

/**
 * Inline gate — renders directly inside the main content area
 * when a pending/suspended user navigates to a gated route.
 */
export function ApprovalGateInline() {
  const { user } = useAuth();
  const status = getApprovalStatus(user);

  if (status === "suspended") return <SuspendedScreen />;
  return <PendingReviewScreen role={user?.role || "DRIVER"} />;
}

/**
 * Inline approval banner for the dashboard
 */
export function ApprovalBanner() {
  const { user } = useAuth();
  const status = getApprovalStatus(user);
  const [, navigate] = useLocation();

  if (status === "approved") return null;

  if (status === "suspended") {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-4 mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3"
      >
        <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-medium text-red-300">Account Suspended</p>
          <p className="text-xs text-red-400/70">Contact support to resolve this issue.</p>
        </div>
        <button
          onClick={() => navigate("/support")}
          className="px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 text-xs font-medium transition-colors"
        >
          Support
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-4 mt-4 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-3"
    >
      <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
        <Clock className="w-4 h-4 text-amber-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-amber-300">Account Under Review</p>
        <p className="text-xs text-amber-400/70 truncate">Some features are locked until your account is approved.</p>
      </div>
      <button
        onClick={() => navigate("/profile")}
        className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-medium transition-colors whitespace-nowrap"
      >
        View Status
      </button>
    </motion.div>
  );
}
