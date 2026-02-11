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

      {/* Card — gradient border via wrapper technique */}
      <div
        className="relative p-[1.5px] rounded-2xl"
        style={{
          background: "linear-gradient(135deg, #1473FF, #BE01FF)",
          animation: "eusoDialogScaleIn 0.2s ease-out",
        }}
      >
        <div className="relative bg-[#0f1629]/95 backdrop-blur-xl rounded-2xl px-10 py-10 min-w-[420px] max-w-[540px]">
          {/* Close X */}
          <button
            onClick={() => onClose(false)}
            className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Icon */}
          {defaults.icon && (
            <div className="flex justify-center mb-5">
              {defaults.icon}
            </div>
          )}

          {/* Title */}
          {dialog.title && (
            <h3 className="text-center text-white font-bold text-xl mb-3">{dialog.title}</h3>
          )}

          {/* Message */}
          <p className="text-center text-white/90 text-base leading-relaxed mb-8">
            {dialog.message}
          </p>

          {/* Buttons */}
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => onClose(true)}
              className="px-8 py-3 rounded-xl text-base font-bold text-white transition-all hover:opacity-90 hover:scale-[1.02] active:scale-[0.98]"
              style={{ background: "linear-gradient(135deg, #1473FF, #BE01FF)" }}
            >
              {confirmLabel}
            </button>
            {showCancel && (
              <button
                onClick={() => onClose(false)}
                className="px-8 py-3 rounded-xl text-base font-bold text-white/90 border border-[#BE01FF]/50 bg-white/5 hover:bg-white/10 transition-all hover:scale-[1.02] active:scale-[0.98]"
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
