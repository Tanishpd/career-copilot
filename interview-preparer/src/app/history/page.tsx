// =========================================================================
// AI Tech Interview - History Page
// Displays paginated list of past interview sessions
// =========================================================================

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ChevronLeft, ChevronRight, Calendar, Building2, FileText, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

// =========================================================================
// Types
// =========================================================================

interface SessionHistoryItem {
  id: string;
  roleTitle: string;
  companyName: string | null;
  seniorityLevel: string;
  status: string;
  createdAt: string;
  completedAt: string | null;
  totalQuestions: number;
  totalEvaluations: number;
  averageScore: number;
}

interface PaginationInfo {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// =========================================================================
// Performance Badge Component
// =========================================================================

function getPerformanceBand(score: number): { band: string; label: string; color: string } {
  if (score >= 90) return { band: 'excellent', label: 'Excellent', color: 'text-green-700 bg-green-100' };
  if (score >= 75) return { band: 'good', label: 'Good', color: 'text-blue-700 bg-blue-100' };
  if (score >= 60) return { band: 'satisfactory', label: 'Satisfactory', color: 'text-yellow-700 bg-yellow-100' };
  if (score >= 40) return { band: 'needs-work', label: 'Needs Work', color: 'text-orange-700 bg-orange-100' };
  return { band: 'poor', label: 'Poor', color: 'text-red-700 bg-red-100' };
}

function ScoreBadge({ score }: { score: number }) {
  if (score === 0) {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
        Not evaluated
      </span>
    );
  }

  const { label, color } = getPerformanceBand(score);

  return (
    <div className="flex items-center gap-2">
      <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', color)}>
        {label}
      </span>
      <span className="text-lg font-bold text-gray-900">{score}</span>
    </div>
  );
}

// =========================================================================
// Main Component
// =========================================================================

export default function HistoryPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<SessionHistoryItem[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSessions = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/sessions?page=${currentPage}&limit=10`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch sessions');
        }

        const result = await response.json();

        if (result.success) {
          setSessions(result.data.sessions);
          setPagination(result.data.pagination);
        } else {
          throw new Error(result.error?.message || 'Failed to fetch sessions');
        }
      } catch (err) {
        console.error('Error fetching sessions:', err);
        setError(err instanceof Error ? err.message : 'Failed to load history');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSessions();
  }, [currentPage]);

  const handleRowClick = (sessionId: string, status: string) => {
    // Route based on session status
    if (status === 'completed') {
      router.push(`/results/${sessionId}`);
    } else if (status === 'in-progress' || status === 'created') {
      router.push(`/interview/${sessionId}`);
    }
    // For 'cancelled' status, don't navigate
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
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
                Interview History
              </h1>
              <p className="text-xs text-gray-500">
                {pagination ? `${pagination.totalCount} total sessions` : 'Loading...'}
              </p>
            </div>
            
            <div className="w-20">{/* Spacer */}</div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : error ? (
          <div className="bg-red-50 rounded-lg border border-red-200 p-6 text-center">
            <p className="text-red-900 font-medium">{error}</p>
            <button
              onClick={() => setCurrentPage(1)}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Try Again
            </button>
          </div>
        ) : sessions.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No interviews yet</h2>
            <p className="text-gray-600 mb-6">Start your first practice session to see it here</p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              Start Interview
            </Link>
          </div>
        ) : (
          <>
            {/* Sessions Table */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Position
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Company
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Level
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Questions
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Score
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {sessions.map((session) => (
                      <tr
                        key={session.id}
                        onClick={() => handleRowClick(session.id, session.status)}
                        className="hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                              <FileText className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {session.roleTitle}
                              </div>
                              <div className="text-xs text-gray-500">
                                ID: {session.id.substring(0, 8)}...
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-sm text-gray-900">
                            <Building2 className="h-4 w-4 text-gray-400" />
                            {session.companyName || <span className="text-gray-400">Not specified</span>}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700 capitalize">
                            {session.seniorityLevel}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-sm text-gray-900">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <div>
                              <div className="font-medium">
                                {new Date(session.completedAt || session.createdAt).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                })}
                              </div>
                              <div className="text-xs text-gray-500">
                                {new Date(session.completedAt || session.createdAt).toLocaleTimeString('en-US', {
                                  hour: 'numeric',
                                  minute: '2-digit',
                                  hour12: true,
                                })}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            <span className="font-medium">{session.totalEvaluations}</span>
                            <span className="text-gray-500"> / {session.totalQuestions}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <ScoreBadge score={session.averageScore} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing{' '}
                  <span className="font-medium">
                    {(pagination.page - 1) * pagination.limit + 1}
                  </span>{' '}
                  to{' '}
                  <span className="font-medium">
                    {Math.min(pagination.page * pagination.limit, pagination.totalCount)}
                  </span>{' '}
                  of <span className="font-medium">{pagination.totalCount}</span> results
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => p - 1)}
                    disabled={!pagination.hasPrev}
                    className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => {
                      // Show first page, last page, current page, and pages around current
                      if (
                        page === 1 ||
                        page === pagination.totalPages ||
                        (page >= pagination.page - 1 && page <= pagination.page + 1)
                      ) {
                        return (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={cn(
                              'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                              page === pagination.page
                                ? 'bg-blue-600 text-white'
                                : 'text-gray-700 hover:bg-gray-100'
                            )}
                          >
                            {page}
                          </button>
                        );
                      } else if (page === pagination.page - 2 || page === pagination.page + 2) {
                        return (
                          <span key={page} className="px-2 text-gray-400">
                            ...
                          </span>
                        );
                      }
                      return null;
                    })}
                  </div>

                  <button
                    onClick={() => setCurrentPage((p) => p + 1)}
                    disabled={!pagination.hasNext}
                    className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
