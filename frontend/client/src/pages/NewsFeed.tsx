/**
 * NEWS FEED PAGE
 * Industry news and platform updates
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Newspaper, Search, Clock, User, ChevronRight, 
  TrendingUp, AlertTriangle, Truck, Shield, DollarSign,
  ExternalLink, BookOpen, Bell
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  category: "industry" | "regulatory" | "safety" | "market" | "platform";
  source: string;
  date: string;
  readTime: string;
  imageUrl?: string;
  featured?: boolean;
}

const MOCK_NEWS: NewsArticle[] = [
  {
    id: "n1", title: "FMCSA Announces New HOS Rule Changes for 2026",
    summary: "The Federal Motor Carrier Safety Administration has released updated hours of service regulations affecting hazmat carriers. Key changes include modified rest requirements and electronic logging mandates.",
    category: "regulatory", source: "FMCSA", date: "Jan 23, 2026", readTime: "5 min",
    featured: true
  },
  {
    id: "n2", title: "Fuel Prices Rise 3% Amid Global Supply Concerns",
    summary: "Diesel and gasoline prices continue to climb as global supply chain disruptions impact refinery output. Carriers advised to factor increased costs into rate calculations.",
    category: "market", source: "EIA", date: "Jan 22, 2026", readTime: "3 min"
  },
  {
    id: "n3", title: "New Safety Technology Mandates for Tanker Trailers",
    summary: "DOT announces mandatory rollover protection systems for all MC-306 and MC-407 tanker trailers by 2027. Early adoption incentives available.",
    category: "safety", source: "DOT", date: "Jan 21, 2026", readTime: "4 min"
  },
  {
    id: "n4", title: "EusoTrip Launches AI-Powered Load Matching",
    summary: "Our new ESANG AI™ feature now provides intelligent load recommendations based on your equipment, location, and historical preferences.",
    category: "platform", source: "EusoTrip", date: "Jan 20, 2026", readTime: "2 min"
  },
  {
    id: "n5", title: "Texas Implements New Hazmat Transport Permits",
    summary: "Effective February 1st, Texas requires additional permits for transporting Class 3 flammable liquids through designated urban corridors.",
    category: "regulatory", source: "TxDMV", date: "Jan 19, 2026", readTime: "4 min"
  },
  {
    id: "n6", title: "Industry Report: Q4 2025 Freight Volume Analysis",
    summary: "Hazmat freight volumes increased 8% year-over-year with petroleum products leading growth. Full market analysis and 2026 projections inside.",
    category: "industry", source: "FreightWaves", date: "Jan 18, 2026", readTime: "7 min"
  },
];

const CATEGORY_COLORS: Record<string, string> = {
  industry: "bg-blue-500/20 text-blue-400",
  regulatory: "bg-purple-500/20 text-purple-400",
  safety: "bg-red-500/20 text-red-400",
  market: "bg-green-500/20 text-green-400",
  platform: "bg-cyan-500/20 text-cyan-400",
};

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  industry: <TrendingUp className="w-3 h-3" />,
  regulatory: <Shield className="w-3 h-3" />,
  safety: <AlertTriangle className="w-3 h-3" />,
  market: <DollarSign className="w-3 h-3" />,
  platform: <Truck className="w-3 h-3" />,
};

export default function NewsFeed() {
  const [news] = useState<NewsArticle[]>(MOCK_NEWS);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const filteredNews = news.filter(article => {
    const matchesSearch = !searchTerm ||
      article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.summary.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "all" || article.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const featuredArticle = news.find(a => a.featured);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">News Feed</h1>
          <p className="text-slate-400">Industry updates and regulatory news</p>
        </div>
        <Button variant="outline" className="border-slate-600">
          <Bell className="w-4 h-4 mr-2" />
          Subscribe
        </Button>
      </div>

      {/* Featured Article */}
      {featuredArticle && (
        <Card className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 border-blue-500/30 overflow-hidden">
          <CardContent className="p-6">
            <Badge className="bg-yellow-500/20 text-yellow-400 mb-3">Featured</Badge>
            <h2 className="text-xl font-bold text-white mb-2">{featuredArticle.title}</h2>
            <p className="text-slate-300 mb-4">{featuredArticle.summary}</p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-sm text-slate-400">
                <span className="flex items-center gap-1">
                  <User className="w-4 h-4" />
                  {featuredArticle.source}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {featuredArticle.date}
                </span>
                <span className="flex items-center gap-1">
                  <BookOpen className="w-4 h-4" />
                  {featuredArticle.readTime} read
                </span>
              </div>
              <Button className="bg-blue-600 hover:bg-blue-700">
                Read More <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search & Filter */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search news..."
            className="pl-9 bg-slate-700/50 border-slate-600 text-white"
          />
        </div>
        
        <div className="flex gap-2">
          {["all", "industry", "regulatory", "safety", "market", "platform"].map((cat) => (
            <Button
              key={cat}
              size="sm"
              variant={categoryFilter === cat ? "default" : "outline"}
              onClick={() => setCategoryFilter(cat)}
              className={cn(
                categoryFilter === cat ? "bg-blue-600" : "border-slate-600 text-slate-400"
              )}
            >
              {cat === "all" ? "All" : cat.charAt(0).toUpperCase() + cat.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {/* News Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredNews.filter(a => !a.featured).map((article) => (
          <Card key={article.id} className="bg-slate-800/50 border-slate-700 hover:border-slate-600 transition-all cursor-pointer group">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <Badge className={cn("text-xs", CATEGORY_COLORS[article.category])}>
                  {CATEGORY_ICONS[article.category]}
                  <span className="ml-1">{article.category}</span>
                </Badge>
              </div>

              <h3 className="text-white font-medium mb-2 group-hover:text-blue-400 transition-colors line-clamp-2">
                {article.title}
              </h3>

              <p className="text-sm text-slate-400 mb-4 line-clamp-3">
                {article.summary}
              </p>

              <div className="flex items-center justify-between text-xs text-slate-500">
                <div className="flex items-center gap-3">
                  <span>{article.source}</span>
                  <span>{article.date}</span>
                </div>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {article.readTime}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredNews.length === 0 && (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="py-12 text-center">
            <Newspaper className="w-12 h-12 text-slate-500 mx-auto mb-4" />
            <p className="text-slate-400">No news articles found</p>
          </CardContent>
        </Card>
      )}

      {/* Load More */}
      <div className="text-center">
        <Button variant="outline" className="border-slate-600">
          Load More Articles
        </Button>
      </div>
    </div>
  );
}
