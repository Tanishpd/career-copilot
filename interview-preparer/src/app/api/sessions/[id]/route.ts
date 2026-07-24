// =========================================================================
// AI Tech Interview - Session Detail API Route
// GET: Get a session by ID with all related data
// =========================================================================

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/sessions/[id]
 * Get a session with its questions, topics, responses, and evaluations
 */
export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id: sessionId } = await params;

    // Fetch session with related data from database
    const session = await prisma.interviewSession.findUnique({
      where: { id: sessionId },
      include: {
        topics: {
          orderBy: { priority: 'asc' },
        },
        questions: {
          orderBy: { questionNumber: 'asc' },
          include: {
            topic: true,
            responses: {
              include: {
                evaluation: true,
              },
            },
          },
        },
        responses: true,
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

    // Transform questions to include topicName, timeLimit alias, and responses with evaluations
    const questionsWithTopicName = session.questions.map((q) => ({
      id: q.id,
      sessionId: q.sessionId,
      topicId: q.topicId,
      topicName: q.topic?.name,
      questionNumber: q.questionNumber,
      question: q.question,
      category: q.category,
      difficulty: q.difficulty,
      expectedTopics: JSON.parse(q.expectedTopics || '[]'), // Parse JSON string back to array
      timeLimitSeconds: q.timeLimitSeconds,
      timeLimit: q.timeLimitSeconds, // Alias for UI
      createdAt: q.createdAt.toISOString(),
      responses: q.responses.map((r) => ({
        id: r.id,
        transcription: r.transcription,
        durationSeconds: r.durationSeconds,
        status: r.status,
        createdAt: r.createdAt.toISOString(),
        evaluation: r.evaluation ? {
          id: r.evaluation.id,
          relevanceScore: r.evaluation.relevanceScore,
          technicalAccuracyScore: r.evaluation.technicalAccuracyScore,
          clarityScore: r.evaluation.clarityScore,
          depthScore: r.evaluation.depthScore,
          structureScore: r.evaluation.structureScore,
          confidenceScore: r.evaluation.confidenceScore,
          overallScore: r.evaluation.overallScore,
          performanceBand: r.evaluation.performanceBand,
          strengths: JSON.parse(r.evaluation.strengths || '[]'), // Parse JSON string back to array
          improvements: JSON.parse(r.evaluation.improvements || '[]'), // Parse JSON string back to array
          suggestion: r.evaluation.suggestion,
          createdAt: r.evaluation.createdAt.toISOString(),
        } : undefined,
      })),
    }));

    // Transform topics
    const topicsData = session.topics.map((t) => ({
      name: t.name,
      description: t.description,
      priority: t.priority,
      category: 'technical', // Default, can be enhanced later
    }));

    return NextResponse.json({
      success: true,
      data: {
        session: {
          id: session.id,
          roleTitle: session.roleTitle,
          companyName: session.companyName,
          jobDescription: session.jobDescription,
          seniorityLevel: session.seniorityLevel,
          status: session.status,
          createdAt: session.createdAt.toISOString(),
          updatedAt: session.updatedAt.toISOString(),
          completedAt: session.completedAt?.toISOString(),
        },
        questions: questionsWithTopicName,
        topics: topicsData,
        responses: session.responses,
        currentQuestionIndex: 0, // TODO: Calculate based on responses
      },
    });
  } catch (error) {
    console.error('Error getting session:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get session',
        },
      },
      { status: 500 }
    );
  }
}
