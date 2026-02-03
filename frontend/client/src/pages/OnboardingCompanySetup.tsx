/**
 * ONBOARDING COMPANY SETUP PAGE
 * Company profile setup during registration
 * 100% dynamic - no mock data
 */

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Building2, MapPin, Phone, Mail, Globe, 
  CheckCircle, ChevronRight, AlertTriangle, RefreshCw
} from "lucide-react";

export default function OnboardingCompanySetup() {
  const [formData, setFormData] = useState({
    companyName: "",
    dotNumber: "",
    mcNumber: "",
    einNumber: "",
    companyType: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    phone: "",
    email: "",
    website: "",
    description: "",
  });

  const { data: existingCompany, isLoading } = trpc.companies.getCurrent.useQuery();
  const updateMutation = trpc.companies.update.useMutation();

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    updateMutation.mutate({
      name: formData.companyName,
      dotNumber: formData.dotNumber,
      mcNumber: formData.mcNumber,
      einNumber: formData.einNumber,
      type: formData.companyType as any,
      address: formData.address,
      city: formData.city,
      state: formData.state,
      zipCode: formData.zipCode,
      phone: formData.phone,
      email: formData.email,
      website: formData.website,
      description: formData.description,
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Company Setup</h1>
        <p className="text-muted-foreground">Enter your company details to complete registration</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" /> Company Information
          </CardTitle>
          <CardDescription>Basic company details for your profile</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Company Name *</Label>
              <Input
                placeholder="Enter company name"
                value={formData.companyName}
                onChange={(e) => handleChange("companyName", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Company Type *</Label>
              <Select value={formData.companyType} onValueChange={(v) => handleChange("companyType", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="shipper">Shipper</SelectItem>
                  <SelectItem value="carrier">Carrier</SelectItem>
                  <SelectItem value="broker">Broker</SelectItem>
                  <SelectItem value="terminal">Terminal Operator</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>USDOT Number</Label>
              <Input
                placeholder="e.g., 1234567"
                value={formData.dotNumber}
                onChange={(e) => handleChange("dotNumber", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>MC Number</Label>
              <Input
                placeholder="e.g., MC-123456"
                value={formData.mcNumber}
                onChange={(e) => handleChange("mcNumber", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>EIN Number</Label>
              <Input
                placeholder="e.g., 12-3456789"
                value={formData.einNumber}
                onChange={(e) => handleChange("einNumber", e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" /> Address
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Street Address *</Label>
            <Input
              placeholder="Enter street address"
              value={formData.address}
              onChange={(e) => handleChange("address", e.target.value)}
            />
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>City *</Label>
              <Input
                placeholder="City"
                value={formData.city}
                onChange={(e) => handleChange("city", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>State *</Label>
              <Select value={formData.state} onValueChange={(v) => handleChange("state", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select state" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TX">Texas</SelectItem>
                  <SelectItem value="CA">California</SelectItem>
                  <SelectItem value="FL">Florida</SelectItem>
                  <SelectItem value="NY">New York</SelectItem>
                  <SelectItem value="PA">Pennsylvania</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>ZIP Code *</Label>
              <Input
                placeholder="ZIP"
                value={formData.zipCode}
                onChange={(e) => handleChange("zipCode", e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" /> Contact Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Phone Number *</Label>
              <Input
                type="tel"
                placeholder="(555) 555-5555"
                value={formData.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Email Address *</Label>
              <Input
                type="email"
                placeholder="company@example.com"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Website</Label>
            <Input
              type="url"
              placeholder="https://www.example.com"
              value={formData.website}
              onChange={(e) => handleChange("website", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Company Description</Label>
            <Textarea
              placeholder="Brief description of your company and services..."
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline">Save as Draft</Button>
        <Button onClick={handleSubmit} disabled={updateMutation.isPending}>
          {updateMutation.isPending ? "Saving..." : (
            <>
              Continue <ChevronRight className="h-4 w-4 ml-2" />
            </>
          )}
        </Button>
      </div>

      {updateMutation.isSuccess && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4 flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <p className="text-green-700">Company information saved successfully</p>
          </CardContent>
        </Card>
      )}

      {updateMutation.isError && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <p className="text-red-700">{updateMutation.error.message}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
