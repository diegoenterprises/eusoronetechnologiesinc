/**
 * BROKER CARRIER VETTING PAGE
 * 100% Dynamic - Verify carrier qualifications with auto-verification
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import { useRoute, useLocation } from "wouter";
import {
  Shield, CheckCircle, XCircle, AlertTriangle, Search,
  Building, FileText, Truck, Clock, ChevronLeft,
  RefreshCw, ExternalLink, Phone, Mail
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const vettingChecklist = [
  { key: "authority", label: "Operating Authority", description: "Active MC/FF authority" },
  { key: "insurance", label: "Insurance Coverage", description: "Minimum $1M liability, $100K cargo" },
  { key: "safety", label: "Safety Rating", description: "Satisfactory or better FMCSA rating" },
  { key: "hazmat", label: "Hazmat Authorization", description: "If transporting hazmat" },
  { key: "oos", label: "Out of Service Check", description: "No active OOS orders" },
  { key: "w9", label: "W-9 on File", description: "Tax documentation" },
  { key: "contract", label: "Carrier Agreement", description: "Signed broker-carrier agreement" },
];

export default function BrokerCarrierVetting() {
  const [, navigate] = useLocation();
  const [, params] = useRoute("/broker/vet/:carrierId");
  const carrierId = params?.carrierId;

  const [mcNumber, setMcNumber] = useState("");

  const carrierQuery = trpc.carriers.getById.useQuery({ id: carrierId || "" }, { enabled: !!carrierId });
  const vettingQuery = trpc.brokers.getVettingStatus.useQuery({ carrierId: carrierId || "" }, { enabled: !!carrierId });

  const lookupMutation = trpc.integrations.fmcsaSaferLookup.useMutation({
    onSuccess: (data) => {
      toast.success("Carrier found");
    },
    onError: (error) => toast.error("Lookup failed", { description: error.message }),
  });

  const verifyMutation = trpc.brokers.runVerification.useMutation({
    onSuccess: () => {
      toast.success("Verification complete");
      vettingQuery.refetch();
    },
    onError: (error) => toast.error("Verification failed", { description: error.message }),
  });

  const approveMutation = trpc.brokers.approveCarrier.useMutation({
    onSuccess: () => {
      toast.success("Carrier approved");
      navigate("/broker/carriers");
    },
    onError: (error) => toast.error("Failed", { description: error.message }),
  });

  const carrier = carrierQuery.data;
  const vetting = vettingQuery.data;

  const completedChecks = vetting ? Object.values(vetting.checks || {}).filter(Boolean).length : 0;
  const totalChecks = vettingChecklist.length;
  const progressPercent = (completedChecks / totalChecks) * 100;

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/broker/carriers")}
          className="text-slate-400 hover:text-white"
        >
          <ChevronLeft className="w-6 h-6" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            Carrier Vetting
          </h1>
          <p className="text-slate-400 text-sm mt-1">Verify carrier qualifications</p>
        </div>
      </div>

      {/* MC Lookup (if no carrier selected) */}
      {!carrierId && (
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <Search className="w-5 h-5 text-cyan-400" />
              FMCSA SAFER Lookup
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <Label className="text-slate-300">MC or DOT Number</Label>
                <Input
                  value={mcNumber}
                  onChange={(e) => setMcNumber(e.target.value)}
                  placeholder="Enter MC# or USDOT#"
                  className="bg-slate-700/50 border-slate-600/50 rounded-lg mt-2"
                />
              </div>
              <Button
                onClick={() => lookupMutation.mutate({ mcNumber })}
                disabled={!mcNumber || lookupMutation.isPending}
                className="mt-8 bg-gradient-to-r from-cyan-600 to-emerald-600 rounded-lg"
              >
                <Search className="w-4 h-4 mr-2" />
                Lookup
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Carrier Info */}
      {carrier && (
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-cyan-500/20">
                  <Building className="w-8 h-8 text-cyan-400" />
                </div>
                <div>
                  <h2 className="text-white font-bold text-xl">{carrier.name}</h2>
                  <div className="flex items-center gap-4 mt-1 text-slate-400 text-sm">
                    <span>MC# {carrier.mcNumber}</span>
                    <span>USDOT# {carrier.dotNumber}</span>
                  </div>
                </div>
              </div>
              <Badge className={cn(
                "border-0",
                vetting?.status === "approved" ? "bg-green-500/20 text-green-400" :
                vetting?.status === "pending" ? "bg-yellow-500/20 text-yellow-400" :
                "bg-red-500/20 text-red-400"
              )}>
                {vetting?.status || "Not Vetted"}
              </Badge>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div className="p-3 rounded-lg bg-slate-700/30">
                <p className="text-slate-400 text-xs">Safety Rating</p>
                <p className="text-white font-medium">{carrier.safetyRating || "Not Rated"}</p>
              </div>
              <div className="p-3 rounded-lg bg-slate-700/30">
                <p className="text-slate-400 text-xs">Insurance</p>
                <p className="text-white font-medium">${carrier.insuranceCoverage?.toLocaleString() || "N/A"}</p>
              </div>
              <div className="p-3 rounded-lg bg-slate-700/30">
                <p className="text-slate-400 text-xs">Fleet Size</p>
                <p className="text-white font-medium">{carrier.fleetSize || 0} trucks</p>
              </div>
              <div className="p-3 rounded-lg bg-slate-700/30">
                <p className="text-slate-400 text-xs">Authority Since</p>
                <p className="text-white font-medium">{carrier.authoritySince || "N/A"}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 mt-4 text-sm">
              <a href={`mailto:${carrier.email}`} className="flex items-center gap-1 text-cyan-400 hover:underline">
                <Mail className="w-4 h-4" />{carrier.email}
              </a>
              <span className="flex items-center gap-1 text-slate-400">
                <Phone className="w-4 h-4" />{carrier.phone}
              </span>
              <a
                href={`https://safer.fmcsa.dot.gov/query.asp?searchtype=ANY&query_type=queryCarrierSnapshot&query_param=USDOT&query_string=${carrier.dotNumber}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-purple-400 hover:underline"
              >
                <ExternalLink className="w-4 h-4" />SAFER
              </a>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Vetting Progress */}
      {carrier && (
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-white text-lg flex items-center gap-2">
                <Shield className="w-5 h-5 text-purple-400" />
                Vetting Checklist
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => verifyMutation.mutate({ carrierId: carrierId! })}
                disabled={verifyMutation.isPending}
                className="bg-slate-700/50 border-slate-600/50 rounded-lg"
              >
                <RefreshCw className={cn("w-4 h-4 mr-2", verifyMutation.isPending && "animate-spin")} />
                Auto-Verify
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-400 text-sm">Completion</span>
                <span className="text-white font-medium">{completedChecks}/{totalChecks}</span>
              </div>
              <Progress value={progressPercent} className="h-2" />
            </div>

            <div className="space-y-3">
              {vettingChecklist.map((item) => {
                const isChecked = vetting?.checks?.[item.key];
                const isAuto = vetting?.autoVerified?.includes(item.key);
                return (
                  <div
                    key={item.key}
                    className={cn(
                      "p-4 rounded-lg border transition-all",
                      isChecked
                        ? "bg-green-500/10 border-green-500/30"
                        : "bg-slate-700/30 border-slate-600/30"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {isChecked ? (
                          <CheckCircle className="w-5 h-5 text-green-400" />
                        ) : (
                          <div className="w-5 h-5 rounded-full border-2 border-slate-500" />
                        )}
                        <div>
                          <p className="text-white font-medium">{item.label}</p>
                          <p className="text-slate-400 text-sm">{item.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {isAuto && (
                          <Badge className="bg-purple-500/20 text-purple-400 border-0 text-xs">
                            Auto-Verified
                          </Badge>
                        )}
                        {isChecked && vetting?.verifiedAt?.[item.key] && (
                          <span className="text-slate-500 text-xs">
                            {new Date(vetting.verifiedAt[item.key]).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      {carrier && (
        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => navigate("/broker/carriers")}
            className="bg-slate-700/50 border-slate-600/50 rounded-lg"
          >
            Cancel
          </Button>
          <Button
            onClick={() => approveMutation.mutate({ carrierId: carrierId! })}
            disabled={progressPercent < 100 || approveMutation.isPending}
            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-lg px-8"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Approve Carrier
          </Button>
        </div>
      )}
    </div>
  );
}
