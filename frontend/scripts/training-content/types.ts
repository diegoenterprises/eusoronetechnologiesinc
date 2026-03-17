export interface ModuleDef {
  title: string;
  description: string;
  orderIndex: number;
  contentType: "text" | "video" | "interactive" | "quiz" | "case_study";
  estimatedDurationMinutes: number;
  lessons: LessonDef[];
  quiz: QuizDef;
}

export interface LessonDef {
  title: string;
  contentHtml: string;
  orderIndex: number;
  lessonType: "reading" | "video" | "interactive" | "case_study";
  estimatedDurationMinutes: number;
  keyRegulations?: Array<{ code: string; title: string; jurisdiction: string; summary: string }>;
}

export interface QuizDef {
  title: string;
  description: string;
  questions: QuestionDef[];
}

export interface QuestionDef {
  questionText: string;
  questionType: "multiple_choice" | "true_false" | "scenario";
  options: Array<{ id: string; text: string; isCorrect: boolean }>;
  correctAnswer: string;
  explanation: string;
  difficulty: "easy" | "medium" | "hard";
  regulationReference: string;
}
