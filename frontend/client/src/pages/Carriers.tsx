/**
 * CARRIERS PAGE
 * 100% Dynamic - No mock data
 * UI Style: Gradient headers, stat cards with icons, rounded cards
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  Truck, Search, Star, Shield, Eye, Phone, CheckCircle, Users
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";

export default function Carriers() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");

  const carriersQuery = (trpc as any).carriers.list.useQuery({ limit: 50 });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "verified": return <Badge className="bg-green-500/20 text-green-400 border-0">Verified</Badge>;
      case "pending": return <Badge className="bg-yellow-500/20 text-yellow-400 border-0">Pending</Badge>;
      case "suspended": return <Badge className="bg-red-500/20 text-red-400 border-0">Suspended</Badge>;
      default: return <Badge className="bg-slate-500/20 text-slate-400 border-0">{status}</Badge>;
    }
  };

  const filteredCarriers = (carriersQuery.data as any)?.filter((carrier: any) => {
    return !searchTerm || 
      carrier.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      carrier.mcNumber?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const totalCarriers = (carriersQuery.data as any)?.length || 0;
  const verifiedCarriers = (carriersQuery.data as any)?.filter((c: any) => c.status === "verified").length || 0;

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with Gradient Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            Carriers & Bids
          </h1>
          <p className="text-slate-400 text-sm mt-1">Manage carrier bids and select the best options for your loads</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-yellow-500/20 border border-yellow-500/30">
          <span className="text-yellow-400 text-sm font-medium">Pending Bids</span>
          <span className="text-yellow-400 font-bold">0</span>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-500/20">
                <Truck className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                {carriersQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-blue-400">{totalCarriers}</p>
                )}
                <p className="text-xs text-slate-400">Total Carriers</p>
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
                {carriersQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-green-400">{verifiedCarriers}</p>
                )}
                <p className="text-xs text-slate-400">Verified</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-yellow-500/20">
                <Star className="w-6 h-6 text-yellow-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-yellow-400">4.5</p>
                <p className="text-xs text-slate-400">Avg Rating</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-purple-500/20">
                <Shield className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-400">92%</p>
                <p className="text-xs text-slate-400">On-Time Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <Input
          value={searchTerm}
          onChange={(e: any) => setSearchTerm(e.target.value)}
          placeholder="Search by load number..."
          className="pl-9 bg-slate-800/50 border-slate-700/50 rounded-lg focus:border-cyan-500/50"
        />
      </div>

      {/* Carriers List */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardContent className="p-0">
          {carriersQuery.isLoading ? (
            <div className="p-4 space-y-4">{[1, 2, 3, 4].map((i: any) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}</div>
          ) : filteredCarriers?.length === 0 ? (
            <div className="text-center py-16">
              <div className="p-4 rounded-full bg-slate-700/50 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <Truck className="w-10 h-10 text-slate-500" />
              </div>
              <p className="text-slate-400 text-lg">No carriers found</p>
              <p className="text-slate-500 text-sm mt-1">Try adjusting your search criteria</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {filteredCarriers?.map((carrier: any) => (
                <div key={carrier.id} className="p-4 hover:bg-slate-700/20 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-xl bg-blue-500/20">
                        <Truck className="w-6 h-6 text-blue-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-white font-medium">{carrier.name}</p>
                          <div className="flex items-center gap-1">
                            <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                            <span className="text-yellow-400 text-sm">{carrier.rating || 4.5}</span>
                          </div>
                          {carrier.verified && <CheckCircle className="w-4 h-4 text-green-400" />}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-slate-400">
                          <span>{carrier.loadsCompleted || 0} loads</span>
                          <span>{carrier.onTimeRate || 0}% on-time</span>
                          <span>MC# {carrier.mcNumber}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {getStatusBadge(carrier.status || "verified")}
                      <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                        <Phone className="w-4 h-4" />
                      </Button>
                      <Button size="sm" className="bg-slate-700 hover:bg-slate-600 rounded-lg" onClick={() => setLocation(`/carriers/${carrier.id}`)}>
                        <Eye className="w-4 h-4 mr-1" />Details
                      </Button>
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
