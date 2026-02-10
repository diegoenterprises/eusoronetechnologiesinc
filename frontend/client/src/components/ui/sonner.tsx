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
            background: "#0f1629ee",
            border: "1.5px solid transparent",
            borderImage: "linear-gradient(135deg, #1473FF, #BE01FF) 1",
            borderRadius: "16px",
            color: "#fff",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            fontWeight: 600,
            fontSize: "13px",
            padding: "14px 20px",
            boxShadow: "0 8px 32px rgba(20, 115, 255, 0.15), 0 2px 8px rgba(0,0,0,0.4)",
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
            "--normal-bg": "#0f1629ee",
            "--normal-text": "#ffffff",
            "--normal-border": "transparent",
            "--success-bg": "#0f1629ee",
            "--success-text": "#ffffff",
            "--success-border": "transparent",
            "--error-bg": "#0f1629ee",
            "--error-text": "#ffffff",
            "--error-border": "transparent",
            "--warning-bg": "#0f1629ee",
            "--warning-text": "#ffffff",
            "--warning-border": "transparent",
            "--info-bg": "#0f1629ee",
            "--info-text": "#ffffff",
            "--info-border": "transparent",
          } as React.CSSProperties
        }
        {...props}
      />
      <style>{`
        .euso-toast {
          border-radius: 16px !important;
          background: linear-gradient(#0f1629ee, #0f1629ee) padding-box,
                      linear-gradient(135deg, #1473FF, #BE01FF) border-box !important;
          border: 1.5px solid transparent !important;
          color: #fff !important;
          backdrop-filter: blur(16px) !important;
          -webkit-backdrop-filter: blur(16px) !important;
        }
        .euso-toast [data-title] {
          color: #fff !important;
          font-weight: 700 !important;
        }
        .euso-toast [data-description] {
          color: rgba(255,255,255,0.7) !important;
        }
        .euso-toast [data-close-button] {
          color: rgba(255,255,255,0.5) !important;
          border-color: rgba(255,255,255,0.1) !important;
          background: rgba(255,255,255,0.05) !important;
        }
        .euso-toast [data-close-button]:hover {
          color: #fff !important;
          background: rgba(255,255,255,0.1) !important;
        }
        .euso-toast [data-icon] svg {
          width: 18px !important;
          height: 18px !important;
        }
        .euso-toast-success [data-icon] svg { color: #34d399 !important; }
        .euso-toast-error [data-icon] svg { color: #f87171 !important; }
        .euso-toast-warning [data-icon] svg { color: #fbbf24 !important; }
        .euso-toast-info [data-icon] svg { color: #22d3ee !important; }
        [data-sonner-toaster] [data-button] {
          background: linear-gradient(135deg, #1473FF, #BE01FF) !important;
          color: #fff !important;
          border: none !important;
          border-radius: 10px !important;
          font-weight: 700 !important;
          font-size: 12px !important;
          padding: 6px 14px !important;
        }
        [data-sonner-toaster] [data-cancel] {
          background: rgba(255,255,255,0.05) !important;
          color: rgba(255,255,255,0.9) !important;
          border: 1px solid rgba(190, 1, 255, 0.3) !important;
          border-radius: 10px !important;
          font-weight: 700 !important;
          font-size: 12px !important;
        }
      `}</style>
    </>
  );
};

export { Toaster };
