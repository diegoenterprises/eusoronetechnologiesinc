/**
 * TERMINAL GATE MANAGEMENT PAGE
 * 100% Dynamic - Manage terminal gate operations and access
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
  DoorOpen, Search, Truck, User, Clock,
  CheckCircle, XCircle, AlertTriangle, ArrowRight, ArrowLeft
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function TerminalGateManagement() {
  const [search, setSearch] = useState("");
  const [gateFilter, setGateFilter] = useState("all");

  const gatesQuery = trpc.terminals.getBays.useQuery();
  const transactionsQuery = trpc.terminals.getAppointments.useQuery({});
  const statsQuery = trpc.terminals.getStats.useQuery();

  const processEntryMutation = trpc.terminals.createAppointment.useMutation({
    onSuccess: () => {
      toast.success("Entry processed");
      transactionsQuery.refetch();
      statsQuery.refetch();
    },
  });

  const processExitMutation = trpc.terminals.createAppointment.useMutation({
    onSuccess: () => {
      toast.success("Exit processed");
      transactionsQuery.refetch();
      statsQuery.refetch();
    },
  });

  const gates = gatesQuery.data || [];
  const transactions = transactionsQuery.data || [];
  const stats = statsQuery.data;

  const filteredTransactions = transactions.filter((t: any) =>
    t.truckNumber?.toLowerCase().includes(search.toLowerCase()) ||
    t.driverName?.toLowerCase().includes(search.toLowerCase()) ||
    t.carrierName?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
            Gate Management
          </h1>
          <p className="text-slate-400 text-sm mt-1">Monitor and manage terminal gate operations</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {statsQuery.isLoading ? (
          Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)
        ) : (
          <>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <DoorOpen className="w-4 h-4 text-cyan-400" />
                  <span className="text-slate-400 text-sm">Active Gates</span>
                </div>
                <p className="text-2xl font-bold text-white">{stats?.availableBays || 0}/{stats?.totalBays || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-green-500/10 border-green-500/30 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <ArrowRight className="w-4 h-4 text-green-400" />
                  <span className="text-slate-400 text-sm">Entries Today</span>
                </div>
                <p className="text-2xl font-bold text-green-400">{stats?.incomingToday || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-blue-500/10 border-blue-500/30 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <ArrowLeft className="w-4 h-4 text-blue-400" />
                  <span className="text-slate-400 text-sm">Exits Today</span>
                </div>
                <p className="text-2xl font-bold text-blue-400">{stats?.outgoingToday || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Truck className="w-4 h-4 text-purple-400" />
                  <span className="text-slate-400 text-sm">Currently On-Site</span>
                </div>
                <p className="text-2xl font-bold text-purple-400">{stats?.activeShipments || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-cyan-400" />
                  <span className="text-slate-400 text-sm">Avg Dwell Time</span>
                </div>
                <p className="text-2xl font-bold text-cyan-400">{stats?.staffOnDuty || 0}</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Gates Overview */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white flex items-center gap-2">
            <DoorOpen className="w-5 h-5 text-cyan-400" />
            Gate Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          {gatesQuery.isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-24 rounded-lg" />)}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {gates.map((gate: any) => (
                <div key={gate.id} className={cn(
                  "p-4 rounded-lg border-2 transition-all",
                  gate.status === "open" ? "bg-green-500/10 border-green-500/50" :
                  gate.status === "closed" ? "bg-slate-700/30 border-slate-600/50" :
                  "bg-yellow-500/10 border-yellow-500/50"
                )}>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-white font-bold">{gate.name}</p>
                    <Badge className={cn(
                      "border-0 text-xs",
                      gate.status === "open" ? "bg-green-500/20 text-green-400" :
                      gate.status === "closed" ? "bg-slate-500/20 text-slate-400" :
                      "bg-yellow-500/20 text-yellow-400"
                    )}>
                      {gate.status}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Type:</span>
                    <span className="text-white">{gate.type}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Queue:</span>
                    <span className={cn(
                      "font-medium",
                      (gate.queueLength || 0) > 5 ? "text-red-400" :
                      (gate.queueLength || 0) > 2 ? "text-yellow-400" : "text-green-400"
                    )}>
                      {gate.queueLength || 0} vehicles
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Filters */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by truck, driver, or carrier..."
                className="pl-10 bg-slate-700/50 border-slate-600/50 rounded-lg"
              />
            </div>
            <Select value={gateFilter} onValueChange={setGateFilter}>
              <SelectTrigger className="w-40 bg-slate-700/50 border-slate-600/50 rounded-lg">
                <SelectValue placeholder="Gate" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Gates</SelectItem>
                {gates.map((g: any) => (
                  <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Transactions */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white">Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {transactionsQuery.isLoading ? (
            <div className="p-4 space-y-3">{Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-20 rounded-lg" />)}</div>
          ) : filteredTransactions.length === 0 ? (
            <div className="text-center py-16">
              <DoorOpen className="w-12 h-12 text-slate-500 mx-auto mb-4" />
              <p className="text-slate-400">No transactions found</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {filteredTransactions.map((txn: any) => (
                <div key={txn.id} className="p-4 hover:bg-slate-700/20 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-12 h-12 rounded-lg flex items-center justify-center",
                        txn.type === "entry" ? "bg-green-500/20" : "bg-blue-500/20"
                      )}>
                        {txn.type === "entry" ? (
                          <ArrowRight className="w-6 h-6 text-green-400" />
                        ) : (
                          <ArrowLeft className="w-6 h-6 text-blue-400" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <Truck className="w-4 h-4 text-slate-400" />
                          <p className="text-white font-bold">#{txn.truckNumber}</p>
                          <Badge className={cn(
                            "border-0 text-xs",
                            txn.status === "completed" ? "bg-green-500/20 text-green-400" :
                            txn.status === "pending" ? "bg-yellow-500/20 text-yellow-400" :
                            "bg-red-500/20 text-red-400"
                          )}>
                            {txn.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-400 mt-1">
                          <User className="w-3 h-3" />
                          <span>{txn.driverName}</span>
                          <span className="text-slate-600">|</span>
                          <span>{txn.carrierName}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <p className="text-slate-400 text-xs">Gate</p>
                        <p className="text-white font-medium">{txn.gateName}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-slate-400 text-xs">Time</p>
                        <p className="text-white">{txn.timestamp}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-slate-400 text-xs">Purpose</p>
                        <p className="text-white">{txn.purpose}</p>
                      </div>
                      {txn.status === "pending" && txn.type === "entry" && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => processEntryMutation.mutate({ terminalId: txn.id, carrierId: "", driverId: "", truckNumber: "", productId: "", quantity: 0, scheduledDate: "", scheduledTime: "" } as any)}
                            className="bg-red-600 hover:bg-red-700 rounded-lg"
                          >
                            <XCircle className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => processEntryMutation.mutate({ terminalId: txn.id, carrierId: "", driverId: "", truckNumber: "", productId: "", quantity: 0, scheduledDate: "", scheduledTime: "" } as any)}
                            className="bg-green-600 hover:bg-green-700 rounded-lg"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  {txn.alerts && txn.alerts.length > 0 && (
                    <div className="mt-3 p-2 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-yellow-400" />
                        <span className="text-yellow-400 text-sm">{txn.alerts.join(", ")}</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
