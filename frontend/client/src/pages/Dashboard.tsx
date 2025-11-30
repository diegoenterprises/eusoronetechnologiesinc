/**
 * DASHBOARD ROUTER
 * Routes to role-specific dashboard based on user role
 */

import { useAuth } from "@/_core/hooks/useAuth";
import { UserRole } from "@/hooks/useRoleAccess";
import ShipperDashboard from "./ShipperDashboard";
import CarrierDashboard from "./CarrierDashboard";
import { Skeleton } from "@/components/ui/skeleton";

// Import other role dashboards as they're created
// import BrokerDashboard from "./BrokerDashboard";
// import DriverDashboard from "./DriverDashboard";
// etc.

export default function Dashboard() {
  const { user, loading } = useAuth();
  const userRole = (user?.role as UserRole) || "USER";

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

  // Route to role-specific dashboard
  switch (userRole) {
    case "SHIPPER":
      return <ShipperDashboard />;
    
    case "CARRIER":
      return <CarrierDashboard />;
    
    // TODO: Add other role dashboards as they're created
    // case "BROKER":
    //   return <BrokerDashboard />;
    // case "DRIVER":
    //   return <DriverDashboard />;
    // case "CATALYST":
    //   return <CatalystDashboard />;
    // case "ESCORT":
    //   return <EscortDashboard />;
    // case "TERMINAL_MANAGER":
    //   return <TerminalManagerDashboard />;
    // case "COMPLIANCE_OFFICER":
    //   return <ComplianceOfficerDashboard />;
    // case "SAFETY_MANAGER":
    //   return <SafetyManagerDashboard />;
    
    default:
      // Fallback for USER and other roles - show generic dashboard
      return <ShipperDashboard />;
  }
}
