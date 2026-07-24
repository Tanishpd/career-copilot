'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Briefcase, FileText, Sparkles } from 'lucide-react';

interface SessionFormProps {
  onSubmit?: (data: { roleTitle: string; companyName?: string; jobDescription: string }) => Promise<void>;
}

export function SessionForm({ onSubmit }: SessionFormProps) {
  const router = useRouter();
  const [roleTitle, setRoleTitle] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Validation
  const isRoleTitleValid = roleTitle.trim().length >= 10;
  const isJobDescriptionValid = jobDescription.trim().length >= 50;
  const isFormValid = isRoleTitleValid && isJobDescriptionValid;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    setIsLoading(true);
    setError(null);

    try {
      if (onSubmit) {
        await onSubmit({ roleTitle, companyName: companyName.trim() || undefined, jobDescription });
      } else {
        // Default behavior: call API and redirect
        const response = await fetch('/api/sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ roleTitle, companyName: companyName.trim() || undefined, jobDescription }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error?.message || 'Failed to create session');
        }

        const result = await response.json();
        
        // Handle ApiResponse wrapper: { success: true, data: { session, topics, questionCount } }
        const sessionId = result.data?.session?.id ?? result.session?.id;
        if (!sessionId) {
          throw new Error('Invalid response: session ID not found');
        }
        
        router.push(`/interview/${sessionId}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Role Title Input */}
      <div className="space-y-2">
        <label
          htmlFor="roleTitle"
          className="flex items-center gap-2 text-sm font-medium text-gray-700"
        >
          <Briefcase className="h-4 w-4" />
          Role Title
          <span className="text-red-500">*</span>
        </label>
        <input
          id="roleTitle"
          type="text"
          value={roleTitle}
          onChange={(e) => setRoleTitle(e.target.value)}
          placeholder="e.g., Senior FullStack .NET/Angular Developer"
          className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-colors"
          disabled={isLoading}
          aria-describedby="roleTitle-hint"
        />
        <p id="roleTitle-hint" className="text-xs text-gray-500">
          Include seniority level (Junior, Mid, Senior) for better question alignment.
          {roleTitle.length > 0 && (
            <span className={isRoleTitleValid ? 'text-green-600' : 'text-orange-500'}>
              {' '}({roleTitle.trim().length}/10 min characters)
            </span>
          )}
        </p>
      </div>

      {/* Company Name Input (Optional) */}
      <div className="space-y-2">
        <label
          htmlFor="companyName"
          className="flex items-center gap-2 text-sm font-medium text-gray-700"
        >
          <Briefcase className="h-4 w-4" />
          Company Name
          <span className="text-gray-400 text-xs font-normal">(optional)</span>
        </label>
        <input
          id="companyName"
          type="text"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          placeholder="e.g., Google, Microsoft, Amazon"
          className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-colors"
          disabled={isLoading}
          aria-describedby="companyName-hint"
        />
        <p id="companyName-hint" className="text-xs text-gray-500">
          Adding the company name can help tailor questions to the company culture.
        </p>
      </div>

      {/* Job Description Input */}
      <div className="space-y-2">
        <label
          htmlFor="jobDescription"
          className="flex items-center gap-2 text-sm font-medium text-gray-700"
        >
          <FileText className="h-4 w-4" />
          Job Description
          <span className="text-red-500">*</span>
        </label>
        <textarea
          id="jobDescription"
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          placeholder="Paste the job description or key responsibilities here..."
          rows={8}
          className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-colors resize-none"
          disabled={isLoading}
          aria-describedby="jobDescription-hint"
        />
        <p id="jobDescription-hint" className="text-xs text-gray-500">
          The more detailed, the better the questions.
          {jobDescription.length > 0 && (
            <span className={isJobDescriptionValid ? 'text-green-600' : 'text-orange-500'}>
              {' '}({jobDescription.trim().length}/50 min characters)
            </span>
          )}
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={!isFormValid || isLoading}
        className="w-full flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-white font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Generating Questions...
          </>
        ) : (
          <>
            <Sparkles className="h-5 w-5" />
            Start Interview Practice
          </>
        )}
      </button>

      {/* Info Box */}
      <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
        <h3 className="font-medium text-blue-900 mb-2">What happens next?</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>✨ AI generates up to 15 tailored interview questions</li>
          <li>🎤 Questions are read aloud using text-to-speech</li>
          <li>🎙️ Record your spoken responses</li>
          <li>📊 Get detailed feedback and scoring</li>
        </ul>
      </div>
    </form>
  );
}
