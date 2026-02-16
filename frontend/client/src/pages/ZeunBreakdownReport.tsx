/**
 * ZEUN MECHANICS™ BREAKDOWN REPORT PAGE
 * Redirects to the primary ZeunBreakdown guided flow.
 */

import { useEffect } from "react";
import { useLocation } from "wouter";

export default function ZeunBreakdownReport() {
  const [, navigate] = useLocation();
  useEffect(() => { navigate("/zeun-breakdown"); }, [navigate]);
  return null;
}

