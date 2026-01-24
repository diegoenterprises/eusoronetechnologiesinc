/**
 * SUPPORT PAGE
 * Help center and customer support
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  HelpCircle, Search, MessageSquare, Phone, Mail, FileText,
  ChevronDown, ChevronRight, Clock, CheckCircle, Send,
  Book, Video, Users, AlertTriangle, Sparkles, X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
}

interface SupportTicket {
  id: string;
  subject: string;
  status: "open" | "in_progress" | "resolved";
  priority: "low" | "medium" | "high";
  createdAt: string;
  lastUpdate: string;
}

const FAQS: FAQ[] = [
  {
    id: "f1", category: "Getting Started",
    question: "How do I create my first load?",
    answer: "Navigate to 'Create Load' from your dashboard. Follow the 7-step wizard to specify hazmat classification, quantity, origin/destination, equipment requirements, and pricing. ESANG AI will assist with classification suggestions."
  },
  {
    id: "f2", category: "Getting Started",
    question: "How do I verify my carrier credentials?",
    answer: "Go to Settings > Company Profile > Credentials. Enter your USDOT number and MC number. Our system automatically verifies with FMCSA SAFER database. TWIC and hazmat endorsements are verified separately."
  },
  {
    id: "f3", category: "Billing",
    question: "How does EusoWallet work?",
    answer: "EusoWallet is your integrated payment system. Funds from completed loads are deposited automatically. You can withdraw to your linked bank account anytime. Quick Pay options are available for a small fee."
  },
  {
    id: "f4", category: "Billing",
    question: "What are the platform fees?",
    answer: "Standard platform fee is 3% of load value. Quick Pay (24-hour payment) adds 2%. Subscription plans are available for high-volume users with reduced fees."
  },
  {
    id: "f5", category: "Compliance",
    question: "How do I track HOS compliance?",
    answer: "HOS is automatically tracked via ELD integration. View real-time status on the Driver Dashboard. Alerts are sent when drivers approach limits. All data is stored per 49 CFR 395 requirements."
  },
  {
    id: "f6", category: "Safety",
    question: "How do I report an incident?",
    answer: "Go to Safety > Report Incident. Fill in the incident type, location, and details. Upload photos if available. Our safety team reviews all reports within 24 hours."
  },
];

const MOCK_TICKETS: SupportTicket[] = [
  { id: "t1", subject: "Payment not received for LOAD-45890", status: "in_progress", priority: "high", createdAt: "Jan 21, 2026", lastUpdate: "Jan 22, 2026" },
  { id: "t2", subject: "Unable to update company profile", status: "resolved", priority: "medium", createdAt: "Jan 18, 2026", lastUpdate: "Jan 19, 2026" },
];

const STATUS_COLORS = {
  open: "bg-blue-500/20 text-blue-400",
  in_progress: "bg-yellow-500/20 text-yellow-400",
  resolved: "bg-green-500/20 text-green-400",
};

export default function Support() {
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);
  const [showTicketForm, setShowTicketForm] = useState(false);
  const [ticketForm, setTicketForm] = useState({ subject: "", category: "", priority: "", description: "" });

  const filteredFaqs = FAQS.filter(faq =>
    faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const categories = Array.from(new Set(FAQS.map(f => f.category)));

  const handleSubmitTicket = () => {
    if (!ticketForm.subject || !ticketForm.description) {
      toast.error("Please fill in all required fields");
      return;
    }
    toast.success("Support ticket submitted", {
      description: "We'll respond within 24 hours.",
    });
    setShowTicketForm(false);
    setTicketForm({ subject: "", category: "", priority: "", description: "" });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Help & Support</h1>
          <p className="text-slate-400">Get help with EusoTrip</p>
        </div>
        <Button onClick={() => setShowTicketForm(true)} className="bg-blue-600 hover:bg-blue-700">
          <MessageSquare className="w-4 h-4 mr-2" />
          New Ticket
        </Button>
      </div>

      {/* Quick Contact */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-slate-800/50 border-slate-700 hover:border-blue-500/50 transition-all cursor-pointer">
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center mx-auto mb-3">
              <Sparkles className="w-6 h-6 text-blue-400" />
            </div>
            <h3 className="text-white font-medium mb-1">ESANG AI Assistant</h3>
            <p className="text-sm text-slate-400">Get instant answers 24/7</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700 hover:border-green-500/50 transition-all cursor-pointer">
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-3">
              <Phone className="w-6 h-6 text-green-400" />
            </div>
            <h3 className="text-white font-medium mb-1">Phone Support</h3>
            <p className="text-sm text-slate-400">1-800-EUSOTRIP (Mon-Fri 8-6 CST)</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700 hover:border-purple-500/50 transition-all cursor-pointer">
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center mx-auto mb-3">
              <Mail className="w-6 h-6 text-purple-400" />
            </div>
            <h3 className="text-white font-medium mb-1">Email Support</h3>
            <p className="text-sm text-slate-400">support@eusotrip.com</p>
          </CardContent>
        </Card>
      </div>

      {/* Search FAQs */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-white flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-blue-400" />
            Frequently Asked Questions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative mb-6">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search FAQs..."
              className="pl-9 bg-slate-700/50 border-slate-600 text-white"
            />
          </div>

          {categories.map((category) => {
            const categoryFaqs = filteredFaqs.filter(f => f.category === category);
            if (categoryFaqs.length === 0) return null;

            return (
              <div key={category} className="mb-6 last:mb-0">
                <h4 className="text-sm font-medium text-slate-400 mb-3">{category}</h4>
                <div className="space-y-2">
                  {categoryFaqs.map((faq) => (
                    <div key={faq.id} className="rounded-lg bg-slate-700/30 overflow-hidden">
                      <button
                        onClick={() => setExpandedFaq(expandedFaq === faq.id ? null : faq.id)}
                        className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-700/50 transition-colors"
                      >
                        <span className="text-white font-medium">{faq.question}</span>
                        {expandedFaq === faq.id ? (
                          <ChevronDown className="w-4 h-4 text-slate-400" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-slate-400" />
                        )}
                      </button>
                      {expandedFaq === faq.id && (
                        <div className="px-4 pb-4 text-sm text-slate-300">
                          {faq.answer}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* My Tickets */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-purple-400" />
            My Support Tickets
          </CardTitle>
        </CardHeader>
        <CardContent>
          {MOCK_TICKETS.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-500">No support tickets</p>
            </div>
          ) : (
            <div className="space-y-3">
              {MOCK_TICKETS.map((ticket) => (
                <div key={ticket.id} className="flex items-center justify-between p-4 rounded-lg bg-slate-700/30 hover:bg-slate-700/50 transition-colors cursor-pointer">
                  <div>
                    <p className="text-white font-medium">{ticket.subject}</p>
                    <p className="text-xs text-slate-500">Created: {ticket.createdAt} | Updated: {ticket.lastUpdate}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={STATUS_COLORS[ticket.status]}>
                      {ticket.status.replace("_", " ")}
                    </Badge>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resources */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-slate-800/50 border-slate-700 hover:border-slate-600 transition-all cursor-pointer">
          <CardContent className="p-5 flex items-center gap-4">
            <Book className="w-8 h-8 text-blue-400" />
            <div>
              <h4 className="text-white font-medium">User Guide</h4>
              <p className="text-xs text-slate-400">Complete documentation</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700 hover:border-slate-600 transition-all cursor-pointer">
          <CardContent className="p-5 flex items-center gap-4">
            <Video className="w-8 h-8 text-green-400" />
            <div>
              <h4 className="text-white font-medium">Video Tutorials</h4>
              <p className="text-xs text-slate-400">Step-by-step guides</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700 hover:border-slate-600 transition-all cursor-pointer">
          <CardContent className="p-5 flex items-center gap-4">
            <Users className="w-8 h-8 text-purple-400" />
            <div>
              <h4 className="text-white font-medium">Community Forum</h4>
              <p className="text-xs text-slate-400">Connect with other users</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* New Ticket Modal */}
      {showTicketForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="bg-slate-800 border-slate-700 w-full max-w-lg">
            <CardHeader className="border-b border-slate-700">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white">Submit Support Ticket</CardTitle>
                <Button variant="ghost" onClick={() => setShowTicketForm(false)} className="text-slate-400">
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div>
                <Label className="text-slate-300">Subject *</Label>
                <Input
                  value={ticketForm.subject}
                  onChange={(e) => setTicketForm({...ticketForm, subject: e.target.value})}
                  placeholder="Brief description of your issue"
                  className="mt-1 bg-slate-700/50 border-slate-600 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-slate-300">Category</Label>
                  <Select value={ticketForm.category} onValueChange={(v) => setTicketForm({...ticketForm, category: v})}>
                    <SelectTrigger className="mt-1 bg-slate-700/50 border-slate-600 text-white">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="billing">Billing</SelectItem>
                      <SelectItem value="technical">Technical</SelectItem>
                      <SelectItem value="compliance">Compliance</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-slate-300">Priority</Label>
                  <Select value={ticketForm.priority} onValueChange={(v) => setTicketForm({...ticketForm, priority: v})}>
                    <SelectTrigger className="mt-1 bg-slate-700/50 border-slate-600 text-white">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label className="text-slate-300">Description *</Label>
                <Textarea
                  value={ticketForm.description}
                  onChange={(e) => setTicketForm({...ticketForm, description: e.target.value})}
                  placeholder="Describe your issue in detail..."
                  className="mt-1 bg-slate-700/50 border-slate-600 text-white min-h-[120px]"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={() => setShowTicketForm(false)} className="flex-1 border-slate-600">
                  Cancel
                </Button>
                <Button onClick={handleSubmitTicket} className="flex-1 bg-blue-600 hover:bg-blue-700">
                  <Send className="w-4 h-4 mr-2" />
                  Submit Ticket
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
