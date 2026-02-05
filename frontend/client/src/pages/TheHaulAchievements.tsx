/**
 * The Haul - Achievements
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
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Award, Lock, CheckCircle, ArrowLeft, Star } from 'lucide-react';
import { Link } from 'wouter';

export default function TheHaulAchievements() {
  const [filter, setFilter] = useState('all');

  const { data: achievements, isLoading } = trpc.gamification.getAchievements.useQuery({ 
    category: filter !== 'all' ? filter as "safety" | "performance" | "milestones" | "special" : undefined 
  });

  const allAchievements = [...(achievements?.earned || []), ...(achievements?.locked || [])];
  const unlockedCount = achievements?.earned?.length || 0;
  const totalCount = allAchievements.length || 0;

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-24" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(9)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
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
            <Award className="h-6 w-6 text-purple-500" />
            Achievements
          </h1>
          <p className="text-muted-foreground">Track your accomplishments</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-muted-foreground">Overall Progress</p>
              <p className="text-2xl font-bold">{unlockedCount} / {totalCount}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Completion</p>
              <p className="text-2xl font-bold text-purple-500">
                {totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0}%
              </p>
            </div>
          </div>
          <Progress value={totalCount > 0 ? (unlockedCount / totalCount) * 100 : 0} className="h-3" />
        </CardContent>
      </Card>

      <Tabs value={filter} onValueChange={setFilter}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="loads">Loads</TabsTrigger>
          <TabsTrigger value="miles">Miles</TabsTrigger>
          <TabsTrigger value="safety">Safety</TabsTrigger>
          <TabsTrigger value="social">Social</TabsTrigger>
          <TabsTrigger value="special">Special</TabsTrigger>
        </TabsList>

        <TabsContent value={filter} className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {allAchievements?.map((achievement: any) => (
              <Card 
                key={achievement.id} 
                className={`transition-all ${
                  achievement.unlocked 
                    ? 'border-purple-200 bg-purple-50/50' 
                    : 'opacity-60 grayscale'
                }`}
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-full ${
                      achievement.unlocked ? 'bg-purple-100' : 'bg-gray-100'
                    }`}>
                      {achievement.unlocked ? (
                        <Award className="h-6 w-6 text-purple-600" />
                      ) : (
                        <Lock className="h-6 w-6 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{achievement.name}</h3>
                        {achievement.rarity && (
                          <Badge variant={
                            achievement.rarity === 'legendary' ? 'default' :
                            achievement.rarity === 'epic' ? 'secondary' :
                            achievement.rarity === 'rare' ? 'outline' :
                            'outline'
                          } className="text-xs">
                            {achievement.rarity}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{achievement.description}</p>
                      
                      {achievement.unlocked ? (
                        <div className="flex items-center gap-1 mt-3 text-sm text-green-600">
                          <CheckCircle className="h-4 w-4" />
                          <span>Unlocked {achievement.unlockedAt ? new Date(achievement.unlockedAt).toLocaleDateString() : ''}</span>
                        </div>
                      ) : achievement.progress !== undefined ? (
                        <div className="mt-3 space-y-1">
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Progress</span>
                            <span>{achievement.progress}%</span>
                          </div>
                          <Progress value={achievement.progress} className="h-2" />
                        </div>
                      ) : null}

                      <div className="flex items-center gap-1 mt-2 text-sm">
                        <Star className="h-4 w-4 text-yellow-500" />
                        <span className="font-medium text-yellow-600">+{achievement.reward || 0} miles</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {(!achievements || (achievements as any).length === 0) && (
              <Card className="col-span-full">
                <CardContent className="p-6 text-center text-muted-foreground">
                  No achievements found in this category
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
