/**
 * DRIVER DOCUMENTS PAGE
 * Complete document compliance management for drivers
 * CDL, Medical Card, Insurance, Hazmat, TWIC, etc.
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  FileText, Upload, CheckCircle, AlertTriangle, Clock, XCircle,
  CreditCard, Shield, Truck, Award, Calendar, Eye, Download,
  RefreshCw, AlertCircle, Plus
} from "lucide-react";

interface DocumentItem {
  id: string;
  type: string;
  name: string;
  status: string;
  expirationDate: string | null;
  uploadedAt: string;
  category: string;
}

const DOCUMENT_TYPES = [
  { value: "cdl", label: "Commercial Driver's License (CDL)", icon: CreditCard, required: true },
  { value: "medical_card", label: "Medical Examiner's Certificate", icon: Shield, required: true },
  { value: "liability_insurance", label: "Liability Insurance", icon: Shield, required: true },
  { value: "cargo_insurance", label: "Cargo Insurance", icon: Shield, required: false },
  { value: "hazmat_endorsement", label: "Hazmat Endorsement", icon: AlertTriangle, required: false },
  { value: "twic_card", label: "TWIC Card", icon: CreditCard, required: false },
  { value: "tanker_endorsement", label: "Tanker Endorsement", icon: Truck, required: false },
  { value: "doubles_triples", label: "Doubles/Triples Endorsement", icon: Truck, required: false },
  { value: "passport", label: "Passport", icon: CreditCard, required: false },
  { value: "drug_test", label: "Drug Test Results", icon: Shield, required: true },
  { value: "background_check", label: "Background Check", icon: Shield, required: true },
  { value: "mvr", label: "Motor Vehicle Record (MVR)", icon: FileText, required: true },
  { value: "w9", label: "W-9 Tax Form", icon: FileText, required: true },
  { value: "voided_check", label: "Voided Check / Direct Deposit", icon: CreditCard, required: false },
  { value: "authority_certificate", label: "Operating Authority Certificate", icon: Award, required: false },
];

export default function DriverDocuments() {
  const [uploadOpen, setUploadOpen] = useState(false);
  const [selectedType, setSelectedType] = useState("");
  const [expirationDate, setExpirationDate] = useState("");
  const [uploadingFile, setUploadingFile] = useState<File | null>(null);
  const [activeTab, setActiveTab] = useState("all");

  const documentsQuery = (trpc as any).documents.getDriverDocuments.useQuery();
  const complianceQuery = (trpc as any).documents.getComplianceStatus.useQuery();
  
  const uploadMutation = (trpc as any).documents.uploadDocument.useMutation({
    onSuccess: () => {
      toast.success("Document uploaded successfully");
      setUploadOpen(false);
      setSelectedType("");
      setExpirationDate("");
      setUploadingFile(null);
      documentsQuery.refetch();
      complianceQuery.refetch();
    },
    onError: (error: any) => toast.error("Upload failed", { description: error.message }),
  });

  const verifyMutation = (trpc as any).documents.verifyDocument.useMutation({
    onSuccess: () => {
      toast.success("Document verified");
      documentsQuery.refetch();
      complianceQuery.refetch();
    },
  });

  const compliance = complianceQuery.data;
  const documents = documentsQuery.data || [];

  const getStatusBadge = (status: string, expirationDate: string | null) => {
    const isExpired = expirationDate && new Date(expirationDate) < new Date();
    const isExpiringSoon = expirationDate && new Date(expirationDate) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    if (isExpired) return <Badge className="bg-red-500/20 text-red-400 border-0"><XCircle className="w-3 h-3 mr-1" />Expired</Badge>;
    if (isExpiringSoon) return <Badge className="bg-orange-500/20 text-orange-400 border-0"><AlertTriangle className="w-3 h-3 mr-1" />Expiring Soon</Badge>;
    
    switch (status) {
      case "verified": return <Badge className="bg-green-500/20 text-green-400 border-0"><CheckCircle className="w-3 h-3 mr-1" />Verified</Badge>;
      case "pending": return <Badge className="bg-yellow-500/20 text-yellow-400 border-0"><Clock className="w-3 h-3 mr-1" />Pending Review</Badge>;
      case "rejected": return <Badge className="bg-red-500/20 text-red-400 border-0"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      default: return <Badge className="bg-slate-500/20 text-slate-400 border-0">{status}</Badge>;
    }
  };

  const getFilteredDocuments = () => {
    if (activeTab === "all") return documents;
    if (activeTab === "verified") return documents.filter((d: any) => d.status === "active");
    if (activeTab === "pending") return documents.filter((d: any) => d.status === "pending");
    if (activeTab === "expiring") return documents.filter((d: any) => {
      if (!d.expirationDate) return false;
      const exp = new Date(d.expirationDate);
      return exp < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    });
    if (activeTab === "missing") {
      const uploadedTypes = documents.map((d: any) => d.type);
      return DOCUMENT_TYPES.filter(dt => dt.required && !uploadedTypes.includes(dt.value));
    }
    return documents;
  };

  const handleUpload = () => {
    if (!selectedType || !uploadingFile) {
      toast.error("Please select document type and file");
      return;
    }
    uploadMutation.mutate({
      documentType: selectedType,
      expirationDate: expirationDate || undefined,
    });
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            Driver Documents
          </h1>
          <p className="text-slate-400 text-sm mt-1">Manage your compliance documents</p>
        </div>
        <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 rounded-lg">
              <Upload className="w-4 h-4 mr-2" />Upload Document
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-800 border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-white">Upload Document</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Document Type *</Label>
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger className="bg-slate-700 border-slate-600">
                    <SelectValue placeholder="Select document type" />
                  </SelectTrigger>
                  <SelectContent>
                    {DOCUMENT_TYPES.map(dt => (
                      <SelectItem key={dt.value} value={dt.value}>
                        {dt.label} {dt.required && <span className="text-red-400">*</span>}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Expiration Date (if applicable)</Label>
                <Input
                  type="date"
                  value={expirationDate}
                  onChange={(e: any) => setExpirationDate(e.target.value)}
                  className="bg-slate-700 border-slate-600"
                />
              </div>
              <div className="space-y-2">
                <Label>Upload File *</Label>
                <div className="border-2 border-dashed border-slate-600 rounded-lg p-6 text-center">
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e: any) => setUploadingFile(e.target.files?.[0] || null)}
                    className="hidden"
                    id="doc-upload"
                  />
                  <label htmlFor="doc-upload" className="cursor-pointer">
                    <Upload className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                    <p className="text-slate-400 text-sm">
                      {uploadingFile ? uploadingFile.name : "Click to upload PDF, JPG, or PNG"}
                    </p>
                  </label>
                </div>
              </div>
              <Button
                onClick={handleUpload}
                disabled={uploadMutation.isPending}
                className="w-full bg-gradient-to-r from-cyan-600 to-emerald-600"
              >
                {uploadMutation.isPending ? "Uploading..." : "Upload Document"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Compliance Score */}
      <Card className="bg-gradient-to-r from-slate-800/80 to-slate-700/80 border-slate-600/50 rounded-xl">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-white">Compliance Status</h3>
              <p className="text-slate-400 text-sm">Your document verification status</p>
            </div>
            {complianceQuery.isLoading ? (
              <Skeleton className="h-16 w-16 rounded-full" />
            ) : (
              <div className="text-center">
                <div className={`text-4xl font-bold ${(compliance?.score || 0) >= 80 ? 'text-green-400' : (compliance?.score || 0) >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                  {compliance?.score || 0}%
                </div>
                <p className="text-slate-400 text-xs">Compliance Score</p>
              </div>
            )}
          </div>
          <Progress value={compliance?.score || 0} className="h-3" />
          <div className="grid grid-cols-4 gap-4 mt-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-400">{compliance?.completed || 0}</p>
              <p className="text-xs text-slate-400">Verified</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-400">{compliance?.pending || 0}</p>
              <p className="text-xs text-slate-400">Pending</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-400">{compliance?.expired || 0}</p>
              <p className="text-xs text-slate-400">Expiring</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-400">{(compliance?.totalRequired || 0) - (compliance?.completed || 0)}</p>
              <p className="text-xs text-slate-400">Missing</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Documents List */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-slate-800/50">
          <TabsTrigger value="all">All Documents</TabsTrigger>
          <TabsTrigger value="verified">Verified</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="expiring">Expiring Soon</TabsTrigger>
          <TabsTrigger value="missing">Missing Required</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          {documentsQuery.isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full" />)}
            </div>
          ) : activeTab === "missing" ? (
            <div className="grid gap-4">
              {getFilteredDocuments().map((dt: any) => (
                <Card key={dt.value} className="bg-slate-800/50 border-red-500/30 rounded-xl">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-full bg-red-500/20">
                        <AlertCircle className="w-6 h-6 text-red-400" />
                      </div>
                      <div>
                        <p className="text-white font-medium">{dt.label}</p>
                        <p className="text-red-400 text-sm">Required - Not Uploaded</p>
                      </div>
                    </div>
                    <Button
                      onClick={() => { setSelectedType(dt.value); setUploadOpen(true); }}
                      className="bg-red-500/20 text-red-400 hover:bg-red-500/30"
                    >
                      <Plus className="w-4 h-4 mr-2" />Upload Now
                    </Button>
                  </CardContent>
                </Card>
              ))}
              {getFilteredDocuments().length === 0 && (
                <Card className="bg-slate-800/50 border-green-500/30 rounded-xl">
                  <CardContent className="p-8 text-center">
                    <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
                    <p className="text-white font-medium">All required documents uploaded!</p>
                    <p className="text-slate-400 text-sm">Your compliance is up to date.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <div className="grid gap-4">
              {(getFilteredDocuments() as DocumentItem[]).map((doc: any) => (
                <Card key={doc.id} className="bg-slate-800/50 border-slate-700/50 rounded-xl hover:border-slate-600/50 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-3 rounded-full bg-cyan-500/20">
                          <FileText className="w-6 h-6 text-cyan-400" />
                        </div>
                        <div>
                          <p className="text-white font-medium">{doc.name}</p>
                          <div className="flex items-center gap-3 mt-1">
                            {getStatusBadge(doc.status, doc.expirationDate)}
                            {doc.expirationDate && (
                              <span className="text-slate-400 text-xs flex items-center">
                                <Calendar className="w-3 h-3 mr-1" />
                                Expires: {new Date(doc.expirationDate).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                          <RefreshCw className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    {doc.status === "active" && (
                      <p className="text-slate-500 text-xs mt-2">
                        Document verified
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
              {getFilteredDocuments().length === 0 && (
                <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
                  <CardContent className="p-8 text-center">
                    <FileText className="w-12 h-12 text-slate-500 mx-auto mb-3" />
                    <p className="text-slate-400">No documents found</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
