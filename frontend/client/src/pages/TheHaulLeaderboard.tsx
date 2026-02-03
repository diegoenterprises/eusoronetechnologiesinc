/**
 * The Haul - Leaderboard
 * Journey Document: All user journeys - Section 11
 * 
 * NO MOCK DATA - All data from tRPC queries
 */

import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, Crown, Medal, ArrowLeft, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Link } from 'wouter';

export default function TheHaulLeaderboard() {
  const [period, setPeriod] = useState('weekly');

  const { data: leaderboard, isLoading } = trpc.gamification.getLeaderboard.useQuery({ 
    period: period as 'daily' | 'weekly' | 'monthly' | 'allTime',
    limit: 50 
  });
  const { data: myRank } = trpc.gamification.getMyRank.useQuery({ period: period as any });

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-32" />
        <div className="space-y-2">
          {[...Array(10)].map((_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      </div>
    );
  }

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="h-6 w-6 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-6 w-6 text-gray-400" />;
    if (rank === 3) return <Medal className="h-6 w-6 text-orange-400" />;
    return <span className="text-lg font-bold text-muted-foreground">{rank}</span>;
  };

  const getTrendIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (change < 0) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/the-haul">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Trophy className="h-6 w-6 text-yellow-500" />
            Leaderboard
          </h1>
          <p className="text-muted-foreground">See how you rank against other haulers</p>
        </div>
      </div>

      {myRank && (
        <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center">
                  {getRankIcon(myRank.rank)}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Your Rank</p>
                  <p className="text-2xl font-bold">#{myRank.rank}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Your Miles</p>
                <p className="text-2xl font-bold text-yellow-600">{myRank.totalMiles?.toLocaleString() || 0}</p>
              </div>
              <div className="flex items-center gap-2">
                {getTrendIcon(myRank.change || 0)}
                <span className={myRank.change > 0 ? 'text-green-600' : myRank.change < 0 ? 'text-red-600' : 'text-muted-foreground'}>
                  {myRank.change > 0 ? '+' : ''}{myRank.change || 0} positions
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={period} onValueChange={setPeriod}>
        <TabsList>
          <TabsTrigger value="daily">Today</TabsTrigger>
          <TabsTrigger value="weekly">This Week</TabsTrigger>
          <TabsTrigger value="monthly">This Month</TabsTrigger>
          <TabsTrigger value="allTime">All Time</TabsTrigger>
        </TabsList>

        <TabsContent value={period} className="mt-6">
          <Card>
            <CardContent className="p-0">
              <div className="divide-y">
                {leaderboard?.map((entry: any, index: number) => (
                  <div 
                    key={entry.userId} 
                    className={`flex items-center justify-between p-4 ${
                      entry.isCurrentUser ? 'bg-yellow-50' : ''
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        index === 0 ? 'bg-yellow-100' :
                        index === 1 ? 'bg-gray-100' :
                        index === 2 ? 'bg-orange-100' :
                        'bg-gray-50'
                      }`}>
                        {getRankIcon(index + 1)}
                      </div>
                      <div>
                        <p className="font-medium">{entry.name || `User ${entry.userId}`}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>Level {entry.level}</span>
                          {entry.guildName && (
                            <>
                              <span>-</span>
                              <Badge variant="outline" className="text-xs">{entry.guildName}</Badge>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-2">
                        {getTrendIcon(entry.change || 0)}
                        <span className="text-sm text-muted-foreground">
                          {entry.change > 0 ? '+' : ''}{entry.change || 0}
                        </span>
                      </div>
                      <div className="text-right min-w-[100px]">
                        <p className="font-bold text-yellow-500">{entry.totalMiles?.toLocaleString() || 0}</p>
                        <p className="text-xs text-muted-foreground">miles</p>
                      </div>
                    </div>
                  </div>
                ))}
                {(!leaderboard || leaderboard.length === 0) && (
                  <div className="p-6 text-center text-muted-foreground">
                    No leaderboard data available
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
