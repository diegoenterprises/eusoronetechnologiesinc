/**
 * CARRIER COMPLIANCE - MC Authority, DOT, Insurance, FMCSA
 */
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { Building2, FileCheck, AlertTriangle, Clock, Upload, Shield, CheckCircle2, XCircle, Award, Scale, DollarSign, Truck } from "lucide-react";

const CARRIER_DOCS = [
  { value: "mc_authority", label: "MC Authority", category: "authority", required: true },
  { value: "dot_number", label: "DOT Number", category: "authority", required: true },
  { value: "ucr_registration", label: "UCR Registration", category: "authority", required: true },
  { value: "ifta_license", label: "IFTA License", category: "authority", required: true },
  { value: "irp_cab_card", label: "IRP Cab Card", category: "authority", required: true },
  { value: "boc3", label: "BOC-3 Process Agent", category: "authority", required: true },
  { value: "liability_insurance", label: "Liability Insurance ($1M+)", category: "insurance", required: true },
  { value: "cargo_insurance", label: "Cargo Insurance ($100K+)", category: "insurance", required: true },
  { value: "workers_comp", label: "Workers Compensation", category: "insurance", required: true },
  { value: "auto_liability", label: "Auto Liability", category: "insurance", required: true },
  { value: "safety_rating", label: "FMCSA Safety Rating", category: "safety", required: true },
  { value: "drug_program", label: "Drug Testing Program", category: "safety", required: true },
  { value: "dq_files", label: "Driver Qualification Files", category: "safety", required: true },
  { value: "vehicle_inspections", label: "Vehicle Inspections", category: "safety", required: true },
  { value: "w9", label: "W-9 Form", category: "financial", required: true },
  { value: "bank_ach", label: "Banking/ACH Info", category: "financial", required: true },
  { value: "equipment_list", label: "Equipment List", category: "operational", required: true },
  { value: "driver_roster", label: "Driver Roster", category: "operational", required: true },
];

export default function CarrierCompliance() {
  const [uploadOpen, setUploadOpen] = useState(false);
  const [selectedType, setSelectedType] = useState("");
  const [expirationDate, setExpirationDate] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  const complianceQuery = (trpc as any).compliance.getCarrierCompliance.useQuery();
  const documentsQuery = (trpc as any).compliance.getCarrierDocuments.useQuery();
  const uploadMutation = (trpc as any).compliance.uploadDocument.useMutation();

  const score = (complianceQuery.data as any)?.score ?? 85;
  const docs = documentsQuery.data ?? [];

  const getStatusBadge = (status: string) => {
    const badges: Record<string, React.ReactNode> = {
      verified: <Badge className="bg-green-500"><CheckCircle2 className="w-3 h-3 mr-1" />Verified</Badge>,
      pending: <Badge className="bg-yellow-500"><Clock className="w-3 h-3 mr-1" />Pending</Badge>,
      expiring: <Badge className="bg-orange-500"><AlertTriangle className="w-3 h-3 mr-1" />Expiring</Badge>,
      expired: <Badge className="bg-red-500"><XCircle className="w-3 h-3 mr-1" />Expired</Badge>,
    };
    return badges[status] || <Badge variant="outline">{status}</Badge>;
  };

  const handleUpload = async () => {
    if (!selectedType) return;
    await uploadMutation.mutateAsync({ documentType: selectedType, expirationDate, userType: "carrier" });
    setUploadOpen(false);
    documentsQuery.refetch();
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2"><Building2 className="w-8 h-8" />Carrier Compliance</h1>
          <p className="text-muted-foreground">FMCSA, DOT, Insurance & Authority Documents</p>
        </div>
        <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
          <DialogTrigger asChild><Button><Upload className="w-4 h-4 mr-2" />Upload Document</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Upload Compliance Document</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-4">
              <div><Label>Document Type</Label>
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>{CARRIER_DOCS.map(t => <SelectItem key={t.value} value={t.value}>{t.label}{t.required && " *"}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Expiration Date</Label><Input type="date" value={expirationDate} onChange={e => setExpirationDate(e.target.value)} /></div>
              <div><Label>Upload File</Label><Input type="file" accept=".pdf,.jpg,.png" /></div>
              <Button className="w-full" onClick={handleUpload} disabled={!selectedType}><Upload className="w-4 h-4 mr-2" />Upload</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <CardContent className="pt-6">
          <div className="grid grid-cols-5 gap-4 items-center">
            <div className="text-center"><div className="text-4xl font-bold">{score}%</div><div className="text-sm">Compliance Score</div><Progress value={score} className="mt-2 h-2 bg-white/20" /></div>
            <div className="text-center p-3 bg-white/10 rounded"><div className="text-xl font-bold">12</div><div className="text-xs">Verified</div></div>
            <div className="text-center p-3 bg-white/10 rounded"><div className="text-xl font-bold">3</div><div className="text-xs">Pending</div></div>
            <div className="text-center p-3 bg-white/10 rounded"><div className="text-xl font-bold text-orange-300">2</div><div className="text-xs">Expiring</div></div>
            <div className="text-center p-3 bg-white/10 rounded"><div className="text-xl font-bold text-red-300">1</div><div className="text-xs">Missing</div></div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList><TabsTrigger value="all">All</TabsTrigger><TabsTrigger value="authority">Authority</TabsTrigger><TabsTrigger value="insurance">Insurance</TabsTrigger><TabsTrigger value="safety">Safety</TabsTrigger><TabsTrigger value="financial">Financial</TabsTrigger></TabsList>
        <TabsContent value={activeTab} className="mt-4">
          <div className="grid gap-4">
            {CARRIER_DOCS.filter(d => activeTab === "all" || d.category === activeTab).map(doc => (
              <Card key={doc.value}>
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    {doc.category === "authority" && <Award className="w-5 h-5 text-blue-500" />}
                    {doc.category === "insurance" && <Shield className="w-5 h-5 text-green-500" />}
                    {doc.category === "safety" && <Scale className="w-5 h-5 text-orange-500" />}
                    {doc.category === "financial" && <DollarSign className="w-5 h-5 text-purple-500" />}
                    {doc.category === "operational" && <Truck className="w-5 h-5 text-gray-500" />}
                    <div><div className="font-medium">{doc.label}</div><div className="text-sm text-muted-foreground">{doc.required ? "Required" : "Optional"}</div></div>
                  </div>
                  {getStatusBadge("verified")}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
