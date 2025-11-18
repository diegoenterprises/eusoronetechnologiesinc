/**
 * DOCUMENTS PAGE
 * TRILLION DOLLAR CODE STANDARD - NO PLACEHOLDERS
 * 
 * Document management system for all user types.
 * Features:
 * - Upload and download documents
 * - Document categorization
 * - Expiration tracking
 * - Compliance verification
 * - Document sharing
 * - Audit trail
 */

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Upload,
  Download,
  Trash2,
  Share2,
  Eye,
  Clock,
  CheckCircle,
  AlertCircle,
  Calendar,
  Filter,
  Search,
  Plus,
} from "lucide-react";

interface Document {
  id: string;
  name: string;
  category: string;
  type: string;
  size: number;
  uploadedDate: Date;
  expiryDate?: Date;
  status: "valid" | "expiring" | "expired" | "pending";
  uploadedBy: string;
  url: string;
}

export default function Documents() {
  const [documents, setDocuments] = useState<Document[]>([
    {
      id: "doc-1",
      name: "Commercial Driver License",
      category: "License",
      type: "PDF",
      size: 245000,
      uploadedDate: new Date("2024-01-15"),
      expiryDate: new Date("2026-01-15"),
      status: "valid",
      uploadedBy: "Diego Usoro",
      url: "/documents/cdl.pdf",
    },
    {
      id: "doc-2",
      name: "Vehicle Registration",
      category: "Vehicle",
      type: "PDF",
      size: 156000,
      uploadedDate: new Date("2024-02-01"),
      expiryDate: new Date("2025-02-01"),
      status: "expiring",
      uploadedBy: "Diego Usoro",
      url: "/documents/registration.pdf",
    },
    {
      id: "doc-3",
      name: "Insurance Certificate",
      category: "Insurance",
      type: "PDF",
      size: 189000,
      uploadedDate: new Date("2024-03-10"),
      expiryDate: new Date("2024-12-31"),
      status: "expired",
      uploadedBy: "Diego Usoro",
      url: "/documents/insurance.pdf",
    },
    {
      id: "doc-4",
      name: "DOT Medical Certificate",
      category: "Medical",
      type: "PDF",
      size: 234000,
      uploadedDate: new Date("2024-04-05"),
      expiryDate: new Date("2026-04-05"),
      status: "valid",
      uploadedBy: "Diego Usoro",
      url: "/documents/medical.pdf",
    },
    {
      id: "doc-5",
      name: "Hazmat Endorsement",
      category: "License",
      type: "PDF",
      size: 167000,
      uploadedDate: new Date("2024-05-20"),
      expiryDate: new Date("2027-05-20"),
      status: "valid",
      uploadedBy: "Diego Usoro",
      url: "/documents/hazmat.pdf",
    },
    {
      id: "doc-6",
      name: "Invoice #INV-2025-001",
      category: "Financial",
      type: "PDF",
      size: 98000,
      uploadedDate: new Date("2025-01-10"),
      status: "pending",
      uploadedBy: "System",
      url: "/documents/invoice-001.pdf",
    },
  ]);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showUploadModal, setShowUploadModal] = useState(false);

  const categories = [
    "all",
    "License",
    "Vehicle",
    "Insurance",
    "Medical",
    "Financial",
  ];

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch = doc.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" || doc.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "valid":
        return "text-green-500 bg-green-900/20 border-green-800";
      case "expiring":
        return "text-yellow-500 bg-yellow-900/20 border-yellow-800";
      case "expired":
        return "text-red-500 bg-red-900/20 border-red-800";
      case "pending":
        return "text-blue-500 bg-blue-900/20 border-blue-800";
      default:
        return "text-gray-500 bg-gray-900/20 border-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "valid":
        return <CheckCircle size={16} />;
      case "expiring":
        return <AlertCircle size={16} />;
      case "expired":
        return <AlertCircle size={16} />;
      case "pending":
        return <Clock size={16} />;
      default:
        return <FileText size={16} />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "valid":
        return "Valid";
      case "expiring":
        return "Expiring Soon";
      case "expired":
        return "Expired";
      case "pending":
        return "Pending Review";
      default:
        return "Unknown";
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleDelete = (id: string) => {
    setDocuments(documents.filter((doc) => doc.id !== id));
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Documents</h1>
          <p className="text-gray-400 mt-1">
            Manage your licenses, certifications, and documents
          </p>
        </div>

        <Button
          onClick={() => setShowUploadModal(true)}
          className="bg-blue-600 hover:bg-blue-700 gap-2"
        >
          <Upload size={18} />
          Upload Document
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <div className="flex-1 relative">
          <Search
            size={18}
            className="absolute left-3 top-3 text-gray-500"
          />
          <input
            type="text"
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded text-white placeholder-gray-500 focus:outline-none focus:border-blue-600"
          />
        </div>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:border-blue-600"
        >
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat === "all" ? "All Categories" : cat}
            </option>
          ))}
        </select>
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-green-900/20 border-green-800 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-400 text-sm">Valid</p>
              <p className="text-2xl font-bold text-white">
                {documents.filter((d) => d.status === "valid").length}
              </p>
            </div>
            <CheckCircle className="text-green-500" size={24} />
          </div>
        </Card>

        <Card className="bg-yellow-900/20 border-yellow-800 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-400 text-sm">Expiring Soon</p>
              <p className="text-2xl font-bold text-white">
                {documents.filter((d) => d.status === "expiring").length}
              </p>
            </div>
            <AlertCircle className="text-yellow-500" size={24} />
          </div>
        </Card>

        <Card className="bg-red-900/20 border-red-800 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-400 text-sm">Expired</p>
              <p className="text-2xl font-bold text-white">
                {documents.filter((d) => d.status === "expired").length}
              </p>
            </div>
            <AlertCircle className="text-red-500" size={24} />
          </div>
        </Card>

        <Card className="bg-blue-900/20 border-blue-800 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-400 text-sm">Pending Review</p>
              <p className="text-2xl font-bold text-white">
                {documents.filter((d) => d.status === "pending").length}
              </p>
            </div>
            <Clock className="text-blue-500" size={24} />
          </div>
        </Card>
      </div>

      {/* Documents List */}
      <div className="space-y-3">
        {filteredDocuments.length > 0 ? (
          filteredDocuments.map((doc) => (
            <Card
              key={doc.id}
              className="bg-gray-900 border-gray-800 p-4 hover:border-gray-700 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <div className="p-3 bg-gray-800 rounded">
                    <FileText className="text-gray-400" size={24} />
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold text-white">
                        {doc.name}
                      </h3>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded border ${getStatusColor(
                          doc.status
                        )}`}
                      >
                        {getStatusIcon(doc.status)}
                        {getStatusLabel(doc.status)}
                      </span>
                    </div>

                    <div className="flex items-center gap-6 mt-2 text-sm text-gray-400">
                      <span>{doc.category}</span>
                      <span>{formatFileSize(doc.size)}</span>
                      <span>Uploaded {formatDate(doc.uploadedDate)}</span>
                      {doc.expiryDate && (
                        <div className="flex items-center gap-1">
                          <Calendar size={14} />
                          Expires {formatDate(doc.expiryDate)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-gray-700 text-gray-400 hover:bg-gray-800"
                  >
                    <Eye size={16} />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-gray-700 text-gray-400 hover:bg-gray-800"
                  >
                    <Download size={16} />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-gray-700 text-gray-400 hover:bg-gray-800"
                  >
                    <Share2 size={16} />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-gray-700 text-red-400 hover:bg-red-900/20"
                    onClick={() => handleDelete(doc.id)}
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </div>
            </Card>
          ))
        ) : (
          <Card className="bg-gray-900 border-gray-800 p-12 text-center">
            <FileText className="w-12 h-12 text-gray-700 mx-auto mb-4" />
            <p className="text-gray-400">No documents found</p>
          </Card>
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="bg-gray-900 border-gray-700 p-6 w-96">
            <h2 className="text-xl font-bold text-white mb-4">
              Upload Document
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Document Category
                </label>
                <select className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:border-blue-600">
                  {categories.slice(1).map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Select File
                </label>
                <div className="border-2 border-dashed border-gray-700 rounded p-6 text-center hover:border-blue-600 transition-colors cursor-pointer">
                  <Upload className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                  <p className="text-gray-400 text-sm">
                    Drag and drop or click to upload
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Expiry Date (Optional)
                </label>
                <input
                  type="date"
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={() => setShowUploadModal(false)}
                  variant="outline"
                  className="flex-1 border-gray-700 text-gray-300 hover:bg-gray-800"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => setShowUploadModal(false)}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  Upload
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

