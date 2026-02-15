/**
 * NEWS FEED PAGE — REAL-TIME RSS AGGREGATION
 * Polls cacheStatus every 15s, auto-refetches articles on generation change.
 * Shows live indicator, last-updated timestamp, and feed health.
 */

import React, { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  Newspaper, Clock, Share2, Bookmark, BookmarkCheck, Search, ExternalLink,
  TrendingUp, AlertTriangle, Truck, DollarSign, Shield, Fuel,
  Snowflake, FlaskConical, Ship, Zap, RefreshCw, Radio, Wifi,
  WifiOff, Activity, Landmark, BookOpen, Lock
} from "lucide-react";
import { getApprovalStatus, pathRequiresApproval } from "@/lib/approvalGating";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

const CATEGORIES = [
  { value: "all", label: "All News", icon: Newspaper },
  { value: "trucking", label: "Trucking", icon: Truck },
  { value: "logistics", label: "Logistics", icon: Truck },
  { value: "oil_gas", label: "Oil & Gas", icon: Fuel },
  { value: "chemical", label: "Chemical", icon: FlaskConical },
  { value: "refrigerated", label: "Cold Chain", icon: Snowflake },
  { value: "bulk", label: "Bulk", icon: Truck },
  { value: "hazmat", label: "Hazmat", icon: AlertTriangle },
  { value: "marine", label: "Marine", icon: Ship },
  { value: "energy", label: "Energy", icon: Zap },
  { value: "supply_chain", label: "Supply Chain", icon: TrendingUp },
  { value: "government", label: "Government", icon: Landmark },
  { value: "saved", label: "Saved", icon: BookOpen },
];

const getCategoryColor = (category: string) => {
  const map: Record<string, string> = {
    trucking: "bg-indigo-500/20 text-indigo-400",
    logistics: "bg-blue-500/20 text-blue-400",
    oil_gas: "bg-orange-500/20 text-orange-400",
    chemical: "bg-purple-500/20 text-purple-400",
    refrigerated: "bg-cyan-500/20 text-cyan-400",
    bulk: "bg-amber-500/20 text-amber-400",
    hazmat: "bg-red-500/20 text-red-400",
    marine: "bg-teal-500/20 text-teal-400",
    supply_chain: "bg-green-500/20 text-green-400",
    energy: "bg-yellow-500/20 text-yellow-400",
    equipment: "bg-slate-500/20 text-slate-400",
    government: "bg-rose-500/20 text-rose-400",
  };
  return map[category] || "bg-slate-500/20 text-slate-400";
};

const getCategoryIcon = (category: string) => {
  const cat = CATEGORIES.find((c) => c.value === category);
  return cat?.icon || Newspaper;
};

const formatDate = (dateStr: string) => {
  try { return formatDistanceToNow(new Date(dateStr), { addSuffix: true }); }
  catch { return dateStr; }
};

function QuickLinksNav() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const role = user?.role || "SHIPPER";

  const ROLE_LINKS: Record<string, { label: string; icon: typeof Shield; path: string }[]> = {
    SHIPPER: [
      { label: "Create Load", icon: Truck, path: "/loads/create" },
      { label: "My Loads", icon: Truck, path: "/my-loads" },
      { label: "Market Pricing", icon: DollarSign, path: "/market-pricing" },
      { label: "Hot Zones", icon: TrendingUp, path: "/hot-zones" },
    ],
    CATALYST: [
      { label: "FMCSA Updates", icon: Shield, path: "/catalyst-compliance" },
      { label: "Load Board", icon: Truck, path: "/load-board" },
      { label: "Fuel Prices", icon: DollarSign, path: "/market-pricing" },
      { label: "Hot Zones", icon: TrendingUp, path: "/hot-zones" },
    ],
    BROKER: [
      { label: "Load Board", icon: Truck, path: "/load-board" },
      { label: "Market Pricing", icon: DollarSign, path: "/market-pricing" },
      { label: "Hot Zones", icon: TrendingUp, path: "/hot-zones" },
      { label: "Catalysts", icon: Truck, path: "/catalysts" },
    ],
    DRIVER: [
      { label: "My Jobs", icon: Truck, path: "/jobs" },
      { label: "Fuel Prices", icon: DollarSign, path: "/market-pricing" },
      { label: "Weather Alerts", icon: AlertTriangle, path: "/hot-zones" },
      { label: "Documents", icon: Shield, path: "/documents" },
    ],
    DISPATCH: [
      { label: "Matched Loads", icon: Truck, path: "/matched-loads" },
      { label: "Market Pricing", icon: DollarSign, path: "/market-pricing" },
      { label: "Hot Zones", icon: TrendingUp, path: "/hot-zones" },
      { label: "Performance", icon: TrendingUp, path: "/performance" },
    ],
    ESCORT: [
      { label: "Convoys", icon: Truck, path: "/convoys" },
      { label: "Hot Zones", icon: TrendingUp, path: "/hot-zones" },
      { label: "Weather Alerts", icon: AlertTriangle, path: "/hot-zones" },
      { label: "Incidents", icon: Shield, path: "/incidents" },
    ],
    TERMINAL_MANAGER: [
      { label: "Facility", icon: Truck, path: "/facility" },
      { label: "Compliance", icon: Shield, path: "/compliance" },
      { label: "Market Pricing", icon: DollarSign, path: "/market-pricing" },
      { label: "Operations", icon: TrendingUp, path: "/operations" },
    ],
    ADMIN: [
      { label: "User Management", icon: Shield, path: "/admin/users" },
      { label: "Market Pricing", icon: DollarSign, path: "/market-pricing" },
      { label: "Hot Zones", icon: TrendingUp, path: "/hot-zones" },
      { label: "Analytics", icon: TrendingUp, path: "/admin/analytics" },
    ],
    SUPER_ADMIN: [
      { label: "System Monitor", icon: Shield, path: "/super-admin/monitoring" },
      { label: "User Management", icon: Shield, path: "/super-admin/users" },
      { label: "Hot Zones", icon: TrendingUp, path: "/hot-zones" },
      { label: "Analytics", icon: TrendingUp, path: "/admin/analytics" },
    ],
  };

  const links = ROLE_LINKS[role] || ROLE_LINKS.SHIPPER;
  const approvalStatus = getApprovalStatus(user);
  const isApproved = approvalStatus === "approved";

  return (
    <div className="space-y-1">
      {links.map((link, idx) => {
        const locked = !isApproved && pathRequiresApproval(link.path);
        return (
          <Button
            key={idx}
            variant="ghost"
            size="sm"
            className={cn(
              "w-full justify-start h-8",
              locked ? "text-slate-600 cursor-not-allowed" : "text-slate-400 hover:text-white"
            )}
            onClick={() => { if (!locked) navigate(link.path); }}
            disabled={locked}
          >
            {locked ? <Lock className="w-3.5 h-3.5 mr-2 text-slate-600" /> : <link.icon className="w-3.5 h-3.5 mr-2" />}
            {link.label}
          </Button>
        );
      })}
    </div>
  );
}

export default function NewsFeed() {
  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const lastGenRef = useRef(0);
  const [newArticlesBanner, setNewArticlesBanner] = useState(false);

  // ---- Bookmark state ----
  const savedIdsQuery = (trpc as any).news.getSavedArticleIds.useQuery(undefined, { staleTime: 10_000 });
  const savedArticlesQuery = (trpc as any).news.getSavedArticles.useQuery(undefined, { enabled: activeTab === "saved", staleTime: 10_000 });
  const saveMutation = (trpc as any).news.saveArticle.useMutation({
    onSuccess: () => { savedIdsQuery.refetch(); savedArticlesQuery.refetch(); },
  });
  const unsaveMutation = (trpc as any).news.unsaveArticle.useMutation({
    onSuccess: () => { savedIdsQuery.refetch(); savedArticlesQuery.refetch(); },
  });
  const savedIds = new Set<string>((savedIdsQuery.data as any)?.ids || []);
  const toggleBookmark = (articleId: string) => {
    if (savedIds.has(articleId)) unsaveMutation.mutate({ articleId });
    else saveMutation.mutate({ articleId });
  };

  // ---- Cheap poll: cacheStatus every 15s (tiny payload) ----
  const statusQuery = (trpc as any).news.cacheStatus.useQuery(undefined, {
    refetchInterval: 15_000,
    refetchIntervalInBackground: true,
    staleTime: 0,
  });

  // ---- Full articles query ----
  const newsQuery = (trpc as any).news.getArticles.useQuery(
    {
      category: activeTab !== "all" ? activeTab : undefined,
      search: searchTerm || undefined,
      limit: 50,
    },
    {
      staleTime: 30_000,
      refetchOnWindowFocus: true,
      keepPreviousData: true,
    }
  );

  // ---- When generation changes, refetch articles ----
  useEffect(() => {
    const gen = statusQuery.data?.generation;
    if (gen != null && gen !== lastGenRef.current) {
      if (lastGenRef.current > 0) {
        setNewArticlesBanner(true);
        setTimeout(() => setNewArticlesBanner(false), 5000);
      }
      lastGenRef.current = gen;
      newsQuery.refetch();
    }
  }, [statusQuery.data?.generation]);

  const trendingQuery = (trpc as any).news.getTrending.useQuery(undefined, {
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
  const refreshMutation = (trpc as any).news.refreshFeeds.useMutation({
    onSuccess: () => {
      newsQuery.refetch();
      statusQuery.refetch();
    },
  });

  const status = statusQuery.data;
  const rawArticles = activeTab === "saved"
    ? (savedArticlesQuery.data as any)?.articles || []
    : (newsQuery.data as any)?.articles || newsQuery.data || [];
  const articlesArray = Array.isArray(rawArticles) ? rawArticles : [];
  const total = activeTab === "saved" ? articlesArray.length : (newsQuery.data as any)?.total ?? articlesArray.length;

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            Industry News
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
            </span>
          </h1>
          <p className="text-slate-400 text-sm flex items-center gap-2 mt-0.5">
            <Radio className="w-3 h-3" />
            Real-time feeds from 200+ sources
            {status && (
              <>
                <span className="text-slate-600">|</span>
                <span className="text-slate-500">{status.articleCount} articles</span>
                <span className="text-slate-600">|</span>
                {status.isFetching ? (
                  <span className="text-blue-400 flex items-center gap-1"><RefreshCw className="w-3 h-3 animate-spin" />Refreshing...</span>
                ) : status.lastUpdated ? (
                  <span className="text-slate-500">Updated {formatDate(status.lastUpdated)}</span>
                ) : null}
                <span className="text-slate-600">|</span>
                <span className="flex items-center gap-1">
                  <Wifi className="w-3 h-3 bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent" />{status.healthyFeeds}
                  {status.unhealthyFeeds > 0 && (
                    <><WifiOff className="w-3 h-3 text-red-400 ml-1" />{status.unhealthyFeeds}</>
                  )}
                </span>
              </>
            )}
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => refreshMutation.mutate()}
          disabled={refreshMutation.isPending}
          className="border-slate-600"
        >
          <RefreshCw className={cn("w-4 h-4 mr-2", refreshMutation.isPending && "animate-spin")} />
          {refreshMutation.isPending ? "Refreshing..." : "Force Refresh"}
        </Button>
      </div>

      {/* New articles banner */}
      {newArticlesBanner && (
        <div className="bg-gradient-to-r from-blue-600/20 to-cyan-600/20 border border-blue-500/30 rounded-lg px-4 py-2.5 flex items-center gap-2 animate-in slide-in-from-top">
          <Activity className="w-4 h-4 text-blue-400" />
          <span className="text-sm text-blue-300 font-medium">New articles just arrived</span>
          <span className="text-xs text-slate-500 ml-auto">Auto-updated</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              value={searchTerm}
              onChange={(e: any) => setSearchTerm(e.target.value)}
              placeholder="Search news..."
              className="pl-9 bg-slate-700/50 border-slate-600"
            />
          </div>

          {/* Category tabs */}
          <div className="flex flex-wrap gap-1.5 p-1 bg-slate-800 border border-slate-700 rounded-lg">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                type="button"
                onClick={() => setActiveTab(cat.value)}
                className={cn(
                  "flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                  activeTab === cat.value
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-white hover:bg-slate-700"
                )}
              >
                <cat.icon className="w-3 h-3" />
                {cat.label}
              </button>
            ))}
          </div>

          {/* Articles */}
          {newsQuery.isLoading && !newsQuery.data ? (
            <div className="space-y-4">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-32 w-full" />)}</div>
          ) : articlesArray.length === 0 ? (
            <div className="text-center py-12">
              <Newspaper className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">{total === 0 && !status?.articleCount ? "Loading feeds..." : "No articles found for this filter"}</p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-slate-600">{total} article{total !== 1 ? "s" : ""}</p>
              {articlesArray.map((article: any) => {
                const CategoryIcon = getCategoryIcon(article.category);
                return (
                  <Card key={article.id} className="bg-slate-800/50 border-slate-700 hover:border-slate-600 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex gap-4">
                        {article.imageUrl && (
                          <div className="w-28 h-20 rounded-lg bg-slate-700 flex-shrink-0 overflow-hidden">
                            <img src={article.imageUrl} alt="" className="w-full h-full object-cover" onError={(e: any) => (e.currentTarget.style.display = "none")} />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                            <Badge className={cn("text-[10px]", getCategoryColor(article.category))}>
                              <CategoryIcon className="w-3 h-3 mr-1" />{article.category.replace("_", " ")}
                            </Badge>
                            <span className="text-[11px] text-slate-500 flex items-center gap-1">
                              <Clock className="w-3 h-3" />{formatDate(article.publishedAt)}
                            </span>
                          </div>
                          <a href={article.link} target="_blank" rel="noopener noreferrer" className="block group">
                            <h3 className="text-white font-medium mb-1 line-clamp-2 group-hover:text-blue-400 transition-colors text-sm">{article.title}</h3>
                          </a>
                          <p className="text-xs text-slate-400 line-clamp-2">{article.summary}</p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-[11px] text-slate-500">{article.source}</span>
                            <div className="flex items-center gap-1">
                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" asChild>
                                <a href={article.link} target="_blank" rel="noopener noreferrer"><ExternalLink className="w-3.5 h-3.5" /></a>
                              </Button>
                              <Button variant="ghost" size="sm" className={cn("h-7 w-7 p-0", savedIds.has(article.id) && "text-yellow-400")} onClick={() => toggleBookmark(article.id)}>
                                {savedIds.has(article.id) ? <BookmarkCheck className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
                              </Button>
                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0"><Share2 className="w-3.5 h-3.5" /></Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Live Status */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Activity className="w-4 h-4 text-green-400" />
                <span className="text-sm font-medium text-white">Live Feed Status</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-700/40 rounded-lg p-2.5 text-center">
                  <p className="text-lg font-bold text-white">{status?.articleCount ?? "..."}</p>
                  <p className="text-[10px] text-slate-500 uppercase">Articles</p>
                </div>
                <div className="bg-slate-700/40 rounded-lg p-2.5 text-center">
                  <p className="text-lg font-bold text-white">{status?.healthyFeeds ?? "..."}</p>
                  <p className="text-[10px] text-slate-500 uppercase">Live Feeds</p>
                </div>
                <div className="bg-slate-700/40 rounded-lg p-2.5 text-center">
                  <p className="text-lg font-bold text-white">{status?.generation ?? 0}</p>
                  <p className="text-[10px] text-slate-500 uppercase">Refreshes</p>
                </div>
                <div className="bg-slate-700/40 rounded-lg p-2.5 text-center">
                  <p className="text-lg font-bold text-red-400">{status?.unhealthyFeeds ?? 0}</p>
                  <p className="text-[10px] text-slate-500 uppercase">Down</p>
                </div>
              </div>
              {status?.lastUpdated && (
                <p className="text-[10px] text-slate-600 text-center mt-2">Last refresh: {formatDate(status.lastUpdated)}</p>
              )}
            </CardContent>
          </Card>

          {/* Trending */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-white flex items-center gap-2 text-base">
                <TrendingUp className="w-4 h-4 text-orange-400" />Trending
              </CardTitle>
            </CardHeader>
            <CardContent>
              {trendingQuery.isLoading ? (
                <div className="space-y-3">{[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
              ) : !(trendingQuery.data as any)?.length ? (
                <p className="text-slate-400 text-center py-4 text-sm">Loading trending...</p>
              ) : (
                <div className="space-y-2">
                  {(trendingQuery.data as any)?.map((article: any, idx: number) => (
                    <a key={article.id} href={article.link} target="_blank" rel="noopener noreferrer"
                      className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-slate-700/30 transition-colors group">
                      <span className="text-xl font-bold text-slate-600 shrink-0 w-6 text-right">{idx + 1}</span>
                      <div className="min-w-0">
                        <p className="text-white text-xs line-clamp-2 group-hover:text-blue-400 transition-colors">{article.title}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">{article.source}</p>
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Links */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-white text-base">Quick Links</CardTitle>
            </CardHeader>
            <CardContent>
              <QuickLinksNav />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
