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
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  Ticket, Search, Plus, MessageSquare, Clock,
  CheckCircle, AlertTriangle, Send
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function SupportTickets() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [showNew, setShowNew] = useState(false);
  const [newTicket, setNewTicket] = useState({ subject: "", message: "", priority: "medium" });

  const ticketsQuery = (trpc as any).support.getTickets.useQuery({ search, status });
  const statsQuery = (trpc as any).support.getTicketStats.useQuery();

  const createMutation = (trpc as any).support.createTicket.useMutation({
    onSuccess: () => { toast.success("Ticket created"); setShowNew(false); setNewTicket({ subject: "", message: "", priority: "medium" }); ticketsQuery.refetch(); statsQuery.refetch(); },
    onError: (error: any) => toast.error("Failed", { description: error.message }),
  });

  const stats = statsQuery.data;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open": return <Badge className="bg-yellow-500/20 text-yellow-400 border-0"><Clock className="w-3 h-3 mr-1" />Open</Badge>;
      case "in_progress": return <Badge className="bg-cyan-500/20 text-cyan-400 border-0">In Progress</Badge>;
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
      default: return <Badge className="bg-slate-500/20 text-slate-400 border-0">{priority}</Badge>;
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">Support Tickets</h1>
          <p className="text-slate-400 text-sm mt-1">Get help with your issues</p>
        </div>
        <Button className="bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 rounded-lg" onClick={() => setShowNew(true)}>
          <Plus className="w-4 h-4 mr-2" />New Ticket
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-cyan-500/20"><Ticket className="w-6 h-6 text-cyan-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-cyan-400">{stats?.total || 0}</p>}<p className="text-xs text-slate-400">Total</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-yellow-500/20"><Clock className="w-6 h-6 text-yellow-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-yellow-400">{stats?.open || 0}</p>}<p className="text-xs text-slate-400">Open</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-purple-500/20"><MessageSquare className="w-6 h-6 text-purple-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-purple-400">{stats?.inProgress || 0}</p>}<p className="text-xs text-slate-400">In Progress</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/20"><CheckCircle className="w-6 h-6 text-green-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-green-400">{stats?.resolved || 0}</p>}<p className="text-xs text-slate-400">Resolved</p></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {showNew && (
        <Card className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border-cyan-500/30 rounded-xl">
          <CardHeader className="pb-3"><CardTitle className="text-white text-lg flex items-center gap-2"><Plus className="w-5 h-5 text-cyan-400" />New Ticket</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div><label className="text-sm text-slate-400 mb-1 block">Subject</label><Input value={newTicket.subject} onChange={(e: any) => setNewTicket(prev => ({ ...prev, subject: e.target.value }))} placeholder="Brief description of your issue" className="bg-slate-700/50 border-slate-600/50 rounded-lg" /></div>
            <div><label className="text-sm text-slate-400 mb-1 block">Priority</label>
              <Select value={newTicket.priority} onValueChange={(v: any) => setNewTicket(prev => ({ ...prev, priority: v }))}>
                <SelectTrigger className="bg-slate-700/50 border-slate-600/50 rounded-lg"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="low">Low</SelectItem><SelectItem value="medium">Medium</SelectItem><SelectItem value="high">High</SelectItem></SelectContent>
              </Select>
            </div>
            <div><label className="text-sm text-slate-400 mb-1 block">Message</label><Textarea value={newTicket.message} onChange={(e: any) => setNewTicket(prev => ({ ...prev, message: e.target.value }))} placeholder="Describe your issue in detail" className="bg-slate-700/50 border-slate-600/50 rounded-lg min-h-[100px]" /></div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" className="bg-slate-700/50 border-slate-600/50 rounded-lg" onClick={() => setShowNew(false)}>Cancel</Button>
              <Button className="bg-gradient-to-r from-cyan-600 to-emerald-600 rounded-lg" onClick={() => createMutation.mutate(newTicket)} disabled={!newTicket.subject || !newTicket.message}><Send className="w-4 h-4 mr-2" />Submit</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><Input value={search} onChange={(e: any) => setSearch(e.target.value)} placeholder="Search tickets..." className="pl-9 bg-slate-800/50 border-slate-700/50 rounded-lg" /></div>
        <Select value={status} onValueChange={setStatus}><SelectTrigger className="w-[150px] bg-slate-800/50 border-slate-700/50 rounded-lg"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Status</SelectItem><SelectItem value="open">Open</SelectItem><SelectItem value="in_progress">In Progress</SelectItem><SelectItem value="resolved">Resolved</SelectItem></SelectContent></Select>
      </div>

      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3"><CardTitle className="text-white text-lg flex items-center gap-2"><Ticket className="w-5 h-5 text-cyan-400" />My Tickets</CardTitle></CardHeader>
        <CardContent className="p-0">
          {ticketsQuery.isLoading ? (
            <div className="p-4 space-y-3">{[1, 2, 3].map((i: any) => <Skeleton key={i} className="h-20 w-full rounded-lg" />)}</div>
          ) : (ticketsQuery.data as any)?.length === 0 ? (
            <div className="text-center py-16"><Ticket className="w-10 h-10 text-slate-500 mx-auto mb-3" /><p className="text-slate-400">No tickets found</p></div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {(ticketsQuery.data as any)?.map((ticket: any) => (
                <div key={ticket.id} className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2"><p className="text-white font-bold">#{ticket.id}</p>{getStatusBadge(ticket.status)}{getPriorityBadge(ticket.priority)}</div>
                    <p className="text-xs text-slate-500">{ticket.createdAt}</p>
                  </div>
                  <p className="text-white mb-1">{ticket.subject}</p>
                  <p className="text-sm text-slate-400 line-clamp-2">{ticket.message}</p>
                  {ticket.lastReply && <p className="text-xs text-slate-500 mt-2">Last reply: {ticket.lastReply}</p>}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
