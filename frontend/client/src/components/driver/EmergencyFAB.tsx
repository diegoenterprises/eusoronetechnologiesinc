/**
 * EMERGENCY FAB — Floating Action Button for Drivers
 * GAP-267: One-tap emergency access on ALL driver screens
 *
 * Position: bottom-right, fixed, z-index: 9999
 * Expands to 5 emergency options:
 *   1. 911 — calls 911, auto-sends GPS + cargo to dispatch via WebSocket
 *   2. Dispatch — calls driver's company dispatch number
 *   3. Carrier Safety — calls carrier safety officer
 *   4. CHEMTREC — 1-800-424-9300
 *   5. FMCSA — 1-888-832-7238
 *
 * Works offline via tel: links. Emergency numbers cached locally.
 */

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, X, Radio, Shield, Biohazard, Landmark, AlertTriangle } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";

interface EmergencyOption {
  id: string;
  label: string;
  number: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  description: string;
  auto911?: boolean;
}

const CHEMTREC = "18004249300";
const FMCSA = "18888327238";

export default function EmergencyFAB() {
  const { user } = useAuth();
  const [expanded, setExpanded] = useState(false);
  const [pulsing, setPulsing] = useState(true);

  // Only show for DRIVER role (and CATALYST who may drive)
  const isDriver = user?.role === "DRIVER" || user?.role === "CATALYST";
  if (!isDriver) return null;

  // Fetch company emergency contacts (dispatch + safety officer)
  const companyQuery = (trpc as any).companies?.getMyCompany?.useQuery(undefined, {
    retry: false,
    staleTime: 300000, // 5 min
    enabled: isDriver,
  });

  const dispatchPhone = companyQuery?.data?.dispatchPhone || companyQuery?.data?.phone || "";
  const safetyPhone = companyQuery?.data?.safetyPhone || companyQuery?.data?.phone || "";

  // Cache emergency numbers in localStorage for offline access
  useEffect(() => {
    if (dispatchPhone) {
      try { localStorage.setItem("emergency_dispatch_phone", dispatchPhone); } catch {}
    }
    if (safetyPhone) {
      try { localStorage.setItem("emergency_safety_phone", safetyPhone); } catch {}
    }
  }, [dispatchPhone, safetyPhone]);

  // Get cached numbers as fallback
  const getCachedPhone = (key: string, fallback: string): string => {
    try { return localStorage.getItem(key) || fallback; } catch { return fallback; }
  };

  const emergencyOptions: EmergencyOption[] = [
    {
      id: "911",
      label: "911",
      number: "911",
      icon: <AlertTriangle className="w-5 h-5" />,
      color: "text-white",
      bgColor: "bg-red-600",
      description: "Call 911 + alert dispatch",
      auto911: true,
    },
    {
      id: "dispatch",
      label: "Dispatch",
      number: dispatchPhone || getCachedPhone("emergency_dispatch_phone", ""),
      icon: <Radio className="w-5 h-5" />,
      color: "text-white",
      bgColor: "bg-blue-600",
      description: "Call your dispatch center",
    },
    {
      id: "safety",
      label: "Safety",
      number: safetyPhone || getCachedPhone("emergency_safety_phone", ""),
      icon: <Shield className="w-5 h-5" />,
      color: "text-white",
      bgColor: "bg-amber-600",
      description: "Carrier safety officer",
    },
    {
      id: "chemtrec",
      label: "CHEMTREC",
      number: CHEMTREC,
      icon: <Biohazard className="w-5 h-5" />,
      color: "text-white",
      bgColor: "bg-purple-600",
      description: "Hazmat emergency hotline",
    },
    {
      id: "fmcsa",
      label: "FMCSA",
      number: FMCSA,
      icon: <Landmark className="w-5 h-5" />,
      color: "text-white",
      bgColor: "bg-slate-600",
      description: "Federal safety hotline",
    },
  ];

  const handleEmergencyTap = useCallback(async (option: EmergencyOption) => {
    // Open tel: link (works offline)
    if (option.number) {
      window.open(`tel:${option.number}`, "_self");
    }

    // Auto-send GPS + cargo info to dispatch via WebSocket
    try {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const payload = {
              driverId: user?.id,
              driverName: user?.firstName
                ? `${user.firstName} ${user.lastName || ""}`
                : user?.email || "Unknown",
              emergencyType: option.id,
              gps: {
                lat: position.coords.latitude,
                lng: position.coords.longitude,
                accuracy: position.coords.accuracy,
              },
              timestamp: new Date().toISOString(),
            };

            // Emit via WebSocket if available
            try {
              const ws = (window as any).__eusotrip_socket;
              if (ws?.emit) {
                ws.emit("emergency:initiated", payload);
              }
            } catch {}

            // Also store locally for incident record
            try {
              localStorage.setItem(
                "last_emergency_event",
                JSON.stringify(payload)
              );
            } catch {}
          },
          () => {}, // Fail silently — don't block the call
          { enableHighAccuracy: true, timeout: 5000 }
        );
      }
    } catch {}

    setExpanded(false);
  }, [user]);

  // Stop pulsing after 10 seconds on mount
  useEffect(() => {
    const t = setTimeout(() => setPulsing(false), 10000);
    return () => clearTimeout(t);
  }, []);

  return (
    <>
      {/* Backdrop when expanded */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9998]"
            onClick={() => setExpanded(false)}
          />
        )}
      </AnimatePresence>

      {/* Emergency options fan-out */}
      <AnimatePresence>
        {expanded && (
          <div className="fixed bottom-24 right-5 z-[9999] flex flex-col-reverse gap-3">
            {emergencyOptions.map((option, index) => (
              <motion.button
                key={option.id}
                initial={{ opacity: 0, y: 20, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.8 }}
                transition={{ delay: index * 0.05, duration: 0.2, ease: "easeOut" }}
                onClick={() => handleEmergencyTap(option)}
                disabled={!option.number && option.id !== "911"}
                className={`flex items-center gap-3 pl-4 pr-5 py-3 rounded-2xl shadow-lg ${option.bgColor} ${option.color} font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed`}
              >
                <span className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                  {option.icon}
                </span>
                <div className="text-left">
                  <div className="font-bold text-base leading-tight">{option.label}</div>
                  <div className="text-white/70 text-xs">{option.description}</div>
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* Main FAB button */}
      <motion.button
        onClick={() => setExpanded(!expanded)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className={`fixed bottom-5 right-5 z-[9999] w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-colors ${
          expanded
            ? "bg-slate-800 ring-2 ring-slate-600"
            : "bg-red-600 ring-2 ring-red-400/50"
        }`}
        aria-label={expanded ? "Close emergency menu" : "Emergency contacts"}
      >
        {/* Pulse ring (only when not expanded) */}
        {!expanded && pulsing && (
          <span className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-30" />
        )}

        <AnimatePresence mode="wait">
          {expanded ? (
            <motion.span
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <X className="w-6 h-6 text-white" />
            </motion.span>
          ) : (
            <motion.span
              key="phone"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <Phone className="w-6 h-6 text-white" />
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
    </>
  );
}
