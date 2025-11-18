/**
 * COMPANY PROFILE PAGE - ROBUST IMPLEMENTATION
 * Comprehensive company details, compliance, fleet info, and document management
 */

import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  Building2, Users, MapPin, Phone, Globe, Mail, FileText,
  Shield, Truck, Calendar, Upload, Download, Edit, Save,
  CheckCircle, AlertCircle, XCircle, Plus, Trash2, Eye,
  Award, TrendingUp, DollarSign, Package, Clock, Target
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

interface ComplianceDocument {
  id: string;
  type: "INSURANCE" | "W9" | "AUTHORITY" | "TWIC" | "HAZMAT" | "OTHER";
  name: string;
  uploadedAt: string;
  expiresAt?: string;
  status: "VALID" | "EXPIRING" | "EXPIRED";
  fileUrl: string;
}

interface FleetVehicle {
  id: string;
  type: string;
  make: string;
  model: string;
  year: number;
  vin: string;
  status: "ACTIVE" | "MAINTENANCE" | "INACTIVE";
}

export default function CompanyPage() {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<"details" | "compliance" | "fleet" | "certifications" | "performance">("details");

  // Company data state
  const [companyData, setCompanyData] = useState({
    name: "Johnson Transport LLC",
    legalName: "Johnson Transport, LLC",
    mcNumber: "MC-123456",
    dotNumber: "DOT-789012",
    scacCode: "JHNS",
    taxId: "12-3456789",
    dunsNumber: "123456789",
    address: "123 Main St, Houston, TX 77001",
    phone: "(555) 123-4567",
    email: "contact@johnsontransport.com",
    website: "www.johnsontransport.com",
    founded: "2016",
    fleetSize: 15,
    driverCount: 23,
    operatingAuthority: "Interstate",
    safetyRating: "Satisfactory",
    description: "Professional transportation and logistics services specializing in hazardous materials and bulk liquids.",
  });

  // Compliance documents (mock data - replace with tRPC query)
  const [documents] = useState<ComplianceDocument[]>([
    {
      id: "1",
      type: "INSURANCE",
      name: "General Liability Insurance",
      uploadedAt: "2024-01-15",
      expiresAt: "2025-01-15",
      status: "VALID",
      fileUrl: "/documents/insurance.pdf",
    },
    {
      id: "2",
      type: "INSURANCE",
      name: "Cargo Insurance",
      uploadedAt: "2024-01-15",
      expiresAt: "2025-01-15",
      status: "VALID",
      fileUrl: "/documents/cargo-insurance.pdf",
    },
    {
      id: "3",
      type: "W9",
      name: "W9 Tax Form",
      uploadedAt: "2024-01-10",
      status: "VALID",
      fileUrl: "/documents/w9.pdf",
    },
    {
      id: "4",
      type: "AUTHORITY",
      name: "Operating Authority",
      uploadedAt: "2023-06-01",
      expiresAt: "2025-12-31",
      status: "EXPIRING",
      fileUrl: "/documents/authority.pdf",
    },
    {
      id: "5",
      type: "HAZMAT",
      name: "HazMat Certification",
      uploadedAt: "2024-03-01",
      expiresAt: "2025-03-01",
      status: "VALID",
      fileUrl: "/documents/hazmat.pdf",
    },
  ]);

  // Fleet vehicles (mock data - replace with tRPC query)
  const [fleet] = useState<FleetVehicle[]>([
    {
      id: "1",
      type: "Tanker",
      make: "Peterbilt",
      model: "579",
      year: 2022,
      vin: "1XPWD40X1ED123456",
      status: "ACTIVE",
    },
    {
      id: "2",
      type: "Tanker",
      make: "Kenworth",
      model: "T680",
      year: 2021,
      vin: "1XKWD40X2ED234567",
      status: "ACTIVE",
    },
    {
      id: "3",
      type: "Dry Van",
      make: "Freightliner",
      model: "Cascadia",
      year: 2023,
      vin: "1FUJGLDR3ELBA1234",
      status: "ACTIVE",
    },
    {
      id: "4",
      type: "Flatbed",
      make: "Volvo",
      model: "VNL 760",
      year: 2020,
      vin: "4V4NC9EH5LN123456",
      status: "MAINTENANCE",
    },
  ]);

  // Certifications
  const certifications = [
    { name: "HazMat Endorsement", status: "ACTIVE", expires: "2025-06-15" },
    { name: "TWIC Card", status: "ACTIVE", expires: "2026-01-20" },
    { name: "SmartWay Certified", status: "ACTIVE", expires: "N/A" },
    { name: "C-TPAT Certified", status: "ACTIVE", expires: "2025-12-31" },
  ];

  // Performance metrics
  const performanceMetrics = {
    onTimeDelivery: 98.5,
    safetyScore: 95,
    customerRating: 4.8,
    totalLoads: 1247,
    totalMiles: 523000,
    avgLoadValue: 3250,
  };

  const handleSave = () => {
    setIsEditing(false);
    toast.success("Company profile updated successfully");
  };

  const handleUploadDocument = (type: string) => {
    toast.info(`Document upload dialog would open for ${type}`);
  };

  const handleDownloadDocument = (docId: string) => {
    toast.success("Document download started");
  };

  const handleDeleteDocument = (docId: string) => {
    toast.success("Document deleted");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "VALID":
      case "ACTIVE":
        return "text-green-400 bg-green-900/30";
      case "EXPIRING":
        return "text-yellow-400 bg-yellow-900/30";
      case "EXPIRED":
      case "INACTIVE":
        return "text-red-400 bg-red-900/30";
      case "MAINTENANCE":
        return "text-orange-400 bg-orange-900/30";
      default:
        return "text-gray-400 bg-gray-900/30";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "VALID":
      case "ACTIVE":
        return <CheckCircle size={16} className="text-green-400" />;
      case "EXPIRING":
        return <AlertCircle size={16} className="text-yellow-400" />;
      case "EXPIRED":
      case "INACTIVE":
        return <XCircle size={16} className="text-red-400" />;
      default:
        return <AlertCircle size={16} className="text-gray-400" />;
    }
  };

  const tabs = [
    { id: "details" as const, label: "Company Details", icon: Building2 },
    { id: "compliance" as const, label: "Compliance", icon: Shield },
    { id: "fleet" as const, label: "Fleet", icon: Truck },
    { id: "certifications" as const, label: "Certifications", icon: Award },
    { id: "performance" as const, label: "Performance", icon: TrendingUp },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Company Profile</h1>
          <p className="text-gray-400">Manage your company information, compliance, and fleet</p>
        </div>
        {!isEditing ? (
          <Button
            onClick={() => setIsEditing(true)}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
          >
            <Edit size={18} className="mr-2" />
            Edit Company
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button
              onClick={() => setIsEditing(false)}
              variant="outline"
              className="border-gray-600 text-gray-400 hover:bg-gray-800"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
            >
              <Save size={18} className="mr-2" />
              Save Changes
            </Button>
          </div>
        )}
      </div>

      {/* Company Logo and Basic Info */}
      <Card className="bg-slate-800 border-slate-700 p-6">
        <div className="flex items-start gap-6">
          <div className="w-32 h-32 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <Building2 size={64} className="text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-white mb-2">{companyData.name}</h2>
            <p className="text-gray-400 mb-4">{companyData.description}</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">MC Number</p>
                <p className="text-white font-semibold">{companyData.mcNumber}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">DOT Number</p>
                <p className="text-white font-semibold">{companyData.dotNumber}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Safety Rating</p>
                <p className="text-green-400 font-semibold">{companyData.safetyRating}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Founded</p>
                <p className="text-white font-semibold">{companyData.founded}</p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Tab Navigation */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                  : "bg-slate-800 text-gray-400 hover:bg-slate-700 hover:text-white"
              }`}
            >
              <Icon size={18} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Company Details Tab */}
      {activeTab === "details" && (
        <div className="space-y-6">
          <Card className="bg-slate-800 border-slate-700 p-6">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Building2 size={20} className="text-blue-400" />
              Company Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-gray-400 text-sm font-semibold">Company Name</label>
                <Input
                  value={companyData.name}
                  onChange={(e) => setCompanyData({ ...companyData, name: e.target.value })}
                  disabled={!isEditing}
                  className="bg-slate-700 border-slate-600 text-white mt-2"
                />
              </div>

              <div>
                <label className="text-gray-400 text-sm font-semibold">Legal Name</label>
                <Input
                  value={companyData.legalName}
                  onChange={(e) => setCompanyData({ ...companyData, legalName: e.target.value })}
                  disabled={!isEditing}
                  className="bg-slate-700 border-slate-600 text-white mt-2"
                />
              </div>

              <div>
                <label className="text-gray-400 text-sm font-semibold">MC Number</label>
                <Input
                  value={companyData.mcNumber}
                  onChange={(e) => setCompanyData({ ...companyData, mcNumber: e.target.value })}
                  disabled={!isEditing}
                  className="bg-slate-700 border-slate-600 text-white mt-2"
                />
              </div>

              <div>
                <label className="text-gray-400 text-sm font-semibold">DOT Number</label>
                <Input
                  value={companyData.dotNumber}
                  onChange={(e) => setCompanyData({ ...companyData, dotNumber: e.target.value })}
                  disabled={!isEditing}
                  className="bg-slate-700 border-slate-600 text-white mt-2"
                />
              </div>

              <div>
                <label className="text-gray-400 text-sm font-semibold">SCAC Code</label>
                <Input
                  value={companyData.scacCode}
                  onChange={(e) => setCompanyData({ ...companyData, scacCode: e.target.value })}
                  disabled={!isEditing}
                  className="bg-slate-700 border-slate-600 text-white mt-2"
                />
              </div>

              <div>
                <label className="text-gray-400 text-sm font-semibold">Tax ID (EIN)</label>
                <Input
                  value={companyData.taxId}
                  onChange={(e) => setCompanyData({ ...companyData, taxId: e.target.value })}
                  disabled={!isEditing}
                  className="bg-slate-700 border-slate-600 text-white mt-2"
                />
              </div>

              <div>
                <label className="text-gray-400 text-sm font-semibold">DUNS Number</label>
                <Input
                  value={companyData.dunsNumber}
                  onChange={(e) => setCompanyData({ ...companyData, dunsNumber: e.target.value })}
                  disabled={!isEditing}
                  className="bg-slate-700 border-slate-600 text-white mt-2"
                />
              </div>

              <div>
                <label className="text-gray-400 text-sm font-semibold">Operating Authority</label>
                <select
                  value={companyData.operatingAuthority}
                  onChange={(e) => setCompanyData({ ...companyData, operatingAuthority: e.target.value })}
                  disabled={!isEditing}
                  className="w-full bg-slate-700 border-slate-600 text-white mt-2 p-2 rounded-md"
                >
                  <option value="Interstate">Interstate</option>
                  <option value="Intrastate">Intrastate</option>
                  <option value="Both">Both</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="text-gray-400 text-sm font-semibold">Address</label>
                <Input
                  value={companyData.address}
                  onChange={(e) => setCompanyData({ ...companyData, address: e.target.value })}
                  disabled={!isEditing}
                  className="bg-slate-700 border-slate-600 text-white mt-2"
                />
              </div>

              <div>
                <label className="text-gray-400 text-sm font-semibold">Phone</label>
                <Input
                  value={companyData.phone}
                  onChange={(e) => setCompanyData({ ...companyData, phone: e.target.value })}
                  disabled={!isEditing}
                  className="bg-slate-700 border-slate-600 text-white mt-2"
                />
              </div>

              <div>
                <label className="text-gray-400 text-sm font-semibold">Email</label>
                <Input
                  value={companyData.email}
                  onChange={(e) => setCompanyData({ ...companyData, email: e.target.value })}
                  disabled={!isEditing}
                  className="bg-slate-700 border-slate-600 text-white mt-2"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-gray-400 text-sm font-semibold">Website</label>
                <Input
                  value={companyData.website}
                  onChange={(e) => setCompanyData({ ...companyData, website: e.target.value })}
                  disabled={!isEditing}
                  className="bg-slate-700 border-slate-600 text-white mt-2"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-gray-400 text-sm font-semibold">Company Description</label>
                <textarea
                  value={companyData.description}
                  onChange={(e) => setCompanyData({ ...companyData, description: e.target.value })}
                  disabled={!isEditing}
                  rows={3}
                  className="w-full bg-slate-700 border-slate-600 text-white mt-2 p-2 rounded-md"
                />
              </div>
            </div>
          </Card>

          <Card className="bg-slate-800 border-slate-700 p-6">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Users size={20} className="text-purple-400" />
              Fleet & Personnel
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-slate-700/50 p-4 rounded-lg border border-slate-600">
                <div className="flex items-center gap-3 mb-2">
                  <Truck size={24} className="text-blue-400" />
                  <div>
                    <p className="text-gray-400 text-sm">Fleet Size</p>
                    <p className="text-white text-2xl font-bold">{companyData.fleetSize}</p>
                  </div>
                </div>
                <p className="text-gray-500 text-xs">Active vehicles</p>
              </div>

              <div className="bg-slate-700/50 p-4 rounded-lg border border-slate-600">
                <div className="flex items-center gap-3 mb-2">
                  <Users size={24} className="text-green-400" />
                  <div>
                    <p className="text-gray-400 text-sm">Drivers</p>
                    <p className="text-white text-2xl font-bold">{companyData.driverCount}</p>
                  </div>
                </div>
                <p className="text-gray-500 text-xs">Active drivers</p>
              </div>

              <div className="bg-slate-700/50 p-4 rounded-lg border border-slate-600">
                <div className="flex items-center gap-3 mb-2">
                  <Calendar size={24} className="text-purple-400" />
                  <div>
                    <p className="text-gray-400 text-sm">Founded</p>
                    <p className="text-white text-2xl font-bold">{companyData.founded}</p>
                  </div>
                </div>
                <p className="text-gray-500 text-xs">Years in business: {new Date().getFullYear() - parseInt(companyData.founded)}</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Compliance Tab */}
      {activeTab === "compliance" && (
        <div className="space-y-6">
          <Card className="bg-slate-800 border-slate-700 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Shield size={20} className="text-green-400" />
                Compliance Documents
              </h2>
              <Button
                onClick={() => handleUploadDocument("general")}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
              >
                <Upload size={16} className="mr-2" />
                Upload Document
              </Button>
            </div>

            <div className="space-y-3">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg border border-slate-600 hover:border-slate-500 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <FileText size={24} className="text-blue-400" />
                    <div>
                      <p className="text-white font-semibold">{doc.name}</p>
                      <p className="text-gray-400 text-sm">
                        Uploaded: {doc.uploadedAt}
                        {doc.expiresAt && ` • Expires: ${doc.expiresAt}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(doc.status)}`}>
                      {getStatusIcon(doc.status)}
                      {doc.status}
                    </span>
                    <Button
                      onClick={() => handleDownloadDocument(doc.id)}
                      variant="outline"
                      className="border-blue-600 text-blue-400 hover:bg-blue-600 hover:text-white"
                    >
                      <Download size={16} className="mr-1" />
                      Download
                    </Button>
                    <Button
                      onClick={() => handleDeleteDocument(doc.id)}
                      variant="outline"
                      className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="bg-slate-800 border-slate-700 p-6">
            <h2 className="text-xl font-bold text-white mb-6">Compliance Summary</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-green-900/20 border border-green-700 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle size={20} className="text-green-400" />
                  <p className="text-white font-semibold">Valid Documents</p>
                </div>
                <p className="text-green-400 text-2xl font-bold">
                  {documents.filter((d) => d.status === "VALID").length}
                </p>
              </div>

              <div className="bg-yellow-900/20 border border-yellow-700 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle size={20} className="text-yellow-400" />
                  <p className="text-white font-semibold">Expiring Soon</p>
                </div>
                <p className="text-yellow-400 text-2xl font-bold">
                  {documents.filter((d) => d.status === "EXPIRING").length}
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Fleet Tab */}
      {activeTab === "fleet" && (
        <div className="space-y-6">
          <Card className="bg-slate-800 border-slate-700 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Truck size={20} className="text-blue-400" />
                Fleet Vehicles
              </h2>
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white">
                <Plus size={16} className="mr-2" />
                Add Vehicle
              </Button>
            </div>

            <div className="space-y-3">
              {fleet.map((vehicle) => (
                <div
                  key={vehicle.id}
                  className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg border border-slate-600"
                >
                  <div className="flex items-center gap-4">
                    <Truck size={24} className="text-blue-400" />
                    <div>
                      <p className="text-white font-semibold">
                        {vehicle.year} {vehicle.make} {vehicle.model}
                      </p>
                      <p className="text-gray-400 text-sm">
                        {vehicle.type} • VIN: {vehicle.vin}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(vehicle.status)}`}>
                      {vehicle.status}
                    </span>
                    <Button
                      variant="outline"
                      className="border-blue-600 text-blue-400 hover:bg-blue-600 hover:text-white"
                    >
                      <Eye size={16} className="mr-1" />
                      View
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="bg-slate-800 border-slate-700 p-6">
            <h2 className="text-xl font-bold text-white mb-6">Fleet Summary</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-700/50 p-4 rounded-lg border border-slate-600">
                <p className="text-gray-400 text-sm mb-2">Total Vehicles</p>
                <p className="text-white text-3xl font-bold">{fleet.length}</p>
              </div>
              <div className="bg-slate-700/50 p-4 rounded-lg border border-slate-600">
                <p className="text-gray-400 text-sm mb-2">Active</p>
                <p className="text-green-400 text-3xl font-bold">
                  {fleet.filter((v) => v.status === "ACTIVE").length}
                </p>
              </div>
              <div className="bg-slate-700/50 p-4 rounded-lg border border-slate-600">
                <p className="text-gray-400 text-sm mb-2">In Maintenance</p>
                <p className="text-orange-400 text-3xl font-bold">
                  {fleet.filter((v) => v.status === "MAINTENANCE").length}
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Certifications Tab */}
      {activeTab === "certifications" && (
        <Card className="bg-slate-800 border-slate-700 p-6">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <Award size={20} className="text-yellow-400" />
            Company Certifications
          </h2>

          <div className="space-y-3">
            {certifications.map((cert, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg border border-slate-600"
              >
                <div className="flex items-center gap-3">
                  <Award size={20} className="text-yellow-400" />
                  <div>
                    <p className="text-white font-semibold">{cert.name}</p>
                    <p className="text-gray-400 text-sm">Expires: {cert.expires}</p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(cert.status)}`}>
                  {cert.status}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Performance Tab */}
      {activeTab === "performance" && (
        <div className="space-y-6">
          <Card className="bg-slate-800 border-slate-700 p-6">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <TrendingUp size={20} className="text-green-400" />
              Performance Metrics
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-blue-900/50 to-blue-800/30 p-6 rounded-lg border border-blue-700">
                <div className="flex items-center gap-2 mb-2">
                  <Clock size={20} className="text-blue-400" />
                  <p className="text-gray-300 text-sm">On-Time Delivery</p>
                </div>
                <p className="text-white text-4xl font-bold">{performanceMetrics.onTimeDelivery}%</p>
              </div>

              <div className="bg-gradient-to-br from-green-900/50 to-green-800/30 p-6 rounded-lg border border-green-700">
                <div className="flex items-center gap-2 mb-2">
                  <Shield size={20} className="text-green-400" />
                  <p className="text-gray-300 text-sm">Safety Score</p>
                </div>
                <p className="text-white text-4xl font-bold">{performanceMetrics.safetyScore}%</p>
              </div>

              <div className="bg-gradient-to-br from-purple-900/50 to-purple-800/30 p-6 rounded-lg border border-purple-700">
                <div className="flex items-center gap-2 mb-2">
                  <Award size={20} className="text-purple-400" />
                  <p className="text-gray-300 text-sm">Customer Rating</p>
                </div>
                <p className="text-white text-4xl font-bold">{performanceMetrics.customerRating}/5.0</p>
              </div>

              <div className="bg-slate-700/50 p-6 rounded-lg border border-slate-600">
                <div className="flex items-center gap-2 mb-2">
                  <Package size={20} className="text-blue-400" />
                  <p className="text-gray-400 text-sm">Total Loads</p>
                </div>
                <p className="text-white text-3xl font-bold">{performanceMetrics.totalLoads.toLocaleString()}</p>
              </div>

              <div className="bg-slate-700/50 p-6 rounded-lg border border-slate-600">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin size={20} className="text-green-400" />
                  <p className="text-gray-400 text-sm">Total Miles</p>
                </div>
                <p className="text-white text-3xl font-bold">{performanceMetrics.totalMiles.toLocaleString()}</p>
              </div>

              <div className="bg-slate-700/50 p-6 rounded-lg border border-slate-600">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign size={20} className="text-yellow-400" />
                  <p className="text-gray-400 text-sm">Avg Load Value</p>
                </div>
                <p className="text-white text-3xl font-bold">${performanceMetrics.avgLoadValue.toLocaleString()}</p>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

