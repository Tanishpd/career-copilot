// =========================================================================
// AI Tech Interview - Sessions API Route
// POST: Create a new interview session (persisted to PostgreSQL)
// GET: Get a session by ID (via query param)
// =========================================================================

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateInterviewQuestions, extractSeniorityFromRole } from '@/lib/azure-openai';
import type { CreateSessionInput } from '@/types/interview';
import type { ApiResponse, CreateSessionResponse } from '@/types/api';

/**
 * POST /api/sessions
 * Create a new interview session and generate questions
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<CreateSessionResponse>>> {
  try {
    const body = (await request.json()) as CreateSessionInput;

    // Validate input
    if (!body.roleTitle || body.roleTitle.trim().length < 10) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_ROLE_TITLE',
            message: 'Role title must be at least 10 characters',
          },
        },
        { status: 400 }
      );
    }

    if (!body.jobDescription || body.jobDescription.trim().length < 50) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_JOB_DESCRIPTION',
            message: 'Job description must be at least 50 characters',
          },
        },
        { status: 400 }
      );
    }

    // Extract seniority level from role title
    const seniorityLevel = extractSeniorityFromRole(body.roleTitle);

    // Create session in database first (before calling OpenAI)
    const session = await prisma.interviewSession.create({
      data: {
        roleTitle: body.roleTitle.trim(),
        companyName: body.companyName?.trim() || null,
        jobDescription: body.jobDescription.trim(),
        seniorityLevel,
        status: 'created',
      },
    });

    console.log(`Session ${session.id} created, generating questions...`);

    try {
      // Generate questions using Azure OpenAI (now with topic extraction)
      const generatedQuestions = await generateInterviewQuestions(
        session.roleTitle,
        session.jobDescription,
        seniorityLevel
      );

      // Store topics in database
      const topicsData = generatedQuestions.topics || [];
      const createdTopics = await Promise.all(
        topicsData.map((topic) =>
          prisma.interviewTopic.create({
            data: {
              sessionId: session.id,
              name: topic.name,
              description: topic.description,
              priority: topic.priority,
            },
          })
        )
      );

      // Create a map of topic names to IDs
      const topicNameToId = new Map<string, string>();
      for (const t of createdTopics) {
        topicNameToId.set(t.name, t.id);
      }

      // Store questions in database
      const questionsData = generatedQuestions.questions.map((q, index) => ({
        sessionId: session.id,
        topicId: q.topicName ? (topicNameToId.get(q.topicName) ?? null) : null,
        questionNumber: index + 1,
        question: q.question,
        category: q.category,
        difficulty: q.difficulty,
        expectedTopics: JSON.stringify(q.expectedTopics), // Store as JSON string for SQLite
        timeLimitSeconds: q.timeLimitSeconds,
      }));

      await prisma.interviewQuestion.createMany({
        data: questionsData,
      });

      // Update session status
      const updatedSession = await prisma.interviewSession.update({
        where: { id: session.id },
        data: { status: 'in-progress' },
      });

      console.log(
        `Session ${session.id}: Generated ${questionsData.length} questions from ${topicsData.length} topics`
      );

      return NextResponse.json(
        {
          success: true,
          data: {
            session: {
              id: updatedSession.id,
              roleTitle: updatedSession.roleTitle,
              companyName: updatedSession.companyName ?? undefined,
              jobDescription: updatedSession.jobDescription,
              seniorityLevel: seniorityLevel, // Use the typed variable
              status: 'in-progress' as const, // Use the literal type
              createdAt: updatedSession.createdAt.toISOString(),
              updatedAt: updatedSession.updatedAt.toISOString(),
            },
            topics: topicsData,
            questionCount: questionsData.length,
          },
        },
        { status: 201 }
      );
    } catch (openAiError) {
      // If OpenAI fails, mark session as failed but keep it in DB
      await prisma.interviewSession.update({
        where: { id: session.id },
        data: { status: 'cancelled' },
      });

      console.error('OpenAI error:', openAiError);
      throw openAiError;
    }
  } catch (error) {
    console.error('Error creating session:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to create session',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/sessions?page=1&limit=10
 * List all sessions with pagination
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const page = parseInt(request.nextUrl.searchParams.get('page') || '1');
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '10');

    const skip = (page - 1) * limit;

    // Get total count
    const totalCount = await prisma.interviewSession.count();

    // Get paginated sessions with aggregated data
    const sessions = await prisma.interviewSession.findMany({
      skip,
      take: limit,
      orderBy: { completedAt: 'desc' },
      include: {
        questions: {
          select: { id: true },
        },
        evaluations: {
          select: {
            overallScore: true,
          },
        },
      },
    });

    // Calculate average score for each session
    const sessionsWithScore = sessions.map((session) => {
      const scores = session.evaluations.map((e) => e.overallScore);
      const averageScore = scores.length > 0
        ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
        : 0;

      return {
        id: session.id,
        roleTitle: session.roleTitle,
        companyName: session.companyName,
        seniorityLevel: session.seniorityLevel,
        status: session.status,
        createdAt: session.createdAt.toISOString(),
        completedAt: session.completedAt?.toISOString(),
        totalQuestions: session.questions.length,
        totalEvaluations: session.evaluations.length,
        averageScore,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        sessions: sessionsWithScore,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages: Math.ceil(totalCount / limit),
          hasNext: page < Math.ceil(totalCount / limit),
          hasPrev: page > 1,
        },
      },
    });
  } catch (error) {
    console.error('Error listing sessions:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to list sessions',
        },
      },
      { status: 500 }
    );
  }
}
