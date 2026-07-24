// =========================================================================
// AI Tech Interview - Interview Room Component
// Main component for conducting the interview with TTS and recording
// =========================================================================

'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Mic,
  MicOff,
  Volume2,
  Clock,
  ChevronLeft,
  ChevronRight,
  Check,
  Loader2,
  AlertCircle,
  Play,
  Square,
  SkipForward,
} from 'lucide-react';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import { useSpeechSynthesis } from '@/hooks/useSpeechSynthesis';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { useOfflineSupport } from '@/hooks/useOfflineSupport';
import { PermissionsCheck } from '@/components/PermissionsCheck';
import { formatTime, cn } from '@/lib/utils';

// =========================================================================
// Types
// =========================================================================

interface Question {
  id: string;
  questionNumber: number;
  question: string;
  category: string;
  difficulty: string;
  timeLimit: number;
  topicName?: string;
  responses?: Array<{
    id: string;
    transcription?: string;
    durationSeconds?: number;
    status?: string;
    createdAt?: string;
    evaluation?: {
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
      createdAt: string;
    };
  }>;
}

interface Session {
  id: string;
  roleTitle: string;
  seniorityLevel: string;
}

interface InterviewRoomProps {
  session: Session;
  questions: Question[];
}

type InterviewPhase = 'intro' | 'question' | 'recording' | 'review' | 'complete';

interface QuestionState {
  answered: boolean;
  transcription?: string;
  responseId?: string;
  duration?: number;
}

// =========================================================================
// Sub-components
// =========================================================================

function AudioLevelIndicator({ level }: { level: number }) {
  return (
    <div className="flex items-center gap-1 h-8">
      {[...Array(10)].map((_, i) => (
        <div
          key={i}
          className={cn(
            'w-1 rounded-full transition-all duration-75',
            level > i * 10 ? 'bg-red-500' : 'bg-gray-300'
          )}
          style={{ height: `${Math.max(4, Math.min(32, (level / 100) * 32 * (1 + Math.random() * 0.5)))}px` }}
        />
      ))}
    </div>
  );
}

function Timer({ seconds, maxSeconds, isWarning }: { seconds: number; maxSeconds: number; isWarning: boolean }) {
  const percentage = Math.min(100, (seconds / maxSeconds) * 100);
  
  return (
    <div className="flex items-center gap-3">
      <Clock className={cn('h-5 w-5', isWarning ? 'text-red-500 animate-pulse' : 'text-gray-500')} />
      <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={cn(
            'h-full transition-all duration-1000',
            percentage > 90 ? 'bg-red-500' : percentage > 75 ? 'bg-yellow-500' : 'bg-blue-500'
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className={cn('font-mono text-sm', isWarning ? 'text-red-600 font-bold' : 'text-gray-600')}>
        {formatTime(seconds)}
      </span>
    </div>
  );
}

// =========================================================================
// Main Component
// =========================================================================

export function InterviewRoom({ session, questions }: InterviewRoomProps) {
  const router = useRouter();
  
  // State
  const [permissionsGranted, setPermissionsGranted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [phase, setPhase] = useState<InterviewPhase>('intro');
  const [timer, setTimer] = useState(0);
  const [questionStates, setQuestionStates] = useState<Map<string, QuestionState>>(new Map());
  const [isSaving, setIsSaving] = useState(false);
  const [questionReadComplete, setQuestionReadComplete] = useState(false);
  const [hasSpokenStarted, setHasSpokenStarted] = useState(false);
  
  // Hooks
  const recorder = useAudioRecorder();
  const tts = useSpeechSynthesis();
  const stt = useSpeechRecognition();
  const { saveResponseOffline, state: offlineState } = useOfflineSupport();
  
  const currentQuestion = questions[currentIndex];
  const isLastQuestion = currentIndex === questions.length - 1;
  const answeredCount = Array.from(questionStates.values()).filter((s) => s.answered).length;
  const isTimeWarning = currentQuestion && timer > currentQuestion.timeLimit * 0.9;
  
  // Timer effect
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    
    if (phase === 'recording') {
      interval = setInterval(() => {
        setTimer((t) => t + 1);
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [phase]);
  
  // Auto-read question when entering question phase (only if not already answered)
  useEffect(() => {
    const isAnswered = questionStates.get(currentQuestion?.id)?.answered;
    if (phase === 'question' && currentQuestion && tts.state.status === 'idle' && !isAnswered) {
      setQuestionReadComplete(false);
      setHasSpokenStarted(false);
      readQuestion();
    } else if (isAnswered && phase === 'question') {
      // If already answered, mark as read complete immediately
      setQuestionReadComplete(true);
    }
  }, [phase, currentQuestion?.id, questionStates]);

  // Track when speech starts and completes
  useEffect(() => {
    if (tts.state.status === 'speaking') {
      setHasSpokenStarted(true);
    }
  }, [tts.state.status]);

  // Mark as complete only when speech has started AND now is idle
  useEffect(() => {
    if (hasSpokenStarted && tts.state.status === 'idle' && !questionReadComplete) {
      setQuestionReadComplete(true);
    }
  }, [hasSpokenStarted, tts.state.status, questionReadComplete]);

  // Initialize question states from existing responses
  useEffect(() => {
    const initialStates = new Map<string, QuestionState>();
    
    questions.forEach((question) => {
      if (question.responses && question.responses.length > 0) {
        const latestResponse = question.responses[question.responses.length - 1];
        initialStates.set(question.id, {
          answered: true,
          transcription: latestResponse.transcription,
          responseId: latestResponse.id,
          duration: latestResponse.durationSeconds,
        });
      } else {
        initialStates.set(question.id, { answered: false });
      }
    });
    
    setQuestionStates(initialStates);
  }, [questions]);

  // Start the interview
  const startInterview = useCallback(() => {
    setPhase('question');
    setCurrentIndex(0);
    setTimer(0);
  }, []);
  
  // Read question aloud
  const readQuestion = useCallback(async () => {
    if (!currentQuestion) return;
    await tts.speak(currentQuestion.question);
  }, [currentQuestion, tts]);
  
  // Start recording response
  const startRecording = useCallback(async () => {
    setTimer(0);
    setPhase('recording');
    
    // Start audio recording and speech recognition in parallel
    await Promise.all([
      recorder.startRecording(),
      stt.startListening(),
    ]);
  }, [recorder, stt]);
  
  // Stop recording and save response
  const stopRecording = useCallback(async () => {
    setPhase('review');
    
    // Stop both recording and recognition
    const [audioBlob, transcription] = await Promise.all([
      recorder.stopRecording(),
      stt.stopListening(),
    ]);
    
    if (!currentQuestion) return;
    
    setIsSaving(true);
    
    try {
      // Prepare response data
      const responseData = {
        questionId: currentQuestion.id,
        sessionId: session.id,
        transcription: transcription || stt.state.transcript,
        durationSeconds: timer,
      };
      
      // Try to save online first
      if (offlineState.isOnline) {
        try {
          const formData = new FormData();
          formData.append('questionId', responseData.questionId);
          formData.append('sessionId', responseData.sessionId);
          formData.append('transcription', responseData.transcription);
          formData.append('durationSeconds', String(responseData.durationSeconds));
          
          if (audioBlob) {
            formData.append('audio', audioBlob, 'response.webm');
          }
          
          const response = await fetch('/api/responses/sync', {
            method: 'POST',
            body: formData,
          });
          
          if (response.ok) {
            const result = await response.json();
            
            // Update question state
            setQuestionStates((prev) => {
              const next = new Map(prev);
              next.set(currentQuestion.id, {
                answered: true,
                transcription: responseData.transcription,
                responseId: result.data.responseId,
                duration: timer,
              });
              return next;
            });
          } else {
            throw new Error('Failed to save response');
          }
        } catch (error) {
          console.error('Failed to save online, saving offline:', error);
          // Fall back to offline storage
          await saveOffline(responseData, audioBlob);
        }
      } else {
        // Save offline
        await saveOffline(responseData, audioBlob);
      }
    } finally {
      setIsSaving(false);
    }
    
    // Helper to save offline
    async function saveOffline(
      data: { questionId: string; sessionId: string; transcription: string; durationSeconds: number },
      blob: Blob | null
    ) {
      await saveResponseOffline({
        id: `${data.questionId}-${Date.now()}`,
        questionId: data.questionId,
        sessionId: data.sessionId,
        transcription: data.transcription,
        durationSeconds: data.durationSeconds,
        audioBlob: blob ?? new Blob(),
        recordedAt: Date.now(),
      });
      
      setQuestionStates((prev) => {
        const next = new Map(prev);
        next.set(data.questionId, {
          answered: true,
          transcription: data.transcription,
          duration: data.durationSeconds,
        });
        return next;
      });
    }
  }, [currentQuestion, session.id, timer, recorder, stt, offlineState.isOnline, saveResponseOffline]);
  
  // Skip current question
  const skipQuestion = useCallback(() => {
    if (recorder.state.status === 'recording') {
      recorder.stopRecording();
      stt.stopListening();
    }
    
    setQuestionStates((prev) => {
      const next = new Map(prev);
      next.set(currentQuestion.id, { answered: false });
      return next;
    });
    
    if (isLastQuestion) {
      setPhase('complete');
    } else {
      setCurrentIndex((i) => i + 1);
      setPhase('question');
      setTimer(0);
    }
  }, [currentQuestion, isLastQuestion, recorder, stt]);
  
  // Move to next question
  const nextQuestion = useCallback(() => {
    if (isLastQuestion) {
      setPhase('complete');
    } else {
      setCurrentIndex((i) => i + 1);
      setPhase('question');
      setTimer(0);
      setQuestionReadComplete(false);
      setHasSpokenStarted(false);
      stt.resetTranscript();
    }
  }, [isLastQuestion, stt]);
  
  // Finish interview
  const finishInterview = useCallback(() => {
    router.push(`/results/${session.id}`);
  }, [router, session.id]);
  
  // =========================================================================
  // Render
  // =========================================================================
  
  // Permissions check - must be granted before starting
  if (!permissionsGranted) {
    return <PermissionsCheck onPermissionsGranted={() => setPermissionsGranted(true)} />;
  }

  // Intro phase
  if (phase === 'intro') {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Ready to Start?</h2>
        <p className="text-gray-600 mb-8">
          You will be asked {questions.length} questions for the <strong>{session.roleTitle}</strong> position.
          Each question will be read aloud, then you can record your response.
        </p>
        
        <div className="bg-blue-50 rounded-lg p-6 mb-8 text-left">
          <h3 className="font-semibold text-blue-900 mb-3">Tips for Success:</h3>
          <ul className="space-y-2 text-blue-800 text-sm">
            <li>✓ Find a quiet environment</li>
            <li>✓ Speak clearly and at a moderate pace</li>
            <li>✓ Structure your answers (situation, approach, result)</li>
            <li>✓ It's okay to take a moment to think before answering</li>
          </ul>
        </div>
        
        <button
          onClick={startInterview}
          className="px-8 py-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 mx-auto"
        >
          <Play className="h-5 w-5" />
          Start Interview
        </button>
      </div>
    );
  }
  
  // Complete phase
  if (phase === 'complete') {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Check className="h-8 w-8 text-green-600" />
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Interview Complete!</h2>
        <p className="text-gray-600 mb-8">
          You answered {answeredCount} of {questions.length} questions.
          {!offlineState.isOnline && offlineState.pendingCount > 0 && (
            <span className="block mt-2 text-yellow-600">
              ⚠️ {offlineState.pendingCount} responses are pending sync.
            </span>
          )}
        </p>
        
        <div className="flex gap-4 justify-center">
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            Back to Home
          </button>
          <button
            onClick={finishInterview}
            className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            View Results
          </button>
        </div>
      </div>
    );
  }
  
  // Question/Recording/Review phases
  return (
    <div className="max-w-3xl mx-auto">
      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex justify-between text-sm text-gray-500 mb-2">
          <span>Question {currentIndex + 1} of {questions.length}</span>
          <span>{answeredCount} answered</span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-600 transition-all duration-300"
            style={{ width: `${(answeredCount / questions.length) * 100}%` }}
          />
        </div>
      </div>
      
      {/* Question card */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        {/* Question header - shows question number, category, topic but not the question text */}
        <div className="p-6 border-b border-gray-100 bg-gray-50">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-bold">
                {currentQuestion.questionNumber}
              </span>
              <div>
                <span className={cn(
                  'inline-block px-2 py-0.5 rounded text-xs font-medium',
                  currentQuestion.category === 'technical' ? 'bg-blue-100 text-blue-700' :
                  currentQuestion.category === 'behavioral' ? 'bg-green-100 text-green-700' :
                  currentQuestion.category === 'system-design' ? 'bg-purple-100 text-purple-700' :
                  'bg-gray-100 text-gray-700'
                )}>
                  {currentQuestion.category}
                </span>
                {currentQuestion.topicName && (
                  <span className="text-xs text-gray-500 ml-2">{currentQuestion.topicName}</span>
                )}
              </div>
            </div>
            
            {phase === 'recording' && (
              <Timer
                seconds={timer}
                maxSeconds={currentQuestion.timeLimit}
                isWarning={isTimeWarning}
              />
            )}
          </div>
        </div>
        
        {/* Action area */}
        <div className="p-6">
          {/* Question phase - AI reads question, then user can record */}
          {phase === 'question' && (
            <div className="text-center space-y-6">
              {/* While AI is speaking - show audio indicator */}
              {tts.state.status === 'speaking' && (
                <div className="bg-blue-50 rounded-lg p-8">
                  <Volume2 className="h-16 w-16 text-blue-600 mx-auto mb-4 animate-pulse" />
                  <p className="text-lg font-medium text-gray-900 mb-2">
                    The AI is reading the question...
                  </p>
                  <p className="text-sm text-gray-600">
                    Listen carefully and get ready to answer
                  </p>
                  <button
                    onClick={() => tts.stop()}
                    className="mt-4 text-sm text-blue-600 hover:text-blue-700 underline"
                  >
                    Stop audio
                  </button>
                </div>
              )}

              {/* After AI finishes speaking - show recording option or already answered message */}
              {tts.state.status === 'idle' && questionReadComplete && (
                <>
                  {questionStates.get(currentQuestion.id)?.answered ? (
                    // Already answered - show option to continue
                    <div className="space-y-4">
                      <div className="bg-blue-50 rounded-lg p-6 mb-4">
                        <Check className="h-12 w-12 text-blue-600 mx-auto mb-3" />
                        <p className="text-gray-900 font-medium">Already answered</p>
                        <p className="text-sm text-gray-600 mt-1">
                          You've already recorded a response for this question. Continue to the next question.
                        </p>
                      </div>

                      <div className="flex items-center justify-center gap-4">
                        <button
                          onClick={nextQuestion}
                          className="inline-flex items-center gap-2 px-8 py-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl"
                        >
                          Continue
                          <ChevronRight className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    // Not answered - show recording option
                    <>
                      <div className="bg-green-50 rounded-lg p-6 mb-4">
                        <Check className="h-12 w-12 text-green-600 mx-auto mb-3" />
                        <p className="text-gray-900 font-medium">Ready to record!</p>
                        <p className="text-sm text-gray-600 mt-1">
                          Press the button when you're ready to answer
                        </p>
                      </div>

                      <div className="flex items-center justify-center gap-4">
                        <button
                          onClick={startRecording}
                          className="inline-flex items-center gap-2 px-8 py-4 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors shadow-lg hover:shadow-xl transform hover:scale-105 transition-transform"
                        >
                          <Mic className="h-6 w-6" />
                          Start Recording
                        </button>
                        
                        <button
                          onClick={skipQuestion}
                          className="inline-flex items-center gap-2 px-4 py-3 text-gray-500 hover:text-gray-700 transition-colors"
                        >
                          <SkipForward className="h-5 w-5" />
                          Skip
                        </button>
                      </div>

                      <button
                        onClick={readQuestion}
                        className="mt-4 text-sm text-blue-600 hover:text-blue-700 underline"
                      >
                        🔁 Repeat question
                      </button>

                      <p className="text-sm text-gray-500 mt-4">
                        Time limit: {formatTime(currentQuestion.timeLimit)}
                      </p>
                    </>
                  )}
                </>
              )}

              {/* While speaking or loading - show disabled button */}
              {(tts.state.status === 'speaking' || tts.state.status === 'loading') && !questionStates.get(currentQuestion.id)?.answered && (
                <div className="space-y-4">
                  <div className="text-center text-gray-600">
                    <p className="text-sm">Listening to the question...</p>
                  </div>

                  <div className="flex items-center justify-center gap-4">
                    <button
                      disabled
                      className="inline-flex items-center gap-2 px-8 py-4 bg-gray-300 text-gray-500 font-semibold rounded-lg cursor-not-allowed opacity-60"
                    >
                      <Mic className="h-6 w-6" />
                      Start Recording
                    </button>
                    
                    <button
                      onClick={skipQuestion}
                      className="inline-flex items-center gap-2 px-4 py-3 text-gray-500 hover:text-gray-700 transition-colors"
                    >
                      <SkipForward className="h-5 w-5" />
                      Skip
                    </button>
                  </div>
                </div>
              )}

              {/* Loading state while initializing TTS */}
              {tts.state.status === 'loading' && (
                <div className="bg-gray-50 rounded-lg p-8">
                  <Loader2 className="h-12 w-12 text-gray-400 mx-auto mb-3 animate-spin" />
                  <p className="text-gray-600">Preparing audio...</p>
                </div>
              )}

              {/* Error state */}
              {tts.state.status === 'error' && (
                <div className="bg-red-50 rounded-lg p-6">
                  <AlertCircle className="h-10 w-10 text-red-600 mx-auto mb-3" />
                  <p className="text-red-900 font-medium mb-2">Error playing audio</p>
                  <p className="text-sm text-red-700 mb-4">{tts.state.error}</p>
                  <button
                    onClick={readQuestion}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    Retry
                  </button>
                </div>
              )}
            </div>
          )}
          
          {/* Recording phase */}
          {phase === 'recording' && (
            <div className="text-center space-y-6">
              <div className="flex items-center justify-center gap-4">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center animate-pulse">
                    <Mic className="h-10 w-10 text-red-600" />
                  </div>
                  <span className="absolute -top-1 -right-1 flex h-4 w-4">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500"></span>
                  </span>
                </div>
                
                <AudioLevelIndicator level={recorder.state.audioLevel} />
              </div>
              
              {/* Live transcription */}
              <div className="bg-gray-50 rounded-lg p-4 min-h-[100px] text-left">
                <p className="text-sm text-gray-500 mb-2">Live transcription:</p>
                <p className="text-gray-900">
                  {stt.state.transcript}
                  <span className="text-gray-400">{stt.state.interimTranscript}</span>
                </p>
              </div>
              
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={stopRecording}
                  className="inline-flex items-center gap-2 px-8 py-4 bg-gray-900 text-white font-semibold rounded-lg hover:bg-gray-800 transition-colors"
                >
                  <Square className="h-5 w-5" />
                  Stop Recording
                </button>
                
                <button
                  onClick={skipQuestion}
                  className="inline-flex items-center gap-2 px-4 py-3 text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <SkipForward className="h-5 w-5" />
                  Skip
                </button>
              </div>
              
              {isTimeWarning && (
                <div className="flex items-center justify-center gap-2 text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm">Time is almost up!</span>
                </div>
              )}
            </div>
          )}
          
          {/* Review phase */}
          {phase === 'review' && (
            <div className="space-y-6">
              {isSaving ? (
                <div className="flex items-center justify-center gap-3 py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                  <span className="text-gray-600">Saving your response...</span>
                </div>
              ) : (
                <>
                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-green-700 mb-2">
                      <Check className="h-5 w-5" />
                      <span className="font-medium">Response recorded</span>
                    </div>
                    <p className="text-sm text-green-600">
                      Duration: {formatTime(timer)}
                    </p>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-500 mb-2">Your response:</p>
                    <p className="text-gray-900">
                      {stt.state.transcript || questionStates.get(currentQuestion.id)?.transcription || 'No transcription available'}
                    </p>
                  </div>
                  
                  {/* Playback if available */}
                  {recorder.state.audioUrl && (
                    <audio controls src={recorder.state.audioUrl} className="w-full" />
                  )}
                  
                  <div className="flex items-center justify-between pt-4">
                    <button
                      onClick={() => {
                        setPhase('question');
                        setTimer(0);
                        recorder.resetRecording();
                        stt.resetTranscript();
                      }}
                      className="inline-flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                    >
                      <MicOff className="h-4 w-4" />
                      Re-record
                    </button>
                    
                    <button
                      onClick={nextQuestion}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      {isLastQuestion ? 'Finish Interview' : 'Next Question'}
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Navigation */}
      <div className="flex items-center justify-between mt-8">
        <button
          onClick={() => {
            if (currentIndex > 0) {
              setCurrentIndex((i) => i - 1);
              setPhase('question');
              setTimer(0);
            }
          }}
          disabled={currentIndex === 0 || phase === 'recording'}
          className="inline-flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="h-5 w-5" />
          Previous
        </button>
        
        <div className="flex items-center gap-2">
          {questions.map((_, i) => {
            const questionState = questionStates.get(questions[i].id);
            const isAnswered = questionState?.answered;
            const isCurrent = i === currentIndex;
            
            // Only show questions that are answered or are the current question
            if (!isAnswered && !isCurrent) return null;
            
            return (
              <button
                key={i}
                onClick={() => {
                  if (phase !== 'recording' && (isAnswered || isCurrent)) {
                    setCurrentIndex(i);
                    setPhase('question');
                    setTimer(0);
                  }
                }}
                disabled={phase === 'recording'}
                className={cn(
                  'w-3 h-3 rounded-full transition-colors',
                  i === currentIndex ? 'bg-blue-600' :
                  isAnswered ? 'bg-green-500' :
                  'bg-gray-300 hover:bg-gray-400'
                )}
                title={`Question ${i + 1}${isAnswered ? ' (Answered)' : isCurrent ? ' (Current)' : ''}`}
              />
            );
          })}
        </div>
        
        <button
          onClick={() => {
            if (currentIndex < questions.length - 1) {
              setCurrentIndex((i) => i + 1);
              setPhase('question');
              setTimer(0);
            }
          }}
          disabled={currentIndex === questions.length - 1 || phase === 'recording'}
          className="inline-flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          Next
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
