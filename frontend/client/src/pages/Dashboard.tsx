/**
 * DASHBOARD ROUTER
 * Routes to role-specific dashboard based on user role
 * - Truck roles → PremiumDashboard (widget system)
 * - Rail roles → RailDashboard (custom rail KPIs + shipment feed)
 * - Vessel roles → VesselDashboard (custom maritime KPIs + booking feed)
 */

import { useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { UserRole } from "@/hooks/useRoleAccess";
import PremiumDashboard from "@/components/PremiumDashboard";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocation } from "wouter";

const RAIL_ROLES = ['RAIL_SHIPPER', 'RAIL_CATALYST', 'RAIL_DISPATCHER', 'RAIL_ENGINEER', 'RAIL_CONDUCTOR', 'RAIL_BROKER'];
const VESSEL_ROLES = ['VESSEL_SHIPPER', 'VESSEL_OPERATOR', 'PORT_MASTER', 'SHIP_CAPTAIN', 'VESSEL_BROKER', 'CUSTOMS_BROKER'];

export default function Dashboard() {
  const { user, loading } = useAuth();
  const userRole = (user?.role as UserRole) || "SHIPPER";
  const [, navigate] = useLocation();

  useEffect(() => {
    if (loading) return;
    if (RAIL_ROLES.includes(userRole)) {
      navigate('/rail/dashboard');
      return;
    }
    if (VESSEL_ROLES.includes(userRole)) {
      navigate('/vessel/dashboard');
      return;
    }
  }, [userRole, loading]);

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

  // Truck + operational roles use PremiumDashboard with widget system
  return <PremiumDashboard role={userRole} />;
}
