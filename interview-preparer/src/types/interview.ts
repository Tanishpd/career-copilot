// =========================================================================
// AI Tech Interview - Core TypeScript Types
// =========================================================================

// =========================================================================
// Session Types
// =========================================================================

/**
 * Seniority level extracted from role title
 */
export type SeniorityLevel = 'junior' | 'mid' | 'senior';

/**
 * Interview session status
 */
export type SessionStatus = 'created' | 'in-progress' | 'completed' | 'cancelled';

/**
 * Interview session representing a practice interview
 */
export interface InterviewSession {
  id: string;
  roleTitle: string;
  companyName?: string;
  jobDescription: string;
  seniorityLevel: SeniorityLevel;
  status: SessionStatus;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

/**
 * Input for creating a new interview session
 */
export interface CreateSessionInput {
  roleTitle: string;
  companyName?: string;
  jobDescription: string;
}

// =========================================================================
// Question Types
// =========================================================================

/**
 * Question category determining response time and evaluation focus
 */
export type QuestionCategory = 'technical' | 'system-design' | 'behavioral' | 'problem-solving';

/**
 * Question difficulty level
 */
export type QuestionDifficulty = 'junior' | 'mid' | 'senior';

/**
 * Generated interview question
 */
export interface InterviewQuestion {
  id: string;
  sessionId: string;
  topicId?: string;
  topicName?: string;
  questionNumber: number;
  question: string;
  category: QuestionCategory;
  difficulty: QuestionDifficulty;
  expectedTopics: string[];
  timeLimitSeconds: number;
  timeLimit: number; // Alias for timeLimitSeconds (used in UI)
  createdAt: string;
}

/**
 * Response time limits by category (in seconds)
 */
export const QUESTION_TIME_LIMITS: Record<QuestionCategory, { min: number; max: number; default: number }> = {
  'technical': { min: 45, max: 120, default: 90 },
  'system-design': { min: 120, max: 300, default: 180 },
  'behavioral': { min: 60, max: 180, default: 120 },
  'problem-solving': { min: 90, max: 240, default: 150 },
};

// =========================================================================
// Response Types
// =========================================================================

/**
 * Response status
 */
export type ResponseStatus = 'pending' | 'recording' | 'transcribing' | 'completed' | 'skipped';

/**
 * User's response to a question
 */
export interface QuestionResponse {
  id: string;
  questionId: string;
  sessionId: string;
  status: ResponseStatus;
  audioUrl?: string;
  transcription?: string;
  durationSeconds?: number;
  startedAt?: string;
  completedAt?: string;
}

// =========================================================================
// Evaluation Types
// =========================================================================

/**
 * Individual scoring criteria
 */
export interface EvaluationScores {
  /** How well the answer addresses the question (25%) */
  relevance: number;
  /** Correctness of technical concepts (25%) */
  technicalAccuracy: number;
  /** Clear, concise communication (20%) */
  clarity: number;
  /** Level of detail and thoroughness (15%) */
  depth: number;
  /** Logical organization of response (10%) */
  structure: number;
  /** Speech fluency, minimal filler words (5%) */
  confidence: number;
}

/**
 * Feedback details for a response
 */
export interface EvaluationFeedback {
  strengths: string[];
  improvements: string[];
  suggestion: string;
}

/**
 * Complete evaluation for a response
 */
export interface ResponseEvaluation {
  id: string;
  responseId: string;
  questionId: string;
  sessionId: string;
  scores: EvaluationScores;
  overallScore: number;
  feedback: EvaluationFeedback;
  performanceBand: PerformanceBand;
  evaluatedAt: string;
}

/**
 * Performance band based on overall score
 */
export type PerformanceBand = 'excellent' | 'good' | 'satisfactory' | 'needs-work' | 'poor';

/**
 * Performance band thresholds
 */
export const PERFORMANCE_BANDS: Record<PerformanceBand, { min: number; max: number; label: string; emoji: string }> = {
  excellent: { min: 90, max: 100, label: 'Excellent', emoji: '🌟' },
  good: { min: 75, max: 89, label: 'Good', emoji: '✅' },
  satisfactory: { min: 60, max: 74, label: 'Satisfactory', emoji: '⚠️' },
  'needs-work': { min: 40, max: 59, label: 'Needs Work', emoji: '📝' },
  poor: { min: 0, max: 39, label: 'Poor', emoji: '❌' },
};

/**
 * Get performance band from overall score
 */
export function getPerformanceBand(score: number): PerformanceBand {
  if (score >= 90) return 'excellent';
  if (score >= 75) return 'good';
  if (score >= 60) return 'satisfactory';
  if (score >= 40) return 'needs-work';
  return 'poor';
}

// =========================================================================
// Session Results Types
// =========================================================================

/**
 * Complete results for a session
 */
export interface SessionResults {
  session: InterviewSession;
  questions: InterviewQuestion[];
  responses: QuestionResponse[];
  evaluations: ResponseEvaluation[];
  summary: SessionSummary;
}

/**
 * Summary statistics for a session
 */
export interface SessionSummary {
  totalQuestions: number;
  completedQuestions: number;
  skippedQuestions: number;
  averageScore: number;
  performanceBand: PerformanceBand;
  totalDurationSeconds: number;
  scoresByCategory: Record<QuestionCategory, number>;
  strongestAreas: string[];
  areasForImprovement: string[];
}
