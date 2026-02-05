/**
 * TERMS OF SERVICE PAGE
 * 100% Dynamic - No mock data
 * UI Style: Gradient headers, stat cards with icons, rounded cards
 */

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { FileText, Calendar, ChevronRight } from "lucide-react";

export default function TermsOfService() {
  const termsQuery = (trpc as any).legal.getTermsOfService.useQuery();

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with Gradient Title */}
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
          Terms of Service
        </h1>
        <p className="text-slate-400 text-sm mt-1">Please read these terms carefully</p>
      </div>

      {/* Last Updated */}
      {termsQuery.isLoading ? (
        <Skeleton className="h-12 w-64 rounded-lg" />
      ) : (
        <div className="flex items-center gap-2 text-slate-400">
          <Calendar className="w-4 h-4" />
          <span>Last updated: {(termsQuery.data as any)?.lastUpdated}</span>
        </div>
      )}

      {/* Terms Content */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardContent className="p-6">
          {termsQuery.isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i: any) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-8">
              {(termsQuery.data as any)?.sections?.map((section: any, idx: number) => (
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
            <FileText className="w-5 h-5 text-cyan-400" />
            <div>
              <p className="text-white font-medium">Questions about these terms?</p>
              <p className="text-sm text-slate-400">Contact us at {(termsQuery.data as any)?.contactEmail || "legal@eusotrip.com"}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
