// =========================================================================
// AI Tech Interview - Response Sync API Route
// POST: Sync an offline-recorded response to the server (persisted to PostgreSQL)
// GET: Get all responses for a session
// =========================================================================

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import type { ApiResponse } from '@/types/api';

export interface SyncResponseRequest {
  questionId: string;
  sessionId: string;
  transcription?: string;
  durationSeconds: number;
}

export interface SyncResponseResponse {
  responseId: string;
  syncedAt: string;
}

/**
 * POST /api/responses/sync
 * Sync an offline-recorded response to the database
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<SyncResponseResponse>>> {
  try {
    const formData = await request.formData();

    const questionId = formData.get('questionId') as string;
    const sessionId = formData.get('sessionId') as string;
    const durationSeconds = parseInt(formData.get('durationSeconds') as string, 10);
    const transcription = formData.get('transcription') as string | null;
    const audioFile = formData.get('audio') as File | null;

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

    // Handle audio file - for now just log, in production upload to Azure Blob Storage
    let audioUrl: string | undefined;
    if (audioFile) {
      console.log(`Received audio file: ${audioFile.name}, size: ${audioFile.size} bytes`);
      // TODO: Upload to Azure Blob Storage
      // audioUrl = await uploadToStorage(audioFile);
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
        durationSeconds: isNaN(durationSeconds) ? null : durationSeconds,
        audioUrl,
        status: 'completed',
        completedAt: new Date(),
      },
      create: {
        questionId,
        sessionId,
        transcription: transcription || undefined,
        durationSeconds: isNaN(durationSeconds) ? null : durationSeconds,
        audioUrl,
        status: 'completed',
        startedAt: new Date(),
        completedAt: new Date(),
      },
    });

    console.log(`Synced response ${response.id} for question ${questionId}`);

    return NextResponse.json(
      {
        success: true,
        data: {
          responseId: response.id,
          syncedAt: response.completedAt?.toISOString() ?? new Date().toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error syncing response:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'SYNC_FAILED',
          message: error instanceof Error ? error.message : 'Failed to sync response',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/responses/sync?sessionId=xxx
 * Get all responses for a session
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const sessionId = request.nextUrl.searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'MISSING_SESSION_ID',
            message: 'Session ID is required',
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
          },
        },
        evaluation: true,
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
          transcription: r.transcription,
          durationSeconds: r.durationSeconds,
          audioUrl: r.audioUrl,
          status: r.status,
          startedAt: r.startedAt?.toISOString(),
          completedAt: r.completedAt?.toISOString(),
          hasEvaluation: r.evaluation !== null,
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
