// =========================================================================
// AI Tech Interview - Speech Recognition Hook
// Speech-to-text using Deepgram SDK
// =========================================================================

'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { createClient, LiveTranscriptionEvents } from '@deepgram/sdk';
import type { LiveClient } from '@deepgram/sdk';

// =========================================================================
// Types
// =========================================================================

export type RecognitionStatus = 'idle' | 'loading' | 'listening' | 'processing' | 'error';

export interface SpeechRecognitionState {
  status: RecognitionStatus;
  transcript: string;
  interimTranscript: string;
  error: string | null;
}

export interface UseSpeechRecognitionReturn {
  state: SpeechRecognitionState;
  startListening: () => Promise<void>;
  stopListening: () => Promise<string>;
  resetTranscript: () => void;
  isSupported: boolean;
}

// =========================================================================
// Hook Implementation
// =========================================================================

export function useSpeechRecognition(): UseSpeechRecognitionReturn {
  const [state, setState] = useState<SpeechRecognitionState>({
    status: 'idle',
    transcript: '',
    interimTranscript: '',
    error: null,
  });

  const connectionRef = useRef<LiveClient | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const transcriptRef = useRef<string>('');
  const statusRef = useRef<RecognitionStatus>('idle');

  // Check browser support
  const isSupported = typeof window !== 'undefined' && 
    'mediaDevices' in navigator &&
    typeof MediaRecorder !== 'undefined';

  // Start listening
  const startListening = useCallback(async () => {
    if (!isSupported) {
      setState((prev) => ({
        ...prev,
        status: 'error',
        error: 'Speech recognition is not supported in this browser',
      }));
      return;
    }

    try {
      setState((prev) => ({
        ...prev,
        status: 'loading',
        error: null,
      }));

      // Reset transcript
      transcriptRef.current = '';
      setState((prev) => ({
        ...prev,
        transcript: '',
        interimTranscript: '',
      }));

      // Get API key from environment
      const apiKey = process.env.NEXT_PUBLIC_DEEPGRAM_API_KEY;
      if (!apiKey) {
        throw new Error('Deepgram API key not configured');
      }

      // Create Deepgram client
      const deepgram = createClient(apiKey);

      // Connect to Deepgram's live transcription
      const connection = deepgram.listen.live({
        model: 'nova-2',
        language: 'en-US',
        smart_format: true,
        interim_results: true,
        punctuate: true,
        diarize: false,
      });

      connectionRef.current = connection;

      // Handle connection events
      connection.on(LiveTranscriptionEvents.Open, () => {
        console.log('Deepgram connection opened');
        statusRef.current = 'listening';
        setState((prev) => ({ ...prev, status: 'listening' }));
      });

      connection.on(LiveTranscriptionEvents.Transcript, (data) => {
        const transcript = data.channel?.alternatives?.[0]?.transcript;
        if (transcript && transcript.length > 0) {
          const isFinal = data.is_final;
          
          if (isFinal) {
            // Final transcript - add to the complete transcript
            transcriptRef.current += (transcriptRef.current ? ' ' : '') + transcript;
            setState((prev) => ({
              ...prev,
              transcript: transcriptRef.current,
              interimTranscript: '',
            }));
          } else {
            // Interim transcript - show as preview
            setState((prev) => ({
              ...prev,
              interimTranscript: transcript,
            }));
          }
        }
      });

      connection.on(LiveTranscriptionEvents.Error, (error) => {
        console.error('Deepgram error:', error);
        setState((prev) => ({
          ...prev,
          status: 'error',
          error: 'Speech recognition error occurred',
        }));
      });

      connection.on(LiveTranscriptionEvents.Close, () => {
        console.log('Deepgram connection closed');
        setState((prev) => ({
          ...prev,
          status: 'idle',
          interimTranscript: '',
        }));
      });

      // Get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Create MediaRecorder to capture audio
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm',
      });

      mediaRecorderRef.current = mediaRecorder;

      // Send audio data to Deepgram
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0 && connection.getReadyState() === 1) {
          connection.send(event.data);
        }
      };

      // Start recording in chunks
      mediaRecorder.start(250); // Send audio every 250ms

    } catch (error) {
      console.error('Failed to start listening:', error);
      setState((prev) => ({
        ...prev,
        status: 'error',
        error: error instanceof Error ? error.message : 'Failed to start listening',
      }));
    }
  }, [isSupported]);

  // Stop listening
  const stopListening = useCallback(async (): Promise<string> => {
    if (statusRef.current !== 'listening') {
      return transcriptRef.current;
    }

    statusRef.current = 'processing';
    setState((prev) => ({ ...prev, status: 'processing' }));

    // Stop media recorder
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      mediaRecorderRef.current = null;
    }

    // Give Deepgram ~800ms to send back any remaining final transcription results
    await new Promise((resolve) => setTimeout(resolve, 800));

    // Close Deepgram connection
    if (connectionRef.current) {
      connectionRef.current.finish();
      connectionRef.current = null;
    }

    statusRef.current = 'idle';
    setState((prev) => ({
      ...prev,
      status: 'idle',
      interimTranscript: '',
    }));

    return transcriptRef.current;
  }, []);

  // Reset transcript
  const resetTranscript = useCallback(() => {
    transcriptRef.current = '';
    setState((prev) => ({
      ...prev,
      transcript: '',
      interimTranscript: '',
      error: null,
    }));
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      }
      if (connectionRef.current) {
        connectionRef.current.finish();
      }
    };
  }, []);

  return {
    state,
    startListening,
    stopListening,
    resetTranscript,
    isSupported,
  };
}
