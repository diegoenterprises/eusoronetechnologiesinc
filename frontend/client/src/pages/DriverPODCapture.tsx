/**
 * DRIVER POD CAPTURE PAGE
 * 100% Dynamic - No mock data
 * Proof of Delivery with consignee signature capture using gradient ink
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Skeleton } from "@/components/ui/skeleton";
import { SignatureCanvas, SignatureData } from "@/components/ui/signature-canvas";
import { trpc } from "@/lib/trpc";
import { useRoute, useLocation } from "wouter";
import {
  FileCheck, MapPin, Package, Camera, Clock,
  CheckCircle, AlertTriangle, ChevronLeft, Send,
  Scale, User, Image
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function DriverPODCapture() {
  const [, navigate] = useLocation();
  const [, params] = useRoute("/driver/pod/:loadId");
  const loadId = params?.loadId;

  const [deliveredQty, setDeliveredQty] = useState("");
  const [condition, setCondition] = useState("good");
  const [notes, setNotes] = useState("");
  const [consigneeName, setConsigneeName] = useState("");
  const [showSignature, setShowSignature] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);

  const loadQuery = (trpc as any).loads.getById.useQuery({ id: loadId || "" });

  const submitPODMutation = (trpc as any).documents.upload.useMutation({
    onSuccess: () => {
      toast.success("Proof of Delivery submitted successfully");
      navigate("/driver/dashboard");
    },
    onError: (error: any) => toast.error("Failed to submit POD", { description: error.message }),
  });

  const load = loadQuery.data;

  const handleSign = (signatureData: SignatureData) => {
    if (!loadId) return;
    submitPODMutation.mutate({
      name: `POD-${loadId}`,
      category: "bols" as const,
      fileData: signatureData.imageDataUrl,
      description: notes,
      relatedToId: loadId,
    });
  };

  const loadWeight = typeof load?.weight === 'number' ? load.weight : 0;
  const variance = loadWeight && deliveredQty 
    ? loadWeight - parseFloat(deliveredQty)
    : 0;
  const variancePercent = loadWeight && deliveredQty
    ? ((variance / loadWeight) * 100).toFixed(2)
    : 0;
  const withinTolerance = Math.abs(variance) <= loadWeight * 0.005;

  if (loadQuery.isLoading) {
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
          <h1 className="text-3xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
            Proof of Delivery
          </h1>
          <p className="text-slate-400 text-sm mt-1">Load #{load?.loadNumber}</p>
        </div>
      </div>

      {showSignature ? (
        <SignatureCanvas
          signerName={consigneeName || "Consignee"}
          signerRole="Consignee"
          documentName={`POD for Load #${load?.loadNumber}`}
          documentType="Proof of Delivery"
          onSave={handleSign}
          onCancel={() => setShowSignature(false)}
        />
      ) : (
        <>
          {/* Delivery Details */}
          <Card className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/30 rounded-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-lg flex items-center gap-2">
                <MapPin className="w-5 h-5 text-green-400" />
                Delivery Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-white font-bold text-lg">{(load?.destination as any)?.name || load?.destination?.city}</p>
                  <p className="text-slate-400 text-sm">{load?.destination?.address}</p>
                  <p className="text-slate-400 text-sm">{load?.destination?.city}, {load?.destination?.state}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-slate-400" />
                  <div>
                    <p className="text-slate-400 text-sm">Delivery Time</p>
                    <p className="text-white font-medium">{new Date().toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quantity Delivered */}
          <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-lg flex items-center gap-2">
                <Scale className="w-5 h-5 text-cyan-400" />
                Quantity Verification
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg bg-slate-700/30">
                  <p className="text-slate-400 text-sm mb-1">Loaded Quantity</p>
                  <p className="text-white font-bold text-xl">{load?.weight?.toLocaleString()} {load?.weightUnit}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Delivered Quantity</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={deliveredQty}
                      onChange={(e: any) => setDeliveredQty(e.target.value)}
                      placeholder="Enter delivered amount"
                      className="bg-slate-700/50 border-slate-600/50 rounded-lg"
                    />
                    <span className="text-slate-400">{load?.weightUnit}</span>
                  </div>
                </div>
                <div className="p-4 rounded-lg bg-slate-700/30">
                  <p className="text-slate-400 text-sm mb-1">Variance</p>
                  {deliveredQty && (
                    <div className="flex items-center gap-2">
                      <p className={cn("font-bold text-xl", withinTolerance ? "text-green-400" : "text-red-400")}>
                        {variance > 0 ? "-" : "+"}{Math.abs(variance).toLocaleString()} {load?.weightUnit}
                      </p>
                      <Badge className={cn("border-0", withinTolerance ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400")}>
                        {variancePercent}%
                      </Badge>
                    </div>
                  )}
                  {deliveredQty && withinTolerance && (
                    <p className="text-green-400 text-xs mt-1">Within tolerance</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Condition */}
          <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-lg flex items-center gap-2">
                <Package className="w-5 h-5 text-cyan-400" />
                Delivery Condition
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <RadioGroup value={condition} onValueChange={setCondition} className="space-y-3">
                <div className="flex items-center space-x-3 p-3 rounded-lg bg-slate-700/30 hover:bg-slate-700/50 transition-colors cursor-pointer">
                  <RadioGroupItem value="good" id="good" />
                  <label htmlFor="good" className="flex items-center gap-2 cursor-pointer flex-1">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <span className="text-white">Delivered in good condition</span>
                  </label>
                </div>
                <div className="flex items-center space-x-3 p-3 rounded-lg bg-slate-700/30 hover:bg-slate-700/50 transition-colors cursor-pointer">
                  <RadioGroupItem value="minor" id="minor" />
                  <label htmlFor="minor" className="flex items-center gap-2 cursor-pointer flex-1">
                    <AlertTriangle className="w-5 h-5 text-yellow-400" />
                    <span className="text-white">Minor exception (describe below)</span>
                  </label>
                </div>
                <div className="flex items-center space-x-3 p-3 rounded-lg bg-slate-700/30 hover:bg-slate-700/50 transition-colors cursor-pointer">
                  <RadioGroupItem value="major" id="major" />
                  <label htmlFor="major" className="flex items-center gap-2 cursor-pointer flex-1">
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                    <span className="text-white">Major exception (describe below)</span>
                  </label>
                </div>
              </RadioGroup>

              <div className="space-y-2">
                <Label className="text-slate-300">Notes</Label>
                <Textarea
                  value={notes}
                  onChange={(e: any) => setNotes(e.target.value)}
                  placeholder="Add any delivery notes or exception details..."
                  className="bg-slate-700/50 border-slate-600/50 rounded-lg min-h-[100px]"
                />
              </div>
            </CardContent>
          </Card>

          {/* Photos */}
          <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-lg flex items-center gap-2">
                <Camera className="w-5 h-5 text-cyan-400" />
                Delivery Photos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <Button
                  variant="outline"
                  className="h-24 bg-slate-700/30 border-slate-600/50 border-dashed hover:bg-slate-700/50 rounded-lg flex flex-col items-center justify-center"
                >
                  <Camera className="w-6 h-6 text-cyan-400 mb-2" />
                  <span className="text-slate-400 text-xs">Unloading</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-24 bg-slate-700/30 border-slate-600/50 border-dashed hover:bg-slate-700/50 rounded-lg flex flex-col items-center justify-center"
                >
                  <Image className="w-6 h-6 text-cyan-400 mb-2" />
                  <span className="text-slate-400 text-xs">Location</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-24 bg-slate-700/30 border-slate-600/50 border-dashed hover:bg-slate-700/50 rounded-lg flex flex-col items-center justify-center"
                >
                  <Scale className="w-6 h-6 text-cyan-400 mb-2" />
                  <span className="text-slate-400 text-xs">Meter Reading</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Consignee Signature */}
          <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-lg flex items-center gap-2">
                <User className="w-5 h-5 text-cyan-400" />
                Consignee Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Receiver Name</Label>
                <Input
                  value={consigneeName}
                  onChange={(e: any) => setConsigneeName(e.target.value)}
                  placeholder="Enter name of person receiving delivery"
                  className="bg-slate-700/50 border-slate-600/50 rounded-lg"
                />
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end">
            <Button
              onClick={() => setShowSignature(true)}
              disabled={!deliveredQty || !consigneeName}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-lg px-8"
              size="lg"
            >
              <Send className="w-5 h-5 mr-2" />
              Capture Signature
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
