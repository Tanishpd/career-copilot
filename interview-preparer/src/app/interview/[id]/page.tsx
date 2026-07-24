// =========================================================================
// AI Tech Interview - Interview Room Page
// Dynamic route for conducting the interview session
// =========================================================================

import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { InterviewRoomClient } from './client';

// =========================================================================
// Types
// =========================================================================

interface InterviewPageProps {
  params: Promise<{ id: string }>;
}

// =========================================================================
// Data Fetching
// =========================================================================

async function getSession(id: string) {
  // For now, fetch from the API route
  // In production, this would be a direct database call
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  
  try {
    const response = await fetch(`${baseUrl}/api/sessions/${id}`, {
      cache: 'no-store',
    });
    
    if (!response.ok) {
      return null;
    }
    
    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('Failed to fetch session:', error);
    return null;
  }
}

// =========================================================================
// Loading Component
// =========================================================================

function InterviewLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading interview session...</p>
      </div>
    </div>
  );
}

// =========================================================================
// Interview Content Component
// =========================================================================

async function InterviewContent({ sessionId }: { sessionId: string }) {
  const sessionData = await getSession(sessionId);
  
  if (!sessionData) {
    notFound();
  }

  const { session, questions = [] } = sessionData;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link 
              href="/"
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="text-sm font-medium">Exit Interview</span>
            </Link>
            
            <div className="text-center">
              <h1 className="text-lg font-semibold text-gray-900 truncate max-w-md">
                {session.roleTitle}
              </h1>
              <p className="text-xs text-gray-500">
                {questions.length} questions • {session.seniorityLevel} level
              </p>
            </div>
            
            {/* Placeholder for session timer - could be added later */}
            <div className="w-24" />
          </div>
        </div>
      </header>

      {/* Main Content - Interview Room */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {questions.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <p className="text-gray-500">Questions are being generated...</p>
            <p className="text-sm mt-2 text-gray-400">Please refresh the page in a few moments.</p>
          </div>
        ) : (
          <InterviewRoomClient
            session={{
              id: session.id,
              roleTitle: session.roleTitle,
              seniorityLevel: session.seniorityLevel,
            }}
            questions={questions.map((q: any) => ({
              id: q.id,
              questionNumber: q.questionNumber,
              question: q.question,
              category: q.category,
              difficulty: q.difficulty,
              timeLimit: q.timeLimit || q.timeLimitSeconds,
              topicName: q.topicName,
              responses: q.responses,
            }))}
          />
        )}
      </main>
    </div>
  );
}

// =========================================================================
// Page Component
// =========================================================================

export default async function InterviewPage({ params }: InterviewPageProps) {
  const { id } = await params;
  
  return (
    <Suspense fallback={<InterviewLoading />}>
      <InterviewContent sessionId={id} />
    </Suspense>
  );
}

// =========================================================================
// Metadata
// =========================================================================

export async function generateMetadata({ params }: InterviewPageProps) {
  const { id } = await params;
  
  return {
    title: `Interview Session - AI Tech Interview Prep`,
    description: `Practice interview session ${id}`,
  };
}
