// =========================================================================
// AI Tech Interview - Audio Recorder Hook
// Record audio from the microphone with visualization support
// =========================================================================

'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

// =========================================================================
// Types
// =========================================================================

export type RecordingStatus = 'idle' | 'recording' | 'paused' | 'stopped';

export interface AudioRecorderState {
  status: RecordingStatus;
  duration: number;
  audioBlob: Blob | null;
  audioUrl: string | null;
  error: string | null;
  audioLevel: number; // 0-100 for visualization
}

export interface UseAudioRecorderReturn {
  state: AudioRecorderState;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<Blob | null>;
  pauseRecording: () => void;
  resumeRecording: () => void;
  resetRecording: () => void;
  isSupported: boolean;
}

// =========================================================================
// Constants
// =========================================================================

const AUDIO_MIME_TYPE = 'audio/webm;codecs=opus';
const FALLBACK_MIME_TYPE = 'audio/webm';

// =========================================================================
// Hook Implementation
// =========================================================================

export function useAudioRecorder(): UseAudioRecorderReturn {
  const [state, setState] = useState<AudioRecorderState>({
    status: 'idle',
    duration: 0,
    audioBlob: null,
    audioUrl: null,
    error: null,
    audioLevel: 0,
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const durationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Check browser support
  const isSupported = typeof window !== 'undefined' && 
    'MediaRecorder' in window && 
    'mediaDevices' in navigator;

  // Get supported MIME type
  const getMimeType = useCallback(() => {
    if (typeof MediaRecorder === 'undefined') return FALLBACK_MIME_TYPE;
    
    if (MediaRecorder.isTypeSupported(AUDIO_MIME_TYPE)) {
      return AUDIO_MIME_TYPE;
    }
    return FALLBACK_MIME_TYPE;
  }, []);

  // Update audio level for visualization
  const updateAudioLevel = useCallback(() => {
    if (!analyserRef.current) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);

    // Calculate average audio level
    const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
    const level = Math.min(100, Math.round((average / 255) * 100));

    setState((prev) => ({ ...prev, audioLevel: level }));

    if (state.status === 'recording') {
      animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
    }
  }, [state.status]);

  // Start recording
  const startRecording = useCallback(async () => {
    if (!isSupported) {
      setState((prev) => ({
        ...prev,
        error: 'Audio recording is not supported in this browser',
      }));
      return;
    }

    try {
      // Reset state
      chunksRef.current = [];
      setState({
        status: 'recording',
        duration: 0,
        audioBlob: null,
        audioUrl: null,
        error: null,
        audioLevel: 0,
      });

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      streamRef.current = stream;

      // Set up audio analysis for visualization
      audioContextRef.current = new AudioContext();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      source.connect(analyserRef.current);

      // Create MediaRecorder
      const mimeType = getMimeType();
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;

      // Handle data available
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      // Handle recording stop
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const url = URL.createObjectURL(blob);

        setState((prev) => ({
          ...prev,
          status: 'stopped',
          audioBlob: blob,
          audioUrl: url,
        }));
      };

      // Start recording
      mediaRecorder.start(100); // Collect data every 100ms

      // Start duration timer
      durationIntervalRef.current = setInterval(() => {
        setState((prev) => ({ ...prev, duration: prev.duration + 1 }));
      }, 1000);

      // Start audio level updates
      updateAudioLevel();
    } catch (error) {
      console.error('Failed to start recording:', error);
      setState((prev) => ({
        ...prev,
        status: 'idle',
        error: error instanceof Error ? error.message : 'Failed to access microphone',
      }));
    }
  }, [isSupported, getMimeType, updateAudioLevel]);

  // Stop recording
  const stopRecording = useCallback(async (): Promise<Blob | null> => {
    return new Promise((resolve) => {
      if (!mediaRecorderRef.current || state.status !== 'recording') {
        resolve(null);
        return;
      }

      // Clear intervals and animation frames
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }

      // Set up one-time listener for the blob
      const currentRecorder = mediaRecorderRef.current;
      const originalOnStop = currentRecorder.onstop;
      
      currentRecorder.onstop = (event) => {
        // Call original handler
        if (originalOnStop) {
          originalOnStop.call(currentRecorder, event);
        }

        // Get the blob
        const mimeType = getMimeType();
        const blob = new Blob(chunksRef.current, { type: mimeType });
        resolve(blob);
      };

      // Stop the recorder
      currentRecorder.stop();

      // Stop all tracks
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }

      // Close audio context
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
    });
  }, [state.status, getMimeType]);

  // Pause recording
  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && state.status === 'recording') {
      mediaRecorderRef.current.pause();
      setState((prev) => ({ ...prev, status: 'paused' }));

      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    }
  }, [state.status]);

  // Resume recording
  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && state.status === 'paused') {
      mediaRecorderRef.current.resume();
      setState((prev) => ({ ...prev, status: 'recording' }));

      // Resume duration timer
      durationIntervalRef.current = setInterval(() => {
        setState((prev) => ({ ...prev, duration: prev.duration + 1 }));
      }, 1000);

      // Resume audio level updates
      updateAudioLevel();
    }
  }, [state.status, updateAudioLevel]);

  // Reset recording
  const resetRecording = useCallback(() => {
    // Clean up
    if (mediaRecorderRef.current && state.status === 'recording') {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    // Revoke old URL
    if (state.audioUrl) {
      URL.revokeObjectURL(state.audioUrl);
    }

    // Reset state
    chunksRef.current = [];
    setState({
      status: 'idle',
      duration: 0,
      audioBlob: null,
      audioUrl: null,
      error: null,
      audioLevel: 0,
    });
  }, [state.status, state.audioUrl]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      if (state.audioUrl) {
        URL.revokeObjectURL(state.audioUrl);
      }
    };
  }, [state.audioUrl]);

  return {
    state,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    resetRecording,
    isSupported,
  };
}
