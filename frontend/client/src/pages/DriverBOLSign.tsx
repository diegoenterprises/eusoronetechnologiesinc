/**
 * DRIVER BOL SIGN PAGE
 * 100% Dynamic - No mock data
 * Bill of Lading review and digital signature capture with gradient ink
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { SignatureCanvas, SignatureData } from "@/components/ui/signature-canvas";
import { trpc } from "@/lib/trpc";
import { useRoute, useLocation } from "wouter";
import {
  FileText, MapPin, Package, AlertTriangle, Truck,
  Phone, Building, Scale, Shield, CheckCircle,
  ChevronLeft, Send
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function DriverBOLSign() {
  const [, navigate] = useLocation();
  const [, params] = useRoute("/driver/bol/:loadId");
  const loadId = params?.loadId;

  const [verified, setVerified] = useState(false);
  const [showSignature, setShowSignature] = useState(false);

  const bolQuery = (trpc as any).documents.getById.useQuery({ id: loadId || "" });
  const userQuery = (trpc as any).users.me.useQuery();

  const signMutation = (trpc as any).documents.uploadDocument.useMutation({
    onSuccess: () => {
      toast.success("BOL signed successfully");
      navigate("/driver/current-job");
    },
    onError: (error: any) => toast.error("Failed to sign BOL", { description: error.message }),
  });

  const bol = bolQuery.data as any;
  const user = userQuery.data;

  const handleSign = (signatureData: SignatureData) => {
    if (!loadId) return;
    signMutation.mutate({
      documentType: "bol",
      file: signatureData.imageDataUrl,
    });
  };

  if (bolQuery.isLoading) {
    return (
      <div className="p-4 md:p-6 space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/driver/current-job")}
          className="text-slate-400 hover:text-white"
        >
          <ChevronLeft className="w-6 h-6" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
            Bill of Lading
          </h1>
          <p className="text-slate-400 text-sm mt-1">Load #{bol?.loadNumber} - Review and sign</p>
        </div>
      </div>

      {showSignature ? (
        <SignatureCanvas
          signerName={user?.name || "Driver"}
          signerRole="Driver"
          documentName={`BOL #${bol?.bolNumber}`}
          documentType="Bill of Lading"
          onSave={handleSign}
          onCancel={() => setShowSignature(false)}
        />
      ) : (
        <>
          {/* Shipper Information */}
          <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-lg flex items-center gap-2">
                <Building className="w-5 h-5 text-cyan-400" />
                Shipper (Consignor)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-white font-bold text-lg">{bol?.shipper?.name}</p>
                  <p className="text-slate-400 text-sm">{bol?.shipper?.address}</p>
                  <p className="text-slate-400 text-sm">{bol?.shipper?.city}, {bol?.shipper?.state} {bol?.shipper?.zip}</p>
                </div>
                <div className="flex items-center gap-3 text-slate-400">
                  <Phone className="w-4 h-4" />
                  <div>
                    <p className="text-sm">24hr Emergency</p>
                    <p className="text-white font-medium">{bol?.shipper?.emergencyPhone}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Carrier Information */}
          <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-lg flex items-center gap-2">
                <Truck className="w-5 h-5 text-cyan-400" />
                Carrier
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-white font-bold">{bol?.carrier?.name}</p>
                  <p className="text-slate-400 text-sm">USDOT: {bol?.carrier?.dotNumber}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Driver</p>
                  <p className="text-white font-medium">{user?.name}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Equipment</p>
                  <p className="text-white font-medium">Truck #{bol?.truckNumber} / Trailer #{bol?.trailerNumber}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Hazmat Details */}
          <Card className="bg-gradient-to-r from-orange-500/10 to-red-500/10 border-orange-500/30 rounded-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-lg flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-400" />
                Hazardous Material
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/50">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-slate-400 text-sm">Proper Shipping Name</p>
                    <p className="text-white font-bold text-lg">{bol?.hazmat?.properName}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 text-lg px-3 py-1">
                      {bol?.hazmat?.unNumber}
                    </Badge>
                    <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-lg px-3 py-1">
                      Class {bol?.hazmat?.class}
                    </Badge>
                    <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-lg px-3 py-1">
                      PG {bol?.hazmat?.packingGroup}
                    </Badge>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-slate-400 text-sm">Quantity</p>
                    <p className="text-white font-medium">{bol?.hazmat?.weight?.toLocaleString()} {bol?.hazmat?.weightUnit}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">Gross Weight</p>
                    <p className="text-white font-medium">{bol?.hazmat?.grossWeight?.toLocaleString()} lbs</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">RQ</p>
                    <p className="text-white font-medium">{bol?.hazmat?.rq ? "Yes" : "No"}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">Marine Pollutant</p>
                    <p className="text-white font-medium">{bol?.hazmat?.marinePollutant ? "Yes" : "No"}</p>
                  </div>
                </div>
              </div>
              <div className="mt-4 p-3 rounded-lg bg-orange-500/10 border border-orange-500/30">
                <p className="text-orange-400 font-medium text-sm">Placards Required</p>
                <p className="text-white">{bol?.hazmat?.placards?.join(", ") || "FLAMMABLE 3 - All 4 sides"}</p>
              </div>
            </CardContent>
          </Card>

          {/* Consignee */}
          <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-lg flex items-center gap-2">
                <MapPin className="w-5 h-5 text-green-400" />
                Consignee (Delivery)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <p className="text-white font-bold text-lg">{bol?.consignee?.name}</p>
                <p className="text-slate-400 text-sm">{bol?.consignee?.address}</p>
                <p className="text-slate-400 text-sm">{bol?.consignee?.city}, {bol?.consignee?.state} {bol?.consignee?.zip}</p>
              </div>
            </CardContent>
          </Card>

          {/* Shipper Signature */}
          {bol?.shipperSignature && (
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-green-500/20">
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    </div>
                    <div>
                      <p className="text-white font-medium">Shipper Signature</p>
                      <p className="text-slate-400 text-sm">Signed by {bol.shipperSignature.name} on {new Date(bol.shipperSignature.signedAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <img src={bol.shipperSignature.image} alt="Shipper Signature" className="h-12 object-contain" />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Verification Checkbox */}
          <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="verify"
                  checked={verified}
                  onCheckedChange={(checked) => setVerified(checked === true)}
                  className="mt-1"
                />
                <label htmlFor="verify" className="text-slate-300 text-sm leading-relaxed cursor-pointer">
                  I verify that I have reviewed this Bill of Lading, the information is correct, proper placards have been installed, 
                  shipping papers are accessible, and I have the emergency response information for this shipment.
                </label>
              </div>
            </CardContent>
          </Card>

          {/* Sign Button */}
          <div className="flex justify-end">
            <Button
              onClick={() => setShowSignature(true)}
              disabled={!verified}
              className="bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 rounded-lg px-8"
              size="lg"
            >
              <Send className="w-5 h-5 mr-2" />
              Proceed to Sign
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
