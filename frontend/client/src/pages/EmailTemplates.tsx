/**
 * EMAIL TEMPLATES PAGE
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
  Mail, Search, Plus, Edit, Eye, Copy,
  CheckCircle, Send
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function EmailTemplates() {
  const [searchTerm, setSearchTerm] = useState("");

  const templatesQuery = trpc.emailTemplates.list.useQuery({ limit: 50 });
  const categoriesQuery = trpc.emailTemplates.getCategories.useQuery();

  const duplicateMutation = trpc.emailTemplates.duplicate.useMutation({
    onSuccess: () => { toast.success("Template duplicated"); templatesQuery.refetch(); },
    onError: (error) => toast.error("Failed to duplicate", { description: error.message }),
  });

  const testMutation = trpc.emailTemplates.sendTest.useMutation({
    onSuccess: () => toast.success("Test email sent"),
    onError: (error) => toast.error("Failed to send test", { description: error.message }),
  });

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case "transactional": return <Badge className="bg-blue-500/20 text-blue-400 border-0">Transactional</Badge>;
      case "notification": return <Badge className="bg-purple-500/20 text-purple-400 border-0">Notification</Badge>;
      case "marketing": return <Badge className="bg-green-500/20 text-green-400 border-0">Marketing</Badge>;
      case "system": return <Badge className="bg-orange-500/20 text-orange-400 border-0">System</Badge>;
      default: return <Badge className="bg-slate-500/20 text-slate-400 border-0">{category}</Badge>;
    }
  };

  const filteredTemplates = templatesQuery.data?.filter((template: any) =>
    !searchTerm || template.name?.toLowerCase().includes(searchTerm.toLowerCase()) || template.subject?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with Gradient Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            Email Templates
          </h1>
          <p className="text-slate-400 text-sm mt-1">Manage email templates and notifications</p>
        </div>
        <Button className="bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 rounded-lg">
          <Plus className="w-4 h-4 mr-2" />New Template
        </Button>
      </div>

      {/* Categories */}
      <div className="flex flex-wrap gap-3">
        {categoriesQuery.isLoading ? (
          [1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-10 w-32 rounded-lg" />)
        ) : (
          categoriesQuery.data?.map((cat: any) => (
            <Button key={cat.value} variant="outline" className={cn("bg-slate-700/50 border-slate-600/50 hover:bg-slate-700 rounded-lg", cat.active && "bg-cyan-500/20 border-cyan-500/50")}>
              {cat.label} ({cat.count})
            </Button>
          ))
        )}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <Input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search templates..." className="pl-9 bg-slate-800/50 border-slate-700/50 rounded-lg" />
      </div>

      {/* Templates Grid */}
      {templatesQuery.isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => <Skeleton key={i} className="h-48 w-full rounded-xl" />)}
        </div>
      ) : filteredTemplates?.length === 0 ? (
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="py-16">
            <div className="text-center">
              <div className="p-4 rounded-full bg-slate-700/50 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <Mail className="w-10 h-10 text-slate-500" />
              </div>
              <p className="text-slate-400 text-lg">No templates found</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTemplates?.map((template: any) => (
            <Card key={template.id} className="bg-slate-800/50 border-slate-700/50 rounded-xl hover:border-slate-600/50 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="p-2 rounded-lg bg-cyan-500/20">
                    <Mail className="w-5 h-5 text-cyan-400" />
                  </div>
                  {getCategoryBadge(template.category)}
                </div>
                <p className="text-white font-medium mb-1">{template.name}</p>
                <p className="text-sm text-slate-400 mb-3 line-clamp-2">{template.subject}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-xs text-slate-500">
                    {template.active && <CheckCircle className="w-3 h-3 text-green-400" />}
                    <span>{template.active ? "Active" : "Inactive"}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button size="sm" variant="ghost" className="text-slate-400 hover:text-white h-8 w-8 p-0" onClick={() => testMutation.mutate({ id: template.id })}>
                      <Send className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="ghost" className="text-slate-400 hover:text-white h-8 w-8 p-0">
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="ghost" className="text-slate-400 hover:text-white h-8 w-8 p-0">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="ghost" className="text-slate-400 hover:text-white h-8 w-8 p-0" onClick={() => duplicateMutation.mutate({ id: template.id })}>
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
