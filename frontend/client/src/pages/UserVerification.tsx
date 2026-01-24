/**
 * USER VERIFICATION WORKFLOW
 * Admin interface for verifying users and companies
 * Based on 10_ADMIN_USER_JOURNEY.md
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  User, Building, CheckCircle, XCircle, Clock, Search,
  Eye, FileText, Shield, Phone, Mail, MapPin, Calendar,
  AlertTriangle, ExternalLink, ChevronRight, Filter, X,
  Truck, Award, Globe, CreditCard
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type VerificationStatus = "pending" | "in_review" | "approved" | "rejected" | "more_info_needed";
type EntityType = "user" | "company";
type UserRole = "shipper" | "carrier" | "broker" | "driver" | "escort" | "terminal_manager";

interface VerificationDocument {
  id: string;
  name: string;
  type: string;
  uploadedAt: string;
  status: "pending" | "verified" | "rejected";
  url?: string;
}

interface VerificationRequest {
  id: string;
  entityType: EntityType;
  status: VerificationStatus;
  submittedAt: string;
  updatedAt: string;
  assignedTo?: string;
  
  // User Info
  userId: string;
  userName: string;
  userEmail: string;
  userPhone: string;
  userRole: UserRole;
  
  // Company Info (if applicable)
  companyName?: string;
  companyType?: string;
  mcNumber?: string;
  dotNumber?: string;
  ein?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };
  
  // Verification Items
  documents: VerificationDocument[];
  saferVerified?: boolean;
  insuranceVerified?: boolean;
  backgroundCheckStatus?: "pending" | "clear" | "flagged";
  
  // Notes
  internalNotes?: string;
  rejectionReason?: string;
}

const MOCK_REQUESTS: VerificationRequest[] = [
  {
    id: "ver_001",
    entityType: "company",
    status: "pending",
    submittedAt: "2025-01-23T10:30:00",
    updatedAt: "2025-01-23T10:30:00",
    userId: "user_101",
    userName: "John Martinez",
    userEmail: "john@texashaulers.com",
    userPhone: "(713) 555-0199",
    userRole: "carrier",
    companyName: "Texas Haulers LLC",
    companyType: "Carrier",
    mcNumber: "MC-987654",
    dotNumber: "DOT-123456",
    ein: "12-3456789",
    address: {
      street: "4500 Industrial Blvd",
      city: "Houston",
      state: "TX",
      zip: "77001",
    },
    documents: [
      { id: "doc_001", name: "MC Authority Letter", type: "authority", uploadedAt: "2025-01-23T10:30:00", status: "pending" },
      { id: "doc_002", name: "Insurance Certificate", type: "insurance", uploadedAt: "2025-01-23T10:30:00", status: "pending" },
      { id: "doc_003", name: "W-9 Form", type: "tax", uploadedAt: "2025-01-23T10:30:00", status: "pending" },
    ],
    saferVerified: false,
    insuranceVerified: false,
  },
  {
    id: "ver_002",
    entityType: "user",
    status: "in_review",
    submittedAt: "2025-01-22T15:45:00",
    updatedAt: "2025-01-23T09:00:00",
    assignedTo: "Admin User",
    userId: "user_102",
    userName: "Sarah Chen",
    userEmail: "sarah@quickship.com",
    userPhone: "(214) 555-0234",
    userRole: "shipper",
    companyName: "QuickShip Distribution",
    documents: [
      { id: "doc_004", name: "Business License", type: "license", uploadedAt: "2025-01-22T15:45:00", status: "verified" },
      { id: "doc_005", name: "Photo ID", type: "identity", uploadedAt: "2025-01-22T15:45:00", status: "pending" },
    ],
    backgroundCheckStatus: "clear",
  },
  {
    id: "ver_003",
    entityType: "user",
    status: "more_info_needed",
    submittedAt: "2025-01-21T11:20:00",
    updatedAt: "2025-01-22T14:30:00",
    userId: "user_103",
    userName: "Mike Thompson",
    userEmail: "mike.t@gmail.com",
    userPhone: "(512) 555-0876",
    userRole: "driver",
    documents: [
      { id: "doc_006", name: "CDL Copy", type: "license", uploadedAt: "2025-01-21T11:20:00", status: "rejected" },
      { id: "doc_007", name: "Medical Card", type: "medical", uploadedAt: "2025-01-21T11:20:00", status: "verified" },
    ],
    backgroundCheckStatus: "pending",
    internalNotes: "CDL image is blurry, requested new upload",
  },
  {
    id: "ver_004",
    entityType: "company",
    status: "approved",
    submittedAt: "2025-01-20T09:00:00",
    updatedAt: "2025-01-21T16:00:00",
    userId: "user_104",
    userName: "Lisa Wang",
    userEmail: "lisa@premiumbrokers.com",
    userPhone: "(469) 555-0345",
    userRole: "broker",
    companyName: "Premium Freight Brokers",
    companyType: "Broker",
    mcNumber: "MC-456789",
    ein: "98-7654321",
    address: {
      street: "2100 Commerce St",
      city: "Dallas",
      state: "TX",
      zip: "75201",
    },
    documents: [
      { id: "doc_008", name: "Broker Authority", type: "authority", uploadedAt: "2025-01-20T09:00:00", status: "verified" },
      { id: "doc_009", name: "Surety Bond", type: "bond", uploadedAt: "2025-01-20T09:00:00", status: "verified" },
      { id: "doc_010", name: "W-9 Form", type: "tax", uploadedAt: "2025-01-20T09:00:00", status: "verified" },
    ],
    saferVerified: true,
    insuranceVerified: true,
  },
  {
    id: "ver_005",
    entityType: "user",
    status: "rejected",
    submittedAt: "2025-01-19T14:15:00",
    updatedAt: "2025-01-20T10:30:00",
    userId: "user_105",
    userName: "Robert Smith",
    userEmail: "rsmith@email.com",
    userPhone: "(281) 555-0567",
    userRole: "escort",
    documents: [
      { id: "doc_011", name: "State Certification", type: "certification", uploadedAt: "2025-01-19T14:15:00", status: "rejected" },
    ],
    backgroundCheckStatus: "flagged",
    rejectionReason: "Background check revealed disqualifying offense. Certification document expired.",
  },
];

const STATUS_CONFIG: Record<VerificationStatus, { color: string; label: string; icon: React.ElementType }> = {
  pending: { color: "bg-yellow-500/20 text-yellow-400", label: "Pending", icon: Clock },
  in_review: { color: "bg-blue-500/20 text-blue-400", label: "In Review", icon: Eye },
  approved: { color: "bg-green-500/20 text-green-400", label: "Approved", icon: CheckCircle },
  rejected: { color: "bg-red-500/20 text-red-400", label: "Rejected", icon: XCircle },
  more_info_needed: { color: "bg-orange-500/20 text-orange-400", label: "More Info Needed", icon: AlertTriangle },
};

const ROLE_CONFIG: Record<UserRole, { color: string; label: string }> = {
  shipper: { color: "bg-cyan-500/20 text-cyan-400", label: "Shipper" },
  carrier: { color: "bg-orange-500/20 text-orange-400", label: "Carrier" },
  broker: { color: "bg-purple-500/20 text-purple-400", label: "Broker" },
  driver: { color: "bg-green-500/20 text-green-400", label: "Driver" },
  escort: { color: "bg-blue-500/20 text-blue-400", label: "Escort" },
  terminal_manager: { color: "bg-red-500/20 text-red-400", label: "Terminal Manager" },
};

export default function UserVerification() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<VerificationRequest[]>(MOCK_REQUESTS);
  const [selectedRequest, setSelectedRequest] = useState<VerificationRequest | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const getStatusCounts = () => {
    return {
      pending: requests.filter(r => r.status === "pending").length,
      in_review: requests.filter(r => r.status === "in_review").length,
      more_info: requests.filter(r => r.status === "more_info_needed").length,
      approved: requests.filter(r => r.status === "approved").length,
      rejected: requests.filter(r => r.status === "rejected").length,
    };
  };

  const counts = getStatusCounts();

  const filteredRequests = requests.filter(req => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!req.userName.toLowerCase().includes(q) && 
          !req.userEmail.toLowerCase().includes(q) &&
          !(req.companyName?.toLowerCase().includes(q))) {
        return false;
      }
    }
    if (filterStatus !== "all" && req.status !== filterStatus) return false;
    if (filterType !== "all" && req.entityType !== filterType) return false;
    return true;
  });

  const handleApprove = (reqId: string) => {
    setRequests(prev => prev.map(req => 
      req.id === reqId ? { ...req, status: "approved" as VerificationStatus, updatedAt: new Date().toISOString() } : req
    ));
    toast.success("Verification approved");
    setSelectedRequest(null);
  };

  const handleReject = (reqId: string, reason: string) => {
    setRequests(prev => prev.map(req => 
      req.id === reqId ? { 
        ...req, 
        status: "rejected" as VerificationStatus, 
        updatedAt: new Date().toISOString(),
        rejectionReason: reason
      } : req
    ));
    toast.info("Verification rejected");
    setSelectedRequest(null);
  };

  const handleRequestMoreInfo = (reqId: string) => {
    setRequests(prev => prev.map(req => 
      req.id === reqId ? { ...req, status: "more_info_needed" as VerificationStatus, updatedAt: new Date().toISOString() } : req
    ));
    toast.info("Request for more information sent");
    setSelectedRequest(null);
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">User Verification</h1>
          <p className="text-slate-400 text-sm">Review and verify user and company registrations</p>
        </div>
        <Badge className="bg-yellow-500/20 text-yellow-400 text-lg px-4 py-2">
          {counts.pending + counts.in_review} Pending Review
        </Badge>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-yellow-500/10 border-yellow-500/30 cursor-pointer" onClick={() => setFilterStatus("pending")}>
          <CardContent className="p-4 text-center">
            <Clock className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-yellow-400">{counts.pending}</p>
            <p className="text-xs text-yellow-500/70">Pending</p>
          </CardContent>
        </Card>
        <Card className="bg-blue-500/10 border-blue-500/30 cursor-pointer" onClick={() => setFilterStatus("in_review")}>
          <CardContent className="p-4 text-center">
            <Eye className="w-6 h-6 text-blue-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-blue-400">{counts.in_review}</p>
            <p className="text-xs text-blue-500/70">In Review</p>
          </CardContent>
        </Card>
        <Card className="bg-orange-500/10 border-orange-500/30 cursor-pointer" onClick={() => setFilterStatus("more_info_needed")}>
          <CardContent className="p-4 text-center">
            <AlertTriangle className="w-6 h-6 text-orange-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-orange-400">{counts.more_info}</p>
            <p className="text-xs text-orange-500/70">More Info</p>
          </CardContent>
        </Card>
        <Card className="bg-green-500/10 border-green-500/30 cursor-pointer" onClick={() => setFilterStatus("approved")}>
          <CardContent className="p-4 text-center">
            <CheckCircle className="w-6 h-6 text-green-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-green-400">{counts.approved}</p>
            <p className="text-xs text-green-500/70">Approved</p>
          </CardContent>
        </Card>
        <Card className="bg-red-500/10 border-red-500/30 cursor-pointer" onClick={() => setFilterStatus("rejected")}>
          <CardContent className="p-4 text-center">
            <XCircle className="w-6 h-6 text-red-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-red-400">{counts.rejected}</p>
            <p className="text-xs text-red-500/70">Rejected</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name, email, or company..."
                  className="pl-10 bg-slate-700/50 border-slate-600"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="p-2 rounded-md bg-slate-700/50 border border-slate-600 text-white text-sm"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="in_review">In Review</option>
                <option value="more_info_needed">More Info Needed</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="p-2 rounded-md bg-slate-700/50 border border-slate-600 text-white text-sm"
              >
                <option value="all">All Types</option>
                <option value="user">Users</option>
                <option value="company">Companies</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Requests List */}
      <div className="space-y-4">
        {filteredRequests.map((req) => {
          const StatusIcon = STATUS_CONFIG[req.status].icon;
          return (
            <Card 
              key={req.id}
              className={cn(
                "bg-slate-800/50 border-slate-700 cursor-pointer transition-colors hover:border-slate-500",
                req.status === "pending" && "border-l-4 border-l-yellow-500",
                req.status === "in_review" && "border-l-4 border-l-blue-500",
                req.status === "more_info_needed" && "border-l-4 border-l-orange-500"
              )}
              onClick={() => setSelectedRequest(req)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center",
                      req.entityType === "company" ? "bg-purple-500/20" : "bg-blue-500/20"
                    )}>
                      {req.entityType === "company" ? (
                        <Building className="w-6 h-6 text-purple-400" />
                      ) : (
                        <User className="w-6 h-6 text-blue-400" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-white font-bold">{req.userName}</h3>
                        <Badge className={ROLE_CONFIG[req.userRole].color}>
                          {ROLE_CONFIG[req.userRole].label}
                        </Badge>
                      </div>
                      {req.companyName && (
                        <p className="text-slate-400 text-sm">{req.companyName}</p>
                      )}
                      <p className="text-slate-500 text-xs">{req.userEmail}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {/* Verification Indicators */}
                    {req.entityType === "company" && (
                      <div className="flex gap-2">
                        {req.saferVerified !== undefined && (
                          <Badge className={req.saferVerified ? "bg-green-500/20 text-green-400" : "bg-slate-500/20 text-slate-400"}>
                            SAFER {req.saferVerified ? "OK" : "..."}
                          </Badge>
                        )}
                        {req.insuranceVerified !== undefined && (
                          <Badge className={req.insuranceVerified ? "bg-green-500/20 text-green-400" : "bg-slate-500/20 text-slate-400"}>
                            Insurance {req.insuranceVerified ? "OK" : "..."}
                          </Badge>
                        )}
                      </div>
                    )}
                    {req.backgroundCheckStatus && (
                      <Badge className={cn(
                        req.backgroundCheckStatus === "clear" ? "bg-green-500/20 text-green-400" :
                        req.backgroundCheckStatus === "flagged" ? "bg-red-500/20 text-red-400" :
                        "bg-yellow-500/20 text-yellow-400"
                      )}>
                        BG: {req.backgroundCheckStatus.charAt(0).toUpperCase() + req.backgroundCheckStatus.slice(1)}
                      </Badge>
                    )}

                    <div className="text-right">
                      <Badge className={STATUS_CONFIG[req.status].color}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {STATUS_CONFIG[req.status].label}
                      </Badge>
                      <p className="text-xs text-slate-500 mt-1">
                        {new Date(req.submittedAt).toLocaleDateString()}
                      </p>
                    </div>

                    <ChevronRight className="w-5 h-5 text-slate-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Request Detail Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <Card className="bg-slate-800 border-slate-700 w-full max-w-3xl max-h-[90vh] overflow-hidden">
            <CardHeader className="border-b border-slate-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center",
                    selectedRequest.entityType === "company" ? "bg-purple-500/20" : "bg-blue-500/20"
                  )}>
                    {selectedRequest.entityType === "company" ? (
                      <Building className="w-6 h-6 text-purple-400" />
                    ) : (
                      <User className="w-6 h-6 text-blue-400" />
                    )}
                  </div>
                  <div>
                    <CardTitle className="text-white">{selectedRequest.userName}</CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge className={ROLE_CONFIG[selectedRequest.userRole].color}>
                        {ROLE_CONFIG[selectedRequest.userRole].label}
                      </Badge>
                      <Badge className={STATUS_CONFIG[selectedRequest.status].color}>
                        {STATUS_CONFIG[selectedRequest.status].label}
                      </Badge>
                    </div>
                  </div>
                </div>
                <Button variant="ghost" onClick={() => setSelectedRequest(null)}>
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6 overflow-y-auto max-h-[calc(90vh-100px)] space-y-6">
              {/* Contact Info */}
              <div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-slate-700/30">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-slate-400" />
                  <span className="text-white">{selectedRequest.userEmail}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-slate-400" />
                  <span className="text-white">{selectedRequest.userPhone}</span>
                </div>
                {selectedRequest.address && (
                  <div className="col-span-2 flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-slate-400 mt-1" />
                    <span className="text-white">
                      {selectedRequest.address.street}, {selectedRequest.address.city}, {selectedRequest.address.state} {selectedRequest.address.zip}
                    </span>
                  </div>
                )}
              </div>

              {/* Company Info */}
              {selectedRequest.entityType === "company" && (
                <div className="p-4 rounded-lg bg-slate-700/30">
                  <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                    <Building className="w-4 h-4 text-purple-400" />
                    Company Information
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-slate-500">Company Name</p>
                      <p className="text-white">{selectedRequest.companyName}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Company Type</p>
                      <p className="text-white">{selectedRequest.companyType}</p>
                    </div>
                    {selectedRequest.mcNumber && (
                      <div>
                        <p className="text-slate-500">MC Number</p>
                        <p className="text-white">{selectedRequest.mcNumber}</p>
                      </div>
                    )}
                    {selectedRequest.dotNumber && (
                      <div>
                        <p className="text-slate-500">DOT Number</p>
                        <p className="text-white">{selectedRequest.dotNumber}</p>
                      </div>
                    )}
                    {selectedRequest.ein && (
                      <div>
                        <p className="text-slate-500">EIN</p>
                        <p className="text-white">{selectedRequest.ein}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Verification Checks */}
              <div className="p-4 rounded-lg bg-slate-700/30">
                <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-green-400" />
                  Verification Checks
                </h4>
                <div className="grid grid-cols-3 gap-4">
                  {selectedRequest.saferVerified !== undefined && (
                    <div className={cn(
                      "p-3 rounded-lg text-center",
                      selectedRequest.saferVerified ? "bg-green-500/10" : "bg-slate-600/30"
                    )}>
                      <Truck className={cn("w-6 h-6 mx-auto mb-1", selectedRequest.saferVerified ? "text-green-400" : "text-slate-400")} />
                      <p className="text-sm text-white">SAFER</p>
                      <Badge className={selectedRequest.saferVerified ? "bg-green-500/20 text-green-400" : "bg-slate-500/20 text-slate-400"}>
                        {selectedRequest.saferVerified ? "Verified" : "Pending"}
                      </Badge>
                    </div>
                  )}
                  {selectedRequest.insuranceVerified !== undefined && (
                    <div className={cn(
                      "p-3 rounded-lg text-center",
                      selectedRequest.insuranceVerified ? "bg-green-500/10" : "bg-slate-600/30"
                    )}>
                      <Shield className={cn("w-6 h-6 mx-auto mb-1", selectedRequest.insuranceVerified ? "text-green-400" : "text-slate-400")} />
                      <p className="text-sm text-white">Insurance</p>
                      <Badge className={selectedRequest.insuranceVerified ? "bg-green-500/20 text-green-400" : "bg-slate-500/20 text-slate-400"}>
                        {selectedRequest.insuranceVerified ? "Verified" : "Pending"}
                      </Badge>
                    </div>
                  )}
                  {selectedRequest.backgroundCheckStatus && (
                    <div className={cn(
                      "p-3 rounded-lg text-center",
                      selectedRequest.backgroundCheckStatus === "clear" ? "bg-green-500/10" :
                      selectedRequest.backgroundCheckStatus === "flagged" ? "bg-red-500/10" : "bg-slate-600/30"
                    )}>
                      <User className={cn(
                        "w-6 h-6 mx-auto mb-1",
                        selectedRequest.backgroundCheckStatus === "clear" ? "text-green-400" :
                        selectedRequest.backgroundCheckStatus === "flagged" ? "text-red-400" : "text-slate-400"
                      )} />
                      <p className="text-sm text-white">Background</p>
                      <Badge className={cn(
                        selectedRequest.backgroundCheckStatus === "clear" ? "bg-green-500/20 text-green-400" :
                        selectedRequest.backgroundCheckStatus === "flagged" ? "bg-red-500/20 text-red-400" :
                        "bg-yellow-500/20 text-yellow-400"
                      )}>
                        {selectedRequest.backgroundCheckStatus.charAt(0).toUpperCase() + selectedRequest.backgroundCheckStatus.slice(1)}
                      </Badge>
                    </div>
                  )}
                </div>
              </div>

              {/* Documents */}
              <div>
                <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-400" />
                  Uploaded Documents
                </h4>
                <div className="space-y-2">
                  {selectedRequest.documents.map((doc) => (
                    <div 
                      key={doc.id}
                      className={cn(
                        "p-3 rounded-lg border flex items-center justify-between",
                        doc.status === "verified" ? "border-green-500/30 bg-green-500/5" :
                        doc.status === "rejected" ? "border-red-500/30 bg-red-500/5" :
                        "border-slate-600"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <FileText className={cn(
                          "w-5 h-5",
                          doc.status === "verified" ? "text-green-400" :
                          doc.status === "rejected" ? "text-red-400" : "text-slate-400"
                        )} />
                        <div>
                          <p className="text-white text-sm">{doc.name}</p>
                          <p className="text-xs text-slate-500">
                            Uploaded {new Date(doc.uploadedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={cn(
                          doc.status === "verified" ? "bg-green-500/20 text-green-400" :
                          doc.status === "rejected" ? "bg-red-500/20 text-red-400" :
                          "bg-yellow-500/20 text-yellow-400"
                        )}>
                          {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                        </Badge>
                        <Button variant="ghost" size="sm" className="text-slate-400">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes */}
              {(selectedRequest.internalNotes || selectedRequest.rejectionReason) && (
                <div className={cn(
                  "p-4 rounded-lg",
                  selectedRequest.rejectionReason ? "bg-red-500/10 border border-red-500/30" : "bg-blue-500/10 border border-blue-500/30"
                )}>
                  <h4 className={cn(
                    "font-medium mb-2",
                    selectedRequest.rejectionReason ? "text-red-400" : "text-blue-400"
                  )}>
                    {selectedRequest.rejectionReason ? "Rejection Reason" : "Internal Notes"}
                  </h4>
                  <p className="text-slate-300 text-sm">
                    {selectedRequest.rejectionReason || selectedRequest.internalNotes}
                  </p>
                </div>
              )}

              {/* Actions */}
              {selectedRequest.status !== "approved" && selectedRequest.status !== "rejected" && (
                <div className="flex gap-3 pt-4 border-t border-slate-700">
                  <Button 
                    onClick={() => handleApprove(selectedRequest.id)}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approve
                  </Button>
                  <Button 
                    onClick={() => handleRequestMoreInfo(selectedRequest.id)}
                    variant="outline"
                    className="flex-1 border-orange-500 text-orange-400 hover:bg-orange-500/10"
                  >
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Request More Info
                  </Button>
                  <Button 
                    onClick={() => handleReject(selectedRequest.id, "Application does not meet requirements")}
                    variant="outline"
                    className="flex-1 border-red-500 text-red-400 hover:bg-red-500/10"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Reject
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
