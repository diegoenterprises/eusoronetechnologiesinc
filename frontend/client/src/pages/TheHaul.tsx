/**
 * The Haul - Gamification Dashboard
 * Journey Document: All user journeys - Section 11
 * 
 * NO MOCK DATA - All data from tRPC queries
 */

import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Trophy, Target, Star, Gift, Package, Users, 
  TrendingUp, Zap, Award, Crown, ChevronRight 
} from 'lucide-react';

export default function TheHaul() {
  const [activeTab, setActiveTab] = useState('overview');

  const { data: profile, isLoading: profileLoading } = (trpc as any).gamification.getProfile.useQuery({ userId: "current" });
  const { data: missions, isLoading: missionsLoading } = (trpc as any).gamification.getMissions.useQuery({ type: "all" });
  const { data: achievements, isLoading: achievementsLoading } = (trpc as any).gamification.getAchievements.useQuery({ category: "all" });
  const { data: leaderboard, isLoading: leaderboardLoading } = (trpc as any).gamification.getLeaderboard.useQuery({ limit: 10 });

  if (profileLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_: any, i: number) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Trophy className="h-6 w-6 text-yellow-500" />
            The Haul
          </h1>
          <p className="text-muted-foreground">Your gamification dashboard</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Level</p>
            <p className="text-2xl font-bold">{profile?.level || 1}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Haul Miles</p>
            <p className="text-2xl font-bold text-yellow-500">{profile?.currentMiles?.toLocaleString() || 0}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-yellow-100">
                <Star className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Miles</p>
                <p className="text-2xl font-bold">{(profile?.totalMilesEarned || profile?.totalPoints || 0).toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-100">
                <Target className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Missions</p>
                <p className="text-2xl font-bold">{missions?.active?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-purple-100">
                <Award className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Achievements</p>
                <p className="text-2xl font-bold">{achievements?.earned?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-100">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Streak</p>
                <p className="text-2xl font-bold">{(profile as any)?.currentStreak || 0} days</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Level Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Level {profile?.level || 1}</span>
              <span>Level {(profile?.level || 1) + 1}</span>
            </div>
            <Progress value={(profile as any)?.levelProgress || (profile?.currentXp && profile?.xpToNextLevel ? (profile.currentXp / profile.xpToNextLevel) * 100 : 0)} className="h-3" />
            <p className="text-sm text-muted-foreground text-center">
              {(profile?.xpToNextLevel || 0).toLocaleString()} XP until next level
            </p>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="missions">Missions</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          <TabsTrigger value="rewards">Rewards</TabsTrigger>
        </TabsList>

        <TabsContent value="missions" className="space-y-4">
          {missionsLoading ? (
            <Skeleton className="h-32" />
          ) : (
            <div className="grid gap-4">
              {(missions?.active || [])?.map((mission: any) => (
                <Card key={mission.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-2 rounded-full bg-blue-100">
                          <Target className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium">{mission.name}</p>
                          <p className="text-sm text-muted-foreground">{mission.description}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-yellow-500">+{mission.reward} miles</p>
                        <Progress value={mission.progress || 0} className="w-24 h-2 mt-1" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {(!missions?.active || missions.active.length === 0) && (
                <Card>
                  <CardContent className="p-6 text-center text-muted-foreground">
                    No active missions available
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="achievements" className="space-y-4">
          {achievementsLoading ? (
            <Skeleton className="h-32" />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(achievements?.earned || [])?.map((achievement: any) => (
                <Card key={achievement.id} className={achievement.unlocked ? '' : 'opacity-50'}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-full ${achievement.unlocked ? 'bg-yellow-100' : 'bg-slate-800'}`}>
                        <Award className={`h-6 w-6 ${achievement.unlocked ? 'text-yellow-600' : 'text-slate-400'}`} />
                      </div>
                      <div>
                        <p className="font-medium">{achievement.name}</p>
                        <p className="text-sm text-muted-foreground">{achievement.description}</p>
                        {achievement.unlocked && (
                          <p className="text-xs text-green-600 mt-1">Unlocked</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="leaderboard" className="space-y-4">
          {leaderboardLoading ? (
            <Skeleton className="h-64" />
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="divide-y">
                  {(leaderboard?.leaders || [])?.map((entry: any, index: number) => (
                    <div key={entry.userId} className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-4">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                          index === 0 ? 'bg-yellow-100 text-yellow-600' :
                          index === 1 ? 'bg-slate-800 text-slate-600' :
                          index === 2 ? 'bg-orange-100 text-orange-600' :
                          'bg-slate-800/50 text-slate-500'
                        }`}>
                          {index === 0 ? <Crown className="h-4 w-4" /> : index + 1}
                        </div>
                        <div>
                          <p className="font-medium">{entry.name || `User ${entry.userId}`}</p>
                          <p className="text-sm text-muted-foreground">Level {entry.level}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-yellow-500">{entry.totalMiles?.toLocaleString() || 0}</p>
                        <p className="text-xs text-muted-foreground">miles</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="rewards" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-6 text-center">
                <Gift className="h-12 w-12 mx-auto text-purple-500 mb-4" />
                <p className="font-medium">Reward Store</p>
                <p className="text-sm text-muted-foreground">Redeem your miles for rewards</p>
                <Button className="mt-4" variant="outline">
                  Browse Rewards <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-6 text-center">
                <Package className="h-12 w-12 mx-auto text-blue-500 mb-4" />
                <p className="font-medium">Loot Crates</p>
                <p className="text-sm text-muted-foreground">Open mystery crates</p>
                <Button className="mt-4" variant="outline">
                  View Crates <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-6 text-center">
                <Users className="h-12 w-12 mx-auto text-green-500 mb-4" />
                <p className="font-medium">Guilds</p>
                <p className="text-sm text-muted-foreground">Join a guild for bonuses</p>
                <Button className="mt-4" variant="outline">
                  Find Guild <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
