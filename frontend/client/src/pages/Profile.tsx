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
  User, Mail, Phone, Building, MapPin, Calendar,
  Shield, Edit, CheckCircle
} from "lucide-react";
import { useLocation } from "wouter";

export default function Profile() {
  const [, setLocation] = useLocation();

  const profileQuery = (trpc as any).users.getProfile.useQuery();
  const profile = profileQuery.data;

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with Gradient Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
            My Profile
          </h1>
          <p className="text-slate-400 text-sm mt-1">View and manage your account information</p>
        </div>
        <Button className="bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 rounded-lg" onClick={() => setLocation("/settings")}>
          <Edit className="w-4 h-4 mr-2" />Edit Profile
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-6 text-center">
            {profileQuery.isLoading ? (
              <div className="space-y-4">
                <Skeleton className="w-24 h-24 rounded-full mx-auto" />
                <Skeleton className="h-6 w-32 mx-auto" />
                <Skeleton className="h-4 w-24 mx-auto" />
              </div>
            ) : (
              <>
                <div className="w-24 h-24 rounded-full bg-gradient-to-r from-cyan-500 to-emerald-500 mx-auto mb-4 flex items-center justify-center">
                  <span className="text-3xl font-bold text-white">
                    {profile?.firstName?.[0]}{profile?.lastName?.[0]}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-white mb-1">{profile?.firstName} {profile?.lastName}</h2>
                <div className="flex items-center justify-center gap-2 mb-4">
                  <Badge className="bg-cyan-500/20 text-cyan-400 border-0">{profile?.role}</Badge>
                  {profile?.verified && (
                    <Badge className="bg-green-500/20 text-green-400 border-0">
                      <CheckCircle className="w-3 h-3 mr-1" />Verified
                    </Badge>
                  )}
                </div>
                <p className="text-slate-400 text-sm">Member since {profile?.createdAt}</p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card className="lg:col-span-2 bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg">Contact Information</CardTitle>
          </CardHeader>
          <CardContent>
            {profileQuery.isLoading ? (
              <div className="space-y-4">{[1, 2, 3, 4].map((i: any) => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-700/30">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-blue-500/20">
                      <Mail className="w-4 h-4 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Email</p>
                      <p className="text-white">{profile?.email}</p>
                    </div>
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-slate-700/30">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-green-500/20">
                      <Phone className="w-4 h-4 text-green-400" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Phone</p>
                      <p className="text-white">{profile?.phone || "Not provided"}</p>
                    </div>
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-slate-700/30">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-purple-500/20">
                      <Building className="w-4 h-4 text-purple-400" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Company</p>
                      <p className="text-white">{profile?.company || "Not provided"}</p>
                    </div>
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-slate-700/30">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-orange-500/20">
                      <MapPin className="w-4 h-4 text-orange-400" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Location</p>
                      <p className="text-white">{profile?.location || "Not provided"}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Account Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-500/20">
                <User className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-400">{profile?.loadsCreated || 0}</p>
                <p className="text-xs text-slate-400">Loads Created</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/20">
                <CheckCircle className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-400">{profile?.loadsCompleted || 0}</p>
                <p className="text-xs text-slate-400">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-purple-500/20">
                <Shield className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-400">{profile?.rating || "N/A"}</p>
                <p className="text-xs text-slate-400">Rating</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-cyan-500/20">
                <Calendar className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-cyan-400">{profile?.daysActive || 0}</p>
                <p className="text-xs text-slate-400">Days Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
