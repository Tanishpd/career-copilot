// =========================================================================
// AI Tech Interview - Speech Token API Route
// GET: Get a short-lived authorization token for the browser Speech SDK
// =========================================================================

import { NextResponse } from 'next/server';
import { generateSpeechToken } from '@/lib/azure-speech';
import type { ApiResponse, SpeechTokenResponse } from '@/types/api';

/**
 * GET /api/speech/token
 * Generate a short-lived token for browser-side Speech SDK
 */
export async function GET(): Promise<NextResponse<ApiResponse<SpeechTokenResponse>>> {
  try {
    const tokenData = await generateSpeechToken();

    return NextResponse.json({
      success: true,
      data: tokenData,
    });
  } catch (error) {
    console.error('Error generating speech token:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'TOKEN_GENERATION_FAILED',
          message: error instanceof Error ? error.message : 'Failed to generate speech token',
        },
      },
      { status: 500 }
    );
  }
}
