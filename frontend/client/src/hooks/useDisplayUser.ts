/**
 * CENTRALIZED DISPLAY USER HOOK
 * Provides the real user display name, initials, role, and avatar
 * from the live DB profile — not the stale auth "User" fallback.
 *
 * Every page/component that needs to show the current user's name
 * MUST use this hook instead of raw `useAuth().user.name`.
 */

import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";

export function useDisplayUser() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();

  // Fetch live profile from DB so name/avatar updates reflect immediately
  const profileQuery = (trpc as any).users?.getProfile?.useQuery?.(undefined, {
    enabled: isAuthenticated,
    refetchInterval: 30000,
    retry: false,
    staleTime: 15000,
  });
  const liveProfile = profileQuery?.data;

  const displayName = liveProfile
    ? `${liveProfile.firstName || ""} ${liveProfile.lastName || ""}`.trim() || user?.name || "User"
    : user?.name || "User";

  const displayInitials = liveProfile
    ? `${liveProfile.firstName?.charAt(0) || ""}${liveProfile.lastName?.charAt(0) || ""}`.toUpperCase() || "U"
    : (user?.name?.split(" ").map((w: string) => w.charAt(0)).join("").slice(0, 2)) || "U";

  const displayRole = user?.role || liveProfile?.role || "User";

  const displayAvatar = liveProfile?.profilePicture || null;

  const displayEmail = liveProfile?.email || user?.email || "";

  return {
    user,
    isAuthenticated,
    authLoading,
    liveProfile,
    profileLoading: profileQuery?.isLoading || false,
    displayName,
    displayInitials,
    displayRole,
    displayAvatar,
    displayEmail,
  };
}
