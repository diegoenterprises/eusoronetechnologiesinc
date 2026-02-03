/**
 * EUSOCONNECT SETTINGS INTEGRATIONS PAGE
 * Universal integration hub for connecting external services
 * 100% dynamic - no mock data
 */

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { 
  Link2, Shield, Truck, FileText, Fuel, CreditCard, Building2,
  CheckCircle, XCircle, RefreshCw, AlertTriangle, Clock, Loader2,
  ExternalLink, Settings, Zap
} from "lucide-react";

const CATEGORY_ICONS: Record<string, any> = {
  insurance: Shield,
  compliance: FileText,
  terminal: Building2,
  eld: Truck,
  fuel: Fuel,
  banking: CreditCard,
  government: Building2,
};

const CATEGORY_LABELS: Record<string, string> = {
  insurance: "Insurance & Risk",
  compliance: "Compliance Networks",
  terminal: "Terminal Management",
  eld: "ELD & Telematics",
  fuel: "Fuel Management",
  banking: "Banking & Payments",
  government: "Government & Regulatory",
};

export default function SettingsIntegrations() {
  const [activeTab, setActiveTab] = useState("all");
  const [connectDialogOpen, setConnectDialogOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<any>(null);
  const [apiKey, setApiKey] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [externalId, setExternalId] = useState("");

  const { data: providers, isLoading: providersLoading, error: providersError } = 
    trpc.integrations.getProviders.useQuery({ category: activeTab === "all" ? undefined : activeTab });
  const { data: connections, refetch: refetchConnections } = 
    trpc.integrations.getConnections.useQuery();
  const { data: stats } = trpc.integrations.getDashboardStats.useQuery();

  const connectMutation = trpc.integrations.connectWithApiKey.useMutation({
    onSuccess: () => {
      refetchConnections();
      setConnectDialogOpen(false);
      resetForm();
    },
  });

  const disconnectMutation = trpc.integrations.disconnect.useMutation({
    onSuccess: () => refetchConnections(),
  });

  const syncMutation = trpc.integrations.triggerSync.useMutation();

  const resetForm = () => {
    setApiKey("");
    setApiSecret("");
    setExternalId("");
    setSelectedProvider(null);
  };

  const handleConnect = (provider: any) => {
    setSelectedProvider(provider);
    if (provider.authType === "oauth2" || provider.authType === "oauth2_with_id") {
      // TODO: Initiate OAuth flow
      setConnectDialogOpen(true);
    } else {
      setConnectDialogOpen(true);
    }
  };

  const handleSubmitConnection = () => {
    if (!selectedProvider) return;
    
    connectMutation.mutate({
      providerSlug: selectedProvider.slug,
      apiKey,
      apiSecret: apiSecret || undefined,
      externalId: externalId || undefined,
    });
  };

  const getConnectionStatus = (providerSlug: string) => {
    const connection = connections?.find((c: any) => c.providerSlug === providerSlug);
    return connection;
  };

  if (providersLoading) {
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

  if (providersError) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6 flex items-center gap-4">
            <AlertTriangle className="h-8 w-8 text-red-500" />
            <div>
              <h3 className="font-semibold text-red-700">Error Loading Integrations</h3>
              <p className="text-red-600 text-sm">{providersError.message}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const providerList = providers || [];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Link2 className="h-6 w-6" /> EusoConnect Integrations
          </h1>
          <p className="text-muted-foreground">Connect your external accounts to auto-sync data</p>
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <CheckCircle className="h-8 w-8 mx-auto text-green-500 mb-2" />
            <p className="text-2xl font-bold">{stats?.connected || 0}</p>
            <p className="text-sm text-muted-foreground">Connected</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <RefreshCw className="h-8 w-8 mx-auto text-blue-500 mb-2" />
            <p className="text-2xl font-bold">{stats?.syncing || 0}</p>
            <p className="text-sm text-muted-foreground">Syncing</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Zap className="h-8 w-8 mx-auto text-purple-500 mb-2" />
            <p className="text-2xl font-bold">{stats?.totalRecords?.toLocaleString() || 0}</p>
            <p className="text-sm text-muted-foreground">Records Synced</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <AlertTriangle className="h-8 w-8 mx-auto text-orange-500 mb-2" />
            <p className="text-2xl font-bold">{stats?.errors || 0}</p>
            <p className="text-sm text-muted-foreground">Errors</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex-wrap">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="insurance">Insurance</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          <TabsTrigger value="terminal">Terminal</TabsTrigger>
          <TabsTrigger value="eld">ELD</TabsTrigger>
          <TabsTrigger value="fuel">Fuel</TabsTrigger>
          <TabsTrigger value="banking">Banking</TabsTrigger>
          <TabsTrigger value="government">Government</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {providerList.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {providerList.map((provider: any) => {
                const connection = getConnectionStatus(provider.slug);
                const isConnected = connection?.status === "connected";
                const isSyncing = connection?.status === "syncing";
                const hasError = connection?.status === "error";
                const CategoryIcon = CATEGORY_ICONS[provider.category] || Link2;

                return (
                  <Card key={provider.id} className={isConnected ? "border-green-200" : ""}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                            <CategoryIcon className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div>
                            <CardTitle className="text-base">{provider.displayName}</CardTitle>
                            <Badge variant="outline" className="text-xs mt-1">
                              {CATEGORY_LABELS[provider.category] || provider.category}
                            </Badge>
                          </div>
                        </div>
                        {isConnected && (
                          <Badge className="bg-green-500">
                            <CheckCircle className="h-3 w-3 mr-1" /> Connected
                          </Badge>
                        )}
                        {isSyncing && (
                          <Badge className="bg-blue-500">
                            <Loader2 className="h-3 w-3 mr-1 animate-spin" /> Syncing
                          </Badge>
                        )}
                        {hasError && (
                          <Badge variant="destructive">
                            <XCircle className="h-3 w-3 mr-1" /> Error
                          </Badge>
                        )}
                        {provider.status === "beta" && !isConnected && (
                          <Badge variant="secondary">Beta</Badge>
                        )}
                        {provider.status === "coming_soon" && (
                          <Badge variant="outline">Coming Soon</Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                        {provider.description}
                      </p>
                      
                      {provider.dataTypesAvailable && provider.dataTypesAvailable.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-4">
                          {(provider.dataTypesAvailable as string[]).slice(0, 4).map((dt: string) => (
                            <Badge key={dt} variant="secondary" className="text-xs">
                              {dt.replace(/_/g, " ")}
                            </Badge>
                          ))}
                          {(provider.dataTypesAvailable as string[]).length > 4 && (
                            <Badge variant="secondary" className="text-xs">
                              +{(provider.dataTypesAvailable as string[]).length - 4} more
                            </Badge>
                          )}
                        </div>
                      )}

                      {isConnected ? (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Last sync: {connection.lastSyncAt 
                                ? new Date(connection.lastSyncAt).toLocaleDateString() 
                                : "Never"}
                            </span>
                            <span>{connection.totalRecordsSynced || 0} records</span>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="flex-1"
                              onClick={() => syncMutation.mutate({ providerSlug: provider.slug })}
                              disabled={syncMutation.isPending}
                            >
                              {syncMutation.isPending ? (
                                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                              ) : (
                                <RefreshCw className="h-4 w-4 mr-1" />
                              )}
                              Sync
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => disconnectMutation.mutate({ providerSlug: provider.slug })}
                            >
                              Disconnect
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <Button 
                          className="w-full" 
                          onClick={() => handleConnect(provider)}
                          disabled={provider.status === "coming_soon"}
                        >
                          <Link2 className="h-4 w-4 mr-2" />
                          Connect
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Link2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Integrations Available</h3>
                <p className="text-muted-foreground">
                  No integrations are available for this category yet.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={connectDialogOpen} onOpenChange={setConnectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Connect {selectedProvider?.displayName}</DialogTitle>
            <DialogDescription>
              {selectedProvider?.setupInstructions || "Enter your credentials to connect this integration."}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {selectedProvider?.requiresExternalId && (
              <div className="space-y-2">
                <Label htmlFor="externalId">
                  {selectedProvider.externalIdLabel || "External ID"}
                </Label>
                <Input
                  id="externalId"
                  placeholder={selectedProvider.externalIdFormat || "Enter ID"}
                  value={externalId}
                  onChange={(e) => setExternalId(e.target.value)}
                />
              </div>
            )}
            
            {(selectedProvider?.authType === "api_key" || selectedProvider?.authType === "api_key_secret") && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="apiKey">API Key</Label>
                  <Input
                    id="apiKey"
                    type="password"
                    placeholder="Enter your API key"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                  />
                </div>
                
                {selectedProvider?.authType === "api_key_secret" && (
                  <div className="space-y-2">
                    <Label htmlFor="apiSecret">API Secret</Label>
                    <Input
                      id="apiSecret"
                      type="password"
                      placeholder="Enter your API secret"
                      value={apiSecret}
                      onChange={(e) => setApiSecret(e.target.value)}
                    />
                  </div>
                )}
              </>
            )}

            {(selectedProvider?.authType === "oauth2" || selectedProvider?.authType === "oauth2_with_id") && (
              <div className="bg-muted p-4 rounded-lg text-center">
                <ExternalLink className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm">
                  You will be redirected to {selectedProvider?.displayName} to authorize access.
                </p>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setConnectDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmitConnection}
              disabled={connectMutation.isPending}
            >
              {connectMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              {selectedProvider?.authType?.startsWith("oauth2") ? "Continue" : "Connect"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
