/**
 * LOAD DETAILS PAGE
 * Comprehensive load management and tracking view
 * Based on 01_SHIPPER_USER_JOURNEY.md and 02_CARRIER_USER_JOURNEY.md
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Truck, MapPin, Clock, Calendar, DollarSign, FileText, User,
  Phone, Mail, Package, AlertTriangle, CheckCircle, Navigation,
  Thermometer, Droplets, Shield, ExternalLink, MessageSquare,
  Camera, Edit, Share2, Download, MoreVertical, ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface LoadStop {
  id: string;
  type: "pickup" | "delivery";
  status: "pending" | "arrived" | "loading" | "completed";
  facilityName: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  scheduledTime: string;
  actualTime?: string;
  contact: { name: string; phone: string };
  notes?: string;
}

interface LoadDocument {
  id: string;
  type: string;
  name: string;
  uploadedAt: string;
  uploadedBy: string;
}

interface LoadEvent {
  id: string;
  type: string;
  description: string;
  timestamp: string;
  location?: string;
  user?: string;
}

export default function LoadDetails() {
  const [activeTab, setActiveTab] = useState("overview");

  // Mock load data - would come from route params and tRPC
  const load = {
    id: "LOAD-45850",
    status: "in_transit",
    hazmat: true,
    hazmatClass: "Class 3 - Flammable Liquids",
    unNumber: "UN1203",
    product: "Gasoline",
    quantity: "8,500 gallons",
    weight: "52,000 lbs",
    equipment: "MC-306 Tanker",
    rate: 2850,
    ratePerMile: 3.25,
    distance: 877,
    createdAt: "2025-01-20T08:00:00Z",
    shipper: {
      name: "Shell Oil Company",
      contact: "John Smith",
      phone: "(555) 123-4567",
      email: "john.smith@shell.com",
    },
    carrier: {
      name: "ABC Transport LLC",
      mcNumber: "MC-123456",
      contact: "Sarah Williams",
      phone: "(555) 987-6543",
      email: "sarah@abctransport.com",
    },
    driver: {
      name: "Mike Johnson",
      phone: "(555) 456-7890",
      cdlNumber: "TX-12345678",
      truckNumber: "TRK-4521",
      trailerNumber: "TRL-8892",
    },
    tracking: {
      currentLocation: "I-45 N near Corsicana, TX",
      lastUpdate: "2025-01-23T14:30:00Z",
      eta: "2025-01-23T16:30:00Z",
      progress: 65,
      speed: 62,
      heading: "North",
    },
    temperature: {
      current: 72,
      min: 65,
      max: 85,
      unit: "F",
    },
  };

  const stops: LoadStop[] = [
    {
      id: "stop_001",
      type: "pickup",
      status: "completed",
      facilityName: "Shell Terminal - Houston",
      address: "1234 Terminal Road",
      city: "Houston",
      state: "TX",
      zip: "77001",
      scheduledTime: "2025-01-23T09:00:00Z",
      actualTime: "2025-01-23T09:15:00Z",
      contact: { name: "Terminal Dispatch", phone: "(555) 111-2222" },
      notes: "Gate code: 4521",
    },
    {
      id: "stop_002",
      type: "delivery",
      status: "pending",
      facilityName: "Love's Travel Stop #245",
      address: "5678 Highway 45",
      city: "Dallas",
      state: "TX",
      zip: "75201",
      scheduledTime: "2025-01-23T16:00:00Z",
      contact: { name: "Store Manager", phone: "(555) 333-4444" },
      notes: "Deliver to underground tanks",
    },
  ];

  const documents: LoadDocument[] = [
    { id: "doc_001", type: "BOL", name: "Bill of Lading - BOL-2025-4521", uploadedAt: "2025-01-23T09:30:00Z", uploadedBy: "Mike Johnson" },
    { id: "doc_002", type: "POD", name: "Proof of Delivery (Pending)", uploadedAt: "", uploadedBy: "" },
    { id: "doc_003", type: "Inspection", name: "Pre-Trip Inspection Report", uploadedAt: "2025-01-23T08:00:00Z", uploadedBy: "Mike Johnson" },
    { id: "doc_004", type: "Permit", name: "Hazmat Permit - Texas", uploadedAt: "2025-01-20T10:00:00Z", uploadedBy: "System" },
  ];

  const events: LoadEvent[] = [
    { id: "evt_001", type: "status", description: "Load created", timestamp: "2025-01-20T08:00:00Z", user: "John Smith" },
    { id: "evt_002", type: "status", description: "Carrier assigned - ABC Transport LLC", timestamp: "2025-01-20T14:30:00Z", user: "System" },
    { id: "evt_003", type: "status", description: "Driver assigned - Mike Johnson", timestamp: "2025-01-22T16:00:00Z", user: "Sarah Williams" },
    { id: "evt_004", type: "tracking", description: "Driver en route to pickup", timestamp: "2025-01-23T08:30:00Z", location: "Houston, TX" },
    { id: "evt_005", type: "tracking", description: "Arrived at pickup", timestamp: "2025-01-23T09:15:00Z", location: "Shell Terminal - Houston" },
    { id: "evt_006", type: "document", description: "BOL uploaded", timestamp: "2025-01-23T09:30:00Z", user: "Mike Johnson" },
    { id: "evt_007", type: "tracking", description: "Loading complete - Departed", timestamp: "2025-01-23T10:00:00Z", location: "Shell Terminal - Houston" },
    { id: "evt_008", type: "tracking", description: "GPS update", timestamp: "2025-01-23T14:30:00Z", location: "I-45 N near Corsicana, TX" },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-slate-500/20 text-slate-400";
      case "assigned": return "bg-blue-500/20 text-blue-400";
      case "in_transit": return "bg-green-500/20 text-green-400";
      case "at_pickup": return "bg-yellow-500/20 text-yellow-400";
      case "at_delivery": return "bg-purple-500/20 text-purple-400";
      case "delivered": return "bg-green-500/20 text-green-400";
      case "completed": return "bg-green-500/20 text-green-400";
      default: return "bg-slate-500/20 text-slate-400";
    }
  };

  const getStopStatusIcon = (status: string) => {
    switch (status) {
      case "completed": return <CheckCircle className="w-5 h-5 text-green-400" />;
      case "arrived": case "loading": return <Clock className="w-5 h-5 text-yellow-400" />;
      default: return <MapPin className="w-5 h-5 text-slate-400" />;
    }
  };

  const formatTime = (timestamp: string) => {
    if (!timestamp) return "-";
    return new Date(timestamp).toLocaleString([], {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white">{load.id}</h1>
            <Badge className={getStatusColor(load.status)}>
              {load.status.replace("_", " ")}
            </Badge>
            {load.hazmat && (
              <Badge className="bg-orange-500/20 text-orange-400">
                <AlertTriangle className="w-3 h-3 mr-1" />
                HAZMAT
              </Badge>
            )}
          </div>
          <p className="text-slate-400 mt-1">
            {load.product} - {load.quantity}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="border-slate-600">
            <MessageSquare className="w-4 h-4 mr-2" />
            Message
          </Button>
          <Button variant="outline" size="sm" className="border-slate-600">
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
          <Button variant="outline" size="sm" className="border-slate-600">
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
        </div>
      </div>

      {/* Progress & ETA */}
      <Card className="bg-gradient-to-r from-green-500/10 to-blue-500/10 border-green-500/30">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-green-500/20">
                <Truck className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <p className="text-white font-medium">In Transit</p>
                <p className="text-sm text-slate-400">{load.tracking.currentLocation}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-400">Estimated Arrival</p>
              <p className="text-2xl font-bold text-green-400">
                {new Date(load.tracking.eta).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
          </div>
          <Progress value={load.tracking.progress} className="h-3 bg-slate-700" />
          <div className="flex justify-between mt-2 text-xs text-slate-400">
            <span>Houston, TX</span>
            <span>{load.tracking.progress}% Complete</span>
            <span>Dallas, TX</span>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <DollarSign className="w-8 h-8 text-green-400" />
              <div>
                <p className="text-2xl font-bold text-green-400">${load.rate.toLocaleString()}</p>
                <p className="text-xs text-slate-400">${load.ratePerMile}/mi</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Navigation className="w-8 h-8 text-blue-400" />
              <div>
                <p className="text-2xl font-bold text-blue-400">{load.distance}</p>
                <p className="text-xs text-slate-400">Miles</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Package className="w-8 h-8 text-purple-400" />
              <div>
                <p className="text-2xl font-bold text-purple-400">{load.weight}</p>
                <p className="text-xs text-slate-400">Total Weight</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Thermometer className="w-8 h-8 text-orange-400" />
              <div>
                <p className="text-2xl font-bold text-orange-400">{load.temperature.current}°F</p>
                <p className="text-xs text-slate-400">Product Temp</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-slate-800 border border-slate-700">
          <TabsTrigger value="overview" className="data-[state=active]:bg-blue-600">Overview</TabsTrigger>
          <TabsTrigger value="stops" className="data-[state=active]:bg-blue-600">Stops</TabsTrigger>
          <TabsTrigger value="documents" className="data-[state=active]:bg-blue-600">Documents</TabsTrigger>
          <TabsTrigger value="tracking" className="data-[state=active]:bg-blue-600">Tracking</TabsTrigger>
          <TabsTrigger value="history" className="data-[state=active]:bg-blue-600">History</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Shipper Info */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2 text-base">
                  <Package className="w-4 h-4 text-blue-400" />
                  Shipper
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-white font-medium">{load.shipper.name}</p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-slate-400">
                    <User className="w-4 h-4" />
                    {load.shipper.contact}
                  </div>
                  <div className="flex items-center gap-2 text-slate-400">
                    <Phone className="w-4 h-4" />
                    {load.shipper.phone}
                  </div>
                  <div className="flex items-center gap-2 text-slate-400">
                    <Mail className="w-4 h-4" />
                    {load.shipper.email}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Carrier Info */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2 text-base">
                  <Truck className="w-4 h-4 text-green-400" />
                  Carrier
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-white font-medium">{load.carrier.name}</p>
                  <Badge className="bg-slate-500/20 text-slate-400">{load.carrier.mcNumber}</Badge>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-slate-400">
                    <User className="w-4 h-4" />
                    {load.carrier.contact}
                  </div>
                  <div className="flex items-center gap-2 text-slate-400">
                    <Phone className="w-4 h-4" />
                    {load.carrier.phone}
                  </div>
                  <div className="flex items-center gap-2 text-slate-400">
                    <Mail className="w-4 h-4" />
                    {load.carrier.email}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Driver Info */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2 text-base">
                  <User className="w-4 h-4 text-purple-400" />
                  Driver
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-white font-medium">{load.driver.name}</p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Phone className="w-4 h-4" />
                    {load.driver.phone}
                  </div>
                  <div className="flex items-center gap-2 text-slate-400">
                    <FileText className="w-4 h-4" />
                    CDL: {load.driver.cdlNumber}
                  </div>
                  <div className="flex items-center gap-2 text-slate-400">
                    <Truck className="w-4 h-4" />
                    {load.driver.truckNumber} / {load.driver.trailerNumber}
                  </div>
                </div>
                <Button variant="outline" size="sm" className="w-full border-slate-600 mt-2">
                  <Phone className="w-4 h-4 mr-2" />
                  Call Driver
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Hazmat Info */}
          {load.hazmat && (
            <Card className="mt-6 bg-orange-500/10 border-orange-500/30">
              <CardHeader>
                <CardTitle className="text-orange-400 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Hazmat Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-slate-500">Classification</p>
                    <p className="text-white font-medium">{load.hazmatClass}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">UN Number</p>
                    <p className="text-white font-medium">{load.unNumber}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Product</p>
                    <p className="text-white font-medium">{load.product}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Equipment</p>
                    <p className="text-white font-medium">{load.equipment}</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="mt-4 border-orange-500/50 text-orange-400">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View ERG 2024 Guide
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Stops Tab */}
        <TabsContent value="stops" className="mt-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6">
              <div className="space-y-6">
                {stops.map((stop, idx) => (
                  <div key={stop.id}>
                    <div className="flex items-start gap-4">
                      <div className="flex flex-col items-center">
                        <div className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center",
                          stop.status === "completed" ? "bg-green-500/20" : "bg-slate-700"
                        )}>
                          {getStopStatusIcon(stop.status)}
                        </div>
                        {idx < stops.length - 1 && (
                          <div className="w-0.5 h-16 bg-slate-700 mt-2" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div>
                            <Badge className={cn(
                              stop.type === "pickup" ? "bg-blue-500/20 text-blue-400" : "bg-purple-500/20 text-purple-400"
                            )}>
                              {stop.type}
                            </Badge>
                            <h3 className="text-white font-medium mt-2">{stop.facilityName}</h3>
                            <p className="text-sm text-slate-400">
                              {stop.address}, {stop.city}, {stop.state} {stop.zip}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-slate-500">Scheduled</p>
                            <p className="text-white">{formatTime(stop.scheduledTime)}</p>
                            {stop.actualTime && (
                              <>
                                <p className="text-xs text-slate-500 mt-1">Actual</p>
                                <p className="text-green-400">{formatTime(stop.actualTime)}</p>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="mt-3 flex items-center gap-4 text-sm">
                          <span className="text-slate-400 flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {stop.contact.name}
                          </span>
                          <span className="text-slate-400 flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {stop.contact.phone}
                          </span>
                        </div>
                        {stop.notes && (
                          <p className="text-xs text-yellow-400 mt-2">Note: {stop.notes}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents" className="mt-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white">Documents</CardTitle>
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                  <Camera className="w-4 h-4 mr-2" />
                  Upload
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-slate-700/30"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-slate-600">
                        <FileText className="w-5 h-5 text-slate-300" />
                      </div>
                      <div>
                        <p className="text-white font-medium">{doc.name}</p>
                        <p className="text-xs text-slate-500">
                          {doc.uploadedAt ? `Uploaded by ${doc.uploadedBy} on ${formatTime(doc.uploadedAt)}` : "Not uploaded"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={cn(
                        doc.uploadedAt ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"
                      )}>
                        {doc.uploadedAt ? "Uploaded" : "Pending"}
                      </Badge>
                      {doc.uploadedAt && (
                        <Button variant="ghost" size="sm">
                          <Download className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tracking Tab */}
        <TabsContent value="tracking" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Live Tracking</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 bg-slate-700/30 rounded-lg flex items-center justify-center">
                  <p className="text-slate-500">Map view would display here</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Current Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-slate-400">Location</span>
                  <span className="text-white text-right text-sm">{load.tracking.currentLocation}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Speed</span>
                  <span className="text-white">{load.tracking.speed} mph</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Heading</span>
                  <span className="text-white">{load.tracking.heading}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Last Update</span>
                  <span className="text-white">{formatTime(load.tracking.lastUpdate)}</span>
                </div>
                <Separator className="bg-slate-700" />
                <div className="flex justify-between">
                  <span className="text-slate-400">Temperature</span>
                  <span className={cn(
                    "font-medium",
                    load.temperature.current >= load.temperature.min && load.temperature.current <= load.temperature.max
                      ? "text-green-400"
                      : "text-red-400"
                  )}>
                    {load.temperature.current}°{load.temperature.unit}
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Range: {load.temperature.min}° - {load.temperature.max}°{load.temperature.unit}
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="mt-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Activity History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {events.slice().reverse().map((event) => (
                  <div key={event.id} className="flex items-start gap-4">
                    <div className="w-2 h-2 rounded-full bg-blue-400 mt-2" />
                    <div className="flex-1">
                      <p className="text-white">{event.description}</p>
                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                        <span>{formatTime(event.timestamp)}</span>
                        {event.location && <span>{event.location}</span>}
                        {event.user && <span>by {event.user}</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
