/**
 * TRAINING LMS — Learning Management System
 * Course catalog, course detail, quiz taking, progress tracking, certificates.
 * 100% Dynamic | Theme-aware | Dark theme with blue/indigo accents.
 */

import React, { useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";
import {
  GraduationCap, BookOpen, Award, Play, CheckCircle, Clock, Search,
  ChevronRight, ChevronLeft, ArrowRight, Shield, AlertTriangle,
  Globe, Truck, Flame, BarChart3, Target, Star, FileText, Download,
  RefreshCw, Filter, Users, Zap, Trophy, Lock, Unlock,
  CircleDot, Check, X, Timer, BookMarked, ClipboardCheck,
} from "lucide-react";

// ── Types ──
type ViewMode = "catalog" | "detail" | "lesson" | "quiz" | "enrollments" | "certificates";

interface CourseCategory {
  value: string;
  label: string;
  icon: React.ElementType;
  color: string;
}

const CATEGORIES: CourseCategory[] = [
  { value: "", label: "All Courses", icon: BookOpen, color: "text-blue-400" },
  { value: "compliance", label: "Compliance", icon: Shield, color: "text-emerald-400" },
  { value: "safety", label: "Safety", icon: AlertTriangle, color: "text-amber-400" },
  { value: "hazmat", label: "Hazmat", icon: Flame, color: "text-red-400" },
  { value: "operations", label: "Operations", icon: Truck, color: "text-sky-400" },
  { value: "cross_border", label: "Cross-Border", icon: Globe, color: "text-violet-400" },
  { value: "environmental", label: "Environmental", icon: Target, color: "text-green-400" },
  { value: "wellness", label: "Wellness", icon: Users, color: "text-pink-400" },
];

export default function TrainingLMS() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const { user } = useAuth();

  const [view, setView] = useState<ViewMode>("catalog");
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [selectedCourseSlug, setSelectedCourseSlug] = useState<string>("");
  const [selectedLessonId, setSelectedLessonId] = useState<number | null>(null);
  const [selectedModuleId, setSelectedModuleId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<string>("");

  // ── Country ──
  const [effectiveCountry, setEffectiveCountry] = useState<string>((user as any)?.country || "");
  const userCountry = effectiveCountry;
  const setCountryMutation = trpc.trainingLMS.setUserCountry.useMutation({
    onSuccess: () => {
      setEffectiveCountry(selectedCountry);
      setShowCountryPicker(false);
    },
  });

  // ── Data Queries ──
  const dashboard = trpc.trainingLMS.getLMSDashboard.useQuery();
  const courses = trpc.trainingLMS.listCourses.useQuery({
    category: categoryFilter || undefined,
    search: searchQuery || undefined,
    country: effectiveCountry || undefined,
    page: 1,
    limit: 50,
  });
  const enrollments = trpc.trainingLMS.getMyEnrollments.useQuery();
  const certificates = trpc.trainingLMS.getMyCertificates.useQuery();

  const courseDetail = trpc.trainingLMS.getCourseDetail.useQuery(
    { courseId: selectedCourseId || undefined, slug: selectedCourseSlug || undefined },
    { enabled: view === "detail" && (!!selectedCourseId || !!selectedCourseSlug) }
  );

  const lessonContent = trpc.trainingLMS.getLessonContent.useQuery(
    { lessonId: selectedLessonId! },
    { enabled: view === "lesson" && !!selectedLessonId }
  );

  const quizData = trpc.trainingLMS.getQuiz.useQuery(
    { moduleId: selectedModuleId! },
    { enabled: view === "quiz" && !!selectedModuleId }
  );

  // ── Mutations ──
  const enrollMutation = trpc.trainingLMS.enrollInCourse.useMutation({
    onSuccess: () => {
      enrollments.refetch();
      courseDetail.refetch();
    },
  });
  const completeLessonMutation = trpc.trainingLMS.completeLesson.useMutation({
    onSuccess: () => {
      courseDetail.refetch();
      enrollments.refetch();
      dashboard.refetch();
    },
  });
  const submitQuizMutation = trpc.trainingLMS.submitQuiz.useMutation({
    onSuccess: () => {
      courseDetail.refetch();
      enrollments.refetch();
      dashboard.refetch();
      certificates.refetch();
    },
  });

  // ── Navigation ──
  const openCourse = useCallback((courseId: number, slug?: string) => {
    setSelectedCourseId(courseId);
    setSelectedCourseSlug(slug || "");
    setView("detail");
  }, []);

  const openLesson = useCallback((lessonId: number) => {
    setSelectedLessonId(lessonId);
    setView("lesson");
  }, []);

  const openQuiz = useCallback((moduleId: number) => {
    setSelectedModuleId(moduleId);
    setView("quiz");
  }, []);

  const goBack = useCallback(() => {
    if (view === "lesson" || view === "quiz") setView("detail");
    else if (view === "detail") setView("catalog");
    else setView("catalog");
  }, [view]);

  // ── Styles ──
  const bg = isDark ? "bg-[#0B1120]" : "bg-gray-50";
  const cardBg = isDark ? "bg-[#111827]/80 border-white/5" : "bg-white border-gray-200";
  const textPrimary = isDark ? "text-white" : "text-gray-900";
  const textSecondary = isDark ? "text-gray-400" : "text-gray-500";
  const accent = "from-blue-500 to-indigo-600";

  return (
    <div className={cn("min-h-screen p-4 md:p-6 space-y-6", bg)}>
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          {view !== "catalog" && (
            <Button variant="ghost" size="sm" onClick={goBack} className={textSecondary}>
              <ChevronLeft className="w-4 h-4 mr-1" /> Back
            </Button>
          )}
          <div className={cn("w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center", accent)}>
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className={cn("text-xl font-bold", textPrimary)}>Training & Certification</h1>
            <p className={textSecondary}>
              {view === "catalog" && "Browse courses & certifications"}
              {view === "detail" && (courseDetail.data?.title || "Course Details")}
              {view === "lesson" && "Lesson Content"}
              {view === "quiz" && "Module Assessment"}
              {view === "enrollments" && "My Enrollments"}
              {view === "certificates" && "My Certificates"}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant={view === "catalog" ? "default" : "outline"}
            size="sm"
            onClick={() => setView("catalog")}
          >
            <BookOpen className="w-4 h-4 mr-1" /> Catalog
          </Button>
          <Button
            variant={view === "enrollments" ? "default" : "outline"}
            size="sm"
            onClick={() => setView("enrollments")}
          >
            <Play className="w-4 h-4 mr-1" /> My Courses
          </Button>
          <Button
            variant={view === "certificates" ? "default" : "outline"}
            size="sm"
            onClick={() => setView("certificates")}
          >
            <Award className="w-4 h-4 mr-1" /> Certificates
          </Button>
        </div>
      </div>

      {/* Country Selection Banner */}
      {!userCountry && !showCountryPicker && view === "catalog" && (
        <div className={cn("rounded-xl border p-4 flex items-center justify-between", isDark ? "bg-blue-500/10 border-blue-500/20" : "bg-blue-50 border-blue-200")}>
          <div className="flex items-center gap-3">
            <Globe className="w-5 h-5 text-blue-400" />
            <div>
              <p className={cn("text-sm font-medium", textPrimary)}>Select your operating country</p>
              <p className={cn("text-xs", textSecondary)}>See training courses relevant to your regulatory jurisdiction</p>
            </div>
          </div>
          <Button size="sm" onClick={() => setShowCountryPicker(true)} className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
            Select Country
          </Button>
        </div>
      )}

      {/* Country Picker Modal */}
      {showCountryPicker && (
        <div className={cn("rounded-xl border p-6 space-y-4", cardBg)}>
          <h3 className={cn("text-lg font-semibold", textPrimary)}>Primary Operating Country</h3>
          <p className={cn("text-sm", textSecondary)}>Select the country where you primarily operate. This determines which regulatory courses you see.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              { code: "US", label: "United States", subtitle: "FMCSA / DOT regulations", flag: "\ud83c\uddfa\ud83c\uddf8" },
              { code: "CA", label: "Canada", subtitle: "TDG / Transport Canada", flag: "\ud83c\udde8\ud83c\udde6" },
              { code: "MX", label: "Mexico", subtitle: "SCT / NOM regulations", flag: "\ud83c\uddf2\ud83c\uddfd" },
            ].map((c) => (
              <button
                key={c.code}
                onClick={() => setSelectedCountry(c.code)}
                className={cn(
                  "p-4 rounded-lg border text-left flex items-center gap-3 transition-all",
                  selectedCountry === c.code
                    ? "border-blue-500 bg-blue-500/10"
                    : isDark ? "border-white/10 hover:border-white/20" : "border-gray-200 hover:border-gray-300"
                )}
              >
                <span className="text-2xl">{c.flag}</span>
                <div>
                  <p className={cn("text-sm font-medium", textPrimary)}>{c.label}</p>
                  <p className={cn("text-xs", textSecondary)}>{c.subtitle}</p>
                </div>
              </button>
            ))}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowCountryPicker(false)}>Cancel</Button>
            <Button
              size="sm"
              disabled={!selectedCountry || setCountryMutation.isPending}
              onClick={() => setCountryMutation.mutate({ country: selectedCountry as any })}
              className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white"
            >
              {setCountryMutation.isPending ? "Saving..." : "Save Country"}
            </Button>
          </div>
        </div>
      )}

      {/* Country Context Badge */}
      {userCountry && view === "catalog" && (
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            <Globe className="w-3 h-3 mr-1" />
            Showing courses for: {userCountry === "US" ? "United States" : userCountry === "CA" ? "Canada" : userCountry === "MX" ? "Mexico" : userCountry}
          </Badge>
          <button onClick={() => setShowCountryPicker(true)} className={cn("text-xs underline", "text-blue-400 hover:text-blue-300")}>
            Change
          </button>
        </div>
      )}

      {/* Dashboard Stats */}
      {view === "catalog" && <DashboardStats data={dashboard.data} isDark={isDark} cardBg={cardBg} textPrimary={textPrimary} textSecondary={textSecondary} />}

      {/* Views */}
      {view === "catalog" && (
        <CourseCatalog
          courses={courses.data?.courses || []}
          isLoading={courses.isLoading}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          categoryFilter={categoryFilter}
          setCategoryFilter={setCategoryFilter}
          onOpenCourse={openCourse}
          isDark={isDark}
          cardBg={cardBg}
          textPrimary={textPrimary}
          textSecondary={textSecondary}
        />
      )}

      {view === "detail" && (
        <CourseDetail
          course={courseDetail.data}
          isLoading={courseDetail.isLoading}
          onEnroll={(courseId: number) => enrollMutation.mutate({ courseId })}
          enrolling={enrollMutation.isPending}
          onOpenLesson={openLesson}
          onOpenQuiz={openQuiz}
          isDark={isDark}
          cardBg={cardBg}
          textPrimary={textPrimary}
          textSecondary={textSecondary}
        />
      )}

      {view === "lesson" && (
        <LessonView
          lesson={lessonContent.data}
          isLoading={lessonContent.isLoading}
          onComplete={(lessonId: number) => {
            completeLessonMutation.mutate({ lessonId, timeSpentMinutes: 5 });
            goBack();
          }}
          isDark={isDark}
          cardBg={cardBg}
          textPrimary={textPrimary}
          textSecondary={textSecondary}
        />
      )}

      {view === "quiz" && (
        <QuizView
          quiz={quizData.data}
          isLoading={quizData.isLoading}
          onSubmit={(quizId: number, answers: any) => submitQuizMutation.mutate({ quizId, answers })}
          submitting={submitQuizMutation.isPending}
          result={submitQuizMutation.data}
          onBack={goBack}
          isDark={isDark}
          cardBg={cardBg}
          textPrimary={textPrimary}
          textSecondary={textSecondary}
        />
      )}

      {view === "enrollments" && (
        <EnrollmentsList
          enrollments={enrollments.data || []}
          isLoading={enrollments.isLoading}
          onOpenCourse={openCourse}
          isDark={isDark}
          cardBg={cardBg}
          textPrimary={textPrimary}
          textSecondary={textSecondary}
        />
      )}

      {view === "certificates" && (
        <CertificatesList
          certificates={certificates.data || []}
          isLoading={certificates.isLoading}
          isDark={isDark}
          cardBg={cardBg}
          textPrimary={textPrimary}
          textSecondary={textSecondary}
        />
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════
// Dashboard Stats
// ══════════════════════════════════════════════════
function DashboardStats({ data, isDark, cardBg, textPrimary, textSecondary }: any) {
  const stats = [
    { label: "Available Courses", value: data?.totalCourses || 0, icon: BookOpen, color: "text-blue-400" },
    { label: "Enrolled", value: data?.enrolledCourses || 0, icon: Play, color: "text-sky-400" },
    { label: "Completed", value: data?.completedCourses || 0, icon: CheckCircle, color: "text-emerald-400" },
    { label: "In Progress", value: data?.inProgressCourses || 0, icon: Clock, color: "text-amber-400" },
    { label: "Certificates", value: data?.totalCertificates || 0, icon: Award, color: "text-violet-400" },
    { label: "Avg Score", value: `${data?.averageScore || 0}%`, icon: Target, color: "text-pink-400" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {stats.map((s) => (
        <Card key={s.label} className={cn("border", cardBg)}>
          <CardContent className="p-4 text-center">
            <s.icon className={cn("w-5 h-5 mx-auto mb-2", s.color)} />
            <div className={cn("text-2xl font-bold", textPrimary)}>{s.value}</div>
            <div className={cn("text-xs", textSecondary)}>{s.label}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ══════════════════════════════════════════════════
// Course Catalog
// ══════════════════════════════════════════════════
function CourseCatalog({ courses, isLoading, searchQuery, setSearchQuery, categoryFilter, setCategoryFilter, onOpenCourse, isDark, cardBg, textPrimary, textSecondary }: any) {
  return (
    <div className="space-y-4">
      {/* Search + Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className={cn("absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4", textSecondary)} />
          <Input
            placeholder="Search courses..."
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
            className={cn("pl-10", isDark ? "bg-white/5 border-white/10 text-white" : "")}
          />
        </div>
      </div>

      {/* Category pills */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((cat) => (
          <Button
            key={cat.value}
            variant={categoryFilter === cat.value ? "default" : "outline"}
            size="sm"
            onClick={() => setCategoryFilter(cat.value)}
            className="text-xs"
          >
            <cat.icon className={cn("w-3 h-3 mr-1", categoryFilter === cat.value ? "text-white" : cat.color)} />
            {cat.label}
          </Button>
        ))}
      </div>

      {/* Course Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className={cn("border", cardBg)}>
              <CardContent className="p-5 space-y-3">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-2/3" />
                <Skeleton className="h-8 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map((course: any) => (
            <CourseCard
              key={course.id}
              course={course}
              onClick={() => onOpenCourse(course.id, course.slug)}
              isDark={isDark}
              cardBg={cardBg}
              textPrimary={textPrimary}
              textSecondary={textSecondary}
            />
          ))}
          {courses.length === 0 && (
            <div className={cn("col-span-full text-center py-12", textSecondary)}>
              <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No courses found matching your criteria.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Course Card ──
function CourseCard({ course, onClick, isDark, cardBg, textPrimary, textSecondary }: any) {
  const catIcon: Record<string, React.ElementType> = {
    compliance: Shield, safety: AlertTriangle, hazmat: Flame,
    operations: Truck, cross_border: Globe, environmental: Target, wellness: Users,
  };
  const catColor: Record<string, string> = {
    compliance: "bg-emerald-500/10 text-emerald-400", safety: "bg-amber-500/10 text-amber-400",
    hazmat: "bg-red-500/10 text-red-400", operations: "bg-sky-500/10 text-sky-400",
    cross_border: "bg-violet-500/10 text-violet-400", environmental: "bg-green-500/10 text-green-400",
    wellness: "bg-pink-500/10 text-pink-400",
  };
  const Icon = catIcon[course.category] || BookOpen;
  const color = catColor[course.category] || "bg-blue-500/10 text-blue-400";

  return (
    <Card
      className={cn("border cursor-pointer transition-all hover:shadow-lg hover:scale-[1.01]", cardBg)}
      onClick={onClick}
    >
      <CardContent className="p-5 space-y-3">
        <div className="flex items-start justify-between">
          <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", color)}>
            <Icon className="w-5 h-5" />
          </div>
          <div className="flex gap-1.5">
            {course.isMandatory && (
              <Badge variant="destructive" className="text-[10px] px-1.5 py-0">Required</Badge>
            )}
            {course.hazmatSpecific && (
              <Badge className="bg-red-500/20 text-red-400 text-[10px] px-1.5 py-0">HAZMAT</Badge>
            )}
            {course.crossBorder && (
              <Badge className="bg-violet-500/20 text-violet-400 text-[10px] px-1.5 py-0">Cross-Border</Badge>
            )}
          </div>
        </div>
        <h3 className={cn("font-semibold text-sm leading-snug", textPrimary)}>{course.title}</h3>
        <p className={cn("text-xs line-clamp-2", textSecondary)}>{course.description}</p>
        <div className={cn("flex items-center gap-3 text-xs", textSecondary)}>
          <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" /> {course.moduleCount} modules</span>
          <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {Math.round((course.estimatedDurationMinutes || 0) / 60)}h</span>
          <span className="flex items-center gap-1"><Target className="w-3 h-3" /> {course.passingScore}%</span>
        </div>
        <div className="flex items-center justify-between pt-1">
          <Badge variant="outline" className="text-[10px] capitalize">{course.difficultyLevel}</Badge>
          <Button variant="ghost" size="sm" className="text-blue-400 text-xs px-2 h-7">
            View Course <ChevronRight className="w-3 h-3 ml-1" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ══════════════════════════════════════════════════
// Course Detail
// ══════════════════════════════════════════════════
function CourseDetail({ course, isLoading, onEnroll, enrolling, onOpenLesson, onOpenQuiz, isDark, cardBg, textPrimary, textSecondary }: any) {
  if (isLoading) return <DetailSkeleton cardBg={cardBg} />;
  if (!course) return <div className={cn("text-center py-12", textSecondary)}>Course not found.</div>;

  const isEnrolled = !!course.enrollment;
  const progress = course.enrollment?.progressPercentage || 0;

  return (
    <div className="space-y-6">
      {/* Hero */}
      <Card className={cn("border overflow-hidden", cardBg)}>
        <CardContent className="p-6 space-y-4">
          <div className="flex flex-wrap gap-2 mb-2">
            <Badge variant="outline" className="capitalize">{course.category}</Badge>
            <Badge variant="outline" className="capitalize">{course.difficultyLevel}</Badge>
            {course.isMandatory && <Badge variant="destructive">Required</Badge>}
            {course.regulatoryReference && <Badge className="bg-blue-500/20 text-blue-400">{course.regulatoryReference}</Badge>}
          </div>
          <h2 className={cn("text-2xl font-bold", textPrimary)}>{course.title}</h2>
          <p className={textSecondary}>{course.longDescription || course.description}</p>

          <div className={cn("grid grid-cols-2 md:grid-cols-4 gap-4 pt-2", textSecondary)}>
            <div className="text-center">
              <div className={cn("text-lg font-bold", textPrimary)}>{course.moduleCount}</div>
              <div className="text-xs">Modules</div>
            </div>
            <div className="text-center">
              <div className={cn("text-lg font-bold", textPrimary)}>{Math.round((course.estimatedDurationMinutes || 0) / 60)}h</div>
              <div className="text-xs">Duration</div>
            </div>
            <div className="text-center">
              <div className={cn("text-lg font-bold", textPrimary)}>{course.passingScore}%</div>
              <div className="text-xs">Passing Score</div>
            </div>
            <div className="text-center">
              <div className={cn("text-lg font-bold", textPrimary)}>{course.renewalIntervalMonths || 12}mo</div>
              <div className="text-xs">Renewal</div>
            </div>
          </div>

          {/* Enrollment status */}
          {isEnrolled ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className={textSecondary}>Progress</span>
                <span className={cn("font-medium", textPrimary)}>{progress}%</span>
              </div>
              <div className={cn("h-2 rounded-full", isDark ? "bg-white/10" : "bg-gray-200")}>
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <Badge className={cn(
                course.enrollment?.status === "completed" ? "bg-emerald-500/20 text-emerald-400" :
                course.enrollment?.status === "in_progress" ? "bg-blue-500/20 text-blue-400" :
                "bg-gray-500/20 text-gray-400"
              )}>
                {course.enrollment?.status === "completed" ? "✓ Completed" : course.enrollment?.status === "in_progress" ? "In Progress" : "Enrolled"}
              </Badge>
            </div>
          ) : (
            <Button
              className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white"
              onClick={() => onEnroll(course.id)}
              disabled={enrolling}
            >
              {enrolling ? "Enrolling..." : "Enroll Now"} <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Modules */}
      <div className="space-y-3">
        <h3 className={cn("text-lg font-semibold", textPrimary)}>Course Modules</h3>
        {(course.modules || []).map((mod: any, idx: number) => (
          <Card key={mod.id} className={cn("border", cardBg)}>
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0",
                  isDark ? "bg-white/10 text-white" : "bg-gray-100 text-gray-700"
                )}>
                  {idx + 1}
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className={cn("font-medium text-sm", textPrimary)}>{mod.title}</h4>
                    <Badge variant="outline" className="text-[10px] capitalize">{mod.contentType}</Badge>
                  </div>
                  <p className={cn("text-xs", textSecondary)}>{mod.description}</p>
                  <div className={cn("flex items-center gap-3 text-xs", textSecondary)}>
                    <span><Clock className="w-3 h-3 inline mr-1" />{mod.estimatedDurationMinutes}min</span>
                    <span><BookOpen className="w-3 h-3 inline mr-1" />{(mod.lessons || []).length} lessons</span>
                    {mod.quiz && <span><ClipboardCheck className="w-3 h-3 inline mr-1" />Quiz</span>}
                  </div>

                  {/* Lessons */}
                  {isEnrolled && (mod.lessons || []).length > 0 && (
                    <div className="space-y-1 pt-2">
                      {mod.lessons.map((lesson: any, li: number) => (
                        <button
                          key={lesson.id}
                          onClick={() => onOpenLesson(lesson.id)}
                          className={cn(
                            "w-full flex items-center gap-2 p-2 rounded-lg text-left text-xs transition-colors",
                            isDark ? "hover:bg-white/5" : "hover:bg-gray-50",
                            textSecondary
                          )}
                        >
                          <BookMarked className="w-3.5 h-3.5 shrink-0 text-blue-400" />
                          <span className="flex-1">{lesson.title}</span>
                          <span>{lesson.estimatedDurationMinutes}min</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Quiz button */}
                  {isEnrolled && mod.quiz && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2 text-xs"
                      onClick={() => onOpenQuiz(mod.id)}
                    >
                      <ClipboardCheck className="w-3 h-3 mr-1" />
                      Take Quiz ({mod.quiz.passingScore}% to pass)
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function DetailSkeleton({ cardBg }: any) {
  return (
    <div className="space-y-4">
      <Card className={cn("border", cardBg)}>
        <CardContent className="p-6 space-y-3">
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-10 w-32" />
        </CardContent>
      </Card>
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i} className={cn("border", cardBg)}>
          <CardContent className="p-4 space-y-2">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-3 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ══════════════════════════════════════════════════
// Lesson View
// ══════════════════════════════════════════════════
function LessonView({ lesson, isLoading, onComplete, isDark, cardBg, textPrimary, textSecondary }: any) {
  if (isLoading) return <Card className={cn("border", cardBg)}><CardContent className="p-6"><Skeleton className="h-40 w-full" /></CardContent></Card>;
  if (!lesson) return <div className={cn("text-center py-12", textSecondary)}>Lesson not found.</div>;

  return (
    <Card className={cn("border", cardBg)}>
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className={cn("text-lg font-bold", textPrimary)}>{lesson.title}</h2>
          <Badge variant="outline" className="capitalize text-xs">{lesson.lessonType}</Badge>
        </div>
        <div className={cn("flex items-center gap-3 text-xs", textSecondary)}>
          <span><Clock className="w-3 h-3 inline mr-1" />{lesson.estimatedDurationMinutes} min</span>
        </div>

        {/* Lesson HTML Content */}
        <div
          className={cn(
            "prose max-w-none",
            isDark ? "prose-invert prose-headings:text-white prose-p:text-gray-300 prose-li:text-gray-300 prose-strong:text-white" : ""
          )}
          dangerouslySetInnerHTML={{ __html: lesson.contentHtml || "<p>No content available.</p>" }}
        />

        <div className="flex justify-end pt-4">
          <Button
            className="bg-gradient-to-r from-emerald-500 to-green-600 text-white"
            onClick={() => onComplete(lesson.id)}
          >
            <CheckCircle className="w-4 h-4 mr-2" /> Mark Complete
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ══════════════════════════════════════════════════
// Quiz View
// ══════════════════════════════════════════════════
function QuizView({ quiz, isLoading, onSubmit, submitting, result, onBack, isDark, cardBg, textPrimary, textSecondary }: any) {
  const [answers, setAnswers] = useState<Record<number, string>>({});

  if (isLoading) return <Card className={cn("border", cardBg)}><CardContent className="p-6"><Skeleton className="h-40 w-full" /></CardContent></Card>;
  if (!quiz) return <div className={cn("text-center py-12", textSecondary)}>Quiz not found.</div>;

  // Show results
  if (result) {
    return (
      <Card className={cn("border", cardBg)}>
        <CardContent className="p-6 space-y-6">
          <div className="text-center space-y-3">
            {result.passed ? (
              <>
                <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <Trophy className="w-8 h-8 text-emerald-400" />
                </div>
                <h2 className={cn("text-2xl font-bold", "text-emerald-400")}>Passed!</h2>
              </>
            ) : (
              <>
                <div className="w-16 h-16 mx-auto rounded-full bg-red-500/20 flex items-center justify-center">
                  <X className="w-8 h-8 text-red-400" />
                </div>
                <h2 className={cn("text-2xl font-bold", "text-red-400")}>Not Passed</h2>
              </>
            )}
            <p className={textSecondary}>
              Score: <span className={cn("font-bold text-lg", textPrimary)}>{result.score}%</span> (Need {result.passingScore}%)
            </p>
            <p className={textSecondary}>
              {result.correctCount} of {result.totalQuestions} correct
            </p>
          </div>

          {/* Question Results */}
          <div className="space-y-3">
            {result.results?.map((r: any, i: number) => {
              const question = quiz.questions?.find((q: any) => q.id === r.questionId);
              return (
                <div key={i} className={cn("p-3 rounded-lg border", r.correct ? "border-emerald-500/30 bg-emerald-500/5" : "border-red-500/30 bg-red-500/5")}>
                  <div className="flex items-start gap-2">
                    {r.correct ? <Check className="w-4 h-4 text-emerald-400 mt-0.5" /> : <X className="w-4 h-4 text-red-400 mt-0.5" />}
                    <div>
                      <p className={cn("text-sm font-medium", textPrimary)}>{question?.questionText || `Question ${i + 1}`}</p>
                      {r.explanation && <p className={cn("text-xs mt-1", textSecondary)}>{r.explanation}</p>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-center gap-3">
            <Button variant="outline" onClick={onBack}>Back to Course</Button>
            {!result.passed && (
              <Button className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white" onClick={() => {
                setAnswers({});
                onSubmit(null, null); // Reset by calling with null
              }}>
                Retry Quiz
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleSubmit = () => {
    const answerArray = Object.entries(answers).map(([qId, answer]) => ({
      questionId: Number(qId),
      answer,
    }));
    onSubmit(quiz.id, answerArray);
  };

  const allAnswered = quiz.questions?.length > 0 && Object.keys(answers).length >= quiz.questions.length;

  return (
    <Card className={cn("border", cardBg)}>
      <CardContent className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className={cn("text-lg font-bold", textPrimary)}>{quiz.title}</h2>
            <p className={cn("text-xs", textSecondary)}>
              {quiz.questions?.length || 0} questions · {quiz.passingScore}% to pass
              {quiz.timeLimitMinutes && ` · ${quiz.timeLimitMinutes} min time limit`}
            </p>
          </div>
          <Badge variant="outline">{Object.keys(answers).length}/{quiz.questions?.length || 0} answered</Badge>
        </div>

        {/* Questions */}
        {(quiz.questions || []).map((q: any, qi: number) => (
          <div key={q.id} className={cn("p-4 rounded-lg border", isDark ? "border-white/5 bg-white/[0.02]" : "border-gray-100 bg-gray-50/50")}>
            <p className={cn("text-sm font-medium mb-3", textPrimary)}>
              <span className="text-blue-400 mr-2">Q{qi + 1}.</span>
              {q.questionText}
            </p>
            <div className="space-y-2">
              {(q.options || []).map((opt: any) => (
                <button
                  key={opt.id}
                  onClick={() => setAnswers((prev: Record<number, string>) => ({ ...prev, [q.id]: opt.id }))}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 rounded-lg border text-left text-sm transition-all",
                    answers[q.id] === opt.id
                      ? "border-blue-500 bg-blue-500/10 text-blue-400"
                      : isDark
                        ? "border-white/5 hover:border-white/10 text-gray-300"
                        : "border-gray-200 hover:border-gray-300 text-gray-700"
                  )}
                >
                  <div className={cn(
                    "w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold shrink-0",
                    answers[q.id] === opt.id ? "border-blue-500 bg-blue-500 text-white" : isDark ? "border-white/20" : "border-gray-300"
                  )}>
                    {opt.id}
                  </div>
                  <span>{opt.text}</span>
                </button>
              ))}
            </div>
          </div>
        ))}

        <div className="flex justify-end">
          <Button
            className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white"
            onClick={handleSubmit}
            disabled={!allAnswered || submitting}
          >
            {submitting ? "Grading..." : "Submit Quiz"} <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ══════════════════════════════════════════════════
// Enrollments List
// ══════════════════════════════════════════════════
function EnrollmentsList({ enrollments, isLoading, onOpenCourse, isDark, cardBg, textPrimary, textSecondary }: any) {
  if (isLoading) return <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Card key={i} className={cn("border", cardBg)}><CardContent className="p-4"><Skeleton className="h-16 w-full" /></CardContent></Card>)}</div>;

  if (enrollments.length === 0) {
    return (
      <div className={cn("text-center py-16", textSecondary)}>
        <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-20" />
        <h3 className={cn("text-lg font-medium mb-1", textPrimary)}>No Enrollments Yet</h3>
        <p className="text-sm">Browse the course catalog to get started.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {enrollments.map((e: any) => {
        const enrollment = e.enrollment;
        const statusColor = enrollment.status === "completed" ? "text-emerald-400" : enrollment.status === "in_progress" ? "text-blue-400" : "text-gray-400";
        return (
          <Card
            key={enrollment.id}
            className={cn("border cursor-pointer transition-all hover:shadow-md", cardBg)}
            onClick={() => onOpenCourse(enrollment.courseId)}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="flex-1 space-y-1">
                  <h3 className={cn("font-medium text-sm", textPrimary)}>{e.courseTitle}</h3>
                  <p className={cn("text-xs", textSecondary)}>{e.courseDescription?.substring(0, 100)}...</p>
                  <div className="flex items-center gap-3 text-xs">
                    <Badge variant="outline" className="capitalize text-[10px]">{e.courseCategory}</Badge>
                    <span className={textSecondary}>{e.courseModuleCount} modules</span>
                    <span className={cn("font-medium capitalize", statusColor)}>{enrollment.status.replace("_", " ")}</span>
                  </div>
                </div>
                <div className="text-right space-y-1">
                  <div className={cn("text-lg font-bold", textPrimary)}>{enrollment.progressPercentage}%</div>
                  <div className={cn("w-20 h-1.5 rounded-full", isDark ? "bg-white/10" : "bg-gray-200")}>
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500"
                      style={{ width: `${enrollment.progressPercentage}%` }}
                    />
                  </div>
                </div>
                <ChevronRight className={cn("w-5 h-5 shrink-0", textSecondary)} />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

// ══════════════════════════════════════════════════
// Certificates List
// ══════════════════════════════════════════════════
function CertificatesList({ certificates, isLoading, isDark, cardBg, textPrimary, textSecondary }: any) {
  if (isLoading) return <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Card key={i} className={cn("border", cardBg)}><CardContent className="p-4"><Skeleton className="h-16 w-full" /></CardContent></Card>)}</div>;

  if (certificates.length === 0) {
    return (
      <div className={cn("text-center py-16", textSecondary)}>
        <Award className="w-16 h-16 mx-auto mb-4 opacity-20" />
        <h3 className={cn("text-lg font-medium mb-1", textPrimary)}>No Certificates Yet</h3>
        <p className="text-sm">Complete a course to earn your first certificate.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {certificates.map((c: any) => {
        const cert = c.certificate;
        const isActive = cert.status === "active";
        const isExpired = cert.expiresAt && new Date(cert.expiresAt) < new Date();

        return (
          <Card key={cert.id} className={cn("border", cardBg)}>
            <CardContent className="p-5 space-y-3">
              <div className="flex items-start justify-between">
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", isActive && !isExpired ? "bg-emerald-500/10" : "bg-red-500/10")}>
                  <Award className={cn("w-5 h-5", isActive && !isExpired ? "text-emerald-400" : "text-red-400")} />
                </div>
                <Badge className={cn(isActive && !isExpired ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400")}>
                  {isExpired ? "Expired" : isActive ? "Active" : cert.status}
                </Badge>
              </div>
              <h3 className={cn("font-semibold text-sm", textPrimary)}>{c.courseTitle}</h3>
              <div className={cn("text-xs space-y-1", textSecondary)}>
                <p>Certificate: <span className={textPrimary}>{cert.certificateNumber}</span></p>
                <p>Issued: <span className={textPrimary}>{cert.issuedAt ? new Date(cert.issuedAt).toLocaleDateString() : "N/A"}</span></p>
                <p>Expires: <span className={cn(isExpired ? "text-red-400" : textPrimary)}>{cert.expiresAt ? new Date(cert.expiresAt).toLocaleDateString() : "Never"}</span></p>
              </div>
              <Badge variant="outline" className="capitalize text-[10px]">{c.courseCategory}</Badge>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
