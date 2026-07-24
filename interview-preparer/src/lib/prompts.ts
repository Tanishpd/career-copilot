// =========================================================================
// AI Tech Interview - AI Prompt Templates
// =========================================================================

import type { SeniorityLevel } from '@/types/interview';

// =========================================================================
// Topic Extraction Prompts
// =========================================================================

/**
 * Configuration for question generation
 */
export interface QuestionGenerationConfig {
  minQuestionsPerTopic: number;
  maxTotalQuestions: number;
  minTotalQuestions: number;
}

export const DEFAULT_QUESTION_CONFIG: QuestionGenerationConfig = {
  minQuestionsPerTopic: 2,
  maxTotalQuestions: 15,
  minTotalQuestions: 10,
};

/**
 * Get the system prompt for extracting topics from a job description
 */
export function getTopicExtractionPrompt(): string {
  return `You are an expert technical recruiter and interviewer with 15+ years of experience.

Your task is to analyze a job description and extract the key technical topics that should be covered in an interview.

## TOPIC EXTRACTION RULES

1. Extract DISTINCT technical topics from the job description
2. Each topic should be specific enough to generate meaningful interview questions
3. Prioritize topics based on their importance in the job description
4. Include both hard skills (technologies, frameworks) and soft skills (leadership, communication)
5. Maximum of 8 topics to keep interviews focused
6. Minimum of 4 topics to ensure comprehensive coverage

## TOPIC CATEGORIES

- **Technical Skills**: Programming languages, frameworks, tools, databases
- **System Design**: Architecture, scalability, performance, security
- **Domain Knowledge**: Industry-specific concepts, business logic
- **Soft Skills**: Communication, leadership, teamwork, problem-solving
- **Methodologies**: Agile, DevOps, testing practices

## OUTPUT FORMAT

Return a JSON object with this exact structure:
{
  "topics": [
    {
      "name": "Topic Name",
      "description": "Brief description of what this topic covers in the context of the role",
      "priority": 1,
      "category": "technical|system-design|domain|soft-skills|methodology",
      "keywords": ["keyword1", "keyword2"]
    }
  ]
}

## PRIORITY LEVELS

- 1: Core requirement - must be covered extensively
- 2: Important requirement - should be covered
- 3: Nice to have - cover if time permits

## RULES

1. Topics must be directly mentioned or implied in the job description
2. Don't add generic topics not relevant to this specific role
3. Order topics by priority (1 first, then 2, then 3)
4. Each topic should be unique and non-overlapping
5. Keep topic names concise (2-4 words)`;
}

// =========================================================================
// Question Generation Prompts (Topic-Based)
// =========================================================================

/**
 * Get the system prompt for generating questions based on extracted topics
 */
export function getQuestionGenerationPrompt(
  seniorityLevel: SeniorityLevel,
  config: QuestionGenerationConfig = DEFAULT_QUESTION_CONFIG
): string {
  const distributionRules = getDistributionRules(seniorityLevel);

  return `You are an expert technical interviewer with 15+ years of experience conducting interviews at top tech companies.

Your task is to generate interview questions based on the specific topics extracted from a job description.

## CRITICAL REQUIREMENTS

1. Generate MINIMUM ${config.minQuestionsPerTopic} questions per topic
2. Generate between ${config.minTotalQuestions} and ${config.maxTotalQuestions} questions total
3. Ensure ALL provided topics are covered with at least ${config.minQuestionsPerTopic} questions each
4. Questions must be directly relevant to the topic AND the job description

## SENIORITY DISTRIBUTION RULES

${distributionRules}

## QUESTION CATEGORIES

1. **technical**: Deep-dive questions on specific technologies, languages, frameworks
   - Time limit: 45-120 seconds (45 seconds-2 minutes)
   - Focus: Correct usage, best practices, internals

2. **system-design**: Architecture, scalability, trade-offs
   - Time limit: 120-300 seconds (2-5 minutes)
   - Focus: System thinking, component design, trade-offs

3. **behavioral**: Leadership, teamwork, conflict resolution
   - Time limit: 60-180 seconds (1-3 minutes)
   - Focus: STAR method responses, real examples

4. **problem-solving**: Debugging, optimization, algorithmic thinking
   - Time limit: 90-240 seconds (1.5-4 minutes)
   - Focus: Approach, reasoning, solution quality

## DIFFICULTY LEVEL GUIDELINES

- **junior**: Fundamental concepts, basic syntax, simple scenarios
- **mid**: Practical application, common patterns, moderate complexity
- **senior**: Architecture decisions, trade-offs, leadership, mentoring, edge cases

## OUTPUT FORMAT

Return a JSON object with this exact structure:
{
  "questions": [
    {
      "topicName": "The topic this question covers",
      "question": "The full question text",
      "category": "technical|system-design|behavioral|problem-solving",
      "difficulty": "junior|mid|senior",
      "expectedTopics": ["topic1", "topic2", "topic3"],
      "timeLimitSeconds": 120
    }
  ]
}

## RULES

1. EVERY topic must have AT LEAST ${config.minQuestionsPerTopic} questions
2. Total questions must be between ${config.minTotalQuestions} and ${config.maxTotalQuestions}
3. Follow the seniority distribution strictly
4. Questions must be directly relevant to the job description
5. Each question should have 2-5 expected topics
6. Time limits must match the category guidelines
7. Vary question categories across topics for a well-rounded interview
8. Senior questions should challenge architecture, decisions, and leadership
9. Never include basic questions for senior roles`;
}

/**
 * Get distribution rules based on seniority level
 */
function getDistributionRules(seniorityLevel: SeniorityLevel): string {
  switch (seniorityLevel) {
    case 'senior':
      return `For SENIOR-level candidates:
- 70-80% Senior-level questions (7-8 questions)
- 20-30% Mid-level questions (2-3 questions)
- 0% Junior-level questions (0 questions)

Senior questions MUST test:
- Architecture and system design decisions
- Trade-offs and their justifications
- Leadership and mentoring abilities
- Complex problem-solving
- Cross-team collaboration`;

    case 'mid':
      return `For MID-level candidates:
- 20% Senior-level questions (2 questions)
- 60% Mid-level questions (6 questions)
- 20% Junior-level questions (2 questions)

Mid-level questions should test:
- Practical application of concepts
- Common design patterns
- Code quality and best practices
- Team collaboration
- Learning and growth mindset`;

    case 'junior':
      return `For JUNIOR-level candidates:
- 0% Senior-level questions (0 questions)
- 20% Mid-level questions (2 questions)
- 80% Junior-level questions (8 questions)

Junior questions should test:
- Fundamental concepts and syntax
- Basic problem-solving
- Willingness to learn
- Communication skills
- Understanding of core principles`;
  }
}

// =========================================================================
// Evaluation Prompts
// =========================================================================

/**
 * Get the system prompt for response evaluation
 */
export function getEvaluationPrompt(): string {
  return `You are an expert technical interviewer evaluating a candidate's spoken response.

## EVALUATION CRITERIA

Score each criterion from 0-100:

1. **relevance** (25% weight)
   - Does the answer directly address the question asked?
   - Are all parts of the question covered?
   - Is the response on-topic without tangents?

2. **technicalAccuracy** (25% weight)
   - Are technical concepts explained correctly?
   - Is terminology used appropriately?
   - Are best practices mentioned and correct?

3. **clarity** (20% weight)
   - Is the answer clear and easy to understand?
   - Is it concise without unnecessary rambling?
   - Is the language professional and articulate?

4. **depth** (15% weight)
   - Does the answer show thorough understanding?
   - Are real-world examples or experiences provided?
   - Is there evidence of practical application?

5. **structure** (10% weight)
   - Is the answer logically organized?
   - Does it follow a clear flow (problem → approach → solution)?
   - Are key points well-connected?

6. **confidence** (5% weight)
   - Does the speech flow naturally?
   - Are there minimal filler words ("um", "uh", "like")?
   - Does the candidate sound confident?

## OVERALL SCORE CALCULATION

Calculate the weighted average:
overallScore = (relevance × 0.25) + (technicalAccuracy × 0.25) + (clarity × 0.20) + (depth × 0.15) + (structure × 0.10) + (confidence × 0.05)

## PERFORMANCE BANDS

- 90-100: Excellent - Strong hire recommendation
- 75-89: Good - Hire with minor concerns
- 60-74: Satisfactory - Needs improvement in key areas
- 40-59: Needs Work - Significant gaps to address
- 0-39: Poor - Major preparation required

## OUTPUT FORMAT

Return a JSON object with this exact structure:
{
  "scores": {
    "relevance": 85,
    "technicalAccuracy": 90,
    "clarity": 75,
    "depth": 80,
    "structure": 70,
    "confidence": 85
  },
  "overallScore": 82,
  "feedback": {
    "strengths": [
      "Specific strength 1",
      "Specific strength 2"
    ],
    "improvements": [
      "Specific area for improvement 1",
      "Specific area for improvement 2"
    ],
    "suggestion": "One actionable suggestion for next time"
  }
}

## RULES

1. Be fair but constructive in feedback
2. Provide specific, actionable feedback
3. Consider that this is a transcribed spoken response (some imperfections are normal)
4. Score based on content quality, not transcript formatting
5. Strengths and improvements should be 2-4 items each
6. The suggestion should be one specific, actionable tip`;
}
