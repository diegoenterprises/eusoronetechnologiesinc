/**
 * COMPANIES PAGE
 * Comprehensive company management with compliance tracking
 * Insurance policies, TWIC cards, HazMat licenses, and more
 */

import { useAuth } from "@/_core/hooks/useAuth";
import { Building2, FileText, Shield, AlertCircle, CheckCircle, Clock, Plus, Edit2, Trash2, Download, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
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

  const companies: Company[] = [
    {
      id: "comp-1",
      name: "Johnson Transport LLC",
      dotNumber: "DOT-3456789",
      mcNumber: "MC-987654",
      ein: "12-3456789",
      status: "active",
      founded: "2015",
      employees: 45,
      complianceScore: 98.5,
      contact: {
        email: "compliance@johnsontransport.com",
        phone: "(555) 123-4567",
        address: "1234 Transport Ave, Houston, TX 77001",
      },
      documents: [
        {
          id: "doc-1",
          type: "insurance",
          name: "General Liability Insurance",
          issueDate: "2024-01-15",
          expiryDate: "2025-01-15",
          status: "valid",
          provider: "XYZ Insurance Co",
          documentUrl: "/docs/insurance-001.pdf",
        },
        {
          id: "doc-2",
          type: "hazmat",
          name: "HazMat License",
          issueDate: "2023-06-01",
          expiryDate: "2025-06-01",
          status: "valid",
          provider: "DOT",
          documentUrl: "/docs/hazmat-001.pdf",
        },
        {
          id: "doc-3",
          type: "twic",
          name: "TWIC Card",
          issueDate: "2022-03-15",
          expiryDate: "2027-03-15",
          status: "valid",
          provider: "TSA",
          documentUrl: "/docs/twic-001.pdf",
        },
        {
          id: "doc-4",
          type: "dot",
          name: "DOT Compliance",
          issueDate: "2024-01-01",
          expiryDate: "2024-12-31",
          status: "expiring_soon",
          provider: "FMCSA",
          documentUrl: "/docs/dot-001.pdf",
        },
      ],
    },
    {
      id: "comp-2",
      name: "ABC Logistics Inc",
      dotNumber: "DOT-9876543",
      mcNumber: "MC-654321",
      ein: "98-7654321",
      status: "active",
      founded: "2010",
      employees: 120,
      complianceScore: 95.2,
      contact: {
        email: "compliance@abclogistics.com",
        phone: "(555) 987-6543",
        address: "5678 Logistics Blvd, Los Angeles, CA 90001",
      },
      documents: [
        {
          id: "doc-5",
          type: "insurance",
          name: "Cargo Insurance",
          issueDate: "2024-02-01",
          expiryDate: "2025-02-01",
          status: "valid",
          provider: "ABC Insurance",
        },
        {
          id: "doc-6",
          type: "hazmat",
          name: "HazMat License",
          issueDate: "2023-08-15",
          expiryDate: "2025-08-15",
          status: "valid",
          provider: "DOT",
        },
      ],
    },
  ];

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

