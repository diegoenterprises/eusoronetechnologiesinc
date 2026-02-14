/**
 * SHIPPER COMPLIANCE - Business Verification, Credit, Insurance
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
import { Factory, AlertTriangle, Clock, Upload, Shield, CheckCircle2, XCircle, Building, DollarSign, FileText, CreditCard } from "lucide-react";

const SHIPPER_DOCS = [
  { value: "business_license", label: "Business License", category: "business", required: true },
  { value: "ein_letter", label: "EIN Verification Letter", category: "business", required: true },
  { value: "articles_incorporation", label: "Articles of Incorporation", category: "business", required: true },
  { value: "duns_number", label: "D-U-N-S Number", category: "business", required: false },
  { value: "credit_application", label: "Credit Application", category: "credit", required: true },
  { value: "trade_references", label: "Trade References (3+)", category: "credit", required: true },
  { value: "bank_reference", label: "Bank Reference Letter", category: "credit", required: false },
  { value: "financial_statements", label: "Financial Statements", category: "credit", required: false },
  { value: "cargo_insurance", label: "Cargo Insurance", category: "insurance", required: false },
  { value: "general_liability", label: "General Liability Insurance", category: "insurance", required: true },
  { value: "product_liability", label: "Product Liability Insurance", category: "insurance", required: false },
  { value: "w9", label: "W-9 Form", category: "financial", required: true },
  { value: "payment_terms", label: "Payment Terms Agreement", category: "financial", required: true },
  { value: "ach_authorization", label: "ACH Authorization", category: "financial", required: false },
  { value: "facility_insurance", label: "Facility/Warehouse Insurance", category: "facility", required: false },
  { value: "food_safety_cert", label: "Food Safety Certification (if applicable)", category: "facility", required: false },
  { value: "hazmat_permit", label: "Hazmat Facility Permit (if applicable)", category: "facility", required: false },
];

export default function ShipperCompliance() {
  const [uploadOpen, setUploadOpen] = useState(false);
  const [selectedType, setSelectedType] = useState("");
  const [expirationDate, setExpirationDate] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  const complianceQuery = (trpc as any).compliance.getShipperCompliance.useQuery();
  const documentsQuery = (trpc as any).compliance.getShipperDocuments.useQuery();
  const uploadMutation = (trpc as any).compliance.uploadDocument.useMutation();

  const score = (complianceQuery.data as any)?.score ?? 88;

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
    await uploadMutation.mutateAsync({ documentType: selectedType, expirationDate, userType: "shipper" });
    setUploadOpen(false);
    documentsQuery.refetch();
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">Shipper Compliance</h1>
          <p className="text-muted-foreground">Business Verification, Credit & Insurance</p>
        </div>
        <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
          <DialogTrigger asChild><Button><Upload className="w-4 h-4 mr-2" />Upload Document</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Upload Compliance Document</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-4">
              <div><Label>Document Type</Label>
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>{SHIPPER_DOCS.map(t => <SelectItem key={t.value} value={t.value}>{t.label}{t.required && " *"}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Expiration Date</Label><Input type="date" value={expirationDate} onChange={e => setExpirationDate(e.target.value)} /></div>
              <div><Label>Upload File</Label><Input type="file" accept=".pdf,.jpg,.png" /></div>
              <Button className="w-full" onClick={handleUpload} disabled={!selectedType}><Upload className="w-4 h-4 mr-2" />Upload</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
        <CardContent className="pt-6">
          <div className="grid grid-cols-5 gap-4 items-center">
            <div className="text-center"><div className="text-4xl font-bold">{score}%</div><div className="text-sm">Compliance Score</div><Progress value={score} className="mt-2 h-2 bg-slate-800/20" /></div>
            <div className="text-center p-3 bg-slate-800/10 rounded"><div className="text-xl font-bold">9</div><div className="text-xs">Verified</div></div>
            <div className="text-center p-3 bg-slate-800/10 rounded"><div className="text-xl font-bold">2</div><div className="text-xs">Pending</div></div>
            <div className="text-center p-3 bg-slate-800/10 rounded"><div className="text-xl font-bold text-orange-300">0</div><div className="text-xs">Expiring</div></div>
            <div className="text-center p-3 bg-slate-800/10 rounded"><div className="text-xl font-bold text-yellow-300">1</div><div className="text-xs">Optional Missing</div></div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-blue-500 bg-blue-50 dark:bg-blue-950">
        <CardContent className="pt-6 flex items-center gap-4">
          <CreditCard className="w-8 h-8 text-blue-600" />
          <div className="flex-1">
            <h3 className="font-semibold">Credit Status</h3>
            <p className="text-sm text-muted-foreground">Credit Limit: $50,000 | Terms: Net 30 | Rating: A | Available: $42,500</p>
          </div>
          <Badge className="bg-blue-500">Approved</Badge>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList><TabsTrigger value="all">All</TabsTrigger><TabsTrigger value="business">Business</TabsTrigger><TabsTrigger value="credit">Credit</TabsTrigger><TabsTrigger value="insurance">Insurance</TabsTrigger><TabsTrigger value="financial">Financial</TabsTrigger></TabsList>
        <TabsContent value={activeTab} className="mt-4">
          <div className="grid gap-4">
            {SHIPPER_DOCS.filter(d => activeTab === "all" || d.category === activeTab).map(doc => (
              <Card key={doc.value}>
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    {doc.category === "business" && <Building className="w-5 h-5 text-blue-500" />}
                    {doc.category === "credit" && <CreditCard className="w-5 h-5 text-green-500" />}
                    {doc.category === "insurance" && <Shield className="w-5 h-5 text-purple-500" />}
                    {doc.category === "financial" && <DollarSign className="w-5 h-5 text-yellow-500" />}
                    {doc.category === "facility" && <Factory className="w-5 h-5 text-slate-500" />}
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
