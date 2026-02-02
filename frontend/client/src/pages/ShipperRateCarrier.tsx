/**
 * SHIPPER RATE CARRIER PAGE
 * 100% Dynamic - Post-delivery carrier rating with feedback
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
  Star, Truck, MapPin, Clock, CheckCircle,
  MessageSquare, ChevronLeft, Send, Package,
  DollarSign, Shield
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const ratingCategories = [
  { key: "communication", label: "Communication", description: "Responsiveness and updates" },
  { key: "timeliness", label: "Timeliness", description: "On-time pickup and delivery" },
  { key: "professionalism", label: "Professionalism", description: "Driver conduct and appearance" },
  { key: "cargoHandling", label: "Cargo Handling", description: "Care of goods during transport" },
  { key: "documentation", label: "Documentation", description: "BOL, POD accuracy and completeness" },
];

export default function ShipperRateCarrier() {
  const [, navigate] = useLocation();
  const [, params] = useRoute("/shipper/rate/:loadId");
  const loadId = params?.loadId;

  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [overallRating, setOverallRating] = useState(0);
  const [comment, setComment] = useState("");
  const [wouldUseAgain, setWouldUseAgain] = useState<boolean | null>(null);

  const loadQuery = trpc.loads.getById.useQuery({ id: loadId || "" });

  const submitMutation = trpc.ratings.submitCarrierRating.useMutation({
    onSuccess: () => {
      toast.success("Rating submitted successfully");
      navigate("/shipper/loads");
    },
    onError: (error) => toast.error("Failed to submit rating", { description: error.message }),
  });

  const load = loadQuery.data;

  const handleCategoryRating = (key: string, value: number) => {
    const newRatings = { ...ratings, [key]: value };
    setRatings(newRatings);
    
    const values = Object.values(newRatings);
    if (values.length > 0) {
      const avg = values.reduce((a, b) => a + b, 0) / values.length;
      setOverallRating(Math.round(avg));
    }
  };

  const handleSubmit = () => {
    if (!loadId) return;
    submitMutation.mutate({
      loadId,
      overallRating,
      categoryRatings: ratings,
      comment,
      wouldUseAgain: wouldUseAgain ?? true,
    });
  };

  const StarRating = ({ value, onChange }: { value: number; onChange: (v: number) => void }) => (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          onClick={() => onChange(star)}
          className="p-1 hover:scale-110 transition-transform"
        >
          <Star
            className={cn(
              "w-8 h-8 transition-colors",
              star <= value ? "text-yellow-400 fill-yellow-400" : "text-slate-600 hover:text-slate-500"
            )}
          />
        </button>
      ))}
    </div>
  );

  if (loadQuery.isLoading) {
    return (
      <div className="p-4 md:p-6 space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-48 w-full rounded-xl" />
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
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
            Rate Carrier
          </h1>
          <p className="text-slate-400 text-sm mt-1">Load #{load?.loadNumber} - Completed</p>
        </div>
      </div>

      {/* Load Summary */}
      <Card className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/30 rounded-xl">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-green-500/20">
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Badge className="bg-green-500/20 text-green-400 border-0">Delivered</Badge>
                <span className="text-slate-400 text-sm">{load?.deliveredAt}</span>
              </div>
              <p className="text-white font-medium">{load?.origin?.city} → {load?.destination?.city}</p>
            </div>
            <div className="text-right">
              <p className="text-slate-400 text-sm">Carrier</p>
              <p className="text-white font-bold">{load?.carrier?.name}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Overall Rating */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-400" />
            Overall Rating
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center py-6">
          <StarRating value={overallRating} onChange={setOverallRating} />
          <p className="text-slate-400 text-sm mt-3">
            {overallRating === 0 && "Tap to rate"}
            {overallRating === 1 && "Poor"}
            {overallRating === 2 && "Fair"}
            {overallRating === 3 && "Good"}
            {overallRating === 4 && "Very Good"}
            {overallRating === 5 && "Excellent"}
          </p>
        </CardContent>
      </Card>

      {/* Category Ratings */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg">Rate by Category</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {ratingCategories.map((category) => (
            <div
              key={category.key}
              className="flex items-center justify-between p-3 rounded-lg bg-slate-700/30"
            >
              <div>
                <p className="text-white font-medium">{category.label}</p>
                <p className="text-slate-400 text-sm">{category.description}</p>
              </div>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => handleCategoryRating(category.key, star)}
                    className="p-0.5 hover:scale-110 transition-transform"
                  >
                    <Star
                      className={cn(
                        "w-5 h-5 transition-colors",
                        star <= (ratings[category.key] || 0)
                          ? "text-yellow-400 fill-yellow-400"
                          : "text-slate-600 hover:text-slate-500"
                      )}
                    />
                  </button>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Would Use Again */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardContent className="p-4">
          <p className="text-white font-medium mb-3">Would you use this carrier again?</p>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => setWouldUseAgain(true)}
              className={cn(
                "flex-1 rounded-lg h-12",
                wouldUseAgain === true
                  ? "bg-green-500/20 border-green-500/50 text-green-400"
                  : "bg-slate-700/50 border-slate-600/50 text-slate-300"
              )}
            >
              <CheckCircle className="w-5 h-5 mr-2" />
              Yes, Definitely
            </Button>
            <Button
              variant="outline"
              onClick={() => setWouldUseAgain(false)}
              className={cn(
                "flex-1 rounded-lg h-12",
                wouldUseAgain === false
                  ? "bg-red-500/20 border-red-500/50 text-red-400"
                  : "bg-slate-700/50 border-slate-600/50 text-slate-300"
              )}
            >
              No
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Comments */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-cyan-400" />
            Additional Comments
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your experience with this carrier..."
            className="bg-slate-700/50 border-slate-600/50 rounded-lg min-h-[120px]"
          />
        </CardContent>
      </Card>

      {/* Submit */}
      <div className="flex justify-end">
        <Button
          onClick={handleSubmit}
          disabled={overallRating === 0 || submitMutation.isPending}
          className="bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 rounded-lg px-8"
          size="lg"
        >
          <Send className="w-5 h-5 mr-2" />
          Submit Rating
        </Button>
      </div>
    </div>
  );
}
