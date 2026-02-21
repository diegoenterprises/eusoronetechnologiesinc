/**
 * ACCESS VALIDATION PAGE
 * 
 * Jony Ive design language — every element intentional, every pixel purposeful.
 * EusoTrip brand: #1473FF → #BE01FF gradient, dark slate canvas, frosted glass.
 * 
 * Used by gate/rack/bay controllers to validate arriving drivers.
 * NO LOGIN REQUIRED — the token + 6-digit access code IS the auth.
 *
 * Security flow:
 *  1. Open link → validate token exists
 *  2. Enter 6-digit access code (5 attempts max, then locked)
 *  3. Grant location services → verify GPS is within geofence of terminal
 *  4. Scan QR / enter load # → look up load + driver → approve/deny
 *  5. Every action timestamped in access_validations audit trail
 */

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "wouter";
import {
  Shield, ShieldCheck, ShieldX, Truck, Package, MapPin,
  User, CheckCircle, XCircle, Search, Clock, AlertTriangle,
  Fuel, KeyRound, Loader2, Navigation, Lock, Eye
} from "lucide-react";

const ROLE_LABELS: Record<string, string> = {
  gate_controller: "Gate Controller",
  rack_supervisor: "Rack Supervisor",
  bay_operator: "Bay Operator",
  safety_officer: "Safety Officer",
  shift_lead: "Shift Lead",
  dock_manager: "Dock Manager",
  warehouse_lead: "Warehouse Lead",
  receiving_clerk: "Receiving Clerk",
  yard_marshal: "Yard Marshal",
};

// Haversine distance in meters
function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const GEOFENCE_RADIUS_METERS = 500;

// ─── Design tokens ───────────────────────────────────────────────────
const glass = "bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-2xl";
const glassInner = "bg-white/[0.03] border border-white/[0.04] rounded-xl";

interface StaffInfo {
  id: number;
  name: string;
  staffRole: string;
  assignedZone: string | null;
  canApproveAccess: boolean;
  canDispenseProduct: boolean;
  terminalName: string | null;
  terminalLat: number | null;
  terminalLng: number | null;
  locationType: string | null;
  locationName: string | null;
}

/** Logo + brand wordmark header */
function BrandHeader({ subtitle }: { subtitle?: string }) {
  return (
    <div className="text-center mb-8">
      <img src="/eusotrip-logo.png" alt="EusoTrip" className="w-14 h-14 mx-auto mb-4 object-contain rounded-[14px]" />
      <h1 className="text-[22px] font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent tracking-tight">
        EusoTrip
      </h1>
      {subtitle && <p className="text-slate-500 text-[13px] mt-1 tracking-wide">{subtitle}</p>}
    </div>
  );
}

/** Gradient accent bar for cards */
function GradientBar() {
  return <div className="h-[2px] bg-gradient-to-r from-[#1473FF] to-[#BE01FF] rounded-full" />;
}

export default function AccessValidation() {
  const params = useParams<{ token: string }>();
  const token = params?.token || "";

  const [phase, setPhase] = useState<"loading" | "code_entry" | "location_check" | "ready" | "approved" | "denied" | "expired" | "locked" | "error">("loading");

  const [staff, setStaff] = useState<StaffInfo | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  const [codeDigits, setCodeDigits] = useState(["", "", "", "", "", ""]);
  const [codeError, setCodeError] = useState("");
  const [codeSubmitting, setCodeSubmitting] = useState(false);
  const codeRefs = useRef<(HTMLInputElement | null)[]>([]);

  const [staffLat, setStaffLat] = useState<number | null>(null);
  const [staffLng, setStaffLng] = useState<number | null>(null);
  const [geoDistance, setGeoDistance] = useState<number | null>(null);
  const [locationVerifiedAt, setLocationVerifiedAt] = useState<string | null>(null);
  const [locationError, setLocationError] = useState("");

  const [loadInput, setLoadInput] = useState("");
  const [lookupStatus, setLookupStatus] = useState<"idle" | "loading" | "found" | "not_found">("idle");
  const [loadData, setLoadData] = useState<{ load: any; driver: any; shipper: any } | null>(null);

  const [decision, setDecision] = useState<"pending" | "submitting">("pending");
  const [denyReason, setDenyReason] = useState("");

  // ──────────── STEP 1: Validate token ────────────
  useEffect(() => {
    if (!token) { setPhase("error"); setErrorMsg("No token provided"); return; }
    fetch(`/api/access/validate/${token}`)
      .then(r => {
        if (r.status === 410) { setPhase("expired"); return null; }
        if (r.status === 423) { setPhase("locked"); return null; }
        if (!r.ok) { setPhase("error"); setErrorMsg("Invalid link"); return null; }
        return r.json();
      })
      .then(data => {
        if (!data) return;
        setStaff(data.staff);
        setExpiresAt(data.expiresAt);
        setPhase(data.codeVerified ? "location_check" : "code_entry");
      })
      .catch(() => { setPhase("error"); setErrorMsg("Connection failed"); });
  }, [token]);

  // ──────────── STEP 2: Code entry ────────────
  const handleCodeInput = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;
    const next = [...codeDigits];
    next[index] = value;
    setCodeDigits(next);
    setCodeError("");
    if (value && index < 5) codeRefs.current[index + 1]?.focus();
  };

  const handleCodeKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !codeDigits[index] && index > 0) {
      codeRefs.current[index - 1]?.focus();
    }
  };

  const submitCode = async () => {
    const code = codeDigits.join("");
    if (code.length !== 6) { setCodeError("Enter all 6 digits"); return; }
    setCodeSubmitting(true);
    try {
      const r = await fetch(`/api/access/verify-code/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await r.json();
      if (r.status === 423) { setPhase("locked"); return; }
      if (!r.ok) { setCodeError(data.error || "Incorrect code"); setCodeSubmitting(false); return; }
      setPhase("location_check");
    } catch { setCodeError("Connection failed"); }
    setCodeSubmitting(false);
  };

  // ──────────── STEP 3: Location ────────────
  const requestLocation = () => {
    setLocationError("");
    if (!navigator.geolocation) { setLocationError("Geolocation not supported"); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude, lng = pos.coords.longitude;
        setStaffLat(lat);
        setStaffLng(lng);
        setLocationVerifiedAt(new Date().toISOString());
        if (staff?.terminalLat && staff?.terminalLng) {
          setGeoDistance(Math.round(haversineMeters(lat, lng, staff.terminalLat, staff.terminalLng)));
        }
        setPhase("ready");
      },
      (err) => {
        setLocationError(err.code === 1 ? "Location permission denied. You must allow location access." : "Unable to get location. Please try again.");
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  };

  // ──────────── STEP 4: Load lookup ────────────
  const lookupLoad = () => {
    if (!loadInput.trim()) return;
    setLookupStatus("loading");
    setLoadData(null);
    fetch(`/api/access/lookup/${token}/${loadInput.trim()}`)
      .then(r => { if (!r.ok) { setLookupStatus("not_found"); return null; } return r.json(); })
      .then(data => { if (!data) return; setLoadData(data); setLookupStatus("found"); })
      .catch(() => setLookupStatus("not_found"));
  };

  // ──────────── STEP 5: Decision ────────────
  const submitDecision = (dec: "approved" | "denied") => {
    if (dec === "denied" && !denyReason.trim()) return;
    setDecision("submitting");
    fetch(`/api/access/decide/${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ loadId: loadData?.load?.id, driverId: loadData?.load?.driverId, decision: dec, denyReason: dec === "denied" ? denyReason : undefined, staffLat, staffLng, geofenceDistanceMeters: geoDistance, locationVerifiedAt }),
    })
      .then(r => r.json())
      .then(() => setPhase(dec))
      .catch(() => setDecision("pending"));
  };

  // ═══════════════════════════════════════════════════════════════════
  //  RENDERS
  // ═══════════════════════════════════════════════════════════════════

  // ──── Loading ────
  if (phase === "loading") {
    return (
      <div className="min-h-screen bg-[#0B1120] flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 mx-auto mb-4 rounded-full border-2 border-transparent border-t-[#1473FF] border-r-[#BE01FF] animate-spin" />
          <p className="text-slate-500 text-[13px] tracking-wide">Validating access...</p>
        </div>
      </div>
    );
  }

  // ──── Error States ────
  if (phase === "expired" || phase === "error" || phase === "locked") {
    return (
      <div className="min-h-screen bg-[#0B1120] flex items-center justify-center p-6">
        <div className="max-w-sm w-full text-center">
          <BrandHeader />
          <div className={`${glass} p-8`}>
            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-5">
              {phase === "locked" ? <Lock className="w-7 h-7 text-red-400" /> : <ShieldX className="w-7 h-7 text-red-400" />}
            </div>
            <h2 className="text-lg font-semibold text-white mb-2 tracking-tight">
              {phase === "expired" ? "Link Expired" : phase === "locked" ? "Link Locked" : "Invalid Link"}
            </h2>
            <p className="text-slate-400 text-[13px] leading-relaxed">
              {phase === "expired" ? "This access link has expired. Contact your manager for a new link."
                : phase === "locked" ? "Too many incorrect attempts. This link has been locked."
                : errorMsg || "This link is invalid or has been revoked."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ──── Code Entry ────
  if (phase === "code_entry") {
    return (
      <div className="min-h-screen bg-[#0B1120] flex items-center justify-center p-6">
        <div className="max-w-sm w-full">
          <BrandHeader subtitle="Access Verification" />
          <div className={`${glass} p-8`}>
            <GradientBar />
            <div className="mt-6 mb-2 text-center">
              <p className="text-slate-400 text-[13px]">Enter the 6-digit code from your manager</p>
            </div>

            <div className="flex justify-center gap-2.5 my-6">
              {codeDigits.map((d, i) => (
                <input
                  key={i}
                  ref={el => { codeRefs.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={d}
                  onChange={e => handleCodeInput(i, e.target.value)}
                  onKeyDown={e => handleCodeKeyDown(i, e)}
                  className="w-12 h-14 text-center text-xl font-semibold bg-white/[0.04] border border-white/[0.08] rounded-xl text-white focus:border-[#1473FF] focus:ring-1 focus:ring-[#1473FF]/30 focus:outline-none transition-all"
                />
              ))}
            </div>

            {codeError && (
              <div className="flex items-center justify-center gap-1.5 text-red-400 text-[13px] mb-4">
                <AlertTriangle className="w-3.5 h-3.5" />{codeError}
              </div>
            )}

            <button
              onClick={submitCode}
              disabled={codeDigits.join("").length !== 6 || codeSubmitting}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white font-semibold text-[14px] transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-[#1473FF]/20 active:scale-[0.98]"
            >
              {codeSubmitting ? <Loader2 className="w-4.5 h-4.5 animate-spin" /> : <KeyRound className="w-4.5 h-4.5" />}
              {codeSubmitting ? "Verifying..." : "Verify Code"}
            </button>
          </div>

          {staff && (
            <p className="text-center text-slate-600 text-[11px] mt-5 tracking-wide">
              {staff.name} &middot; {ROLE_LABELS[staff.staffRole] || staff.staffRole}
            </p>
          )}
        </div>
      </div>
    );
  }

  // ──── Location Check ────
  if (phase === "location_check") {
    return (
      <div className="min-h-screen bg-[#0B1120] flex items-center justify-center p-6">
        <div className="max-w-sm w-full">
          <BrandHeader subtitle="Location Verification" />
          <div className={`${glass} p-8`}>
            <GradientBar />
            <div className="mt-6 mb-6 text-center">
              <div className="w-14 h-14 rounded-full bg-[#1473FF]/10 flex items-center justify-center mx-auto mb-4">
                <Navigation className="w-6 h-6 text-[#1473FF]" />
              </div>
              <p className="text-slate-400 text-[13px] leading-relaxed">
                Enable location services to verify you are at the{" "}
                <span className="text-slate-300">{staff?.locationType && staff.locationType !== "terminal" ? (staff.locationName || staff.locationType.replace(/_/g, " ")) : "terminal"}</span>
              </p>
            </div>

            <button
              onClick={requestLocation}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white font-semibold text-[14px] flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-[#1473FF]/20 active:scale-[0.98] transition-all"
            >
              <MapPin className="w-4.5 h-4.5" />Enable Location
            </button>

            {locationError && (
              <div className="flex items-center gap-1.5 text-red-400 text-[13px] mt-4">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />{locationError}
              </div>
            )}
          </div>

          {staff && (
            <div className="text-center mt-5">
              <p className="text-slate-600 text-[11px] tracking-wide">{staff.name} &middot; {ROLE_LABELS[staff.staffRole] || staff.staffRole}</p>
              {staff.terminalName && <p className="text-[#1473FF]/40 text-[11px] mt-0.5">{staff.terminalName}</p>}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ──── Decision Result ────
  if (phase === "approved" || phase === "denied") {
    const isApproved = phase === "approved";
    return (
      <div className="min-h-screen bg-[#0B1120] flex items-center justify-center p-6">
        <div className="max-w-sm w-full text-center">
          <BrandHeader />
          <div className={`${glass} p-8`}>
            <div className={`w-20 h-20 rounded-full mx-auto mb-5 flex items-center justify-center ${isApproved ? "bg-emerald-500/10" : "bg-red-500/10"}`}>
              {isApproved
                ? <CheckCircle className="w-9 h-9 text-emerald-400" />
                : <XCircle className="w-9 h-9 text-red-400" />}
            </div>
            <h2 className={`text-xl font-bold mb-2 tracking-tight ${isApproved ? "text-emerald-400" : "text-red-400"}`}>
              {isApproved ? "Access Approved" : "Access Denied"}
            </h2>
            <p className="text-slate-400 text-[13px]">
              Load #{loadData?.load?.id} &mdash; {isApproved ? "Driver cleared for entry" : (denyReason || "Entry denied")}
            </p>
            <p className="text-slate-600 text-[11px] mt-2">{new Date().toLocaleString()}</p>

            <button
              onClick={() => { setPhase("ready"); setDecision("pending"); setLoadData(null); setLoadInput(""); setLookupStatus("idle"); setDenyReason(""); }}
              className="mt-6 px-6 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] text-slate-300 text-[13px] font-medium hover:bg-white/[0.08] transition-all"
            >
              Validate Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════
  //  READY — Main Validation UI
  // ═══════════════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-[#0B1120] p-4 pb-8 max-w-lg mx-auto">
      {/* Header */}
      <div className="text-center pt-4 pb-5">
        <img src="/eusotrip-logo.png" alt="EusoTrip" className="w-10 h-10 mx-auto mb-3 object-contain rounded-[10px]" />
        <h1 className="text-[17px] font-bold text-white tracking-tight">Access Validation</h1>
        {staff && (
          <div className="mt-1.5">
            <p className="text-slate-300 text-[13px] font-medium">{staff.name}</p>
            <p className="text-slate-500 text-[11px] tracking-wide">{ROLE_LABELS[staff.staffRole] || staff.staffRole}{staff.assignedZone ? ` \u00b7 ${staff.assignedZone}` : ""}</p>
            {staff.terminalName && <p className="text-[#1473FF]/50 text-[11px]">{staff.terminalName}</p>}
          </div>
        )}
      </div>

      {/* Security badges */}
      <div className="flex items-center justify-center gap-2 mb-5">
        <span className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-400/8 border border-emerald-400/10 px-2.5 py-1 rounded-full font-medium">
          <KeyRound className="w-3 h-3" />Verified
        </span>
        <span className={`flex items-center gap-1 text-[10px] px-2.5 py-1 rounded-full font-medium border ${
          geoDistance !== null && geoDistance <= GEOFENCE_RADIUS_METERS
            ? "text-emerald-400 bg-emerald-400/8 border-emerald-400/10"
            : geoDistance !== null
            ? "text-amber-400 bg-amber-400/8 border-amber-400/10"
            : "text-[#1473FF] bg-[#1473FF]/8 border-[#1473FF]/10"
        }`}>
          <MapPin className="w-3 h-3" />
          {geoDistance !== null
            ? geoDistance <= GEOFENCE_RADIUS_METERS
              ? `On-site (${geoDistance}m)`
              : `${geoDistance}m away`
            : "Located"}
        </span>
        {expiresAt && (
          <span className="flex items-center gap-1 text-[10px] text-slate-500 bg-white/[0.03] border border-white/[0.04] px-2.5 py-1 rounded-full">
            <Clock className="w-3 h-3" />{new Date(expiresAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
        )}
      </div>

      {/* Load Lookup Card */}
      <div className={`${glass} p-5 mb-4`}>
        <GradientBar />
        <h2 className="text-white font-semibold text-[14px] mt-4 mb-1 flex items-center gap-2 tracking-tight">
          <Search className="w-4 h-4 text-[#1473FF]" />Look Up Arrival
        </h2>
        <p className="text-slate-500 text-[12px] mb-4">Enter the load number from the driver's paperwork or QR code</p>
        <div className="flex gap-2">
          <input
            type="text"
            inputMode="numeric"
            value={loadInput}
            onChange={e => setLoadInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && lookupLoad()}
            placeholder="Load # (e.g. 1234)"
            className="flex-1 bg-white/[0.04] border border-white/[0.06] rounded-xl px-4 py-3 text-white text-[14px] placeholder-slate-600 focus:border-[#1473FF] focus:ring-1 focus:ring-[#1473FF]/20 focus:outline-none transition-all"
          />
          <button
            onClick={lookupLoad}
            disabled={lookupStatus === "loading"}
            className="px-5 py-3 bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white rounded-xl text-[13px] font-semibold transition-all disabled:opacity-40 hover:shadow-lg hover:shadow-[#1473FF]/20 active:scale-[0.97]"
          >
            {lookupStatus === "loading" ? <Loader2 className="w-4 h-4 animate-spin" /> : "Look Up"}
          </button>
        </div>
        {lookupStatus === "not_found" && (
          <div className="mt-3 flex items-center gap-1.5 text-red-400 text-[12px]">
            <AlertTriangle className="w-3.5 h-3.5" />Load not found. Check the number and try again.
          </div>
        )}
      </div>

      {/* Load Details + Decision */}
      {loadData && (
        <div className={`${glass} p-5 space-y-4`}>
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-white font-semibold text-[14px] flex items-center gap-2 tracking-tight">
                <Truck className="w-4 h-4 text-[#1473FF]" />Load #{loadData.load.id}
              </h2>
              <span className={`text-[11px] px-2.5 py-1 rounded-full font-medium border ${
                loadData.load.status === "in_transit" ? "bg-blue-500/8 text-blue-400 border-blue-400/10" :
                loadData.load.status === "at_pickup" ? "bg-amber-500/8 text-amber-400 border-amber-400/10" :
                loadData.load.status === "delivered" ? "bg-emerald-500/8 text-emerald-400 border-emerald-400/10" :
                "bg-white/[0.03] text-slate-400 border-white/[0.04]"
              }`}>
                {loadData.load.status?.replace(/_/g, " ")}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2.5 text-[12px]">
              <div className={`${glassInner} p-3`}>
                <p className="text-slate-500 mb-1 flex items-center gap-1 text-[11px]"><MapPin className="w-3 h-3" />Origin</p>
                <p className="text-white font-medium">{loadData.load.pickupCity}, {loadData.load.pickupState}</p>
              </div>
              <div className={`${glassInner} p-3`}>
                <p className="text-slate-500 mb-1 flex items-center gap-1 text-[11px]"><MapPin className="w-3 h-3" />Destination</p>
                <p className="text-white font-medium">{loadData.load.deliveryCity}, {loadData.load.deliveryState}</p>
              </div>
              <div className={`${glassInner} p-3`}>
                <p className="text-slate-500 mb-1 flex items-center gap-1 text-[11px]"><Package className="w-3 h-3" />Cargo</p>
                <p className="text-white font-medium">{loadData.load.cargoType || "N/A"} &mdash; {loadData.load.equipmentType || "N/A"}</p>
              </div>
              <div className={`${glassInner} p-3`}>
                <p className="text-slate-500 mb-1 text-[11px]">Weight</p>
                <p className="text-white font-medium">{loadData.load.weight ? `${Number(loadData.load.weight).toLocaleString()} lbs` : "N/A"}</p>
              </div>
            </div>
            {loadData.load.referenceNumber && <p className="text-slate-600 text-[11px] mt-2">Ref: {loadData.load.referenceNumber}</p>}
          </div>

          {loadData.driver && (
            <div className={`${glassInner} p-3`}>
              <p className="text-slate-500 text-[11px] mb-1 flex items-center gap-1"><User className="w-3 h-3" />Driver</p>
              <p className="text-white font-medium text-[13px]">{loadData.driver.name}</p>
              {loadData.driver.email && <p className="text-slate-500 text-[11px]">{loadData.driver.email}</p>}
            </div>
          )}

          {loadData.shipper && (
            <div className={`${glassInner} p-3`}>
              <p className="text-slate-500 text-[11px] mb-1">Shipper</p>
              <p className="text-white font-medium text-[13px]">{loadData.shipper.name}</p>
            </div>
          )}

          {/* Geofence warning */}
          {geoDistance !== null && geoDistance > GEOFENCE_RADIUS_METERS && (
            <div className="bg-amber-500/8 border border-amber-500/15 rounded-xl p-3.5 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-amber-400 text-[12px] font-medium">Outside geofence</p>
                <p className="text-amber-500/60 text-[11px]">You are {geoDistance}m from the terminal. Expected within {GEOFENCE_RADIUS_METERS}m. This will be logged.</p>
              </div>
            </div>
          )}

          {staff?.canApproveAccess && (
            <div className="pt-2 space-y-3">
              {decision === "pending" ? (
                <>
                  <button
                    onClick={() => submitDecision("approved")}
                    className="w-full py-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-[16px] flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg shadow-emerald-500/20"
                  >
                    <ShieldCheck className="w-5 h-5" />Approve Access
                  </button>
                  <div>
                    <input
                      type="text"
                      value={denyReason}
                      onChange={e => setDenyReason(e.target.value)}
                      placeholder="Deny reason (required)..."
                      className="w-full bg-white/[0.04] border border-white/[0.06] rounded-xl px-4 py-2.5 text-white text-[13px] placeholder-slate-600 focus:border-red-500/50 focus:outline-none mb-2 transition-all"
                    />
                    <button
                      onClick={() => submitDecision("denied")}
                      disabled={!denyReason.trim()}
                      className="w-full py-3 rounded-xl bg-red-500/80 hover:bg-red-500 text-white font-medium text-[14px] flex items-center justify-center gap-2 transition-all disabled:opacity-20 disabled:cursor-not-allowed"
                    >
                      <ShieldX className="w-4.5 h-4.5" />Deny Access
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center gap-2.5 py-6">
                  <div className="w-5 h-5 rounded-full border-2 border-transparent border-t-[#1473FF] border-r-[#BE01FF] animate-spin" />
                  <span className="text-slate-400 text-[13px]">Recording decision...</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="text-center mt-6">
        <p className="text-[10px] tracking-[0.08em] text-slate-700 uppercase">
          <span className="bg-gradient-to-r from-[#1473FF]/30 to-[#BE01FF]/30 bg-clip-text text-transparent">EusoTrip</span>
          {" "}&middot; Token + Code + Geofence Secured
        </p>
      </div>
    </div>
  );
}
