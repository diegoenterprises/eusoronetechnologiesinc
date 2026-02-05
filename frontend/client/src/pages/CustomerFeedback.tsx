/**
 * CUSTOMER FEEDBACK PAGE
 * 100% Dynamic - No mock data
 * UI Style: Gradient headers, stat cards with icons, rounded cards
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  MessageSquare, Search, Star, ThumbsUp, ThumbsDown,
  TrendingUp, Reply
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function CustomerFeedback() {
  const [searchTerm, setSearchTerm] = useState("");
  const [ratingFilter, setRatingFilter] = useState("all");

  const feedbackQuery = (trpc as any).feedback.list.useQuery({ rating: ratingFilter === "all" ? undefined : parseInt(ratingFilter), limit: 50 });
  const summaryQuery = (trpc as any).feedback.getSummary.useQuery();

  const respondMutation = (trpc as any).feedback.respond.useMutation({
    onSuccess: () => { toast.success("Response sent"); feedbackQuery.refetch(); },
    onError: (error: any) => toast.error("Failed to respond", { description: error.message }),
  });

  const summary = summaryQuery.data;

  const filteredFeedback = (feedbackQuery.data as any)?.filter((item: any) =>
    !searchTerm || item.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) || item.comment?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_: any, i: number) => (
      <Star key={i} className={cn("w-4 h-4", i < rating ? "text-amber-400 fill-amber-400" : "text-slate-600")} />
    ));
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with Gradient Title */}
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
          Customer Feedback
        </h1>
        <p className="text-slate-400 text-sm mt-1">Reviews and ratings from customers</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 border-amber-500/30 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-amber-500/20">
                <Star className="w-6 h-6 text-amber-400 fill-amber-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-amber-400">{summary?.avgRating?.toFixed(1)}</p>
                )}
                <p className="text-xs text-slate-400">Avg Rating</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-500/20">
                <MessageSquare className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-blue-400">{summary?.totalReviews || 0}</p>
                )}
                <p className="text-xs text-slate-400">Total Reviews</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/20">
                <ThumbsUp className="w-6 h-6 text-green-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-green-400">{summary?.positiveRate}%</p>
                )}
                <p className="text-xs text-slate-400">Positive</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-purple-500/20">
                <TrendingUp className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-purple-400">{summary?.nps}</p>
                )}
                <p className="text-xs text-slate-400">NPS Score</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input value={searchTerm} onChange={(e: any) => setSearchTerm(e.target.value)} placeholder="Search feedback..." className="pl-9 bg-slate-800/50 border-slate-700/50 rounded-lg" />
        </div>
        <Select value={ratingFilter} onValueChange={setRatingFilter}>
          <SelectTrigger className="w-[150px] bg-slate-800/50 border-slate-700/50 rounded-lg">
            <SelectValue placeholder="Rating" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Ratings</SelectItem>
            <SelectItem value="5">5 Stars</SelectItem>
            <SelectItem value="4">4 Stars</SelectItem>
            <SelectItem value="3">3 Stars</SelectItem>
            <SelectItem value="2">2 Stars</SelectItem>
            <SelectItem value="1">1 Star</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Feedback List */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardContent className="p-0">
          {feedbackQuery.isLoading ? (
            <div className="p-4 space-y-3">{[1, 2, 3, 4, 5].map((i: any) => <Skeleton key={i} className="h-28 w-full rounded-xl" />)}</div>
          ) : filteredFeedback?.length === 0 ? (
            <div className="text-center py-16">
              <div className="p-4 rounded-full bg-slate-700/50 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <MessageSquare className="w-10 h-10 text-slate-500" />
              </div>
              <p className="text-slate-400 text-lg">No feedback found</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {filteredFeedback?.map((item: any) => (
                <div key={item.id} className={cn("p-4", item.rating <= 2 && "bg-red-500/5 border-l-2 border-red-500")}>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-white font-medium">{item.customerName}</p>
                        <div className="flex items-center">{renderStars(item.rating)}</div>
                      </div>
                      <p className="text-sm text-slate-400">Load: {item.loadNumber}</p>
                    </div>
                    <p className="text-xs text-slate-500">{item.date}</p>
                  </div>
                  <p className="text-slate-300 mb-3">{item.comment}</p>
                  {item.response ? (
                    <div className="p-3 rounded-lg bg-slate-700/30 mt-2">
                      <p className="text-xs text-cyan-400 mb-1">Response:</p>
                      <p className="text-sm text-slate-400">{item.response}</p>
                    </div>
                  ) : (
                    <Button size="sm" variant="outline" className="bg-slate-700/50 border-slate-600/50 hover:bg-slate-700 rounded-lg" onClick={() => respondMutation.mutate({ feedbackId: item.id, response: "Thank you for your feedback!" })}>
                      <Reply className="w-3 h-3 mr-1" />Respond
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
