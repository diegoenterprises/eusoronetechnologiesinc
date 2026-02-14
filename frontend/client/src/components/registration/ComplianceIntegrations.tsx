/**
 * COMPLIANCE INTEGRATIONS COMPONENT
 * Shared dropdown for Avetta, ISNetworld, Veriforce, DISA, ComplyWorks, etc.
 * If a user has an existing ID, it fast-tracks their registration verification.
 * Used across Shipper, Catalyst, Broker, Driver, Terminal, Compliance, Safety registration flows.
 */

import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckCircle, Zap, ShieldCheck, ChevronDown, ChevronUp } from "lucide-react";

export interface ComplianceIds {
  avettaId: string;
  isnetworldId: string;
  veriforceId: string;
  disaId: string;
  complyWorksId: string;
  compassId: string;
  browzId: string;
  fmcsaUsdot: string;
  fmcsaMcNumber: string;
  phmsaRegNumber: string;
  tsaTwicNumber: string;
  epaId: string;
  oshaId: string;
  dotHazmatPermit: string;
  clearinghouseId: string;
  saferWebId: string;
}

export const emptyComplianceIds: ComplianceIds = {
  avettaId: "",
  isnetworldId: "",
  veriforceId: "",
  disaId: "",
  complyWorksId: "",
  compassId: "",
  browzId: "",
  fmcsaUsdot: "",
  fmcsaMcNumber: "",
  phmsaRegNumber: "",
  tsaTwicNumber: "",
  epaId: "",
  oshaId: "",
  dotHazmatPermit: "",
  clearinghouseId: "",
  saferWebId: "",
};

// Which integrations apply to which roles
const ROLE_INTEGRATIONS: Record<string, (keyof ComplianceIds)[]> = {
  SHIPPER: [
    "avettaId", "isnetworldId", "veriforceId", "disaId", "complyWorksId", "browzId",
    "phmsaRegNumber", "epaId", "oshaId",
  ],
  CATALYST: [
    "avettaId", "isnetworldId", "veriforceId", "disaId", "complyWorksId", "browzId",
    "fmcsaUsdot", "fmcsaMcNumber", "phmsaRegNumber", "dotHazmatPermit",
    "clearinghouseId", "saferWebId",
  ],
  BROKER: [
    "avettaId", "isnetworldId", "veriforceId", "complyWorksId",
    "fmcsaUsdot", "fmcsaMcNumber",
  ],
  DRIVER: [
    "veriforceId", "disaId",
    "tsaTwicNumber", "clearinghouseId", "dotHazmatPermit",
  ],
  DISPATCH: [
    "avettaId", "isnetworldId", "veriforceId",
  ],
  ESCORT: [
    "avettaId", "veriforceId",
  ],
  TERMINAL_MANAGER: [
    "avettaId", "isnetworldId", "veriforceId", "disaId", "complyWorksId",
    "epaId", "oshaId", "phmsaRegNumber",
  ],
  COMPLIANCE_OFFICER: [
    "avettaId", "isnetworldId", "veriforceId", "disaId", "complyWorksId",
    "clearinghouseId", "oshaId",
  ],
  SAFETY_MANAGER: [
    "avettaId", "isnetworldId", "veriforceId", "disaId",
    "clearinghouseId", "oshaId", "fmcsaUsdot",
  ],
};

const INTEGRATION_META: Record<keyof ComplianceIds, { label: string; placeholder: string; category: "third_party" | "federal" | "state"; description: string }> = {
  avettaId: { label: "Avetta Member ID", placeholder: "AVT-XXXXXXXX", category: "third_party", description: "Avetta contractor prequalification network" },
  isnetworldId: { label: "ISNetworld Subscriber ID", placeholder: "ISN-XXXXXXXX", category: "third_party", description: "ISNetworld contractor management" },
  veriforceId: { label: "Veriforce Operator ID", placeholder: "VF-XXXXXXXX", category: "third_party", description: "Veriforce OQ compliance network" },
  disaId: { label: "DISA Client ID", placeholder: "DISA-XXXXXXXX", category: "third_party", description: "DISA Global Solutions compliance" },
  complyWorksId: { label: "ComplyWorks ID", placeholder: "CW-XXXXXXXX", category: "third_party", description: "ComplyWorks contractor management" },
  compassId: { label: "COMPASS ID", placeholder: "CMP-XXXXXXXX", category: "third_party", description: "COMPASS compliance platform" },
  browzId: { label: "BROWZ/Avetta One ID", placeholder: "BRZ-XXXXXXXX", category: "third_party", description: "BROWZ supply chain risk management" },
  fmcsaUsdot: { label: "FMCSA USDOT Number", placeholder: "1234567", category: "federal", description: "Federal Motor Catalyst Safety Administration" },
  fmcsaMcNumber: { label: "FMCSA MC Number", placeholder: "MC-123456", category: "federal", description: "Motor Catalyst operating authority" },
  phmsaRegNumber: { label: "PHMSA Registration Number", placeholder: "PHMSA-XXXXXX", category: "federal", description: "Pipeline and Hazardous Materials Safety Administration" },
  tsaTwicNumber: { label: "TSA TWIC Card Number", placeholder: "TWIC-XXXXXXXX", category: "federal", description: "Transportation Worker Identification Credential" },
  epaId: { label: "EPA ID Number", placeholder: "TXD123456789", category: "federal", description: "Environmental Protection Agency generator ID" },
  oshaId: { label: "OSHA Establishment ID", placeholder: "OSHA-XXXXXXXX", category: "federal", description: "Occupational Safety and Health Administration" },
  dotHazmatPermit: { label: "DOT Hazmat Safety Permit", placeholder: "HMSP-XXXXXXXX", category: "federal", description: "DOT 49 CFR hazmat safety permit" },
  clearinghouseId: { label: "FMCSA Clearinghouse ID", placeholder: "CLR-XXXXXXXX", category: "federal", description: "Drug & Alcohol Clearinghouse" },
  saferWebId: { label: "SAFER Web Account", placeholder: "SAFER-XXXXXXXX", category: "federal", description: "FMCSA SAFER system verification" },
};

interface ComplianceIntegrationsProps {
  role: string;
  complianceIds: ComplianceIds;
  onChange: (ids: ComplianceIds) => void;
}

export function ComplianceIntegrations({ role, complianceIds, onChange }: ComplianceIntegrationsProps) {
  const [expanded, setExpanded] = useState(false);
  const applicableKeys = ROLE_INTEGRATIONS[role] || [];

  if (applicableKeys.length === 0) return null;

  const thirdParty = applicableKeys.filter(k => INTEGRATION_META[k].category === "third_party");
  const federal = applicableKeys.filter(k => INTEGRATION_META[k].category === "federal");

  const filledCount = applicableKeys.filter(k => complianceIds[k]?.trim()).length;

  const updateField = (key: keyof ComplianceIds, value: string) => {
    onChange({ ...complianceIds, [key]: value });
  };

  const renderField = (key: keyof ComplianceIds) => {
    const meta = INTEGRATION_META[key];
    return (
      <div key={key} className="space-y-1.5">
        <Label className="text-slate-300 text-sm flex items-center gap-2">
          {meta.label}
          {complianceIds[key]?.trim() && (
            <Badge className="bg-green-500/20 text-green-400 text-[10px] px-1.5 py-0">Linked</Badge>
          )}
        </Label>
        <Input
          value={complianceIds[key]}
          onChange={(e: any) => updateField(key, e.target.value)}
          placeholder={meta.placeholder}
          className="bg-slate-700/50 border-slate-600 text-white h-9 text-sm"
        />
        <p className="text-[11px] text-slate-500">{meta.description}</p>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Fast-Track Banner */}
      <div className="p-4 rounded-lg bg-gradient-to-r from-[#1473FF]/10 to-[#BE01FF]/10 border border-[#1473FF]/20">
        <div className="flex items-start gap-3">
          <Zap className="w-5 h-5 text-[#1473FF] mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-white">Fast-Track Registration</p>
            <p className="text-xs text-slate-400 mt-1">
              Already verified with a compliance network? Enter your existing IDs below to
              fast-track your registration. We integrate directly with these platforms to
              verify your credentials instantly.
            </p>
            {filledCount > 0 && (
              <div className="flex items-center gap-2 mt-2">
                <ShieldCheck className="w-4 h-4 text-green-400" />
                <span className="text-xs text-green-400 font-medium">{filledCount} integration{filledCount !== 1 ? 's' : ''} linked - faster verification</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Toggle */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-700 hover:border-slate-600 transition-colors"
      >
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-slate-400" />
          <span className="text-sm text-slate-300">Compliance Network & Federal IDs (Optional)</span>
          {filledCount > 0 && (
            <Badge className="bg-blue-500/20 text-blue-400 text-[10px]">{filledCount} linked</Badge>
          )}
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
      </button>

      {expanded && (
        <div className="space-y-6 pl-1">
          {/* Third-Party Compliance Networks */}
          {thirdParty.length > 0 && (
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-purple-400" />
                Third-Party Compliance Networks
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {thirdParty.map(renderField)}
              </div>
            </div>
          )}

          {/* Federal Registration IDs */}
          {federal.length > 0 && (
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-400" />
                Federal Regulatory IDs
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {federal.map(renderField)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Shared password field component for registration forms
 */
export function PasswordFields({
  password,
  confirmPassword,
  onPasswordChange,
  onConfirmChange,
}: {
  password: string;
  confirmPassword: string;
  onPasswordChange: (v: string) => void;
  onConfirmChange: (v: string) => void;
}) {
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  const passwordsMatch = password === confirmPassword && password.length > 0;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-slate-300">
          Password <span className="text-red-400">*</span>
        </Label>
        <Input
          type="password"
          value={password}
          onChange={(e: any) => onPasswordChange(e.target.value)}
          placeholder="Create a secure password"
          className="bg-slate-700/50 border-slate-600 text-white"
        />
        {password.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-1">
            <Badge className={`text-[10px] ${hasMinLength ? 'bg-green-500/20 text-green-400' : 'bg-slate-700/50 text-slate-500'}`}>
              8+ characters
            </Badge>
            <Badge className={`text-[10px] ${hasUppercase ? 'bg-green-500/20 text-green-400' : 'bg-slate-700/50 text-slate-500'}`}>
              Uppercase
            </Badge>
            <Badge className={`text-[10px] ${hasNumber ? 'bg-green-500/20 text-green-400' : 'bg-slate-700/50 text-slate-500'}`}>
              Number
            </Badge>
            <Badge className={`text-[10px] ${hasSpecial ? 'bg-green-500/20 text-green-400' : 'bg-slate-700/50 text-slate-500'}`}>
              Special character
            </Badge>
          </div>
        )}
      </div>
      <div className="space-y-2">
        <Label className="text-slate-300">
          Confirm Password <span className="text-red-400">*</span>
        </Label>
        <Input
          type="password"
          value={confirmPassword}
          onChange={(e: any) => onConfirmChange(e.target.value)}
          placeholder="Confirm your password"
          className="bg-slate-700/50 border-slate-600 text-white"
        />
        {confirmPassword.length > 0 && (
          <div className="flex items-center gap-1.5 mt-1">
            {passwordsMatch ? (
              <>
                <CheckCircle className="w-3.5 h-3.5 text-green-400" />
                <span className="text-xs text-green-400">Passwords match</span>
              </>
            ) : (
              <span className="text-xs text-red-400">Passwords do not match</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function validatePassword(password: string, confirmPassword: string): string | null {
  if (!password) return "Password is required";
  if (password.length < 8) return "Password must be at least 8 characters";
  if (!/[A-Z]/.test(password)) return "Password must contain an uppercase letter";
  if (!/[0-9]/.test(password)) return "Password must contain a number";
  if (password !== confirmPassword) return "Passwords do not match";
  return null;
}
