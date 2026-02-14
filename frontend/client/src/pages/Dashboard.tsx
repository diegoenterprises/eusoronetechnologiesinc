/**
 * DASHBOARD ROUTER
 * Routes to role-specific dashboard based on user role
 */

import { useAuth } from "@/_core/hooks/useAuth";
import { UserRole } from "@/hooks/useRoleAccess";
import ShipperDashboard from "./ShipperDashboard";
import CatalystDashboard from "./CatalystDashboard";
import PremiumDashboard from "@/components/PremiumDashboard";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const { user, loading } = useAuth();
  const userRole = (user?.role as UserRole) || "SHIPPER";

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] p-6">
        <Skeleton className="h-32 w-full mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  // All roles use PremiumDashboard with widget system
  return <PremiumDashboard role={userRole} />;
}
