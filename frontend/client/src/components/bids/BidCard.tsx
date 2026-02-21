/**
 * BID CARD COMPONENT
 * Displays catalyst bid on a load with actions
 * Based on Shipper & Catalyst user journeys
 */

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Star, Clock, Truck, Shield, DollarSign, 
  CheckCircle, XCircle, MessageSquare, TrendingUp
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface BidData {
  id: string;
  catalystId: string;
  catalystName: string;
  catalystLogo?: string;
  safetyRating: number;
  onTimeRate: number;
  totalLoads: number;
  bidAmount: number;
  originalAmount?: number;
  eta: string;
  etaStatus: "on-time" | "early" | "late";
  equipment: string;
  driverName?: string;
  driverHOS?: string;
  hasHazmatAuth: boolean;
  insuranceCoverage: number;
  submittedAt: string;
  status: "pending" | "accepted" | "rejected" | "countered" | "expired";
  counterOffer?: number;
  notes?: string;
}

interface BidCardProps {
  bid: BidData;
  targetRate?: number;
  onAccept?: (bidId: string) => void;
  onReject?: (bidId: string) => void;
  onCounter?: (bidId: string, amount: number) => void;
  onMessage?: (bidId: string) => void;
  isShipperView?: boolean;
}

export function BidCard({
  bid,
  targetRate,
  onAccept,
  onReject,
  onCounter,
  onMessage,
  isShipperView = true,
}: BidCardProps) {
  const ratePerMile = (bid.bidAmount / 250).toFixed(2); // Assuming 250 miles
  const vsTarget = targetRate ? ((bid.bidAmount / targetRate) * 100 - 100).toFixed(1) : null;

  return (
    <Card className={cn(
      "bg-slate-800/50 border-slate-700 hover:border-slate-600 transition-all",
      bid.status === "accepted" && "border-green-500/50 bg-green-500/5",
      bid.status === "rejected" && "border-red-500/50 bg-red-500/5 opacity-60"
    )}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          {/* Catalyst Info */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
              {bid.catalystName.charAt(0)}
            </div>
            <div>
              <h4 className="font-semibold text-white">{bid.catalystName}</h4>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={cn(
                        "w-3 h-3",
                        i < Math.floor(bid.safetyRating) ? "text-yellow-400 fill-yellow-400" : "text-slate-600"
                      )}
                    />
                  ))}
                </div>
                <span className="text-xs text-slate-400">{bid.totalLoads} loads</span>
              </div>
            </div>
          </div>

          {/* Bid Amount */}
          <div className="text-right">
            <p className="text-2xl font-bold text-white">${bid.bidAmount.toLocaleString()}</p>
            <p className="text-xs text-slate-400">${ratePerMile}/mi</p>
            {vsTarget && (
              <Badge 
                variant="outline" 
                className={cn(
                  "text-xs mt-1",
                  parseFloat(vsTarget) <= 0 ? "text-green-400 border-green-500/30" : "text-yellow-400 border-yellow-500/30"
                )}
              >
                {parseFloat(vsTarget) <= 0 ? "" : "+"}{vsTarget}% vs target
              </Badge>
            )}
          </div>
        </div>

        {/* Details Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-700">
          <div className="flex items-center gap-2">
            <Clock className={cn(
              "w-4 h-4",
              bid.etaStatus === "on-time" && "text-green-400",
              bid.etaStatus === "early" && "text-blue-400",
              bid.etaStatus === "late" && "text-yellow-400"
            )} />
            <div>
              <p className="text-xs text-slate-400">ETA</p>
              <p className="text-sm text-white">{bid.eta}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-green-400" />
            <div>
              <p className="text-xs text-slate-400">On-Time</p>
              <p className="text-sm text-white">{bid.onTimeRate}%</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Truck className="w-4 h-4 text-blue-400" />
            <div>
              <p className="text-xs text-slate-400">Equipment</p>
              <p className="text-sm text-white">{bid.equipment}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Shield className={cn(
              "w-4 h-4",
              bid.hasHazmatAuth ? "text-green-400" : "text-red-400"
            )} />
            <div>
              <p className="text-xs text-slate-400">Hazmat Auth</p>
              <p className="text-sm text-white">{bid.hasHazmatAuth ? "Verified" : "Not Verified"}</p>
            </div>
          </div>
        </div>

        {/* Driver Info (if assigned) */}
        {bid.driverName && (
          <div className="mt-3 p-2 rounded-lg bg-slate-700/30 text-sm">
            <span className="text-slate-400">Driver: </span>
            <span className="text-white">{bid.driverName}</span>
            {bid.driverHOS && (
              <span className="text-slate-400 ml-2">({bid.driverHOS} HOS available)</span>
            )}
          </div>
        )}

        {/* Notes */}
        {bid.notes && (
          <div className="mt-3 p-2 rounded-lg bg-slate-700/30 text-sm text-slate-300">
            "{bid.notes}"
          </div>
        )}

        {/* Status Badge */}
        {bid.status !== "pending" && (
          <div className="mt-3">
            <Badge
              className={cn(
                bid.status === "accepted" && "bg-green-500/20 text-green-400",
                bid.status === "rejected" && "bg-red-500/20 text-red-400",
                bid.status === "countered" && "bg-yellow-500/20 text-yellow-400",
                bid.status === "expired" && "bg-slate-500/20 text-slate-400"
              )}
            >
              {bid.status === "accepted" && <CheckCircle className="w-3 h-3 mr-1" />}
              {bid.status === "rejected" && <XCircle className="w-3 h-3 mr-1" />}
              {bid.status.charAt(0).toUpperCase() + bid.status.slice(1)}
              {bid.status === "countered" && bid.counterOffer && ` - $${bid.counterOffer.toLocaleString()}`}
            </Badge>
          </div>
        )}

        {/* Actions (for pending bids in shipper view) */}
        {isShipperView && bid.status === "pending" && (
          <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-700">
            <Button
              size="sm"
              onClick={() => onAccept?.(bid.id)}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="w-4 h-4 mr-1" />
              Award
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onCounter?.(bid.id, bid.bidAmount)}
              className="border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/10"
            >
              <DollarSign className="w-4 h-4 mr-1" />
              Counter
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onMessage?.(bid.id)}
              className="border-slate-600"
            >
              <MessageSquare className="w-4 h-4 mr-1" />
              Message
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onReject?.(bid.id)}
              className="text-red-400 hover:text-red-300 hover:bg-red-500/10 ml-auto"
            >
              <XCircle className="w-4 h-4 mr-1" />
              Reject
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default BidCard;
