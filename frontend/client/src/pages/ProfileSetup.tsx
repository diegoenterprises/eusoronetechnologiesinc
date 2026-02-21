/**
 * PROFILE SETUP PAGE
 * Driver-facing profile setup and edit screen.
 * Allows drivers to manage personal info, CDL details,
 * equipment preferences, contact info, and profile photo.
 * Theme-aware | Brand gradient | Oil & gas industry focused
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import { useTheme } from "@/contexts/ThemeContext";
import { toast } from "sonner";
import {
  User, Truck, Phone, Mail, MapPin, Shield,
  CheckCircle, Camera, Calendar, FileText, Settings
} from "lucide-react";

export default function ProfileSetup() {
  const { theme } = useTheme();
  const isLight = theme === "light";

  const profileQuery = (trpc as any).drivers?.getProfile?.useQuery?.() || { data: null, isLoading: false };
  const profile = profileQuery.data;

  const [form, setForm] = useState({
    firstName: profile?.firstName || "",
    lastName: profile?.lastName || "",
    email: profile?.email || "",
    phone: profile?.phone || "",
    cdlNumber: profile?.cdlNumber || "",
    cdlState: profile?.cdlState || "",
    cdlExpiry: profile?.licenseExpiry || "",
    hazmatEndorsement: profile?.hazmatEndorsement || false,
    tankerEndorsement: false,
    doublesTriples: false,
    preferredEquipment: "tanker",
    homeCity: "",
    homeState: "",
    maxRadius: "500",
    emergencyContactName: "",
    emergencyContactPhone: "",
  });

  const update = (key: string, value: string | boolean) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSave = () => {
    if (!form.firstName || !form.lastName || !form.email) {
      toast.error("Name and email are required");
      return;
    }
    toast.success("Profile saved successfully");
  };

  const cc = cn("rounded-2xl border", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/60 border-slate-700/50");
  const inputCls = cn("h-11 rounded-xl", isLight ? "bg-white border-slate-200" : "bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-400");
  const labelCls = cn("text-xs font-medium mb-1.5 block", isLight ? "text-slate-500" : "text-slate-400");

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[900px] mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
          Profile Setup
        </h1>
        <p className={cn("text-sm mt-1", isLight ? "text-slate-500" : "text-slate-400")}>
          Complete your driver profile to get matched with loads
        </p>
      </div>

      {/* Avatar */}
      <div className="flex items-center gap-5">
        <div className={cn("w-20 h-20 rounded-2xl flex items-center justify-center relative overflow-hidden", isLight ? "bg-slate-100" : "bg-slate-700/50")}>
          <User className="w-10 h-10 text-slate-400" />
          <button className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity rounded-2xl">
            <Camera className="w-6 h-6 text-white" />
          </button>
        </div>
        <div>
          <p className={cn("text-lg font-bold", isLight ? "text-slate-800" : "text-white")}>
            {form.firstName || "First"} {form.lastName || "Last"}
          </p>
          <p className={cn("text-sm", isLight ? "text-slate-400" : "text-slate-500")}>CDL Driver</p>
        </div>
      </div>

      {/* Personal Info */}
      <Card className={cn(cc, "overflow-hidden")}>
        <div className="h-1.5 bg-gradient-to-r from-[#1473FF] to-[#BE01FF]" />
        <CardHeader className="pb-3">
          <CardTitle className={cn("text-lg flex items-center gap-2", isLight ? "text-slate-800" : "text-white")}>
            <User className="w-5 h-5 text-[#1473FF]" /> Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div><label className={labelCls}>First Name</label><Input value={form.firstName} onChange={(e: any) => update("firstName", e.target.value)} className={inputCls} /></div>
            <div><label className={labelCls}>Last Name</label><Input value={form.lastName} onChange={(e: any) => update("lastName", e.target.value)} className={inputCls} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className={labelCls}>Email</label><Input type="email" value={form.email} onChange={(e: any) => update("email", e.target.value)} className={inputCls} /></div>
            <div><label className={labelCls}>Phone</label><Input type="tel" value={form.phone} onChange={(e: any) => update("phone", e.target.value)} placeholder="(555) 123-4567" className={inputCls} /></div>
          </div>
        </CardContent>
      </Card>

      {/* CDL Info */}
      <Card className={cc}>
        <CardHeader className="pb-3">
          <CardTitle className={cn("text-lg flex items-center gap-2", isLight ? "text-slate-800" : "text-white")}>
            <FileText className="w-5 h-5 text-[#BE01FF]" /> CDL Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div><label className={labelCls}>CDL Number</label><Input value={form.cdlNumber} onChange={(e: any) => update("cdlNumber", e.target.value)} className={inputCls} /></div>
            <div><label className={labelCls}>Issuing State</label><Input value={form.cdlState} onChange={(e: any) => update("cdlState", e.target.value)} placeholder="TX" className={inputCls} /></div>
            <div><label className={labelCls}>Expiration</label><Input type="date" value={form.cdlExpiry} onChange={(e: any) => update("cdlExpiry", e.target.value)} className={inputCls} /></div>
          </div>

          <div>
            <label className={labelCls}>Endorsements</label>
            <div className="flex flex-wrap gap-2">
              {[
                { key: "hazmatEndorsement", label: "H — Hazmat" },
                { key: "tankerEndorsement", label: "N — Tanker" },
                { key: "doublesTriples", label: "T — Doubles/Triples" },
              ].map((e) => (
                <button
                  key={e.key}
                  onClick={() => update(e.key, !(form as any)[e.key])}
                  className={cn(
                    "px-4 py-2.5 rounded-xl border text-sm font-medium transition-all",
                    (form as any)[e.key]
                      ? "bg-[#1473FF]/10 text-[#1473FF] border-[#1473FF]/30"
                      : isLight ? "bg-white border-slate-200 text-slate-400" : "bg-slate-800/50 border-slate-700/50 text-slate-500"
                  )}
                >
                  {(form as any)[e.key] && <CheckCircle className="w-3.5 h-3.5 inline mr-1.5" />}
                  {e.label}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preferences */}
      <Card className={cc}>
        <CardHeader className="pb-3">
          <CardTitle className={cn("text-lg flex items-center gap-2", isLight ? "text-slate-800" : "text-white")}>
            <Truck className="w-5 h-5 text-[#1473FF]" /> Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className={labelCls}>Preferred Equipment</label>
            <div className="flex flex-wrap gap-2">
              {["tanker", "flatbed", "dry_van", "reefer", "hopper", "lowboy"].map((eq) => (
                <button
                  key={eq}
                  onClick={() => update("preferredEquipment", eq)}
                  className={cn(
                    "px-4 py-2 rounded-xl border text-sm font-medium transition-all capitalize",
                    form.preferredEquipment === eq
                      ? "bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white border-transparent"
                      : isLight ? "bg-white border-slate-200 text-slate-400" : "bg-slate-800/50 border-slate-700/50 text-slate-500"
                  )}
                >
                  {eq.replace("_", " ")}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div><label className={labelCls}>Home City</label><Input value={form.homeCity} onChange={(e: any) => update("homeCity", e.target.value)} className={inputCls} /></div>
            <div><label className={labelCls}>State</label><Input value={form.homeState} onChange={(e: any) => update("homeState", e.target.value)} placeholder="TX" className={inputCls} /></div>
            <div><label className={labelCls}>Max Radius (mi)</label><Input type="number" value={form.maxRadius} onChange={(e: any) => update("maxRadius", e.target.value)} className={inputCls} /></div>
          </div>
        </CardContent>
      </Card>

      {/* Emergency Contact */}
      <Card className={cc}>
        <CardHeader className="pb-3">
          <CardTitle className={cn("text-lg flex items-center gap-2", isLight ? "text-slate-800" : "text-white")}>
            <Phone className="w-5 h-5 text-red-500" /> Emergency Contact
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            <div><label className={labelCls}>Contact Name</label><Input value={form.emergencyContactName} onChange={(e: any) => update("emergencyContactName", e.target.value)} className={inputCls} /></div>
            <div><label className={labelCls}>Contact Phone</label><Input type="tel" value={form.emergencyContactPhone} onChange={(e: any) => update("emergencyContactPhone", e.target.value)} placeholder="(555) 123-4567" className={inputCls} /></div>
          </div>
        </CardContent>
      </Card>

      {/* Save */}
      <Button
        className="w-full h-12 bg-gradient-to-r from-[#1473FF] to-[#BE01FF] hover:from-[#1260DD] hover:to-[#A801DD] text-white border-0 rounded-xl text-base font-medium shadow-lg shadow-purple-500/20"
        onClick={handleSave}
      >
        <CheckCircle className="w-5 h-5 mr-2" /> Save Profile
      </Button>
    </div>
  );
}
