/**
 * ACCOUNT STATUS PAGE — Shows approval progress, verification checklist,
 * and what's available/locked. Accessible to all users regardless of approval.
 */

import { useAuth } from "@/_core/hooks/useAuth";
import { getApprovalStatus, getApprovalChecklist, getStatusLabel, type ApprovalStatus } from "@/lib/approvalGating";
import { motion } from "framer-motion";
import {
  Shield, Clock, CheckCircle, XCircle, Lock, ArrowLeft,
  AlertTriangle, User, Mail, Building2, FileText, Truck,
  MessageSquare, Newspaper, Settings, LayoutDashboard,
  Sparkles, Wallet, BarChart3, Package
} from "lucide-react";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";

export default function AccountStatus() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [, navigate] = useLocation();
  const status = getApprovalStatus(user);
  const role = user?.role || "DRIVER";
  const checklist = getApprovalChecklist(role);
  const statusLabel = getStatusLabel(status);

  const isPending = status === "pending_review";
  const isSuspended = status === "suspended";
  const isApproved = status === "approved";

  const statusConfig = {
    pending_review: {
      gradient: "from-amber-500/20 to-orange-500/20",
      border: "border-amber-500/30",
      iconBg: "bg-amber-500/20",
      icon: Clock,
      iconColor: "text-amber-400",
      badgeBg: "bg-amber-500/10 border-amber-500/20",
      badgeText: "text-amber-300",
      badgeDot: "bg-amber-400",
      title: "Account Under Review",
      subtitle: "Your registration is being reviewed by our compliance team. This process typically takes 1-2 business days.",
    },
    approved: {
      gradient: "from-emerald-500/20 to-green-500/20",
      border: "border-emerald-500/30",
      iconBg: "bg-emerald-500/20",
      icon: CheckCircle,
      iconColor: "text-emerald-400",
      badgeBg: "bg-emerald-500/10 border-emerald-500/20",
      badgeText: "text-emerald-300",
      badgeDot: "bg-emerald-400",
      title: "Account Approved",
      subtitle: "Your account has been verified and approved. All features are unlocked.",
    },
    suspended: {
      gradient: "from-red-500/20 to-rose-500/20",
      border: "border-red-500/30",
      iconBg: "bg-red-500/20",
      icon: AlertTriangle,
      iconColor: "text-red-400",
      badgeBg: "bg-red-500/10 border-red-500/20",
      badgeText: "text-red-300",
      badgeDot: "bg-red-400",
      title: "Account Suspended",
      subtitle: "Your account access has been temporarily suspended. Please contact support for assistance.",
    },
  };

  const cfg = statusConfig[status];
  const StatusIcon = cfg.icon;

  const accessibleNow = [
    { icon: LayoutDashboard, label: "Dashboard", desc: "View your overview" },
    { icon: User, label: "Profile", desc: "Update your information" },
    { icon: Settings, label: "Settings", desc: "Account preferences" },
    { icon: MessageSquare, label: "Messages", desc: "Send & receive messages" },
    { icon: Newspaper, label: "News", desc: "Industry news feed" },
    { icon: Shield, label: "Support", desc: "Get help anytime" },
  ];

  const lockedUntilApproved = [
    { icon: Package, label: "Loads & Marketplace", desc: "Find and post loads" },
    { icon: Truck, label: "Fleet Management", desc: "Manage your fleet" },
    { icon: Sparkles, label: "ESANG AI", desc: "AI-powered assistant" },
    { icon: Wallet, label: "Wallet & Billing", desc: "Payments and invoicing" },
    { icon: BarChart3, label: "Analytics", desc: "Performance insights" },
    { icon: FileText, label: "Agreements", desc: "Contracts and documents" },
  ];

  const cl = cn(
    "rounded-2xl border p-6",
    isLight ? "bg-white border-gray-200" : "bg-gray-900/80 backdrop-blur-xl border-gray-800/60"
  );
  const vl = isLight ? "text-gray-900" : "text-white";
  const sl = isLight ? "text-gray-500" : "text-gray-400";

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className={cn(cl, "text-center")}
      >
        <motion.div
          animate={isPending ? { scale: [1, 1.05, 1] } : {}}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className={cn(
            "w-20 h-20 mx-auto mb-6 rounded-full border flex items-center justify-center",
            `bg-gradient-to-br ${cfg.gradient} ${cfg.border}`
          )}
        >
          <StatusIcon className={cn("w-10 h-10", cfg.iconColor)} />
        </motion.div>

        <h1 className={cn("text-2xl font-bold mb-2", vl)}>{cfg.title}</h1>
        <p className={cn("text-sm leading-relaxed mb-6", sl)}>{cfg.subtitle}</p>

        <div className={cn("inline-flex items-center gap-2 px-4 py-2 rounded-full border", cfg.badgeBg)}>
          <div className={cn("w-2 h-2 rounded-full", cfg.badgeDot, isPending && "animate-pulse")} />
          <span className={cn("text-sm font-medium", cfg.badgeText)}>{statusLabel}</span>
        </div>

        {/* User info summary */}
        <div className={cn(
          "mt-6 pt-6 border-t flex items-center justify-center gap-6 text-xs",
          isLight ? "border-gray-100" : "border-gray-800"
        )}>
          <div className="flex items-center gap-1.5">
            <User className={cn("w-3.5 h-3.5", sl)} />
            <span className={sl}>{user?.username || user?.email || "User"}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Shield className={cn("w-3.5 h-3.5", sl)} />
            <span className={sl}>{role}</span>
          </div>
          {user?.email && (
            <div className="flex items-center gap-1.5">
              <Mail className={cn("w-3.5 h-3.5", sl)} />
              <span className={sl}>{user.email}</span>
            </div>
          )}
        </div>
      </motion.div>

      {/* Verification Checklist */}
      {!isApproved && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className={cl}
        >
          <h2 className={cn("text-sm font-semibold uppercase tracking-wider mb-4", sl)}>
            Verification Progress
          </h2>
          <div className="space-y-3">
            {checklist.map((item, index) => {
              const isComplete = index === 0;
              const isInProgress = index === 1 && isPending;
              return (
                <motion.div
                  key={item.key}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 + index * 0.08 }}
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
                  ) : isSuspended ? (
                    <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                  ) : (
                    <div className={cn(
                      "w-5 h-5 rounded-full border-2 flex-shrink-0",
                      isLight ? "border-gray-300" : "border-gray-600"
                    )} />
                  )}
                  <span className={cn(
                    "text-sm",
                    isComplete ? (isLight ? "text-gray-700" : "text-gray-300") :
                    isInProgress ? "text-amber-300" :
                    isSuspended ? "text-red-400/60" :
                    (isLight ? "text-gray-400" : "text-gray-500")
                  )}>
                    {item.label}
                  </span>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Access Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Available Now */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className={cl}
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 rounded-full bg-emerald-500/15 flex items-center justify-center">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <h2 className={cn("text-sm font-semibold", vl)}>Available Now</h2>
          </div>
          <div className="space-y-2.5">
            {accessibleNow.map((item) => (
              <div key={item.label} className="flex items-center gap-2.5">
                <item.icon className={cn("w-4 h-4 flex-shrink-0", isLight ? "text-gray-400" : "text-gray-500")} />
                <div className="min-w-0">
                  <p className={cn("text-xs font-medium", vl)}>{item.label}</p>
                  <p className={cn("text-[10px]", sl)}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Locked Until Approved */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className={cl}
        >
          <div className="flex items-center gap-2 mb-4">
            <div className={cn("w-6 h-6 rounded-full flex items-center justify-center", isApproved ? "bg-emerald-500/15" : "bg-gray-500/15")}>
              {isApproved
                ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                : <Lock className="w-3.5 h-3.5 text-gray-500" />
              }
            </div>
            <h2 className={cn("text-sm font-semibold", vl)}>
              {isApproved ? "Full Access" : "Unlocks After Approval"}
            </h2>
          </div>
          <div className="space-y-2.5">
            {lockedUntilApproved.map((item) => (
              <div key={item.label} className={cn("flex items-center gap-2.5", !isApproved && "opacity-50")}>
                <item.icon className={cn("w-4 h-4 flex-shrink-0", isApproved ? (isLight ? "text-gray-400" : "text-gray-500") : "text-gray-600")} />
                <div className="min-w-0">
                  <p className={cn("text-xs font-medium", isApproved ? vl : (isLight ? "text-gray-400" : "text-gray-500"))}>{item.label}</p>
                  <p className={cn("text-[10px]", isApproved ? sl : "text-gray-600")}>{item.desc}</p>
                </div>
                {!isApproved && <Lock className="w-3 h-3 text-gray-600 ml-auto flex-shrink-0" />}
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Action buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="flex gap-3"
      >
        <button
          onClick={() => navigate("/")}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-colors",
            isLight ? "bg-gray-100 hover:bg-gray-200 text-gray-700" : "bg-gray-800 hover:bg-gray-700 text-gray-300"
          )}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>
        {!isApproved && (
          <button
            onClick={() => navigate("/support")}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-[#1473FF] to-[#BE01FF] hover:opacity-90 text-white text-sm font-medium transition-opacity"
          >
            Contact Support
          </button>
        )}
      </motion.div>
    </div>
  );
}
