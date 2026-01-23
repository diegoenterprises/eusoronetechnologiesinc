/**
 * SUPPORT PAGE
 * Support tickets, FAQs, and contact form with gradient styling
 */

import { useAuth } from "@/_core/hooks/useAuth";
import { HelpCircle, MessageSquare, FileText, Send, AlertCircle, CheckCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useState } from "react";

export default function SupportPage() {
  const { user } = useAuth();
  const [selectedTicket, setSelectedTicket] = useState(0);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const tickets = [
    {
      id: "TKT-001",
      subject: "Payment Processing Issue",
      status: "open",
      date: "2024-12-15",
      priority: "high",
      description: "Unable to process payment for shipment creation",
    },
    {
      id: "TKT-002",
      subject: "Account Verification",
      status: "in_progress",
      date: "2024-12-14",
      priority: "medium",
      description: "Waiting for document verification",
    },
    {
      id: "TKT-003",
      subject: "Documentation Help",
      status: "resolved",
      date: "2024-12-10",
      priority: "low",
      description: "Questions about required documentation",
    },
  ];

  const faqs = [
    {
      question: "How do I create a shipment?",
      answer: "Click on 'Create Shipment' button in the top navigation and fill in the required details including origin, destination, cargo type, and preferred carrier. You can save drafts and submit when ready.",
    },
    {
      question: "What payment methods are accepted?",
      answer: "We accept credit cards, bank transfers, ACH payments, and digital wallets. All payments are processed securely through our integrated payment gateway.",
    },
    {
      question: "How long does verification take?",
      answer: "Verification typically takes 24-48 hours. You'll receive email notifications at each stage of the verification process.",
    },
    {
      question: "How can I track my shipments in real-time?",
      answer: "Navigate to the Shipments section and click on any active shipment to view real-time GPS tracking, estimated arrival time, and driver information.",
    },
    {
      question: "What should I do if I encounter a compliance issue?",
      answer: "All compliance issues are automatically flagged in your dashboard. Review the details and take corrective action immediately. Contact support if you need assistance.",
    },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "open":
        return <AlertCircle size={16} className="text-red-400" />;
      case "in_progress":
        return <Clock size={16} className="text-yellow-400" />;
      case "resolved":
        return <CheckCircle size={16} className="text-green-400" />;
      default:
        return <HelpCircle size={16} className="text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-red-900/30 text-red-300 border-red-700";
      case "in_progress":
        return "bg-yellow-900/30 text-yellow-300 border-yellow-700";
      case "resolved":
        return "bg-green-900/30 text-green-300 border-green-700";
      default:
        return "bg-gray-700/30 text-gray-300 border-gray-600";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Support Center</h1>
        <p className="text-gray-400">Get help with your account and shipments</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Support Tickets - Left Column */}
        <div className="lg:col-span-1 space-y-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <MessageSquare size={20} className="text-blue-400" />
            Your Tickets
          </h2>
          <div className="space-y-3">
            {tickets.map((ticket, idx) => (
              <Card
                key={ticket.id}
                onClick={() => setSelectedTicket(idx)}
                className={`p-4 cursor-pointer transition-all ${
                  selectedTicket === idx
                    ? "bg-gradient-to-r from-blue-600/30 to-purple-600/30 border-blue-500 shadow-lg shadow-blue-500/20"
                    : "bg-slate-800 border-slate-700 hover:border-slate-600"
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <p className="text-white font-semibold text-sm">{ticket.subject}</p>
                    <p className="text-gray-400 text-xs">{ticket.id}</p>
                  </div>
                  {getStatusIcon(ticket.status)}
                </div>
                <span
                  className={`inline-block px-2 py-1 rounded text-xs font-semibold border ${getStatusColor(
                    ticket.status
                  )}`}
                >
                  {ticket.status.replace("_", " ")}
                </span>
              </Card>
            ))}
          </div>
        </div>

        {/* Ticket Details - Right Column */}
        <div className="lg:col-span-2">
          <Card className="bg-slate-800 border-slate-700 p-6 h-full">
            {tickets[selectedTicket] && (
              <div className="space-y-4">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-white">{tickets[selectedTicket].subject}</h3>
                    <p className="text-gray-400 text-sm mt-1">{tickets[selectedTicket].id}</p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(
                      tickets[selectedTicket].status
                    )}`}
                  >
                    {tickets[selectedTicket].status.replace("_", " ").toUpperCase()}
                  </span>
                </div>

                <div className="border-t border-slate-700 pt-4">
                  <p className="text-gray-300 mb-4">{tickets[selectedTicket].description}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <span>Priority: <span className="font-semibold text-white capitalize">{tickets[selectedTicket].priority}</span></span>
                    <span>•</span>
                    <span>Created: {tickets[selectedTicket].date}</span>
                  </div>
                </div>

                <div className="border-t border-slate-700 pt-4 space-y-3">
                  <h4 className="font-semibold text-white">Add Reply</h4>
                  <textarea
                    placeholder="Type your message here..."
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg p-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30"
                    rows={3}
                  />
                  <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold">
                    <Send size={18} className="mr-2" />
                    Send Reply
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* FAQs Section */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <HelpCircle size={24} className="text-blue-400" />
          Frequently Asked Questions
        </h2>
        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <Card
              key={idx}
              onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
              className={`p-4 cursor-pointer transition-all ${
                expandedFaq === idx
                  ? "bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-blue-500"
                  : "bg-slate-800 border-slate-700 hover:border-slate-600"
              }`}
            >
              <div className="flex items-start justify-between">
                <h3 className="font-semibold text-white flex-1">{faq.question}</h3>
                <span className={`text-blue-400 transition-transform ${expandedFaq === idx ? "rotate-180" : ""}`}>
                  ▼
                </span>
              </div>
              {expandedFaq === idx && (
                <p className="text-gray-400 mt-3 pt-3 border-t border-slate-700">{faq.answer}</p>
              )}
            </Card>
          ))}
        </div>
      </div>

      {/* Contact Form */}
      <Card className="bg-slate-800 border-slate-700 p-6">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <FileText size={20} className="text-blue-400" />
          Contact Support
        </h2>
        <div className="space-y-4">
          <Input
            placeholder="Subject"
            className="bg-slate-700 border-slate-600 text-white placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30"
          />
          <textarea
            placeholder="Describe your issue in detail..."
            className="w-full bg-slate-700 border border-slate-600 rounded-lg p-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30"
            rows={4}
          />
          <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold w-full">
            <Send size={18} className="mr-2" />
            Send Message
          </Button>
        </div>
      </Card>
    </div>
  );
}

