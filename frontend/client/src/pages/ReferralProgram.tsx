/**
 * REFERRAL PROGRAM PAGE
 * 100% Dynamic - No mock data
 * UI Style: Gradient headers, stat cards with icons, rounded cards
 */

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  Users, Gift, DollarSign, Copy, Share2,
  CheckCircle, Clock, TrendingUp
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function ReferralProgram() {
  const referralQuery = (trpc as any).users.getReferralInfo.useQuery();
  const referralsQuery = (trpc as any).users.getReferrals.useQuery();

  const referral = referralQuery.data;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed": return <Badge className="bg-green-500/20 text-green-400 border-0"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>;
      case "pending": return <Badge className="bg-yellow-500/20 text-yellow-400 border-0"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case "expired": return <Badge className="bg-slate-500/20 text-slate-400 border-0">Expired</Badge>;
      default: return <Badge className="bg-slate-500/20 text-slate-400 border-0">{status}</Badge>;
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with Gradient Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
            Referral Program
          </h1>
          <p className="text-slate-400 text-sm mt-1">Invite friends and earn rewards</p>
        </div>
      </div>

      {/* Referral Link Card */}
      {referralQuery.isLoading ? (
        <Skeleton className="h-40 w-full rounded-xl" />
      ) : (
        <Card className="bg-gradient-to-r from-cyan-500/10 to-emerald-500/10 border-cyan-500/30 rounded-xl">
          <CardContent className="p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-4 rounded-full bg-cyan-500/20">
                <Gift className="w-8 h-8 text-cyan-400" />
              </div>
              <div>
                <p className="text-white text-xl font-bold">Your Referral Link</p>
                <p className="text-slate-400">Share this link to earn ${referral?.rewardAmount} per referral</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Input value={referral?.referralLink} readOnly className="flex-1 bg-slate-800/50 border-slate-700/50 rounded-lg font-mono text-sm" />
              <Button variant="outline" className="bg-slate-700/50 border-slate-600/50 hover:bg-slate-700 rounded-lg" onClick={() => copyToClipboard(referral?.referralLink || "")}>
                <Copy className="w-4 h-4 mr-2" />Copy
              </Button>
              <Button className="bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 rounded-lg">
                <Share2 className="w-4 h-4 mr-2" />Share
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-500/20">
                <Users className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                {referralQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-blue-400">{referral?.totalReferrals || 0}</p>
                )}
                <p className="text-xs text-slate-400">Total Referrals</p>
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
                {referralQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-green-400">{referral?.completedReferrals || 0}</p>
                )}
                <p className="text-xs text-slate-400">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-emerald-500/20">
                <DollarSign className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                {referralQuery.isLoading ? <Skeleton className="h-8 w-16" /> : (
                  <p className="text-2xl font-bold text-emerald-400">${referral?.totalEarnings || 0}</p>
                )}
                <p className="text-xs text-slate-400">Total Earned</p>
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
                {referralQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-purple-400">{referral?.conversionRate}%</p>
                )}
                <p className="text-xs text-slate-400">Conversion Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Referrals List */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <Users className="w-5 h-5 text-cyan-400" />
            Your Referrals
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {referralsQuery.isLoading ? (
            <div className="p-4 space-y-3">{[1, 2, 3].map((i: any) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div>
          ) : (referralsQuery.data as any)?.length === 0 ? (
            <div className="text-center py-16">
              <Users className="w-10 h-10 text-slate-500 mx-auto mb-3" />
              <p className="text-slate-400">No referrals yet</p>
              <p className="text-sm text-slate-500 mt-1">Share your link to start earning</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {(referralsQuery.data as any)?.map((ref: any) => (
                <div key={ref.id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={cn("w-10 h-10 rounded-full flex items-center justify-center font-bold", ref.status === "completed" ? "bg-green-500/20 text-green-400" : "bg-slate-700/50 text-slate-400")}>
                      {ref.name?.charAt(0) || "?"}
                    </div>
                    <div>
                      <p className="text-white font-medium">{ref.name || ref.email}</p>
                      <p className="text-xs text-slate-500">Joined: {ref.joinedAt}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {getStatusBadge(ref.status)}
                    {ref.status === "completed" && (
                      <span className="text-green-400 font-bold">+${ref.reward}</span>
                    )}
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
