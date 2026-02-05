/**
 * ZEUNRECALLDETAILS
 * Recall detail
 * 100% Dynamic - No mock data - tRPC powered
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import {
  Activity, AlertTriangle, CheckCircle, Clock, Eye, Settings,
  Users, Building, Package, DollarSign, TrendingUp, FileText,
  Calendar, MapPin, Truck, Shield, Plus, Search, Filter,
  Download, Upload, RefreshCw, MoreHorizontal, ChevronRight,
  Edit, Trash2, Save, X, Check, Info, Bell, Star
} from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";

export default function ZeunRecallDetails() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [isLoading, setIsLoading] = useState(false);

  // tRPC Query - 100% Dynamic Data
  const dataQuery = (trpc as any).maintenance.getRecallDetails.useQuery();
  const data = dataQuery.data;

  // tRPC Mutations
  const createMutation = (trpc as any).maintenance.create.useMutation({
    onSuccess: () => {
      toast.success("Created successfully!");
      dataQuery.refetch();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create");
    },
  });

  const updateMutation = (trpc as any).maintenance.update.useMutation({
    onSuccess: () => {
      toast.success("Updated successfully!");
      dataQuery.refetch();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update");
    },
  });

  const deleteMutation = (trpc as any).maintenance.delete.useMutation({
    onSuccess: () => {
      toast.success("Deleted successfully!");
      dataQuery.refetch();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete");
    },
  });

  // Loading State with Skeleton
  if (dataQuery.isLoading) {
    return (
      <div className="p-4 md:p-6 space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i: any) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  // Error State
  if (dataQuery.error) {
    return (
      <div className="p-4 md:p-6">
        <Card className="bg-red-500/10 border-red-500/30 rounded-xl">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">Failed to Load Data</h3>
            <p className="text-slate-400 mb-4">{dataQuery.error.message}</p>
            <Button 
              onClick={() => dataQuery.refetch()} 
              className="bg-red-600 hover:bg-red-700"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const items = Array.isArray(data) ? data : (data as any)?.items || (data as any)?.data || [];
  const stats = (data as any)?.stats || {};

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with Gradient Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
            Recall Details
          </h1>
          <p className="text-slate-400 text-sm mt-1">Recall detail</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            className="bg-slate-800/50 border-slate-700/50 rounded-lg"
            onClick={() => dataQuery.refetch()}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button 
            variant="outline" 
            className="bg-slate-800/50 border-slate-700/50 rounded-lg"
          >
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
          <Button 
            className="bg-gradient-to-r from-orange-600 to-red-600 rounded-lg"
            onClick={() => toast.info("Create new item")}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add New
          </Button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-500/20">
                <Activity className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-400">
                  {stats.total || items.length || 0}
                </p>
                <p className="text-xs text-slate-400">Total Items</p>
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
                <p className="text-2xl font-bold text-green-400">
                  {stats.active || items.filter((i: any) => i.status === 'active' || i.status === 'completed').length || 0}
                </p>
                <p className="text-xs text-slate-400">Active</p>
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
                <p className="text-2xl font-bold text-yellow-400">
                  {stats.pending || items.filter((i: any) => i.status === 'pending').length || 0}
                </p>
                <p className="text-xs text-slate-400">Pending</p>
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
                <p className="text-2xl font-bold text-purple-400">
                  {stats.growth || stats.trend || '--'}
                </p>
                <p className="text-xs text-slate-400">This Period</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-500" />
        <input
          type="text"
          placeholder="Search recall details..."
          value={searchQuery}
          onChange={(e: any) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-orange-500/50"
        />
      </div>

      {/* Main Content Card */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white text-lg">Recall Details</CardTitle>
            <div className="flex gap-2">
              <Button 
                size="sm" 
                variant="ghost" 
                className="text-slate-400 hover:text-white"
              >
                <Download className="w-4 h-4 mr-1" />
                Export
              </Button>
              <Button 
                size="sm" 
                variant="ghost" 
                className="text-slate-400 hover:text-white"
                onClick={() => dataQuery.refetch()}
              >
                <RefreshCw className="w-4 h-4 mr-1" />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <div className="text-center py-12">
              <div className="p-4 rounded-full bg-slate-700/50 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Package className="w-8 h-8 text-slate-500" />
              </div>
              <p className="text-slate-400">No items found</p>
              <p className="text-slate-500 text-sm mt-1">Get started by adding your first item</p>
              <Button 
                className="mt-4 bg-gradient-to-r from-orange-600 to-red-600 rounded-lg"
                onClick={() => toast.info("Create first item")}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add First Item
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {items
                .filter((item: any) => {
                  if (!searchQuery) return true;
                  const search = searchQuery.toLowerCase();
                  return (
                    item.name?.toLowerCase().includes(search) ||
                    item.title?.toLowerCase().includes(search) ||
                    item.description?.toLowerCase().includes(search) ||
                    item.id?.toString().includes(search)
                  );
                })
                .map((item: any, idx: number) => (
                  <div
                    key={item.id || idx}
                    className="flex items-center justify-between p-4 rounded-xl bg-slate-700/30 border border-slate-600/30 hover:border-slate-500/50 transition-colors cursor-pointer"
                    onClick={() => setLocation(`/maintenance/${item.id}`)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 rounded-full bg-orange-500/20">
                        <Activity className="w-5 h-5 text-orange-400" />
                      </div>
                      <div>
                        <p className="text-white font-medium">
                          {item.name || item.title || `Item #${item.id || idx + 1}`}
                        </p>
                        <p className="text-xs text-slate-500">
                          {item.description || item.subtitle || item.createdAt || 'No description'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge
                        className={`border-0 ${
                          item.status === 'active' || item.status === 'completed'
                            ? 'bg-green-500/20 text-green-400'
                            : item.status === 'pending'
                            ? 'bg-yellow-500/20 text-yellow-400'
                            : item.status === 'error' || item.status === 'failed'
                            ? 'bg-red-500/20 text-red-400'
                            : 'bg-slate-500/20 text-slate-400'
                        }`}
                      >
                        {item.status || 'Active'}
                      </Badge>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-slate-400 hover:text-white"
                        onClick={(e: any) => {
                          e.stopPropagation();
                          setLocation(`/maintenance/${item.id}`);
                        }}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-slate-400 hover:text-white"
                        onClick={(e: any) => {
                          e.stopPropagation();
                          toast.info("More options");
                        }}
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
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
