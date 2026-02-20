/**
 * ACCESS VALIDATION PAGE — Lightweight 24h Token-Based
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
};

// Haversine distance in meters
function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const GEOFENCE_RADIUS_METERS = 500; // 500m radius

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
}

export default function AccessValidation() {
  const params = useParams<{ token: string }>();
  const token = params?.token || "";

  // Phase state: loading → code_entry → location_check → ready → (decision result)
  const [phase, setPhase] = useState<"loading" | "code_entry" | "location_check" | "ready" | "approved" | "denied" | "expired" | "locked" | "error">("loading");

  const [staff, setStaff] = useState<StaffInfo | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  // Code entry
  const [codeDigits, setCodeDigits] = useState(["", "", "", "", "", ""]);
  const [codeError, setCodeError] = useState("");
  const [codeSubmitting, setCodeSubmitting] = useState(false);
  const codeRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Location
  const [staffLat, setStaffLat] = useState<number | null>(null);
  const [staffLng, setStaffLng] = useState<number | null>(null);
  const [geoDistance, setGeoDistance] = useState<number | null>(null);
  const [locationVerifiedAt, setLocationVerifiedAt] = useState<string | null>(null);
  const [locationError, setLocationError] = useState("");

  // Load lookup
  const [loadInput, setLoadInput] = useState("");
  const [lookupStatus, setLookupStatus] = useState<"idle" | "loading" | "found" | "not_found">("idle");
  const [loadData, setLoadData] = useState<{ load: any; driver: any; shipper: any } | null>(null);

  // Decision
  const [decision, setDecision] = useState<"pending" | "submitting">("pending");
  const [denyReason, setDenyReason] = useState("");

  // ──────────── STEP 1: Validate token on mount ────────────
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
        if (data.codeVerified) {
          setPhase("location_check");
        } else {
          setPhase("code_entry");
        }
      })
      .catch(() => { setPhase("error"); setErrorMsg("Connection failed"); });
  }, [token]);

  // ──────────── STEP 2: Code entry handlers ────────────
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

  // ──────────── STEP 3: Location services ────────────
  const requestLocation = () => {
    setLocationError("");
    if (!navigator.geolocation) {
      setLocationError("Geolocation not supported by this browser");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setStaffLat(lat);
        setStaffLng(lng);
        const now = new Date().toISOString();
        setLocationVerifiedAt(now);

        if (staff?.terminalLat && staff?.terminalLng) {
          const dist = haversineMeters(lat, lng, staff.terminalLat, staff.terminalLng);
          setGeoDistance(Math.round(dist));
        }
        setPhase("ready");
      },
      (err) => {
        if (err.code === 1) setLocationError("Location permission denied. You must allow location access to validate arrivals.");
        else setLocationError("Unable to get location. Please try again.");
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
      .then(r => {
        if (!r.ok) { setLookupStatus("not_found"); return null; }
        return r.json();
      })
      .then(data => {
        if (!data) return;
        setLoadData(data);
        setLookupStatus("found");
      })
      .catch(() => setLookupStatus("not_found"));
  };

  // ──────────── STEP 5: Decision ────────────
  const submitDecision = (dec: "approved" | "denied") => {
    if (dec === "denied" && !denyReason.trim()) return;
    setDecision("submitting");
    fetch(`/api/access/decide/${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        loadId: loadData?.load?.id,
        driverId: loadData?.load?.driverId,
        decision: dec,
        denyReason: dec === "denied" ? denyReason : undefined,
        staffLat,
        staffLng,
        geofenceDistanceMeters: geoDistance,
        locationVerifiedAt,
      }),
    })
      .then(r => r.json())
      .then(() => setPhase(dec))
      .catch(() => setDecision("pending"));
  };

  // ═══════════════ RENDERS ═══════════════

  // Loading
  if (phase === "loading") {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-cyan-400 animate-spin mx-auto mb-3" />
          <p className="text-slate-400 text-sm">Validating access link...</p>
        </div>
      </div>
    );
  }

  // Expired / Error / Locked
  if (phase === "expired" || phase === "error" || phase === "locked") {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          {phase === "locked" ? <Lock className="w-12 h-12 text-red-400 mx-auto mb-4" /> : <ShieldX className="w-12 h-12 text-red-400 mx-auto mb-4" />}
          <h1 className="text-xl font-bold text-white mb-2">
            {phase === "expired" ? "Link Expired" : phase === "locked" ? "Link Locked" : "Invalid Link"}
          </h1>
          <p className="text-slate-400 text-sm">
            {phase === "expired" ? "This access link has expired (24h). Contact your manager for a new link."
              : phase === "locked" ? "Too many incorrect code attempts. This link has been locked. Contact your manager."
              : errorMsg || "This link is invalid or has been revoked."}
          </p>
        </div>
      </div>
    );
  }

  // ──────── Phase: CODE ENTRY ────────
  if (phase === "code_entry") {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="text-center max-w-sm w-full">
          <Shield className="w-12 h-12 text-cyan-400 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-white mb-1">Access Verification</h1>
          <p className="text-slate-400 text-sm mb-6">Enter the 6-digit code provided by your manager</p>

          <div className="flex justify-center gap-2 mb-4">
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
                className="w-12 h-14 text-center text-2xl font-bold bg-slate-800 border-2 border-slate-700 rounded-xl text-white focus:border-cyan-500 focus:outline-none transition"
              />
            ))}
          </div>

          {codeError && (
            <p className="text-red-400 text-sm mb-4 flex items-center justify-center gap-1">
              <AlertTriangle className="w-4 h-4" />{codeError}
            </p>
          )}

          <button
            onClick={submitCode}
            disabled={codeDigits.join("").length !== 6 || codeSubmitting}
            className="w-full py-3 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-semibold transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {codeSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <KeyRound className="w-5 h-5" />}
            {codeSubmitting ? "Verifying..." : "Verify Code"}
          </button>

          {staff && (
            <p className="text-slate-600 text-xs mt-4">{staff.name} - {ROLE_LABELS[staff.staffRole] || staff.staffRole}</p>
          )}
        </div>
      </div>
    );
  }

  // ──────── Phase: LOCATION CHECK ────────
  if (phase === "location_check") {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="text-center max-w-sm w-full">
          <Navigation className="w-12 h-12 text-cyan-400 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-white mb-1">Location Verification</h1>
          <p className="text-slate-400 text-sm mb-6">
            Location services must be enabled to verify you are at the terminal or pickup location
          </p>

          <button
            onClick={requestLocation}
            className="w-full py-4 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-semibold transition flex items-center justify-center gap-2"
          >
            <MapPin className="w-5 h-5" />Enable Location Services
          </button>

          {locationError && (
            <p className="text-red-400 text-sm mt-4 flex items-center justify-center gap-1">
              <AlertTriangle className="w-4 h-4" />{locationError}
            </p>
          )}

          {staff && (
            <div className="mt-6 text-slate-600 text-xs">
              <p>{staff.name} - {ROLE_LABELS[staff.staffRole] || staff.staffRole}</p>
              {staff.terminalName && <p className="text-cyan-600/50 mt-1">{staff.terminalName}</p>}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ──────── Phase: DECISION RESULT ────────
  if (phase === "approved" || phase === "denied") {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          {phase === "approved" ? (
            <>
              <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-10 h-10 text-green-400" />
              </div>
              <h1 className="text-2xl font-bold text-green-400 mb-2">Access Approved</h1>
              <p className="text-slate-400 text-sm">Load #{loadData?.load?.id} — Driver cleared for entry</p>
              <p className="text-slate-600 text-xs mt-2">{new Date().toLocaleString()}</p>
            </>
          ) : (
            <>
              <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-10 h-10 text-red-400" />
              </div>
              <h1 className="text-2xl font-bold text-red-400 mb-2">Access Denied</h1>
              <p className="text-slate-400 text-sm">Load #{loadData?.load?.id} — {denyReason || "Entry denied"}</p>
              <p className="text-slate-600 text-xs mt-2">{new Date().toLocaleString()}</p>
            </>
          )}
          <button
            onClick={() => { setPhase("ready"); setDecision("pending"); setLoadData(null); setLoadInput(""); setLookupStatus("idle"); setDenyReason(""); }}
            className="mt-6 px-6 py-2 rounded-lg bg-slate-800 text-slate-300 text-sm hover:bg-slate-700 transition"
          >
            Validate Another
          </button>
        </div>
      </div>
    );
  }

  // ──────── Phase: READY — Main validation UI ────────
  return (
    <div className="min-h-screen bg-slate-950 p-4 max-w-lg mx-auto">
      {/* Header */}
      <div className="text-center mb-5 pt-3">
        <Shield className="w-8 h-8 text-cyan-400 mx-auto mb-1" />
        <h1 className="text-lg font-bold text-white">Access Validation</h1>
        {staff && (
          <div className="mt-1">
            <p className="text-slate-300 text-sm font-medium">{staff.name}</p>
            <p className="text-slate-500 text-xs">{ROLE_LABELS[staff.staffRole] || staff.staffRole}{staff.assignedZone ? ` — ${staff.assignedZone}` : ""}</p>
            {staff.terminalName && <p className="text-cyan-500/60 text-xs">{staff.terminalName}</p>}
          </div>
        )}
      </div>

      {/* Security badges */}
      <div className="flex items-center justify-center gap-3 mb-4">
        <span className="flex items-center gap-1 text-[10px] text-green-500 bg-green-500/10 px-2 py-1 rounded-full">
          <KeyRound className="w-3 h-3" />Code Verified
        </span>
        <span className={`flex items-center gap-1 text-[10px] px-2 py-1 rounded-full ${
          geoDistance !== null && geoDistance <= GEOFENCE_RADIUS_METERS
            ? "text-green-500 bg-green-500/10"
            : geoDistance !== null
            ? "text-yellow-500 bg-yellow-500/10"
            : "text-cyan-500 bg-cyan-500/10"
        }`}>
          <MapPin className="w-3 h-3" />
          {geoDistance !== null
            ? geoDistance <= GEOFENCE_RADIUS_METERS
              ? `On-site (${geoDistance}m)`
              : `${geoDistance}m away`
            : "Location tracked"}
        </span>
        {expiresAt && (
          <span className="flex items-center gap-1 text-[10px] text-slate-500 bg-slate-500/10 px-2 py-1 rounded-full">
            <Clock className="w-3 h-3" />{new Date(expiresAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
        )}
      </div>

      {/* Load Lookup */}
      <div className="bg-slate-900/80 rounded-2xl p-5 border border-slate-800 mb-4">
        <h2 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
          <Search className="w-4 h-4 text-cyan-400" />Look Up Arrival
        </h2>
        <p className="text-slate-500 text-xs mb-3">Enter the load number from the driver's QR code or paperwork</p>
        <div className="flex gap-2">
          <input
            type="text"
            inputMode="numeric"
            value={loadInput}
            onChange={e => setLoadInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && lookupLoad()}
            placeholder="Load # (e.g. 1234)"
            className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
          />
          <button
            onClick={lookupLoad}
            disabled={lookupStatus === "loading"}
            className="px-5 py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-sm font-medium transition disabled:opacity-50"
          >
            {lookupStatus === "loading" ? <Loader2 className="w-4 h-4 animate-spin" /> : "Look Up"}
          </button>
        </div>
        {lookupStatus === "not_found" && (
          <div className="mt-3 flex items-center gap-2 text-red-400 text-xs">
            <AlertTriangle className="w-4 h-4" />Load not found. Check the number and try again.
          </div>
        )}
      </div>

      {/* Load Details + Decision */}
      {loadData && (
        <div className="bg-slate-900/80 rounded-2xl p-5 border border-slate-800 space-y-4">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-white font-semibold text-sm flex items-center gap-2">
                <Truck className="w-4 h-4 text-cyan-400" />Load #{loadData.load.id}
              </h2>
              <span className={`text-xs px-2 py-1 rounded-full ${
                loadData.load.status === "in_transit" ? "bg-blue-500/20 text-blue-400" :
                loadData.load.status === "at_pickup" ? "bg-yellow-500/20 text-yellow-400" :
                loadData.load.status === "delivered" ? "bg-green-500/20 text-green-400" :
                "bg-slate-500/20 text-slate-400"
              }`}>
                {loadData.load.status?.replace(/_/g, " ")}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-800/50 rounded-lg p-3">
                <p className="text-slate-500 mb-1 flex items-center gap-1"><MapPin className="w-3 h-3" />Origin</p>
                <p className="text-white font-medium">{loadData.load.pickupCity}, {loadData.load.pickupState}</p>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-3">
                <p className="text-slate-500 mb-1 flex items-center gap-1"><MapPin className="w-3 h-3" />Destination</p>
                <p className="text-white font-medium">{loadData.load.deliveryCity}, {loadData.load.deliveryState}</p>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-3">
                <p className="text-slate-500 mb-1 flex items-center gap-1"><Package className="w-3 h-3" />Cargo</p>
                <p className="text-white font-medium">{loadData.load.cargoType || "N/A"} — {loadData.load.equipmentType || "N/A"}</p>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-3">
                <p className="text-slate-500 mb-1">Weight</p>
                <p className="text-white font-medium">{loadData.load.weight ? `${Number(loadData.load.weight).toLocaleString()} lbs` : "N/A"}</p>
              </div>
            </div>
            {loadData.load.referenceNumber && <p className="text-slate-500 text-xs mt-2">Ref: {loadData.load.referenceNumber}</p>}
          </div>

          {loadData.driver && (
            <div className="bg-slate-800/50 rounded-lg p-3">
              <p className="text-slate-500 text-xs mb-1 flex items-center gap-1"><User className="w-3 h-3" />Driver</p>
              <p className="text-white font-medium text-sm">{loadData.driver.name}</p>
              {loadData.driver.email && <p className="text-slate-500 text-xs">{loadData.driver.email}</p>}
            </div>
          )}

          {loadData.shipper && (
            <div className="bg-slate-800/50 rounded-lg p-3">
              <p className="text-slate-500 text-xs mb-1">Shipper</p>
              <p className="text-white font-medium text-sm">{loadData.shipper.name}</p>
            </div>
          )}

          {/* Geofence warning */}
          {geoDistance !== null && geoDistance > GEOFENCE_RADIUS_METERS && (
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-yellow-400 text-xs font-medium">Outside geofence</p>
                <p className="text-yellow-500/70 text-[10px]">You are {geoDistance}m from the terminal. Expected within {GEOFENCE_RADIUS_METERS}m. This will be logged.</p>
              </div>
            </div>
          )}

          {staff?.canApproveAccess && (
            <div className="pt-2 space-y-3">
              {decision === "pending" ? (
                <>
                  <button
                    onClick={() => submitDecision("approved")}
                    className="w-full py-4 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold text-lg flex items-center justify-center gap-2 transition active:scale-[0.98]"
                  >
                    <ShieldCheck className="w-6 h-6" />Approve Access
                  </button>
                  <div>
                    <input
                      type="text"
                      value={denyReason}
                      onChange={e => setDenyReason(e.target.value)}
                      placeholder="Deny reason (required)..."
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-white text-sm placeholder-slate-500 focus:border-red-500 focus:outline-none mb-2"
                    />
                    <button
                      onClick={() => submitDecision("denied")}
                      disabled={!denyReason.trim()}
                      className="w-full py-3 rounded-xl bg-red-600/80 hover:bg-red-600 text-white font-medium flex items-center justify-center gap-2 transition disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <ShieldX className="w-5 h-5" />Deny Access
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center gap-2 py-4">
                  <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />
                  <span className="text-slate-400 text-sm">Recording decision...</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <p className="text-center text-slate-700 text-[10px] mt-6">
        EusoTrip Access Validation — Token + Code + Geofence secured
      </p>
    </div>
  );
}
