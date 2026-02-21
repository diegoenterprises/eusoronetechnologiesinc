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
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";

export default function Profile() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [, setLocation] = useLocation();

  const profileQuery = (trpc as any).users.getProfile.useQuery();
  const profile = profileQuery.data;

  const cardCls = cn("rounded-2xl border", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-white/[0.03] border-white/[0.06]");
  const cellCls = cn("p-4 rounded-xl border", isLight ? "bg-slate-50 border-slate-200" : "bg-white/[0.02] border-slate-700/30");
  const valCls = cn("font-medium text-sm", isLight ? "text-slate-800" : "text-white");

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1200px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">My Profile</h1>
          <p className={cn("text-sm mt-1", isLight ? "text-slate-500" : "text-slate-400")}>View and manage your account information</p>
        </div>
        <Button className="bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white rounded-xl font-bold text-sm" onClick={() => setLocation("/settings")}>
          <Edit className="w-4 h-4 mr-2" />Edit Profile
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <Card className={cardCls}>
          <CardContent className="p-6 text-center">
            {profileQuery.isLoading ? (
              <div className="space-y-4">
                <Skeleton className={cn("w-24 h-24 rounded-full mx-auto", isLight ? "bg-slate-100" : "")} />
                <Skeleton className={cn("h-6 w-32 mx-auto", isLight ? "bg-slate-100" : "")} />
                <Skeleton className={cn("h-4 w-24 mx-auto", isLight ? "bg-slate-100" : "")} />
              </div>
            ) : (
              <>
                <div className="w-24 h-24 rounded-full bg-gradient-to-r from-[#1473FF] to-[#BE01FF] mx-auto mb-4 flex items-center justify-center">
                  <span className="text-3xl font-bold text-white">{profile?.firstName?.[0]}{profile?.lastName?.[0]}</span>
                </div>
                <h2 className={cn("text-xl font-bold mb-1", isLight ? "text-slate-800" : "text-white")}>{profile?.firstName} {profile?.lastName}</h2>
                <div className="flex items-center justify-center gap-2 mb-4">
                  <Badge className="bg-gradient-to-r from-[#1473FF]/15 to-[#BE01FF]/15 text-purple-600 dark:text-purple-400 border-0">{profile?.role}</Badge>
                  {profile?.verified && (
                    <Badge className={cn("border-0", isLight ? "bg-emerald-100 text-emerald-700" : "bg-green-500/20 text-green-400")}>
                      <CheckCircle className="w-3 h-3 mr-1" />Verified
                    </Badge>
                  )}
                </div>
                <p className={cn("text-sm", isLight ? "text-slate-400" : "text-slate-400")}>Member since {profile?.createdAt}</p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card className={cn("lg:col-span-2", cardCls)}>
          <CardHeader className="pb-3">
            <CardTitle className={cn("text-lg", isLight ? "text-slate-800" : "text-white")}>Contact Information</CardTitle>
          </CardHeader>
          <CardContent>
            {profileQuery.isLoading ? (
              <div className="space-y-4">{[1, 2, 3, 4].map((i: any) => <Skeleton key={i} className={cn("h-12 w-full rounded-lg", isLight ? "bg-slate-100" : "")} />)}</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { icon: <Mail className="w-4 h-4 text-blue-500" />, bg: "bg-blue-500/15", label: "Email", value: profile?.email },
                  { icon: <Phone className="w-4 h-4 text-green-500" />, bg: "bg-green-500/15", label: "Phone", value: profile?.phone || "Not provided" },
                  { icon: <Building className="w-4 h-4 text-purple-500" />, bg: "bg-purple-500/15", label: "Company", value: profile?.company || "Not provided" },
                  { icon: <MapPin className="w-4 h-4 text-orange-500" />, bg: "bg-orange-500/15", label: "Location", value: profile?.location || "Not provided" },
                ].map((item) => (
                  <div key={item.label} className={cellCls}>
                    <div className="flex items-center gap-3">
                      <div className={cn("p-2 rounded-xl", item.bg)}>{item.icon}</div>
                      <div>
                        <p className={cn("text-xs", isLight ? "text-slate-400" : "text-slate-500")}>{item.label}</p>
                        <p className={valCls}>{item.value}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Account Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Loads Created", value: profile?.loadsCreated || 0, icon: <User className="w-5 h-5" />, color: "text-blue-500", bg: "bg-blue-500/15" },
          { label: "Completed", value: profile?.loadsCompleted || 0, icon: <CheckCircle className="w-5 h-5" />, color: "text-green-500", bg: "bg-green-500/15" },
          { label: "Rating", value: profile?.rating || "N/A", icon: <Shield className="w-5 h-5" />, color: "text-purple-500", bg: "bg-purple-500/15" },
          { label: "Days Active", value: profile?.daysActive || 0, icon: <Calendar className="w-5 h-5" />, color: "text-cyan-500", bg: "bg-cyan-500/15" },
        ].map((stat) => (
          <Card key={stat.label} className={cardCls}>
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className={cn("p-3 rounded-xl", stat.bg)}>
                  <span className={stat.color}>{stat.icon}</span>
                </div>
                <div>
                  {profileQuery.isLoading ? (
                    <Skeleton className={cn("h-8 w-14 rounded-lg", isLight ? "bg-slate-100" : "")} />
                  ) : (
                    <p className={cn("text-2xl font-bold", stat.color)}>{stat.value}</p>
                  )}
                  <p className="text-xs text-slate-400">{stat.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
