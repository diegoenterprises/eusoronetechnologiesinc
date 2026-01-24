/**
 * HELP CENTER PAGE
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
  HelpCircle, Search, Book, MessageCircle, FileText,
  ChevronRight, ExternalLink, Phone
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function HelpCenter() {
  const [searchTerm, setSearchTerm] = useState("");

  const categoriesQuery = trpc.support.getHelpCategories.useQuery();
  const articlesQuery = trpc.support.getPopularArticles.useQuery({ limit: 10 });
  const faqQuery = trpc.support.getFAQs.useQuery({ limit: 8 });

  const filteredArticles = articlesQuery.data?.filter((article: any) =>
    !searchTerm || article.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with Gradient Title */}
      <div className="text-center">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
          Help Center
        </h1>
        <p className="text-slate-400 text-sm mt-1">Find answers and get support</p>
      </div>

      {/* Search */}
      <Card className="bg-gradient-to-r from-cyan-500/10 to-emerald-500/10 border-cyan-500/30 rounded-xl">
        <CardContent className="p-6">
          <div className="relative max-w-2xl mx-auto">
            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search for help articles..."
              className="pl-12 py-6 text-lg bg-slate-800/50 border-slate-600/50 rounded-xl focus:border-cyan-500/50"
            />
          </div>
        </CardContent>
      </Card>

      {/* Categories */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {categoriesQuery.isLoading ? (
          [1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-32 w-full rounded-xl" />)
        ) : (
          categoriesQuery.data?.map((category: any) => (
            <Card key={category.id} className="bg-slate-800/50 border-slate-700/50 rounded-xl hover:bg-slate-700/50 cursor-pointer transition-colors">
              <CardContent className="p-5 text-center">
                <div className={cn("p-3 rounded-full mx-auto w-fit mb-3", category.color === "blue" ? "bg-blue-500/20" : category.color === "green" ? "bg-green-500/20" : category.color === "purple" ? "bg-purple-500/20" : "bg-cyan-500/20")}>
                  <Book className={cn("w-6 h-6", category.color === "blue" ? "text-blue-400" : category.color === "green" ? "text-green-400" : category.color === "purple" ? "text-purple-400" : "text-cyan-400")} />
                </div>
                <p className="text-white font-medium">{category.name}</p>
                <p className="text-xs text-slate-500 mt-1">{category.articleCount} articles</p>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Popular Articles */}
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <FileText className="w-5 h-5 text-cyan-400" />
              Popular Articles
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {articlesQuery.isLoading ? (
              <div className="p-4 space-y-3">{[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-12 w-full rounded-xl" />)}</div>
            ) : filteredArticles?.length === 0 ? (
              <p className="text-slate-400 text-center py-8">No articles found</p>
            ) : (
              <div className="divide-y divide-slate-700/50">
                {filteredArticles?.map((article: any) => (
                  <div key={article.id} className="p-4 hover:bg-slate-700/20 transition-colors cursor-pointer flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium">{article.title}</p>
                      <p className="text-sm text-slate-400">{article.category}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-500" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* FAQs */}
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-purple-400" />
              Frequently Asked Questions
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {faqQuery.isLoading ? (
              <div className="p-4 space-y-3">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div>
            ) : (
              <div className="divide-y divide-slate-700/50">
                {faqQuery.data?.map((faq: any) => (
                  <div key={faq.id} className="p-4 hover:bg-slate-700/20 transition-colors cursor-pointer">
                    <p className="text-white font-medium mb-1">{faq.question}</p>
                    <p className="text-sm text-slate-400 line-clamp-2">{faq.answer}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Contact Support */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-emerald-500/20">
                <MessageCircle className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <p className="text-white font-medium">Need more help?</p>
                <p className="text-sm text-slate-400">Our support team is available 24/7</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="bg-slate-700/50 border-slate-600/50 hover:bg-slate-700 rounded-lg">
                <Phone className="w-4 h-4 mr-2" />Call Support
              </Button>
              <Button className="bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 rounded-lg">
                <MessageCircle className="w-4 h-4 mr-2" />Start Chat
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
