/**
 * BROKER DASHBOARD PAGE
 * 100% Dynamic - No mock data
 * UI Style: Gradient headers, stat cards with icons, rounded cards
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  Package, Users, DollarSign, TrendingUp, ArrowRight,
  MapPin, Truck, Clock, CheckCircle
} from "lucide-react";
import { useLocation } from "wouter";

export default function BrokerDashboard() {
  const [, setLocation] = useLocation();

  const summaryQuery = trpc.broker.getSummary.useQuery();
  const shipperLoadsQuery = trpc.broker.getShipperLoads.useQuery({ limit: 5 });
  const carrierCapacityQuery = trpc.broker.getCarrierCapacity.useQuery({ limit: 5 });

  const summary = summaryQuery.data;
  const isLoading = summaryQuery.isLoading;

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with Gradient Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            Broker Dashboard
          </h1>
          <p className="text-slate-400 text-sm mt-1">Match shippers with carriers efficiently</p>
        </div>
        <Button className="bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 rounded-lg" onClick={() => setLocation("/loads/match")}>
          <Users className="w-4 h-4 mr-2" />Match Loads
        </Button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-500/20">
                <Package className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                {isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-blue-400">{summary?.activeLoads || 0}</p>
                )}
                <p className="text-xs text-slate-400">Active Loads</p>
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
                {isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-yellow-400">{summary?.pendingMatches || 0}</p>
                )}
                <p className="text-xs text-slate-400">Pending Matches</p>
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
                {isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-purple-400">{summary?.weeklyVolume || 0}</p>
                )}
                <p className="text-xs text-slate-400">Weekly Volume</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/20">
                <DollarSign className="w-6 h-6 text-green-400" />
              </div>
              <div>
                {isLoading ? <Skeleton className="h-8 w-16" /> : (
                  <p className="text-2xl font-bold text-green-400">${(summary?.commissionEarned || 0).toLocaleString()}</p>
                )}
                <p className="text-xs text-slate-400">Commission</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-cyan-500/20">
                <CheckCircle className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                {isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-cyan-400">{summary?.marginAverage || 0}%</p>
                )}
                <p className="text-xs text-slate-400">Avg Margin</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Shipper Loads */}
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-white text-lg">Shipper Loads</CardTitle>
              <Button variant="ghost" size="sm" className="text-cyan-400 hover:text-cyan-300" onClick={() => setLocation("/shipper-loads")}>
                View All <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {shipperLoadsQuery.isLoading ? (
              <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}</div>
            ) : shipperLoadsQuery.data?.length === 0 ? (
              <div className="text-center py-8">
                <div className="p-4 rounded-full bg-slate-700/50 w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                  <Package className="w-8 h-8 text-slate-500" />
                </div>
                <p className="text-slate-400">No shipper loads available</p>
              </div>
            ) : (
              <div className="space-y-3">
                {shipperLoadsQuery.data?.map((load: any) => (
                  <div key={load.id} className="p-4 rounded-xl bg-slate-700/30 hover:bg-slate-700/50 transition-colors cursor-pointer" onClick={() => setLocation(`/loads/${load.id}`)}>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-white font-medium">{load.loadNumber}</p>
                      <p className="text-green-400 font-bold">${load.rate?.toLocaleString()}</p>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                      <MapPin className="w-3 h-3 text-green-400" />
                      <span>{load.origin?.city}</span>
                      <ArrowRight className="w-3 h-3" />
                      <MapPin className="w-3 h-3 text-red-400" />
                      <span>{load.destination?.city}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Carrier Capacity */}
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-white text-lg">Carrier Capacity</CardTitle>
              <Button variant="ghost" size="sm" className="text-cyan-400 hover:text-cyan-300" onClick={() => setLocation("/carriers")}>
                View All <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {carrierCapacityQuery.isLoading ? (
              <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div>
            ) : carrierCapacityQuery.data?.length === 0 ? (
              <div className="text-center py-8">
                <div className="p-4 rounded-full bg-slate-700/50 w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                  <Truck className="w-8 h-8 text-slate-500" />
                </div>
                <p className="text-slate-400">No carrier capacity available</p>
              </div>
            ) : (
              <div className="space-y-3">
                {carrierCapacityQuery.data?.map((carrier: any) => (
                  <div key={carrier.id} className="p-4 rounded-xl bg-slate-700/30 hover:bg-slate-700/50 transition-colors cursor-pointer">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-blue-500/20">
                          <Truck className="w-4 h-4 text-blue-400" />
                        </div>
                        <div>
                          <p className="text-white font-medium">{carrier.name}</p>
                          <p className="text-xs text-slate-500">{carrier.equipmentType} • {carrier.availableDate}</p>
                        </div>
                      </div>
                      <Badge className="bg-green-500/20 text-green-400 border-0">Available</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Button variant="outline" className="h-20 flex-col bg-slate-800/50 border-slate-700/50 hover:bg-slate-700/50 rounded-xl" onClick={() => setLocation("/loads/match")}>
          <Users className="w-6 h-6 mb-2 text-cyan-400" />
          <span className="text-slate-300">Match Loads</span>
        </Button>
        <Button variant="outline" className="h-20 flex-col bg-slate-800/50 border-slate-700/50 hover:bg-slate-700/50 rounded-xl" onClick={() => setLocation("/carriers")}>
          <Truck className="w-6 h-6 mb-2 text-blue-400" />
          <span className="text-slate-300">Carriers</span>
        </Button>
        <Button variant="outline" className="h-20 flex-col bg-slate-800/50 border-slate-700/50 hover:bg-slate-700/50 rounded-xl" onClick={() => setLocation("/shippers")}>
          <Package className="w-6 h-6 mb-2 text-purple-400" />
          <span className="text-slate-300">Shippers</span>
        </Button>
        <Button variant="outline" className="h-20 flex-col bg-slate-800/50 border-slate-700/50 hover:bg-slate-700/50 rounded-xl" onClick={() => setLocation("/commission")}>
          <DollarSign className="w-6 h-6 mb-2 text-green-400" />
          <span className="text-slate-300">Commission</span>
        </Button>
      </div>
    </div>
  );
}
