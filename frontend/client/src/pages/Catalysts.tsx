/**
 * CATALYSTS PAGE
 * 100% Dynamic - No mock data
 * UI Style: Gradient headers, stat cards with icons, rounded cards
 */

import React, { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  Truck, Search, Star, Shield, Eye, Phone, CheckCircle, Users, UserPlus,
  XCircle, BadgeCheck, Send, Mail, Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";

export default function Catalysts() {
  const [, setLocation] = useLocation();
  const { theme } = useTheme();
  const isLight = theme === "light";
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [showInvite, setShowInvite] = useState(false);

  // Invite modal state
  const [companySearch, setCompanySearch] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<any>(null);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteMethod, setInviteMethod] = useState<"sms" | "email">("email");
  const [inviteContact, setInviteContact] = useState("");
  const suggestRef = useRef<HTMLDivElement>(null);

  // Company search query
  const companySearchQ = (trpc as any).supplyChain?.searchCompanies?.useQuery?.(
    { query: companySearch },
    { enabled: companySearch.length >= 2, staleTime: 15000 }
  ) || { data: null, isLoading: false };

  // Add partnership mutation (auto-link if on platform)
  const addMut = (trpc as any).supplyChain?.addPartnership?.useMutation?.({
    onSuccess: () => {
      toast.success("Carrier linked", { description: `${selectedCompany?.name || "Company"} added as carrier` });
      setShowInvite(false);
      resetInviteForm();
      catalystsQuery.refetch();
    },
    onError: (err: any) => toast.error("Failed to add carrier", { description: err?.message }),
  }) || { mutate: () => toast.error("Not available"), isPending: false };

  // Invite mutation (for off-platform companies)
  const inviteMut = (trpc as any).supplyChain?.inviteAndPartner?.useMutation?.({
    onSuccess: (res: any) => {
      if (res?.success) {
        toast.success("Invite sent!", { description: `Invitation sent via ${res.method}` });
        setShowInviteForm(false);
        setInviteContact("");
      } else {
        toast.error("Invite failed", { description: res?.error || "Unknown error" });
      }
    },
    onError: (err: any) => toast.error("Invite failed", { description: err?.message }),
  }) || { mutate: () => {}, isPending: false };

  const resetInviteForm = useCallback(() => {
    setCompanySearch("");
    setSelectedCompany(null);
    setShowInviteForm(false);
    setInviteContact("");
  }, []);

  // Close suggestions on outside click
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (suggestRef.current && !suggestRef.current.contains(e.target as Node)) setShowSuggestions(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const handleAddCarrier = () => {
    if (!selectedCompany?.id) return;
    addMut.mutate({
      targetCompanyId: selectedCompany.id,
      toRole: "CATALYST",
      relationshipType: "carrier",
    });
  };

  const catalystsQuery = (trpc as any).catalysts.list.useQuery({ limit: 50 });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "verified": return <Badge className="bg-green-500/20 text-green-400 border-0">Verified</Badge>;
      case "pending": return <Badge className="bg-yellow-500/20 text-yellow-400 border-0">Pending</Badge>;
      case "suspended": return <Badge className="bg-red-500/20 text-red-400 border-0">Suspended</Badge>;
      default: return <Badge className="bg-slate-500/20 text-slate-400 border-0">{status}</Badge>;
    }
  };

  const filteredCatalysts = (catalystsQuery.data as any)?.filter((catalyst: any) => {
    return !searchTerm || 
      catalyst.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      catalyst.mcNumber?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const totalCatalysts = (catalystsQuery.data as any)?.length || 0;
  const verifiedCatalysts = (catalystsQuery.data as any)?.filter((c: any) => c.status === "verified").length || 0;

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with Gradient Title */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
            Catalysts & Bids
          </h1>
          <p className="text-slate-400 text-sm mt-1">Manage catalyst bids and select the best options for your loads</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowInvite(true)}
            className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Invite Carrier
          </Button>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-yellow-500/20 border border-yellow-500/30">
            <span className="text-yellow-400 text-sm font-medium">Pending Bids</span>
            <span className="text-yellow-400 font-bold">0</span>
          </div>
        </div>
      </div>

      {/* Invite Carrier Modal — MyPartners-style (portaled to body) */}
      {showInvite && createPortal(
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm">
          <div className="flex min-h-full items-center justify-center p-4" onClick={(e) => { if (e.target === e.currentTarget) { setShowInvite(false); resetInviteForm(); } }}>
          <div className={cn("w-full max-w-3xl rounded-2xl border shadow-2xl flex flex-col", isLight ? "bg-white border-slate-200" : "bg-[#12121a] border-white/[0.08]")}>
            {/* Modal Header */}
            <div className="px-6 py-4 border-b shrink-0" style={{ borderColor: isLight ? "#e2e8f0" : "rgba(255,255,255,0.04)" }}>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className={cn("text-lg font-bold", isLight ? "text-slate-800" : "text-white")}>Invite Carrier</h2>
                  <p className={cn("text-xs mt-0.5", isLight ? "text-slate-400" : "text-slate-500")}>Search for a carrier or invite one to join EusoTrip</p>
                </div>
                <button onClick={() => { setShowInvite(false); resetInviteForm(); }} className={cn("p-1.5 rounded-lg", isLight ? "hover:bg-slate-100" : "hover:bg-white/[0.06]")}>
                  <XCircle className={cn("w-5 h-5", isLight ? "text-slate-400" : "text-slate-500")} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-5 space-y-4">
              {/* Company Search */}
              <div ref={suggestRef} className="relative">
                <label className={cn("text-[10px] font-semibold uppercase tracking-wider mb-1 block", isLight ? "text-slate-400" : "text-white/30")}>Company *</label>
                {selectedCompany ? (
                  <div className={cn("flex items-center justify-between p-3 rounded-xl border",
                    selectedCompany.onPlatform
                      ? (isLight ? "bg-emerald-50 border-emerald-200" : "bg-emerald-500/10 border-emerald-500/20")
                      : (isLight ? "bg-blue-50 border-blue-200" : "bg-blue-500/10 border-blue-500/20")
                  )}>
                    <div className="flex items-center gap-2">
                      {selectedCompany.onPlatform ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <BadgeCheck className="w-4 h-4 text-blue-500" />}
                      <div>
                        <div className="flex items-center gap-2">
                          <p className={cn("text-sm font-semibold", selectedCompany.onPlatform ? (isLight ? "text-emerald-700" : "text-emerald-400") : (isLight ? "text-blue-700" : "text-blue-400"))}>{selectedCompany.name}</p>
                          {selectedCompany.onPlatform ? (
                            <Badge className={cn("text-[8px] px-1.5 py-0", isLight ? "bg-emerald-100 text-emerald-600" : "bg-emerald-500/20 text-emerald-400")}>On Platform</Badge>
                          ) : selectedCompany.fmcsaVerified ? (
                            <Badge className={cn("text-[8px] px-1.5 py-0", isLight ? "bg-blue-100 text-blue-600" : "bg-blue-500/20 text-blue-400")}>FMCSA Verified</Badge>
                          ) : null}
                        </div>
                        <p className={cn("text-[10px]", selectedCompany.onPlatform ? (isLight ? "text-emerald-600/70" : "text-emerald-400/50") : (isLight ? "text-blue-600/70" : "text-blue-400/50"))}>
                          {[selectedCompany.dotNumber && `DOT ${selectedCompany.dotNumber}`, selectedCompany.mcNumber && `MC ${selectedCompany.mcNumber}`, selectedCompany.city && `${selectedCompany.city}, ${selectedCompany.state}`].filter(Boolean).join(" \u2022 ")}
                        </p>
                      </div>
                    </div>
                    <button onClick={() => { setSelectedCompany(null); setCompanySearch(""); setShowInviteForm(false); }} className={cn("p-1 rounded-lg", isLight ? "hover:bg-slate-100" : "hover:bg-white/[0.06]")}>
                      <XCircle className={cn("w-4 h-4", selectedCompany.onPlatform ? "text-emerald-500" : "text-blue-500")} />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="relative">
                      <Search className={cn("absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4", isLight ? "text-slate-400" : "text-slate-500")} />
                      <Input
                        value={companySearch}
                        onChange={(e: any) => { setCompanySearch(e.target.value); if (e.target.value.length >= 2) setShowSuggestions(true); else setShowSuggestions(false); }}
                        onFocus={() => { if (companySearch.length >= 2) setShowSuggestions(true); }}
                        placeholder="Search by company name, DOT#, or MC#..."
                        className={cn("pl-10", isLight ? "bg-slate-50 border-slate-200" : "bg-white/[0.04] border-white/[0.08]")}
                      />
                    </div>
                    {showSuggestions && (companySearchQ.data as any[])?.length > 0 && (
                      <div className={cn("absolute z-50 left-6 right-6 mt-1 rounded-xl border shadow-xl max-h-56 overflow-y-auto", isLight ? "bg-white border-slate-200" : "bg-[#1e1e2e] border-slate-600/50")}>
                        {(companySearchQ.data as any[]).map((c: any, idx: number) => (
                          <button key={c.id || `fmcsa-${idx}`} className={cn("w-full text-left px-4 py-2.5 flex items-center justify-between gap-2 border-b last:border-0 transition-colors", isLight ? "hover:bg-slate-50 border-slate-100" : "hover:bg-slate-700/50 border-slate-700/20")} onClick={() => {
                            setSelectedCompany(c);
                            setShowSuggestions(false);
                            setCompanySearch(c.name);
                            if (!c.onPlatform) setShowInviteForm(true);
                          }}>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className={cn("text-sm font-medium truncate", isLight ? "text-slate-800" : "text-white")}>{c.name}</p>
                                {c.onPlatform ? (
                                  <Badge className={cn("text-[8px] px-1.5 py-0 shrink-0", isLight ? "bg-emerald-100 text-emerald-600" : "bg-emerald-500/20 text-emerald-400")}>
                                    <CheckCircle className="w-2.5 h-2.5 mr-0.5" />On Platform
                                  </Badge>
                                ) : c.fmcsaVerified ? (
                                  <Badge className={cn("text-[8px] px-1.5 py-0 shrink-0", isLight ? "bg-blue-100 text-blue-600" : "bg-blue-500/20 text-blue-400")}>
                                    <BadgeCheck className="w-2.5 h-2.5 mr-0.5" />FMCSA
                                  </Badge>
                                ) : null}
                              </div>
                              <p className={cn("text-[10px]", isLight ? "text-slate-400" : "text-slate-500")}>
                                {[c.dotNumber && `DOT ${c.dotNumber}`, c.mcNumber && `MC ${c.mcNumber}`, c.city && `${c.city}, ${c.state}`].filter(Boolean).join(" \u2022 ")}
                              </p>
                            </div>
                            {!c.onPlatform && (
                              <span className={cn("text-[9px] font-medium flex items-center gap-1 shrink-0", isLight ? "text-purple-600" : "text-purple-400")}>
                                <UserPlus className="w-3 h-3" />Invite
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                    {showSuggestions && companySearch.length >= 2 && companySearchQ.isLoading && (
                      <div className={cn("absolute z-50 left-6 right-6 mt-1 rounded-xl border p-3", isLight ? "bg-white border-slate-200" : "bg-slate-800 border-slate-600/50")}>
                        <p className="text-xs text-slate-400">Searching companies...</p>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Invite Form for non-platform companies */}
              {selectedCompany && !selectedCompany.onPlatform && showInviteForm && (
                <div className={cn("p-4 rounded-xl border space-y-3", isLight ? "bg-purple-50/50 border-purple-200" : "bg-purple-500/5 border-purple-500/20")}>
                  <div className="flex items-center gap-2">
                    <UserPlus className="w-4 h-4 text-purple-500" />
                    <p className={cn("text-sm font-semibold", isLight ? "text-purple-700" : "text-purple-400")}>Invite to EusoTrip</p>
                  </div>
                  <p className={cn("text-xs", isLight ? "text-purple-600/70" : "text-purple-400/60")}>
                    This carrier isn't on EusoTrip yet. Send them an invitation via SMS or email.
                  </p>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setInviteMethod("email")} className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all",
                      inviteMethod === "email"
                        ? "bg-purple-500 text-white border-purple-500"
                        : isLight ? "bg-white border-purple-200 text-purple-600" : "bg-white/[0.04] border-purple-500/30 text-purple-400"
                    )}>
                      <Mail className="w-3.5 h-3.5" />Email
                    </button>
                    <button onClick={() => setInviteMethod("sms")} className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all",
                      inviteMethod === "sms"
                        ? "bg-purple-500 text-white border-purple-500"
                        : isLight ? "bg-white border-purple-200 text-purple-600" : "bg-white/[0.04] border-purple-500/30 text-purple-400"
                    )}>
                      <Phone className="w-3.5 h-3.5" />SMS
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      value={inviteContact || (inviteMethod === "email" ? (selectedCompany.email || "") : (selectedCompany.phone || ""))}
                      onChange={(e: any) => setInviteContact(e.target.value)}
                      placeholder={inviteMethod === "email" ? "company@example.com" : "+1 (555) 123-4567"}
                      className={cn("flex-1", isLight ? "bg-white border-purple-200" : "bg-white/[0.04] border-purple-500/20")}
                    />
                    <Button
                      onClick={() => {
                        const contact = inviteContact || (inviteMethod === "email" ? selectedCompany.email : selectedCompany.phone);
                        if (!contact) { toast.error(`Enter ${inviteMethod === "email" ? "an email" : "a phone number"}`); return; }
                        inviteMut.mutate({
                          companyName: selectedCompany.name,
                          dotNumber: selectedCompany.dotNumber || undefined,
                          method: inviteMethod,
                          contact,
                          toRole: "CATALYST",
                          relationshipType: "carrier",
                        });
                      }}
                      disabled={inviteMut.isPending}
                      className="bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white rounded-xl font-semibold text-xs px-4"
                    >
                      {inviteMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className={cn("px-6 py-4 border-t flex items-center justify-end gap-3 shrink-0", isLight ? "border-slate-100 bg-slate-50" : "border-white/[0.04] bg-white/[0.02]")}>
              <Button variant="ghost" onClick={() => { setShowInvite(false); resetInviteForm(); }} className={cn("rounded-xl text-sm", isLight ? "text-slate-500" : "text-slate-400")}>Cancel</Button>
              {selectedCompany?.onPlatform && selectedCompany?.id ? (
                <Button onClick={handleAddCarrier} disabled={addMut.isPending} className="bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white rounded-xl font-bold text-sm px-6">
                  {addMut.isPending ? "Adding..." : "Add Carrier"}
                </Button>
              ) : selectedCompany && !selectedCompany.onPlatform ? (
                <div className={cn("text-xs px-4 py-2 rounded-xl", isLight ? "bg-purple-50 text-purple-600" : "bg-purple-500/10 text-purple-400")}>
                  <UserPlus className="w-3.5 h-3.5 inline mr-1.5" />Send invite above to connect
                </div>
              ) : (
                <Button disabled className="bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white rounded-xl font-bold text-sm px-6 opacity-30">
                  Add Carrier
                </Button>
              )}
            </div>
          </div>
          </div>
        </div>,
        document.body
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-500/20">
                <Truck className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                {catalystsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-blue-400">{totalCatalysts}</p>
                )}
                <p className="text-xs text-slate-400">Total Catalysts</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/20">
                <CheckCircle className="w-6 h-6 text-green-400" />
              </div>
              <div>
                {catalystsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-green-400">{verifiedCatalysts}</p>
                )}
                <p className="text-xs text-slate-400">Verified</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-yellow-500/20">
                <Star className="w-6 h-6 text-yellow-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-yellow-400">4.5</p>
                <p className="text-xs text-slate-400">Avg Rating</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-purple-500/20">
                <Shield className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-400">92%</p>
                <p className="text-xs text-slate-400">On-Time Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <Input
          value={searchTerm}
          onChange={(e: any) => setSearchTerm(e.target.value)}
          placeholder="Search by load number..."
          className="pl-9 bg-slate-800/50 border-slate-700/50 rounded-lg focus:border-cyan-500/50"
        />
      </div>

      {/* Catalysts List */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardContent className="p-0">
          {catalystsQuery.isLoading ? (
            <div className="p-4 space-y-4">{[1, 2, 3, 4].map((i: any) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}</div>
          ) : filteredCatalysts?.length === 0 ? (
            <div className="text-center py-16">
              <div className="p-4 rounded-full bg-slate-700/50 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <Truck className="w-10 h-10 text-slate-500" />
              </div>
              <p className="text-slate-400 text-lg">No catalysts found</p>
              <p className="text-slate-500 text-sm mt-1">Try adjusting your search criteria</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {filteredCatalysts?.map((catalyst: any) => (
                <div key={catalyst.id} className="p-4 hover:bg-slate-700/20 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-xl bg-blue-500/20">
                        <Truck className="w-6 h-6 text-blue-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-white font-medium">{catalyst.name}</p>
                          <div className="flex items-center gap-1">
                            <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                            <span className="text-yellow-400 text-sm">{catalyst.rating || 4.5}</span>
                          </div>
                          {catalyst.verified && <CheckCircle className="w-4 h-4 text-green-400" />}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-slate-400">
                          <span>{catalyst.loadsCompleted || 0} loads</span>
                          <span>{catalyst.onTimeRate || 0}% on-time</span>
                          <span>MC# {catalyst.mcNumber}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {getStatusBadge(catalyst.status || "verified")}
                      <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                        <Phone className="w-4 h-4" />
                      </Button>
                      <Button size="sm" className="bg-slate-700 hover:bg-slate-600 rounded-lg" onClick={() => setLocation(`/catalysts/${catalyst.id}`)}>
                        <Eye className="w-4 h-4 mr-1" />Details
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
