/**
 * BROKER COMPLIANCE - Broker Authority, Bonds, Insurance
 */
import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { Briefcase, FileCheck, AlertTriangle, Clock, Upload, Shield, CheckCircle2, XCircle, Award, Scale, DollarSign, FileText } from "lucide-react";
import DatePicker from "@/components/DatePicker";

const BROKER_DOCS = [
  { value: "broker_authority", label: "Broker Authority (MC-B)", category: "authority", required: true },
  { value: "broker_license", label: "Broker License", category: "authority", required: true },
  { value: "boc3", label: "BOC-3 Process Agent", category: "authority", required: true },
  { value: "ucr_registration", label: "UCR Registration", category: "authority", required: true },
  { value: "surety_bond", label: "Surety Bond ($75,000)", category: "bond", required: true },
  { value: "trust_fund", label: "Trust Fund Agreement (alternative to bond)", category: "bond", required: false },
  { value: "contingent_cargo", label: "Contingent Cargo Insurance", category: "insurance", required: true },
  { value: "general_liability", label: "General Liability Insurance", category: "insurance", required: true },
  { value: "errors_omissions", label: "Errors & Omissions Insurance", category: "insurance", required: false },
  { value: "cyber_liability", label: "Cyber Liability Insurance", category: "insurance", required: false },
  { value: "w9", label: "W-9 Form", category: "financial", required: true },
  { value: "bank_info", label: "Banking Information", category: "financial", required: true },
  { value: "credit_report", label: "Business Credit Report", category: "financial", required: false },
  { value: "catalyst_setup_packet", label: "Catalyst Setup Packet Template", category: "operational", required: true },
  { value: "shipper_agreement", label: "Shipper Agreement Template", category: "operational", required: true },
  { value: "rate_confirmation", label: "Rate Confirmation Template", category: "operational", required: true },
];

export default function BrokerCompliance() {
  const [uploadOpen, setUploadOpen] = useState(false);
  const [selectedType, setSelectedType] = useState("");
  const [expirationDate, setExpirationDate] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  const complianceQuery = (trpc as any).compliance.getBrokerCompliance.useQuery();
  const documentsQuery = (trpc as any).compliance.getBrokerDocuments.useQuery();
  const uploadMutation = (trpc as any).compliance.uploadDocument.useMutation();

  const score = (complianceQuery.data as any)?.score ?? 92;

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
    await uploadMutation.mutateAsync({ documentType: selectedType, expirationDate, userType: "broker" });
    setUploadOpen(false);
    documentsQuery.refetch();
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">Broker Compliance</h1>
          <p className="text-muted-foreground">Authority, Surety Bond & Insurance Management</p>
        </div>
        <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
          <DialogTrigger asChild><Button><Upload className="w-4 h-4 mr-2" />Upload Document</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Upload Compliance Document</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-4">
              <div><Label>Document Type</Label>
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>{BROKER_DOCS.map(t => <SelectItem key={t.value} value={t.value}>{t.label}{t.required && " *"}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Expiration Date</Label><DatePicker value={expirationDate} onChange={setExpirationDate} /></div>
              <div><Label>Upload File</Label><Input type="file" accept=".pdf,.jpg,.png" /></div>
              <Button className="w-full" onClick={handleUpload} disabled={!selectedType}><Upload className="w-4 h-4 mr-2" />Upload</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white">
        <CardContent className="pt-6">
          <div className="grid grid-cols-5 gap-4 items-center">
            <div className="text-center"><div className="text-4xl font-bold">{score}%</div><div className="text-sm">Compliance Score</div><Progress value={score} className="mt-2 h-2 bg-slate-800/20" /></div>
            <div className="text-center p-3 bg-slate-800/10 rounded"><div className="text-xl font-bold">10</div><div className="text-xs">Verified</div></div>
            <div className="text-center p-3 bg-slate-800/10 rounded"><div className="text-xl font-bold">2</div><div className="text-xs">Pending</div></div>
            <div className="text-center p-3 bg-slate-800/10 rounded"><div className="text-xl font-bold text-orange-300">1</div><div className="text-xs">Expiring</div></div>
            <div className="text-center p-3 bg-slate-800/10 rounded"><div className="text-xl font-bold text-red-300">0</div><div className="text-xs">Missing</div></div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-green-500 bg-green-50 dark:bg-green-950">
        <CardContent className="pt-6 flex items-center gap-4">
          <Shield className="w-8 h-8 text-green-600" />
          <div className="flex-1">
            <h3 className="font-semibold">Surety Bond Status</h3>
            <p className="text-sm text-muted-foreground">$75,000 BMC-84 Bond Active | Expires: Dec 31, 2026 | Provider: SuretyOne</p>
          </div>
          <Badge className="bg-green-500">Active</Badge>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList><TabsTrigger value="all">All</TabsTrigger><TabsTrigger value="authority">Authority</TabsTrigger><TabsTrigger value="bond">Bond</TabsTrigger><TabsTrigger value="insurance">Insurance</TabsTrigger><TabsTrigger value="financial">Financial</TabsTrigger></TabsList>
        <TabsContent value={activeTab} className="mt-4">
          <div className="grid gap-4">
            {BROKER_DOCS.filter(d => activeTab === "all" || d.category === activeTab).map(doc => (
              <Card key={doc.value}>
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    {doc.category === "authority" && <Award className="w-5 h-5 text-blue-500" />}
                    {doc.category === "bond" && <Scale className="w-5 h-5 text-green-500" />}
                    {doc.category === "insurance" && <Shield className="w-5 h-5 text-purple-500" />}
                    {doc.category === "financial" && <DollarSign className="w-5 h-5 text-yellow-500" />}
                    {doc.category === "operational" && <FileText className="w-5 h-5 text-slate-500" />}
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
