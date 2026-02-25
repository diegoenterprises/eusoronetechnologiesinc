/**
 * DOCUMENT UPLOADER COMPONENT
 * Upload and manage compliance documents
 * Based on 08_COMPLIANCE_OFFICER_USER_JOURNEY.md
 */

import React, { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { 
  Upload, FileText, CheckCircle, AlertCircle, X, 
  Eye, Download, Trash2, Calendar, Shield
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export interface DocumentData {
  id: string;
  name: string;
  type: string;
  category: string;
  status: "pending" | "verified" | "rejected" | "expired";
  uploadedAt: string;
  expiresAt?: string;
  fileSize: string;
  fileUrl?: string;
  verifiedBy?: string;
  notes?: string;
}

const DOCUMENT_CATEGORIES = [
  { value: "cdl", label: "CDL / Driver's License" },
  { value: "medical", label: "Medical Certificate (DOT)" },
  { value: "twic", label: "TWIC Card" },
  { value: "hazmat_training", label: "Hazmat Training Certificate" },
  { value: "mvr", label: "Motor Vehicle Record (MVR)" },
  { value: "employment", label: "Employment Application" },
  { value: "drug_test", label: "Drug Test Results" },
  { value: "road_test", label: "Road Test Certificate" },
  { value: "insurance", label: "Insurance Certificate (COI)" },
  { value: "operating_authority", label: "Operating Authority" },
  { value: "vehicle_registration", label: "Vehicle Registration" },
  { value: "annual_inspection", label: "Annual DOT Inspection" },
  { value: "safety_rating", label: "Safety Rating Letter" },
  { value: "phmsa", label: "PHMSA Registration" },
  { value: "other", label: "Other" },
];

interface DocumentUploaderProps {
  documents: DocumentData[];
  onUpload: (file: File, category: string, expiresAt?: string) => Promise<void>;
  onDelete?: (documentId: string) => void;
  onView?: (document: DocumentData) => void;
  onDownload?: (document: DocumentData) => void;
  entityType: "driver" | "catalyst" | "vehicle" | "company";
  entityId: string;
}

export function DocumentUploader({
  documents,
  onUpload,
  onDelete,
  onView,
  onDownload,
  entityType,
  entityId,
}: DocumentUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [expirationDate, setExpirationDate] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      await handleFileUpload(files[0]);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await handleFileUpload(files[0]);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!selectedCategory) {
      toast.error("Please select a document category first");
      return;
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Invalid file type. Please upload PDF, JPG, or PNG files.");
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File too large. Maximum size is 10MB.");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    // Simulate upload progress
    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return prev;
        }
        return prev + 10;
      });
    }, 200);

    try {
      await onUpload(file, selectedCategory, expirationDate || undefined);
      setUploadProgress(100);
      toast.success("Document uploaded successfully");
      setSelectedCategory("");
      setExpirationDate("");
    } catch (error) {
      toast.error("Upload failed. Please try again.");
    } finally {
      clearInterval(progressInterval);
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const getStatusColor = (status: DocumentData["status"]) => {
    switch (status) {
      case "verified":
        return "bg-green-500/20 text-green-400";
      case "pending":
        return "bg-yellow-500/20 text-yellow-400";
      case "rejected":
        return "bg-red-500/20 text-red-400";
      case "expired":
        return "bg-slate-500/20 text-slate-400";
      default:
        return "bg-slate-500/20 text-slate-400";
    }
  };

  const expiringDocs = documents.filter(d => {
    if (!d.expiresAt) return false;
    const daysUntilExpiry = Math.ceil((new Date(d.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
  });

  const expiredDocs = documents.filter(d => d.status === "expired");

  return (
    <div className="space-y-6">
      {/* Alerts */}
      {(expiringDocs.length > 0 || expiredDocs.length > 0) && (
        <div className="space-y-2">
          {expiredDocs.length > 0 && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <p className="text-sm text-red-300">
                <strong>{expiredDocs.length} document(s) expired</strong> - Immediate action required
              </p>
            </div>
          )}
          {expiringDocs.length > 0 && (
            <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30 flex items-center gap-3">
              <Calendar className="w-5 h-5 text-yellow-400 flex-shrink-0" />
              <p className="text-sm text-yellow-300">
                <strong>{expiringDocs.length} document(s) expiring</strong> within 30 days
              </p>
            </div>
          )}
        </div>
      )}

      {/* Upload Section */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Upload className="w-5 h-5 text-blue-400" />
            Upload Document
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Document Category <span className="text-red-400">*</span></Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {DOCUMENT_CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Expiration Date (if applicable)</Label>
              <DatePicker value={expirationDate} onChange={setExpirationDate} />
            </div>
          </div>

          {/* Drop Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all",
              isDragging 
                ? "border-blue-500 bg-blue-500/10" 
                : "border-slate-600 hover:border-slate-500 hover:bg-slate-700/30",
              isUploading && "pointer-events-none opacity-50"
            )}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileSelect}
              className="hidden"
            />
            <Upload className="w-10 h-10 text-slate-400 mx-auto mb-3" />
            <p className="text-slate-300 font-medium">
              {isDragging ? "Drop file here" : "Drag & drop or click to upload"}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              PDF, JPG, or PNG up to 10MB
            </p>
          </div>

          {/* Upload Progress */}
          {isUploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-slate-400">
                <span>Uploading...</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2 bg-slate-700" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Documents List */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-400" />
              Documents ({documents.length})
            </CardTitle>
            <Badge variant="outline" className="text-slate-400">
              {documents.filter(d => d.status === "verified").length} Verified
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <div className="text-center py-8">
              <Shield className="w-12 h-12 text-slate-500 mx-auto mb-3" />
              <p className="text-slate-400">No documents uploaded yet</p>
              <p className="text-sm text-slate-500">Upload compliance documents above</p>
            </div>
          ) : (
            <div className="space-y-3">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-700/30 hover:bg-slate-700/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center",
                      doc.status === "verified" && "bg-green-500/20",
                      doc.status === "pending" && "bg-yellow-500/20",
                      doc.status === "rejected" && "bg-red-500/20",
                      doc.status === "expired" && "bg-slate-500/20"
                    )}>
                      <FileText className={cn(
                        "w-5 h-5",
                        doc.status === "verified" && "text-green-400",
                        doc.status === "pending" && "text-yellow-400",
                        doc.status === "rejected" && "text-red-400",
                        doc.status === "expired" && "text-slate-400"
                      )} />
                    </div>
                    <div>
                      <p className="text-white font-medium">{doc.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={getStatusColor(doc.status)} variant="outline">
                          {doc.status === "verified" && <CheckCircle className="w-3 h-3 mr-1" />}
                          {doc.status === "pending" && <AlertCircle className="w-3 h-3 mr-1" />}
                          {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                        </Badge>
                        <span className="text-xs text-slate-500">{doc.fileSize}</span>
                        {doc.expiresAt && (
                          <span className="text-xs text-slate-500">
                            Expires: {new Date(doc.expiresAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onView?.(doc)}
                      className="text-slate-400 hover:text-white"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onDownload?.(doc)}
                      className="text-slate-400 hover:text-white"
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onDelete?.(doc.id)}
                      className="text-slate-400 hover:text-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default DocumentUploader;
