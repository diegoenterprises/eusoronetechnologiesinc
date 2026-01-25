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
  Shield, Users, Lock, Save, Plus,
  CheckCircle, Settings
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function RolePermissions() {
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<Record<string, boolean>>({});

  const rolesQuery = trpc.admin.getRoles.useQuery();
  const permissionsQuery = trpc.admin.getRolePermissions.useQuery({ roleId: selectedRole || "" }, { enabled: !!selectedRole });

  const updateMutation = trpc.admin.updateRolePermissions.useMutation({
    onSuccess: () => { toast.success("Permissions updated"); permissionsQuery.refetch(); },
    onError: (error) => toast.error("Failed", { description: error.message }),
  });

  React.useEffect(() => {
    if (permissionsQuery.data) {
      const perms: Record<string, boolean> = {};
      permissionsQuery.data.permissions?.forEach((p: any) => { perms[p.id] = p.enabled; });
      setPermissions(perms);
    }
  }, [permissionsQuery.data]);

  const togglePermission = (permId: string) => {
    setPermissions(prev => ({ ...prev, [permId]: !prev[permId] }));
  };

  const handleSave = () => {
    if (selectedRole) {
      updateMutation.mutate({ roleId: selectedRole, permissions });
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">Role Permissions</h1>
          <p className="text-slate-400 text-sm mt-1">Manage role-based access control</p>
        </div>
        <Button className="bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 rounded-lg">
          <Plus className="w-4 h-4 mr-2" />Create Role
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardHeader className="pb-3"><CardTitle className="text-white text-lg flex items-center gap-2"><Users className="w-5 h-5 text-cyan-400" />Roles</CardTitle></CardHeader>
          <CardContent className="p-0">
            {rolesQuery.isLoading ? (
              <div className="p-4 space-y-2">{[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}</div>
            ) : (
              <div className="divide-y divide-slate-700/50">
                {rolesQuery.data?.map((role: any) => (
                  <div key={role.id} className={cn("p-3 cursor-pointer hover:bg-slate-700/20 transition-colors", selectedRole === role.id && "bg-cyan-500/10 border-l-2 border-cyan-500")} onClick={() => setSelectedRole(role.id)}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white font-medium">{role.name}</p>
                        <p className="text-xs text-slate-500">{role.userCount} users</p>
                      </div>
                      {role.isSystem && <Badge className="bg-purple-500/20 text-purple-400 border-0 text-xs">System</Badge>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl lg:col-span-3">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-white text-lg flex items-center gap-2"><Lock className="w-5 h-5 text-yellow-400" />Permissions</CardTitle>
              {selectedRole && (
                <Button size="sm" className="bg-gradient-to-r from-cyan-600 to-emerald-600 rounded-lg" onClick={handleSave} disabled={updateMutation.isPending}>
                  <Save className="w-4 h-4 mr-2" />Save Changes
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {!selectedRole ? (
              <div className="text-center py-16"><Shield className="w-12 h-12 text-slate-500 mx-auto mb-4" /><p className="text-slate-400">Select a role to view permissions</p></div>
            ) : permissionsQuery.isLoading ? (
              <div className="space-y-4">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}</div>
            ) : (
              <div className="space-y-6">
                {permissionsQuery.data?.categories?.map((category: any) => (
                  <div key={category.name} className="p-4 rounded-xl bg-slate-700/30">
                    <div className="flex items-center gap-2 mb-4">
                      <Settings className="w-5 h-5 text-cyan-400" />
                      <p className="text-white font-bold">{category.name}</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {category.permissions?.map((perm: any) => (
                        <div key={perm.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50">
                          <div>
                            <p className="text-white text-sm">{perm.name}</p>
                            <p className="text-xs text-slate-500">{perm.description}</p>
                          </div>
                          <Switch checked={permissions[perm.id] || false} onCheckedChange={() => togglePermission(perm.id)} />
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
