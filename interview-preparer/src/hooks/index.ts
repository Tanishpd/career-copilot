// =========================================================================
// AI Tech Interview - Hooks Barrel Export
// =========================================================================

// Offline support
export { useOfflineSupport } from './useOfflineSupport';
export type {
  OfflineState,
  SyncResult,
  UseOfflineSupportReturn,
} from './useOfflineSupport';

// Audio recording
export { useAudioRecorder } from './useAudioRecorder';
export type {
  RecordingStatus,
  AudioRecorderState,
  UseAudioRecorderReturn,
} from './useAudioRecorder';

// Speech synthesis (TTS)
export { useSpeechSynthesis } from './useSpeechSynthesis';
export type {
  SpeechStatus,
  SpeechSynthesisState,
  UseSpeechSynthesisReturn,
} from './useSpeechSynthesis';

// Speech recognition (STT)
export { useSpeechRecognition } from './useSpeechRecognition';
export type {
  RecognitionStatus,
  SpeechRecognitionState,
  UseSpeechRecognitionReturn,
} from './useSpeechRecognition';
