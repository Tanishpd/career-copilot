// =========================================================================
// AI Tech Interview - Batch Evaluate API Route
// POST: Evaluate all responses for a session
// =========================================================================

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { evaluateResponse } from '@/lib/azure-openai';
import type { ApiResponse } from '@/types/api';
import type { SeniorityLevel } from '@/types/interview';

/**
 * Get performance band based on score
 */
function getPerformanceBand(score: number): string {
  if (score >= 90) return 'excellent';
  if (score >= 75) return 'good';
  if (score >= 60) return 'satisfactory';
  if (score >= 40) return 'needs-work';
  return 'poor';
}

interface BatchEvaluationResponse {
  sessionId: string;
  totalResponses: number;
  evaluatedResponses: number;
  averageScore: number;
  performanceBand: string;
  evaluations: Array<{
    responseId: string;
    questionId: string;
    questionNumber: number;
    overallScore: number;
    performanceBand: string;
  }>;
}

/**
 * POST /api/evaluate/batch
 * Evaluate all responses for a session
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<BatchEvaluationResponse>>> {
  try {
    const body = await request.json();
    const { sessionId } = body as { sessionId: string };

    if (!sessionId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_REQUEST',
            message: 'Session ID is required',
          },
        },
        { status: 400 }
      );
    }

    // Fetch session with questions and responses
    const session = await prisma.interviewSession.findUnique({
      where: { id: sessionId },
      include: {
        questions: {
          include: {
            topic: true,
            responses: {
              include: {
                evaluation: true,
              },
            },
          },
          orderBy: { questionNumber: 'asc' },
        },
      },
    });

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'SESSION_NOT_FOUND',
            message: 'Session not found',
          },
        },
        { status: 404 }
      );
    }

    console.log(`Processing batch evaluation for session ${sessionId}`);

    const evaluations = [];
    let totalScore = 0;
    let evaluatedCount = 0;

    // Evaluate each response
    for (const question of session.questions) {
      const response = question.responses[0]; // Get the first (and should be only) response

      if (!response) {
        console.log(`No response for question ${question.id}, skipping`);
        continue;
      }

      let evaluation = response.evaluation;

      // If evaluation doesn't exist, create it
      if (!evaluation) {
        console.log(`Evaluating response ${response.id} for question ${question.questionNumber}`);

        try {
          // Call Azure OpenAI to evaluate the response
          const aiEvaluation = await evaluateResponse(
            {
              question: question.question,
              category: question.category as 'technical' | 'system-design' | 'behavioral' | 'problem-solving',
              difficulty: question.difficulty as 'junior' | 'mid' | 'senior',
              expectedTopics: JSON.parse(question.expectedTopics || '[]'), // Parse JSON string back to array
            },
            response.transcription || '',
            session.roleTitle,
            session.seniorityLevel as SeniorityLevel
          );

          // Save evaluation to database
          evaluation = await prisma.responseEvaluation.create({
            data: {
              responseId: response.id,
              questionId: question.id,
              sessionId: session.id,
              relevanceScore: aiEvaluation.scores.relevance,
              technicalAccuracyScore: aiEvaluation.scores.technicalAccuracy,
              clarityScore: aiEvaluation.scores.clarity,
              depthScore: aiEvaluation.scores.depth,
              structureScore: aiEvaluation.scores.structure,
              confidenceScore: aiEvaluation.scores.confidence,
              overallScore: aiEvaluation.overallScore,
              performanceBand: getPerformanceBand(aiEvaluation.overallScore),
              strengths: JSON.stringify(aiEvaluation.feedback.strengths), // Store as JSON string for SQLite
              improvements: JSON.stringify(aiEvaluation.feedback.improvements), // Store as JSON string for SQLite
              suggestion: aiEvaluation.feedback.suggestion,
            },
          });

          console.log(`Evaluation saved for response ${response.id}: ${evaluation.overallScore}%`);
        } catch (error) {
          console.error(`Failed to evaluate response ${response.id}:`, error);
          continue;
        }
      } else {
        console.log(`Using cached evaluation for response ${response.id}`);
      }

      evaluations.push({
        responseId: response.id,
        questionId: question.id,
        questionNumber: question.questionNumber,
        overallScore: evaluation.overallScore,
        performanceBand: evaluation.performanceBand,
      });

      totalScore += evaluation.overallScore;
      evaluatedCount++;
    }

    const averageScore = evaluatedCount > 0 ? Math.round(totalScore / evaluatedCount) : 0;

    // Update session status to completed
    await prisma.interviewSession.update({
      where: { id: sessionId },
      data: { status: 'completed' },
    });

    console.log(`Batch evaluation complete: ${evaluatedCount} responses, average score: ${averageScore}%`);

    return NextResponse.json({
      success: true,
      data: {
        sessionId,
        totalResponses: session.questions.length,
        evaluatedResponses: evaluatedCount,
        averageScore,
        performanceBand: getPerformanceBand(averageScore),
        evaluations,
      },
    });
  } catch (error) {
    console.error('Error in batch evaluation:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to evaluate responses',
        },
      },
      { status: 500 }
    );
  }
}
