// =========================================================================
// AI Tech Interview - Score Card Component
// Visual representation of individual evaluation scores
// =========================================================================

'use client';

import { CheckCircle, AlertCircle, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

// =========================================================================
// Types
// =========================================================================

export interface ScoreCardProps {
  label: string;
  score: number;
  maxScore?: number;
  description?: string;
  showBar?: boolean;
}

// =========================================================================
// Component
// =========================================================================

export function ScoreCard({ 
  label, 
  score, 
  maxScore = 100,
  description,
  showBar = true 
}: ScoreCardProps) {
  const percentage = Math.round((score / maxScore) * 100);
  
  const getColor = (pct: number) => {
    if (pct >= 90) return 'text-green-600 bg-green-50 border-green-200';
    if (pct >= 75) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (pct >= 60) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getBarColor = (pct: number) => {
    if (pct >= 90) return 'bg-green-500';
    if (pct >= 75) return 'bg-blue-500';
    if (pct >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getIcon = (pct: number) => {
    if (pct >= 75) return <CheckCircle className="h-5 w-5" />;
    if (pct >= 60) return <TrendingUp className="h-5 w-5" />;
    return <AlertCircle className="h-5 w-5" />;
  };

  return (
    <div className={cn('rounded-lg border p-4', getColor(percentage))}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {getIcon(percentage)}
          <span className="font-medium text-sm">{label}</span>
        </div>
        <span className="text-2xl font-bold">{score}</span>
      </div>
      
      {showBar && (
        <div className="w-full h-2 bg-white/50 rounded-full overflow-hidden">
          <div
            className={cn('h-full transition-all duration-500', getBarColor(percentage))}
            style={{ width: `${percentage}%` }}
          />
        </div>
      )}
      
      {description && (
        <p className="text-xs mt-2 opacity-80">{description}</p>
      )}
    </div>
  );
}

// =========================================================================
// Overall Score Card (Larger variant)
// =========================================================================

export interface OverallScoreProps {
  score: number;
  band: string;
  totalQuestions: number;
  answeredQuestions: number;
}

export function OverallScore({ 
  score, 
  band, 
  totalQuestions, 
  answeredQuestions 
}: OverallScoreProps) {
  const getGradient = (pct: number) => {
    if (pct >= 90) return 'from-green-500 to-green-600';
    if (pct >= 75) return 'from-blue-500 to-blue-600';
    if (pct >= 60) return 'from-yellow-500 to-yellow-600';
    return 'from-red-500 to-red-600';
  };

  const getBandLabel = (band: string) => {
    switch (band) {
      case 'excellent': return '🌟 Excellent';
      case 'good': return '✅ Good';
      case 'satisfactory': return '👍 Satisfactory';
      case 'needs-work': return '⚠️ Needs Work';
      default: return '❌ Insufficient';
    }
  };

  return (
    <div className={cn(
      'rounded-2xl bg-gradient-to-br text-white p-8 shadow-lg',
      getGradient(score)
    )}>
      <div className="text-center">
        <p className="text-sm uppercase tracking-wide opacity-90 mb-2">
          Overall Score
        </p>
        <div className="text-7xl font-bold mb-2">
          {score}
        </div>
        <div className="text-2xl font-semibold mb-4">
          {getBandLabel(band)}
        </div>
        <div className="flex items-center justify-center gap-2 text-sm opacity-90">
          <span>{answeredQuestions} of {totalQuestions} questions answered</span>
        </div>
      </div>
    </div>
  );
}

// =========================================================================
// Performance Band Badge
// =========================================================================

export interface PerformanceBadgeProps {
  band: string;
  size?: 'sm' | 'md' | 'lg';
}

export function PerformanceBadge({ band, size = 'md' }: PerformanceBadgeProps) {
  const getColor = (band: string) => {
    switch (band) {
      case 'excellent': return 'bg-green-100 text-green-800 border-green-200';
      case 'good': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'satisfactory': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'needs-work': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-red-100 text-red-800 border-red-200';
    }
  };

  const getLabel = (band: string) => {
    switch (band) {
      case 'excellent': return 'Excellent';
      case 'good': return 'Good';
      case 'satisfactory': return 'Satisfactory';
      case 'needs-work': return 'Needs Work';
      default: return 'Insufficient';
    }
  };

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-2',
  };

  return (
    <span className={cn(
      'inline-flex items-center rounded-full font-medium border',
      getColor(band),
      sizeClasses[size]
    )}>
      {getLabel(band)}
    </span>
  );
}
