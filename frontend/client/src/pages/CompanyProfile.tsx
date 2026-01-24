/**
 * COMPANY PROFILE PAGE
 * 100% Dynamic - No mock data
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  Building, MapPin, Phone, Mail, Globe, FileText, Shield,
  CreditCard, Truck, Users, Settings, Save, Upload, Edit,
  CheckCircle, AlertTriangle, DollarSign, Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function CompanyProfile() {
  const [activeTab, setActiveTab] = useState("general");
  const [isEditing, setIsEditing] = useState(false);

  const companyQuery = trpc.companies.getMyCompany.useQuery();
  const insuranceQuery = trpc.companies.getInsurance.useQuery();
  const certificationsQuery = trpc.companies.getCertifications.useQuery();
  const billingQuery = trpc.companies.getBillingSettings.useQuery();
  const operationsQuery = trpc.companies.getOperationalSettings.useQuery();

  const updateCompanyMutation = trpc.companies.update.useMutation({
    onSuccess: () => { toast.success("Company profile updated"); setIsEditing(false); companyQuery.refetch(); },
    onError: (error) => toast.error("Failed to update", { description: error.message }),
  });

  const updateBillingMutation = trpc.companies.updateBillingSettings.useMutation({
    onSuccess: () => { toast.success("Billing settings updated"); billingQuery.refetch(); },
    onError: (error) => toast.error("Failed to update", { description: error.message }),
  });

  const updateOperationsMutation = trpc.companies.updateOperationalSettings.useMutation({
    onSuccess: () => { toast.success("Operational settings updated"); operationsQuery.refetch(); },
    onError: (error) => toast.error("Failed to update", { description: error.message }),
  });

  if (companyQuery.error) {
    return (
      <div className="p-6 text-center">
        <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <p className="text-red-400">Error loading company data</p>
        <Button className="mt-4" onClick={() => companyQuery.refetch()}>Retry</Button>
      </div>
    );
  }

  const company = companyQuery.data;

  const getDaysUntilExpiry = (dateStr: string) => {
    const expiry = new Date(dateStr);
    const now = new Date();
    const diff = expiry.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-lg bg-slate-700 flex items-center justify-center">
            <Building className="w-8 h-8 text-slate-400" />
          </div>
          <div>
            {companyQuery.isLoading ? <Skeleton className="h-8 w-48" /> : (
              <h1 className="text-2xl font-bold text-white">{company?.name}</h1>
            )}
            <div className="flex items-center gap-3 mt-1">
              {companyQuery.isLoading ? <Skeleton className="h-6 w-32" /> : (
                <>
                  <Badge className="bg-blue-500/20 text-blue-400">{company?.mcNumber}</Badge>
                  <Badge className="bg-slate-500/20 text-slate-400">{company?.dotNumber}</Badge>
                  <Badge className="bg-green-500/20 text-green-400">{company?.status}</Badge>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <Button variant="outline" className="border-slate-600" onClick={() => setIsEditing(false)}>Cancel</Button>
              <Button className="bg-green-600 hover:bg-green-700" onClick={() => updateCompanyMutation.mutate({})} disabled={updateCompanyMutation.isPending}>
                {updateCompanyMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}Save Changes
              </Button>
            </>
          ) : (
            <Button variant="outline" className="border-slate-600" onClick={() => setIsEditing(true)}>
              <Edit className="w-4 h-4 mr-2" />Edit Profile
            </Button>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-slate-800 border border-slate-700">
          <TabsTrigger value="general" className="data-[state=active]:bg-blue-600">General</TabsTrigger>
          <TabsTrigger value="insurance" className="data-[state=active]:bg-blue-600">Insurance</TabsTrigger>
          <TabsTrigger value="certifications" className="data-[state=active]:bg-blue-600">Certifications</TabsTrigger>
          <TabsTrigger value="billing" className="data-[state=active]:bg-blue-600">Billing</TabsTrigger>
          <TabsTrigger value="operations" className="data-[state=active]:bg-blue-600">Operations</TabsTrigger>
        </TabsList>

        {/* General Tab */}
        <TabsContent value="general" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2"><Building className="w-5 h-5 text-blue-400" />Company Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {companyQuery.isLoading ? (
                  [1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-12 w-full" />)
                ) : (
                  <>
                    <div><Label className="text-slate-400">Legal Name</Label><Input defaultValue={company?.legalName} disabled={!isEditing} className="mt-1 bg-slate-700/50 border-slate-600" /></div>
                    <div><Label className="text-slate-400">DBA</Label><Input defaultValue={company?.dba} disabled={!isEditing} className="mt-1 bg-slate-700/50 border-slate-600" /></div>
                    <div className="grid grid-cols-2 gap-4">
                      <div><Label className="text-slate-400">MC Number</Label><Input defaultValue={company?.mcNumber} disabled className="mt-1 bg-slate-700/50 border-slate-600" /></div>
                      <div><Label className="text-slate-400">DOT Number</Label><Input defaultValue={company?.dotNumber} disabled className="mt-1 bg-slate-700/50 border-slate-600" /></div>
                    </div>
                    <div><Label className="text-slate-400">EIN</Label><Input defaultValue={company?.ein} disabled={!isEditing} className="mt-1 bg-slate-700/50 border-slate-600" /></div>
                    <div><Label className="text-slate-400">Description</Label><Textarea defaultValue={company?.description} disabled={!isEditing} className="mt-1 bg-slate-700/50 border-slate-600" rows={3} /></div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2"><MapPin className="w-5 h-5 text-green-400" />Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {companyQuery.isLoading ? (
                  [1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-12 w-full" />)
                ) : (
                  <>
                    <div><Label className="text-slate-400">Street Address</Label><Input defaultValue={company?.address?.street} disabled={!isEditing} className="mt-1 bg-slate-700/50 border-slate-600" /></div>
                    <div className="grid grid-cols-3 gap-4">
                      <div><Label className="text-slate-400">City</Label><Input defaultValue={company?.address?.city} disabled={!isEditing} className="mt-1 bg-slate-700/50 border-slate-600" /></div>
                      <div><Label className="text-slate-400">State</Label><Input defaultValue={company?.address?.state} disabled={!isEditing} className="mt-1 bg-slate-700/50 border-slate-600" /></div>
                      <div><Label className="text-slate-400">ZIP</Label><Input defaultValue={company?.address?.zip} disabled={!isEditing} className="mt-1 bg-slate-700/50 border-slate-600" /></div>
                    </div>
                    <div><Label className="text-slate-400">Phone</Label><Input defaultValue={company?.phone} disabled={!isEditing} className="mt-1 bg-slate-700/50 border-slate-600" /></div>
                    <div><Label className="text-slate-400">Email</Label><Input defaultValue={company?.email} disabled={!isEditing} className="mt-1 bg-slate-700/50 border-slate-600" /></div>
                    <div><Label className="text-slate-400">Website</Label><Input defaultValue={company?.website} disabled={!isEditing} className="mt-1 bg-slate-700/50 border-slate-600" /></div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Insurance Tab */}
        <TabsContent value="insurance" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {insuranceQuery.isLoading ? (
              [1, 2, 3].map((i) => <Card key={i} className="bg-slate-800/50 border-slate-700"><CardContent className="p-4"><Skeleton className="h-40 w-full" /></CardContent></Card>)
            ) : (
              insuranceQuery.data?.map((insurance) => (
                <Card key={insurance.type} className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Shield className={cn("w-5 h-5", insurance.type === "liability" ? "text-blue-400" : insurance.type === "cargo" ? "text-green-400" : "text-purple-400")} />
                      {insurance.type === "liability" ? "Liability" : insurance.type === "cargo" ? "Cargo" : "Workers Comp"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div><p className="text-xs text-slate-500">Carrier</p><p className="text-white">{insurance.carrier}</p></div>
                    <div><p className="text-xs text-slate-500">Policy Number</p><p className="text-white">{insurance.policyNumber}</p></div>
                    {insurance.coverage && <div><p className="text-xs text-slate-500">Coverage</p><p className="text-green-400 font-bold">${(insurance.coverage / 1000000).toFixed(1)}M</p></div>}
                    <div>
                      <p className="text-xs text-slate-500">Expires</p>
                      <div className="flex items-center gap-2">
                        <p className="text-white">{insurance.expirationDate}</p>
                        <Badge className={cn(getDaysUntilExpiry(insurance.expirationDate) <= 30 ? "bg-yellow-500/20 text-yellow-400" : "bg-green-500/20 text-green-400")}>
                          {getDaysUntilExpiry(insurance.expirationDate)} days
                        </Badge>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="w-full border-slate-600"><Upload className="w-4 h-4 mr-2" />Upload Certificate</Button>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Certifications Tab */}
        <TabsContent value="certifications" className="mt-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader><CardTitle className="text-white">Certifications & Authorities</CardTitle></CardHeader>
            <CardContent>
              {certificationsQuery.isLoading ? (
                <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
              ) : (
                <div className="space-y-3">
                  {certificationsQuery.data?.map((cert) => (
                    <div key={cert.id} className="flex items-center justify-between p-4 rounded-lg bg-slate-700/30">
                      <div className="flex items-center gap-4">
                        <div className="p-2 rounded-lg bg-green-500/20"><CheckCircle className="w-5 h-5 text-green-400" /></div>
                        <div>
                          <p className="text-white font-medium">{cert.name}</p>
                          <p className="text-sm text-slate-400">{cert.number}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {cert.expirationDate ? (
                          <div className="text-right">
                            <p className="text-xs text-slate-500">Expires</p>
                            <p className="text-white">{cert.expirationDate}</p>
                          </div>
                        ) : (
                          <p className="text-slate-500 text-sm">No expiration</p>
                        )}
                        <Badge className="bg-green-500/20 text-green-400">{cert.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Billing Tab */}
        <TabsContent value="billing" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader><CardTitle className="text-white flex items-center gap-2"><DollarSign className="w-5 h-5 text-green-400" />Payment Settings</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {billingQuery.isLoading ? (
                  [1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-12 w-full" />)
                ) : (
                  <>
                    <div><Label className="text-slate-400">Payment Terms</Label><Input defaultValue={billingQuery.data?.paymentTerms} disabled={!isEditing} className="mt-1 bg-slate-700/50 border-slate-600" /></div>
                    <div><Label className="text-slate-400">Invoice Email</Label><Input defaultValue={billingQuery.data?.invoiceEmail} disabled={!isEditing} className="mt-1 bg-slate-700/50 border-slate-600" /></div>
                    <Separator className="bg-slate-700" />
                    <div className="flex items-center justify-between">
                      <div><p className="text-white">Auto-generate Invoices</p><p className="text-xs text-slate-500">Automatically create invoices on delivery</p></div>
                      <Switch defaultChecked={billingQuery.data?.autoInvoice} disabled={!isEditing} />
                    </div>
                    <div className="flex items-center justify-between">
                      <div><p className="text-white">Email Payment Reminders</p><p className="text-xs text-slate-500">Send reminders for overdue invoices</p></div>
                      <Switch defaultChecked={billingQuery.data?.emailReminders} disabled={!isEditing} />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader><CardTitle className="text-white flex items-center gap-2"><CreditCard className="w-5 h-5 text-blue-400" />Bank Account</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {billingQuery.isLoading ? (
                  [1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)
                ) : (
                  <>
                    <div><Label className="text-slate-400">Bank Name</Label><Input defaultValue={billingQuery.data?.bankName} disabled={!isEditing} className="mt-1 bg-slate-700/50 border-slate-600" /></div>
                    <div><Label className="text-slate-400">Account Number</Label><Input defaultValue={`****${billingQuery.data?.accountEnding}`} disabled className="mt-1 bg-slate-700/50 border-slate-600" /></div>
                    <div><Label className="text-slate-400">Routing Number</Label><Input defaultValue={`****${billingQuery.data?.routingEnding}`} disabled className="mt-1 bg-slate-700/50 border-slate-600" /></div>
                    <Button variant="outline" className="w-full border-slate-600">Update Bank Information</Button>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Operations Tab */}
        <TabsContent value="operations" className="mt-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader><CardTitle className="text-white flex items-center gap-2"><Settings className="w-5 h-5 text-purple-400" />Operational Settings</CardTitle></CardHeader>
            <CardContent>
              {operationsQuery.isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">{[1, 2, 3, 4, 5, 6].map((i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div><Label className="text-slate-400">Default Equipment Type</Label><Input defaultValue={operationsQuery.data?.defaultEquipment} disabled={!isEditing} className="mt-1 bg-slate-700/50 border-slate-600" /></div>
                    <div><Label className="text-slate-400">Operating Radius (miles)</Label><Input type="number" defaultValue={operationsQuery.data?.operatingRadius} disabled={!isEditing} className="mt-1 bg-slate-700/50 border-slate-600" /></div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between"><div><p className="text-white">Hazmat Operations</p><p className="text-xs text-slate-500">Accept hazmat loads</p></div><Switch defaultChecked={operationsQuery.data?.hazmatEnabled} disabled={!isEditing} /></div>
                    <div className="flex items-center justify-between"><div><p className="text-white">Tanker Endorsement</p><p className="text-xs text-slate-500">Tanker-qualified drivers</p></div><Switch defaultChecked={operationsQuery.data?.tankerEndorsement} disabled={!isEditing} /></div>
                    <div className="flex items-center justify-between"><div><p className="text-white">Team Driving</p><p className="text-xs text-slate-500">Support team driver assignments</p></div><Switch defaultChecked={operationsQuery.data?.teamDriving} disabled={!isEditing} /></div>
                    <div className="flex items-center justify-between"><div><p className="text-white">Weekend Operations</p><p className="text-xs text-slate-500">Accept weekend loads</p></div><Switch defaultChecked={operationsQuery.data?.weekendOperations} disabled={!isEditing} /></div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
