/**
 * ONBOARDING DOCUMENTS PAGE
 * Upload required compliance documents during registration
 * 100% dynamic - no mock data
 */

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  FileText, Upload, CheckCircle, Clock, AlertTriangle, 
  RefreshCw, ChevronRight, Shield, Truck, User
} from "lucide-react";

interface DocumentRequirement {
  id: string;
  name: string;
  description: string;
  required: boolean;
  category: string;
  status: "pending" | "uploaded" | "verified" | "rejected";
}

export default function OnboardingDocuments() {
  const [uploading, setUploading] = useState<string | null>(null);

  const { data: requirements, isLoading, error, refetch } = (trpc as any).documents.getDriverDocuments.useQuery();
  const { data: uploadedDocs } = (trpc as any).documents.list.useQuery({ limit: 100 });
  const uploadMutation = (trpc as any).documents.upload.useMutation({
    onSuccess: () => {
      refetch();
      setUploading(null);
    },
  });

  const handleFileUpload = async (docId: string, file: File) => {
    setUploading(docId);
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(",")[1];
      uploadMutation.mutate({
        name: file.name,
        category: "compliance" as const,
        fileData: base64,
        description: file.type,
      });
    };
    reader.readAsDataURL(file);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-full max-w-md" />
        <div className="grid gap-4">
          {[1, 2, 3, 4].map((i: any) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6 flex items-center gap-4">
            <AlertTriangle className="h-8 w-8 text-red-500" />
            <div>
              <h3 className="font-semibold text-red-700">Error Loading Requirements</h3>
              <p className="text-red-600 text-sm">{error.message}</p>
            </div>
            <Button variant="outline" onClick={() => refetch()} className="ml-auto">
              <RefreshCw className="h-4 w-4 mr-2" /> Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const docs = requirements || [];
  const uploadedMap = new Map((uploadedDocs || []).map((d: any) => [d.type, d]));
  
  const getDocStatus = (docId: string): DocumentRequirement["status"] => {
    const uploaded = uploadedMap.get(docId);
    if (!uploaded) return "pending";
    if ((uploaded as any).verified) return "verified";
    if ((uploaded as any).rejected) return "rejected";
    return "uploaded";
  };

  const completedCount = docs.filter((d: any) => {
    const status = getDocStatus(d.id);
    return status === "uploaded" || status === "verified";
  }).length;
  const progress = docs.length > 0 ? (completedCount / docs.length) * 100 : 0;

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "identity": return <User className="h-5 w-5" />;
      case "vehicle": return <Truck className="h-5 w-5" />;
      case "compliance": return <Shield className="h-5 w-5" />;
      default: return <FileText className="h-5 w-5" />;
    }
  };

  const getStatusBadge = (status: DocumentRequirement["status"]) => {
    switch (status) {
      case "verified":
        return <Badge className="bg-green-100 text-green-700"><CheckCircle className="h-3 w-3 mr-1" /> Verified</Badge>;
      case "uploaded":
        return <Badge className="bg-blue-100 text-blue-700"><Clock className="h-3 w-3 mr-1" /> Under Review</Badge>;
      case "rejected":
        return <Badge className="bg-red-100 text-red-700"><AlertTriangle className="h-3 w-3 mr-1" /> Rejected</Badge>;
      default:
        return <Badge variant="outline"><Upload className="h-3 w-3 mr-1" /> Required</Badge>;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Document Verification</h1>
        <p className="text-muted-foreground">Upload required documents to complete your registration</p>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-muted-foreground">Completion Progress</p>
              <p className="text-2xl font-bold">{completedCount} of {docs.length} documents</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-primary">{Math.round(progress)}%</p>
              <p className="text-sm text-muted-foreground">Complete</p>
            </div>
          </div>
          <Progress value={progress} className="h-3" />
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {docs.map((doc: any) => {
          const status = getDocStatus(doc.id);
          const isUploading = uploading === doc.id;

          return (
            <Card key={doc.id} className={status === "rejected" ? "border-red-200" : ""}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-lg ${
                      status === "verified" ? "bg-green-100 text-green-600" :
                      status === "uploaded" ? "bg-blue-100 text-blue-600" :
                      status === "rejected" ? "bg-red-100 text-red-600" :
                      "bg-muted text-muted-foreground"
                    }`}>
                      {getCategoryIcon(doc.category)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{doc.name}</h3>
                        {doc.required && <Badge variant="destructive" className="text-xs">Required</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground">{doc.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {getStatusBadge(status)}
                    {(status === "pending" || status === "rejected") && (
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          className="hidden"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e: any) => {
                            const file = e.target.files?.[0];
                            if (file) handleFileUpload(doc.id, file);
                          }}
                          disabled={isUploading}
                        />
                        <Button variant="outline" size="sm" disabled={isUploading} asChild>
                          <span>
                            {isUploading ? "Uploading..." : (
                              <>
                                <Upload className="h-4 w-4 mr-2" /> Upload
                              </>
                            )}
                          </span>
                        </Button>
                      </label>
                    )}
                    {status === "verified" && (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {progress === 100 && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div>
                <h3 className="font-semibold text-green-700">All Documents Submitted</h3>
                <p className="text-green-600 text-sm">Your documents are being reviewed. This usually takes 1-2 business days.</p>
              </div>
            </div>
            <Button>
              Continue <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
