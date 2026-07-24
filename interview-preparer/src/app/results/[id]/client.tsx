// =========================================================================
// AI Tech Interview - Results Client Component
// Client-side component for displaying evaluation results
// =========================================================================

'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, CheckCircle, TrendingUp } from 'lucide-react';
import { ScoreCard, OverallScore, PerformanceBadge } from '@/components/ScoreCard';
import { formatTime } from '@/lib/utils';

// =========================================================================
// Types
// =========================================================================

interface Session {
  id: string;
  roleTitle: string;
  companyName?: string | null;
  seniorityLevel: string;
  createdAt: string;
  completedAt?: string;
}

interface Question {
  id: string;
  questionNumber: number;
  question: string;
  category: string;
  difficulty: string;
  timeLimitSeconds: number;
  topicName?: string;
  responses: Response[];
}

interface Response {
  id: string;
  transcription: string;
  durationSeconds: number;
  evaluation?: Evaluation;
}

interface Evaluation {
  id: string;
  relevanceScore: number;
  technicalAccuracyScore: number;
  clarityScore: number;
  depthScore: number;
  structureScore: number;
  confidenceScore: number;
  overallScore: number;
  performanceBand: string;
  strengths: string[];
  improvements: string[];
  suggestion: string;
}

interface EvaluationSummary {
  sessionId: string;
  totalResponses: number;
  evaluatedResponses: number;
  averageScore: number;
  performanceBand: string;
}

interface ResultsClientProps {
  session: Session;
  questions: Question[];
  evaluationSummary: EvaluationSummary;
}

// =========================================================================
// Scoring Scale Modal Component
// =========================================================================

function ScoringScaleModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-20 z-40 transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full animate-in fade-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900">Scoring Scale</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Close"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            <ScoringScale />
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 p-4 text-center">
            <button
              onClick={onClose}
              className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// =========================================================================
// Scoring Scale Component
// =========================================================================

function ScoringScale() {
  const scales = [
    { range: '90 - 100', label: 'Excellent', color: 'bg-green-100', borderColor: 'border-green-300', textColor: 'text-green-700' },
    { range: '75 - 89', label: 'Good', color: 'bg-blue-100', borderColor: 'border-blue-300', textColor: 'text-blue-700' },
    { range: '60 - 74', label: 'Satisfactory', color: 'bg-yellow-100', borderColor: 'border-yellow-300', textColor: 'text-yellow-700' },
    { range: '40 - 59', label: 'Needs Work', color: 'bg-orange-100', borderColor: 'border-orange-300', textColor: 'text-orange-700' },
    { range: '0 - 39', label: 'Poor', color: 'bg-red-100', borderColor: 'border-red-300', textColor: 'text-red-700' },
  ];

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h4 className="text-sm font-semibold text-gray-700 mb-4">Scoring Scale</h4>
      <div className="space-y-2">
        {scales.map((scale) => (
          <div key={scale.range} className="flex items-center gap-3">
            <div className={`w-12 h-8 rounded border-2 ${scale.color} ${scale.borderColor}`} />
            <div className="flex-1">
              <div className={`text-sm font-medium ${scale.textColor}`}>{scale.label}</div>
              <div className="text-xs text-gray-500">{scale.range} points</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// =========================================================================

function QuestionCard({ question, index }: { question: Question; index: number }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const response = question.responses?.[0];
  const evaluation = response?.evaluation;

  if (!response || !evaluation) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-600 font-bold text-sm">
              {question.questionNumber}
            </span>
            <div>
              <PerformanceBadge band="needs-work" size="sm" />
              <p className="text-xs text-gray-500 mt-1">{question.topicName || question.category}</p>
            </div>
          </div>
        </div>
        <p className="text-gray-500 text-sm">No response</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-6 text-left hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-bold">
              {question.questionNumber}
            </span>
            <div>
              <PerformanceBadge band={evaluation.performanceBand} size="sm" />
              <p className="text-xs text-gray-500 mt-1">{question.topicName || question.category}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-3xl font-bold text-gray-900">{evaluation.overallScore}</div>
              <div className="text-xs text-gray-500">points</div>
            </div>
            {isExpanded ? (
              <ChevronUp className="h-5 w-5 text-gray-400" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-400" />
            )}
          </div>
        </div>

        <p className="text-gray-900 font-medium line-clamp-2">
          {question.question}
        </p>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-gray-200 p-6 space-y-6 bg-gray-50">
          {/* Score Breakdown */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Score Breakdown</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <ScoreCard label="Relevance" score={evaluation.relevanceScore} />
              <ScoreCard label="Technical Accuracy" score={evaluation.technicalAccuracyScore} />
              <ScoreCard label="Clarity" score={evaluation.clarityScore} />
              <ScoreCard label="Depth" score={evaluation.depthScore} />
              <ScoreCard label="Structure" score={evaluation.structureScore} />
              <ScoreCard label="Confidence" score={evaluation.confidenceScore} />
            </div>
          </div>

          {/* Your Response */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Your Answer</h4>
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{response.transcription}</p>
              <p className="text-xs text-gray-500 mt-2">
                Duration: {formatTime(response.durationSeconds)} / {formatTime(question.timeLimitSeconds)}
              </p>
            </div>
          </div>

          {/* Strengths */}
          {evaluation.strengths.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-green-700 mb-2 flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Strengths
              </h4>
              <ul className="space-y-2">
                {evaluation.strengths.map((strength, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-green-600 mt-0.5">•</span>
                    <span>{strength}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Improvements */}
          {evaluation.improvements.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-orange-700 mb-2 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Areas for Improvement
              </h4>
              <ul className="space-y-2">
                {evaluation.improvements.map((improvement, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-orange-600 mt-0.5">•</span>
                    <span>{improvement}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Recommendation */}
          {evaluation.suggestion && (
            <div>
              <h4 className="text-sm font-semibold text-blue-700 mb-2">Recommendation</h4>
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <p className="text-sm text-blue-900">{evaluation.suggestion}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// =========================================================================
// Main Component
// =========================================================================

export function ResultsClient({ 
  session, 
  questions, 
  evaluationSummary 
}: ResultsClientProps) {
  const [showScalingModal, setShowScalingModal] = useState(false);
  const questionsWithResponses = questions.filter(q => q.responses && q.responses.length > 0);

  return (
    <div className="space-y-8">
      {/* Overall Score Section */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <OverallScore
            score={evaluationSummary.averageScore}
            band={evaluationSummary.performanceBand}
            totalQuestions={evaluationSummary.totalResponses}
            answeredQuestions={evaluationSummary.evaluatedResponses}
          />
        </div>
        
        <div className="space-y-4">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Summary</h3>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-600">Position:</dt>
                <dd className="font-medium text-gray-900 text-right">{session.roleTitle}</dd>
              </div>
              {session.companyName && (
                <div className="flex justify-between">
                  <dt className="text-gray-600">Company:</dt>
                  <dd className="font-medium text-gray-900 text-right">{session.companyName}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-gray-600">Level:</dt>
                <dd className="font-medium text-gray-900 capitalize">{session.seniorityLevel}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-600">Questions:</dt>
                <dd className="font-medium text-gray-900">
                  {evaluationSummary.evaluatedResponses} / {evaluationSummary.totalResponses}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-600">Date:</dt>
                <dd className="font-medium text-gray-900">
                  {new Date(session.completedAt || session.createdAt).toLocaleString('en-US', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </dd>
              </div>
            </dl>
          </div>

          <ScoringScaleModal isOpen={showScalingModal} onClose={() => setShowScalingModal(false)} />

          <button
            onClick={() => setShowScalingModal(true)}
            className="w-full bg-white rounded-lg border border-gray-200 p-4 text-left hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-700">Scoring Scale</span>
              <span className="text-lg">📊</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">Click to view score ranges and colors</p>
          </button>

          <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
            <p className="text-sm text-blue-900">
              💡 <strong>Tip:</strong> Expand each question to see detailed breakdown and improvement suggestions.
            </p>
          </div>
        </div>
      </div>

      {/* Questions List */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Results by Question
        </h2>
        <div className="space-y-4">
          {questionsWithResponses.map((question, index) => (
            <QuestionCard key={question.id} question={question} index={index} />
          ))}
        </div>
      </div>

      {/* Next Steps */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-8">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Next Steps</h3>
        <div className="grid md:grid-cols-3 gap-6">
          <div>
            <div className="text-3xl mb-2">📚</div>
            <h4 className="font-semibold text-gray-900 mb-2">Review Feedback</h4>
            <p className="text-sm text-gray-600">
              Analyze the improvement areas identified in each response
            </p>
          </div>
          <div>
            <div className="text-3xl mb-2">🎯</div>
            <h4 className="font-semibold text-gray-900 mb-2">Practice More</h4>
            <p className="text-sm text-gray-600">
              Take another session focusing on your weak points
            </p>
          </div>
          <div>
            <div className="text-3xl mb-2">💪</div>
            <h4 className="font-semibold text-gray-900 mb-2">Get Ready</h4>
            <p className="text-sm text-gray-600">
              Use the suggestions to improve your future answers
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
