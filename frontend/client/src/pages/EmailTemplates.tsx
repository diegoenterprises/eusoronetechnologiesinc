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
  Mail, Search, CheckCircle, Edit, Plus, Eye
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function EmailTemplates() {
  const [search, setSearch] = useState("");

  const templatesQuery = (trpc as any).admin.getEmailTemplates.useQuery({ search });
  const statsQuery = (trpc as any).admin.getEmailTemplateStats.useQuery();

  const stats = statsQuery.data;

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case "transactional": return <Badge className="bg-blue-500/20 text-blue-400 border-0">Transactional</Badge>;
      case "notification": return <Badge className="bg-purple-500/20 text-purple-400 border-0">Notification</Badge>;
      case "marketing": return <Badge className="bg-green-500/20 text-green-400 border-0">Marketing</Badge>;
      case "system": return <Badge className="bg-cyan-500/20 text-cyan-400 border-0">System</Badge>;
      default: return <Badge className="bg-slate-500/20 text-slate-400 border-0">{category}</Badge>;
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">Email Templates</h1>
          <p className="text-slate-400 text-sm mt-1">Manage email templates</p>
        </div>
        <Button className="bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 rounded-lg">
          <Plus className="w-4 h-4 mr-2" />New Template
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-cyan-500/20"><Mail className="w-6 h-6 text-cyan-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-cyan-400">{stats?.total || 0}</p>}<p className="text-xs text-slate-400">Templates</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/20"><CheckCircle className="w-6 h-6 text-green-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-green-400">{stats?.active || 0}</p>}<p className="text-xs text-slate-400">Active</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-purple-500/20"><Mail className="w-6 h-6 text-purple-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-16" /> : <p className="text-2xl font-bold text-purple-400">{stats?.sentThisMonth?.toLocaleString()}</p>}<p className="text-xs text-slate-400">Sent</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-yellow-500/20"><Mail className="w-6 h-6 text-yellow-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-yellow-400">{stats?.categories || 0}</p>}<p className="text-xs text-slate-400">Categories</p></div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input value={search} onChange={(e: any) => setSearch(e.target.value)} placeholder="Search templates..." className="pl-9 bg-slate-800/50 border-slate-700/50 rounded-lg" />
      </div>

      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3"><CardTitle className="text-white text-lg flex items-center gap-2"><Mail className="w-5 h-5 text-cyan-400" />Templates</CardTitle></CardHeader>
        <CardContent className="p-0">
          {templatesQuery.isLoading ? (
            <div className="p-4 space-y-3">{[1, 2, 3, 4].map((i: any) => <Skeleton key={i} className="h-20 w-full rounded-lg" />)}</div>
          ) : (templatesQuery.data as any)?.length === 0 ? (
            <div className="text-center py-16"><Mail className="w-10 h-10 text-slate-500 mx-auto mb-3" /><p className="text-slate-400">No templates found</p></div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {(templatesQuery.data as any)?.map((template: any) => (
                <div key={template.id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-cyan-500/20">
                      <Mail className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-white font-bold">{template.name}</p>
                        {getCategoryBadge(template.category)}
                        {template.active && <Badge className="bg-green-500/20 text-green-400 border-0"><CheckCircle className="w-3 h-3 mr-1" />Active</Badge>}
                      </div>
                      <p className="text-sm text-slate-400">{template.subject}</p>
                      <div className="flex items-center gap-4 text-xs text-slate-500 mt-1">
                        <span>Last updated: {template.updatedDate}</span>
                        <span>Sent: {template.sentCount?.toLocaleString()} times</span>
                        <span>Open rate: {template.openRate}%</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" className="bg-slate-700/50 border-slate-600/50 rounded-lg">
                      <Eye className="w-4 h-4 mr-1" />Preview
                    </Button>
                    <Button size="sm" variant="outline" className="bg-slate-700/50 border-slate-600/50 rounded-lg">
                      <Edit className="w-4 h-4 mr-1" />Edit
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
