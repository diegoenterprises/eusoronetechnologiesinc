/**
 * FEATURE REQUESTS PAGE
 * 100% Dynamic - No mock data
 * UI Style: Gradient headers, stat cards with icons, rounded cards
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  Lightbulb, Search, Plus, ThumbsUp, MessageSquare,
  CheckCircle, Clock, TrendingUp
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function FeatureRequests() {
  const [searchTerm, setSearchTerm] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const requestsQuery = (trpc as any).features.list.useQuery({ limit: 50 });
  const summaryQuery = (trpc as any).features.getSummary.useQuery();

  const submitMutation = (trpc as any).features.submit.useMutation({
    onSuccess: () => { toast.success("Feature request submitted"); requestsQuery.refetch(); setTitle(""); setDescription(""); },
    onError: (error: any) => toast.error("Failed to submit", { description: error.message }),
  });

  const voteMutation = (trpc as any).features.vote.useMutation({
    onSuccess: () => { toast.success("Vote recorded"); requestsQuery.refetch(); },
    onError: (error: any) => toast.error("Failed to vote", { description: error.message }),
  });

  const summary = summaryQuery.data;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "planned": return <Badge className="bg-blue-500/20 text-blue-400 border-0">Planned</Badge>;
      case "in_progress": return <Badge className="bg-yellow-500/20 text-yellow-400 border-0"><Clock className="w-3 h-3 mr-1" />In Progress</Badge>;
      case "completed": return <Badge className="bg-green-500/20 text-green-400 border-0"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>;
      case "under_review": return <Badge className="bg-purple-500/20 text-purple-400 border-0">Under Review</Badge>;
      default: return <Badge className="bg-slate-500/20 text-slate-400 border-0">{status}</Badge>;
    }
  };

  const filteredRequests = (requestsQuery.data as any)?.filter((request: any) =>
    !searchTerm || request.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with Gradient Title */}
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
          Feature Requests
        </h1>
        <p className="text-slate-400 text-sm mt-1">Suggest and vote on new features</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-500/20">
                <Lightbulb className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-blue-400">{summary?.total || 0}</p>
                )}
                <p className="text-xs text-slate-400">Total Requests</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-yellow-500/20">
                <Clock className="w-6 h-6 text-yellow-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-yellow-400">{summary?.inProgress || 0}</p>
                )}
                <p className="text-xs text-slate-400">In Progress</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/20">
                <CheckCircle className="w-6 h-6 text-green-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-green-400">{summary?.completed || 0}</p>
                )}
                <p className="text-xs text-slate-400">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-cyan-500/20">
                <TrendingUp className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-cyan-400">{summary?.totalVotes?.toLocaleString()}</p>
                )}
                <p className="text-xs text-slate-400">Total Votes</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Submit Request */}
      <Card className="bg-gradient-to-r from-cyan-500/10 to-emerald-500/10 border-cyan-500/30 rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <Plus className="w-5 h-5 text-cyan-400" />
            Submit a Feature Request
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input value={title} onChange={(e: any) => setTitle(e.target.value)} placeholder="Feature title..." className="bg-slate-800/50 border-slate-700/50 rounded-lg" />
          <Textarea value={description} onChange={(e: any) => setDescription(e.target.value)} placeholder="Describe the feature..." className="bg-slate-800/50 border-slate-700/50 rounded-lg min-h-[100px]" />
          <Button className="bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 rounded-lg" onClick={() => submitMutation.mutate({ title, description })} disabled={!title || !description || submitMutation.isPending}>
            <Plus className="w-4 h-4 mr-2" />Submit Request
          </Button>
        </CardContent>
      </Card>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <Input value={searchTerm} onChange={(e: any) => setSearchTerm(e.target.value)} placeholder="Search requests..." className="pl-9 bg-slate-800/50 border-slate-700/50 rounded-lg" />
      </div>

      {/* Requests List */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardContent className="p-0">
          {requestsQuery.isLoading ? (
            <div className="p-4 space-y-3">{[1, 2, 3, 4, 5].map((i: any) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}</div>
          ) : filteredRequests?.length === 0 ? (
            <div className="text-center py-16">
              <div className="p-4 rounded-full bg-slate-700/50 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <Lightbulb className="w-10 h-10 text-slate-500" />
              </div>
              <p className="text-slate-400 text-lg">No feature requests found</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {filteredRequests?.map((request: any) => (
                <div key={request.id} className="p-4 flex items-start gap-4">
                  <Button variant="outline" className={cn("flex flex-col items-center p-2 min-w-[60px] rounded-lg", request.voted ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-400" : "bg-slate-700/50 border-slate-600/50 text-slate-400 hover:text-cyan-400 hover:border-cyan-500/50")} onClick={() => voteMutation.mutate({ requestId: request.id })}>
                    <ThumbsUp className="w-5 h-5" />
                    <span className="text-sm font-bold">{request.votes}</span>
                  </Button>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-white font-medium">{request.title}</p>
                      {getStatusBadge(request.status)}
                    </div>
                    <p className="text-sm text-slate-400 mb-2">{request.description}</p>
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span>By {request.author}</span>
                      <span>{request.createdAt}</span>
                      <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" />{request.commentsCount} comments</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
