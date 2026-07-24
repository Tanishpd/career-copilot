// =========================================================================
// AI Tech Interview - Permissions Check Component
// Verifies microphone and speaker access before starting interview
// =========================================================================

'use client';

import { useState, useEffect } from 'react';
import { Mic, Volume2, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

// =========================================================================
// Types
// =========================================================================

export type PermissionStatus = 'checking' | 'granted' | 'denied';

interface PermissionsCheckProps {
  onPermissionsGranted: () => void;
}

// =========================================================================
// Main Component
// =========================================================================

export function PermissionsCheck({ onPermissionsGranted }: PermissionsCheckProps) {
  const [micStatus, setMicStatus] = useState<PermissionStatus>('checking');
  const [speakerStatus, setSpeakerStatus] = useState<PermissionStatus>('checking');
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    checkPermissions();
  }, []);

  async function checkPermissions() {
    // Check microphone permission
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        } 
      });
      
      // Stop the stream immediately after verification
      stream.getTracks().forEach(track => track.stop());
      
      setMicStatus('granted');
    } catch (error) {
      console.error('Microphone permission denied:', error);
      setMicStatus('denied');
    }

    // Check speaker/audio output capability
    try {
      if (typeof AudioContext !== 'undefined' || typeof (window as any).webkitAudioContext !== 'undefined') {
        const AudioContextClass = AudioContext || (window as any).webkitAudioContext;
        const audioContext = new AudioContextClass();
        await audioContext.close();
        setSpeakerStatus('granted');
      } else {
        setSpeakerStatus('denied');
      }
    } catch (error) {
      console.error('Speaker/AudioContext check failed:', error);
      setSpeakerStatus('denied');
    }
  }

  const allGranted = micStatus === 'granted' && speakerStatus === 'granted';

  useEffect(() => {
    if (allGranted) {
      // Small delay to show the success state
      const timer = setTimeout(() => {
        onPermissionsGranted();
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [allGranted, onPermissionsGranted]);

  const handleRetry = async () => {
    setIsRetrying(true);
    setMicStatus('checking');
    setSpeakerStatus('checking');
    
    await checkPermissions();
    
    setIsRetrying(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            {allGranted ? (
              <CheckCircle className="h-8 w-8 text-green-600" />
            ) : (
              <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
            )}
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {allGranted ? 'Permissions Granted!' : 'Checking Permissions'}
          </h2>
          <p className="text-sm text-gray-600">
            {allGranted 
              ? 'All set to start the interview'
              : 'We need access to your microphone and speakers'
            }
          </p>
        </div>
        
        <div className="space-y-3 mb-6">
          <PermissionItem
            icon={<Mic className="h-6 w-6" />}
            label="Microphone"
            status={micStatus}
            description="To record your answers"
          />
          <PermissionItem
            icon={<Volume2 className="h-6 w-6" />}
            label="Speakers / Headphones"
            status={speakerStatus}
            description="To play the questions"
          />
        </div>

        {(micStatus === 'denied' || speakerStatus === 'denied') && (
          <div className="bg-red-50 rounded-lg p-4 mb-4">
            <div className="flex gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-red-900 text-sm">Permissions Required</p>
                <p className="text-sm text-red-700 mt-1">
                  {micStatus === 'denied' && speakerStatus === 'denied' 
                    ? 'You must allow microphone access and verify that your speakers/headphones work.'
                    : micStatus === 'denied'
                    ? 'You must allow microphone access to continue.'
                    : 'You must have speakers or headphones connected.'
                  }
                </p>
                <ul className="text-xs text-red-600 mt-2 space-y-1 list-disc list-inside">
                  <li>Click the permissions icon in the address bar</li>
                  <li>Allow microphone access</li>
                  <li>Reload the page or press "Retry"</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {(micStatus === 'denied' || speakerStatus === 'denied') && (
          <button
            onClick={handleRetry}
            disabled={isRetrying}
            className="w-full px-4 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRetrying ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Checking...
              </span>
            ) : (
              'Retry'
            )}
          </button>
        )}

        {allGranted && (
          <div className="text-center text-sm text-green-600 font-medium animate-pulse">
            Starting interview...
          </div>
        )}
      </div>
    </div>
  );
}

// =========================================================================
// Permission Item Sub-component
// =========================================================================

interface PermissionItemProps {
  icon: React.ReactNode;
  label: string;
  status: PermissionStatus;
  description: string;
}

function PermissionItem({ icon, label, status, description }: PermissionItemProps) {
  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
      <div className="flex items-start gap-3 flex-1">
        <div className={`mt-1 ${
          status === 'granted' ? 'text-green-600' :
          status === 'denied' ? 'text-red-600' :
          'text-gray-400'
        }`}>
          {icon}
        </div>
        <div className="flex-1">
          <p className="font-medium text-gray-900 text-sm">{label}</p>
          <p className="text-xs text-gray-500 mt-0.5">{description}</p>
        </div>
      </div>
      
      <div className="ml-3 flex-shrink-0">
        {status === 'checking' && (
          <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
        )}
        {status === 'granted' && (
          <CheckCircle className="h-5 w-5 text-green-600" />
        )}
        {status === 'denied' && (
          <AlertCircle className="h-5 w-5 text-red-600" />
        )}
      </div>
    </div>
  );
}
