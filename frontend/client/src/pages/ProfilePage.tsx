/**
 * PROFILE PAGE
 * 100% Dynamic - No mock data
 * UI Style: Gradient headers, stat cards with icons, rounded cards
 */

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  User, Mail, Phone, Building, Calendar,
  Shield, Edit, MapPin, Award
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function ProfilePage() {
  const profileQuery = trpc.user.getProfile.useQuery();
  const statsQuery = trpc.user.getProfileStats.useQuery();

  const profile = profileQuery.data;
  const stats = statsQuery.data;

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">My Profile</h1>
          <p className="text-slate-400 text-sm mt-1">View and manage your profile</p>
        </div>
        <Button className="bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 rounded-lg">
          <Edit className="w-4 h-4 mr-2" />Edit Profile
        </Button>
      </div>

      {profileQuery.isLoading ? (
        <div className="space-y-6">
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
      ) : profile && (
        <>
          <Card className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border-cyan-500/30 rounded-xl">
            <CardContent className="p-6">
              <div className="flex items-start gap-6">
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-cyan-500 to-emerald-500 flex items-center justify-center text-white text-4xl font-bold">
                  {profile.name?.charAt(0)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-white text-2xl font-bold">{profile.name}</h2>
                    <Badge className={cn("border-0", profile.verified ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400")}>
                      <Shield className="w-3 h-3 mr-1" />{profile.verified ? "Verified" : "Pending"}
                    </Badge>
                    <Badge className="bg-purple-500/20 text-purple-400 border-0">{profile.role}</Badge>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                    <div className="flex items-center gap-2 text-slate-400"><Mail className="w-4 h-4" /><span className="text-sm">{profile.email}</span></div>
                    <div className="flex items-center gap-2 text-slate-400"><Phone className="w-4 h-4" /><span className="text-sm">{profile.phone || "Not set"}</span></div>
                    <div className="flex items-center gap-2 text-slate-400"><Building className="w-4 h-4" /><span className="text-sm">{profile.company || "N/A"}</span></div>
                    <div className="flex items-center gap-2 text-slate-400"><MapPin className="w-4 h-4" /><span className="text-sm">{profile.location || "Not set"}</span></div>
                  </div>
                  <div className="flex items-center gap-2 text-slate-500 text-sm mt-3">
                    <Calendar className="w-4 h-4" />
                    <span>Member since {profile.joinedAt}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-5">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-cyan-500/20"><Award className="w-6 h-6 text-cyan-400" /></div>
                  <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-cyan-400">{stats?.totalLoads || 0}</p>}<p className="text-xs text-slate-400">Total Loads</p></div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-5">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-green-500/20"><Award className="w-6 h-6 text-green-400" /></div>
                  <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-16" /> : <p className="text-2xl font-bold text-green-400">{stats?.rating}</p>}<p className="text-xs text-slate-400">Rating</p></div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-5">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-purple-500/20"><MapPin className="w-6 h-6 text-purple-400" /></div>
                  <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-16" /> : <p className="text-2xl font-bold text-purple-400">{stats?.totalMiles?.toLocaleString()}</p>}<p className="text-xs text-slate-400">Miles</p></div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-5">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-yellow-500/20"><Calendar className="w-6 h-6 text-yellow-400" /></div>
                  <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-yellow-400">{stats?.daysActive}</p>}<p className="text-xs text-slate-400">Days Active</p></div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardHeader className="pb-3"><CardTitle className="text-white text-lg flex items-center gap-2"><User className="w-5 h-5 text-cyan-400" />Account Details</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between p-3 rounded-lg bg-slate-700/30"><span className="text-slate-400">User ID</span><span className="text-white font-medium">{profile.id}</span></div>
                <div className="flex justify-between p-3 rounded-lg bg-slate-700/30"><span className="text-slate-400">Account Type</span><span className="text-white font-medium capitalize">{profile.accountType}</span></div>
                <div className="flex justify-between p-3 rounded-lg bg-slate-700/30"><span className="text-slate-400">Status</span><span className="text-green-400 font-medium capitalize">{profile.status}</span></div>
                <div className="flex justify-between p-3 rounded-lg bg-slate-700/30"><span className="text-slate-400">Last Login</span><span className="text-white font-medium">{profile.lastLogin}</span></div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardHeader className="pb-3"><CardTitle className="text-white text-lg flex items-center gap-2"><Shield className="w-5 h-5 text-green-400" />Certifications</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {profile.certifications?.length === 0 ? (
                  <div className="text-center py-8"><Shield className="w-8 h-8 text-slate-500 mx-auto mb-2" /><p className="text-slate-400 text-sm">No certifications</p></div>
                ) : (
                  profile.certifications?.map((cert: any) => (
                    <div key={cert.id} className="flex justify-between items-center p-3 rounded-lg bg-slate-700/30">
                      <div>
                        <p className="text-white font-medium">{cert.name}</p>
                        <p className="text-xs text-slate-500">Expires: {cert.expiresAt}</p>
                      </div>
                      <Badge className={cn("border-0", cert.status === "active" ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400")}>{cert.status}</Badge>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
