/**
 * ModeSelector — Global Transport Mode Selector
 * Pill-shaped toggle for switching between Trucking, Rail, and Vessel modes.
 * Only shows for users with access to multiple modes.
 * Persists selection in localStorage.
 */
import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Truck, TrainFront, Ship } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

// ═══════════════════════════════════════════════════════════════
// TRANSPORT MODE TYPES & ROLE MAPPING
// ═══════════════════════════════════════════════════════════════

export type TransportMode = "TRUCK" | "RAIL" | "VESSEL";

const MODE_CONFIG: Record<TransportMode, { label: string; shortLabel: string; icon: React.FC<{ size?: number; className?: string }>; color: string; gradient: string }> = {
  TRUCK: { label: "Trucking", shortLabel: "Truck", icon: Truck, color: "#F97316", gradient: "from-orange-500 to-amber-400" },
  RAIL: { label: "Rail", shortLabel: "Rail", icon: TrainFront, color: "#3B82F6", gradient: "from-blue-500 to-blue-400" },
  VESSEL: { label: "Maritime", shortLabel: "Vessel", icon: Ship, color: "#06B6D4", gradient: "from-cyan-500 to-cyan-400" },
};

/** Map user roles to their available transport modes */
function getModesForRole(role: string): TransportMode[] {
  switch (role) {
    // Admin/Super Admin: all modes
    case "ADMIN":
    case "SUPER_ADMIN":
      return ["TRUCK", "RAIL", "VESSEL"];

    // Trucking-only roles
    case "SHIPPER":
    case "CATALYST":
    case "BROKER":
    case "DRIVER":
    case "DISPATCH":
    case "ESCORT":
    case "FACTORING":
    case "COMPLIANCE_OFFICER":
    case "SAFETY_MANAGER":
    case "TERMINAL_MANAGER":
      return ["TRUCK"];

    // Rail roles
    case "RAIL_SHIPPER":
    case "RAIL_CARRIER":
    case "RAIL_DISPATCHER":
    case "RAIL_ENGINEER":
    case "RAIL_CONDUCTOR":
    case "RAIL_BROKER":
      return ["RAIL"];

    // Vessel roles
    case "VESSEL_SHIPPER":
    case "VESSEL_OPERATOR":
    case "PORT_MASTER":
    case "SHIP_CAPTAIN":
    case "VESSEL_BROKER":
    case "CUSTOMS_BROKER":
      return ["VESSEL"];

    default:
      return ["TRUCK"];
  }
}

// ═══════════════════════════════════════════════════════════════
// MODE CONTEXT
// ═══════════════════════════════════════════════════════════════

interface ModeContextType {
  activeMode: TransportMode;
  setActiveMode: (mode: TransportMode) => void;
  availableModes: TransportMode[];
  isMultiModal: boolean;
}

const ModeContext = createContext<ModeContextType>({
  activeMode: "TRUCK",
  setActiveMode: () => {},
  availableModes: ["TRUCK"],
  isMultiModal: false,
});

export function useTransportMode() {
  return useContext(ModeContext);
}

const STORAGE_KEY = "eusotrip-transport-mode";

export function ModeProvider({ children, userRole }: { children: React.ReactNode; userRole: string }) {
  const availableModes = getModesForRole(userRole);
  const isMultiModal = availableModes.length > 1;

  const [activeMode, setActiveModeState] = useState<TransportMode>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as TransportMode;
      if (stored && availableModes.includes(stored)) return stored;
    } catch {}
    return availableModes[0];
  });

  const setActiveMode = useCallback((mode: TransportMode) => {
    if (!availableModes.includes(mode)) return;
    setActiveModeState(mode);
    try { localStorage.setItem(STORAGE_KEY, mode); } catch {}
  }, [availableModes]);

  // Sync if role changes and current mode isn't available
  useEffect(() => {
    if (!availableModes.includes(activeMode)) {
      setActiveMode(availableModes[0]);
    }
  }, [availableModes, activeMode, setActiveMode]);

  return (
    <ModeContext.Provider value={{ activeMode, setActiveMode, availableModes, isMultiModal }}>
      {children}
    </ModeContext.Provider>
  );
}

// ═══════════════════════════════════════════════════════════════
// MODE SELECTOR UI (Top Nav Pill Toggle)
// ═══════════════════════════════════════════════════════════════

export function ModeSelector() {
  const { activeMode, setActiveMode, availableModes, isMultiModal } = useTransportMode();
  const { theme } = useTheme();

  // Don't render if user only has one mode
  if (!isMultiModal) return null;

  return (
    <div
      className={`flex items-center rounded-full p-0.5 gap-0.5 ${
        theme === "light"
          ? "bg-slate-100 border border-slate-200"
          : "bg-gray-800/60 border border-gray-700/40"
      }`}
    >
      {availableModes.map((mode) => {
        const config = MODE_CONFIG[mode];
        const Icon = config.icon;
        const isActive = activeMode === mode;

        return (
          <motion.button
            key={mode}
            onClick={() => setActiveMode(mode)}
            className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              isActive
                ? "text-white"
                : theme === "light"
                  ? "text-slate-500 hover:text-slate-700"
                  : "text-gray-400 hover:text-gray-200"
            }`}
            whileHover={{ scale: isActive ? 1 : 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {isActive && (
              <motion.div
                layoutId="mode-pill"
                className="absolute inset-0 rounded-full bg-gradient-to-r from-[#1473FF] to-[#BE01FF]"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              <Icon size={14} />
              <span className="hidden lg:inline">{config.shortLabel}</span>
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MODE BADGE (Sidebar — shows current mode next to logo)
// ═══════════════════════════════════════════════════════════════

export function ModeBadge() {
  const { activeMode, isMultiModal } = useTransportMode();
  const { theme } = useTheme();
  const config = MODE_CONFIG[activeMode];

  // Only show badge for multi-modal users
  if (!isMultiModal) return null;

  return (
    <AnimatePresence mode="wait">
      <motion.span
        key={activeMode}
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 4 }}
        transition={{ duration: 0.2 }}
        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
          theme === "light"
            ? "bg-slate-100 text-slate-600"
            : "bg-gray-800 text-gray-300"
        }`}
        style={{ borderLeft: `2px solid ${config.color}` }}
      >
        {config.label}
      </motion.span>
    </AnimatePresence>
  );
}
