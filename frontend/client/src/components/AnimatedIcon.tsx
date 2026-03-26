/**
 * AnimatedIcon — Drop-in replacement for any lucide icon with hover animation.
 * 
 * Usage:
 *   <AnimatedIcon icon={Truck} className="w-4 h-4" />
 *   <AnimatedIcon icon="Truck" className="w-4 h-4" />
 * 
 * The icon automatically gets its unique hover animation from the platform animation system.
 */

import { motion } from "framer-motion";
import { ICON_ANIMATIONS, DEFAULT_ICON_ANIMATION } from "@/hooks/useIconAnimation";
import type { LucideIcon } from "lucide-react";

interface AnimatedIconProps {
  icon: LucideIcon;
  className?: string;
  size?: number;
  /** Override the icon name for animation lookup (auto-detected from icon.displayName) */
  animationName?: string;
}

export default function AnimatedIcon({ icon: Icon, className, size, animationName }: AnimatedIconProps) {
  const name = animationName || Icon.displayName || Icon.name || "";
  const anim = ICON_ANIMATIONS[name] || DEFAULT_ICON_ANIMATION;

  return (
    <motion.span
      className="inline-flex items-center justify-center"
      whileHover={anim.whileHover}
      transition={anim.transition || { duration: 0.3 }}
    >
      <Icon className={className} size={size} />
    </motion.span>
  );
}
