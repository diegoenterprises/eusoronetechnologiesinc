/**
 * ADMIN RSS FEEDS MANAGEMENT PAGE
 * Manage RSS feed sources for the news feed module
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Rss, Plus, Trash2, RefreshCw, ExternalLink, Search,
  CheckCircle, XCircle, Globe, Fuel, Truck, Snowflake,
  FlaskConical, Ship, Zap, Wrench, AlertTriangle, BarChart3
} from "lucide-react";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  { value: "chemical", label: "Chemical Industry", icon: FlaskConical },
  { value: "oil_gas", label: "Oil & Gas", icon: Fuel },
  { value: "bulk", label: "Bulk Transport", icon: Truck },
  { value: "refrigerated", label: "Refrigerated/Cold Chain", icon: Snowflake },
  { value: "logistics", label: "Transportation & Logistics", icon: Truck },
  { value: "supply_chain", label: "Supply Chain", icon: Globe },
  { value: "hazmat", label: "Hazmat", icon: AlertTriangle },
  { value: "marine", label: "Marine/Shipping", icon: Ship },
  { value: "energy", label: "Energy", icon: Zap },
  { value: "equipment", label: "Equipment", icon: Wrench },
];

export default function AdminRSSFeeds() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newFeed, setNewFeed] = useState({ name: "", url: "", category: "logistics" });

  const utils = trpc.useUtils();
  const feedsQuery = (trpc as any).news.getFeedSources.useQuery();
  const statsQuery = (trpc as any).news.getFeedStats.useQuery();
  
  const addFeedMutation = (trpc as any).news.addFeedSource.useMutation({
    onSuccess: () => {
      toast.success("RSS feed added successfully");
      utils.news.getFeedSources.invalidate();
      utils.news.getFeedStats.invalidate();
      setIsAddDialogOpen(false);
      setNewFeed({ name: "", url: "", category: "logistics" });
    },
    onError: (err: any) => toast.error("Failed to add feed", { description: err.message }),
  });

  const deleteFeedMutation = (trpc as any).news.deleteFeedSource.useMutation({
    onSuccess: () => {
      toast.success("RSS feed deleted");
      utils.news.getFeedSources.invalidate();
      utils.news.getFeedStats.invalidate();
    },
    onError: (err: any) => toast.error("Failed to delete feed", { description: err.message }),
  });

  const toggleFeedMutation = (trpc as any).news.toggleFeedSource.useMutation({
    onSuccess: () => {
      utils.news.getFeedSources.invalidate();
    },
    onError: (err: any) => toast.error("Failed to toggle feed", { description: err.message }),
  });

  const refreshMutation = (trpc as any).news.refreshFeeds.useMutation({
    onSuccess: (data: any) => {
      toast.success(`Refreshed ${data.count} articles from RSS feeds`);
      utils.news.getFeedStats.invalidate();
    },
    onError: (err: any) => toast.error("Failed to refresh feeds", { description: err.message }),
  });

  const getCategoryInfo = (category: string) => {
    return CATEGORIES.find(c => c.value === category) || { label: category, icon: Rss };
  };

  const filteredFeeds = (feedsQuery.data as any)?.filter((feed: any) => {
    const matchesSearch = feed.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         feed.url.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === "all" || feed.category === filterCategory;
    return matchesSearch && matchesCategory;
  }) || [];

  const handleAddFeed = () => {
    if (!newFeed.name || !newFeed.url) {
      toast.error("Please fill in all fields");
      return;
    }
    addFeedMutation.mutate({
      name: newFeed.name,
      url: newFeed.url,
      category: newFeed.category as any,
      enabled: true,
    });
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Rss className="w-6 h-6 text-orange-400" />
            RSS Feed Management
          </h1>
          <p className="text-slate-400 text-sm">Manage news sources for the industry news feed</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => refreshMutation.mutate()}
            disabled={refreshMutation.isPending}
            className="border-slate-600"
          >
            <RefreshCw className={cn("w-4 h-4 mr-2", refreshMutation.isPending && "animate-spin")} />
            Refresh Feeds
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Add RSS Feed
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-800 border-slate-700">
              <DialogHeader>
                <DialogTitle className="text-white">Add New RSS Feed</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">Feed Name</Label>
                  <Input
                    value={newFeed.name}
                    onChange={(e: any) => setNewFeed({ ...newFeed, name: e.target.value })}
                    placeholder="e.g., FreightWaves"
                    className="bg-slate-700 border-slate-600"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">RSS Feed URL</Label>
                  <Input
                    value={newFeed.url}
                    onChange={(e: any) => setNewFeed({ ...newFeed, url: e.target.value })}
                    placeholder="https://example.com/rss"
                    className="bg-slate-700 border-slate-600"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Category</Label>
                  <Select value={newFeed.category} onValueChange={(v: any) => setNewFeed({ ...newFeed, category: v })}>
                    <SelectTrigger className="bg-slate-700 border-slate-600">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      {CATEGORIES.map((cat: any) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          <div className="flex items-center gap-2">
                            <cat.icon className="w-4 h-4" />
                            {cat.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline" className="border-slate-600">Cancel</Button>
                </DialogClose>
                <Button onClick={handleAddFeed} disabled={addFeedMutation.isPending} className="bg-blue-600">
                  {addFeedMutation.isPending ? "Adding..." : "Add Feed"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {statsQuery.isLoading ? (
          [1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24" />)
        ) : (
          <>
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm">Total Sources</p>
                    <p className="text-2xl font-bold text-white">{(statsQuery.data as any)?.totalSources || 0}</p>
                  </div>
                  <Rss className="w-8 h-8 text-orange-400" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm">Active Sources</p>
                    <p className="text-2xl font-bold text-green-400">{(statsQuery.data as any)?.enabledSources || 0}</p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-400" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm">Total Articles</p>
                    <p className="text-2xl font-bold text-blue-400">{(statsQuery.data as any)?.totalArticles || 0}</p>
                  </div>
                  <BarChart3 className="w-8 h-8 text-blue-400" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm">Last Updated</p>
                    <p className="text-sm font-medium text-white">
                      {(statsQuery.data as any)?.lastUpdated 
                        ? new Date(statsQuery.data.lastUpdated).toLocaleTimeString()
                        : "Never"}
                    </p>
                  </div>
                  <RefreshCw className="w-8 h-8 text-purple-400" />
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            value={searchTerm}
            onChange={(e: any) => setSearchTerm(e.target.value)}
            placeholder="Search feeds..."
            className="pl-9 bg-slate-700/50 border-slate-600"
          />
        </div>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-[200px] bg-slate-700/50 border-slate-600">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700">
            <SelectItem value="all">All Categories</SelectItem>
            {CATEGORIES.map((cat: any) => (
              <SelectItem key={cat.value} value={cat.value}>
                <div className="flex items-center gap-2">
                  <cat.icon className="w-4 h-4" />
                  {cat.label}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Feeds List */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">RSS Feed Sources ({filteredFeeds.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {feedsQuery.isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-16" />)}
            </div>
          ) : filteredFeeds.length === 0 ? (
            <div className="text-center py-12">
              <Rss className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">No RSS feeds found</p>
              <Button
                variant="outline"
                className="mt-4 border-slate-600"
                onClick={() => setIsAddDialogOpen(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Feed
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredFeeds.map((feed: any) => {
                const catInfo = getCategoryInfo(feed.category);
                const CatIcon = catInfo.icon;
                return (
                  <div
                    key={feed.id}
                    className={cn(
                      "flex items-center justify-between p-4 rounded-lg border transition-colors",
                      feed.enabled
                        ? "bg-slate-700/30 border-slate-600"
                        : "bg-slate-800/50 border-slate-700 opacity-60"
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center",
                        feed.enabled ? "bg-blue-500/20" : "bg-slate-600/20"
                      )}>
                        <CatIcon className={cn("w-5 h-5", feed.enabled ? "text-blue-400" : "text-slate-500")} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-white font-medium">{feed.name}</span>
                          <Badge variant="outline" className="text-xs border-slate-600">
                            {catInfo.label}
                          </Badge>
                          {feed.enabled ? (
                            <Badge className="bg-green-500/20 text-green-400 text-xs">Active</Badge>
                          ) : (
                            <Badge className="bg-slate-500/20 text-slate-400 text-xs">Disabled</Badge>
                          )}
                        </div>
                        <a
                          href={feed.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-slate-400 hover:text-blue-400 flex items-center gap-1"
                        >
                          {feed.url.slice(0, 50)}...
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={feed.enabled}
                        onCheckedChange={() => toggleFeedMutation.mutate({ id: feed.id })}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (confirm("Delete this RSS feed?")) {
                            deleteFeedMutation.mutate({ id: feed.id });
                          }
                        }}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
