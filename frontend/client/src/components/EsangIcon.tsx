import React from "react";

interface EsangIconProps {
  className?: string;
}

export function EsangIcon({ className = "w-4 h-4" }: EsangIconProps) {
  return <img src="/esang-ai-logo.svg" alt="ESANG" className={className} />;
}
