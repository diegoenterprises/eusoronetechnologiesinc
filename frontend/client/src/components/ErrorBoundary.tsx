import { cn } from "@/lib/utils";
import { AlertTriangle, RotateCcw, Home, Bug } from "lucide-react";
import { Component, ReactNode, ErrorInfo } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console in development
    console.error('[ErrorBoundary] Caught error:', error, errorInfo);
    
    // Store error info for display
    this.setState({ errorInfo });
    
    // Send error to monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      this.reportError(error, errorInfo);
    }
  }

  private reportError(error: Error, errorInfo: ErrorInfo) {
    // Report to error monitoring service (e.g., Sentry, LogRocket)
    try {
      const errorReport = {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent,
      };
      
      // Send to backend error logging endpoint
      fetch('/api/errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(errorReport),
      }).catch(() => {
        // Silently fail if error reporting fails
      });
    } catch {
      // Silently fail
    }
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const isDev = process.env.NODE_ENV === 'development';

      return (
        <div className="flex items-center justify-center min-h-screen p-8 bg-slate-900">
          <div className="flex flex-col items-center w-full max-w-2xl p-8 bg-slate-800/50 rounded-xl border border-slate-700">
            <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mb-6">
              <AlertTriangle size={32} className="text-red-400" />
            </div>

            <h2 className="text-2xl font-bold text-white mb-2">Something went wrong</h2>
            <p className="text-slate-400 text-center mb-6">
              We apologize for the inconvenience. Please try refreshing the page or go back to the dashboard.
            </p>

            {/* Error details (only in development) */}
            {isDev && this.state.error && (
              <div className="p-4 w-full rounded-lg bg-slate-900/50 border border-slate-700 overflow-auto mb-6 max-h-64">
                <div className="flex items-center gap-2 text-red-400 mb-2">
                  <Bug size={16} />
                  <span className="font-medium">{this.state.error.name}: {this.state.error.message}</span>
                </div>
                <pre className="text-xs text-slate-500 whitespace-pre-wrap">
                  {this.state.error.stack}
                </pre>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => window.location.href = '/'}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg",
                  "bg-slate-700 text-white",
                  "hover:bg-slate-600 transition-colors"
                )}
              >
                <Home size={16} />
                Go to Dashboard
              </button>
              <button
                onClick={() => window.location.reload()}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg",
                  "bg-blue-600 text-white",
                  "hover:bg-blue-500 transition-colors"
                )}
              >
                <RotateCcw size={16} />
                Reload Page
              </button>
            </div>

            {/* Error ID for support */}
            <p className="text-xs text-slate-600 mt-6">
              Error ID: {Date.now().toString(36).toUpperCase()}
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
