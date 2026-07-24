// =========================================================================
// AI Tech Interview - Speech Synthesis Hook
// Text-to-speech using Web Speech API (browser native)
// =========================================================================

'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

// =========================================================================
// Types
// =========================================================================

export type SpeechStatus = 'idle' | 'loading' | 'speaking' | 'paused' | 'error';

export interface SpeechSynthesisState {
  status: SpeechStatus;
  error: string | null;
  currentText: string | null;
}

export interface UseSpeechSynthesisReturn {
  state: SpeechSynthesisState;
  speak: (text: string) => Promise<void>;
  stop: () => void;
  pause: () => void;
  resume: () => void;
  isSupported: boolean;
}

// =========================================================================
// Hook Implementation
// =========================================================================

export function useSpeechSynthesis(): UseSpeechSynthesisReturn {
  const [state, setState] = useState<SpeechSynthesisState>({
    status: 'idle',
    error: null,
    currentText: null,
  });

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Check browser support
  const isSupported =
    typeof window !== 'undefined' &&
    ('speechSynthesis' in window || 'webkitSpeechSynthesis' in window);

  // Speak function using Web Speech API
  const speak = useCallback(
    async (text: string) => {
      if (!isSupported) {
        setState((prev) => ({
          ...prev,
          status: 'error',
          error: 'Speech synthesis is not supported in this browser',
        }));
        return;
      }

      try {
        setState((prev) => ({
          ...prev,
          status: 'loading',
          error: null,
          currentText: text,
        }));

        const synth =
          window.speechSynthesis || (window as any).webkitSpeechSynthesis;

        // Cancel any existing speech
        synth.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;

        utterance.onstart = () => {
          setState((prev) => ({ ...prev, status: 'speaking' }));
        };

        utterance.onend = () => {
          setState((prev) => ({
            ...prev,
            status: 'idle',
            currentText: null,
          }));
        };

        utterance.onerror = (event) => {
          // 'interrupted' is benign — happens when synth.cancel() cuts off prior speech
          if (event.error === 'interrupted') return;
          console.error('Speech synthesis error:', event.error);
          setState((prev) => ({
            ...prev,
            status: 'error',
            error: `Speech synthesis error: ${event.error}`,
            currentText: null,
          }));
        };

        utteranceRef.current = utterance;
        synth.speak(utterance);
      } catch (error) {
        console.error('Failed to speak:', error);
        setState((prev) => ({
          ...prev,
          status: 'error',
          error: error instanceof Error ? error.message : 'Failed to speak',
          currentText: null,
        }));
      }
    },
    [isSupported]
  );

  // Stop speaking
  const stop = useCallback(() => {
    if (typeof window !== 'undefined') {
      const synth =
        window.speechSynthesis || (window as any).webkitSpeechSynthesis;
      synth.cancel();
    }
    setState((prev) => ({
      ...prev,
      status: 'idle',
      currentText: null,
    }));
  }, []);

  // Pause speaking
  const pause = useCallback(() => {
    if (typeof window !== 'undefined') {
      const synth =
        window.speechSynthesis || (window as any).webkitSpeechSynthesis;
      if (synth.speaking) {
        synth.pause();
        setState((prev) => ({ ...prev, status: 'paused' }));
      }
    }
  }, []);

  // Resume speaking
  const resume = useCallback(() => {
    if (typeof window !== 'undefined') {
      const synth =
        window.speechSynthesis || (window as any).webkitSpeechSynthesis;
      if (synth.paused) {
        synth.resume();
        setState((prev) => ({ ...prev, status: 'speaking' }));
      }
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined') {
        const synth =
          window.speechSynthesis || (window as any).webkitSpeechSynthesis;
        synth.cancel();
      }
    };
  }, []);

  return {
    state,
    speak,
    stop,
    pause,
    resume,
    isSupported,
  };
}
