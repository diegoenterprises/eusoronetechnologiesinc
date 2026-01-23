import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import DashboardLayout from "@/components/DashboardLayout";
import AdminDashboard from "./AdminDashboard";

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
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-black flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <img src="/eusotrip-logo.png" alt="EusoTrip" className="w-32 h-32 mx-auto mb-8" />
          <h1 className="text-4xl font-bold text-white mb-4">EusoTrip</h1>
          <p className="text-gray-300 mb-8">Professional Logistics & Freight Management Platform</p>
          <a
            href={getLoginUrl()}
            className="inline-block bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-lg font-semibold hover:shadow-lg transition"
          >
            Sign In with Manus
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-gray-600 mt-4">Loading...</p>
      </div>
    </div>
  );
}

