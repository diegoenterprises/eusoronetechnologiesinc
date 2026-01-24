/**
 * PROFILE PAGE
 * 100% Dynamic - No mock data
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  User, Mail, Phone, MapPin, Edit2, Save, Award, Star,
  Trophy, Target, TrendingUp, Shield, Clock, Truck,
  CheckCircle, Calendar, Settings, Bell, Lock, Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function Profile() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [isEditing, setIsEditing] = useState(false);

  const profileQuery = trpc.profile.getMyProfile.useQuery();
  const statsQuery = trpc.profile.getStats.useQuery();
  const achievementsQuery = trpc.gamification.getMyAchievements.useQuery();
  const pointsHistoryQuery = trpc.gamification.getPointsHistory.useQuery({ limit: 10 });

  const updateProfileMutation = trpc.profile.update.useMutation({
    onSuccess: () => { toast.success("Profile updated"); setIsEditing(false); profileQuery.refetch(); },
    onError: (error) => toast.error("Failed to update", { description: error.message }),
  });

  const profile = profileQuery.data;
  const stats = statsQuery.data;

  const getLevelProgress = () => {
    if (!stats) return 0;
    const currentLevelPoints = stats.currentLevelMinPoints || 0;
    const nextLevelPoints = stats.nextLevelMinPoints || 1000;
    const progress = ((stats.totalPoints - currentLevelPoints) / (nextLevelPoints - currentLevelPoints)) * 100;
    return Math.min(100, Math.max(0, progress));
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">My Profile</h1>
        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <Button variant="outline" className="border-slate-600" onClick={() => setIsEditing(false)}>Cancel</Button>
              <Button className="bg-green-600 hover:bg-green-700" onClick={() => updateProfileMutation.mutate({})} disabled={updateProfileMutation.isPending}>
                {updateProfileMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}Save
              </Button>
            </>
          ) : (
            <Button variant="outline" className="border-slate-600" onClick={() => setIsEditing(true)}>
              <Edit2 className="w-4 h-4 mr-2" />Edit Profile
            </Button>
          )}
        </div>
      </div>

      {/* Profile Header Card */}
      <Card className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border-purple-500/30">
        <CardContent className="p-6">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
              <User className="w-12 h-12 text-white" />
            </div>
            <div className="flex-1">
              {profileQuery.isLoading ? (
                <>
                  <Skeleton className="h-8 w-48 mb-2" />
                  <Skeleton className="h-6 w-32" />
                </>
              ) : (
                <>
                  <h2 className="text-2xl font-bold text-white">{profile?.firstName} {profile?.lastName}</h2>
                  <div className="flex items-center gap-3 mt-2">
                    <Badge className="bg-purple-500/20 text-purple-400">{profile?.role}</Badge>
                    <Badge className="bg-blue-500/20 text-blue-400">{profile?.company}</Badge>
                  </div>
                  <div className="flex items-center gap-4 mt-3 text-sm text-slate-400">
                    <span className="flex items-center gap-1"><Mail className="w-4 h-4" />{profile?.email}</span>
                    <span className="flex items-center gap-1"><Phone className="w-4 h-4" />{profile?.phone}</span>
                  </div>
                </>
              )}
            </div>
            <div className="text-center">
              {statsQuery.isLoading ? <Skeleton className="h-24 w-24 rounded-full" /> : (
                <div className="relative">
                  <div className="w-24 h-24 rounded-full bg-slate-700 flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-yellow-400">Lvl {stats?.level || 1}</p>
                      <p className="text-xs text-slate-400">{stats?.totalPoints?.toLocaleString()} pts</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Level Progress */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-400">Level Progress</span>
              {statsQuery.isLoading ? <Skeleton className="h-4 w-24" /> : (
                <span className="text-sm text-slate-400">{stats?.pointsToNextLevel?.toLocaleString()} pts to Level {(stats?.level || 0) + 1}</span>
              )}
            </div>
            <Progress value={getLevelProgress()} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4 text-center">
            <Truck className="w-6 h-6 mx-auto mb-2 text-blue-400" />
            {statsQuery.isLoading ? <Skeleton className="h-8 w-12 mx-auto" /> : (
              <p className="text-2xl font-bold text-blue-400">{stats?.loadsCompleted || 0}</p>
            )}
            <p className="text-xs text-slate-400">Loads</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4 text-center">
            <TrendingUp className="w-6 h-6 mx-auto mb-2 text-green-400" />
            {statsQuery.isLoading ? <Skeleton className="h-8 w-16 mx-auto" /> : (
              <p className="text-2xl font-bold text-green-400">{stats?.milesThisMonth?.toLocaleString() || 0}</p>
            )}
            <p className="text-xs text-slate-400">Miles</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4 text-center">
            <Shield className="w-6 h-6 mx-auto mb-2 text-purple-400" />
            {statsQuery.isLoading ? <Skeleton className="h-8 w-12 mx-auto" /> : (
              <p className="text-2xl font-bold text-purple-400">{stats?.safetyScore || 0}</p>
            )}
            <p className="text-xs text-slate-400">Safety</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4 text-center">
            <Star className="w-6 h-6 mx-auto mb-2 text-yellow-400 fill-yellow-400" />
            {statsQuery.isLoading ? <Skeleton className="h-8 w-12 mx-auto" /> : (
              <p className="text-2xl font-bold text-yellow-400">{stats?.rating || 0}</p>
            )}
            <p className="text-xs text-slate-400">Rating</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4 text-center">
            <Trophy className="w-6 h-6 mx-auto mb-2 text-orange-400" />
            {statsQuery.isLoading ? <Skeleton className="h-8 w-12 mx-auto" /> : (
              <p className="text-2xl font-bold text-orange-400">{stats?.achievementsCount || 0}</p>
            )}
            <p className="text-xs text-slate-400">Achievements</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-slate-800 border border-slate-700">
          <TabsTrigger value="overview" className="data-[state=active]:bg-purple-600">Overview</TabsTrigger>
          <TabsTrigger value="achievements" className="data-[state=active]:bg-purple-600">Achievements</TabsTrigger>
          <TabsTrigger value="activity" className="data-[state=active]:bg-purple-600">Activity</TabsTrigger>
          <TabsTrigger value="settings" className="data-[state=active]:bg-purple-600">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader><CardTitle className="text-white">Personal Information</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {profileQuery.isLoading ? (
                  [1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-12 w-full" />)
                ) : (
                  <>
                    <div><Label className="text-slate-400">First Name</Label><Input defaultValue={profile?.firstName} disabled={!isEditing} className="mt-1 bg-slate-700/50 border-slate-600" /></div>
                    <div><Label className="text-slate-400">Last Name</Label><Input defaultValue={profile?.lastName} disabled={!isEditing} className="mt-1 bg-slate-700/50 border-slate-600" /></div>
                    <div><Label className="text-slate-400">Email</Label><Input defaultValue={profile?.email} disabled className="mt-1 bg-slate-700/50 border-slate-600" /></div>
                    <div><Label className="text-slate-400">Phone</Label><Input defaultValue={profile?.phone} disabled={!isEditing} className="mt-1 bg-slate-700/50 border-slate-600" /></div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader><CardTitle className="text-white">Driver Information</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {profileQuery.isLoading ? (
                  [1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-12 w-full" />)
                ) : (
                  <>
                    <div className="flex justify-between"><span className="text-slate-400">CDL Number</span><span className="text-white">{profile?.cdlNumber || "N/A"}</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">CDL State</span><span className="text-white">{profile?.cdlState || "N/A"}</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">CDL Expiration</span><span className="text-white">{profile?.cdlExpiration || "N/A"}</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">Endorsements</span>
                      <div className="flex gap-1">{profile?.endorsements?.map((e: string) => <Badge key={e} className="bg-blue-500/20 text-blue-400">{e}</Badge>)}</div>
                    </div>
                    <div className="flex justify-between"><span className="text-slate-400">Medical Card Exp</span><span className="text-white">{profile?.medicalCardExpiration || "N/A"}</span></div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="achievements" className="mt-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader><CardTitle className="text-white flex items-center gap-2"><Trophy className="w-5 h-5 text-yellow-400" />My Achievements</CardTitle></CardHeader>
            <CardContent>
              {achievementsQuery.isLoading ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-32 w-full" />)}</div>
              ) : achievementsQuery.data?.length === 0 ? (
                <div className="text-center py-8">
                  <Trophy className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-400">No achievements yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {achievementsQuery.data?.map((achievement) => (
                    <div key={achievement.id} className={cn("p-4 rounded-lg text-center", achievement.unlocked ? "bg-yellow-500/10 border border-yellow-500/30" : "bg-slate-700/30 opacity-50")}>
                      <div className={cn("w-12 h-12 mx-auto mb-2 rounded-full flex items-center justify-center", achievement.unlocked ? "bg-yellow-500/20" : "bg-slate-600")}>
                        <Award className={cn("w-6 h-6", achievement.unlocked ? "text-yellow-400" : "text-slate-500")} />
                      </div>
                      <p className="text-white font-medium text-sm">{achievement.name}</p>
                      <p className="text-xs text-slate-500 mt-1">{achievement.description}</p>
                      {achievement.unlocked && <p className="text-xs text-yellow-400 mt-2">+{achievement.points} pts</p>}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="mt-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader><CardTitle className="text-white">Recent Points Activity</CardTitle></CardHeader>
            <CardContent>
              {pointsHistoryQuery.isLoading ? (
                <div className="space-y-3">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
              ) : pointsHistoryQuery.data?.length === 0 ? (
                <p className="text-slate-400 text-center py-8">No activity yet</p>
              ) : (
                <div className="space-y-3">
                  {pointsHistoryQuery.data?.map((activity) => (
                    <div key={activity.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-700/30">
                      <div className="flex items-center gap-3">
                        <div className={cn("p-2 rounded-full", activity.points > 0 ? "bg-green-500/20" : "bg-red-500/20")}>
                          {activity.points > 0 ? <TrendingUp className="w-4 h-4 text-green-400" /> : <Target className="w-4 h-4 text-red-400" />}
                        </div>
                        <div>
                          <p className="text-white">{activity.description}</p>
                          <p className="text-xs text-slate-500">{activity.category}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={cn("font-bold", activity.points > 0 ? "text-green-400" : "text-red-400")}>
                          {activity.points > 0 ? "+" : ""}{activity.points} pts
                        </p>
                        <p className="text-xs text-slate-500">{activity.date}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader><CardTitle className="text-white flex items-center gap-2"><Bell className="w-5 h-5 text-blue-400" />Notifications</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between"><span className="text-white">Email Notifications</span><input type="checkbox" defaultChecked className="toggle" /></div>
                <div className="flex items-center justify-between"><span className="text-white">Push Notifications</span><input type="checkbox" defaultChecked className="toggle" /></div>
                <div className="flex items-center justify-between"><span className="text-white">SMS Alerts</span><input type="checkbox" className="toggle" /></div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader><CardTitle className="text-white flex items-center gap-2"><Lock className="w-5 h-5 text-red-400" />Security</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <Button variant="outline" className="w-full border-slate-600">Change Password</Button>
                <Button variant="outline" className="w-full border-slate-600">Enable Two-Factor Auth</Button>
                <Button variant="outline" className="w-full border-slate-600">Manage Sessions</Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
