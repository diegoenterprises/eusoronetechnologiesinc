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
  Shield, Plus, Users, Lock, Unlock,
  Save, Edit
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function RolePermissions() {
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  const rolesQuery = trpc.roles.list.useQuery();
  const permissionsQuery = trpc.roles.getPermissions.useQuery({ roleId: selectedRole }, { enabled: !!selectedRole });

  const updateMutation = trpc.roles.updatePermission.useMutation({
    onSuccess: () => { toast.success("Permission updated"); permissionsQuery.refetch(); },
    onError: (error) => toast.error("Failed to update", { description: error.message }),
  });

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with Gradient Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            Role Permissions
          </h1>
          <p className="text-slate-400 text-sm mt-1">Configure role-based access control</p>
        </div>
        <Button className="bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 rounded-lg">
          <Plus className="w-4 h-4 mr-2" />Create Role
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Roles List */}
        <Card className="lg:col-span-1 bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <Shield className="w-5 h-5 text-cyan-400" />
              Roles
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {rolesQuery.isLoading ? (
              <div className="p-4 space-y-2">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}</div>
            ) : (
              <div className="divide-y divide-slate-700/50">
                {rolesQuery.data?.map((role: any) => (
                  <div key={role.id} className={cn("p-4 cursor-pointer transition-colors", selectedRole === role.id ? "bg-cyan-500/20 border-l-2 border-cyan-500" : "hover:bg-slate-700/20")} onClick={() => setSelectedRole(role.id)}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white font-medium">{role.name}</p>
                        <p className="text-xs text-slate-500">{role.usersCount} users</p>
                      </div>
                      {role.isSystem && <Badge className="bg-purple-500/20 text-purple-400 border-0 text-xs">System</Badge>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Permissions */}
        <Card className="lg:col-span-3 bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-white text-lg flex items-center gap-2">
                <Lock className="w-5 h-5 text-purple-400" />
                Permissions
              </CardTitle>
              {selectedRole && (
                <Button size="sm" variant="outline" className="bg-slate-700/50 border-slate-600/50 hover:bg-slate-700 rounded-lg">
                  <Edit className="w-4 h-4 mr-1" />Edit Role
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {!selectedRole ? (
              <div className="text-center py-16">
                <div className="p-4 rounded-full bg-slate-700/50 w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                  <Shield className="w-8 h-8 text-slate-500" />
                </div>
                <p className="text-slate-400">Select a role to view permissions</p>
              </div>
            ) : permissionsQuery.isLoading ? (
              <div className="space-y-4">{[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div>
            ) : (
              <div className="space-y-6">
                {permissionsQuery.data?.categories?.map((category: any) => (
                  <div key={category.name}>
                    <p className="text-white font-medium mb-3">{category.name}</p>
                    <div className="space-y-2">
                      {category.permissions?.map((perm: any) => (
                        <div key={perm.id} className="p-3 rounded-xl bg-slate-700/30 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {perm.enabled ? <Unlock className="w-4 h-4 text-green-400" /> : <Lock className="w-4 h-4 text-slate-500" />}
                            <div>
                              <p className="text-white text-sm">{perm.name}</p>
                              <p className="text-xs text-slate-500">{perm.description}</p>
                            </div>
                          </div>
                          <Switch checked={perm.enabled} onCheckedChange={() => updateMutation.mutate({ roleId: selectedRole, permissionId: perm.id, enabled: !perm.enabled })} />
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
