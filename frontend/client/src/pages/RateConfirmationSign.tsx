/**
 * RATE CONFIRMATION SIGN PAGE
 * 100% Dynamic - Review and sign rate confirmation with gradient signature
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
  FileText, MapPin, DollarSign, Clock, Truck,
  Building, CheckCircle, ChevronLeft, Send,
  Calendar, Package, AlertTriangle, Shield
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function RateConfirmationSign() {
  const [, navigate] = useLocation();
  const [, params] = useRoute("/rate-confirmation/:loadId");
  const loadId = params?.loadId;

  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showSignature, setShowSignature] = useState(false);

  const rateConfQuery = trpc.documents.getRateConfirmation.useQuery({ loadId: loadId || "" });
  const userQuery = trpc.users.me.useQuery();

  const signMutation = trpc.documents.signRateConfirmation.useMutation({
    onSuccess: () => {
      toast.success("Rate confirmation signed successfully");
      navigate(-1);
    },
    onError: (error) => toast.error("Failed to sign", { description: error.message }),
  });

  const rateConf = rateConfQuery.data;
  const user = userQuery.data;

  const handleSign = (signatureData: SignatureData) => {
    if (!loadId) return;
    signMutation.mutate({
      loadId,
      signatureImage: signatureData.imageDataUrl,
      signedAt: signatureData.signedAt,
      signerName: signatureData.signerName,
    });
  };

  if (rateConfQuery.isLoading) {
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
          onClick={() => navigate(-1)}
          className="text-slate-400 hover:text-white"
        >
          <ChevronLeft className="w-6 h-6" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Rate Confirmation
          </h1>
          <p className="text-slate-400 text-sm mt-1">Load #{rateConf?.loadNumber}</p>
        </div>
      </div>

      {showSignature ? (
        <SignatureCanvas
          signerName={user?.name || "Carrier Representative"}
          signerRole={user?.role || "Carrier"}
          documentName={`Rate Confirmation #${rateConf?.confirmationNumber}`}
          documentType="Rate Confirmation"
          onSave={handleSign}
          onCancel={() => setShowSignature(false)}
        />
      ) : (
        <>
          {/* Header Info */}
          <Card className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/30 rounded-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <Badge className="bg-purple-500/20 text-purple-400 border-0 mb-2">
                    {rateConf?.confirmationNumber}
                  </Badge>
                  <h2 className="text-white font-bold text-xl">Rate Confirmation Agreement</h2>
                  <p className="text-slate-400 text-sm mt-1">
                    Created: {new Date(rateConf?.createdAt || Date.now()).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-slate-400 text-sm">Total Rate</p>
                  <p className="text-3xl font-bold text-green-400">${rateConf?.totalRate?.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Parties */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-slate-400 text-sm flex items-center gap-2">
                  <Building className="w-4 h-4" />
                  SHIPPER/BROKER
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-white font-bold">{rateConf?.shipper?.name}</p>
                <p className="text-slate-400 text-sm">{rateConf?.shipper?.address}</p>
                <p className="text-slate-400 text-sm">{rateConf?.shipper?.city}, {rateConf?.shipper?.state}</p>
                <p className="text-slate-400 text-sm mt-2">Contact: {rateConf?.shipper?.contact}</p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-slate-400 text-sm flex items-center gap-2">
                  <Truck className="w-4 h-4" />
                  CARRIER
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-white font-bold">{rateConf?.carrier?.name}</p>
                <p className="text-slate-400 text-sm">MC#: {rateConf?.carrier?.mcNumber}</p>
                <p className="text-slate-400 text-sm">USDOT: {rateConf?.carrier?.dotNumber}</p>
                <p className="text-slate-400 text-sm mt-2">Contact: {rateConf?.carrier?.contact}</p>
              </CardContent>
            </Card>
          </div>

          {/* Load Details */}
          <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-lg flex items-center gap-2">
                <Package className="w-5 h-5 text-cyan-400" />
                Load Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="p-3 rounded-lg bg-slate-700/30">
                  <div className="flex items-center gap-2 text-green-400 mb-1">
                    <MapPin className="w-4 h-4" />
                    <span className="text-xs">Origin</span>
                  </div>
                  <p className="text-white font-medium">{rateConf?.origin?.city}, {rateConf?.origin?.state}</p>
                </div>
                <div className="p-3 rounded-lg bg-slate-700/30">
                  <div className="flex items-center gap-2 text-red-400 mb-1">
                    <MapPin className="w-4 h-4" />
                    <span className="text-xs">Destination</span>
                  </div>
                  <p className="text-white font-medium">{rateConf?.destination?.city}, {rateConf?.destination?.state}</p>
                </div>
                <div className="p-3 rounded-lg bg-slate-700/30">
                  <div className="flex items-center gap-2 text-cyan-400 mb-1">
                    <Calendar className="w-4 h-4" />
                    <span className="text-xs">Pickup</span>
                  </div>
                  <p className="text-white font-medium">{rateConf?.pickupDate}</p>
                </div>
                <div className="p-3 rounded-lg bg-slate-700/30">
                  <div className="flex items-center gap-2 text-purple-400 mb-1">
                    <Calendar className="w-4 h-4" />
                    <span className="text-xs">Delivery</span>
                  </div>
                  <p className="text-white font-medium">{rateConf?.deliveryDate}</p>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-slate-700/30">
                <p className="text-slate-400 text-sm mb-2">Commodity</p>
                <p className="text-white font-medium">{rateConf?.commodity}</p>
                {rateConf?.hazmat && (
                  <Badge className="bg-orange-500/20 text-orange-400 border-0 mt-2">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    Hazmat - {rateConf?.hazmatClass}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Rate Breakdown */}
          <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-lg flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-green-400" />
                Rate Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-700/30">
                  <span className="text-slate-300">Line Haul</span>
                  <span className="text-white font-medium">${rateConf?.lineHaul?.toLocaleString()}</span>
                </div>
                {rateConf?.fuelSurcharge > 0 && (
                  <div className="flex items-center justify-between p-3 rounded-lg bg-slate-700/30">
                    <span className="text-slate-300">Fuel Surcharge</span>
                    <span className="text-white font-medium">${rateConf?.fuelSurcharge?.toLocaleString()}</span>
                  </div>
                )}
                {rateConf?.accessorials?.map((acc: any, i: number) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-slate-700/30">
                    <span className="text-slate-300">{acc.type}</span>
                    <span className="text-white font-medium">${acc.amount?.toLocaleString()}</span>
                  </div>
                ))}
                <div className="flex items-center justify-between p-4 rounded-lg bg-green-500/10 border border-green-500/30">
                  <span className="text-green-400 font-bold">Total</span>
                  <span className="text-green-400 font-bold text-xl">${rateConf?.totalRate?.toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Terms */}
          <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-lg flex items-center gap-2">
                <Shield className="w-5 h-5 text-cyan-400" />
                Terms & Conditions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-4 rounded-lg bg-slate-700/30 max-h-48 overflow-y-auto text-sm text-slate-300 mb-4">
                <p className="mb-2">1. Carrier agrees to transport the shipment described above in accordance with all applicable laws and regulations.</p>
                <p className="mb-2">2. Carrier shall maintain adequate insurance coverage as required by law and as specified in the carrier agreement.</p>
                <p className="mb-2">3. Payment terms: {rateConf?.paymentTerms || "NET 30"} days from delivery.</p>
                <p className="mb-2">4. Carrier is responsible for all loading/unloading unless otherwise specified.</p>
                <p className="mb-2">5. Any accessorial charges must be approved in writing prior to service.</p>
                <p>6. This rate confirmation supersedes any prior agreements for this specific shipment.</p>
              </div>

              <div className="flex items-start gap-3 p-4 rounded-lg bg-slate-900/50">
                <Checkbox
                  id="terms"
                  checked={termsAccepted}
                  onCheckedChange={(checked) => setTermsAccepted(checked === true)}
                  className="mt-1"
                />
                <label htmlFor="terms" className="text-slate-300 text-sm leading-relaxed cursor-pointer">
                  I have read and agree to the terms and conditions above. I am authorized to bind the carrier to this agreement.
                </label>
              </div>
            </CardContent>
          </Card>

          {/* Sign Button */}
          <div className="flex justify-end">
            <Button
              onClick={() => setShowSignature(true)}
              disabled={!termsAccepted}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-lg px-8"
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
