/**
 * SUPPORT PAGE
 * 100% Dynamic - No mock data
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  HelpCircle, MessageSquare, Clock, CheckCircle, AlertTriangle,
  Search, Plus, Eye, Send, Phone, Mail, FileText, Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function Support() {
  const [activeTab, setActiveTab] = useState("tickets");
  const [searchTerm, setSearchTerm] = useState("");
  const [newTicketSubject, setNewTicketSubject] = useState("");
  const [newTicketMessage, setNewTicketMessage] = useState("");
  const [newTicketPriority, setNewTicketPriority] = useState("medium");

  const ticketsQuery = trpc.support.getTickets.useQuery({ search: searchTerm || undefined });
  const faqQuery = trpc.support.getFAQ.useQuery();

  const createTicketMutation = trpc.support.createTicket.useMutation({
    onSuccess: () => {
      toast.success("Ticket created");
      setNewTicketSubject("");
      setNewTicketMessage("");
      ticketsQuery.refetch();
      setActiveTab("tickets");
    },
    onError: (error) => toast.error("Failed", { description: error.message }),
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "resolved": return "bg-green-500/20 text-green-400";
      case "in_progress": return "bg-blue-500/20 text-blue-400";
      case "open": return "bg-yellow-500/20 text-yellow-400";
      case "closed": return "bg-slate-500/20 text-slate-400";
      default: return "bg-slate-500/20 text-slate-400";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent": return "bg-red-500/20 text-red-400";
      case "high": return "bg-orange-500/20 text-orange-400";
      case "medium": return "bg-yellow-500/20 text-yellow-400";
      case "low": return "bg-green-500/20 text-green-400";
      default: return "bg-slate-500/20 text-slate-400";
    }
  };

  const handleCreateTicket = () => {
    if (!newTicketSubject.trim() || !newTicketMessage.trim()) {
      toast.error("Please fill in all fields");
      return;
    }
    createTicketMutation.mutate({
      subject: newTicketSubject,
      message: newTicketMessage,
      priority: newTicketPriority,
    });
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Support Center</h1>
          <p className="text-slate-400 text-sm">Get help and manage support tickets</p>
        </div>
      </div>

      {/* Quick Contact */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-blue-500/20">
              <Phone className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="text-white font-medium">Phone Support</p>
              <p className="text-slate-400">1-800-EUSOTRIP</p>
              <p className="text-xs text-slate-500">24/7 Available</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-green-500/20">
              <Mail className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <p className="text-white font-medium">Email Support</p>
              <p className="text-slate-400">support@eusotrip.com</p>
              <p className="text-xs text-slate-500">Response within 24h</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-purple-500/20">
              <MessageSquare className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <p className="text-white font-medium">Live Chat</p>
              <p className="text-slate-400">Chat with ESANG AI</p>
              <p className="text-xs text-green-400">Online Now</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-slate-800 border border-slate-700">
          <TabsTrigger value="tickets" className="data-[state=active]:bg-blue-600">My Tickets</TabsTrigger>
          <TabsTrigger value="new" className="data-[state=active]:bg-blue-600">New Ticket</TabsTrigger>
          <TabsTrigger value="faq" className="data-[state=active]:bg-blue-600">FAQ</TabsTrigger>
        </TabsList>

        <TabsContent value="tickets" className="mt-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search tickets..." className="pl-9 bg-slate-700/50 border-slate-600" />
            </div>
            <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => setActiveTab("new")}>
              <Plus className="w-4 h-4 mr-2" />New Ticket
            </Button>
          </div>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-0">
              {ticketsQuery.isLoading ? (
                <div className="p-4 space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full" />)}</div>
              ) : ticketsQuery.data?.length === 0 ? (
                <div className="p-12 text-center">
                  <HelpCircle className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400">No support tickets</p>
                  <Button className="mt-4 bg-blue-600 hover:bg-blue-700" onClick={() => setActiveTab("new")}>
                    <Plus className="w-4 h-4 mr-2" />Create Your First Ticket
                  </Button>
                </div>
              ) : (
                <div className="divide-y divide-slate-700">
                  {ticketsQuery.data?.map((ticket) => (
                    <div key={ticket.id} className="flex items-center justify-between p-4 hover:bg-slate-700/30 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className={cn("p-2 rounded-lg", ticket.status === "resolved" ? "bg-green-500/20" : ticket.status === "in_progress" ? "bg-blue-500/20" : "bg-yellow-500/20")}>
                          {ticket.status === "resolved" ? <CheckCircle className="w-5 h-5 text-green-400" /> : <MessageSquare className={cn("w-5 h-5", ticket.status === "in_progress" ? "text-blue-400" : "text-yellow-400")} />}
                        </div>
                        <div>
                          <p className="text-white font-medium">{ticket.subject}</p>
                          <p className="text-sm text-slate-400">#{ticket.ticketNumber}</p>
                          <p className="text-xs text-slate-500">Created: {ticket.createdAt}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex gap-2">
                          <Badge className={getStatusColor(ticket.status)}>{ticket.status?.replace("_", " ")}</Badge>
                          <Badge className={getPriorityColor(ticket.priority)}>{ticket.priority}</Badge>
                        </div>
                        <Button variant="ghost" size="sm"><Eye className="w-4 h-4" /></Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="new" className="mt-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2"><Plus className="w-5 h-5 text-blue-400" />Create Support Ticket</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-slate-400">Subject</Label>
                <Input value={newTicketSubject} onChange={(e) => setNewTicketSubject(e.target.value)} placeholder="Brief description of your issue" className="mt-1 bg-slate-700/50 border-slate-600" />
              </div>
              <div>
                <Label className="text-slate-400">Priority</Label>
                <Select value={newTicketPriority} onValueChange={setNewTicketPriority}>
                  <SelectTrigger className="mt-1 bg-slate-700/50 border-slate-600"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-slate-400">Message</Label>
                <Textarea value={newTicketMessage} onChange={(e) => setNewTicketMessage(e.target.value)} placeholder="Describe your issue in detail..." className="mt-1 bg-slate-700/50 border-slate-600" rows={6} />
              </div>
              <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={handleCreateTicket} disabled={createTicketMutation.isPending}>
                {createTicketMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                Submit Ticket
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="faq" className="mt-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader><CardTitle className="text-white flex items-center gap-2"><HelpCircle className="w-5 h-5 text-purple-400" />Frequently Asked Questions</CardTitle></CardHeader>
            <CardContent>
              {faqQuery.isLoading ? (
                <div className="space-y-4">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-20 w-full" />)}</div>
              ) : faqQuery.data?.length === 0 ? (
                <p className="text-slate-400 text-center py-8">No FAQs available</p>
              ) : (
                <div className="space-y-4">
                  {faqQuery.data?.map((faq, idx) => (
                    <div key={idx} className="p-4 rounded-lg bg-slate-700/30">
                      <p className="text-white font-medium mb-2">{faq.question}</p>
                      <p className="text-slate-400 text-sm">{faq.answer}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
