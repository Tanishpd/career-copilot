// =========================================================================
// AI Tech Interview - Responses API Route
// POST: Save a response for a question (persisted to PostgreSQL)
// GET: Get all responses for a session
// =========================================================================

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import type { ApiResponse } from '@/types/api';

export interface SaveResponseRequest {
  questionId: string;
  sessionId: string;
  transcription?: string;
  durationSeconds?: number;
  audioUrl?: string;
}

export interface SaveResponseResponse {
  responseId: string;
  status: string;
  savedAt: string;
}

/**
 * POST /api/responses
 * Save a response for a question
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<SaveResponseResponse>>> {
  try {
    const body = (await request.json()) as SaveResponseRequest;

    const { questionId, sessionId, transcription, durationSeconds, audioUrl } = body;

    // Validate required fields
    if (!questionId || !sessionId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_REQUEST',
            message: 'Missing required fields: questionId, sessionId',
          },
        },
        { status: 400 }
      );
    }

    // Verify the session exists
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

    // Verify the question exists and belongs to this session
    const question = await prisma.interviewQuestion.findFirst({
      where: {
        id: questionId,
        sessionId: sessionId,
      },
    });

    if (!question) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'QUESTION_NOT_FOUND',
            message: 'Question not found in this session',
          },
        },
        { status: 404 }
      );
    }

    // Create or update the response in the database
    const response = await prisma.questionResponse.upsert({
      where: {
        questionId_sessionId: {
          questionId,
          sessionId,
        },
      },
      update: {
        transcription: transcription || undefined,
        durationSeconds: durationSeconds ?? null,
        audioUrl: audioUrl || undefined,
        status: 'completed',
        completedAt: new Date(),
      },
      create: {
        questionId,
        sessionId,
        transcription: transcription || undefined,
        durationSeconds: durationSeconds ?? null,
        audioUrl: audioUrl || undefined,
        status: 'completed',
        startedAt: new Date(),
        completedAt: new Date(),
      },
    });

    console.log(`Saved response ${response.id} for question ${questionId}`);

    // Check if all questions are answered and update session status to completed
    const totalQuestions = await prisma.interviewQuestion.count({
      where: { sessionId: sessionId },
    });

    const completedResponses = await prisma.questionResponse.count({
      where: { 
        sessionId: sessionId,
        status: 'completed',
      },
    });

    console.log(`Session ${sessionId}: ${completedResponses}/${totalQuestions} questions answered`);

    // If all questions are answered, mark session as completed
    if (completedResponses === totalQuestions) {
      await prisma.interviewSession.update({
        where: { id: sessionId },
        data: {
          status: 'completed',
          completedAt: new Date(),
        },
      });
      console.log(`Session ${sessionId} marked as completed`);
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          responseId: response.id,
          status: response.status,
          savedAt: response.completedAt?.toISOString() ?? new Date().toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error saving response:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'SAVE_FAILED',
          message: error instanceof Error ? error.message : 'Failed to save response',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/responses?sessionId=xxx
 * Get all responses for a session
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const sessionId = request.nextUrl.searchParams.get('sessionId');
    const responseId = request.nextUrl.searchParams.get('id');

    // Get a single response by ID
    if (responseId) {
      const response = await prisma.questionResponse.findUnique({
        where: { id: responseId },
        include: {
          question: true,
          evaluation: true,
        },
      });

      if (!response) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'RESPONSE_NOT_FOUND',
              message: 'Response not found',
            },
          },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: {
          response: {
            id: response.id,
            questionId: response.questionId,
            sessionId: response.sessionId,
            question: response.question,
            transcription: response.transcription,
            durationSeconds: response.durationSeconds,
            audioUrl: response.audioUrl,
            status: response.status,
            startedAt: response.startedAt?.toISOString(),
            completedAt: response.completedAt?.toISOString(),
            evaluation: response.evaluation,
          },
        },
      });
    }

    // Get all responses for a session
    if (!sessionId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'MISSING_PARAMETER',
            message: 'Either sessionId or id is required',
          },
        },
        { status: 400 }
      );
    }

    // Fetch responses from database
    const responses = await prisma.questionResponse.findMany({
      where: { sessionId },
      include: {
        question: {
          select: {
            questionNumber: true,
            question: true,
            category: true,
            difficulty: true,
          },
        },
        evaluation: {
          select: {
            overallScore: true,
          },
        },
      },
      orderBy: {
        question: {
          questionNumber: 'asc',
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        responses: responses.map((r) => ({
          id: r.id,
          questionId: r.questionId,
          sessionId: r.sessionId,
          questionNumber: r.question.questionNumber,
          questionText: r.question.question,
          category: r.question.category,
          difficulty: r.question.difficulty,
          transcription: r.transcription,
          durationSeconds: r.durationSeconds,
          audioUrl: r.audioUrl,
          status: r.status,
          startedAt: r.startedAt?.toISOString(),
          completedAt: r.completedAt?.toISOString(),
          overallScore: r.evaluation?.overallScore,
        })),
        count: responses.length,
      },
    });
  } catch (error) {
    console.error('Error getting responses:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get responses',
        },
      },
      { status: 500 }
    );
  }
}
