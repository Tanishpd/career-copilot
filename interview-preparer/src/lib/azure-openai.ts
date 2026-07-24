// =========================================================================
// AI Tech Interview - Gemini AI Client
// =========================================================================

import { GoogleGenerativeAI } from '@google/generative-ai';
import type {
  AIQuestionGenerationResponse,
  AIEvaluationResponse,
  AITopicExtractionResponse,
} from '@/types/api';
import type {
  SeniorityLevel,
  InterviewQuestion,
  EvaluationScores,
} from '@/types/interview';
import {
  getQuestionGenerationPrompt,
  getEvaluationPrompt,
  getTopicExtractionPrompt,
  DEFAULT_QUESTION_CONFIG,
  type QuestionGenerationConfig,
} from './prompts';

// =========================================================================
// Environment Validation
// =========================================================================

function getEnvVar(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

// =========================================================================
// Gemini Client Singleton
// =========================================================================

let geminiClient: GoogleGenerativeAI | null = null;

function getGeminiClient(): GoogleGenerativeAI {
  if (!geminiClient) {
    geminiClient = new GoogleGenerativeAI(getEnvVar('GEMINI_API_KEY'));
  }
  return geminiClient;
}

function getModelName(): string {
  return process.env.GEMINI_MODEL || 'models/gemini-2.5-flash';
}

// =========================================================================
// Topic Extraction
// =========================================================================

/**
 * Extract key topics from a job description
 */
export async function extractTopicsFromJobDescription(
  roleTitle: string,
  jobDescription: string
): Promise<AITopicExtractionResponse> {
  const client = getGeminiClient();
  const modelName = getModelName();
  const model = client.getGenerativeModel({ model: modelName });

  const systemPrompt = getTopicExtractionPrompt();

  const prompt = `${systemPrompt}

Role Title: ${roleTitle}

Job Description:
${jobDescription}

Extract the key technical and soft skill topics from this job description that should be covered in an interview.

Respond with a valid JSON object only, no markdown formatting.`;

  const result = await model.generateContent(prompt);
  const response = result.response;
  const content = response.text();
  
  if (!content) {
    throw new Error('No response content from Gemini');
  }

  try {
    // Remove markdown code blocks if present
    const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleanContent) as AITopicExtractionResponse;
    
    // Validate response structure
    if (!parsed.topics || !Array.isArray(parsed.topics) || parsed.topics.length === 0) {
      throw new Error('Invalid response structure: missing or empty topics array');
    }

    return parsed;
  } catch (error) {
    console.error('Failed to parse topic extraction response:', content);
    throw new Error(`Failed to parse topic extraction response: ${error}`);
  }
}

// =========================================================================
// Question Generation (Topic-Based)
// =========================================================================

/**
 * Generate interview questions based on role, job description, and extracted topics
 */
export async function generateInterviewQuestions(
  roleTitle: string,
  jobDescription: string,
  seniorityLevel: SeniorityLevel,
  topics?: AITopicExtractionResponse['topics'],
  config: QuestionGenerationConfig = DEFAULT_QUESTION_CONFIG
): Promise<AIQuestionGenerationResponse> {
  const client = getGeminiClient();
  const modelName = getModelName();
  const model = client.getGenerativeModel({ model: modelName });

  // If topics not provided, extract them first
  const extractedTopics = topics ?? (await extractTopicsFromJobDescription(roleTitle, jobDescription)).topics;

  // Calculate target question count based on topics
  const minQuestions = Math.max(
    config.minTotalQuestions,
    extractedTopics.length * config.minQuestionsPerTopic
  );
  const targetQuestions = Math.min(minQuestions, config.maxTotalQuestions);

  const systemPrompt = getQuestionGenerationPrompt(seniorityLevel, {
    ...config,
    minTotalQuestions: targetQuestions,
  });

  const topicsText = extractedTopics
    .map((t, i) => `${i + 1}. ${t.name} (Priority: ${t.priority}) - ${t.description}`)
    .join('\n');

  const prompt = `${systemPrompt}

Role Title: ${roleTitle}

Job Description:
${jobDescription}

## EXTRACTED TOPICS TO COVER

${topicsText}

## REQUIREMENTS

Generate between ${targetQuestions} and ${config.maxTotalQuestions} interview questions.
Each topic MUST have at least ${config.minQuestionsPerTopic} questions.
Follow the seniority distribution rules for a ${seniorityLevel}-level candidate.
Higher priority topics (1) should have more questions than lower priority topics (3).

Respond with a valid JSON object only, no markdown formatting.`;

  const result = await model.generateContent(prompt);
  const response = result.response;
  const content = response.text();
  
  if (!content) {
    throw new Error('No response content from Gemini');
  }

  try {
    // Remove markdown code blocks if present
    const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleanContent) as AIQuestionGenerationResponse;
    
    // Validate response structure
    if (!parsed.questions || !Array.isArray(parsed.questions)) {
      throw new Error('Invalid response structure: missing questions array');
    }

    // Validate minimum questions per topic
    const questionsByTopic = new Map<string, number>();
    for (const q of parsed.questions) {
      const topicName = q.topicName || 'general';
      questionsByTopic.set(topicName, (questionsByTopic.get(topicName) || 0) + 1);
    }

    // Log coverage for debugging
    console.log('Question distribution by topic:', Object.fromEntries(questionsByTopic));

    return {
      ...parsed,
      topics: extractedTopics,
    };
  } catch (error) {
    console.error('Failed to parse Gemini response:', content);
    throw new Error(`Failed to parse question generation response: ${error}`);
  }
}

// =========================================================================
// Response Evaluation
// =========================================================================

/**
 * Minimal question data needed for evaluation
 */
export interface EvaluationQuestionInput {
  question: string;
  category: 'technical' | 'system-design' | 'behavioral' | 'problem-solving';
  difficulty: 'junior' | 'mid' | 'senior';
  expectedTopics: string[];
}

/**
 * Evaluate a candidate's response to a question
 */
export async function evaluateResponse(
  question: EvaluationQuestionInput,
  transcription: string,
  roleTitle: string,
  seniorityLevel: SeniorityLevel
): Promise<AIEvaluationResponse> {
  const client = getGeminiClient();
  const modelName = getModelName();
  const model = client.getGenerativeModel({ model: modelName });

  const systemPrompt = getEvaluationPrompt();

  const prompt = `${systemPrompt}

CONTEXT:
- Role: ${roleTitle}
- Expected Seniority: ${seniorityLevel}
- Question Category: ${question.category}
- Question Difficulty: ${question.difficulty}

QUESTION:
${question.question}

EXPECTED TOPICS:
${question.expectedTopics.join(', ')}

CANDIDATE RESPONSE (Transcribed from speech):
${transcription}

Evaluate this response according to the scoring criteria.

Respond with a valid JSON object only, no markdown formatting.`;

  const result = await model.generateContent(prompt);
  const response = result.response;
  const content = response.text();
  
  if (!content) {
    throw new Error('No response content from Gemini');
  }

  try {
    // Remove markdown code blocks if present
    const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleanContent) as AIEvaluationResponse;
    
    // Validate response structure
    if (!parsed.scores || typeof parsed.overallScore !== 'number' || !parsed.feedback) {
      throw new Error('Invalid evaluation response structure');
    }

    // Validate score ranges
    validateScores(parsed.scores);

    return parsed;
  } catch (error) {
    console.error('Failed to parse evaluation response:', content);
    throw new Error(`Failed to parse evaluation response: ${error}`);
  }
}

// =========================================================================
// Helpers
// =========================================================================

/**
 * Validate that all scores are within valid range (0-100)
 */
function validateScores(scores: EvaluationScores): void {
  const scoreFields: (keyof EvaluationScores)[] = [
    'relevance',
    'technicalAccuracy',
    'clarity',
    'depth',
    'structure',
    'confidence',
  ];

  for (const field of scoreFields) {
    const score = scores[field];
    if (typeof score !== 'number' || score < 0 || score > 100) {
      throw new Error(`Invalid score for ${field}: ${score}`);
    }
  }
}

/**
 * Extract seniority level from role title
 */
export function extractSeniorityFromRole(roleTitle: string): SeniorityLevel {
  const lowerTitle = roleTitle.toLowerCase();
  
  // Check for senior indicators
  if (
    lowerTitle.includes('senior') ||
    lowerTitle.includes('sr.') ||
    lowerTitle.includes('sr ') ||
    lowerTitle.includes('lead') ||
    lowerTitle.includes('principal') ||
    lowerTitle.includes('staff') ||
    lowerTitle.includes('architect')
  ) {
    return 'senior';
  }
  
  // Check for junior indicators
  if (
    lowerTitle.includes('junior') ||
    lowerTitle.includes('jr.') ||
    lowerTitle.includes('jr ') ||
    lowerTitle.includes('entry') ||
    lowerTitle.includes('associate') ||
    lowerTitle.includes('trainee') ||
    lowerTitle.includes('intern')
  ) {
    return 'junior';
  }
  
  // Default to mid-level
  return 'mid';
}
