/**
 * Canopy Connect Integration Button
 * Launches Canopy Connect SDK widget for instant insurance policy verification.
 * User authenticates with their carrier, policy data auto-fills form fields.
 * Env: VITE_CANOPY_PUBLIC_ALIAS (set in Azure App Settings)
 */

import { useState, useCallback, useEffect, useRef } from "react";
import { Shield, CheckCircle, Loader2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export interface CanopyPolicyData {
  carrier?: string;
  policyNumber?: string;
  policyStart?: string;
  policyEnd?: string;
  premium?: number;
  coverages?: Array<{
    type?: string;
    limit?: string;
    deductible?: string;
    premium?: number;
  }>;
  insured?: {
    name?: string;
    address?: string;
  };
  verified?: boolean;
  rawPullId?: string;
}

interface CanopyConnectButtonProps {
  onPolicyData: (data: CanopyPolicyData) => void;
  policyType?: "liability" | "cargo" | "auto" | "general";
  verified?: boolean;
  className?: string;
  compact?: boolean;
}

declare global {
  interface Window {
    CanopyConnect?: {
      create: (options: {
        publicAlias: string;
        styles?: Record<string, any>;
        onPolicyPull?: (data: any) => void;
        onAuthStatus?: (status: any) => void;
        onError?: (error: any) => void;
        onClose?: () => void;
        metadata?: Record<string, string>;
      }) => {
        open: () => void;
        close: () => void;
        destroy: () => void;
      };
    };
  }
}

const CANOPY_SDK_URL = "https://cdn.usecanopy.com/sdk/canopy-connect.js";

function parsePolicyFromPull(pullData: any): CanopyPolicyData {
  const policy = pullData?.policy || pullData?.policies?.[0] || pullData;
  const coverages: CanopyPolicyData["coverages"] = [];

  if (policy?.coverages && Array.isArray(policy.coverages)) {
    for (const cov of policy.coverages) {
      coverages.push({
        type: cov.coverageType || cov.type || cov.name || "",
        limit: cov.perAccidentLimit || cov.limit || cov.limits || "",
        deductible: cov.deductible || "",
        premium: cov.premium ? parseFloat(cov.premium) : undefined,
      });
    }
  }

  return {
    carrier: policy?.carrier?.name || policy?.carrierName || policy?.insuranceCompany || "",
    policyNumber: policy?.policyNumber || policy?.policy_number || "",
    policyStart: policy?.effectiveDate || policy?.policyStart || policy?.startDate || "",
    policyEnd: policy?.expirationDate || policy?.policyEnd || policy?.endDate || "",
    premium: policy?.totalPremium ? parseFloat(policy.totalPremium) : undefined,
    coverages,
    insured: {
      name: policy?.insured?.name || policy?.namedInsured || "",
      address: policy?.insured?.address?.full || policy?.insured?.address || "",
    },
    verified: true,
    rawPullId: pullData?.pullId || pullData?.id || "",
  };
}

export default function CanopyConnectButton({
  onPolicyData,
  policyType = "auto",
  verified = false,
  className,
  compact = false,
}: CanopyConnectButtonProps) {
  const [loading, setLoading] = useState(false);
  const [sdkReady, setSdkReady] = useState(false);
  const handlerRef = useRef<any>(null);

  // Load Canopy Connect SDK script
  useEffect(() => {
    if (window.CanopyConnect) {
      setSdkReady(true);
      return;
    }
    if (document.querySelector(`script[src="${CANOPY_SDK_URL}"]`)) {
      const check = setInterval(() => {
        if (window.CanopyConnect) { setSdkReady(true); clearInterval(check); }
      }, 200);
      return () => clearInterval(check);
    }
    const script = document.createElement("script");
    script.src = CANOPY_SDK_URL;
    script.async = true;
    script.onload = () => setSdkReady(true);
    script.onerror = () => console.warn("[Canopy] SDK failed to load");
    document.head.appendChild(script);
  }, []);

  const handleConnect = useCallback(() => {
    const publicAlias = (import.meta as any).env?.VITE_CANOPY_PUBLIC_ALIAS;
    if (!publicAlias) {
      toast.error("Canopy Connect not configured", {
        description: "Please set VITE_CANOPY_PUBLIC_ALIAS in environment variables.",
      });
      return;
    }

    if (!window.CanopyConnect) {
      toast.error("Canopy Connect SDK not loaded", {
        description: "Please refresh the page and try again.",
      });
      return;
    }

    setLoading(true);

    try {
      if (handlerRef.current) {
        try { handlerRef.current.destroy(); } catch {}
      }

      handlerRef.current = window.CanopyConnect.create({
        publicAlias,
        metadata: {
          policyType,
          platform: "eusotrip",
          timestamp: new Date().toISOString(),
        },
        onPolicyPull: (pullData: any) => {
          const parsed = parsePolicyFromPull(pullData);
          onPolicyData(parsed);
          setLoading(false);
          toast.success("Insurance Verified", {
            description: `${parsed.carrier || "Policy"} #${parsed.policyNumber || "N/A"} verified via Canopy Connect`,
          });
        },
        onAuthStatus: (status: any) => {
          if (status?.status === "error") {
            setLoading(false);
            toast.error("Authentication failed", {
              description: "Please try again or enter your policy details manually.",
            });
          }
        },
        onError: (error: any) => {
          setLoading(false);
          console.error("[Canopy] Error:", error);
          toast.error("Canopy Connect error", {
            description: "Could not verify policy. Enter details manually.",
          });
        },
        onClose: () => {
          setLoading(false);
        },
      });

      handlerRef.current.open();
    } catch (err) {
      setLoading(false);
      console.error("[Canopy] Failed to open:", err);
      toast.error("Failed to open Canopy Connect");
    }
  }, [onPolicyData, policyType]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (handlerRef.current) {
        try { handlerRef.current.destroy(); } catch {}
      }
    };
  }, []);

  if (verified) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <Badge className="bg-emerald-500/15 text-emerald-400 border-0 gap-1.5 py-1 px-2.5">
          <CheckCircle className="w-3.5 h-3.5" />
          Verified via Canopy Connect
        </Badge>
      </div>
    );
  }

  if (compact) {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleConnect}
        disabled={loading}
        className={cn(
          "border-blue-500/30 text-blue-400 hover:bg-blue-500/10 hover:text-blue-300 gap-1.5",
          className
        )}
      >
        {loading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Shield className="w-3.5 h-3.5" />
        )}
        {loading ? "Verifying..." : "Verify via Canopy"}
      </Button>
    );
  }

  return (
    <div className={cn("rounded-xl border border-blue-500/20 bg-blue-500/5 p-4", className)}>
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#1473FF] to-[#BE01FF] flex items-center justify-center flex-shrink-0">
          <Shield className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white">Instant Insurance Verification</p>
          <p className="text-xs text-slate-400 mt-0.5">
            Connect to your insurance carrier via Canopy Connect to auto-fill and verify your policy in seconds.
          </p>
          <Button
            type="button"
            size="sm"
            onClick={handleConnect}
            disabled={loading}
            className="mt-3 bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white hover:opacity-90 gap-1.5"
          >
            {loading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <ExternalLink className="w-3.5 h-3.5" />
                Connect Insurance
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
