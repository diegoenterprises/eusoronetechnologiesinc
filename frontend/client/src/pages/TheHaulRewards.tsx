/**
 * The Haul - Rewards Store
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
import { Gift, Star, ArrowLeft, ShoppingCart, Check } from 'lucide-react';
import { Link } from 'wouter';
import { toast } from 'sonner';

export default function TheHaulRewards() {
  const [category, setCategory] = useState('all');

  const { data: profile } = trpc.gamification.getProfile.useQuery({});
  const { data: rewards, isLoading, refetch } = trpc.gamification.getLeaderboard.useQuery({});
  const redeemMutation = trpc.gamification.redeemReward.useMutation({
    onSuccess: () => {
      toast.success('Reward redeemed successfully!');
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to redeem reward');
    },
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/the-haul">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Gift className="h-6 w-6 text-purple-500" />
              Rewards Store
            </h1>
            <p className="text-muted-foreground">Redeem your Haul Miles for rewards</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">Your Balance</p>
          <p className="text-2xl font-bold text-yellow-500">{profile?.currentMiles?.toLocaleString() || 0} miles</p>
        </div>
      </div>

      <Tabs value={category} onValueChange={setCategory}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="gift_cards">Gift Cards</TabsTrigger>
          <TabsTrigger value="merchandise">Merchandise</TabsTrigger>
          <TabsTrigger value="upgrades">Upgrades</TabsTrigger>
          <TabsTrigger value="donations">Donations</TabsTrigger>
        </TabsList>

        <TabsContent value={category} className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {((rewards as any)?.leaders || []).map((reward: any) => {
              const canAfford = (profile?.currentMiles || 0) >= reward.cost;
              return (
                <Card key={reward.id} className={!canAfford ? 'opacity-60' : ''}>
                  <CardContent className="p-6">
                    <div className="text-center">
                      <div className="w-16 h-16 mx-auto rounded-full bg-purple-100 flex items-center justify-center mb-4">
                        <Gift className="h-8 w-8 text-purple-600" />
                      </div>
                      <h3 className="font-semibold">{reward.name}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{reward.description}</p>
                      <div className="flex items-center justify-center gap-1 mt-4">
                        <Star className="h-4 w-4 text-yellow-500" />
                        <span className="font-bold text-yellow-500">{reward.cost?.toLocaleString()}</span>
                        <span className="text-sm text-muted-foreground">miles</span>
                      </div>
                      {reward.stock !== undefined && (
                        <Badge variant="outline" className="mt-2">
                          {reward.stock} left
                        </Badge>
                      )}
                      <Button 
                        className="w-full mt-4"
                        disabled={!canAfford || redeemMutation.isPending}
                        onClick={() => redeemMutation.mutate({ rewardId: reward.id })}
                      >
                        {canAfford ? (
                          <>
                            <ShoppingCart className="h-4 w-4 mr-2" />
                            Redeem
                          </>
                        ) : (
                          'Not enough miles'
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            {(!rewards || ((rewards as any)?.leaders || []).length === 0) && (
              <Card className="col-span-full">
                <CardContent className="p-6 text-center text-muted-foreground">
                  No rewards available in this category
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
