/**
 * ACCESSIBLE ANNOUNCER — WCAG AA ARIA Live Region (WS-E2E-015)
 * Provides a global announcer for screen readers to announce dynamic content changes.
 * Usage: import { announce } from "@/components/AccessibleAnnouncer";
 *        announce("Load created successfully");
 */

import { useEffect, useState } from "react";

let announceCallback: ((message: string) => void) | null = null;

export function announce(message: string) {
  if (announceCallback) {
    announceCallback(message);
  }
}

export default function AccessibleAnnouncer() {
  const [message, setMessage] = useState("");

  useEffect(() => {
    announceCallback = (msg: string) => {
      setMessage("");
      // Short delay to ensure screen readers detect the change
      requestAnimationFrame(() => {
        setMessage(msg);
      });
    };
    return () => {
      announceCallback = null;
    };
  }, []);

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="sr-only"
    >
      {message}
    </div>
  );
}
