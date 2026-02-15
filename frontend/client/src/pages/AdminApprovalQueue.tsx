/**
 * ADMIN APPROVAL QUEUE
 * Where admins review, approve, and suspend user accounts.
 */

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle, XCircle, Clock, Shield, Users, Search,
  ChevronLeft, ChevronRight, AlertTriangle, Eye, UserCheck, Ban,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const ROLE_LABELS: Record<string, string> = {
  SHIPPER: "Shipper",
  CATALYST: "Catalyst",
  BROKER: "Broker",
  DRIVER: "Driver",
  DISPATCH: "Dispatch",
  ESCORT: "Escort",
  TERMINAL_MANAGER: "Terminal Mgr",
  COMPLIANCE_OFFICER: "Compliance",
  SAFETY_MANAGER: "Safety Mgr",
};

const ROLE_COLORS: Record<string, string> = {
  SHIPPER: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  CATALYST: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  BROKER: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  DRIVER: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  DISPATCH: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
  ESCORT: "bg-orange-500/20 text-orange-300 border-orange-500/30",
  TERMINAL_MANAGER: "bg-rose-500/20 text-rose-300 border-rose-500/30",
  COMPLIANCE_OFFICER: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
  SAFETY_MANAGER: "bg-teal-500/20 text-teal-300 border-teal-500/30",
};

export default function AdminApprovalQueue() {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string | undefined>();
  const [page, setPage] = useState(1);
  const [expandedUser, setExpandedUser] = useState<number | null>(null);
  const [approveNotes, setApproveNotes] = useState("");
  const [suspendReason, setSuspendReason] = useState("");

  const utils = trpc.useUtils();

  const statsQuery = (trpc as any).approval?.getStats?.useQuery(undefined, {
    staleTime: 10000,
  });

  const pendingQuery = (trpc as any).approval?.getPendingUsers?.useQuery(
    { page, limit: 25, role: roleFilter, search: search || undefined },
    { staleTime: 5000 }
  );

  const approveMutation = (trpc as any).approval?.approveUser?.useMutation({
    onSuccess: () => {
      toast.success("User approved successfully");
      (utils as any).approval?.getPendingUsers?.invalidate();
      (utils as any).approval?.getStats?.invalidate();
      setExpandedUser(null);
      setApproveNotes("");
    },
    onError: (e: any) => toast.error("Approval failed", { description: e.message }),
  });

  const suspendMutation = (trpc as any).approval?.suspendUser?.useMutation({
    onSuccess: () => {
      toast.success("User suspended");
      (utils as any).approval?.getPendingUsers?.invalidate();
      (utils as any).approval?.getStats?.invalidate();
      setExpandedUser(null);
      setSuspendReason("");
    },
    onError: (e: any) => toast.error("Suspension failed", { description: e.message }),
  });

  const stats = statsQuery?.data || { pending: 0, approved: 0, suspended: 0, total: 0 };
  const data = pendingQuery?.data || { items: [], total: 0, page: 1, totalPages: 1 };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Approval Queue</h1>
          <p className="text-sm text-gray-400 mt-1">Review and approve new user registrations</p>
        </div>
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-blue-400" />
          <span className="text-sm text-gray-400">Admin Access</span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Pending Review" value={stats.pending} icon={<Clock className="w-5 h-5" />} color="amber" />
        <StatCard label="Approved" value={stats.approved} icon={<CheckCircle className="w-5 h-5" />} color="emerald" />
        <StatCard label="Suspended" value={stats.suspended} icon={<XCircle className="w-5 h-5" />} color="red" />
        <StatCard label="Total Users" value={stats.total} icon={<Users className="w-5 h-5" />} color="blue" />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <Input
            value={search}
            onChange={(e: any) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by name or email..."
            className="pl-10 bg-gray-900/50 border-gray-800 text-white"
          />
        </div>
        <select
          value={roleFilter || ""}
          onChange={(e) => { setRoleFilter(e.target.value || undefined); setPage(1); }}
          className="px-3 py-2 rounded-lg bg-gray-900/50 border border-gray-800 text-gray-300 text-sm"
        >
          <option value="">All Roles</option>
          {Object.entries(ROLE_LABELS).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </div>

      {/* Pending Users List */}
      {data.items.length === 0 ? (
        <div className="text-center py-16">
          <CheckCircle className="w-16 h-16 mx-auto text-emerald-400/30 mb-4" />
          <h3 className="text-lg font-medium text-gray-300">No pending approvals</h3>
          <p className="text-sm text-gray-500 mt-1">All users have been reviewed.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {data.items.map((user: any) => (
            <motion.div
              key={user.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gray-900/60 backdrop-blur border border-gray-800/60 rounded-xl overflow-hidden"
            >
              {/* User Row */}
              <div
                className="flex items-center gap-4 p-4 cursor-pointer hover:bg-gray-800/30 transition-colors"
                onClick={() => setExpandedUser(expandedUser === user.id ? null : user.id)}
              >
                <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-sm font-bold text-gray-400">
                  {(user.name || "?")[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{user.name || "No name"}</p>
                  <p className="text-xs text-gray-500 truncate">{user.email}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full border ${ROLE_COLORS[user.role] || "bg-gray-500/20 text-gray-300 border-gray-500/30"}`}>
                  {ROLE_LABELS[user.role] || user.role}
                </span>
                {user.companyName && (
                  <span className="text-xs text-gray-500 hidden md:block">{user.companyName}</span>
                )}
                <span className="text-xs text-gray-600">
                  {new Date(user.createdAt).toLocaleDateString()}
                </span>
                <Eye className="w-4 h-4 text-gray-500" />
              </div>

              {/* Expanded Detail */}
              <AnimatePresence>
                {expandedUser === user.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="border-t border-gray-800/50"
                  >
                    <div className="p-4 space-y-4">
                      {/* Registration Data */}
                      {user.registrationData && (
                        <div>
                          <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                            Registration Details
                          </h4>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                            {Object.entries(user.registrationData).slice(0, 12).map(([key, val]: [string, any]) => (
                              <div key={key} className="bg-gray-800/40 rounded-lg p-2">
                                <span className="text-gray-500 block">{key.replace(/([A-Z])/g, " $1").trim()}</span>
                                <span className="text-gray-300">
                                  {typeof val === "object" ? JSON.stringify(val) : String(val)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex gap-3 pt-2">
                        <div className="flex-1">
                          <Input
                            value={approveNotes}
                            onChange={(e: any) => setApproveNotes(e.target.value)}
                            placeholder="Approval notes (optional)..."
                            className="bg-gray-800/50 border-gray-700 text-white text-sm mb-2"
                          />
                          <Button
                            onClick={() => approveMutation?.mutate({ userId: user.id, notes: approveNotes || undefined })}
                            disabled={approveMutation?.isPending}
                            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white"
                          >
                            <UserCheck className="w-4 h-4 mr-2" />
                            Approve User
                          </Button>
                        </div>
                        <div className="flex-1">
                          <Input
                            value={suspendReason}
                            onChange={(e: any) => setSuspendReason(e.target.value)}
                            placeholder="Suspension reason (required)..."
                            className="bg-gray-800/50 border-gray-700 text-white text-sm mb-2"
                          />
                          <Button
                            onClick={() => {
                              if (!suspendReason.trim()) {
                                toast.error("Suspension reason is required");
                                return;
                              }
                              suspendMutation?.mutate({ userId: user.id, reason: suspendReason });
                            }}
                            disabled={suspendMutation?.isPending}
                            variant="outline"
                            className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10"
                          >
                            <Ban className="w-4 h-4 mr-2" />
                            Suspend
                          </Button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {data.totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage(p => p - 1)}
            className="border-gray-700 text-gray-400"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm text-gray-400">
            Page {page} of {data.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= data.totalPages}
            onClick={() => setPage(p => p + 1)}
            className="border-gray-700 text-gray-400"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, icon, color }: { label: string; value: number; icon: React.ReactNode; color: string }) {
  const colorMap: Record<string, string> = {
    amber: "from-amber-500/10 to-amber-600/5 border-amber-500/20 text-amber-400",
    emerald: "from-emerald-500/10 to-emerald-600/5 border-emerald-500/20 text-emerald-400",
    red: "from-red-500/10 to-red-600/5 border-red-500/20 text-red-400",
    blue: "from-blue-500/10 to-blue-600/5 border-blue-500/20 text-blue-400",
  };

  return (
    <div className={`bg-gradient-to-br ${colorMap[color]} border rounded-xl p-4`}>
      <div className="flex items-center justify-between mb-2">
        {icon}
        <span className="text-2xl font-bold">{value}</span>
      </div>
      <p className="text-xs text-gray-400">{label}</p>
    </div>
  );
}
