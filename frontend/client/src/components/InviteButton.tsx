/**
 * INVITE BUTTON — Compact inline invite trigger
 * Use this wherever external entities appear that might not be on the platform
 * 
 * Usage:
 * <InviteButton
 *   context="LOAD_BOARD"
 *   target={{ name: "ABC Transport", dot: "1234567" }}
 *   contextData={{ loadNumber: "LD-123" }}
 * />
 */

import { useState } from "react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";
import { UserPlus } from "lucide-react";
import { InviteModal, InviteContext, InviteTarget, InviteContextData } from "./InviteModal";

interface InviteButtonProps {
  context: InviteContext;
  target: InviteTarget;
  contextData?: InviteContextData;
  variant?: "default" | "compact" | "text";
  className?: string;
  onSuccess?: () => void;
}

export function InviteButton({
  context,
  target,
  contextData,
  variant = "default",
  className,
  onSuccess,
}: InviteButtonProps) {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [showModal, setShowModal] = useState(false);

  // Don't show if already on platform
  if (target.onPlatform) return null;

  const baseStyles = cn(
    "inline-flex items-center gap-1 font-medium transition-all",
    variant === "default" && cn(
      "px-3 py-1.5 rounded-lg text-xs border",
      isLight
        ? "bg-purple-50 border-purple-200 text-purple-600 hover:bg-purple-100"
        : "bg-purple-500/10 border-purple-500/20 text-purple-400 hover:bg-purple-500/20"
    ),
    variant === "compact" && cn(
      "px-2 py-1 rounded-md text-[10px]",
      isLight
        ? "bg-purple-50 text-purple-600 hover:bg-purple-100"
        : "bg-purple-500/10 text-purple-400 hover:bg-purple-500/20"
    ),
    variant === "text" && cn(
      "text-xs",
      isLight ? "text-purple-600 hover:text-purple-700" : "text-purple-400 hover:text-purple-300"
    ),
    className
  );

  return (
    <>
      <button onClick={() => setShowModal(true)} className={baseStyles}>
        <UserPlus className={cn("shrink-0", variant === "compact" ? "w-3 h-3" : "w-3.5 h-3.5")} />
        {variant !== "compact" && <span>Invite</span>}
      </button>

      <InviteModal
        open={showModal}
        onClose={() => setShowModal(false)}
        context={context}
        target={target}
        contextData={contextData}
        onSuccess={onSuccess}
      />
    </>
  );
}

export default InviteButton;
