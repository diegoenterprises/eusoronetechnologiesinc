
// Loading Skeleton Component
export const WidgetSkeleton: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  return (
    <div className="animate-pulse space-y-3">
      {compact ? (
        <>
          <div className="h-8 bg-gray-700/50 rounded w-3/4 mx-auto"></div>
          <div className="h-4 bg-gray-700/30 rounded w-1/2 mx-auto"></div>
        </>
      ) : (
        <>
          <div className="h-6 bg-gray-700/50 rounded w-full"></div>
          <div className="h-4 bg-gray-700/30 rounded w-3/4"></div>
          <div className="h-4 bg-gray-700/30 rounded w-5/6"></div>
          <div className="space-y-2 mt-4">
            <div className="h-12 bg-gray-700/20 rounded"></div>
            <div className="h-12 bg-gray-700/20 rounded"></div>
          </div>
        </>
      )}
    </div>
  );
};

// Shimmer Effect Component
export const ShimmerEffect: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
    </div>
  );
};

// Pulse Animation Component
export const PulseAnimation: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => {
  return (
    <div className={`animate-pulse-slow ${className}`}>
      {children}
    </div>
  );
};

// Fade In Animation Component
export const FadeIn: React.FC<{ children: React.ReactNode; delay?: number }> = ({ children, delay = 0 }) => {
  return (
    <div 
      className="animate-fade-in"
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
};