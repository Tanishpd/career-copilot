import { useState, useEffect, useRef, useCallback } from 'react';

export const useVoiceInterview = () => {
    const [isListening, setIsListening] = useState(false); // Actual low-level state
    const [isEnabled, setIsEnabled] = useState(false);     // User preference (Mic On/Off)
    const [transcript, setTranscript] = useState('');
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [voiceSupported, setVoiceSupported] = useState(false);
    const [error, setError] = useState(null);

    const recognitionRef = useRef(null);
    const synthesisRef = useRef(window.speechSynthesis);

    // Initialize Recognition
    useEffect(() => {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            setVoiceSupported(true);
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            const recognition = new SpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = 'en-US';

            recognition.onresult = (event) => {
                let finalTranscript = '';
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        finalTranscript += event.results[i][0].transcript;
                    }
                }
                if (finalTranscript) {
                    setTranscript(finalTranscript);
                }
            };

            recognition.onerror = (event) => {
                // Ignore 'no-speech' errors as they are common
                if (event.error !== 'no-speech') {
                    console.error('Speech recognition error', event.error);
                }
                if (event.error === 'not-allowed') {
                    setError('Microphone access denied');
                    setIsEnabled(false);
                }
            };

            // Handle expected/unexpected stops
            recognition.onend = () => {
                setIsListening(false);
            };

            recognitionRef.current = recognition;
        } else {
            setError('Voice recognition not supported in this browser.');
        }

        return () => {
            if (recognitionRef.current) recognitionRef.current.stop();
            if (synthesisRef.current) synthesisRef.current.cancel();
        };
    }, []);

    // Manage Listening State based on Enabled + Speaking
    useEffect(() => {
        if (!recognitionRef.current) return;

        const shouldBeListening = isEnabled && !isSpeaking;

        if (shouldBeListening && !isListening) {
            try {
                recognitionRef.current.start();
                setIsListening(true);
            } catch (e) {
                // Already started or busy
            }
        } else if (!shouldBeListening && isListening) {
            recognitionRef.current.stop();
            setIsListening(false);
        }
    }, [isEnabled, isSpeaking, isListening]);


    const startListening = useCallback(() => {
        setIsEnabled(true);
        setError(null);
    }, []);

    const stopListening = useCallback(() => {
        setIsEnabled(false);
    }, []);

    // Ref to hold the utterance to prevent GC
    const utteranceRef = useRef(null);

    const speak = useCallback((text) => {
        if (!synthesisRef.current) return;

        // Cancel any current speech
        synthesisRef.current.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US';

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);

        utteranceRef.current = utterance; // KEEP A REFERENCE
        synthesisRef.current.speak(utterance);
    }, []);

    const resetTranscript = useCallback(() => {
        setTranscript('');
    }, []);

    return {
        isListening: isEnabled, // Return the user-facing state
        isActualListening: isListening, // For debug if needed
        transcript,
        isSpeaking,
        voiceSupported,
        error,
        startListening,
        stopListening,
        speak,
        resetTranscript
    };
};
