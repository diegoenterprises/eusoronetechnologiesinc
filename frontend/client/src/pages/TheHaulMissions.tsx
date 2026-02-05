/**
 * The Haul - Missions Page
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
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Target, Clock, CheckCircle, Star, Zap, ArrowLeft } from 'lucide-react';
import { Link } from 'wouter';

export default function TheHaulMissions() {
  const [filter, setFilter] = useState('active');

  const { data: missions, isLoading, refetch } = trpc.gamification.getMissions.useQuery({ 
    type: filter === 'active' ? 'daily' : filter === 'completed' ? 'weekly' : 'monthly'
  });
  const claimMutation = trpc.gamification.createMission.useMutation({
    onSuccess: () => refetch(),
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </div>
    );
  }

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
            <Target className="h-6 w-6 text-blue-500" />
            Missions
          </h1>
          <p className="text-muted-foreground">Complete missions to earn Haul Miles</p>
        </div>
      </div>

      <Tabs value={filter} onValueChange={setFilter}>
        <TabsList>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="expired">Expired</TabsTrigger>
        </TabsList>

        <TabsContent value={filter} className="mt-6">
          <div className="grid gap-4">
            {missions?.active?.map((mission: any) => (
              <Card key={mission.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-full ${
                        mission.type === 'daily' ? 'bg-blue-100' :
                        mission.type === 'weekly' ? 'bg-purple-100' :
                        'bg-yellow-100'
                      }`}>
                        {mission.type === 'daily' ? <Zap className="h-6 w-6 text-blue-600" /> :
                         mission.type === 'weekly' ? <Target className="h-6 w-6 text-purple-600" /> :
                         <Star className="h-6 w-6 text-yellow-600" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{mission.name}</h3>
                          <Badge variant={
                            mission.type === 'daily' ? 'default' :
                            mission.type === 'weekly' ? 'secondary' :
                            'outline'
                          }>
                            {mission.type}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{mission.description}</p>
                        <div className="mt-3 space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Progress</span>
                            <span>{mission.progress || 0}%</span>
                          </div>
                          <Progress value={mission.progress || 0} className="h-2" />
                        </div>
                        {mission.expiresAt && (
                          <div className="flex items-center gap-1 mt-2 text-sm text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            <span>Expires: {new Date(mission.expiresAt).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-yellow-500">+{mission.reward}</p>
                      <p className="text-xs text-muted-foreground">miles</p>
                      {mission.progress >= 100 && filter === 'active' && (
                        <Button 
                          size="sm" 
                          className="mt-2"
                          onClick={() => claimMutation.mutate({ code: String(mission.id), name: mission.name, type: mission.type, category: mission.category, targetValue: mission.targetValue, rewardXp: mission.rewardXp, rewardCoins: mission.rewardCoins } as any)}
                          disabled={claimMutation.isPending}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Claim
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {(!missions || (missions as any)?.active?.length === 0) && (
              <Card>
                <CardContent className="p-6 text-center text-muted-foreground">
                  No {filter} missions found
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
