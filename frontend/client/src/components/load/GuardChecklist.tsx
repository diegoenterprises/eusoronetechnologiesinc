/**
 * GuardChecklist — Shows blocked guard requirements for the next transition
 *
 * Displays what compliance checks the driver/dispatcher needs to satisfy
 * before a transition can execute (GPS, HOS, documents, etc.)
 */

import {
  MapPin, Clock, FileText, Shield, AlertTriangle,
  CheckCircle2, XCircle, Loader2, Navigation, Heart,
} from "lucide-react";

interface BlockedTransition {
  transitionId: string;
  to: string;
  toMeta?: { displayName?: string; icon?: string };
  canExecute: boolean;
  blockedReasons: string[];
}

interface GuardChecklistProps {
  blockedTransitions: BlockedTransition[];
  className?: string;
}

const GUARD_ICONS: Record<string, React.ReactNode> = {
  gps: <MapPin className="w-3.5 h-3.5" />,
  geofence: <Navigation className="w-3.5 h-3.5" />,
  location: <MapPin className="w-3.5 h-3.5" />,
  hos: <Clock className="w-3.5 h-3.5" />,
  hours: <Clock className="w-3.5 h-3.5" />,
  document: <FileText className="w-3.5 h-3.5" />,
  bol: <FileText className="w-3.5 h-3.5" />,
  pod: <FileText className="w-3.5 h-3.5" />,
  inspection: <Shield className="w-3.5 h-3.5" />,
  pre_trip: <Shield className="w-3.5 h-3.5" />,
  hazmat: <AlertTriangle className="w-3.5 h-3.5" />,
  endorsement: <Shield className="w-3.5 h-3.5" />,
};

function getIconForReason(reason: string): React.ReactNode {
  const lower = reason.toLowerCase();
  for (const [key, icon] of Object.entries(GUARD_ICONS)) {
    if (lower.includes(key)) return icon;
  }
  return <AlertTriangle className="w-3.5 h-3.5" />;
}

export default function GuardChecklist({ blockedTransitions, className = "" }: GuardChecklistProps) {
  if (blockedTransitions.length === 0) return null;

  const allReasons = blockedTransitions.flatMap(t =>
    t.blockedReasons.map(r => ({
      reason: r,
      targetState: t.toMeta?.displayName || t.to.replace(/_/g, " "),
    }))
  );

  if (allReasons.length === 0) return null;

  return (
    <div className={`rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 ${className}`}>
      <div className="flex items-center gap-2 mb-3">
        <Shield className="w-4 h-4 text-amber-500" />
        <p className="text-xs font-semibold text-amber-400">Compliance Requirements</p>
        <span className="text-[10px] text-amber-500/60 ml-auto">{allReasons.length} item{allReasons.length !== 1 ? "s" : ""}</span>
      </div>
      <div className="space-y-2">
        {allReasons.map((item, i) => (
          <div key={i} className="flex items-start gap-2.5">
            <div className="mt-0.5 text-amber-500/70">
              {getIconForReason(item.reason)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-slate-300 leading-relaxed">{item.reason}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">Required for: {item.targetState}</p>
            </div>
            <XCircle className="w-3.5 h-3.5 text-red-400/60 flex-shrink-0 mt-0.5" />
          </div>
        ))}
      </div>
    </div>
  );
}
