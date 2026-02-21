/**
 * ROLE PERMISSIONS PAGE
 * 100% Dynamic - No mock data
 * UI Style: Gradient headers, stat cards with icons, rounded cards
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  Shield, Users, Lock, Save, Plus
} from "lucide-react";
import { toast } from "sonner";

export default function RolePermissions() {
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  const rolesQuery = (trpc as any).admin.getRoles.useQuery();
  const permissionsQuery = (trpc as any).admin.getPermissions.useQuery({ roleId: selectedRole }, { enabled: !!selectedRole });
  const statsQuery = (trpc as any).admin.getRoleStats.useQuery();

  const updateMutation = (trpc as any).admin.updateRolePermissions.useMutation({
    onSuccess: () => { toast.success("Permissions updated"); permissionsQuery.refetch(); },
    onError: (error: any) => toast.error("Failed", { description: error.message }),
  });

  const stats = statsQuery.data;

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">Role Permissions</h1>
          <p className="text-slate-400 text-sm mt-1">Manage role-based access</p>
        </div>
        <Button className="bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 rounded-lg">
          <Plus className="w-4 h-4 mr-2" />New Role
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-white/[0.02] border-white/[0.06] rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-cyan-500/20"><Shield className="w-6 h-6 text-cyan-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-cyan-400">{stats?.totalRoles || 0}</p>}<p className="text-xs text-slate-400">Roles</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white/[0.02] border-white/[0.06] rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-purple-500/20"><Lock className="w-6 h-6 text-purple-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-purple-400">{stats?.totalPermissions || 0}</p>}<p className="text-xs text-slate-400">Permissions</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white/[0.02] border-white/[0.06] rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/20"><Users className="w-6 h-6 text-green-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-green-400">{stats?.usersWithRoles || 0}</p>}<p className="text-xs text-slate-400">Assigned</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white/[0.02] border-white/[0.06] rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-yellow-500/20"><Shield className="w-6 h-6 text-yellow-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-yellow-400">{stats?.customRoles || 0}</p>}<p className="text-xs text-slate-400">Custom</p></div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <Card className="bg-white/[0.02] border-white/[0.06] rounded-xl">
          <CardHeader className="pb-3"><CardTitle className="text-white text-lg flex items-center gap-2"><Shield className="w-5 h-5 text-cyan-400" />Roles</CardTitle></CardHeader>
          <CardContent className="p-0">
            {rolesQuery.isLoading ? (
              <div className="p-4 space-y-2">{[1, 2, 3, 4].map((i: any) => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}</div>
            ) : (
              <div className="divide-y divide-white/[0.04]">
                {(rolesQuery.data as any)?.map((role: any) => (
                  <div key={role.id} className={`p-4 cursor-pointer hover:bg-white/[0.06]/30 transition-colors ${selectedRole === role.id ? "bg-cyan-500/10 border-l-2 border-cyan-500" : ""}`} onClick={() => setSelectedRole(role.id)}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white font-medium">{role.name}</p>
                        <p className="text-xs text-slate-500">{role.userCount} users</p>
                      </div>
                      <Badge className={role.isSystem ? "bg-purple-500/20 text-purple-400 border-0" : "bg-cyan-500/20 text-cyan-400 border-0"}>
                        {role.isSystem ? "System" : "Custom"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-2 bg-white/[0.02] border-white/[0.06] rounded-xl">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-white text-lg flex items-center gap-2"><Lock className="w-5 h-5 text-purple-400" />Permissions</CardTitle>
            {selectedRole && (
              <Button size="sm" className="bg-green-600 hover:bg-green-700 rounded-lg" onClick={() => updateMutation.mutate({ roleId: selectedRole, permissions: permissionsQuery.data })}>
                <Save className="w-4 h-4 mr-1" />Save
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {!selectedRole ? (
              <div className="text-center py-16"><Shield className="w-10 h-10 text-slate-500 mx-auto mb-3" /><p className="text-slate-400">Select a role to view permissions</p></div>
            ) : permissionsQuery.isLoading ? (
              <div className="space-y-3">{[1, 2, 3, 4, 5].map((i: any) => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}</div>
            ) : (
              <div className="space-y-4">
                {(permissionsQuery.data as any)?.categories?.map((category: any) => (
                  <div key={category.name} className="p-4 rounded-xl bg-slate-700/30">
                    <p className="text-white font-medium mb-3">{category.name}</p>
                    <div className="grid grid-cols-2 gap-3">
                      {category.permissions?.map((perm: any) => (
                        <div key={perm.id} className="flex items-center justify-between p-2 rounded-lg bg-white/[0.02]">
                          <span className="text-sm text-slate-300">{perm.name}</span>
                          <Switch checked={perm.enabled} />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
