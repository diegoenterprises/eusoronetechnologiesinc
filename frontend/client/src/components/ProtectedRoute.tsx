import React, { useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import type { UserRole } from "@/hooks/useRoleAccess";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

const ALL_ROLES: UserRole[] = [
  "SHIPPER", "CATALYST", "BROKER", "DRIVER", "DISPATCH",
  "ESCORT", "TERMINAL_MANAGER", "FACTORING", "COMPLIANCE_OFFICER",
  "SAFETY_MANAGER", "ADMIN", "SUPER_ADMIN",
  "RAIL_SHIPPER", "RAIL_CATALYST", "RAIL_DISPATCHER", "RAIL_ENGINEER", "RAIL_CONDUCTOR", "RAIL_BROKER",
  "VESSEL_SHIPPER", "VESSEL_OPERATOR", "PORT_MASTER", "SHIP_CAPTAIN", "VESSEL_BROKER", "CUSTOMS_BROKER",
];

export default function ProtectedRoute({ children, allowedRoles = ALL_ROLES }: ProtectedRouteProps) {
  const { user, loading, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated || !user) {
      console.error("[ProtectedRoute] REDIRECT → /login | isAuthenticated:", isAuthenticated, "user:", user);
      navigate("/login");
      return;
    }
    const userRole = (user.role as UserRole) || "USER";
    if (!allowedRoles.includes(userRole) && userRole !== "SUPER_ADMIN") {
      console.error("[ProtectedRoute] REDIRECT → / | role:", userRole, "allowedRoles:", allowedRoles, "path:", window.location.pathname);
      navigate("/");
    }
  }, [loading, isAuthenticated, user, allowedRoles, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <div className="space-y-4 w-80">
          <Skeleton className="h-8 w-48 bg-slate-800" />
          <Skeleton className="h-4 w-64 bg-slate-800" />
          <Skeleton className="h-4 w-56 bg-slate-800" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) return null;

  const userRole = (user.role as UserRole) || "USER";
  if (!allowedRoles.includes(userRole) && userRole !== "SUPER_ADMIN") return null;

  return <>{children}</>;
}
