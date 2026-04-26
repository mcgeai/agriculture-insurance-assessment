export interface User {
  id: number;
  employee_no: string;
  name: string;
  department: string;
  role: 'employee' | 'admin';
}

export interface Question {
  id: number;
  dimension: string;
  content: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
}

export interface QuizStartResponse {
  assessment_id: number;
  time_limit: number;
  questions: Question[];
}

export interface DimensionScore {
  dimension: string;
  label: string;
  score: number;
  correct_count: number;
  total_count: number;
  rating: string;
  suggestion: string;
}

export interface AssessmentReport {
  user: { name: string; employee_no: string; department: string };
  assessment: {
    id: number;
    total_score: number;
    rating: string;
    started_at: string;
    submitted_at: string;
  };
  dimension_scores: DimensionScore[];
  answers: any[];
}

export interface AssessmentHistory {
  id: number;
  total_score: number;
  rating: string;
  started_at: string;
  submitted_at: string;
  dimension_scores: { dimension: string; score: number; correct_count: number }[];
}

export interface SubmitResult {
  total_score: number;
  rating: string;
  dimension_scores: Record<string, { score: number; correct_count: number }>;
}

export const DIMENSION_LABELS: Record<string, string> = {
  D1: '农业保险专业知识',
  D2: '系统操作能力',
  D3: '问题解决与沟通协调',
  D4: '合规与风险意识',
};

export const DIMENSION_ICONS: Record<string, string> = {
  D1: '📖',
  D2: '💻',
  D3: '🤝',
  D4: '🛡️',
};

export const RATING_COLORS: Record<string, string> = {
  A: '#52c41a',
  B: '#1890ff',
  C: '#faad14',
  D: '#ff4d4f',
};

export const RATING_LABELS: Record<string, string> = {
  A: '卓越',
  B: '熟练',
  C: '合格',
  D: '待提升',
};
