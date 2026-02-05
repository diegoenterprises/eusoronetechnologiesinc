/**
 * SUPPORT PAGE
 * 100% Dynamic - No mock data
 * UI Style: Gradient headers, stat cards with icons, rounded cards
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  HelpCircle, MessageSquare, Phone, Mail, Clock,
  CheckCircle, Plus, Send, Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function Support() {
  const [activeTab, setActiveTab] = useState("tickets");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const ticketsQuery = (trpc as any).support.getTickets.useQuery();
  const summaryQuery = (trpc as any).support.getSummary.useQuery();

  const createTicketMutation = (trpc as any).support.createTicket.useMutation({
    onSuccess: () => { toast.success("Ticket created"); setSubject(""); setMessage(""); ticketsQuery.refetch(); summaryQuery.refetch(); },
    onError: (error: any) => toast.error("Failed", { description: error.message }),
  });

  const summary = summaryQuery.data;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "resolved": return <Badge className="bg-green-500/20 text-green-400 border-0">Resolved</Badge>;
      case "open": return <Badge className="bg-yellow-500/20 text-yellow-400 border-0">Open</Badge>;
      case "in_progress": return <Badge className="bg-blue-500/20 text-blue-400 border-0">In Progress</Badge>;
      default: return <Badge className="bg-slate-500/20 text-slate-400 border-0">{status}</Badge>;
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with Gradient Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            Support Center
          </h1>
          <p className="text-slate-400 text-sm mt-1">Get help and manage support tickets</p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-500/20">
                <MessageSquare className="w-6 h-6 text-blue-400" />
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
              <div className="p-3 rounded-full bg-cyan-500/20">
                <HelpCircle className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-cyan-400">{summary?.inProgress || 0}</p>
                )}
                <p className="text-xs text-slate-400">In Progress</p>
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
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-1">
          <TabsTrigger value="tickets" className="data-[state=active]:bg-slate-700 rounded-md">My Tickets</TabsTrigger>
          <TabsTrigger value="new" className="data-[state=active]:bg-slate-700 rounded-md">New Ticket</TabsTrigger>
          <TabsTrigger value="contact" className="data-[state=active]:bg-slate-700 rounded-md">Contact Us</TabsTrigger>
        </TabsList>

        <TabsContent value="tickets" className="mt-6">
          <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
            <CardContent className="p-0">
              {ticketsQuery.isLoading ? (
                <div className="p-4 space-y-3">{[1, 2, 3].map((i: any) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}</div>
              ) : (ticketsQuery.data as any)?.length === 0 ? (
                <div className="text-center py-16">
                  <div className="p-4 rounded-full bg-slate-700/50 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                    <MessageSquare className="w-10 h-10 text-slate-500" />
                  </div>
                  <p className="text-slate-400 text-lg">No support tickets</p>
                  <p className="text-slate-500 text-sm mt-1">Create a ticket if you need help</p>
                  <Button className="mt-4 bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 rounded-lg" onClick={() => setActiveTab("new")}>
                    <Plus className="w-4 h-4 mr-2" />Create Ticket
                  </Button>
                </div>
              ) : (
                <div className="divide-y divide-slate-700/50">
                  {(ticketsQuery.data as any)?.map((ticket: any) => (
                    <div key={ticket.id} className="p-4 hover:bg-slate-700/20 transition-colors">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-white font-medium">{ticket.subject}</p>
                            {getStatusBadge(ticket.status)}
                          </div>
                          <p className="text-sm text-slate-400 line-clamp-1">{ticket.message}</p>
                          <p className="text-xs text-slate-500 mt-1">Created: {ticket.createdAt}</p>
                        </div>
                        <Button size="sm" className="bg-slate-700 hover:bg-slate-600 rounded-lg">View</Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="new" className="mt-6">
          <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-lg flex items-center gap-2">
                <Plus className="w-5 h-5 text-cyan-400" />Create New Ticket
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-slate-400 text-sm">Subject</label>
                  <Input value={subject} onChange={(e: any) => setSubject(e.target.value)} placeholder="Brief description of your issue" className="bg-slate-700/30 border-slate-600/50 rounded-lg focus:border-cyan-500/50" />
                </div>
                <div className="space-y-2">
                  <label className="text-slate-400 text-sm">Message</label>
                  <Textarea value={message} onChange={(e: any) => setMessage(e.target.value)} placeholder="Describe your issue in detail..." className="bg-slate-700/30 border-slate-600/50 rounded-lg focus:border-cyan-500/50 min-h-[150px]" />
                </div>
                <Button className="w-full bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 rounded-lg" onClick={() => createTicketMutation.mutate({ subject, message })} disabled={createTicketMutation.isPending || !subject || !message}>
                  {createTicketMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                  Submit Ticket
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contact" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 rounded-full bg-blue-500/20">
                    <Phone className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-white font-medium">Phone Support</p>
                    <p className="text-slate-400 text-sm">Available 24/7</p>
                  </div>
                </div>
                <p className="text-cyan-400 font-bold text-xl">1-800-EUSOTRIP</p>
                <p className="text-slate-500 text-sm mt-2">For urgent issues, call us directly</p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 rounded-full bg-green-500/20">
                    <Mail className="w-6 h-6 text-green-400" />
                  </div>
                  <div>
                    <p className="text-white font-medium">Email Support</p>
                    <p className="text-slate-400 text-sm">Response within 24 hours</p>
                  </div>
                </div>
                <p className="text-cyan-400 font-bold text-xl">support@eusotrip.com</p>
                <p className="text-slate-500 text-sm mt-2">For non-urgent inquiries</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
