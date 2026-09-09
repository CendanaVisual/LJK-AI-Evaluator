export type QuestionType =
  | 'single_choice'
  | 'multi_choice'
  | 'true_false'
  | 'matching'
  | 'short_answer';

export interface Question {
  id?: number;
  exam_id?: number;
  question_number: number;
  question_type: QuestionType;
  question_text: string;
  answer_key: any; // e.g. "C", ["A","C"], "B", {"1":"C","2":"A"}, { accepted_answers: string[], keywords: string[], max_score: number }
  weight: number;
  options?: string[];
}

export interface Exam {
  id: number;
  title: string;
  code: string;
  subject: string;
  class_name: string;
  academic_year: string;
  total_questions: number;
  passing_score: number;
  description?: string;
  created_at?: string;
  question_count?: number;
  total_submissions?: number;
}

export interface QuestionEvaluationDetail {
  questionNumber: number;
  questionType: QuestionType;
  questionText: string;
  studentAnswer: any;
  correctAnswerKey: any;
  isCorrect: boolean;
  scoreEarned: number;
  maxScore: number;
  aiFeedback?: string;
  confidence: number;
}

export interface ExamResult {
  id: number;
  exam_id: number;
  exam_title?: string;
  exam_code?: string;
  student_name: string;
  student_id_number: string;
  class_name: string;
  total_score: number;
  max_possible_score: number;
  percentage: number;
  status: 'Lulus' | 'Remedial';
  omr_confidence: number;
  created_at: string;
  raw_details?: {
    details?: QuestionEvaluationDetail[];
    notes?: string;
    sample?: boolean;
    timestamp?: string;
  };
}

export type ActiveTab = 'generator' | 'scanner' | 'dashboard' | 'docs';
