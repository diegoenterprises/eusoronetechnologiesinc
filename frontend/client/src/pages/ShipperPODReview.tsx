/**
 * SHIPPER POD REVIEW PAGE
 * 100% Dynamic - Review and approve Proof of Delivery documents
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { useRoute, useLocation } from "wouter";
import {
  FileCheck, MapPin, Package, Clock, CheckCircle,
  XCircle, AlertTriangle, ChevronLeft, Download,
  Image, Scale, User, Calendar
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function ShipperPODReview() {
  const [, navigate] = useLocation();
  const [, params] = useRoute("/shipper/pod/:loadId");
  const loadId = params?.loadId;

  const [rejectionReason, setRejectionReason] = useState("");
  const [showReject, setShowReject] = useState(false);

  const podQuery = trpc.documents.getPOD.useQuery({ loadId: loadId || "" });
  const loadQuery = trpc.loads.getById.useQuery({ id: loadId || "" });
  const photosQuery = trpc.documents.getPODPhotos.useQuery({ loadId: loadId || "" });

  const approveMutation = trpc.documents.approvePOD.useMutation({
    onSuccess: () => {
      toast.success("POD approved");
      navigate("/shipper/loads");
    },
    onError: (error) => toast.error("Failed", { description: error.message }),
  });

  const rejectMutation = trpc.documents.rejectPOD.useMutation({
    onSuccess: () => {
      toast.success("POD rejected");
      navigate("/shipper/loads");
    },
    onError: (error) => toast.error("Failed", { description: error.message }),
  });

  const pod = podQuery.data;
  const load = loadQuery.data;
  const photos = photosQuery.data || [];

  const variance = load?.weight && pod?.deliveredQuantity
    ? load.weight - pod.deliveredQuantity
    : 0;
  const variancePercent = load?.weight && pod?.deliveredQuantity
    ? ((variance / load.weight) * 100).toFixed(2)
    : 0;
  const withinTolerance = Math.abs(variance) <= (load?.weight || 0) * 0.005;

  if (podQuery.isLoading) {
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
          onClick={() => navigate("/shipper/loads")}
          className="text-slate-400 hover:text-white"
        >
          <ChevronLeft className="w-6 h-6" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
            POD Review
          </h1>
          <p className="text-slate-400 text-sm mt-1">Load #{load?.loadNumber}</p>
        </div>
        <Button variant="outline" className="bg-slate-800/50 border-slate-700/50 rounded-lg">
          <Download className="w-4 h-4 mr-2" />
          Download POD
        </Button>
      </div>

      {/* Delivery Summary */}
      <Card className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/30 rounded-xl">
        <CardContent className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 rounded-full bg-green-500/20">
              <FileCheck className="w-8 h-8 text-green-400" />
            </div>
            <div>
              <Badge className="bg-green-500/20 text-green-400 border-0 mb-1">Delivered</Badge>
              <p className="text-white font-bold text-xl">{load?.origin?.city} → {load?.destination?.city}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3 rounded-lg bg-slate-900/30">
              <div className="flex items-center gap-2 text-slate-400 mb-1">
                <Calendar className="w-4 h-4" />
                <span className="text-xs">Delivery Date</span>
              </div>
              <p className="text-white font-medium">{pod?.deliveredAt}</p>
            </div>
            <div className="p-3 rounded-lg bg-slate-900/30">
              <div className="flex items-center gap-2 text-slate-400 mb-1">
                <MapPin className="w-4 h-4" />
                <span className="text-xs">Location</span>
              </div>
              <p className="text-white font-medium">{load?.destination?.name}</p>
            </div>
            <div className="p-3 rounded-lg bg-slate-900/30">
              <div className="flex items-center gap-2 text-slate-400 mb-1">
                <User className="w-4 h-4" />
                <span className="text-xs">Received By</span>
              </div>
              <p className="text-white font-medium">{pod?.consigneeName}</p>
            </div>
            <div className="p-3 rounded-lg bg-slate-900/30">
              <div className="flex items-center gap-2 text-slate-400 mb-1">
                <Clock className="w-4 h-4" />
                <span className="text-xs">Time</span>
              </div>
              <p className="text-white font-medium">{pod?.deliveryTime}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quantity Verification */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <Scale className="w-5 h-5 text-cyan-400" />
            Quantity Verification
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-slate-700/30 text-center">
              <p className="text-slate-400 text-sm mb-1">Shipped</p>
              <p className="text-white font-bold text-2xl">{load?.weight?.toLocaleString()}</p>
              <p className="text-slate-400 text-sm">{load?.weightUnit}</p>
            </div>
            <div className="p-4 rounded-lg bg-slate-700/30 text-center">
              <p className="text-slate-400 text-sm mb-1">Delivered</p>
              <p className="text-white font-bold text-2xl">{pod?.deliveredQuantity?.toLocaleString()}</p>
              <p className="text-slate-400 text-sm">{load?.weightUnit}</p>
            </div>
            <div className={cn(
              "p-4 rounded-lg text-center",
              withinTolerance ? "bg-green-500/10" : "bg-red-500/10"
            )}>
              <p className="text-slate-400 text-sm mb-1">Variance</p>
              <p className={cn("font-bold text-2xl", withinTolerance ? "text-green-400" : "text-red-400")}>
                {variance > 0 ? "-" : "+"}{Math.abs(variance).toLocaleString()}
              </p>
              <Badge className={cn("border-0 mt-1", withinTolerance ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400")}>
                {variancePercent}%
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Condition */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <Package className="w-5 h-5 text-purple-400" />
            Delivery Condition
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={cn(
            "p-4 rounded-lg flex items-center gap-3",
            pod?.condition === "good" ? "bg-green-500/10" : "bg-yellow-500/10"
          )}>
            {pod?.condition === "good" ? (
              <CheckCircle className="w-6 h-6 text-green-400" />
            ) : (
              <AlertTriangle className="w-6 h-6 text-yellow-400" />
            )}
            <div>
              <p className={cn("font-medium", pod?.condition === "good" ? "text-green-400" : "text-yellow-400")}>
                {pod?.condition === "good" ? "Delivered in Good Condition" : "Exception Noted"}
              </p>
              {pod?.notes && <p className="text-slate-300 text-sm mt-1">{pod.notes}</p>}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Photos */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <Image className="w-5 h-5 text-cyan-400" />
            Delivery Photos ({photos.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {photos.length === 0 ? (
            <div className="text-center py-8">
              <Image className="w-8 h-8 text-slate-500 mx-auto mb-2" />
              <p className="text-slate-400">No photos attached</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-4">
              {photos.map((photo: any) => (
                <div key={photo.id} className="aspect-square rounded-lg bg-slate-700/50 overflow-hidden cursor-pointer hover:ring-2 ring-cyan-400 transition-all">
                  <img src={photo.url} alt={photo.caption} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Consignee Signature */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <User className="w-5 h-5 text-green-400" />
            Consignee Signature
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 rounded-lg bg-slate-700/30">
            <div>
              <p className="text-white font-medium">{pod?.consigneeName}</p>
              <p className="text-slate-400 text-sm">Signed at {pod?.signedAt}</p>
            </div>
            {pod?.signatureImage && (
              <div className="w-48 h-20 rounded-lg bg-white/10 overflow-hidden">
                <img src={pod.signatureImage} alt="Signature" className="w-full h-full object-contain" />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Rejection Reason */}
      {showReject && (
        <Card className="bg-red-500/10 border-red-500/30 rounded-xl">
          <CardContent className="p-4 space-y-4">
            <p className="text-red-400 font-medium">Rejection Reason</p>
            <Textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Explain why you are rejecting this POD..."
              className="bg-slate-800/50 border-slate-700/50 rounded-lg"
            />
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-3">
        {showReject ? (
          <>
            <Button variant="outline" onClick={() => setShowReject(false)} className="bg-slate-700/50 border-slate-600/50 rounded-lg">
              Cancel
            </Button>
            <Button
              onClick={() => rejectMutation.mutate({ loadId: loadId!, reason: rejectionReason })}
              disabled={!rejectionReason || rejectMutation.isPending}
              className="bg-red-600 hover:bg-red-700 rounded-lg"
            >
              <XCircle className="w-4 h-4 mr-2" />
              Confirm Rejection
            </Button>
          </>
        ) : (
          <>
            <Button variant="outline" onClick={() => setShowReject(true)} className="bg-slate-700/50 border-slate-600/50 rounded-lg">
              <XCircle className="w-4 h-4 mr-2" />
              Reject POD
            </Button>
            <Button
              onClick={() => approveMutation.mutate({ loadId: loadId! })}
              disabled={approveMutation.isPending}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-lg px-8"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Approve POD
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
