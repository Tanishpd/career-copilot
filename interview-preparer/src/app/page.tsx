import { Mic, Brain, BarChart3, Clock, History } from 'lucide-react';
import Link from 'next/link';
import { SessionForm } from '@/components/SessionForm';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="mx-auto max-w-5xl px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mic className="h-8 w-8 text-blue-600" />
            <h1 className="text-xl font-bold text-gray-900">AI Tech Interview</h1>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/history"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <History className="h-4 w-4" />
              History
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="mx-auto max-w-5xl px-4 py-12">
        <div className="grid gap-12 lg:grid-cols-2">
          {/* Left Column - Hero */}
          <div className="space-y-6">
            <div className="space-y-4">
              <h2 className="text-4xl font-bold tracking-tight text-gray-900">
                Practice Technical Interviews with{' '}
                <span className="text-blue-600">AI-Powered Voice</span>
              </h2>
              <p className="text-lg text-gray-600">
                Get tailored interview questions based on your target role, practice speaking your
                answers aloud, and receive instant AI feedback with detailed scoring.
              </p>
            </div>

            {/* Features */}
            <div className="grid gap-4 sm:grid-cols-2">
              <FeatureCard
                icon={<Brain className="h-5 w-5 text-purple-600" />}
                title="Smart Questions"
                description="AI generates questions matching your seniority level"
              />
              <FeatureCard
                icon={<Mic className="h-5 w-5 text-blue-600" />}
                title="Voice Interaction"
                description="Listen to questions, record your spoken answers"
              />
              <FeatureCard
                icon={<Clock className="h-5 w-5 text-orange-600" />}
                title="Timed Responses"
                description="Practice with realistic time limits (1-5 min)"
              />
              <FeatureCard
                icon={<BarChart3 className="h-5 w-5 text-green-600" />}
                title="Detailed Feedback"
                description="Get scored across 6 criteria with suggestions"
              />
            </div>
          </div>

          {/* Right Column - Form */}
          <div className="lg:pt-4">
            <div className="rounded-2xl bg-white p-6 shadow-lg ring-1 ring-gray-100">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">
                Start Your Practice Session
              </h3>
              <SessionForm />
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t bg-white/80 backdrop-blur-sm mt-auto">
        <div className="mx-auto max-w-5xl px-4 py-6 text-center text-sm text-gray-500">
          Built with Next.js 16, Azure OpenAI & Azure Speech Service
        </div>
      </footer>
    </main>
  );
}

// Feature Card Component
function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-gray-100">
      <div className="flex items-center gap-3 mb-2">
        {icon}
        <h4 className="font-medium text-gray-900">{title}</h4>
      </div>
      <p className="text-sm text-gray-600">{description}</p>
    </div>
  );
}
