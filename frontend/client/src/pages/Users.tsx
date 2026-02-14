/**
 * USERS PAGE
 * User management with compliance document upload
 * Supports TWIC, HazMat, DOT, and other compliance documents
 */

import { useAuth } from "@/_core/hooks/useAuth";
import { Users, FileText, Upload, Download, Trash2, Search, Filter, CheckCircle, AlertCircle, Clock, CreditCard, AlertTriangle, Heart, Shield, ShieldCheck, File as FileIcon, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { useState } from "react";

interface UserDocument {
  id: string;
  userId: string;
  type: "twic" | "hazmat" | "dot" | "medical" | "license" | "insurance" | "other";
  name: string;
  issueDate: string;
  expiryDate: string;
  status: "valid" | "expiring_soon" | "expired";
  uploadedAt: string;
  documentUrl: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  status: "active" | "inactive" | "suspended";
  joinDate: string;
  complianceScore: number;
  documents: UserDocument[];
}

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [selectedUser, setSelectedUser] = useState(0);
  const [showUploadModal, setShowUploadModal] = useState(false);

  // tRPC query for users
  const usersQuery = (trpc as any).users.list.useQuery({ 
    search: searchTerm || undefined, 
    role: filterRole !== "all" ? filterRole : undefined 
  });

  if (usersQuery.isLoading) {
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

  if (usersQuery.isError) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-red-400 mb-4">Failed to load users</p>
        <Button onClick={() => usersQuery.refetch()} variant="outline">
          <RefreshCw size={16} className="mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  const users: User[] = (usersQuery.data || []).map((u: any) => ({
    id: String(u.id),
    name: u.name || 'Unknown User',
    email: u.email || '',
    phone: u.phone || '',
    role: u.role || 'USER',
    status: u.isActive ? 'active' : 'inactive',
    joinDate: u.createdAt?.split('T')[0] || '',
    complianceScore: u.complianceScore || 0,
    documents: u.documents || [],
  }));

  const filteredUsers = users.filter((u: any) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.includes(searchTerm) ||
      u.phone.includes(searchTerm);
    const matchesRole = filterRole === "all" || u.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const currentUserData = filteredUsers[selectedUser] || users[0];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-900/30 text-green-400 border-green-700";
      case "inactive":
        return "bg-gray-900/30 text-slate-400 border-gray-700";
      case "suspended":
        return "bg-red-900/30 text-red-400 border-red-700";
      default:
        return "bg-gray-900/30 text-slate-400 border-gray-700";
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
        return <Clock size={16} className="text-slate-400" />;
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
        return "bg-gray-900/30 text-slate-300 border-gray-700";
    }
  };

  const getDocumentTypeIcon = (type: string): React.ReactNode => {
    switch (type) {
      case "twic":
        return <CreditCard size={20} className="text-blue-400" />;
      case "hazmat":
        return <AlertTriangle size={20} className="text-red-400" />;
      case "dot":
        return <FileText size={20} className="text-green-400" />;
      case "medical":
        return <Heart size={20} className="text-pink-400" />;
      case "license":
        return <Shield size={20} className="text-purple-400" />;
      case "insurance":
        return <ShieldCheck size={20} className="text-cyan-400" />;
      default:
        return <FileIcon size={20} className="text-slate-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">Users</h1>
          <p className="text-slate-400 mt-1">Manage user profiles and compliance documentation</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Users List */}
        <div className="lg:col-span-1 space-y-4">
          <div className="space-y-3">
            <Input
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e: any) => setSearchTerm(e.target.value)}
              className="bg-slate-700 border-slate-600 text-white placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30"
            />
            <div className="flex gap-2">
              {["all", "DRIVER", "SHIPPER", "CATALYST"].map((role: any) => (
                <Button
                  key={role}
                  onClick={() => setFilterRole(role)}
                  className={`text-xs ${
                    filterRole === role
                      ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                      : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                  } transition-all`}
                >
                  {role === "all" ? "All" : role}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredUsers.map((u: any, idx: number) => (
              <Card
                key={u.id}
                onClick={() => setSelectedUser(idx)}
                className={`p-4 cursor-pointer transition-all ${
                  selectedUser === idx
                    ? "bg-gradient-to-r from-blue-600/30 to-purple-600/30 border-blue-500 shadow-lg shadow-blue-500/20"
                    : "bg-slate-800 border-slate-700 hover:border-slate-600"
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <p className="text-white font-semibold">{u.name}</p>
                    <p className="text-slate-400 text-xs">{u.role}</p>
                  </div>
                  <span
                    className={`px-2 py-1 rounded text-xs font-semibold border ${getStatusColor(
                      u.status
                    )}`}
                  >
                    {u.status}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">{u.documents.length} docs</span>
                  <span className="text-green-400 font-semibold">{u.complianceScore}%</span>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* User Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* User Header */}
          <Card className="bg-slate-800 border-slate-700 p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">{currentUserData.name}</h2>
                <p className="text-slate-400 text-sm">Joined {currentUserData.joinDate}</p>
              </div>
              <span
                className={`px-3 py-1 rounded text-sm font-semibold border ${getStatusColor(
                  currentUserData.status
                )}`}
              >
                {currentUserData.status}
              </span>
            </div>

            {/* User Info Grid */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="p-3 bg-slate-700/50 rounded-lg border border-slate-600">
                <p className="text-xs text-slate-500 mb-1">Email</p>
                <p className="text-white font-semibold text-sm">{currentUserData.email}</p>
              </div>
              <div className="p-3 bg-slate-700/50 rounded-lg border border-slate-600">
                <p className="text-xs text-slate-500 mb-1">Phone</p>
                <p className="text-white font-semibold text-sm">{currentUserData.phone}</p>
              </div>
              <div className="p-3 bg-slate-700/50 rounded-lg border border-slate-600">
                <p className="text-xs text-slate-500 mb-1">Role</p>
                <p className="text-white font-semibold text-sm">{currentUserData.role}</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-green-900/20 to-green-900/10 rounded-lg border border-green-700">
                <p className="text-xs text-slate-500 mb-1">Compliance Score</p>
                <p className="text-green-400 font-bold text-lg">{currentUserData.complianceScore}%</p>
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
                onClick={() => setShowUploadModal(true)}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white transition-all text-sm"
              >
                <Upload size={16} className="mr-1" />
                Upload Document
              </Button>
            </div>

            {currentUserData.documents.length > 0 ? (
              <div className="space-y-3">
                {currentUserData.documents.map((doc: any) => (
                  <div
                    key={doc.id}
                    className={`p-4 rounded-lg border ${getDocumentStatusColor(doc.status)}`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="flex items-center justify-center w-8 h-8">{getDocumentTypeIcon(doc.type)}</div>
                        <div className="flex-1">
                          <p className="text-white font-semibold">{doc.name}</p>
                          <p className="text-xs text-slate-400">
                            Uploaded: {doc.uploadedAt}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getDocumentStatusIcon(doc.status)}
                        <Button size="sm" variant="ghost" className="text-slate-400 hover:text-white">
                          <Download size={16} />
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <div className="space-y-1">
                        <p className="text-slate-400">
                          Issued: <span className="text-white">{doc.issueDate}</span>
                        </p>
                        <p className="text-slate-400">
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
            ) : (
              <div className="text-center py-8">
                <FileText size={32} className="text-slate-500 mx-auto mb-2" />
                <p className="text-slate-400">No compliance documents uploaded</p>
                <Button
                  onClick={() => setShowUploadModal(true)}
                  className="mt-4 bg-blue-600 hover:bg-blue-700"
                >
                  <Upload size={16} className="mr-2" />
                  Upload First Document
                </Button>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

