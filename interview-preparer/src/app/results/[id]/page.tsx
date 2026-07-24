// =========================================================================
// AI Tech Interview - Results Page (Server Component)
// Displays evaluation results for a completed interview session
// =========================================================================

import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { ResultsClient } from './client';

// =========================================================================
// Types
// =========================================================================

interface ResultsPageProps {
  params: Promise<{ id: string }>;
}

// =========================================================================
// Loading Component
// =========================================================================

function ResultsLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-6"></div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Processing Results</h2>
        <p className="text-gray-600">Evaluating your responses with AI...</p>
        <p className="text-sm text-gray-500 mt-2">This may take a few seconds</p>
      </div>
    </div>
  );
}

// =========================================================================
// Results Content Component
// =========================================================================

async function ResultsContent({ sessionId }: { sessionId: string }) {
  // Trigger batch evaluation
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  
  let evaluationData;
  try {
    const evalResponse = await fetch(`${baseUrl}/api/evaluate/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId }),
      cache: 'no-store',
    });

    if (!evalResponse.ok) {
      console.error('Evaluation failed:', await evalResponse.text());
      throw new Error('Failed to evaluate responses');
    }

    const evalResult = await evalResponse.json();
    evaluationData = evalResult.data;
  } catch (error) {
    console.error('Error triggering evaluation:', error);
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="max-w-md bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Processing Error</h2>
          <p className="text-gray-600 mb-6">
            Failed to evaluate responses. Please try again.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  // Fetch full session details with evaluations
  const sessionResponse = await fetch(`${baseUrl}/api/sessions/${sessionId}`, {
    cache: 'no-store',
  });

  if (!sessionResponse.ok) {
    notFound();
  }

  const sessionResult = await sessionResponse.json();
  const sessionData = sessionResult.data;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link 
              href="/"
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="text-sm font-medium">Home</span>
            </Link>
            
            <div className="text-center">
              <h1 className="text-lg font-semibold text-gray-900">
                Interview Results
              </h1>
              <p className="text-xs text-gray-500">{sessionData.session.roleTitle}</p>
            </div>
            
            <div className="w-20">{/* Spacer for centering */}</div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <ResultsClient 
          session={sessionData.session}
          questions={sessionData.questions}
          evaluationSummary={evaluationData}
        />
      </main>
    </div>
  );
}

// =========================================================================
// Page Component
// =========================================================================

export default async function ResultsPage({ params }: ResultsPageProps) {
  const { id } = await params;
  
  return (
    <Suspense fallback={<ResultsLoading />}>
      <ResultsContent sessionId={id} />
    </Suspense>
  );
}
