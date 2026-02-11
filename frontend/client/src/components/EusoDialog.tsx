/**
 * EUSO DIALOG — Brand-standard modal dialog system
 *
 * Matches the EusoTrip design language:
 * - Dark glassmorphic card with gradient border
 * - Centered white text
 * - Gradient action button (blue→purple) + outlined cancel button
 * - Smooth backdrop overlay
 *
 * Usage via context:
 *   const { confirm, success, error, warning, info } = useEusoDialog();
 *   const ok = await confirm("Are you sure?");
 *   success("Profile saved");
 */
import React, { createContext, useContext, useState, useCallback, useRef } from "react";
import { CheckCircle, AlertTriangle, XCircle, Info, X } from "lucide-react";

/* ─── Types ──────────────────────────────────────────────────── */
type DialogVariant = "confirm" | "success" | "error" | "warning" | "info";

interface DialogConfig {
  variant: DialogVariant;
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  showCancel?: boolean;
}

interface DialogState extends DialogConfig {
  id: number;
  resolve: (value: boolean) => void;
}

interface EusoDialogContextValue {
  confirm: (message: string, opts?: Partial<DialogConfig>) => Promise<boolean>;
  success: (message: string, opts?: Partial<DialogConfig>) => Promise<boolean>;
  error: (message: string, opts?: Partial<DialogConfig>) => Promise<boolean>;
  warning: (message: string, opts?: Partial<DialogConfig>) => Promise<boolean>;
  info: (message: string, opts?: Partial<DialogConfig>) => Promise<boolean>;
}

const EusoDialogContext = createContext<EusoDialogContextValue | null>(null);

export function useEusoDialog(): EusoDialogContextValue {
  const ctx = useContext(EusoDialogContext);
  if (!ctx) throw new Error("useEusoDialog must be used within <EusoDialogProvider>");
  return ctx;
}

/* ─── Variant Config ─────────────────────────────────────────── */
const VARIANT_DEFAULTS: Record<DialogVariant, { icon: React.ReactNode; confirmLabel: string; showCancel: boolean }> = {
  confirm: { icon: null, confirmLabel: "Confirm", showCancel: true },
  success: { icon: <CheckCircle className="w-8 h-8 text-emerald-400" />, confirmLabel: "OK", showCancel: false },
  error: { icon: <XCircle className="w-8 h-8 text-red-400" />, confirmLabel: "OK", showCancel: false },
  warning: { icon: <AlertTriangle className="w-8 h-8 text-amber-400" />, confirmLabel: "OK", showCancel: true },
  info: { icon: <Info className="w-8 h-8 text-cyan-400" />, confirmLabel: "OK", showCancel: false },
};

/* ─── Dialog Card ────────────────────────────────────────────── */
function DialogCard({ dialog, onClose }: { dialog: DialogState; onClose: (result: boolean) => void }) {
  const defaults = VARIANT_DEFAULTS[dialog.variant];
  const confirmLabel = dialog.confirmLabel || defaults.confirmLabel;
  const cancelLabel = dialog.cancelLabel || "Cancel";
  const showCancel = dialog.showCancel ?? defaults.showCancel;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{ animation: "eusoDialogFadeIn 0.2s ease-out" }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => onClose(false)}
      />

      {/* Card — dark solid card, no border, subtle top glow */}
      <div
        className="relative rounded-2xl overflow-hidden min-w-[420px] max-w-[540px]"
        style={{
          background: "linear-gradient(180deg, #161d35 0%, #0d1224 100%)",
          boxShadow: "0 25px 60px rgba(0,0,0,0.6), 0 0 80px rgba(20, 115, 255, 0.08)",
          animation: "eusoDialogScaleIn 0.2s ease-out",
        }}
      >
        {/* Subtle top gradient glow line */}
        <div
          className="absolute top-0 left-0 right-0 h-[2px]"
          style={{ background: "linear-gradient(90deg, transparent, rgba(20,115,255,0.5), rgba(190,1,255,0.5), transparent)" }}
        />

        <div className="px-12 py-12">
          {/* Title */}
          {dialog.title && (
            <h3 className="text-center text-white font-semibold text-xl mb-4">{dialog.title}</h3>
          )}

          {/* Message */}
          <p className="text-center text-white text-lg leading-relaxed mb-10">
            {dialog.message}
          </p>

          {/* Buttons */}
          <div className="flex items-center justify-center gap-5">
            <button
              onClick={() => onClose(true)}
              className="px-10 py-3.5 rounded-xl text-base font-bold text-white transition-all hover:opacity-90 hover:scale-[1.02] active:scale-[0.98]"
              style={{ background: "linear-gradient(135deg, #1473FF, #BE01FF)" }}
            >
              {confirmLabel}
            </button>
            {showCancel && (
              <button
                onClick={() => onClose(false)}
                className="px-10 py-3.5 rounded-xl text-base font-bold text-white/90 transition-all hover:bg-white/5 hover:scale-[1.02] active:scale-[0.98]"
                style={{ border: "1.5px solid rgba(100, 140, 255, 0.4)" }}
              >
                {cancelLabel}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Keyframe animations injected once */}
      <style>{`
        @keyframes eusoDialogFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes eusoDialogScaleIn {
          from { opacity: 0; transform: scale(0.92); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}

/* ─── Provider ───────────────────────────────────────────────── */
export function EusoDialogProvider({ children }: { children: React.ReactNode }) {
  const [dialogs, setDialogs] = useState<DialogState[]>([]);
  const idRef = useRef(0);

  const show = useCallback((variant: DialogVariant, message: string, opts?: Partial<DialogConfig>) => {
    return new Promise<boolean>((resolve) => {
      const id = ++idRef.current;
      setDialogs((prev) => [
        ...prev,
        { id, variant, message, resolve, ...opts },
      ]);
    });
  }, []);

  const close = useCallback((id: number, result: boolean) => {
    setDialogs((prev) => {
      const dialog = prev.find((d) => d.id === id);
      dialog?.resolve(result);
      return prev.filter((d) => d.id !== id);
    });
  }, []);

  const ctx: EusoDialogContextValue = {
    confirm: (msg, opts) => show("confirm", msg, { showCancel: true, ...opts }),
    success: (msg, opts) => show("success", msg, opts),
    error: (msg, opts) => show("error", msg, opts),
    warning: (msg, opts) => show("warning", msg, { showCancel: true, ...opts }),
    info: (msg, opts) => show("info", msg, opts),
  };

  return (
    <EusoDialogContext.Provider value={ctx}>
      {children}
      {dialogs.map((d) => (
        <DialogCard key={d.id} dialog={d} onClose={(result) => close(d.id, result)} />
      ))}
    </EusoDialogContext.Provider>
  );
}
