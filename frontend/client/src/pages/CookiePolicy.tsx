/**
 * COOKIE POLICY PAGE
 * 100% Dynamic - No mock data
 * UI Style: Gradient headers, stat cards with icons, rounded cards
 */

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { Cookie, Calendar, ChevronRight, Settings } from "lucide-react";
import { toast } from "sonner";

export default function CookiePolicy() {
  const cookieQuery = (trpc as any).legal.getCookiePolicy.useQuery();

  const updatePreferencesMutation = (trpc as any).legal.updateCookiePreferences.useMutation({
    onSuccess: () => toast.success("Cookie preferences updated"),
    onError: (error: any) => toast.error("Failed to update", { description: error.message }),
  });

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with Gradient Title */}
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
          Cookie Policy
        </h1>
        <p className="text-slate-400 text-sm mt-1">How we use cookies and similar technologies</p>
      </div>

      {/* Last Updated */}
      {cookieQuery.isLoading ? (
        <Skeleton className="h-12 w-64 rounded-lg" />
      ) : (
        <div className="flex items-center gap-2 text-slate-400">
          <Calendar className="w-4 h-4" />
          <span>Last updated: {(cookieQuery.data as any)?.lastUpdated}</span>
        </div>
      )}

      {/* Cookie Preferences */}
      <Card className="bg-gradient-to-r from-cyan-500/10 to-emerald-500/10 border-cyan-500/30 rounded-xl">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Settings className="w-5 h-5 text-cyan-400" />
              <div>
                <p className="text-white font-medium">Manage Cookie Preferences</p>
                <p className="text-sm text-slate-400">Customize which cookies you allow</p>
              </div>
            </div>
            <Button className="bg-cyan-600 hover:bg-cyan-700 rounded-lg" onClick={() => updatePreferencesMutation.mutate({})}>
              Manage Preferences
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Cookie Content */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardContent className="p-6">
          {cookieQuery.isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i: any) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-8">
              {(cookieQuery.data as any)?.sections?.map((section: any, idx: number) => (
                <div key={idx}>
                  <h2 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
                    <ChevronRight className="w-5 h-5 text-cyan-400" />
                    {section.title}
                  </h2>
                  <div className="text-slate-300 space-y-3 pl-7">
                    {section.content?.split('\n').map((paragraph: string, pIdx: number) => (
                      <p key={pIdx}>{paragraph}</p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Contact */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <Cookie className="w-5 h-5 text-cyan-400" />
            <div>
              <p className="text-white font-medium">Questions about cookies?</p>
              <p className="text-sm text-slate-400">Contact us at {(cookieQuery.data as any)?.contactEmail || "privacy@eusotrip.com"}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
