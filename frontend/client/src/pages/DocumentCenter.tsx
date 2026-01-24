/**
 * DOCUMENT CENTER
 * Centralized document management for all file uploads
 * All user roles
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import {
  FileText, Upload, Download, Trash2, Search, Filter,
  Folder, FolderOpen, File, Image, FileSpreadsheet,
  Clock, CheckCircle, AlertTriangle, Eye, MoreHorizontal,
  Plus, Grid, List, SortAsc, Calendar, User, X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type DocumentStatus = "active" | "expired" | "expiring_soon" | "pending_review";
type DocumentCategory = "compliance" | "insurance" | "permits" | "contracts" | "invoices" | "bols" | "other";

interface Document {
  id: string;
  name: string;
  category: DocumentCategory;
  type: string;
  size: number;
  uploadedBy: string;
  uploadedAt: string;
  expirationDate?: string;
  status: DocumentStatus;
  tags: string[];
  description?: string;
  relatedTo?: { type: string; id: string; name: string };
}

const MOCK_DOCUMENTS: Document[] = [
  {
    id: "doc_001",
    name: "MC Authority Letter.pdf",
    category: "permits",
    type: "pdf",
    size: 245000,
    uploadedBy: "John Admin",
    uploadedAt: "2025-01-15T10:30:00",
    status: "active",
    tags: ["authority", "fmcsa"],
    description: "Motor Carrier Authority documentation",
  },
  {
    id: "doc_002",
    name: "Insurance Certificate - Liability.pdf",
    category: "insurance",
    type: "pdf",
    size: 380000,
    uploadedBy: "John Admin",
    uploadedAt: "2025-01-10T14:00:00",
    expirationDate: "2026-01-10",
    status: "active",
    tags: ["insurance", "liability", "certificate"],
    description: "$1M General Liability Coverage",
  },
  {
    id: "doc_003",
    name: "Cargo Insurance Policy.pdf",
    category: "insurance",
    type: "pdf",
    size: 520000,
    uploadedBy: "John Admin",
    uploadedAt: "2025-01-10T14:15:00",
    expirationDate: "2025-02-15",
    status: "expiring_soon",
    tags: ["insurance", "cargo"],
    description: "$100K Cargo Coverage - RENEWAL NEEDED",
  },
  {
    id: "doc_004",
    name: "Driver Mike Johnson - CDL.jpg",
    category: "compliance",
    type: "image",
    size: 180000,
    uploadedBy: "Sarah HR",
    uploadedAt: "2025-01-08T09:00:00",
    expirationDate: "2026-03-15",
    status: "active",
    tags: ["driver", "cdl", "license"],
    relatedTo: { type: "driver", id: "drv_001", name: "Mike Johnson" },
  },
  {
    id: "doc_005",
    name: "Medical Card - Mike Johnson.pdf",
    category: "compliance",
    type: "pdf",
    size: 95000,
    uploadedBy: "Sarah HR",
    uploadedAt: "2023-02-01T11:00:00",
    expirationDate: "2025-02-01",
    status: "expiring_soon",
    tags: ["driver", "medical", "dot"],
    relatedTo: { type: "driver", id: "drv_001", name: "Mike Johnson" },
  },
  {
    id: "doc_006",
    name: "BOL-2025-0845.pdf",
    category: "bols",
    type: "pdf",
    size: 125000,
    uploadedBy: "System",
    uploadedAt: "2025-01-23T12:30:00",
    status: "active",
    tags: ["bol", "delivered"],
    relatedTo: { type: "load", id: "load_45918", name: "Load #45918" },
  },
  {
    id: "doc_007",
    name: "Carrier Agreement - ABC Transport.pdf",
    category: "contracts",
    type: "pdf",
    size: 890000,
    uploadedBy: "Legal Team",
    uploadedAt: "2024-06-15T16:00:00",
    expirationDate: "2025-06-15",
    status: "active",
    tags: ["contract", "carrier", "agreement"],
    relatedTo: { type: "carrier", id: "car_001", name: "ABC Transport" },
  },
  {
    id: "doc_008",
    name: "Invoice-2025-0234.pdf",
    category: "invoices",
    type: "pdf",
    size: 75000,
    uploadedBy: "System",
    uploadedAt: "2025-01-23T09:30:00",
    status: "active",
    tags: ["invoice", "billing"],
    relatedTo: { type: "load", id: "load_45915", name: "Load #45915" },
  },
  {
    id: "doc_009",
    name: "TX Oversize Permit.pdf",
    category: "permits",
    type: "pdf",
    size: 210000,
    uploadedBy: "Operations",
    uploadedAt: "2025-01-05T10:00:00",
    expirationDate: "2025-04-05",
    status: "active",
    tags: ["permit", "oversize", "texas"],
  },
  {
    id: "doc_010",
    name: "Hazmat Registration.pdf",
    category: "permits",
    type: "pdf",
    size: 320000,
    uploadedBy: "Compliance",
    uploadedAt: "2024-10-01T14:00:00",
    expirationDate: "2024-12-31",
    status: "expired",
    tags: ["hazmat", "phmsa", "registration"],
    description: "EXPIRED - Needs immediate renewal",
  },
];

const CATEGORY_CONFIG: Record<DocumentCategory, { label: string; color: string }> = {
  compliance: { label: "Compliance", color: "bg-blue-500/20 text-blue-400" },
  insurance: { label: "Insurance", color: "bg-green-500/20 text-green-400" },
  permits: { label: "Permits", color: "bg-purple-500/20 text-purple-400" },
  contracts: { label: "Contracts", color: "bg-orange-500/20 text-orange-400" },
  invoices: { label: "Invoices", color: "bg-cyan-500/20 text-cyan-400" },
  bols: { label: "BOLs", color: "bg-yellow-500/20 text-yellow-400" },
  other: { label: "Other", color: "bg-slate-500/20 text-slate-400" },
};

const STATUS_CONFIG: Record<DocumentStatus, { label: string; color: string; icon: React.ElementType }> = {
  active: { label: "Active", color: "text-green-400", icon: CheckCircle },
  expired: { label: "Expired", color: "text-red-400", icon: AlertTriangle },
  expiring_soon: { label: "Expiring Soon", color: "text-yellow-400", icon: Clock },
  pending_review: { label: "Pending Review", color: "text-blue-400", icon: Eye },
};

export default function DocumentCenter() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<Document[]>(MOCK_DOCUMENTS);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (type: string) => {
    if (type === "pdf") return FileText;
    if (type === "image" || type === "jpg" || type === "png") return Image;
    if (type === "xlsx" || type === "csv") return FileSpreadsheet;
    return File;
  };

  const filteredDocs = documents.filter(doc => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!doc.name.toLowerCase().includes(q) && 
          !doc.tags.some(t => t.toLowerCase().includes(q)) &&
          !(doc.description?.toLowerCase().includes(q))) {
        return false;
      }
    }
    if (filterCategory !== "all" && doc.category !== filterCategory) return false;
    if (filterStatus !== "all" && doc.status !== filterStatus) return false;
    return true;
  });

  const getStats = () => ({
    total: documents.length,
    expired: documents.filter(d => d.status === "expired").length,
    expiringSoon: documents.filter(d => d.status === "expiring_soon").length,
    storageUsed: documents.reduce((sum, d) => sum + d.size, 0),
  });

  const stats = getStats();

  const deleteDocument = (id: string) => {
    setDocuments(prev => prev.filter(d => d.id !== id));
    toast.success("Document deleted");
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Document Center</h1>
          <p className="text-slate-400 text-sm">Manage all your documents in one place</p>
        </div>
        <Button onClick={() => setShowUploadModal(true)} className="bg-blue-600 hover:bg-blue-700">
          <Upload className="w-4 h-4 mr-2" />
          Upload Document
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-blue-500/20">
              <Folder className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.total}</p>
              <p className="text-xs text-slate-500">Total Documents</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-red-500/10 border-red-500/30">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-red-500/20">
              <AlertTriangle className="w-6 h-6 text-red-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-red-400">{stats.expired}</p>
              <p className="text-xs text-red-500/70">Expired</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-yellow-500/10 border-yellow-500/30">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-yellow-500/20">
              <Clock className="w-6 h-6 text-yellow-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-yellow-400">{stats.expiringSoon}</p>
              <p className="text-xs text-yellow-500/70">Expiring Soon</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-purple-500/20">
              <FileText className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{formatFileSize(stats.storageUsed)}</p>
              <p className="text-xs text-slate-500">Storage Used</p>
            </div>
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
                  placeholder="Search documents..."
                  className="pl-10 bg-slate-700/50 border-slate-600"
                />
              </div>
            </div>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="p-2 rounded-md bg-slate-700/50 border border-slate-600 text-white text-sm"
            >
              <option value="all">All Categories</option>
              {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
                <option key={key} value={key}>{config.label}</option>
              ))}
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="p-2 rounded-md bg-slate-700/50 border border-slate-600 text-white text-sm"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="expiring_soon">Expiring Soon</option>
              <option value="expired">Expired</option>
            </select>
            <div className="flex gap-1 border border-slate-600 rounded-md p-1">
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("list")}
                className={viewMode === "list" ? "bg-slate-700" : ""}
              >
                <List className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === "grid" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("grid")}
                className={viewMode === "grid" ? "bg-slate-700" : ""}
              >
                <Grid className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Document List/Grid */}
      {viewMode === "list" ? (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-0">
            <table className="w-full">
              <thead className="bg-slate-700/30">
                <tr>
                  <th className="text-left text-slate-400 text-xs font-medium p-4">Name</th>
                  <th className="text-left text-slate-400 text-xs font-medium p-4">Category</th>
                  <th className="text-left text-slate-400 text-xs font-medium p-4">Status</th>
                  <th className="text-left text-slate-400 text-xs font-medium p-4">Uploaded</th>
                  <th className="text-left text-slate-400 text-xs font-medium p-4">Expires</th>
                  <th className="text-left text-slate-400 text-xs font-medium p-4">Size</th>
                  <th className="text-right text-slate-400 text-xs font-medium p-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {filteredDocs.map((doc) => {
                  const FileIcon = getFileIcon(doc.type);
                  const StatusIcon = STATUS_CONFIG[doc.status].icon;
                  return (
                    <tr key={doc.id} className="hover:bg-slate-700/20 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <FileIcon className="w-5 h-5 text-slate-400" />
                          <div>
                            <p className="text-white text-sm font-medium">{doc.name}</p>
                            {doc.relatedTo && (
                              <p className="text-xs text-slate-500">{doc.relatedTo.name}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge className={CATEGORY_CONFIG[doc.category].color}>
                          {CATEGORY_CONFIG[doc.category].label}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <div className={cn("flex items-center gap-1 text-sm", STATUS_CONFIG[doc.status].color)}>
                          <StatusIcon className="w-4 h-4" />
                          {STATUS_CONFIG[doc.status].label}
                        </div>
                      </td>
                      <td className="p-4 text-slate-400 text-sm">
                        {new Date(doc.uploadedAt).toLocaleDateString()}
                      </td>
                      <td className="p-4 text-sm">
                        {doc.expirationDate ? (
                          <span className={cn(
                            doc.status === "expired" ? "text-red-400" :
                            doc.status === "expiring_soon" ? "text-yellow-400" : "text-slate-400"
                          )}>
                            {new Date(doc.expirationDate).toLocaleDateString()}
                          </span>
                        ) : (
                          <span className="text-slate-500">--</span>
                        )}
                      </td>
                      <td className="p-4 text-slate-400 text-sm">
                        {formatFileSize(doc.size)}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <Eye className="w-4 h-4 text-slate-400" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <Download className="w-4 h-4 text-slate-400" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0"
                            onClick={() => deleteDocument(doc.id)}
                          >
                            <Trash2 className="w-4 h-4 text-slate-400 hover:text-red-400" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filteredDocs.length === 0 && (
              <div className="p-12 text-center">
                <Folder className="w-12 h-12 text-slate-500 mx-auto mb-3" />
                <p className="text-slate-400">No documents found</p>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredDocs.map((doc) => {
            const FileIcon = getFileIcon(doc.type);
            const StatusIcon = STATUS_CONFIG[doc.status].icon;
            return (
              <Card 
                key={doc.id} 
                className={cn(
                  "bg-slate-800/50 border-slate-700 cursor-pointer hover:border-slate-500 transition-colors",
                  doc.status === "expired" && "border-l-4 border-l-red-500",
                  doc.status === "expiring_soon" && "border-l-4 border-l-yellow-500"
                )}
                onClick={() => setSelectedDoc(doc)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="p-3 rounded-lg bg-slate-700/50">
                      <FileIcon className="w-8 h-8 text-slate-400" />
                    </div>
                    <Badge className={CATEGORY_CONFIG[doc.category].color}>
                      {CATEGORY_CONFIG[doc.category].label}
                    </Badge>
                  </div>
                  <h4 className="text-white font-medium text-sm truncate mb-1">{doc.name}</h4>
                  <p className="text-xs text-slate-500 mb-3">{formatFileSize(doc.size)}</p>
                  <div className={cn("flex items-center gap-1 text-xs", STATUS_CONFIG[doc.status].color)}>
                    <StatusIcon className="w-3 h-3" />
                    {STATUS_CONFIG[doc.status].label}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <Card className="bg-slate-800 border-slate-700 w-full max-w-md">
            <CardHeader className="border-b border-slate-700">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white">Upload Document</CardTitle>
                <Button variant="ghost" onClick={() => setShowUploadModal(false)}>
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="border-2 border-dashed border-slate-600 rounded-lg p-8 text-center">
                <Upload className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                <p className="text-white font-medium mb-1">Drop files here or click to upload</p>
                <p className="text-xs text-slate-500">PDF, JPG, PNG up to 10MB</p>
                <input type="file" className="hidden" />
                <Button className="mt-4 bg-blue-600 hover:bg-blue-700">
                  Select File
                </Button>
              </div>
              <div>
                <label className="text-sm text-slate-300">Category</label>
                <select className="w-full mt-1 p-2 rounded-md bg-slate-700/50 border border-slate-600 text-white">
                  {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
                    <option key={key} value={key}>{config.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm text-slate-300">Description (optional)</label>
                <Input className="mt-1 bg-slate-700/50 border-slate-600" placeholder="Enter description..." />
              </div>
              <div>
                <label className="text-sm text-slate-300">Expiration Date (optional)</label>
                <Input type="date" className="mt-1 bg-slate-700/50 border-slate-600" />
              </div>
              <div className="flex gap-3 pt-4">
                <Button className="flex-1 bg-blue-600 hover:bg-blue-700" onClick={() => { toast.success("Document uploaded"); setShowUploadModal(false); }}>
                  Upload
                </Button>
                <Button variant="outline" className="border-slate-600" onClick={() => setShowUploadModal(false)}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
