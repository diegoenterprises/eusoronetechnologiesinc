/**
 * COMPANY PROFILE PAGE
 * Company settings and configuration
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
import {
  Building, MapPin, Phone, Mail, Globe, FileText, Shield,
  CreditCard, Truck, Users, Settings, Save, Upload, Edit,
  CheckCircle, AlertTriangle, Calendar, DollarSign, Clock
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface CompanyInfo {
  name: string;
  legalName: string;
  dba?: string;
  mcNumber: string;
  dotNumber: string;
  ein: string;
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };
  phone: string;
  email: string;
  website?: string;
  description?: string;
}

interface InsuranceInfo {
  liability: { carrier: string; policyNumber: string; coverage: number; expires: string };
  cargo: { carrier: string; policyNumber: string; coverage: number; expires: string };
  workersComp: { carrier: string; policyNumber: string; expires: string };
}

export default function CompanyProfile() {
  const [activeTab, setActiveTab] = useState("general");
  const [isEditing, setIsEditing] = useState(false);

  const company: CompanyInfo = {
    name: "ABC Transport LLC",
    legalName: "ABC Transport Limited Liability Company",
    dba: "ABC Trucking",
    mcNumber: "MC-123456",
    dotNumber: "DOT-7891011",
    ein: "12-3456789",
    address: {
      street: "123 Trucking Way",
      city: "Houston",
      state: "TX",
      zip: "77001",
    },
    phone: "(555) 123-4567",
    email: "info@abctransport.com",
    website: "www.abctransport.com",
    description: "ABC Transport is a leading hazmat carrier specializing in petroleum products transportation across Texas and the Gulf Coast region.",
  };

  const insurance: InsuranceInfo = {
    liability: { carrier: "Progressive Commercial", policyNumber: "PCL-2025-45821", coverage: 1000000, expires: "2025-06-30" },
    cargo: { carrier: "Great West Casualty", policyNumber: "GWC-2025-78452", coverage: 100000, expires: "2025-06-30" },
    workersComp: { carrier: "Texas Mutual", policyNumber: "TM-2025-32145", expires: "2025-12-31" },
  };

  const certifications = [
    { name: "FMCSA Authority", status: "active", number: company.mcNumber, expires: null },
    { name: "DOT Registration", status: "active", number: company.dotNumber, expires: null },
    { name: "Hazmat Certification", status: "active", number: "HM-2025-4521", expires: "2025-12-31" },
    { name: "TWIC Approved Carrier", status: "active", number: "TWIC-ABC-001", expires: null },
    { name: "SmartWay Partner", status: "active", number: "SW-2024-8892", expires: "2025-06-30" },
  ];

  const billingSettings = {
    paymentTerms: "Net 15",
    invoiceEmail: "billing@abctransport.com",
    bankName: "Chase Bank",
    accountEnding: "4521",
    routingEnding: "7890",
    autoInvoice: true,
    emailReminders: true,
  };

  const operationalSettings = {
    defaultEquipment: "MC-306 Tanker",
    operatingRadius: 500,
    hazmatEnabled: true,
    tankerEndorsement: true,
    teamDriving: false,
    weekendOperations: true,
    holidayOperations: false,
  };

  const saveChanges = () => {
    toast.success("Company profile updated");
    setIsEditing(false);
  };

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
            <h1 className="text-2xl font-bold text-white">{company.name}</h1>
            <div className="flex items-center gap-3 mt-1">
              <Badge className="bg-blue-500/20 text-blue-400">{company.mcNumber}</Badge>
              <Badge className="bg-slate-500/20 text-slate-400">{company.dotNumber}</Badge>
              <Badge className="bg-green-500/20 text-green-400">Active</Badge>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <Button variant="outline" className="border-slate-600" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button className="bg-green-600 hover:bg-green-700" onClick={saveChanges}>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
            </>
          ) : (
            <Button variant="outline" className="border-slate-600" onClick={() => setIsEditing(true)}>
              <Edit className="w-4 h-4 mr-2" />
              Edit Profile
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
                <CardTitle className="text-white flex items-center gap-2">
                  <Building className="w-5 h-5 text-blue-400" />
                  Company Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-slate-400">Legal Name</Label>
                  <Input
                    defaultValue={company.legalName}
                    disabled={!isEditing}
                    className="mt-1 bg-slate-700/50 border-slate-600"
                  />
                </div>
                <div>
                  <Label className="text-slate-400">DBA (Doing Business As)</Label>
                  <Input
                    defaultValue={company.dba}
                    disabled={!isEditing}
                    className="mt-1 bg-slate-700/50 border-slate-600"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-slate-400">MC Number</Label>
                    <Input
                      defaultValue={company.mcNumber}
                      disabled
                      className="mt-1 bg-slate-700/50 border-slate-600"
                    />
                  </div>
                  <div>
                    <Label className="text-slate-400">DOT Number</Label>
                    <Input
                      defaultValue={company.dotNumber}
                      disabled
                      className="mt-1 bg-slate-700/50 border-slate-600"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-slate-400">EIN</Label>
                  <Input
                    defaultValue={company.ein}
                    disabled={!isEditing}
                    className="mt-1 bg-slate-700/50 border-slate-600"
                  />
                </div>
                <div>
                  <Label className="text-slate-400">Description</Label>
                  <Textarea
                    defaultValue={company.description}
                    disabled={!isEditing}
                    className="mt-1 bg-slate-700/50 border-slate-600"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-green-400" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-slate-400">Street Address</Label>
                  <Input
                    defaultValue={company.address.street}
                    disabled={!isEditing}
                    className="mt-1 bg-slate-700/50 border-slate-600"
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label className="text-slate-400">City</Label>
                    <Input
                      defaultValue={company.address.city}
                      disabled={!isEditing}
                      className="mt-1 bg-slate-700/50 border-slate-600"
                    />
                  </div>
                  <div>
                    <Label className="text-slate-400">State</Label>
                    <Input
                      defaultValue={company.address.state}
                      disabled={!isEditing}
                      className="mt-1 bg-slate-700/50 border-slate-600"
                    />
                  </div>
                  <div>
                    <Label className="text-slate-400">ZIP</Label>
                    <Input
                      defaultValue={company.address.zip}
                      disabled={!isEditing}
                      className="mt-1 bg-slate-700/50 border-slate-600"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-slate-400">Phone</Label>
                  <Input
                    defaultValue={company.phone}
                    disabled={!isEditing}
                    className="mt-1 bg-slate-700/50 border-slate-600"
                  />
                </div>
                <div>
                  <Label className="text-slate-400">Email</Label>
                  <Input
                    defaultValue={company.email}
                    disabled={!isEditing}
                    className="mt-1 bg-slate-700/50 border-slate-600"
                  />
                </div>
                <div>
                  <Label className="text-slate-400">Website</Label>
                  <Input
                    defaultValue={company.website}
                    disabled={!isEditing}
                    className="mt-1 bg-slate-700/50 border-slate-600"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Insurance Tab */}
        <TabsContent value="insurance" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Shield className="w-5 h-5 text-blue-400" />
                  Liability Insurance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-xs text-slate-500">Carrier</p>
                  <p className="text-white">{insurance.liability.carrier}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Policy Number</p>
                  <p className="text-white">{insurance.liability.policyNumber}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Coverage</p>
                  <p className="text-green-400 font-bold">${(insurance.liability.coverage / 1000000).toFixed(1)}M</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Expires</p>
                  <div className="flex items-center gap-2">
                    <p className="text-white">{insurance.liability.expires}</p>
                    <Badge className={cn(
                      getDaysUntilExpiry(insurance.liability.expires) <= 30 ? "bg-yellow-500/20 text-yellow-400" : "bg-green-500/20 text-green-400"
                    )}>
                      {getDaysUntilExpiry(insurance.liability.expires)} days
                    </Badge>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="w-full border-slate-600">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Certificate
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Truck className="w-5 h-5 text-green-400" />
                  Cargo Insurance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-xs text-slate-500">Carrier</p>
                  <p className="text-white">{insurance.cargo.carrier}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Policy Number</p>
                  <p className="text-white">{insurance.cargo.policyNumber}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Coverage</p>
                  <p className="text-green-400 font-bold">${(insurance.cargo.coverage / 1000).toFixed(0)}K</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Expires</p>
                  <div className="flex items-center gap-2">
                    <p className="text-white">{insurance.cargo.expires}</p>
                    <Badge className="bg-green-500/20 text-green-400">
                      {getDaysUntilExpiry(insurance.cargo.expires)} days
                    </Badge>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="w-full border-slate-600">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Certificate
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-purple-400" />
                  Workers Comp
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-xs text-slate-500">Carrier</p>
                  <p className="text-white">{insurance.workersComp.carrier}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Policy Number</p>
                  <p className="text-white">{insurance.workersComp.policyNumber}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Expires</p>
                  <div className="flex items-center gap-2">
                    <p className="text-white">{insurance.workersComp.expires}</p>
                    <Badge className="bg-green-500/20 text-green-400">
                      {getDaysUntilExpiry(insurance.workersComp.expires)} days
                    </Badge>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="w-full border-slate-600">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Certificate
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Certifications Tab */}
        <TabsContent value="certifications" className="mt-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Certifications & Authorities</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {certifications.map((cert, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 rounded-lg bg-slate-700/30">
                    <div className="flex items-center gap-4">
                      <div className="p-2 rounded-lg bg-green-500/20">
                        <CheckCircle className="w-5 h-5 text-green-400" />
                      </div>
                      <div>
                        <p className="text-white font-medium">{cert.name}</p>
                        <p className="text-sm text-slate-400">{cert.number}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {cert.expires ? (
                        <div className="text-right">
                          <p className="text-xs text-slate-500">Expires</p>
                          <p className="text-white">{cert.expires}</p>
                        </div>
                      ) : (
                        <p className="text-slate-500 text-sm">No expiration</p>
                      )}
                      <Badge className="bg-green-500/20 text-green-400">{cert.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Billing Tab */}
        <TabsContent value="billing" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-green-400" />
                  Payment Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-slate-400">Payment Terms</Label>
                  <Input
                    defaultValue={billingSettings.paymentTerms}
                    disabled={!isEditing}
                    className="mt-1 bg-slate-700/50 border-slate-600"
                  />
                </div>
                <div>
                  <Label className="text-slate-400">Invoice Email</Label>
                  <Input
                    defaultValue={billingSettings.invoiceEmail}
                    disabled={!isEditing}
                    className="mt-1 bg-slate-700/50 border-slate-600"
                  />
                </div>
                <Separator className="bg-slate-700" />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white">Auto-generate Invoices</p>
                    <p className="text-xs text-slate-500">Automatically create invoices on delivery</p>
                  </div>
                  <Switch defaultChecked={billingSettings.autoInvoice} disabled={!isEditing} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white">Email Payment Reminders</p>
                    <p className="text-xs text-slate-500">Send reminders for overdue invoices</p>
                  </div>
                  <Switch defaultChecked={billingSettings.emailReminders} disabled={!isEditing} />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-blue-400" />
                  Bank Account
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-slate-400">Bank Name</Label>
                  <Input
                    defaultValue={billingSettings.bankName}
                    disabled={!isEditing}
                    className="mt-1 bg-slate-700/50 border-slate-600"
                  />
                </div>
                <div>
                  <Label className="text-slate-400">Account Number</Label>
                  <Input
                    defaultValue={`****${billingSettings.accountEnding}`}
                    disabled
                    className="mt-1 bg-slate-700/50 border-slate-600"
                  />
                </div>
                <div>
                  <Label className="text-slate-400">Routing Number</Label>
                  <Input
                    defaultValue={`****${billingSettings.routingEnding}`}
                    disabled
                    className="mt-1 bg-slate-700/50 border-slate-600"
                  />
                </div>
                <Button variant="outline" className="w-full border-slate-600">
                  Update Bank Information
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Operations Tab */}
        <TabsContent value="operations" className="mt-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Settings className="w-5 h-5 text-purple-400" />
                Operational Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label className="text-slate-400">Default Equipment Type</Label>
                    <Input
                      defaultValue={operationalSettings.defaultEquipment}
                      disabled={!isEditing}
                      className="mt-1 bg-slate-700/50 border-slate-600"
                    />
                  </div>
                  <div>
                    <Label className="text-slate-400">Operating Radius (miles)</Label>
                    <Input
                      type="number"
                      defaultValue={operationalSettings.operatingRadius}
                      disabled={!isEditing}
                      className="mt-1 bg-slate-700/50 border-slate-600"
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white">Hazmat Operations</p>
                      <p className="text-xs text-slate-500">Accept hazmat loads</p>
                    </div>
                    <Switch defaultChecked={operationalSettings.hazmatEnabled} disabled={!isEditing} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white">Tanker Endorsement</p>
                      <p className="text-xs text-slate-500">Tanker-qualified drivers</p>
                    </div>
                    <Switch defaultChecked={operationalSettings.tankerEndorsement} disabled={!isEditing} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white">Team Driving</p>
                      <p className="text-xs text-slate-500">Support team driver assignments</p>
                    </div>
                    <Switch defaultChecked={operationalSettings.teamDriving} disabled={!isEditing} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white">Weekend Operations</p>
                      <p className="text-xs text-slate-500">Accept weekend loads</p>
                    </div>
                    <Switch defaultChecked={operationalSettings.weekendOperations} disabled={!isEditing} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white">Holiday Operations</p>
                      <p className="text-xs text-slate-500">Accept holiday loads</p>
                    </div>
                    <Switch defaultChecked={operationalSettings.holidayOperations} disabled={!isEditing} />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
