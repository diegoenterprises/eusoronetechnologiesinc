/**
 * StatePanel — Context-aware panel that renders state-specific content
 *
 * Switches on the load's current state to show the most relevant
 * information and actions for that phase of the lifecycle.
 */

import { motion } from "framer-motion";
import { MapPin, Package, Clock, FileText, Truck, AlertTriangle, DollarSign, Shield, Navigation, Thermometer, Snowflake, FlaskConical, ShieldAlert, Scale } from "lucide-react";
import LoadStatusBadge, { STATE_META } from "./LoadStatusBadge";

interface StatePanelProps {
  currentState: string;
  load: {
    id: string;
    loadNumber?: string;
    origin?: { city?: string; state?: string };
    destination?: { city?: string; state?: string };
    rate?: number;
    weight?: number;
    distance?: number;
    cargoType?: string;
    hazmatClass?: string;
    pickupDate?: string;
    deliveryDate?: string;
    driverName?: string;
    carrierName?: string;
  };
  activeTimers?: Array<{
    type: string;
    status: string;
    currentCharge: number;
    freeTimeRemaining: number;
  }>;
  className?: string;
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | undefined }) {
  if (!value) return null;
  return (
    <div className="flex items-center gap-2.5 py-1.5">
      <span className="text-gray-500 flex-shrink-0">{icon}</span>
      <span className="text-xs text-gray-500 w-20 flex-shrink-0">{label}</span>
      <span className="text-sm text-gray-200 font-medium">{value}</span>
    </div>
  );
}

export default function StatePanel({ currentState, load, activeTimers = [], className = "" }: StatePanelProps) {
  const normalized = currentState.toUpperCase().replace(/-/g, "_");
  const meta = STATE_META[normalized];
  if (!meta) return null;

  const hasActiveDetention = activeTimers.some(t => t.type === "DETENTION" && (t.status === "FREE_TIME" || t.status === "BILLING"));
  const hasActiveDemurrage = activeTimers.some(t => t.type === "DEMURRAGE" && (t.status === "FREE_TIME" || t.status === "BILLING"));
  const hasActivePumpTime = activeTimers.some(t => t.type === "PUMP_TIME" && (t.status === "FREE_TIME" || t.status === "BILLING"));
  const hasActiveBlowOff = activeTimers.some(t => t.type === "BLOW_OFF" && (t.status === "FREE_TIME" || t.status === "BILLING"));

  const renderContent = () => {
    switch (meta.category) {
      case "CREATION":
        return (
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-3">
              <Package size={16} className="text-gray-400" />
              <span className="text-sm font-medium text-gray-300">Load Details</span>
            </div>
            <InfoRow icon={<MapPin size={14} />} label="Origin" value={load.origin ? `${load.origin.city}, ${load.origin.state}` : undefined} />
            <InfoRow icon={<MapPin size={14} />} label="Destination" value={load.destination ? `${load.destination.city}, ${load.destination.state}` : undefined} />
            <InfoRow icon={<DollarSign size={14} />} label="Rate" value={load.rate ? `$${load.rate.toLocaleString()}` : undefined} />
            <InfoRow icon={<Package size={14} />} label="Weight" value={load.weight ? `${load.weight.toLocaleString()} lbs` : undefined} />
            <InfoRow icon={<Truck size={14} />} label="Distance" value={load.distance ? `${load.distance.toFixed(0)} mi` : undefined} />
            {load.hazmatClass && (
              <InfoRow icon={<AlertTriangle size={14} />} label="Hazmat" value={`Class ${load.hazmatClass}`} />
            )}
          </div>
        );

      case "ASSIGNMENT":
        return (
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-3">
              <Shield size={16} className="text-cyan-400" />
              <span className="text-sm font-medium text-gray-300">Assignment Status</span>
            </div>
            <InfoRow icon={<MapPin size={14} />} label="Route" value={load.origin && load.destination ? `${load.origin.city}, ${load.origin.state} → ${load.destination.city}, ${load.destination.state}` : undefined} />
            {load.carrierName && <InfoRow icon={<Truck size={14} />} label="Carrier" value={load.carrierName} />}
            {load.driverName && <InfoRow icon={<Truck size={14} />} label="Driver" value={load.driverName} />}
            <InfoRow icon={<DollarSign size={14} />} label="Rate" value={load.rate ? `$${load.rate.toLocaleString()}` : undefined} />
            {normalized === "AWARDED" && (
              <motion.div
                className="mt-3 p-3 rounded-lg bg-amber-950/30 border border-amber-900/20"
                animate={{ opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <p className="text-xs text-amber-300">
                  <Clock size={12} className="inline mr-1" />
                  Awaiting carrier response — auto-lapses in 2 hours
                </p>
              </motion.div>
            )}
          </div>
        );

      case "EXECUTION":
        return (
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-3">
              <Navigation size={16} className="text-blue-400" />
              <span className="text-sm font-medium text-gray-300">
                {normalized.includes("PICKUP") || normalized === "LOADING" || normalized === "LOADED"
                  ? "Pickup Operations"
                  : normalized.includes("TRANSIT")
                    ? "Transit Status"
                    : "Delivery Operations"}
              </span>
            </div>
            <InfoRow icon={<MapPin size={14} />} label="Route" value={load.origin && load.destination ? `${load.origin.city} → ${load.destination.city}` : undefined} />
            {load.driverName && <InfoRow icon={<Truck size={14} />} label="Driver" value={load.driverName} />}
            <InfoRow icon={<Truck size={14} />} label="Distance" value={load.distance ? `${load.distance.toFixed(0)} mi` : undefined} />
            {load.pickupDate && <InfoRow icon={<Clock size={14} />} label="Pickup" value={new Date(load.pickupDate).toLocaleDateString()} />}

            {/* Timer warnings */}
            {hasActiveDetention && (
              <motion.div
                className="mt-2 p-2.5 rounded-lg bg-red-950/30 border border-red-900/20"
                animate={{ opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <p className="text-xs text-red-300">
                  <Clock size={12} className="inline mr-1" />
                  Detention timer active
                </p>
              </motion.div>
            )}
            {hasActiveDemurrage && (
              <motion.div
                className="mt-2 p-2.5 rounded-lg bg-red-950/30 border border-red-900/20"
                animate={{ opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <p className="text-xs text-red-300">
                  <Clock size={12} className="inline mr-1" />
                  Demurrage timer active
                </p>
              </motion.div>
            )}
            {hasActivePumpTime && (
              <motion.div
                className="mt-2 p-2.5 rounded-lg bg-amber-950/30 border border-amber-900/20"
                animate={{ opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <p className="text-xs text-amber-300">
                  <Clock size={12} className="inline mr-1" />
                  Pump time timer active
                </p>
              </motion.div>
            )}
            {hasActiveBlowOff && (
              <motion.div
                className="mt-2 p-2.5 rounded-lg bg-amber-950/30 border border-amber-900/20"
                animate={{ opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <p className="text-xs text-amber-300">
                  <Clock size={12} className="inline mr-1" />
                  Blow-off timer active
                </p>
              </motion.div>
            )}

            {/* Exception callout */}
            {meta.isException && (
              <motion.div
                className="mt-2 p-3 rounded-lg bg-red-950/40 border border-red-800/30"
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle size={14} className="text-red-400" />
                  <span className="text-sm font-medium text-red-300">Exception Reported</span>
                </div>
                <p className="text-xs text-red-400/80">
                  This load has an active exception. Resolve the issue to continue the lifecycle.
                </p>
              </motion.div>
            )}
          </div>
        );

      case "COMPLETION":
        return (
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-3">
              <FileText size={16} className="text-purple-400" />
              <span className="text-sm font-medium text-gray-300">Delivery Verification</span>
            </div>
            <InfoRow icon={<MapPin size={14} />} label="Delivered to" value={load.destination ? `${load.destination.city}, ${load.destination.state}` : undefined} />
            <InfoRow icon={<DollarSign size={14} />} label="Rate" value={load.rate ? `$${load.rate.toLocaleString()}` : undefined} />
            {normalized === "POD_PENDING" && (
              <div className="mt-2 p-3 rounded-lg bg-purple-950/30 border border-purple-900/20">
                <p className="text-xs text-purple-300">
                  <Clock size={12} className="inline mr-1" />
                  POD under review — auto-approves in 24 hours if no issues
                </p>
              </div>
            )}
          </div>
        );

      case "FINANCIAL":
        return (
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-3">
              <DollarSign size={16} className="text-emerald-400" />
              <span className="text-sm font-medium text-gray-300">Financial Status</span>
            </div>
            <InfoRow icon={<DollarSign size={14} />} label="Amount" value={load.rate ? `$${load.rate.toLocaleString()}` : undefined} />
            <InfoRow icon={<MapPin size={14} />} label="Route" value={load.origin && load.destination ? `${load.origin.city} → ${load.destination.city}` : undefined} />
            {normalized === "DISPUTED" && (
              <div className="mt-2 p-3 rounded-lg bg-red-950/30 border border-red-900/20">
                <p className="text-xs text-red-300">
                  <AlertTriangle size={12} className="inline mr-1" />
                  Charge dispute filed — awaiting resolution
                </p>
              </div>
            )}
          </div>
        );

      case "EXCEPTION": {
        const EXCEPTION_DETAILS: Record<string, { icon: React.ReactNode; title: string; desc: string; severity: string }> = {
          TEMP_EXCURSION:       { icon: <Thermometer size={16} className="text-red-400" />,    title: "Temperature Excursion",  desc: "Reefer temperature deviated outside acceptable range. Cold chain breach documented.",                     severity: "bg-red-950/40 border-red-800/30" },
          REEFER_BREAKDOWN:     { icon: <Snowflake size={16} className="text-red-400" />,      title: "Reefer Breakdown",       desc: "Refrigeration unit mechanical failure. Layover timer started. Emergency transfer may be needed.",        severity: "bg-red-950/40 border-red-800/30" },
          CONTAMINATION_REJECT: { icon: <FlaskConical size={16} className="text-red-400" />,   title: "Contamination Reject",   desc: "Product rejected due to contamination. Lab test results required. Tank washout charges may apply.",      severity: "bg-red-950/40 border-red-800/30" },
          SEAL_BREACH:          { icon: <ShieldAlert size={16} className="text-red-400" />,    title: "Seal Breach",            desc: "Seal broken, missing, or tampered with. Full cargo inspection required before unloading can proceed.",   severity: "bg-red-950/40 border-red-800/30" },
          WEIGHT_VIOLATION:     { icon: <Scale size={16} className="text-red-400" />,          title: "Weight Violation",       desc: "Load exceeds legal weight limits. Reweigh fee applied. Scale ticket must be uploaded.",                  severity: "bg-red-950/40 border-red-800/30" },
          ON_HOLD:              { icon: <AlertTriangle size={16} className="text-amber-400" />, title: "Compliance Hold",       desc: "Load paused by compliance or admin. Awaiting resolution.",                                               severity: "bg-amber-950/30 border-amber-900/20" },
          CANCELLED:            { icon: <AlertTriangle size={16} className="text-gray-400" />, title: "Load Cancelled",         desc: "This load has been cancelled. Cancellation penalty may apply if after assignment.",                      severity: "bg-slate-800/40 border-slate-700/30" },
        };
        const detail = EXCEPTION_DETAILS[normalized];
        return (
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-3">
              {detail?.icon || <AlertTriangle size={16} className="text-amber-400" />}
              <span className="text-sm font-medium text-gray-300">
                {detail?.title || "Exception"}
              </span>
            </div>
            <InfoRow icon={<MapPin size={14} />} label="Route" value={load.origin && load.destination ? `${load.origin.city} \u2192 ${load.destination.city}` : undefined} />
            <InfoRow icon={<DollarSign size={14} />} label="Rate" value={load.rate ? `$${load.rate.toLocaleString()}` : undefined} />
            {detail && (
              <motion.div
                className={`mt-2 p-3 rounded-lg border ${detail.severity}`}
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
              >
                <p className="text-xs text-red-300/90">{detail.desc}</p>
              </motion.div>
            )}
          </div>
        );
      }

      default:
        return null;
    }
  };

  return (
    <motion.div
      className={`rounded-2xl p-4 ${className}`}
      style={{
        background: "linear-gradient(135deg, #0f172a 0%, #020617 100%)",
        border: `1px solid ${meta.color}15`,
      }}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* State badge header */}
      <div className="flex items-center justify-between mb-4">
        <LoadStatusBadge state={currentState} size="md" />
        {load.loadNumber && (
          <span className="text-xs text-gray-500 font-mono">#{load.loadNumber}</span>
        )}
      </div>

      {renderContent()}
    </motion.div>
  );
}
