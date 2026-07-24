// =========================================================================
// AI Tech Interview - API Types
// Request/Response types for API routes and Server Actions
// =========================================================================

import type {
  InterviewSession,
  InterviewQuestion,
  QuestionResponse,
  ResponseEvaluation,
  SessionResults,
  CreateSessionInput,
  EvaluationScores,
  EvaluationFeedback,
  QuestionCategory,
  QuestionDifficulty,
} from './interview';

// =========================================================================
// API Response Wrapper
// =========================================================================

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
}

/**
 * API error structure
 */
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

// =========================================================================
// Session API Types
// =========================================================================

export interface CreateSessionRequest extends CreateSessionInput {}

export interface CreateSessionResponse {
  session: InterviewSession;
}

export interface GetSessionResponse {
  session: InterviewSession;
  questions: InterviewQuestion[];
  currentQuestionIndex: number;
}

// =========================================================================
// Questions API Types
// =========================================================================

/**
 * Request to generate questions for a session
 */
export interface GenerateQuestionsRequest {
  sessionId: string;
}

/**
 * Response from question generation
 */
export interface GenerateQuestionsResponse {
  questions: InterviewQuestion[];
}

/**
 * Raw question from Azure OpenAI (before processing)
 */
export interface GeneratedQuestionRaw {
  question: string;
  category: QuestionCategory;
  difficulty: QuestionDifficulty;
  expectedTopics: string[];
  timeLimitSeconds: number;
  topicName?: string; // The topic this question covers
}

/**
 * Extracted topic from job description
 */
export interface ExtractedTopic {
  name: string;
  description: string;
  priority: number;
  category: 'technical' | 'system-design' | 'domain' | 'soft-skills' | 'methodology';
  keywords: string[];
}

/**
 * Azure OpenAI topic extraction response
 */
export interface AITopicExtractionResponse {
  topics: ExtractedTopic[];
}

/**
 * Azure OpenAI question generation response
 */
export interface AIQuestionGenerationResponse {
  questions: GeneratedQuestionRaw[];
  topics?: ExtractedTopic[]; // Included for reference
}

// =========================================================================
// Speech API Types
// =========================================================================

/**
 * Response from speech token endpoint
 */
export interface SpeechTokenResponse {
  token: string;
  region: string;
  expiresAt: string;
}

// =========================================================================
// Evaluation API Types
// =========================================================================

/**
 * Request to evaluate a single response
 */
export interface EvaluateResponseRequest {
  responseId: string;
  questionId: string;
  sessionId: string;
  transcription: string;
}

/**
 * Response from single evaluation
 */
export interface EvaluateResponseResponse {
  evaluationId: string;
  scores: EvaluationScores;
  overallScore: number;
  feedback: EvaluationFeedback;
}

/**
 * Request to evaluate all responses in a session
 */
export interface EvaluateSessionRequest {
  sessionId: string;
}

/**
 * Response from session evaluation
 */
export interface EvaluateSessionResponse {
  evaluations: ResponseEvaluation[];
  summary: SessionResults['summary'];
}

/**
 * Raw evaluation from Azure OpenAI
 */
export interface AIEvaluationResponse {
  scores: EvaluationScores;
  overallScore: number;
  feedback: EvaluationFeedback;
}

// =========================================================================
// Response Submission Types
// =========================================================================

/**
 * Request to save a response
 */
export interface SaveResponseRequest {
  questionId: string;
  sessionId: string;
  transcription: string;
  durationSeconds: number;
  audioBlob?: Blob;
}

/**
 * Response from saving a response
 */
export interface SaveResponseResponse {
  response: QuestionResponse;
}

// =========================================================================
// Results API Types
// =========================================================================

/**
 * Request to get session results
 */
export interface GetResultsRequest {
  sessionId: string;
}

/**
 * Response with full session results
 */
export interface GetResultsResponse extends SessionResults {}
