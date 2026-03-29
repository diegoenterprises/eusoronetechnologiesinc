/**
 * DASHBOARD ROUTER
 * Routes to role-specific dashboard based on user role
 * - Truck roles → PremiumDashboard (widget system)
 * - Rail roles → RailDashboard (custom rail KPIs + shipment feed)
 * - Vessel roles → VesselDashboard (custom maritime KPIs + booking feed)
 */

import { useEffect, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { UserRole } from "@/hooks/useRoleAccess";
import PremiumDashboard from "@/components/PremiumDashboard";
import OnboardingGuide from "@/components/OnboardingGuide";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocation } from "wouter";
import { useLocale } from "@/hooks/useLocale";

const RAIL_ROLES = ['RAIL_SHIPPER', 'RAIL_CATALYST', 'RAIL_DISPATCHER', 'RAIL_ENGINEER', 'RAIL_CONDUCTOR', 'RAIL_BROKER'];
const VESSEL_ROLES = ['VESSEL_SHIPPER', 'VESSEL_OPERATOR', 'PORT_MASTER', 'SHIP_CAPTAIN', 'VESSEL_BROKER', 'CUSTOMS_BROKER'];

export default function Dashboard() {
  const { t } = useLocale();
  const { user, loading } = useAuth();
  const userRole = (user?.role as UserRole) || "SHIPPER";
  const [, navigate] = useLocation();
  const alreadyOnboarded = user ? !!localStorage.getItem(`eusotrip-onboarded-${user.id}`) : true;
  const [showOnboarding, setShowOnboarding] = useState(!alreadyOnboarded);

  useEffect(() => {
    if (loading || !user) return;
    // Only redirect if onboarding is already done
    if (!showOnboarding) {
      // Rail roles → role-specific dashboards
      if (userRole === 'RAIL_ENGINEER') { navigate('/rail/engineer/dashboard'); return; }
      if (userRole === 'RAIL_CONDUCTOR') { navigate('/rail/conductor/dashboard'); return; }
      if (userRole === 'RAIL_BROKER') { navigate('/rail/broker/dashboard'); return; }
      if (RAIL_ROLES.includes(userRole)) { navigate('/rail/dashboard'); return; }
      // Vessel roles → role-specific dashboards
      if (userRole === 'SHIP_CAPTAIN') { navigate('/vessel/captain/dashboard'); return; }
      if (userRole === 'PORT_MASTER') { navigate('/port/dashboard'); return; }
      if (userRole === 'VESSEL_BROKER') { navigate('/vessel/broker/dashboard'); return; }
      if (userRole === 'CUSTOMS_BROKER') { navigate('/customs/dashboard'); return; }
      if (VESSEL_ROLES.includes(userRole)) { navigate('/vessel/dashboard'); return; }
    }
  }, [userRole, loading, showOnboarding]);

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
  return (
    <>
      {showOnboarding && (
        <div className="px-6 pt-6">
          <OnboardingGuide onDismiss={() => {
            if (user) localStorage.setItem(`eusotrip-onboarded-${user.id}`, 'true');
            setShowOnboarding(false);
          }} />
        </div>
      )}
      <PremiumDashboard role={userRole} />
    </>
  );
}
