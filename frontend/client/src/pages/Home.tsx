import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import AdminDashboard from "./AdminDashboard";
import { Truck, LogIn, Loader2 } from "lucide-react";

export default function Home() {
  const { user, isAuthenticated, loading } = useAuth();

  // If user is authenticated, show the dashboard
  if (isAuthenticated && user) {
    return (
      <DashboardLayout activeSection="dashboard">
        <AdminDashboard />
      </DashboardLayout>
    );
  }

  // If not authenticated, show login prompt
  if (!loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-r from-cyan-500 to-emerald-500 flex items-center justify-center">
            <Truck className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent mb-4">EusoTrip</h1>
          <p className="text-slate-400 mb-8">Professional Logistics & Freight Management Platform</p>
          <a
            href="/login"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-cyan-600 to-emerald-600 text-white px-8 py-3 rounded-xl font-semibold hover:shadow-lg hover:shadow-cyan-500/20 transition"
          >
            <LogIn className="w-5 h-5" />
            Sign In
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-12 h-12 text-cyan-500 animate-spin mx-auto" />
        <p className="text-slate-400 mt-4">Loading...</p>
      </div>
    </div>
  );
}

