/**
 * RUN TICKETS PAGE
 * Complete run ticket/trip sheet management for loads
 * Track fuel, tolls, expenses, and trip documentation
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Receipt, Fuel, MapPin, Clock, DollarSign, Plus,
  CheckCircle, AlertTriangle, Eye, Download, Truck,
  Calendar, FileText, Camera, Calculator
} from "lucide-react";

interface RunTicket {
  id: number;
  ticketNumber: string;
  loadId: number;
  loadNumber: string;
  status: string;
  createdAt: string;
  completedAt: string | null;
  origin: string;
  destination: string;
  totalMiles: number;
  totalFuel: number;
  totalTolls: number;
  totalExpenses: number;
  driverNotes: string | null;
}

interface Expense {
  id: number;
  type: string;
  amount: number;
  description: string;
  receiptUrl: string | null;
  createdAt: string;
}

export default function RunTickets() {
  const [createOpen, setCreateOpen] = useState(false);
  const [expenseOpen, setExpenseOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<RunTicket | null>(null);
  const [activeTab, setActiveTab] = useState("active");
  
  // Form states
  const [loadNumber, setLoadNumber] = useState("");
  const [expenseType, setExpenseType] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseDescription, setExpenseDescription] = useState("");

  const ticketsQuery = trpc.runTickets.list.useQuery({ status: activeTab === "all" ? undefined : activeTab });
  const statsQuery = trpc.runTickets.getStats.useQuery();
  
  const createMutation = trpc.runTickets.create.useMutation({
    onSuccess: () => {
      toast.success("Run ticket created");
      setCreateOpen(false);
      setLoadNumber("");
      ticketsQuery.refetch();
    },
    onError: (error) => toast.error("Failed to create", { description: error.message }),
  });

  const addExpenseMutation = trpc.runTickets.addExpense.useMutation({
    onSuccess: () => {
      toast.success("Expense added");
      setExpenseOpen(false);
      setExpenseType("");
      setExpenseAmount("");
      setExpenseDescription("");
      ticketsQuery.refetch();
    },
    onError: (error) => toast.error("Failed to add expense", { description: error.message }),
  });

  const completeMutation = trpc.runTickets.complete.useMutation({
    onSuccess: () => {
      toast.success("Run ticket completed");
      ticketsQuery.refetch();
      statsQuery.refetch();
    },
  });

  const stats = statsQuery.data;
  const tickets = ticketsQuery.data || [];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active": return <Badge className="bg-blue-500/20 text-blue-400 border-0"><Truck className="w-3 h-3 mr-1" />Active</Badge>;
      case "completed": return <Badge className="bg-green-500/20 text-green-400 border-0"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>;
      case "pending_review": return <Badge className="bg-yellow-500/20 text-yellow-400 border-0"><Clock className="w-3 h-3 mr-1" />Pending Review</Badge>;
      case "disputed": return <Badge className="bg-red-500/20 text-red-400 border-0"><AlertTriangle className="w-3 h-3 mr-1" />Disputed</Badge>;
      default: return <Badge className="bg-slate-500/20 text-slate-400 border-0">{status}</Badge>;
    }
  };

  const EXPENSE_TYPES = [
    { value: "fuel", label: "Fuel", icon: Fuel },
    { value: "toll", label: "Tolls", icon: MapPin },
    { value: "scale", label: "Scale Tickets", icon: Calculator },
    { value: "parking", label: "Parking", icon: MapPin },
    { value: "lumper", label: "Lumper Fees", icon: DollarSign },
    { value: "detention", label: "Detention", icon: Clock },
    { value: "repair", label: "Repairs", icon: Truck },
    { value: "meal", label: "Meals", icon: Receipt },
    { value: "other", label: "Other", icon: Receipt },
  ];

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            Run Tickets
          </h1>
          <p className="text-slate-400 text-sm mt-1">Track expenses and documentation for each trip</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 rounded-lg">
              <Plus className="w-4 h-4 mr-2" />New Run Ticket
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-800 border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-white">Create Run Ticket</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Load Number *</Label>
                <Input
                  placeholder="Enter load number"
                  value={loadNumber}
                  onChange={(e) => setLoadNumber(e.target.value)}
                  className="bg-slate-700 border-slate-600"
                />
              </div>
              <Button
                onClick={() => createMutation.mutate({ loadNumber })}
                disabled={createMutation.isPending || !loadNumber}
                className="w-full bg-gradient-to-r from-cyan-600 to-emerald-600"
              >
                {createMutation.isPending ? "Creating..." : "Create Run Ticket"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-500/20">
                <Receipt className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                {statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-blue-400">{stats?.total || 0}</p>
                )}
                <p className="text-xs text-slate-400">Total Tickets</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/20">
                <Truck className="w-6 h-6 text-green-400" />
              </div>
              <div>
                {statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-green-400">{stats?.active || 0}</p>
                )}
                <p className="text-xs text-slate-400">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-orange-500/20">
                <Fuel className="w-6 h-6 text-orange-400" />
              </div>
              <div>
                {statsQuery.isLoading ? <Skeleton className="h-8 w-16" /> : (
                  <p className="text-2xl font-bold text-orange-400">${stats?.totalFuel?.toLocaleString() || 0}</p>
                )}
                <p className="text-xs text-slate-400">Fuel This Month</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-purple-500/20">
                <MapPin className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                {statsQuery.isLoading ? <Skeleton className="h-8 w-16" /> : (
                  <p className="text-2xl font-bold text-purple-400">${stats?.totalTolls?.toLocaleString() || 0}</p>
                )}
                <p className="text-xs text-slate-400">Tolls This Month</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-cyan-500/20">
                <DollarSign className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                {statsQuery.isLoading ? <Skeleton className="h-8 w-16" /> : (
                  <p className="text-2xl font-bold text-cyan-400">${stats?.totalExpenses?.toLocaleString() || 0}</p>
                )}
                <p className="text-xs text-slate-400">Total Expenses</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tickets List */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-slate-800/50">
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="pending_review">Pending Review</TabsTrigger>
          <TabsTrigger value="all">All Tickets</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          {ticketsQuery.isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full" />)}
            </div>
          ) : (
            <div className="grid gap-4">
              {tickets.map((ticket: RunTicket) => (
                <Card key={ticket.id} className="bg-slate-800/50 border-slate-700/50 rounded-xl hover:border-slate-600/50 transition-colors">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className="p-3 rounded-full bg-cyan-500/20">
                          <Receipt className="w-6 h-6 text-cyan-400" />
                        </div>
                        <div>
                          <div className="flex items-center gap-3">
                            <p className="text-white font-semibold">#{ticket.ticketNumber}</p>
                            {getStatusBadge(ticket.status)}
                          </div>
                          <p className="text-slate-400 text-sm mt-1">Load #{ticket.loadNumber}</p>
                          <p className="text-slate-500 text-sm">{ticket.origin} → {ticket.destination}</p>
                          <div className="flex items-center gap-4 mt-3 text-sm">
                            <span className="text-slate-400"><MapPin className="w-3 h-3 inline mr-1" />{ticket.totalMiles} mi</span>
                            <span className="text-orange-400"><Fuel className="w-3 h-3 inline mr-1" />${ticket.totalFuel}</span>
                            <span className="text-purple-400"><MapPin className="w-3 h-3 inline mr-1" />${ticket.totalTolls} tolls</span>
                            <span className="text-cyan-400"><DollarSign className="w-3 h-3 inline mr-1" />${ticket.totalExpenses} total</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <p className="text-slate-500 text-xs flex items-center">
                          <Calendar className="w-3 h-3 mr-1" />
                          {new Date(ticket.createdAt).toLocaleDateString()}
                        </p>
                        <div className="flex items-center gap-2">
                          {ticket.status === "active" && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => { setSelectedTicket(ticket); setExpenseOpen(true); }}
                                className="bg-slate-700/50 border-slate-600"
                              >
                                <Plus className="w-3 h-3 mr-1" />Add Expense
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => completeMutation.mutate({ id: ticket.id })}
                                className="bg-green-500/20 text-green-400 hover:bg-green-500/30"
                              >
                                <CheckCircle className="w-3 h-3 mr-1" />Complete
                              </Button>
                            </>
                          )}
                          <Button size="sm" variant="ghost" className="text-slate-400">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="ghost" className="text-slate-400">
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {tickets.length === 0 && (
                <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
                  <CardContent className="p-8 text-center">
                    <Receipt className="w-12 h-12 text-slate-500 mx-auto mb-3" />
                    <p className="text-slate-400">No run tickets found</p>
                    <Button className="mt-4" onClick={() => setCreateOpen(true)}>
                      Create Your First Run Ticket
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Add Expense Dialog */}
      <Dialog open={expenseOpen} onOpenChange={setExpenseOpen}>
        <DialogContent className="bg-slate-800 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">Add Expense to #{selectedTicket?.ticketNumber}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Expense Type *</Label>
              <Select value={expenseType} onValueChange={setExpenseType}>
                <SelectTrigger className="bg-slate-700 border-slate-600">
                  <SelectValue placeholder="Select expense type" />
                </SelectTrigger>
                <SelectContent>
                  {EXPENSE_TYPES.map(et => (
                    <SelectItem key={et.value} value={et.value}>{et.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Amount *</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={expenseAmount}
                onChange={(e) => setExpenseAmount(e.target.value)}
                className="bg-slate-700 border-slate-600"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder="Enter description"
                value={expenseDescription}
                onChange={(e) => setExpenseDescription(e.target.value)}
                className="bg-slate-700 border-slate-600"
              />
            </div>
            <div className="space-y-2">
              <Label>Receipt (optional)</Label>
              <div className="border-2 border-dashed border-slate-600 rounded-lg p-4 text-center">
                <Camera className="w-6 h-6 mx-auto text-slate-400 mb-2" />
                <p className="text-slate-400 text-sm">Click to upload or take photo</p>
              </div>
            </div>
            <Button
              onClick={() => selectedTicket && addExpenseMutation.mutate({
                ticketId: selectedTicket.id,
                type: expenseType,
                amount: parseFloat(expenseAmount),
                description: expenseDescription,
              })}
              disabled={addExpenseMutation.isPending || !expenseType || !expenseAmount}
              className="w-full bg-gradient-to-r from-cyan-600 to-emerald-600"
            >
              {addExpenseMutation.isPending ? "Adding..." : "Add Expense"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
