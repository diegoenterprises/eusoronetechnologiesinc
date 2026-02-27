/**
 * UNIVERSAL INVITE MODAL
 * Situation-aware invite component for viral platform growth
 * Uses invite.lookup for SAFER/FMCSA carrier search
 * 
 * Usage:
 * <InviteModal
 *   open={showInvite}
 *   onClose={() => setShowInvite(false)}
 *   context="LOAD_BOARD"
 *   target={{ name: "ABC Transport", dot: "1234567", phone: "+1555...", email: "..." }}
 *   contextData={{ loadNumber: "LD-123", laneName: "Houston → Dallas" }}
 * />
 */

import { useState, useEffect, useRef } from "react";
import { Portal } from "@/components/ui/portal";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  X, Mail, Phone, Send, Loader2, UserPlus, CheckCircle,
  BadgeCheck, Truck, Building2, Package, AlertTriangle, Search
} from "lucide-react";

export type InviteContext =
  | "PARTNER_LINK"
  | "LOAD_BOARD"
  | "ACCESS_GATE"
  | "LOAD_ASSIGN"
  | "CARRIER_SEARCH"
  | "DRIVER_ONBOARD"
  | "SHIPPER_CONNECT"
  | "GENERAL";

export interface InviteTarget {
  name: string;
  dot?: string;
  mc?: string;
  phone?: string;
  email?: string;
  onPlatform?: boolean;
  fmcsaVerified?: boolean;
}

export interface InviteContextData {
  loadNumber?: string;
  terminalName?: string;
  laneName?: string;
  productType?: string;
  urgency?: "normal" | "urgent";
}

interface InviteModalProps {
  open: boolean;
  onClose: () => void;
  context: InviteContext;
  target: InviteTarget;
  contextData?: InviteContextData;
  onSuccess?: () => void;
}

const contextLabels: Record<InviteContext, { title: string; desc: string; icon: any }> = {
  LOAD_BOARD: { title: "Invite to Bid", desc: "Send an invitation to bid on this load", icon: Package },
  ACCESS_GATE: { title: "Gate Check-In", desc: "Invite this carrier to register for faster access", icon: Building2 },
  LOAD_ASSIGN: { title: "Assign Load", desc: "Invite this carrier/driver to accept the assignment", icon: Truck },
  CARRIER_SEARCH: { title: "Connect with Carrier", desc: "Invite this carrier to join and work with you", icon: Truck },
  DRIVER_ONBOARD: { title: "Onboard Driver", desc: "Invite this driver to join your fleet", icon: UserPlus },
  SHIPPER_CONNECT: { title: "Connect with Shipper", desc: "Invite this shipper to post loads", icon: Building2 },
  PARTNER_LINK: { title: "Link Partner", desc: "Invite this company to join as a supply chain partner", icon: Building2 },
  GENERAL: { title: "Invite to EusoTrip", desc: "Send an invitation to join the platform", icon: UserPlus },
};

export function InviteModal({ open, onClose, context, target, contextData, onSuccess }: InviteModalProps) {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [method, setMethod] = useState<"email" | "sms">("email");
  const [contact, setContact] = useState("");
  // Search state (when no target pre-filled)
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTarget, setSelectedTarget] = useState<InviteTarget | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [debouncedQuery, setDebouncedQuery] = useState("");

  // SAFER / FMCSA / Platform lookup
  const lookupQuery = (trpc as any).invite.lookup.useQuery(
    { query: debouncedQuery },
    { enabled: debouncedQuery.length >= 2 }
  );

  const inviteMut = (trpc as any).invite.send.useMutation({
    onSuccess: (res: any) => {
      if (res?.success) {
        toast.success("Invite sent!", { description: `Invitation sent via ${res.method}` });
        onClose();
        onSuccess?.();
      } else {
        toast.error("Failed to send invite", { description: res?.error || "Unknown error" });
      }
    },
    onError: (err: any) => toast.error("Invite failed", { description: err?.message || "Unknown error" }),
  });

  // Debounce search input
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedQuery(searchQuery.trim()), 350);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [searchQuery]);

  // Reset state on open/close
  useEffect(() => {
    if (open) {
      setSearchQuery("");
      setDebouncedQuery("");
      setSelectedTarget(null);
      // If target is pre-filled (e.g. from a specific carrier), use it directly
      if (target.name) {
        setSelectedTarget(target);
        setContact(method === "email" ? (target.email || "") : (target.phone || ""));
      } else {
        setContact("");
      }
    }
  }, [open, target.name]);

  // Update contact when method changes
  useEffect(() => {
    const t = selectedTarget || (target.name ? target : null);
    if (t) {
      setContact(method === "email" ? (t.email || "") : (t.phone || ""));
    }
  }, [method]);

  if (!open) return null;

  const { title, desc, icon: Icon } = contextLabels[context] || contextLabels.GENERAL;

  // The active target is either selectedTarget (from search) or the prop target (pre-filled)
  const activeTarget = selectedTarget || (target.name ? target : null);
  const resolvedName = activeTarget?.name?.trim() || "";

  const handleSelectResult = (result: any) => {
    const t: InviteTarget = {
      name: result.name,
      dot: result.dotNumber || undefined,
      mc: result.mcNumber || undefined,
      phone: result.phone || undefined,
      email: result.email || undefined,
      onPlatform: result.onPlatform,
      fmcsaVerified: result.fmcsaVerified,
    };
    setSelectedTarget(t);
    setContact(method === "email" ? (t.email || "") : (t.phone || ""));
    setSearchQuery("");
    setDebouncedQuery("");
  };

  const handleClearSelection = () => {
    setSelectedTarget(null);
    setContact("");
    setSearchQuery("");
    setDebouncedQuery("");
  };

  const handleSend = () => {
    if (!resolvedName) {
      toast.error("Search and select a carrier first");
      return;
    }
    if (!contact) {
      toast.error(`Enter ${method === "email" ? "an email address" : "a phone number"}`);
      return;
    }
    inviteMut.mutate({
      context,
      method,
      contact,
      targetName: resolvedName,
      targetDot: activeTarget?.dot,
      targetMc: activeTarget?.mc,
      loadNumber: contextData?.loadNumber,
      terminalName: contextData?.terminalName,
      laneName: contextData?.laneName,
      productType: contextData?.productType,
      urgency: contextData?.urgency,
    });
  };

  const lookupResults = (lookupQuery.data as any[]) || [];
  const isSearching = lookupQuery.isFetching;
  const needsSearch = !target.name && !selectedTarget;

  return (
    <Portal>
    <div
      className="fixed inset-0 z-[9999] overflow-y-auto bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="flex min-h-full items-center justify-center p-4">
      <div className={cn(
        "w-full max-w-lg rounded-2xl border shadow-2xl flex flex-col",
        isLight ? "bg-white border-slate-200" : "bg-[#12121a] border-white/[0.08]"
      )}>
        {/* Header */}
        <div className="px-6 py-4 border-b bg-gradient-to-r from-[#1473FF] to-[#BE01FF] rounded-t-2xl shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-white/20 backdrop-blur-sm">
                <Icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">{title}</h2>
                <p className="text-xs text-white/70">{desc}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
              <X className="w-5 h-5 text-white/70" />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="px-6 py-5 space-y-4 overflow-y-auto flex-1 min-h-0">

          {/* ── SEARCH STEP: no target pre-filled, no selection yet ── */}
          {needsSearch ? (
            <>
              <div>
                <label className={cn("text-[10px] font-semibold uppercase tracking-wider mb-1.5 block", isLight ? "text-slate-500" : "text-white/40")}>
                  Search by Name, DOT#, or MC#
                </label>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="e.g. ABC Transport, 2993310, MC-123456"
                    autoFocus
                    className={cn("pl-9", isLight ? "bg-slate-50 border-slate-200" : "bg-white/[0.04] border-white/[0.08]")}
                  />
                  {isSearching && <Loader2 className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-blue-400" />}
                </div>
              </div>

              {/* Search Results */}
              {debouncedQuery.length >= 2 && (
                <div className={cn(
                  "rounded-xl border overflow-hidden",
                  isLight ? "border-slate-200" : "border-white/[0.06]"
                )}>
                  {isSearching && lookupResults.length === 0 ? (
                    <div className="flex items-center justify-center py-8 gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                      <span className={cn("text-sm", isLight ? "text-slate-500" : "text-slate-400")}>Searching SAFER & platform...</span>
                    </div>
                  ) : lookupResults.length === 0 ? (
                    <div className="text-center py-8">
                      <UserPlus className={cn("w-8 h-8 mx-auto mb-2", isLight ? "text-slate-300" : "text-slate-600")} />
                      <p className={cn("text-sm font-medium", isLight ? "text-slate-500" : "text-slate-400")}>No carriers found</p>
                      <p className={cn("text-xs mt-1", isLight ? "text-slate-400" : "text-slate-500")}>Try a different name, DOT, or MC number</p>
                    </div>
                  ) : (
                    <div className="max-h-56 overflow-y-auto divide-y divide-white/[0.04]">
                      {lookupResults.map((r: any, i: number) => (
                        <button
                          key={`${r.dotNumber || r.name}-${i}`}
                          onClick={() => handleSelectResult(r)}
                          className={cn(
                            "w-full text-left px-4 py-3 flex items-center gap-3 transition-colors",
                            isLight ? "hover:bg-slate-50" : "hover:bg-white/[0.04]"
                          )}
                        >
                          {r.onPlatform ? (
                            <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                          ) : r.fmcsaVerified ? (
                            <BadgeCheck className="w-5 h-5 text-blue-500 shrink-0" />
                          ) : (
                            <Truck className="w-5 h-5 text-slate-400 shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className={cn("font-medium text-sm truncate", isLight ? "text-slate-800" : "text-white")}>{r.name}</p>
                              {r.onPlatform && (
                                <Badge className="text-[8px] px-1.5 py-0 bg-emerald-500/20 text-emerald-400 border-0">On Platform</Badge>
                              )}
                              {!r.onPlatform && r.fmcsaVerified && (
                                <Badge className="text-[8px] px-1.5 py-0 bg-blue-500/20 text-blue-400 border-0">SAFER</Badge>
                              )}
                            </div>
                            <p className={cn("text-xs truncate", isLight ? "text-slate-400" : "text-slate-500")}>
                              {[r.dotNumber && `DOT ${r.dotNumber}`, r.mcNumber && `MC ${r.mcNumber}`, r.city && r.state && `${r.city}, ${r.state}`].filter(Boolean).join(" • ")}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Hint */}
              {debouncedQuery.length < 2 && (
                <div className={cn("text-center py-6", isLight ? "text-slate-400" : "text-slate-500")}>
                  <Search className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">Search for a carrier by name, DOT#, or MC#</p>
                  <p className="text-xs mt-1 opacity-70">Results come from the FMCSA SAFER database and EusoTrip</p>
                </div>
              )}
            </>
          ) : (
            <>
              {/* ── SELECTED CARRIER INFO ── */}
              <div className={cn(
                "p-4 rounded-xl border",
                activeTarget?.onPlatform
                  ? (isLight ? "bg-emerald-50 border-emerald-200" : "bg-emerald-500/10 border-emerald-500/20")
                  : activeTarget?.fmcsaVerified
                  ? (isLight ? "bg-blue-50 border-blue-200" : "bg-blue-500/10 border-blue-500/20")
                  : (isLight ? "bg-slate-50 border-slate-200" : "bg-white/[0.02] border-white/[0.06]")
              )}>
                <div className="flex items-center gap-3">
                  {activeTarget?.onPlatform ? (
                    <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                  ) : activeTarget?.fmcsaVerified ? (
                    <BadgeCheck className="w-5 h-5 text-blue-500 shrink-0" />
                  ) : (
                    <Truck className="w-5 h-5 text-slate-400 shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={cn(
                        "font-semibold truncate",
                        activeTarget?.onPlatform ? (isLight ? "text-emerald-700" : "text-emerald-400")
                        : activeTarget?.fmcsaVerified ? (isLight ? "text-blue-700" : "text-blue-400")
                        : (isLight ? "text-slate-700" : "text-white")
                      )}>{resolvedName}</p>
                      {activeTarget?.onPlatform && (
                        <Badge className={cn("text-[8px] px-1.5 py-0", isLight ? "bg-emerald-100 text-emerald-600" : "bg-emerald-500/20 text-emerald-400")}>
                          On Platform
                        </Badge>
                      )}
                      {!activeTarget?.onPlatform && activeTarget?.fmcsaVerified && (
                        <Badge className={cn("text-[8px] px-1.5 py-0", isLight ? "bg-blue-100 text-blue-600" : "bg-blue-500/20 text-blue-400")}>
                          FMCSA Verified
                        </Badge>
                      )}
                    </div>
                    <p className={cn("text-xs", isLight ? "text-slate-500" : "text-slate-400")}>
                      {[activeTarget?.dot && `DOT ${activeTarget.dot}`, activeTarget?.mc && `MC ${activeTarget.mc}`].filter(Boolean).join(" • ") || "Not registered"}
                    </p>
                  </div>
                  {/* Change selection (only when search was used, not pre-filled) */}
                  {!target.name && (
                    <button onClick={handleClearSelection} className={cn("text-xs px-2 py-1 rounded-lg", isLight ? "text-slate-500 hover:bg-slate-100" : "text-slate-400 hover:bg-white/[0.06]")}>
                      Change
                    </button>
                  )}
                </div>
              </div>

              {/* Platform user — no invite needed */}
              {activeTarget?.onPlatform ? (
                <div className={cn("p-4 rounded-xl border text-center", isLight ? "bg-emerald-50 border-emerald-200" : "bg-emerald-500/10 border-emerald-500/20")}>
                  <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                  <p className={cn("text-sm font-medium", isLight ? "text-emerald-700" : "text-emerald-400")}>
                    This company is already on EusoTrip!
                  </p>
                  <p className={cn("text-xs mt-1", isLight ? "text-emerald-600/70" : "text-emerald-400/60")}>
                    You can connect with them directly through the platform.
                  </p>
                </div>
              ) : (
                <>
                  {/* Context Data Display */}
                  {(contextData?.loadNumber || contextData?.laneName) && (
                    <div className={cn("flex flex-wrap gap-2", isLight ? "text-slate-600" : "text-slate-300")}>
                      {contextData.loadNumber && (
                        <Badge variant="outline" className="text-xs">Load: {contextData.loadNumber}</Badge>
                      )}
                      {contextData.laneName && (
                        <Badge variant="outline" className="text-xs">{contextData.laneName}</Badge>
                      )}
                      {contextData.urgency === "urgent" && (
                        <Badge className="text-xs bg-amber-500/20 text-amber-500 border-amber-500/30">
                          <AlertTriangle className="w-3 h-3 mr-1" />Urgent
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* Method Toggle */}
                  <div>
                    <label className={cn("text-[10px] font-semibold uppercase tracking-wider mb-1.5 block", isLight ? "text-slate-500" : "text-white/40")}>
                      Send Via
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setMethod("email")}
                        className={cn(
                          "flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium border transition-all flex-1",
                          method === "email"
                            ? "bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white border-transparent"
                            : isLight ? "bg-slate-50 border-slate-200 text-slate-600" : "bg-white/[0.03] border-white/[0.06] text-slate-400"
                        )}
                      >
                        <Mail className="w-4 h-4" />Email
                      </button>
                      <button
                        onClick={() => setMethod("sms")}
                        className={cn(
                          "flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium border transition-all flex-1",
                          method === "sms"
                            ? "bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white border-transparent"
                            : isLight ? "bg-slate-50 border-slate-200 text-slate-600" : "bg-white/[0.03] border-white/[0.06] text-slate-400"
                        )}
                      >
                        <Phone className="w-4 h-4" />SMS
                      </button>
                    </div>
                  </div>

                  {/* Contact Input */}
                  <div>
                    <label className={cn("text-[10px] font-semibold uppercase tracking-wider mb-1.5 block", isLight ? "text-slate-500" : "text-white/40")}>
                      {method === "email" ? "Email Address" : "Phone Number"}
                    </label>
                    <Input
                      value={contact}
                      onChange={(e) => setContact(e.target.value)}
                      placeholder={method === "email" ? "company@example.com" : "+1 (555) 123-4567"}
                      className={cn(isLight ? "bg-slate-50 border-slate-200" : "bg-white/[0.04] border-white/[0.08]")}
                    />
                  </div>
                </>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className={cn(
          "px-6 py-4 border-t flex items-center justify-end gap-3 shrink-0 rounded-b-2xl",
          isLight ? "border-slate-100 bg-slate-50" : "border-white/[0.04] bg-white/[0.02]"
        )}>
          <Button variant="ghost" onClick={onClose} className={cn("rounded-xl text-sm", isLight ? "text-slate-500" : "text-slate-400")}>
            Cancel
          </Button>
          {!activeTarget?.onPlatform && activeTarget && (
            <Button
              onClick={handleSend}
              disabled={inviteMut.isPending || !contact || !resolvedName}
              className="bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white rounded-xl font-bold text-sm px-6"
            >
              {inviteMut.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              Send Invite
            </Button>
          )}
        </div>
      </div>
      </div>
    </div>
    </Portal>
  );
}

export default InviteModal;
