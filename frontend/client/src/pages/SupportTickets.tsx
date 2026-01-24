/**
 * SUPPORT TICKETS PAGE
 * 100% Dynamic - No mock data
 * UI Style: Gradient headers, stat cards with icons, rounded cards
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  Ticket, Search, Plus, Clock, CheckCircle,
  AlertCircle, MessageSquare, Eye
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";

export default function SupportTickets() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const ticketsQuery = trpc.support.getTickets.useQuery({ status: statusFilter === "all" ? undefined : statusFilter, limit: 50 });
  const summaryQuery = trpc.support.getSummary.useQuery();

  const summary = summaryQuery.data;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open": return <Badge className="bg-blue-500/20 text-blue-400 border-0"><AlertCircle className="w-3 h-3 mr-1" />Open</Badge>;
      case "in_progress": return <Badge className="bg-yellow-500/20 text-yellow-400 border-0"><Clock className="w-3 h-3 mr-1" />In Progress</Badge>;
      case "resolved": return <Badge className="bg-green-500/20 text-green-400 border-0"><CheckCircle className="w-3 h-3 mr-1" />Resolved</Badge>;
      case "closed": return <Badge className="bg-slate-500/20 text-slate-400 border-0">Closed</Badge>;
      default: return <Badge className="bg-slate-500/20 text-slate-400 border-0">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high": return <Badge className="bg-red-500/20 text-red-400 border-0">High</Badge>;
      case "medium": return <Badge className="bg-yellow-500/20 text-yellow-400 border-0">Medium</Badge>;
      case "low": return <Badge className="bg-green-500/20 text-green-400 border-0">Low</Badge>;
      default: return null;
    }
  };

  const filteredTickets = ticketsQuery.data?.filter((ticket: any) =>
    !searchTerm || ticket.subject?.toLowerCase().includes(searchTerm.toLowerCase()) || ticket.ticketNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with Gradient Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            Support Tickets
          </h1>
          <p className="text-slate-400 text-sm mt-1">Track and manage your support requests</p>
        </div>
        <Button className="bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 rounded-lg">
          <Plus className="w-4 h-4 mr-2" />New Ticket
        </Button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-500/20">
                <Ticket className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-blue-400">{summary?.total || 0}</p>
                )}
                <p className="text-xs text-slate-400">Total Tickets</p>
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
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-yellow-400">{summary?.open || 0}</p>
                )}
                <p className="text-xs text-slate-400">Open</p>
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
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-green-400">{summary?.resolved || 0}</p>
                )}
                <p className="text-xs text-slate-400">Resolved</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-purple-500/20">
                <Clock className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-purple-400">{summary?.avgResponseTime}</p>
                )}
                <p className="text-xs text-slate-400">Avg Response</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search tickets..." className="pl-9 bg-slate-800/50 border-slate-700/50 rounded-lg" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px] bg-slate-800/50 border-slate-700/50 rounded-lg">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tickets List */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardContent className="p-0">
          {ticketsQuery.isLoading ? (
            <div className="p-4 space-y-3">{[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}</div>
          ) : filteredTickets?.length === 0 ? (
            <div className="text-center py-16">
              <div className="p-4 rounded-full bg-slate-700/50 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <Ticket className="w-10 h-10 text-slate-500" />
              </div>
              <p className="text-slate-400 text-lg">No tickets found</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {filteredTickets?.map((ticket: any) => (
                <div key={ticket.id} className={cn("p-4 hover:bg-slate-700/20 transition-colors cursor-pointer", ticket.status === "open" && "bg-blue-500/5 border-l-2 border-blue-500")} onClick={() => setLocation(`/support/tickets/${ticket.id}`)}>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-white font-medium">{ticket.subject}</p>
                        {getStatusBadge(ticket.status)}
                        {getPriorityBadge(ticket.priority)}
                      </div>
                      <p className="text-sm text-slate-400">#{ticket.ticketNumber}</p>
                    </div>
                    <Button size="sm" variant="ghost" className="text-slate-400 hover:text-white">
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <span>Created: {ticket.createdAt}</span>
                    <span>Last updated: {ticket.updatedAt}</span>
                    <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" />{ticket.repliesCount} replies</span>
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
