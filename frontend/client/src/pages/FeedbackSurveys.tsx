/**
 * FEEDBACK SURVEYS PAGE
 * 100% Dynamic - No mock data
 * UI Style: Gradient headers, stat cards with icons, rounded cards
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  ClipboardList, Star, CheckCircle, Clock,
  ThumbsUp, ThumbsDown, Send
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function FeedbackSurveys() {
  const [selectedSurvey, setSelectedSurvey] = useState<string | null>(null);
  const [responses, setResponses] = useState<Record<string, any>>({});

  const surveysQuery = (trpc as any).support.getPendingSurveys.useQuery();
  const completedQuery = (trpc as any).support.getCompletedSurveys.useQuery({ limit: 10 });
  const surveyDetailQuery = (trpc as any).support.getSurveyDetail.useQuery({ surveyId: selectedSurvey! }, { enabled: !!selectedSurvey });

  const submitMutation = (trpc as any).support.submitSurvey.useMutation({
    onSuccess: () => { toast.success("Survey submitted! Thank you for your feedback."); setSelectedSurvey(null); setResponses({}); surveysQuery.refetch(); completedQuery.refetch(); },
    onError: (error: any) => toast.error("Failed", { description: error.message }),
  });

  const renderQuestion = (question: any) => {
    switch (question.type) {
      case "rating":
        return (
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((star: any) => (
              <Button key={star} size="sm" variant="ghost" className={cn("p-2", responses[question.id] >= star ? "text-yellow-400" : "text-slate-500")} onClick={() => setResponses({ ...responses, [question.id]: star })}>
                <Star className={cn("w-6 h-6", responses[question.id] >= star && "fill-yellow-400")} />
              </Button>
            ))}
          </div>
        );
      case "yesno":
        return (
          <div className="flex gap-3">
            <Button variant="outline" className={cn("rounded-lg", responses[question.id] === true ? "bg-green-500/20 border-green-500/50 text-green-400" : "bg-slate-700/50 border-slate-600/50")} onClick={() => setResponses({ ...responses, [question.id]: true })}>
              <ThumbsUp className="w-4 h-4 mr-2" />Yes
            </Button>
            <Button variant="outline" className={cn("rounded-lg", responses[question.id] === false ? "bg-red-500/20 border-red-500/50 text-red-400" : "bg-slate-700/50 border-slate-600/50")} onClick={() => setResponses({ ...responses, [question.id]: false })}>
              <ThumbsDown className="w-4 h-4 mr-2" />No
            </Button>
          </div>
        );
      case "text":
        return (
          <Textarea value={responses[question.id] || ""} onChange={(e: any) => setResponses({ ...responses, [question.id]: e.target.value })} placeholder="Enter your feedback..." rows={3} className="bg-slate-800/50 border-slate-700/50 rounded-lg" />
        );
      default:
        return null;
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with Gradient Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
            Feedback & Surveys
          </h1>
          <p className="text-slate-400 text-sm mt-1">Help us improve with your feedback</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-500/20">
                <ClipboardList className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                {surveysQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-blue-400">{(surveysQuery.data as any)?.length || 0}</p>
                )}
                <p className="text-xs text-slate-400">Pending</p>
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
                {completedQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">{(completedQuery.data as any)?.total || 0}</p>
                )}
                <p className="text-xs text-slate-400">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-yellow-500/20">
                <Star className="w-6 h-6 text-yellow-400" />
              </div>
              <div>
                {completedQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-yellow-400">{(completedQuery.data as any)?.avgRating || 0}</p>
                )}
                <p className="text-xs text-slate-400">Avg Rating</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Survey Detail */}
      {selectedSurvey && (
        <Card className="bg-slate-800/50 border-cyan-500/30 rounded-xl">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-white text-lg flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-cyan-400" />
                {(surveyDetailQuery.data as any)?.title}
              </CardTitle>
              <Button variant="ghost" className="text-slate-400 hover:text-white" onClick={() => setSelectedSurvey(null)}>Close</Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {surveyDetailQuery.isLoading ? (
              [1, 2, 3].map((i: any) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)
            ) : (
              <>
                <p className="text-sm text-slate-400">{(surveyDetailQuery.data as any)?.description}</p>
                {(surveyDetailQuery.data as any)?.questions?.map((question: any, idx: number) => (
                  <div key={question.id} className="p-4 rounded-xl bg-slate-700/30">
                    <p className="text-white font-medium mb-3">{idx + 1}. {question.text}</p>
                    {renderQuestion(question)}
                  </div>
                ))}
                <Button className="w-full bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 rounded-lg" onClick={() => submitMutation.mutate({ surveyId: selectedSurvey, responses: Object.entries(responses).map(([questionId, answer]) => ({ questionId, answer })) })}>
                  <Send className="w-4 h-4 mr-2" />Submit Feedback
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Pending Surveys */}
      {!selectedSurvey && (
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <Clock className="w-5 h-5 text-yellow-400" />
              Pending Surveys
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {surveysQuery.isLoading ? (
              <div className="p-4 space-y-3">{[1, 2].map((i: any) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}</div>
            ) : (surveysQuery.data as any)?.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-3" />
                <p className="text-slate-400">All caught up!</p>
                <p className="text-sm text-slate-500 mt-1">No pending surveys</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-700/50">
                {(surveysQuery.data as any)?.map((survey: any) => (
                  <div key={survey.id} className="p-4 flex items-center justify-between hover:bg-slate-700/20 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-xl bg-cyan-500/20">
                        <ClipboardList className="w-5 h-5 text-cyan-400" />
                      </div>
                      <div>
                        <p className="text-white font-medium">{survey.title}</p>
                        <p className="text-sm text-slate-400">{survey.questionCount} questions</p>
                        <p className="text-xs text-slate-500 mt-1 flex items-center gap-1"><Clock className="w-3 h-3" />Expires: {survey.expiresAt}</p>
                      </div>
                    </div>
                    <Button className="bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 rounded-lg" onClick={() => setSelectedSurvey(survey.id)}>
                      Take Survey
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Completed Surveys */}
      {!selectedSurvey && (
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-400" />
              Completed Surveys
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {completedQuery.isLoading ? (
              <div className="p-4 space-y-3">{[1, 2].map((i: any) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div>
            ) : (completedQuery.data as any)?.surveys?.length === 0 ? (
              <div className="text-center py-8">
                <ClipboardList className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                <p className="text-slate-400">No completed surveys</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-700/50">
                {(completedQuery.data as any)?.surveys?.map((survey: any) => (
                  <div key={survey.id} className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-xl bg-green-500/20">
                        <CheckCircle className="w-5 h-5 text-green-400" />
                      </div>
                      <div>
                        <p className="text-white font-medium">{survey.title}</p>
                        <p className="text-xs text-slate-500">Completed: {survey.completedAt}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star: any) => (
                        <Star key={star} className={cn("w-4 h-4", star <= survey.rating ? "text-yellow-400 fill-yellow-400" : "text-slate-600")} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
