// =========================================================================
// AI Tech Interview - Azure Speech Service Utilities
// =========================================================================

// Note: The Speech SDK is used client-side in the browser.
// This file provides server-side utilities for token generation.

/**
 * Environment variable names for Azure Speech
 */
const AZURE_SPEECH_KEY = 'AZURE_SPEECH_KEY';
const AZURE_SPEECH_REGION = 'AZURE_SPEECH_REGION';

/**
 * Get Azure Speech configuration from environment
 */
export function getSpeechConfig() {
  const key = process.env[AZURE_SPEECH_KEY];
  const region = process.env[AZURE_SPEECH_REGION];

  if (!key || !region) {
    throw new Error(
      `Missing Azure Speech configuration. Required: ${AZURE_SPEECH_KEY}, ${AZURE_SPEECH_REGION}`
    );
  }

  return { key, region };
}

/**
 * Generate a short-lived authorization token for the Speech SDK.
 * Tokens are valid for 10 minutes.
 */
export async function generateSpeechToken(): Promise<{
  token: string;
  region: string;
  expiresAt: string;
}> {
  const { key, region } = getSpeechConfig();

  const tokenEndpoint = `https://${region}.api.cognitive.microsoft.com/sts/v1.0/issueToken`;

  const response = await fetch(tokenEndpoint, {
    method: 'POST',
    headers: {
      'Ocp-Apim-Subscription-Key': key,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get speech token: ${response.status} - ${error}`);
  }

  const token = await response.text();

  // Token is valid for 10 minutes
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  return {
    token,
    region,
    expiresAt,
  };
}

/**
 * Recommended TTS voice for interview questions
 */
export const RECOMMENDED_VOICE = 'en-US-AvaMultilingualNeural';

/**
 * Available TTS voices for different scenarios
 */
export const TTS_VOICES = {
  // Natural, clear female voice (recommended)
  default: 'en-US-AvaMultilingualNeural',
  // Alternative female voice
  female: 'en-US-JennyNeural',
  // Male voice option
  male: 'en-US-GuyNeural',
  // Professional female voice
  professional: 'en-US-AriaNeural',
} as const;

/**
 * Speech recognition language configuration
 */
export const STT_CONFIG = {
  language: 'en-US',
  // Enable automatic punctuation
  enablePunctuation: true,
  // Enable profanity filter
  profanityOption: 'masked' as const,
};

/**
 * Audio format configuration for TTS
 */
export const TTS_AUDIO_CONFIG = {
  // Good quality, low latency
  format: 'audio-24khz-48kbitrate-mono-mp3',
  // Alternative: Higher quality
  highQuality: 'audio-48khz-96kbitrate-mono-mp3',
};
