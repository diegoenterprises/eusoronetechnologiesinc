import { useTheme } from "@/contexts/ThemeContext";
import { Toaster as Sonner, type ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme } = useTheme();

  return (
    <>
      <Sonner
        theme={theme as ToasterProps["theme"]}
        className="toaster group"
        position="top-center"
        toastOptions={{
          className: "euso-toast",
          style: {
            background: "linear-gradient(180deg, #161d35 0%, #0d1224 100%)",
            border: "none",
            borderRadius: "20px",
            color: "#fff",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            fontWeight: 500,
            fontSize: "18px",
            padding: "40px 48px",
            boxShadow: "0 25px 60px rgba(0,0,0,0.6), 0 0 80px rgba(20, 115, 255, 0.08)",
            textAlign: "center" as const,
            maxWidth: "540px",
            width: "540px",
            lineHeight: "1.5",
          },
          classNames: {
            success: "euso-toast-success",
            error: "euso-toast-error",
            warning: "euso-toast-warning",
            info: "euso-toast-info",
          },
        }}
        style={
          {
            "--normal-bg": "#0d1224",
            "--normal-text": "#ffffff",
            "--normal-border": "transparent",
            "--success-bg": "#0d1224",
            "--success-text": "#ffffff",
            "--success-border": "transparent",
            "--error-bg": "#0d1224",
            "--error-text": "#ffffff",
            "--error-border": "transparent",
            "--warning-bg": "#0d1224",
            "--warning-text": "#ffffff",
            "--warning-border": "transparent",
            "--info-bg": "#0d1224",
            "--info-text": "#ffffff",
            "--info-border": "transparent",
          } as React.CSSProperties
        }
        {...props}
      />
      <style>{`
        /* ── Center toasts as modal dialogs in middle of viewport ── */
        [data-sonner-toaster] {
          --width: 540px !important;
          --offset: 0px !important;
          position: fixed !important;
          top: 50% !important;
          left: 50% !important;
          transform: translate(-50%, -50%) !important;
          z-index: 99999 !important;
        }

        /* Backdrop overlay behind the toast */
        [data-sonner-toaster]::before {
          content: '';
          position: fixed;
          inset: -200vh -200vw;
          background: rgba(0, 0, 0, 0.60);
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
          z-index: -1;
          pointer-events: none;
        }

        /* Hide backdrop when no toasts visible */
        [data-sonner-toaster]:empty::before {
          display: none;
        }

        .euso-toast {
          border-radius: 20px !important;
          background: linear-gradient(180deg, #161d35 0%, #0d1224 100%) !important;
          border: none !important;
          color: #fff !important;
          backdrop-filter: blur(24px) !important;
          -webkit-backdrop-filter: blur(24px) !important;
          padding: 40px 48px !important;
          text-align: center !important;
          width: 540px !important;
          max-width: 540px !important;
          font-size: 18px !important;
          line-height: 1.5 !important;
          box-shadow: 0 25px 60px rgba(0,0,0,0.6), 0 0 80px rgba(20, 115, 255, 0.08) !important;
        }

        /* Subtle top gradient glow */
        .euso-toast::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg, transparent, rgba(20,115,255,0.5), rgba(190,1,255,0.5), transparent);
          border-radius: 20px 20px 0 0;
        }

        .euso-toast [data-title] {
          color: #fff !important;
          font-weight: 500 !important;
          font-size: 18px !important;
          text-align: center !important;
          justify-content: center !important;
          line-height: 1.5 !important;
        }
        .euso-toast [data-description] {
          color: rgba(255,255,255,0.75) !important;
          font-size: 15px !important;
          text-align: center !important;
          line-height: 1.5 !important;
        }
        .euso-toast [data-close-button] {
          color: rgba(255,255,255,0.4) !important;
          border-color: transparent !important;
          background: transparent !important;
          top: 12px !important;
          right: 12px !important;
        }
        .euso-toast [data-close-button]:hover {
          color: #fff !important;
          background: rgba(255,255,255,0.08) !important;
        }
        .euso-toast [data-icon] svg {
          width: 22px !important;
          height: 22px !important;
        }
        .euso-toast-success [data-icon] svg { color: #34d399 !important; }
        .euso-toast-error [data-icon] svg { color: #f87171 !important; }
        .euso-toast-warning [data-icon] svg { color: #fbbf24 !important; }
        .euso-toast-info [data-icon] svg { color: #22d3ee !important; }

        /* Action button — gradient fill */
        [data-sonner-toaster] [data-button] {
          background: linear-gradient(135deg, #1473FF, #BE01FF) !important;
          color: #fff !important;
          border: none !important;
          border-radius: 12px !important;
          font-weight: 700 !important;
          font-size: 15px !important;
          padding: 12px 32px !important;
        }
        /* Cancel button — outlined */
        [data-sonner-toaster] [data-cancel] {
          background: transparent !important;
          color: rgba(255,255,255,0.9) !important;
          border: 1.5px solid rgba(100, 140, 255, 0.4) !important;
          border-radius: 12px !important;
          font-weight: 700 !important;
          font-size: 15px !important;
          padding: 12px 32px !important;
        }
      `}</style>
    </>
  );
};

export { Toaster };
