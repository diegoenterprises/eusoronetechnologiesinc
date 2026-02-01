/**
 * INDUSTRY DIRECTORY PAGE
 * Directory of Oil & Gas companies, carriers, terminals, and fuel resellers
 */

import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { 
  Search, Building2, Truck, MapPin, Phone, Globe, 
  CheckCircle, Filter, ChevronRight, Factory, Fuel,
  Package, Warehouse, Users, ExternalLink, X, RefreshCw
} from "lucide-react";
import { cn } from "@/lib/utils";

type CompanyType = "refinery" | "shipper" | "carrier" | "terminal" | "fuel_reseller" | "logistics" | "exploration";
type State = string;

interface Company {
  id: string;
  name: string;
  type: CompanyType;
  state: State;
  city: string;
  phone: string;
  website?: string;
  isVerified: boolean;
  rating: number;
  description?: string;
  services: string[];
}

const STATE_NAMES: Record<string, string> = {
  TX: "Texas", LA: "Louisiana", OK: "Oklahoma", NM: "New Mexico", CO: "Colorado",
  WY: "Wyoming", MT: "Montana", ND: "North Dakota", CA: "California", AK: "Alaska",
};

const COMPANY_TYPE_LABELS: Record<CompanyType, string> = {
  refinery: "Refinery", shipper: "Shipper", carrier: "Carrier", terminal: "Terminal",
  fuel_reseller: "Fuel Reseller", logistics: "Logistics", exploration: "Exploration",
};

const TYPE_ICONS: Record<CompanyType, React.ReactNode> = {
  refinery: <Factory className="w-4 h-4" />,
  shipper: <Package className="w-4 h-4" />,
  carrier: <Truck className="w-4 h-4" />,
  terminal: <Warehouse className="w-4 h-4" />,
  fuel_reseller: <Fuel className="w-4 h-4" />,
  logistics: <Users className="w-4 h-4" />,
  exploration: <Building2 className="w-4 h-4" />,
};

const TYPE_COLORS: Record<CompanyType, string> = {
  refinery: "bg-orange-500/20 text-orange-400",
  shipper: "bg-blue-500/20 text-blue-400",
  carrier: "bg-green-500/20 text-green-400",
  terminal: "bg-purple-500/20 text-purple-400",
  fuel_reseller: "bg-yellow-500/20 text-yellow-400",
  logistics: "bg-cyan-500/20 text-cyan-400",
  exploration: "bg-red-500/20 text-red-400",
};

export default function IndustryDirectory() {
  const [searchTerm, setSearchTerm] = useState("");
  const [stateFilter, setStateFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState("all");
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);

  // tRPC query for companies
  const companiesQuery = trpc.companies.list.useQuery({ search: searchTerm || undefined });

  if (companiesQuery.isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => <Skeleton key={i} className="h-48" />)}
        </div>
      </div>
    );
  }

  if (companiesQuery.isError) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-red-400 mb-4">Failed to load directory</p>
        <Button onClick={() => companiesQuery.refetch()} variant="outline">
          <RefreshCw size={16} className="mr-2" /> Retry
        </Button>
      </div>
    );
  }

  const allCompanies: Company[] = (companiesQuery.data || []).map((c: any) => ({
    id: String(c.id),
    name: c.legalName || c.name || '',
    type: (c.type || 'carrier') as CompanyType,
    state: c.state || '',
    city: c.city || '',
    phone: c.phone || '',
    website: c.website,
    isVerified: c.isVerified ?? false,
    rating: c.rating || 0,
    description: c.description,
    services: c.services || [],
  }));

  const filteredCompanies = useMemo(() => {
    let companies = allCompanies;

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      companies = companies.filter(c => c.name.toLowerCase().includes(q) || c.city.toLowerCase().includes(q));
    }

    if (stateFilter !== "all") {
      companies = companies.filter(c => c.state === stateFilter);
    }

    if (typeFilter !== "all") {
      companies = companies.filter(c => c.type === typeFilter);
    }

    if (activeTab === "verified") {
      companies = companies.filter(c => c.isVerified);
    }

    return companies;
  }, [allCompanies, searchTerm, stateFilter, typeFilter, activeTab]);

  const stats = {
    total: allCompanies.length,
    verified: allCompanies.filter(c => c.isVerified).length,
    carriers: allCompanies.filter(c => c.type === "carrier").length,
    refineries: allCompanies.filter(c => c.type === "refinery").length,
    states: Array.from(new Set(allCompanies.map(c => c.state))).length,
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Industry Directory</h1>
          <p className="text-slate-400">Oil & Gas companies, carriers, and terminals</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Building2 className="w-4 h-4 mr-2" />
          Add Company
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">Total Companies</p>
                <p className="text-2xl font-bold text-white">{stats.total}</p>
              </div>
              <Building2 className="w-8 h-8 text-blue-400 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">Verified</p>
                <p className="text-2xl font-bold text-green-400">{stats.verified}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-400 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">Carriers</p>
                <p className="text-2xl font-bold text-purple-400">{stats.carriers}</p>
              </div>
              <Truck className="w-8 h-8 text-purple-400 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">Refineries</p>
                <p className="text-2xl font-bold text-orange-400">{stats.refineries}</p>
              </div>
              <Factory className="w-8 h-8 text-orange-400 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">States</p>
                <p className="text-2xl font-bold text-cyan-400">{stats.states}</p>
              </div>
              <MapPin className="w-8 h-8 text-cyan-400 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filters */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[250px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search companies, services..."
                className="pl-9 bg-slate-700/50 border-slate-600 text-white"
              />
            </div>

            <Select value={stateFilter} onValueChange={setStateFilter}>
              <SelectTrigger className="w-40 bg-slate-700/50 border-slate-600 text-white">
                <SelectValue placeholder="State" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All States</SelectItem>
                {(Object.keys(STATE_NAMES) as State[]).map((state) => (
                  <SelectItem key={state} value={state}>{STATE_NAMES[state]}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-44 bg-slate-700/50 border-slate-600 text-white">
                <SelectValue placeholder="Company Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {(Object.keys(COMPANY_TYPE_LABELS) as CompanyType[]).map((type) => (
                  <SelectItem key={type} value={type}>{COMPANY_TYPE_LABELS[type]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-slate-800/50 border border-slate-700">
          <TabsTrigger value="all">All Companies ({allCompanies.length})</TabsTrigger>
          <TabsTrigger value="verified">Verified ({stats.verified})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          <CompanyGrid 
            companies={filteredCompanies} 
            onSelect={setSelectedCompany}
            selectedId={selectedCompany?.id}
          />
        </TabsContent>

        <TabsContent value="verified" className="mt-6">
          <CompanyGrid 
            companies={filteredCompanies} 
            onSelect={setSelectedCompany}
            selectedId={selectedCompany?.id}
          />
        </TabsContent>
      </Tabs>

      {/* Company Detail Modal */}
      {selectedCompany && (
        <CompanyDetailModal 
          company={selectedCompany} 
          onClose={() => setSelectedCompany(null)} 
        />
      )}
    </div>
  );
}

function CompanyGrid({ 
  companies, 
  onSelect,
  selectedId 
}: { 
  companies: Company[]; 
  onSelect: (c: Company) => void;
  selectedId?: string;
}) {
  if (companies.length === 0) {
    return (
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="py-12 text-center">
          <Building2 className="w-12 h-12 text-slate-500 mx-auto mb-4" />
          <p className="text-slate-400">No companies found matching your criteria</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {companies.map((company) => (
        <Card 
          key={company.id}
          onClick={() => onSelect(company)}
          className={cn(
            "bg-slate-800/50 border-slate-700 hover:border-blue-500/50 transition-all cursor-pointer",
            selectedId === company.id && "border-blue-500"
          )}
        >
          <CardContent className="p-5">
            <div className="flex items-start justify-between mb-3">
              <div className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center",
                TYPE_COLORS[company.type]
              )}>
                {TYPE_ICONS[company.type]}
              </div>
              <div className="flex items-center gap-2">
                {company.isVerified && (
                  <Badge className="bg-green-500/20 text-green-400">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Verified
                  </Badge>
                )}
              </div>
            </div>

            <h3 className="text-white font-medium mb-1">{company.name}</h3>
            
            <div className="flex items-center gap-2 text-xs text-slate-400 mb-3">
              <Badge className={TYPE_COLORS[company.type]} variant="outline">
                {COMPANY_TYPE_LABELS[company.type]}
              </Badge>
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {company.city ? `${company.city}, ` : ""}{STATE_NAMES[company.state]}
              </span>
            </div>

            <div className="flex flex-wrap gap-1 mb-3">
              {company.services.slice(0, 3).map((service, idx) => (
                <Badge key={idx} variant="outline" className="text-[10px] text-slate-400 border-slate-600">
                  {service}
                </Badge>
              ))}
              {company.services.length > 3 && (
                <Badge variant="outline" className="text-[10px] text-slate-500 border-slate-600">
                  +{company.services.length - 3} more
                </Badge>
              )}
            </div>

            <div className="flex items-center justify-between text-xs">
              {company.phone && (
                <span className="flex items-center gap-1 text-slate-400">
                  <Phone className="w-3 h-3" />
                  {company.phone}
                </span>
              )}
              <ChevronRight className="w-4 h-4 text-slate-500" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function CompanyDetailModal({ company, onClose }: { company: Company; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="bg-slate-800 border-slate-700 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <CardHeader className="border-b border-slate-700">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className={cn(
                "w-14 h-14 rounded-lg flex items-center justify-center",
                TYPE_COLORS[company.type]
              )}>
                {TYPE_ICONS[company.type]}
              </div>
              <div>
                <CardTitle className="text-white flex items-center gap-2">
                  {company.name}
                  {company.isVerified && (
                    <CheckCircle className="w-5 h-5 text-green-400" />
                  )}
                </CardTitle>
                <p className="text-sm text-slate-400">{COMPANY_TYPE_LABELS[company.type]}</p>
              </div>
            </div>
            <Button variant="ghost" onClick={onClose} className="text-slate-400">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* Location */}
          <div className="flex items-center gap-3 p-4 rounded-lg bg-slate-700/30">
            <MapPin className="w-5 h-5 text-blue-400" />
            <div>
              <p className="text-sm text-slate-400">Location</p>
              <p className="text-white">
                {company.city ? `${company.city}, ` : ""}{STATE_NAMES[company.state]}
              </p>
            </div>
          </div>

          {/* Contact */}
          {(company.phone || company.website) && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-slate-300">Contact Information</h4>
              {company.phone && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-700/30">
                  <Phone className="w-5 h-5 text-green-400" />
                  <div>
                    <p className="text-sm text-slate-400">Phone</p>
                    <p className="text-white">{company.phone}</p>
                  </div>
                </div>
              )}
              {company.website && (
                <a 
                  href={company.website} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-lg bg-slate-700/30 hover:bg-slate-700/50 transition-colors"
                >
                  <Globe className="w-5 h-5 text-purple-400" />
                  <div className="flex-1">
                    <p className="text-sm text-slate-400">Website</p>
                    <p className="text-blue-400">{company.website.replace("https://", "")}</p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-slate-500" />
                </a>
              )}
            </div>
          )}

          {/* Services */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-slate-300">Services</h4>
            <div className="flex flex-wrap gap-2">
              {company.services.map((service, idx) => (
                <Badge key={idx} className="bg-slate-700/50 text-slate-300">
                  {service}
                </Badge>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-slate-700">
            <Button className="flex-1 bg-blue-600 hover:bg-blue-700">
              Contact Company
            </Button>
            <Button variant="outline" className="flex-1 border-slate-600">
              Request Quote
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
