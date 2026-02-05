/**
 * PERFORMANCE REVIEWS PAGE
 * 100% Dynamic - No mock data
 * UI Style: Gradient headers, stat cards with icons, rounded cards
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  Star, Search, CheckCircle, Clock, Calendar,
  Plus
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function PerformanceReviews() {
  const [search, setSearch] = useState("");

  const reviewsQuery = (trpc as any).drivers.getPerformanceReviews.useQuery({ search });
  const statsQuery = (trpc as any).drivers.getReviewStats.useQuery();

  const stats = statsQuery.data;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed": return <Badge className="bg-green-500/20 text-green-400 border-0"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>;
      case "pending": return <Badge className="bg-yellow-500/20 text-yellow-400 border-0"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case "scheduled": return <Badge className="bg-blue-500/20 text-blue-400 border-0"><Calendar className="w-3 h-3 mr-1" />Scheduled</Badge>;
      default: return <Badge className="bg-slate-500/20 text-slate-400 border-0">{status}</Badge>;
    }
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4) return "text-green-400";
    if (rating >= 3) return "text-yellow-400";
    return "text-red-400";
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">Performance Reviews</h1>
          <p className="text-slate-400 text-sm mt-1">Driver performance evaluations</p>
        </div>
        <Button className="bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 rounded-lg">
          <Plus className="w-4 h-4 mr-2" />New Review
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-cyan-500/20"><Star className="w-6 h-6 text-cyan-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-cyan-400">{stats?.total || 0}</p>}<p className="text-xs text-slate-400">Reviews</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/20"><CheckCircle className="w-6 h-6 text-green-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-green-400">{stats?.completed || 0}</p>}<p className="text-xs text-slate-400">Completed</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-yellow-500/20"><Clock className="w-6 h-6 text-yellow-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-yellow-400">{stats?.pending || 0}</p>}<p className="text-xs text-slate-400">Pending</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-purple-500/20"><Star className="w-6 h-6 text-purple-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-purple-400">{stats?.avgRating?.toFixed(1)}</p>}<p className="text-xs text-slate-400">Avg Rating</p></div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input value={search} onChange={(e: any) => setSearch(e.target.value)} placeholder="Search reviews..." className="pl-9 bg-slate-800/50 border-slate-700/50 rounded-lg" />
      </div>

      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3"><CardTitle className="text-white text-lg flex items-center gap-2"><Star className="w-5 h-5 text-cyan-400" />Performance Reviews</CardTitle></CardHeader>
        <CardContent className="p-0">
          {reviewsQuery.isLoading ? (
            <div className="p-4 space-y-3">{[1, 2, 3, 4].map((i: any) => <Skeleton key={i} className="h-24 w-full rounded-lg" />)}</div>
          ) : (reviewsQuery.data as any)?.length === 0 ? (
            <div className="text-center py-16"><Star className="w-10 h-10 text-slate-500 mx-auto mb-3" /><p className="text-slate-400">No reviews found</p></div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {(reviewsQuery.data as any)?.map((review: any) => (
                <div key={review.id} className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center font-bold text-white text-lg">{review.driverName?.charAt(0)}</div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-white font-bold">{review.driverName}</p>
                          {getStatusBadge(review.status)}
                        </div>
                        <div className="flex items-center gap-4 text-xs text-slate-500">
                          <span>Period: {review.reviewPeriod}</span>
                          <span>Reviewer: {review.reviewer}</span>
                        </div>
                      </div>
                    </div>
                    {review.overallRating && (
                      <div className="text-right">
                        <p className={cn("text-3xl font-bold", getRatingColor(review.overallRating))}>{review.overallRating.toFixed(1)}</p>
                        <div className="flex items-center gap-0.5">{[1, 2, 3, 4, 5].map((s: any) => <Star key={s} className={cn("w-3 h-3", s <= review.overallRating ? "text-yellow-400 fill-yellow-400" : "text-slate-600")} />)}</div>
                      </div>
                    )}
                  </div>
                  {review.categories && (
                    <div className="grid grid-cols-4 gap-3">
                      {review.categories.map((cat: any, idx: number) => (
                        <div key={idx} className="p-2 rounded-lg bg-slate-700/30">
                          <div className="flex items-center justify-between mb-1"><span className="text-xs text-slate-500">{cat.name}</span><span className="text-xs text-white">{cat.score}/5</span></div>
                          <Progress value={(cat.score / 5) * 100} className="h-1" />
                        </div>
                      ))}
                    </div>
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
