/**
 * EUSOSHIELD INSURANCE DASHBOARD
 * Comprehensive insurance management interface
 * 100% dynamic - no mock data
 */

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Shield, FileText, AlertTriangle, CheckCircle, Clock, DollarSign,
  Plus, RefreshCw, Eye, Download, Calendar, TrendingUp, AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

const formatCurrency = (value: number) => `$${value.toLocaleString()}`;

const POLICY_TYPE_LABELS: Record<string, string> = {
  auto_liability: "Auto Liability",
  general_liability: "General Liability",
  cargo: "Cargo",
  workers_compensation: "Workers Comp",
  umbrella_excess: "Umbrella/Excess",
  pollution_liability: "Pollution Liability",
  environmental_impairment: "Environmental",
  motor_truck_cargo: "Motor Truck Cargo",
  physical_damage: "Physical Damage",
  non_trucking_liability: "Non-Trucking",
  trailer_interchange: "Trailer Interchange",
  reefer_breakdown: "Reefer Breakdown",
  hazmat_endorsement: "Hazmat Endorsement",
};

const STATUS_VARIANTS: Record<string, string> = {
  active: "bg-green-500",
  expired: "bg-red-500",
  cancelled: "bg-gray-500",
  pending: "bg-yellow-500",
  lapsed: "bg-orange-500",
};

export default function InsuranceDashboard() {
  const [activeTab, setActiveTab] = useState("overview");

  const { data: summary, isLoading: summaryLoading } = trpc.insurance.getSummary.useQuery();
  const { data: policies, isLoading: policiesLoading, refetch: refetchPolicies } = trpc.insurance.getPolicies.useQuery({ limit: 10 });
  const { data: claims, isLoading: claimsLoading } = trpc.insurance.getClaims.useQuery({ limit: 5 });
  const { data: claimStats } = trpc.insurance.getClaimStats.useQuery();
  const { data: certificates } = trpc.insurance.getCertificates.useQuery({ limit: 5 });
  const { data: expiringPolicies } = trpc.insurance.getExpiringPolicies.useQuery();
  const { data: alerts } = trpc.insurance.getAlerts.useQuery({ status: "active" });
  const { data: riskScore } = trpc.insurance.getRiskScore.useQuery();

  if (summaryLoading || policiesLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6" /> EusoShield Insurance
          </h1>
          <p className="text-muted-foreground">Manage policies, claims, and certificates</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetchPolicies()}>
            <RefreshCw className="h-4 w-4 mr-2" /> Refresh
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" /> Add Policy
          </Button>
        </div>
      </div>

      {/* Alerts Banner */}
      {alerts && alerts.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              <div className="flex-1">
                <p className="font-medium text-orange-800">
                  {alerts.length} insurance alert{alerts.length > 1 ? "s" : ""} require attention
                </p>
                <p className="text-sm text-orange-600">
                  {alerts[0]?.title}
                </p>
              </div>
              <Button size="sm" variant="outline">View All</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <FileText className="h-8 w-8 mx-auto text-blue-500 mb-2" />
            <p className="text-2xl font-bold">{(summary && !Array.isArray(summary) ? summary.total || summary.totalPolicies : 0) || 0}</p>
            <p className="text-sm text-muted-foreground">Total Policies</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <CheckCircle className="h-8 w-8 mx-auto text-green-500 mb-2" />
            <p className="text-2xl font-bold">{(summary && !Array.isArray(summary) ? summary.active || summary.activePolicies : 0) || 0}</p>
            <p className="text-sm text-muted-foreground">Active</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="h-8 w-8 mx-auto text-yellow-500 mb-2" />
            <p className="text-2xl font-bold">{(summary && !Array.isArray(summary) ? summary.expiringSoon || summary.expiringPolicies : 0) || 0}</p>
            <p className="text-sm text-muted-foreground">Expiring Soon</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <DollarSign className="h-8 w-8 mx-auto text-purple-500 mb-2" />
            <p className="text-2xl font-bold">
              {formatCurrency((summary && !Array.isArray(summary) ? summary.totalCoverage : 0) || 0)}
            </p>
            <p className="text-sm text-muted-foreground">Total Coverage</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-8 w-8 mx-auto text-indigo-500 mb-2" />
            <p className="text-2xl font-bold">
              {riskScore?.overallScore || "N/A"}
            </p>
            <p className="text-sm text-muted-foreground">Risk Score</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="policies">Policies</TabsTrigger>
          <TabsTrigger value="claims">Claims</TabsTrigger>
          <TabsTrigger value="certificates">Certificates</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6 space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Expiring Policies */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-yellow-500" />
                  Expiring Soon
                </CardTitle>
                <CardDescription>Policies expiring in the next 30 days</CardDescription>
              </CardHeader>
              <CardContent>
                {expiringPolicies && expiringPolicies.length > 0 ? (
                  <div className="space-y-3">
                    {expiringPolicies.slice(0, 5).map((policy: any) => (
                      <div key={policy.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <div>
                          <p className="font-medium">{policy.policyNumber}</p>
                          <p className="text-sm text-muted-foreground">
                            {POLICY_TYPE_LABELS[policy.policyType] || policy.policyType}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                            <Calendar className="h-3 w-3 mr-1" />
                            {new Date(policy.expirationDate).toLocaleDateString()}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    No policies expiring soon
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Claims Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-blue-500" />
                  Claims Overview
                </CardTitle>
                <CardDescription>Recent claims activity</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <p className="text-2xl font-bold">{claimStats?.open || 0}</p>
                    <p className="text-sm text-muted-foreground">Open Claims</p>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <p className="text-2xl font-bold">
                      {formatCurrency(claimStats?.totalPaid || 0)}
                    </p>
                    <p className="text-sm text-muted-foreground">Total Paid</p>
                  </div>
                </div>
                {claims && claims.length > 0 ? (
                  <div className="space-y-2">
                    {claims.slice(0, 3).map((claim: any) => (
                      <div key={claim.id} className="flex items-center justify-between py-2 border-b last:border-0">
                        <div>
                          <p className="font-medium">{claim.claimNumber}</p>
                          <p className="text-sm text-muted-foreground">{claim.claimType}</p>
                        </div>
                        <Badge className={STATUS_VARIANTS[claim.status] || "bg-gray-500"}>
                          {claim.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-4">No claims</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="policies" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>All Policies</CardTitle>
            </CardHeader>
            <CardContent>
              {policies && policies.length > 0 ? (
                <div className="space-y-3">
                  {policies.map((policy: any) => (
                    <div key={policy.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50">
                      <div className="flex items-center gap-4">
                        <Shield className="h-10 w-10 text-muted-foreground" />
                        <div>
                          <p className="font-semibold">{policy.policyNumber}</p>
                          <p className="text-sm text-muted-foreground">
                            {POLICY_TYPE_LABELS[policy.policyType] || policy.policyType}
                            {policy.providerName && ` - ${policy.providerName}`}
                          </p>
                          <p className="text-sm">
                            Coverage: {formatCurrency(parseFloat(policy.perOccurrenceLimit || policy.aggregateLimit || 0))}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <Badge className={STATUS_VARIANTS[policy.status] || "bg-gray-500"}>
                            {policy.status}
                          </Badge>
                          <p className="text-sm text-muted-foreground mt-1">
                            Expires: {new Date(policy.expirationDate).toLocaleDateString()}
                          </p>
                        </div>
                        <Button variant="ghost" size="icon">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Policies Found</h3>
                  <p className="text-muted-foreground mb-4">
                    Add your first policy or connect an integration to sync policies automatically.
                  </p>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" /> Add Policy
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="claims" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Insurance Claims</CardTitle>
                <CardDescription>Track and manage your claims</CardDescription>
              </div>
              <Button>
                <Plus className="h-4 w-4 mr-2" /> File Claim
              </Button>
            </CardHeader>
            <CardContent>
              {claims && claims.length > 0 ? (
                <div className="space-y-3">
                  {claims.map((claim: any) => (
                    <div key={claim.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-semibold">{claim.claimNumber}</p>
                        <p className="text-sm text-muted-foreground">
                          {claim.claimType?.replace(/_/g, " ")} - {claim.description?.substring(0, 50)}...
                        </p>
                        <p className="text-sm">
                          Incident: {new Date(claim.incidentDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <Badge className={STATUS_VARIANTS[claim.status] || "bg-gray-500"}>
                            {claim.status}
                          </Badge>
                          <p className="text-sm text-muted-foreground mt-1">
                            {claim.claimedAmount && formatCurrency(parseFloat(claim.claimedAmount))}
                          </p>
                        </div>
                        <Button variant="ghost" size="icon">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Claims</h3>
                  <p className="text-muted-foreground">No claims have been filed yet.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="certificates" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Certificates of Insurance</CardTitle>
                <CardDescription>Manage and issue COIs</CardDescription>
              </div>
              <Button>
                <Plus className="h-4 w-4 mr-2" /> Request COI
              </Button>
            </CardHeader>
            <CardContent>
              {certificates && certificates.length > 0 ? (
                <div className="space-y-3">
                  {certificates.map((cert: any) => (
                    <div key={cert.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-semibold">{cert.certificateNumber || `COI-${cert.id}`}</p>
                        <p className="text-sm text-muted-foreground">
                          Holder: {cert.holderName}
                        </p>
                        <p className="text-sm">
                          Issued: {new Date(cert.issuedDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge className={STATUS_VARIANTS[cert.status] || "bg-gray-500"}>
                          {cert.status}
                        </Badge>
                        <Button variant="ghost" size="icon">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Certificates</h3>
                  <p className="text-muted-foreground mb-4">
                    Request a certificate of insurance for your partners.
                  </p>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" /> Request COI
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
