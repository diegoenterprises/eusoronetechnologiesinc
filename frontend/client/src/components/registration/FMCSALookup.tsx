/**
 * FMCSA USDOT/MC Lookup Component
 * Auto-populates 30+ registration fields from a single USDOT or MC number
 * Shows verified data with read-only badges, warnings, and blocking errors
 */

import React, { useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Search, CheckCircle, XCircle, AlertTriangle, Loader2,
  Building2, Shield, Truck, FileText, Activity, Lock, FlaskConical
} from "lucide-react";
import { trpc } from "@/lib/trpc";

// ============================================================================
// TYPES
// ============================================================================

export interface FMCSAData {
  verified: boolean;
  error?: string;
  noApiKey?: boolean;
  isBlocked?: boolean;
  blockReason?: string;
  warnings?: string[];
  companyProfile?: {
    legalName: string;
    dba: string | null;
    phone: string | null;
    email: string | null;
    physicalAddress: {
      street: string;
      city: string;
      state: string;
      zip: string;
      country: string;
    };
    mailingAddress: {
      street: string;
      city: string;
      state: string;
      zip: string;
    };
    fleetSize: number;
    driverCount: number;
  };
  authority?: {
    dotNumber: string;
    allowedToOperate: boolean;
    operatingStatus: string;
    commonAuthority: string;
    contractAuthority: string;
    brokerAuthority: string;
    catalystOperation: string | null;
    catalystOperationCode: string | null;
    docketNumbers: any[];
  };
  safety?: {
    rating: string;
    ratingDate: string | null;
    crashTotal: number;
    fatalCrash: number;
    injCrash: number;
    towCrash: number;
    inspections: {
      driver: { total: number; oos: number; rate: number };
      vehicle: { total: number; oos: number; rate: number };
      hazmat: { total: number; oos: number; rate: number };
    };
    basics: any[];
  };
  insurance?: {
    bipdOnFile: boolean;
    bipdRequired: boolean;
    bipdAmount: string | null;
    cargoOnFile: boolean;
    cargoRequired: boolean;
    bondOnFile: boolean;
    bondRequired: boolean;
  };
  hazmat?: {
    authorized: boolean;
    cargoTypes: any[];
  };
}

interface FMCSALookupProps {
  mode: "dot" | "mc" | "both";
  dotNumber: string;
  mcNumber: string;
  onDotChange: (value: string) => void;
  onMcChange: (value: string) => void;
  onDataLoaded: (data: FMCSAData) => void;
  fmcsaData: FMCSAData | null;
  compact?: boolean;
}

// ============================================================================
// STATUS BADGE HELPERS
// ============================================================================

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "ACTIVE":
      return <Badge className="bg-green-500/20 text-green-400 border-green-500/30"><CheckCircle className="w-3 h-3 mr-1" /> ACTIVE</Badge>;
    case "INACTIVE":
      return <Badge className="bg-red-500/20 text-red-400 border-red-500/30"><XCircle className="w-3 h-3 mr-1" /> INACTIVE</Badge>;
    default:
      return <Badge className="bg-slate-500/20 text-slate-400 border-slate-500/30">{status}</Badge>;
  }
}

function AuthBadge({ label, status }: { label: string; status: string }) {
  const isActive = status === "A";
  return (
    <div className="flex items-center justify-between p-2 rounded bg-slate-700/30">
      <span className="text-xs text-slate-400">{label}</span>
      {isActive
        ? <Badge className="bg-green-500/15 text-green-400 text-[10px] px-1.5 py-0">Active</Badge>
        : <Badge className="bg-slate-600/30 text-slate-500 text-[10px] px-1.5 py-0">N/A</Badge>
      }
    </div>
  );
}

function InsuranceLine({ label, onFile, required }: { label: string; onFile: boolean; required: boolean }) {
  if (!required) return null;
  return (
    <div className="flex items-center justify-between p-2 rounded bg-slate-700/30">
      <span className="text-xs text-slate-400">{label}</span>
      {onFile
        ? <Badge className="bg-green-500/15 text-green-400 text-[10px] px-1.5 py-0">On File</Badge>
        : <Badge className="bg-amber-500/15 text-amber-400 text-[10px] px-1.5 py-0">Not Filed</Badge>
      }
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function FMCSALookup({
  mode, dotNumber, mcNumber, onDotChange, onMcChange, onDataLoaded, fmcsaData, compact,
}: FMCSALookupProps) {
  const [lookupStatus, setLookupStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const dotQuery = (trpc as any).fmcsa.lookupByDOT.useQuery(
    { dotNumber },
    { enabled: false }
  );

  const mcQuery = (trpc as any).fmcsa.lookupByMC.useQuery(
    { mcNumber },
    { enabled: false }
  );

  const handleDOTLookup = useCallback(async () => {
    if (!/^\d{5,8}$/.test(dotNumber)) {
      setErrorMsg("USDOT must be 5-8 digits");
      return;
    }
    setLookupStatus("loading");
    setErrorMsg("");
    try {
      const result = await dotQuery.refetch();
      const data = result.data;
      if (data && data.verified) {
        onDataLoaded(data);
        setLookupStatus("done");
      } else {
        setErrorMsg(data?.error || "Catalyst not found");
        setLookupStatus("error");
        onDataLoaded(data || { verified: false, error: "Not found" });
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Lookup failed");
      setLookupStatus("error");
    }
  }, [dotNumber, dotQuery, onDataLoaded]);

  const handleMCLookup = useCallback(async () => {
    const cleanMC = mcNumber.replace(/^MC-?/i, "");
    if (!/^\d{3,8}$/.test(cleanMC)) {
      setErrorMsg("MC number must be 3-8 digits");
      return;
    }
    setLookupStatus("loading");
    setErrorMsg("");
    try {
      const result = await mcQuery.refetch();
      const data = result.data;
      if (data?.results?.length > 0) {
        // Found catalyst(s) by MC — auto-trigger DOT lookup for first result
        const firstDot = data.results[0].dotNumber;
        onDotChange(firstDot);
        setLookupStatus("done");
      } else {
        setErrorMsg(data?.error || "No catalyst found for this MC number");
        setLookupStatus("error");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "MC lookup failed");
      setLookupStatus("error");
    }
  }, [mcNumber, mcQuery, onDotChange]);

  const d = fmcsaData;
  const isLoading = lookupStatus === "loading";

  return (
    <div className="space-y-4">
      {/* Lookup Inputs */}
      <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
        <div className="flex items-start gap-3 mb-4">
          <Search className="w-5 h-5 text-blue-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm text-blue-300 font-medium">Federal Registration Verification</p>
            <p className="text-xs text-slate-400 mt-1">
              Enter your USDOT{mode !== "dot" ? " or MC" : ""} number to auto-populate your registration with verified FMCSA data.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(mode === "dot" || mode === "both") && (
            <div className="space-y-2">
              <Label className="text-slate-300">USDOT Number</Label>
              <div className="flex gap-2">
                <Input
                  value={dotNumber}
                  onChange={(e: any) => onDotChange(e.target.value.replace(/\D/g, "").slice(0, 8))}
                  placeholder="1234567"
                  className="bg-slate-700/50 border-slate-600 text-white font-mono"
                  maxLength={8}
                />
                <Button
                  type="button"
                  onClick={handleDOTLookup}
                  disabled={isLoading || dotNumber.length < 5}
                  className="bg-blue-600 hover:bg-blue-700 shrink-0"
                  size="sm"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          )}

          {(mode === "mc" || mode === "both") && (
            <div className="space-y-2">
              <Label className="text-slate-300">MC/MX Number</Label>
              <div className="flex gap-2">
                <Input
                  value={mcNumber}
                  onChange={(e: any) => onMcChange(e.target.value.replace(/[^\dMCmc-]/g, "").slice(0, 12))}
                  placeholder="MC-987654"
                  className="bg-slate-700/50 border-slate-600 text-white font-mono"
                />
                <Button
                  type="button"
                  onClick={handleMCLookup}
                  disabled={isLoading || mcNumber.length < 3}
                  className="bg-blue-600 hover:bg-blue-700 shrink-0"
                  size="sm"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          )}
        </div>

        {errorMsg && (
          <div className="mt-3 p-2 rounded bg-red-500/10 border border-red-500/20 flex items-center gap-2">
            <XCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span className="text-xs text-red-300">{errorMsg}</span>
          </div>
        )}
      </div>

      {/* Verified Data Display */}
      {d?.verified && (
        <div className="space-y-3">
          {/* Blocking Error */}
          {d.isBlocked && (
            <div className="p-4 rounded-lg bg-red-500/15 border border-red-500/30">
              <div className="flex items-start gap-3">
                <Lock className="w-5 h-5 text-red-400 mt-0.5" />
                <div>
                  <p className="text-sm text-red-300 font-bold">Registration Blocked</p>
                  <p className="text-xs text-red-400 mt-1">{d.blockReason}</p>
                </div>
              </div>
            </div>
          )}

          {/* Warnings */}
          {d.warnings && d.warnings.length > 0 && (
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
              {d.warnings.map((w: string, i: number) => (
                <div key={i} className="flex items-center gap-2 mb-1 last:mb-0">
                  <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />
                  <span className="text-xs text-amber-300">{w}</span>
                </div>
              ))}
            </div>
          )}

          {/* Company Profile */}
          {d.companyProfile && (
            <div className="p-4 rounded-lg bg-slate-700/30 border border-slate-600/30">
              <div className="flex items-center gap-2 mb-3">
                <Building2 className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-semibold text-white">Company Profile</span>
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-[10px] ml-auto">
                  <CheckCircle className="w-3 h-3 mr-1" /> FMCSA Verified
                </Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-slate-500 text-xs">Legal Name</span>
                  <p className="text-white font-medium">{d.companyProfile.legalName}</p>
                </div>
                {d.companyProfile.dba && (
                  <div>
                    <span className="text-slate-500 text-xs">DBA</span>
                    <p className="text-slate-300">{d.companyProfile.dba}</p>
                  </div>
                )}
                <div>
                  <span className="text-slate-500 text-xs">Address</span>
                  <p className="text-slate-300 text-xs">
                    {d.companyProfile.physicalAddress.street}, {d.companyProfile.physicalAddress.city}, {d.companyProfile.physicalAddress.state} {d.companyProfile.physicalAddress.zip}
                  </p>
                </div>
                {d.companyProfile.phone && (
                  <div>
                    <span className="text-slate-500 text-xs">Phone</span>
                    <p className="text-slate-300">{d.companyProfile.phone}</p>
                  </div>
                )}
                {!compact && (
                  <>
                    <div>
                      <span className="text-slate-500 text-xs">Power Units</span>
                      <p className="text-white font-medium">{d.companyProfile.fleetSize}</p>
                    </div>
                    <div>
                      <span className="text-slate-500 text-xs">Drivers</span>
                      <p className="text-white font-medium">{d.companyProfile.driverCount}</p>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Authority */}
          {d.authority && !compact && (
            <div className="p-4 rounded-lg bg-slate-700/30 border border-slate-600/30">
              <div className="flex items-center gap-2 mb-3">
                <Shield className="w-4 h-4 text-indigo-400" />
                <span className="text-sm font-semibold text-white">Operating Authority</span>
                <StatusBadge status={d.authority.operatingStatus} />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <div className="p-2 rounded bg-slate-700/30">
                  <span className="text-slate-500 text-[10px]">USDOT</span>
                  <p className="text-white font-mono text-sm">{d.authority.dotNumber}</p>
                </div>
                <AuthBadge label="Common" status={d.authority.commonAuthority} />
                <AuthBadge label="Contract" status={d.authority.contractAuthority} />
                <AuthBadge label="Broker" status={d.authority.brokerAuthority} />
              </div>
              {d.authority.catalystOperation && (
                <p className="text-xs text-slate-400 mt-2">Operation: {d.authority.catalystOperation}</p>
              )}
            </div>
          )}

          {/* Safety */}
          {d.safety && !compact && (
            <div className="p-4 rounded-lg bg-slate-700/30 border border-slate-600/30">
              <div className="flex items-center gap-2 mb-3">
                <Activity className="w-4 h-4 text-pink-400" />
                <span className="text-sm font-semibold text-white">Safety Record</span>
                <Badge className={`text-[10px] ml-auto ${
                  d.safety.rating === "SATISFACTORY" ? "bg-green-500/20 text-green-400" :
                  d.safety.rating === "CONDITIONAL" ? "bg-amber-500/20 text-amber-400" :
                  d.safety.rating === "UNSATISFACTORY" ? "bg-red-500/20 text-red-400" :
                  "bg-slate-500/20 text-slate-400"
                }`}>
                  {d.safety.rating}
                </Badge>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                <div className="p-2 rounded bg-slate-700/30">
                  <span className="text-slate-500 text-[10px]">Crashes</span>
                  <p className="text-white font-medium">{d.safety.crashTotal}</p>
                </div>
                <div className="p-2 rounded bg-slate-700/30">
                  <span className="text-slate-500 text-[10px]">Driver OOS Rate</span>
                  <p className={`font-medium ${d.safety.inspections.driver.rate > 25 ? "text-amber-400" : "text-white"}`}>
                    {d.safety.inspections.driver.rate}%
                  </p>
                </div>
                <div className="p-2 rounded bg-slate-700/30">
                  <span className="text-slate-500 text-[10px]">Vehicle OOS Rate</span>
                  <p className={`font-medium ${d.safety.inspections.vehicle.rate > 25 ? "text-amber-400" : "text-white"}`}>
                    {d.safety.inspections.vehicle.rate}%
                  </p>
                </div>
                <div className="p-2 rounded bg-slate-700/30">
                  <span className="text-slate-500 text-[10px]">Hazmat Auth</span>
                  <p className="font-medium">{d.hazmat?.authorized ? <span className="text-green-400">YES</span> : <span className="text-slate-500">NO</span>}</p>
                </div>
              </div>
            </div>
          )}

          {/* HMSP Compliance Panel — Key Differentiator */}
          {d.hazmat?.authorized && !compact && d.authority?.dotNumber && (
            <HMSPCompliancePanel dotNumber={d.authority.dotNumber} />
          )}

          {/* Insurance */}
          {d.insurance && !compact && (
            <div className="p-4 rounded-lg bg-slate-700/30 border border-slate-600/30">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="w-4 h-4 text-cyan-400" />
                <span className="text-sm font-semibold text-white">Insurance Filing Status</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <InsuranceLine label="BIPD Insurance" onFile={d.insurance.bipdOnFile} required={d.insurance.bipdRequired} />
                <InsuranceLine label="Cargo Insurance" onFile={d.insurance.cargoOnFile} required={d.insurance.cargoRequired} />
                <InsuranceLine label="Bond/BMC-84" onFile={d.insurance.bondOnFile} required={d.insurance.bondRequired} />
              </div>
              {d.insurance.bipdAmount && (
                <p className="text-xs text-slate-400 mt-2">Required BIPD: ${Number(d.insurance.bipdAmount).toLocaleString()}</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * HMSP Compliance Panel
 * Auto-fires verifyHMSP when carrier has hazmat authorization.
 * Shows cargo types, inspection history, and HMSP status.
 * NO competitor (McLeod, DAT, Uber Freight) offers this during onboarding.
 */
function HMSPCompliancePanel({ dotNumber }: { dotNumber: string }) {
  const hmspQuery = (trpc as any).fmcsa.verifyHMSP.useQuery(
    { dotNumber },
    { enabled: !!dotNumber && /^\d{5,8}$/.test(dotNumber) }
  );

  if (hmspQuery.isLoading) {
    return (
      <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center gap-3">
        <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />
        <span className="text-sm text-purple-300">Verifying HMSP permit status...</span>
      </div>
    );
  }

  const h = hmspQuery.data;
  if (!h?.verified) return null;

  const statusColor = h.overallStatus === "CLEAR" ? "green" : h.overallStatus === "WARNING" ? "amber" : "red";

  return (
    <div className="p-4 rounded-lg bg-slate-700/30 border border-slate-600/30">
      <div className="flex items-center gap-2 mb-3">
        <FlaskConical className="w-4 h-4 text-purple-400" />
        <span className="text-sm font-semibold text-white">Hazmat Safety Permit (HMSP)</span>
        <Badge className={`text-[10px] ml-auto ${
          statusColor === "green" ? "bg-green-500/20 text-green-400" :
          statusColor === "amber" ? "bg-amber-500/20 text-amber-400" :
          "bg-red-500/20 text-red-400"
        }`}>
          {h.overallStatus}
        </Badge>
      </div>

      {/* Compliance Checks */}
      <div className="space-y-1.5 mb-3">
        {h.checks?.map((check: any, i: number) => (
          <div key={i} className="flex items-center justify-between p-2 rounded bg-slate-700/30">
            <span className="text-xs text-slate-400">{check.check}</span>
            <div className="flex items-center gap-1.5">
              <span className={`text-[10px] ${
                check.status === "pass" ? "text-green-400" :
                check.status === "warn" ? "text-amber-400" : "text-red-400"
              }`}>
                {check.detail?.length > 60 ? check.detail.slice(0, 57) + "..." : check.detail}
              </span>
              {check.status === "pass" ? <CheckCircle className="w-3 h-3 text-green-400" /> :
               check.status === "warn" ? <AlertTriangle className="w-3 h-3 text-amber-400" /> :
               <XCircle className="w-3 h-3 text-red-400" />}
            </div>
          </div>
        ))}
      </div>

      {/* Hazmat Inspection Stats */}
      {h.hazmatInspections && (
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="p-2 rounded bg-slate-700/30 text-center">
            <span className="text-slate-500 text-[10px] block">HM Inspections</span>
            <p className="text-white font-medium text-sm">{h.hazmatInspections.total}</p>
          </div>
          <div className="p-2 rounded bg-slate-700/30 text-center">
            <span className="text-slate-500 text-[10px] block">HM OOS</span>
            <p className="text-white font-medium text-sm">{h.hazmatInspections.oos}</p>
          </div>
          <div className="p-2 rounded bg-slate-700/30 text-center">
            <span className="text-slate-500 text-[10px] block">HM OOS Rate</span>
            <p className={`font-medium text-sm ${
              h.hazmatInspections.aboveAverage ? "text-amber-400" : "text-green-400"
            }`}>
              {h.hazmatInspections.oosRate}%
            </p>
          </div>
        </div>
      )}

      {/* Cargo Types */}
      {h.cargoTypes?.length > 0 && (
        <div>
          <span className="text-slate-500 text-[10px] block mb-1">Registered Cargo Types</span>
          <div className="flex flex-wrap gap-1">
            {h.cargoTypes.map((ct: any, i: number) => (
              <Badge key={i} className="bg-slate-600/30 text-slate-300 text-[10px] px-1.5 py-0">
                {ct.description || ct.code}
              </Badge>
            ))}
          </div>
        </div>
      )}

      <p className="text-[10px] text-slate-600 mt-2">49 CFR Part 385 Subpart E</p>
    </div>
  );
}

export default FMCSALookup;
