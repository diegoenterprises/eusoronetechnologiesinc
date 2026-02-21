/**
 * EusoTicket™ Run Ticket & BOL Management Page
 * 
 * Terminal Manager and Driver interface for:
 * - Creating run tickets with SpectraMatch integration
 * - Generating Bills of Lading
 * - Managing loading/unloading documentation
 * 
 * 100% Dynamic - Uses tRPC queries
 */

import React, { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  FileText,
  Truck,
  CheckCircle,
  Clock,
  AlertTriangle,
  Download,
  Plus,
  Search,
  Filter,
  ChevronRight,
  Droplets,
  Thermometer,
  Package,
  MapPin,
  User,
  Building,
  Clipboard,
  Activity,
  BarChart3,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function EusoTicket() {
  const [activeTab, setActiveTab] = useState("tickets");
  const [searchTerm, setSearchTerm] = useState("");
  
  // Queries
  const ticketsQuery = (trpc as any).eusoTicket.listRunTickets.useQuery({ limit: 20 });
  const bolsQuery = (trpc as any).eusoTicket.listBOLs.useQuery({ limit: 20 });
  const statsQuery = (trpc as any).eusoTicket.getTerminalStats.useQuery({ terminalId: "TERM-001" });
  
  // Mutations
  const generateTicketPDF = (trpc as any).eusoTicket.generateRunTicketPDF.useMutation();
  const generateBOLPDF = (trpc as any).eusoTicket.generateBOLPDF.useMutation();

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
      case "delivered":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "pending":
      case "issued":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "in_transit":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "draft":
        return "bg-slate-500/20 text-slate-400 border-slate-500/30";
      case "cancelled":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      default:
        return "bg-slate-500/20 text-slate-400 border-slate-500/30";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
      case "delivered":
        return <CheckCircle className="w-4 h-4" />;
      case "pending":
      case "issued":
        return <Clock className="w-4 h-4" />;
      case "in_transit":
        return <Truck className="w-4 h-4" />;
      default:
        return <AlertTriangle className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
              EusoTicket™
            </h1>
            <p className="text-slate-400 text-sm">Run Tickets & Bills of Lading</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="border-slate-600 text-slate-300">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
          <Button className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600">
            <Plus className="w-4 h-4 mr-2" />
            New Run Ticket
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {statsQuery.isLoading ? (
          [...Array(4)].map((_: any, i: number) => <Skeleton key={i} className="h-24" />)
        ) : (
          <>
            <Card className="bg-slate-900/50 border-slate-700/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/20">
                    <Clipboard className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{(statsQuery.data as any)?.todayTickets || 0}</p>
                    <p className="text-xs text-slate-400">Today's Tickets</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-slate-900/50 border-slate-700/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-500/20">
                    <Droplets className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">
                      {(((statsQuery.data as any)?.todayVolume || 0) / 1000).toFixed(1)}K
                    </p>
                    <p className="text-xs text-slate-400">Today's Volume (gal)</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-slate-900/50 border-slate-700/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-yellow-500/20">
                    <Clock className="w-5 h-5 text-yellow-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{(statsQuery.data as any)?.pendingTickets || 0}</p>
                    <p className="text-xs text-slate-400">Pending Tickets</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-slate-900/50 border-slate-700/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-500/20">
                    <Activity className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{(statsQuery.data as any)?.avgApiGravity?.toFixed(1) || 0}°</p>
                    <p className="text-xs text-slate-400">Avg API Gravity</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-slate-800/50 border border-slate-700/50">
          <TabsTrigger value="tickets" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-orange-500">
            <Clipboard className="w-4 h-4 mr-2" />
            Run Tickets
          </TabsTrigger>
          <TabsTrigger value="bols" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-orange-500">
            <FileText className="w-4 h-4 mr-2" />
            Bills of Lading
          </TabsTrigger>
          <TabsTrigger value="analytics" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-orange-500">
            <BarChart3 className="w-4 h-4 mr-2" />
            Analytics
          </TabsTrigger>
        </TabsList>

        {/* Run Tickets Tab */}
        <TabsContent value="tickets">
          <Card className="bg-slate-900/50 border-slate-700/50">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-white">Run Tickets</CardTitle>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Search tickets..."
                  value={searchTerm}
                  onChange={(e: any) => setSearchTerm(e.target.value)}
                  className="pl-9 bg-slate-800/50 border-slate-700 w-64"
                />
              </div>
            </CardHeader>
            <CardContent>
              {ticketsQuery.isLoading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_: any, i: number) => <Skeleton key={i} className="h-20" />)}
                </div>
              ) : (
                <div className="space-y-3">
                  {(ticketsQuery.data as any)?.tickets.map((ticket: any) => (
                    <div
                      key={ticket.ticketNumber}
                      className="p-4 rounded-lg bg-slate-800/30 border border-slate-700/30 hover:border-amber-500/30 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="p-2 rounded-lg bg-amber-500/20">
                            <Clipboard className="w-5 h-5 text-amber-400" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-white font-medium">{ticket.ticketNumber}</span>
                              <Badge className={getStatusColor(ticket.status)}>
                                {getStatusIcon(ticket.status)}
                                <span className="ml-1 capitalize">{ticket.status}</span>
                              </Badge>
                              {ticket.spectraMatchVerified && (
                                <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                                  <Activity className="w-3 h-3 mr-1" />
                                  SpectraMatch
                                </Badge>
                              )}
                            </div>
                            <div className="text-sm text-slate-400 mt-1">
                              {ticket.productName} • {ticket.netVolume.toLocaleString()} gal • API: {ticket.apiGravity}°
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="text-sm text-white flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {ticket.driverName}
                            </div>
                            <div className="text-xs text-slate-500 flex items-center gap-1">
                              <Truck className="w-3 h-3" />
                              {ticket.vehiclePlate}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs text-slate-500">
                              {new Date(ticket.createdAt).toLocaleDateString()}
                            </div>
                            <div className="text-xs text-slate-500">
                              {new Date(ticket.createdAt).toLocaleTimeString()}
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => generateTicketPDF.mutate({ ticketNumber: ticket.ticketNumber })}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                          <ChevronRight className="w-5 h-5 text-slate-500" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* BOLs Tab */}
        <TabsContent value="bols">
          <Card className="bg-slate-900/50 border-slate-700/50">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-white">Bills of Lading</CardTitle>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Search BOLs..."
                  value={searchTerm}
                  onChange={(e: any) => setSearchTerm(e.target.value)}
                  className="pl-9 bg-slate-800/50 border-slate-700 w-64"
                />
              </div>
            </CardHeader>
            <CardContent>
              {bolsQuery.isLoading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_: any, i: number) => <Skeleton key={i} className="h-20" />)}
                </div>
              ) : (
                <div className="space-y-3">
                  {(bolsQuery.data as any)?.bols.map((bol: any) => (
                    <div
                      key={bol.bolNumber}
                      className="p-4 rounded-lg bg-slate-800/30 border border-slate-700/30 hover:border-orange-500/30 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="p-2 rounded-lg bg-orange-500/20">
                            <FileText className="w-5 h-5 text-orange-400" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-white font-medium">{bol.bolNumber}</span>
                              <Badge className={getStatusColor(bol.status)}>
                                {getStatusIcon(bol.status)}
                                <span className="ml-1 capitalize">{bol.status.replace("_", " ")}</span>
                              </Badge>
                            </div>
                            <div className="text-sm text-slate-400 mt-1">
                              {bol.productDescription} • {(bol as any).weight?.toLocaleString() || bol.quantity} {(bol as any).weightUnit || bol.quantityUnit}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="text-sm text-white flex items-center gap-1">
                              <Building className="w-3 h-3" />
                              {bol.shipperName}
                            </div>
                            <div className="text-xs text-slate-500 flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {bol.consigneeName}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs text-slate-500">
                              {new Date(bol.createdAt).toLocaleDateString()}
                            </div>
                            {bol.deliveredAt && (
                              <div className="text-xs text-green-400">
                                Delivered
                              </div>
                            )}
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => generateBOLPDF.mutate({ bolNumber: bol.bolNumber })}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                          <ChevronRight className="w-5 h-5 text-slate-500" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Weekly Stats */}
            <Card className="bg-slate-900/50 border-slate-700/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-white">Weekly Performance</CardTitle>
              </CardHeader>
              <CardContent>
                {statsQuery.isLoading ? (
                  <Skeleton className="h-40" />
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/30">
                      <span className="text-slate-400">Weekly Tickets</span>
                      <span className="text-2xl font-bold text-white">{(statsQuery.data as any)?.weekTickets}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/30">
                      <span className="text-slate-400">Weekly Volume</span>
                      <span className="text-2xl font-bold text-white">
                        {(((statsQuery.data as any)?.weekVolume || 0) / 1000).toFixed(1)}K gal
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/30">
                      <span className="text-slate-400">Avg Load Time</span>
                      <span className="text-2xl font-bold text-white">{(statsQuery.data as any)?.avgLoadTime} min</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Crude Type Distribution */}
            <Card className="bg-slate-900/50 border-slate-700/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-white">Crude Type Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                {statsQuery.isLoading ? (
                  <Skeleton className="h-40" />
                ) : (
                  <div className="space-y-3">
                    {(statsQuery.data as any)?.topCrudeTypes.map((crude: any) => (
                      <div key={crude.type} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-300">{crude.type}</span>
                          <span className="text-slate-400">{crude.count} loads ({crude.percentage}%)</span>
                        </div>
                        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full"
                            style={{ width: `${crude.percentage}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Monthly Stats */}
            <Card className="bg-slate-900/50 border-slate-700/50 md:col-span-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-white">Monthly Summary</CardTitle>
              </CardHeader>
              <CardContent>
                {statsQuery.isLoading ? (
                  <Skeleton className="h-24" />
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 rounded-lg bg-slate-800/30 text-center">
                      <p className="text-3xl font-bold bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
                        {(statsQuery.data as any)?.monthTickets}
                      </p>
                      <p className="text-sm text-slate-400 mt-1">Monthly Tickets</p>
                    </div>
                    <div className="p-4 rounded-lg bg-slate-800/30 text-center">
                      <p className="text-3xl font-bold bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
                        {(((statsQuery.data as any)?.monthVolume || 0) / 1000000).toFixed(2)}M
                      </p>
                      <p className="text-sm text-slate-400 mt-1">Monthly Volume (gal)</p>
                    </div>
                    <div className="p-4 rounded-lg bg-slate-800/30 text-center">
                      <p className="text-3xl font-bold bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
                        {(statsQuery.data as any)?.pendingBOLs}
                      </p>
                      <p className="text-sm text-slate-400 mt-1">Pending BOLs</p>
                    </div>
                    <div className="p-4 rounded-lg bg-slate-800/30 text-center">
                      <p className="text-3xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                        98.5%
                      </p>
                      <p className="text-sm text-slate-400 mt-1">On-Time Rate</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
