/**
 * COMPANIES PAGE
 * Comprehensive company management with compliance tracking
 * Insurance policies, TWIC cards, HazMat licenses, and more
 */

import { useAuth } from "@/_core/hooks/useAuth";
import { Building2, FileText, Shield, AlertCircle, CheckCircle, Clock, Plus, Edit2, Trash2, Download, Upload, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { useState } from "react";

interface ComplianceDocument {
  id: string;
  type: "insurance" | "twic" | "hazmat" | "dot" | "mc" | "other";
  name: string;
  issueDate: string;
  expiryDate: string;
  status: "valid" | "expiring_soon" | "expired";
  provider?: string;
  documentUrl?: string;
}

interface Company {
  id: string;
  name: string;
  dotNumber: string;
  mcNumber: string;
  ein: string;
  status: "active" | "inactive" | "suspended";
  founded: string;
  employees: number;
  complianceScore: number;
  documents: ComplianceDocument[];
  contact: {
    email: string;
    phone: string;
    address: string;
  };
}

export default function CompaniesPage() {
  const { user } = useAuth();
  const [selectedCompany, setSelectedCompany] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddDocument, setShowAddDocument] = useState(false);

  // tRPC query for companies
  const companiesQuery = trpc.companies.list.useQuery({ search: searchTerm || undefined });

  if (companiesQuery.isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-96" />
          <Skeleton className="h-96 lg:col-span-2" />
        </div>
      </div>
    );
  }

  if (companiesQuery.isError) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-red-400 mb-4">Failed to load companies</p>
        <Button onClick={() => companiesQuery.refetch()} variant="outline">
          <RefreshCw size={16} className="mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  const companies: Company[] = (companiesQuery.data || []).map((c: any) => ({
    id: String(c.id),
    name: c.name || 'Unknown Company',
    dotNumber: c.dotNumber || 'N/A',
    mcNumber: c.mcNumber || 'N/A',
    ein: c.ein || 'N/A',
    status: c.isActive ? 'active' : 'inactive',
    founded: c.foundedYear || 'N/A',
    employees: c.employeeCount || 0,
    complianceScore: c.complianceScore || 0,
    contact: {
      email: c.email || '',
      phone: c.phone || '',
      address: [c.address, c.city, c.state, c.zipCode].filter(Boolean).join(', '),
    },
    documents: c.documents || [],
  }));

  const filteredCompanies = companies.filter((comp) =>
    comp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    comp.dotNumber.includes(searchTerm) ||
    comp.mcNumber.includes(searchTerm)
  );

  const currentCompany = filteredCompanies[selectedCompany] || companies[0];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-900/30 text-green-400 border-green-700";
      case "inactive":
        return "bg-gray-900/30 text-gray-400 border-gray-700";
      case "suspended":
        return "bg-red-900/30 text-red-400 border-red-700";
      default:
        return "bg-gray-900/30 text-gray-400 border-gray-700";
    }
  };

  const getDocumentStatusIcon = (status: string) => {
    switch (status) {
      case "valid":
        return <CheckCircle size={16} className="text-green-400" />;
      case "expiring_soon":
        return <AlertCircle size={16} className="text-yellow-400" />;
      case "expired":
        return <AlertCircle size={16} className="text-red-400" />;
      default:
        return <Clock size={16} className="text-gray-400" />;
    }
  };

  const getDocumentStatusColor = (status: string) => {
    switch (status) {
      case "valid":
        return "bg-green-900/30 text-green-300 border-green-700";
      case "expiring_soon":
        return "bg-yellow-900/30 text-yellow-300 border-yellow-700";
      case "expired":
        return "bg-red-900/30 text-red-300 border-red-700";
      default:
        return "bg-gray-900/30 text-gray-300 border-gray-700";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Companies</h1>
          <p className="text-gray-400 mt-1">Manage company profiles and compliance documentation</p>
        </div>
        <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold transition-all">
          <Plus size={18} className="mr-2" />
          Add Company
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Companies List */}
        <div className="lg:col-span-1 space-y-4">
          <div className="relative">
            <Input
              placeholder="Search companies..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-700 border-slate-600 text-white placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30"
            />
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredCompanies.map((company, idx) => (
              <Card
                key={company.id}
                onClick={() => setSelectedCompany(idx)}
                className={`p-4 cursor-pointer transition-all ${
                  selectedCompany === idx
                    ? "bg-gradient-to-r from-blue-600/30 to-purple-600/30 border-blue-500 shadow-lg shadow-blue-500/20"
                    : "bg-slate-800 border-slate-700 hover:border-slate-600"
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <p className="text-white font-semibold">{company.name}</p>
                    <p className="text-gray-400 text-xs">{company.dotNumber}</p>
                  </div>
                  <span
                    className={`px-2 py-1 rounded text-xs font-semibold border ${getStatusColor(
                      company.status
                    )}`}
                  >
                    {company.status}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">{company.employees} employees</span>
                  <span className="text-green-400 font-semibold">{company.complianceScore}%</span>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Company Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Company Header */}
          <Card className="bg-slate-800 border-slate-700 p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">{currentCompany.name}</h2>
                <p className="text-gray-400">{currentCompany.contact.address}</p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                  <Edit2 size={16} />
                </Button>
                <Button size="sm" className="bg-red-600 hover:bg-red-700">
                  <Trash2 size={16} />
                </Button>
              </div>
            </div>

            {/* Company Info Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-slate-700/50 rounded-lg border border-slate-600">
                <p className="text-xs text-gray-500 mb-1">DOT Number</p>
                <p className="text-white font-semibold">{currentCompany.dotNumber}</p>
              </div>
              <div className="p-3 bg-slate-700/50 rounded-lg border border-slate-600">
                <p className="text-xs text-gray-500 mb-1">MC Number</p>
                <p className="text-white font-semibold">{currentCompany.mcNumber}</p>
              </div>
              <div className="p-3 bg-slate-700/50 rounded-lg border border-slate-600">
                <p className="text-xs text-gray-500 mb-1">EIN</p>
                <p className="text-white font-semibold">{currentCompany.ein}</p>
              </div>
              <div className="p-3 bg-slate-700/50 rounded-lg border border-slate-600">
                <p className="text-xs text-gray-500 mb-1">Founded</p>
                <p className="text-white font-semibold">{currentCompany.founded}</p>
              </div>
              <div className="p-3 bg-slate-700/50 rounded-lg border border-slate-600">
                <p className="text-xs text-gray-500 mb-1">Employees</p>
                <p className="text-white font-semibold">{currentCompany.employees}</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-green-900/20 to-green-900/10 rounded-lg border border-green-700">
                <p className="text-xs text-gray-500 mb-1">Compliance Score</p>
                <p className="text-green-400 font-bold text-lg">{currentCompany.complianceScore}%</p>
              </div>
            </div>

            {/* Contact Info */}
            <div className="mt-6 pt-6 border-t border-slate-700 space-y-2">
              <p className="text-xs text-gray-500">Contact Information</p>
              <div className="space-y-1">
                <p className="text-white text-sm">{currentCompany.contact.email}</p>
                <p className="text-white text-sm">{currentCompany.contact.phone}</p>
              </div>
            </div>
          </Card>

          {/* Compliance Documents */}
          <Card className="bg-slate-800 border-slate-700 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <FileText size={20} className="text-blue-400" />
                Compliance Documents
              </h3>
              <Button
                size="sm"
                onClick={() => setShowAddDocument(true)}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white transition-all"
              >
                <Upload size={16} className="mr-1" />
                Upload
              </Button>
            </div>

            <div className="space-y-3">
              {currentCompany.documents.map((doc) => (
                <div
                  key={doc.id}
                  className={`p-4 rounded-lg border ${getDocumentStatusColor(doc.status)}`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="mt-1">{getDocumentStatusIcon(doc.status)}</div>
                      <div className="flex-1">
                        <p className="text-white font-semibold">{doc.name}</p>
                        {doc.provider && <p className="text-xs text-gray-400">{doc.provider}</p>}
                      </div>
                    </div>
                    <Button size="sm" variant="ghost" className="text-gray-400 hover:text-white">
                      <Download size={16} />
                    </Button>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <div className="space-y-1">
                      <p className="text-gray-400">
                        Issued: <span className="text-white">{doc.issueDate}</span>
                      </p>
                      <p className="text-gray-400">
                        Expires: <span className="text-white">{doc.expiryDate}</span>
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded font-semibold ${
                        doc.status === "valid"
                          ? "bg-green-900/50 text-green-300"
                          : doc.status === "expiring_soon"
                          ? "bg-yellow-900/50 text-yellow-300"
                          : "bg-red-900/50 text-red-300"
                      }`}
                    >
                      {doc.status === "valid"
                        ? "Valid"
                        : doc.status === "expiring_soon"
                        ? "Expiring Soon"
                        : "Expired"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

