/**
 * EUSOTRIP ANIMATION LIBRARY
 * Reusable Framer Motion components and variants.
 * Drop these into any page to bring it alive.
 */

import React from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";

// =============================================================================
// EASING CURVES
// =============================================================================

export const EASE_OUT_EXPO: [number, number, number, number] = [0.22, 1, 0.36, 1];
export const EASE_OUT_CUBIC: [number, number, number, number] = [0.33, 1, 0.68, 1];
export const EASE_SPRING = { type: "spring" as const, stiffness: 300, damping: 30 };

// =============================================================================
// REUSABLE VARIANTS
// =============================================================================

export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.06,
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
    },
  }),
};

export const fadeInDown: Variants = {
  hidden: { opacity: 0, y: -20 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.06,
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
    },
  }),
};

export const fadeInLeft: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: (i: number = 0) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: i * 0.06,
      duration: 0.4,
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
    },
  }),
};

export const fadeInRight: Variants = {
  hidden: { opacity: 0, x: 20 },
  visible: (i: number = 0) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: i * 0.06,
      duration: 0.4,
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
    },
  }),
};

export const fadeInScale: Variants = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: (i: number = 0) => ({
    opacity: 1,
    scale: 1,
    transition: {
      delay: i * 0.06,
      duration: 0.45,
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
    },
  }),
};

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.1,
    },
  },
};

export const staggerContainerFast: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.04,
      delayChildren: 0.05,
    },
  },
};

// =============================================================================
// ANIMATED WRAPPER COMPONENTS
// =============================================================================

interface AnimatedProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

/**
 * Wraps page content with a smooth entrance animation.
 * Use this in DashboardLayout for automatic page transitions.
 */
export function PageTransition({ children, className = "" }: AnimatedProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] as const }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * Fade in + slide up. Great for cards, sections, headers.
 */
export function FadeInUp({ children, className = "", delay = 0 }: AnimatedProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] as const }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * Fade in + scale up. Great for modals, hero elements, stats.
 */
export function FadeInScale({ children, className = "", delay = 0 }: AnimatedProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] as const }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * Slide in from left. Great for sidebar items, navigation.
 */
export function SlideInLeft({ children, className = "", delay = 0 }: AnimatedProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -24 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.22, 1, 0.36, 1] as const }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * Stagger container — wraps children that use fadeInUp/fadeInScale variants.
 */
export function StaggerContainer({ children, className = "", delay = 0 }: AnimatedProps) {
  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      transition={{ delayChildren: delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * Individual stagger item — use inside StaggerContainer.
 */
export function StaggerItem({ children, className = "" }: Omit<AnimatedProps, "delay">) {
  return (
    <motion.div variants={fadeInUp} className={className}>
      {children}
    </motion.div>
  );
}

// =============================================================================
// DOMINO CASCADE — 3D perspective flip-in with stagger
// Automatically wraps each direct child in a domino entrance animation.
// Wire this into DashboardLayout to bring every page alive.
// =============================================================================

export const dominoChild: Variants = {
  hidden: {
    opacity: 0,
    y: 40,
    rotateX: -25,
    scale: 0.94,
    filter: "blur(4px)",
  },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    rotateX: 0,
    scale: 1,
    filter: "blur(0px)",
    transition: {
      delay: i * 0.07,
      duration: 0.55,
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
    },
  }),
  exit: {
    opacity: 0,
    y: -12,
    scale: 0.98,
    transition: { duration: 0.2 },
  },
};

export const dominoContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.07,
      delayChildren: 0.05,
    },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.15 },
  },
};

/**
 * DominoPage — wraps page content and auto-staggers every direct child
 * with a 3D domino-cascade entrance. Uses perspective for depth.
 *
 * Usage:  <DominoPage>{children}</DominoPage>
 *
 * Every direct child element (div, Card, section, etc.) gets its own
 * staggered entrance — no changes needed inside page components.
 */
export function DominoPage({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const childArray = React.Children.toArray(children);
  return (
    <motion.div
      variants={dominoContainer}
      initial="hidden"
      animate="visible"
      exit="exit"
      className={className}
      style={{ perspective: 1200 }}
    >
      {childArray.map((child, i) => (
        <motion.div
          key={i}
          variants={dominoChild}
          custom={i}
          style={{ transformOrigin: "top center" }}
        >
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
}

// =============================================================================
// INTERACTIVE COMPONENTS
// =============================================================================

interface HoverCardProps {
  children: React.ReactNode;
  className?: string;
  glowOnHover?: boolean;
}

/**
 * Card with hover lift + optional glow effect.
 */
export function HoverCard({ children, className = "", glowOnHover = false }: HoverCardProps) {
  return (
    <motion.div
      whileHover={{
        y: -3,
        boxShadow: glowOnHover
          ? "0 8px 30px rgba(20, 115, 255, 0.2), 0 0 40px rgba(190, 1, 255, 0.1)"
          : "0 8px 30px rgba(0, 0, 0, 0.3)",
      }}
      whileTap={{ scale: 0.985 }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] as const }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * Button with press animation.
 */
export function PressableButton({ children, className = "", ...props }: React.ComponentProps<typeof motion.button>) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.96 }}
      transition={{ duration: 0.15 }}
      className={className}
      {...props}
    >
      {children}
    </motion.button>
  );
}

// =============================================================================
// STAT / NUMBER COUNTER
// =============================================================================

interface AnimatedNumberProps {
  value: number;
  duration?: number;
  className?: string;
  prefix?: string;
  suffix?: string;
}

/**
 * Animated number counter that counts up from 0.
 */
export function AnimatedNumber({ value, duration = 1.2, className = "", prefix = "", suffix = "" }: AnimatedNumberProps) {
  const [display, setDisplay] = React.useState(0);

  React.useEffect(() => {
    let start = 0;
    const end = value;
    if (start === end) return;

    const startTime = performance.now();
    const step = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / (duration * 1000), 1);
      // Ease out expo
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(start + (end - start) * eased);
      setDisplay(current);
      if (progress < 1) {
        requestAnimationFrame(step);
      }
    };
    requestAnimationFrame(step);
  }, [value, duration]);

  return (
    <motion.span
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] as const }}
      className={className}
    >
      {prefix}{display.toLocaleString()}{suffix}
    </motion.span>
  );
}

// =============================================================================
// PRESENCE ANIMATIONS
// =============================================================================

interface AnimatePresenceWrapperProps {
  children: React.ReactNode;
  show: boolean;
  className?: string;
}

/**
 * Show/hide with animation.
 */
export function AnimatedPresence({ children, show, className = "" }: AnimatePresenceWrapperProps) {
  return (
    <AnimatePresence mode="wait">
      {show && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] as const }}
          className={className}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// =============================================================================
// LOADING ANIMATIONS
// =============================================================================

/**
 * Brand-colored loading spinner with gradient.
 */
export function BrandSpinner({ size = 40 }: { size?: number }) {
  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      style={{ width: size, height: size }}
      className="rounded-full border-2 border-transparent"
    >
      <svg width={size} height={size} viewBox="0 0 40 40">
        <defs>
          <linearGradient id="spinner-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1473FF" />
            <stop offset="100%" stopColor="#BE01FF" />
          </linearGradient>
        </defs>
        <circle
          cx="20" cy="20" r="17"
          fill="none"
          stroke="url(#spinner-gradient)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray="80 40"
        />
      </svg>
    </motion.div>
  );
}

/**
 * Typing indicator (three dots).
 */
export function TypingIndicator() {
  return (
    <div className="flex items-center gap-1">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-2 h-2 rounded-full bg-blue-400"
          animate={{ y: [0, -4, 0], opacity: [0.3, 1, 0.3] }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            delay: i * 0.2,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

// =============================================================================
// NOTIFICATION BADGE
// =============================================================================

/**
 * Animated notification badge that bounces on value change.
 */
export function NotificationBadge({ count, className = "" }: { count: number; className?: string }) {
  return (
    <AnimatePresence mode="wait">
      {count > 0 && (
        <motion.span
          key={count}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ type: "spring", stiffness: 500, damping: 25 }}
          className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-bold text-white bg-red-500 rounded-full ${className}`}
        >
          {count > 99 ? "99+" : count}
        </motion.span>
      )}
    </AnimatePresence>
  );
}

// =============================================================================
// AMBIENT BACKGROUND
// =============================================================================

/**
 * Subtle animated gradient orbs for backgrounds.
 */
export function AmbientGlow() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
      <motion.div
        className="absolute -top-40 -right-40 w-96 h-96 rounded-full opacity-[0.03]"
        style={{ background: "radial-gradient(circle, #1473FF 0%, transparent 70%)" }}
        animate={{
          x: [0, 30, -20, 0],
          y: [0, -20, 30, 0],
          scale: [1, 1.1, 0.95, 1],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full opacity-[0.03]"
        style={{ background: "radial-gradient(circle, #BE01FF 0%, transparent 70%)" }}
        animate={{
          x: [0, -30, 20, 0],
          y: [0, 20, -30, 0],
          scale: [1, 0.95, 1.1, 1],
        }}
        transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}
