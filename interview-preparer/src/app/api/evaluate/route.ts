// =========================================================================
// AI Tech Interview - Evaluate API Route
// POST: Evaluate a response using Azure OpenAI (persisted to PostgreSQL)
// GET: Get evaluation for a response
// =========================================================================

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { evaluateResponse } from '@/lib/azure-openai';
import type { ApiResponse, EvaluateResponseRequest, EvaluateResponseResponse } from '@/types/api';
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

/**
 * POST /api/evaluate
 * Evaluate a response using Azure OpenAI and save to database
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<EvaluateResponseResponse>>> {
  try {
    const body = (await request.json()) as EvaluateResponseRequest;

    const { responseId, questionId, transcription, sessionId } = body;

    // Validate required fields
    if (!responseId || !questionId || !transcription || !sessionId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_REQUEST',
            message: 'Missing required fields: responseId, questionId, transcription, sessionId',
          },
        },
        { status: 400 }
      );
    }

    // Fetch session for context
    const session = await prisma.interviewSession.findUnique({
      where: { id: sessionId },
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

    // Fetch question for evaluation context
    const question = await prisma.interviewQuestion.findUnique({
      where: { id: questionId },
      include: { topic: true },
    });

    if (!question) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'QUESTION_NOT_FOUND',
            message: 'Question not found',
          },
        },
        { status: 404 }
      );
    }

    // Check if we already have an evaluation for this response
    const existingEvaluation = await prisma.responseEvaluation.findUnique({
      where: { responseId },
    });

    if (existingEvaluation) {
      console.log(`Evaluation already exists for response ${responseId}, returning cached result`);
      return NextResponse.json({
        success: true,
        data: {
          evaluationId: existingEvaluation.id,
          scores: {
            relevance: existingEvaluation.relevanceScore,
            technicalAccuracy: existingEvaluation.technicalAccuracyScore,
            clarity: existingEvaluation.clarityScore,
            depth: existingEvaluation.depthScore,
            structure: existingEvaluation.structureScore,
            confidence: existingEvaluation.confidenceScore,
          },
          overallScore: existingEvaluation.overallScore,
          feedback: {
            strengths: JSON.parse(existingEvaluation.strengths || '[]'), // Parse JSON string back to array
            improvements: JSON.parse(existingEvaluation.improvements || '[]'), // Parse JSON string back to array
            suggestion: existingEvaluation.suggestion,
          },
        },
      });
    }

    // Convert database question to format expected by evaluateResponse function
    const questionForEval = {
      question: question.question,
      category: question.category as 'technical' | 'system-design' | 'behavioral' | 'problem-solving',
      difficulty: question.difficulty as 'junior' | 'mid' | 'senior',
      expectedTopics: JSON.parse(question.expectedTopics || '[]'), // Parse JSON string back to array
    };

    console.log(`Evaluating response ${responseId} for question ${questionId}...`);

    // Call Azure OpenAI to evaluate the response
    const aiEvaluation = await evaluateResponse(
      questionForEval,
      transcription,
      session.roleTitle,
      session.seniorityLevel as SeniorityLevel
    );

    // Save evaluation to database
    const evaluation = await prisma.responseEvaluation.create({
      data: {
        responseId,
        questionId,
        sessionId,
        relevanceScore: aiEvaluation.scores.relevance,
        technicalAccuracyScore: aiEvaluation.scores.technicalAccuracy,
        clarityScore: aiEvaluation.scores.clarity,
        depthScore: aiEvaluation.scores.depth,
        structureScore: aiEvaluation.scores.structure,
        confidenceScore: aiEvaluation.scores.confidence,
        overallScore: aiEvaluation.overallScore,
        strengths: JSON.stringify(aiEvaluation.feedback.strengths), // Store as JSON string for SQLite
        improvements: JSON.stringify(aiEvaluation.feedback.improvements), // Store as JSON string for SQLite
        suggestion: aiEvaluation.feedback.suggestion,
        performanceBand: getPerformanceBand(aiEvaluation.overallScore),
      },
    });

    console.log(`Saved evaluation ${evaluation.id} with score ${evaluation.overallScore}`);

    return NextResponse.json(
      {
        success: true,
        data: {
          evaluationId: evaluation.id,
          scores: aiEvaluation.scores,
          overallScore: aiEvaluation.overallScore,
          feedback: aiEvaluation.feedback,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error evaluating response:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'EVALUATION_FAILED',
          message: error instanceof Error ? error.message : 'Failed to evaluate response',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/evaluate?responseId=xxx
 * Get evaluation for a response
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const responseId = request.nextUrl.searchParams.get('responseId');
    const sessionId = request.nextUrl.searchParams.get('sessionId');

    // Get evaluation by response ID
    if (responseId) {
      const evaluation = await prisma.responseEvaluation.findUnique({
        where: { responseId },
        include: {
          question: {
            select: {
              question: true,
            },
          },
        },
      });

      if (!evaluation) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'EVALUATION_NOT_FOUND',
              message: 'Evaluation not found for this response',
            },
          },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: {
          evaluation: {
            id: evaluation.id,
            responseId: evaluation.responseId,
            questionId: evaluation.questionId,
            questionText: evaluation.question.question,
            scores: {
              relevance: evaluation.relevanceScore,
              technicalAccuracy: evaluation.technicalAccuracyScore,
              clarity: evaluation.clarityScore,
              depth: evaluation.depthScore,
              structure: evaluation.structureScore,
              confidence: evaluation.confidenceScore,
            },
            overallScore: evaluation.overallScore,
            feedback: {
              strengths: JSON.parse(evaluation.strengths || '[]'), // Parse JSON string back to array
              improvements: JSON.parse(evaluation.improvements || '[]'), // Parse JSON string back to array
              suggestion: evaluation.suggestion,
            },
            performanceBand: evaluation.performanceBand,
            createdAt: evaluation.createdAt.toISOString(),
          },
        },
      });
    }

    // Get all evaluations for a session
    if (sessionId) {
      const evaluations = await prisma.responseEvaluation.findMany({
        where: { sessionId },
        include: {
          question: {
            select: {
              questionNumber: true,
              question: true,
              category: true,
            },
          },
        },
        orderBy: {
          question: {
            questionNumber: 'asc',
          },
        },
      });

      // Calculate session summary
      const totalScore =
        evaluations.length > 0
          ? evaluations.reduce((sum, e) => sum + e.overallScore, 0) / evaluations.length
          : 0;

      return NextResponse.json({
        success: true,
        data: {
          evaluations: evaluations.map((e) => ({
            id: e.id,
            responseId: e.responseId,
            questionNumber: e.question.questionNumber,
            questionText: e.question.question,
            category: e.question.category,
            overallScore: e.overallScore,
            performanceBand: e.performanceBand,
            createdAt: e.createdAt.toISOString(),
          })),
          count: evaluations.length,
          averageScore: Math.round(totalScore * 10) / 10,
        },
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'MISSING_PARAMETER',
          message: 'Either responseId or sessionId is required',
        },
      },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error getting evaluation:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get evaluation',
        },
      },
      { status: 500 }
    );
  }
}
