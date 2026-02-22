import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { candidateAPI } from '../../utils/api';
import Editor from '@monaco-editor/react';
import { io } from 'socket.io-client';
import { monitoringService } from '../../utils/monitoringService';
import { useVoiceInterview } from '../../hooks/useVoiceInterview';
import { CodeAnalyzer } from '../../utils/CodeAnalyzer';
import { InterviewFlowController } from '../../utils/InterviewFlowController'; // Import Controller
import './ExamInterface.css';

export const ExamInterface = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [session, setSession] = useState(null);
    const [currentQuestion, setCurrentQuestion] = useState(null);
    const [language, setLanguage] = useState('javascript');
    const [code, setCode] = useState('// Write your code here\n');
    const [output, setOutput] = useState('');
    const [isRunning, setIsRunning] = useState(false);
    const [theme, setTheme] = useState('vs-dark');
    const [aiMessages, setAiMessages] = useState([]); // Used for Transcript
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Call State
    const [isInCall, setIsInCall] = useState(false);
    const [isJoined, setIsJoined] = useState(false);
    const [cameraEnabled, setCameraEnabled] = useState(false);
    const videoRef = useRef(null);

    // Voice Interface
    const {
        isListening,
        transcript,
        isSpeaking,
        startListening,
        stopListening,
        speak,
        resetTranscript
    } = useVoiceInterview();

    // Anti-Cheating State
    const [warnings, setWarnings] = useState(0);
    const [showWarningModal, setShowWarningModal] = useState(false);
    const [violationType, setViolationType] = useState('');

    const [startTime, setStartTime] = useState(null);
    const [interactionHistory, setInteractionHistory] = useState([]);
    const [codeChanges, setCodeChanges] = useState([]);
    const socketRef = useRef(null);
    const previousCodeRef = useRef('');

    // Refs for safe access in timeouts/callbacks
    const sessionRef = useRef(null);
    const userRef = useRef(user);

    // Code Analyzer Integration
    const analyzerRef = useRef(null);
    if (!analyzerRef.current) {
        analyzerRef.current = new CodeAnalyzer((signal) => {
            // Signal detected -> Emit to AI
            if (socketRef.current && sessionRef.current) {
                console.log('[ExamInterface] Sending AI Signal:', signal);
                socketRef.current.emit('code-change', {
                    sessionId: sessionRef.current._id,
                    ...signal, // { type, intent, codeSnippet, fullCode }
                    state: 'CODE_WRITING',
                    timestamp: new Date()
                });
            }
        });
    }

    // Interview Flow Controller
    const flowController = useRef(new InterviewFlowController());

    useEffect(() => {
        loadSession();
        setupSocket();

        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
            monitoringService.cleanup();
            stopListening();
            if (videoRef.current && videoRef.current.srcObject) {
                videoRef.current.srcObject.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    // Update refs when state changes
    useEffect(() => { sessionRef.current = session; }, [session]);

    // Voice Buffering Logic
    const voiceBufferRef = useRef('');
    const silenceTimerRef = useRef(null);

    // Handle Transcript -> Buffer -> Send after Silence
    useEffect(() => {
        if (transcript && isJoinedRef.current) {
            // 1. Add to buffer
            voiceBufferRef.current += (voiceBufferRef.current ? ' ' : '') + transcript;

            // 2. Clear existing timer
            if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);

            // 3. Set new "Silence Timer" (2.5s)
            silenceTimerRef.current = setTimeout(() => {
                sendBufferedVoice();
            }, 2500);
        }
    }, [transcript]);

    const sendBufferedVoice = () => {
        const text = voiceBufferRef.current;
        if (!text.trim()) return;

        // Reset buffer immediately
        voiceBufferRef.current = '';

        // Process with Flow Controller
        const flowResult = flowController.current.processInput(text);

        // Add to transcript UI
        const message = {
            type: 'candidate',
            content: text,
            timestamp: new Date()
        };
        setAiMessages(prev => [...prev, message]);
        setInteractionHistory(prev => [...prev, {
            timestamp: message.timestamp,
            type: 'candidate-response',
            content: text
        }]);

        if (flowResult.action === 'TRANSITION' || flowResult.action === 'FINISH') {
            // 1. Speak the fixed response
            if (flowResult.response) {
                addAiMessage('reply', flowResult.response);
                speak(flowResult.response);
            }

            // 2. Log internally (mock emit so backend history is consistent if needed, or just skip)
            // We'll emit a specific event so backend knows state changed, OR just log it.
            // For now, let's just log efficiently and maybe tell backend about the state change if we had an event for it.
            // We will treat this as a "system" intercepted response.

            if (socketRef.current && sessionRef.current) {
                socketRef.current.emit('candidate-response', {
                    sessionId: sessionRef.current._id,
                    response: text, // The "I am done" or complexity answer
                    timestamp: message.timestamp,
                    isVoice: true,
                    interactionHistory: [...interactionHistory, message],
                    // We might add a flag here to tell Backend LLM *NOT* to reply if we want to be safe,
                    // but since we are NOT emitting the standard event below, the backend won't trigger LLM!
                    // Wait, we need to save this to DB history though? 
                    // Let's assume 'candidate-response' triggers LLM. So we should NOT emit it if we want to silence LLM.
                    // We will emit a 'log-interaction' or just skip for now to satisfy the "Frontend Middle Layer" requirement securely.
                });
            }
        }
        else {
            // PASS: Normal logic, send to LLM
            if (socketRef.current && sessionRef.current) {
                socketRef.current.emit('candidate-response', {
                    sessionId: sessionRef.current._id,
                    response: text,
                    timestamp: message.timestamp,
                    isVoice: true,
                    interactionHistory: [...interactionHistory, message],
                    questionContext: currentQuestion ? {
                        title: currentQuestion.title,
                        description: currentQuestion.description,
                        type: currentQuestion.category
                    } : null
                });
            }
        }

        resetTranscript();
    };

    // Legacy direct handler (kept for manual text input if added later)
    const handleVoiceInput = (text) => { /* Replaced by buffer logic */ };

    const handleViolation = async (violation) => {
        setWarnings(prev => prev + 1);
        setViolationType(violation.message);
        setShowWarningModal(true);
        try {
            await candidateAPI.logViolation({
                type: violation.type,
                metadata: violation.message
            });
        } catch (error) {
            console.error('Failed to log violation:', error);
        }
    };

    const isJoinedRef = useRef(isJoined);
    useEffect(() => { isJoinedRef.current = isJoined; }, [isJoined]);

    const setupSocket = () => {
        socketRef.current = io('http://localhost:5001');

        socketRef.current.on('connect', () => {
            console.log('Connected to AI interviewer');
        });

        socketRef.current.on('ai-interview-question', (data) => {
            addAiMessage('question', data.question);
            if (isJoinedRef.current) speak(data.question);
        });

        socketRef.current.on('ai-explanation', (data) => {
            addAiMessage('explanation', data.explanation);
            if (isJoinedRef.current) speak(data.explanation);
        });

        socketRef.current.on('hint-provided', (data) => {
            const text = `Hint: ${data.hint}`;
            addAiMessage('hint', text);
            if (isJoinedRef.current) speak(text);
        });

        socketRef.current.on('ai-voice-response', (data) => {
            addAiMessage('reply', data.content);
            if (isJoinedRef.current) speak(data.content);
        });
    };

    const addAiMessage = (type, content) => {
        setAiMessages(prev => [...prev, {
            type: 'ai',
            content: content,
            timestamp: new Date()
        }]);
        setInteractionHistory(prev => [...prev, {
            timestamp: new Date(),
            type: `ai-${type}`,
            content: content
        }]);
    };

    const loadSession = async () => {
        try {
            const sessionRes = await candidateAPI.getActiveSession();
            const sessionData = sessionRes.data.data.session;
            setSession(sessionData);

            if (sessionData.status === 'pending') {
                await candidateAPI.startSession();
                setStartTime(new Date());
            }

            if (sessionData.assignedQuestions.length > 0) {
                const firstQuestionId = sessionData.assignedQuestions[0].questionId._id;
                loadQuestion(firstQuestionId, sessionData); // Pass sessionData to avoid stale state in closure
            }

            setWarnings(sessionData.warningCount || 0);
            monitoringService.init(handleViolation, 5);
            // Don't auto-fullscreen yet, waiting for "Join Call"
        } catch (error) {
            console.error('Error loading session:', error);
        } finally {
            setLoading(false);
        }
    };

    // State for all questions (cached)
    const answersRef = useRef({});
    const saveTimeoutRef = useRef(null);

    // Load initial state from session
    useEffect(() => {
        if (session && session.assignedQuestions) {
            session.assignedQuestions.forEach(q => {
                if (q.draftCode) {
                    answersRef.current[q.questionId._id] = {
                        code: q.draftCode,
                        language: q.language || 'javascript'
                    };
                }
            });
        }
    }, [session]);

    const loadQuestion = async (questionId, currentSession = session) => {
        // Javascript is single threaded, but let's be safe: PAUSE monitoring
        monitoringService.pause();

        if (currentQuestion) {
            answersRef.current[currentQuestion.id] = { code, language };
        }

        try {
            const response = await candidateAPI.getQuestion(questionId);
            const { question, aiExplanation } = response.data.data;
            setCurrentQuestion(question);

            // RESTORE STATE or SET TEMPLATE for new question
            if (answersRef.current[question.id]) {
                const savedState = answersRef.current[question.id];
                setLanguage(savedState.language || 'javascript');
                setCode(savedState.code || (question.codeTemplates?.[savedState.language] || '// Write your code here\n'));
            } else {
                setLanguage('javascript');
                // Use JS template if available, else default
                setCode(question.codeTemplates?.['javascript'] || '// Write your code here\n');
            }

            setOutput('');
            setOutputType('normal');

            // Initial AI Explanation (spoken only if joined)
            if (isJoined) {
                addAiMessage('explanation', aiExplanation);
                speak(aiExplanation);
            }


            if (socketRef.current && currentSession) {
                socketRef.current.emit('join-interview', {
                    sessionId: currentSession._id,
                    candidateId: userRef.current.id
                });
            }
        } catch (error) {
            console.error('Error loading question:', error);
        } finally {
            setTimeout(() => monitoringService.resume(), 500);
        }
    };

    const handleCodeChange = (value) => {
        setCode(value);

        if (currentQuestion) {
            if (!answersRef.current[currentQuestion.id]) {
                answersRef.current[currentQuestion.id] = {};
            }
            answersRef.current[currentQuestion.id].code = value;
            answersRef.current[currentQuestion.id].language = language;
        }

        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

        saveTimeoutRef.current = setTimeout(async () => {
            if (currentQuestion && session) {
                try {
                    await candidateAPI.saveProgress({
                        questionId: currentQuestion.id,
                        code: value,
                        language
                    });
                } catch (err) { }
            }
        }, 2000);

        const changeRecord = {
            timestamp: new Date(),
            code: value,
            changeType: 'incremental'
        };

        setCodeChanges(prev => [...prev, changeRecord]);

        // Delegate to Code Analyzer (Debounce + Logic Check)
        if (analyzerRef.current) {
            analyzerRef.current.handleCodeChange(value);
        }

        previousCodeRef.current = value;
    };


    // --- CALL CONTROLS ---

    const handleJoinCall = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
            setCameraEnabled(true);
            setIsJoined(true);
            setIsInCall(true);
            monitoringService.requestFullscreen();

            // Start Voice AI
            startListening();

            // Greet
            setTimeout(() => {
                const greeting = "Hello! I am your AI Interviewer. I'm ready to begin. Please introduce yourself.";
                addAiMessage('greeting', greeting);
                speak(greeting);
            }, 1000);

        } catch (err) {
            console.error("Camera/Mic Error:", err);
            alert("Please enable Camera and Microphone to proceed.");
        }
    };

    const handleEndCall = async () => {
        // Same as submit/finish
        await handleSubmit(); // Submit current code
        await handleFinishExam();
    };


    const [outputType, setOutputType] = useState('normal');

    const handleRunCode = async () => {
        if (!code) return;
        setIsRunning(true);
        setOutput('Running Tests...');
        setOutputType('normal');

        try {
            const response = await candidateAPI.runCode({
                language,
                code,
                questionId: currentQuestion.id
            });

            const data = response.data.data;
            const mode = response.data.mode;

            if (mode === 'test-cases') {
                setOutput(data);
                setOutputType(data.passedCount === data.totalCount ? 'success' : 'error');
            } else {
                const { output, error, executionTime } = data;
                if (error) {
                    setOutput(`Error:\n${error}`);
                    setOutputType('error');
                } else {
                    let successMessage = `Output:\n${output}\n\nExecution Time: ${executionTime}ms`;
                    setOutput(successMessage);
                    setOutputType('success');
                }
            }
        } catch (error) {
            setOutput('Failed to execute code');
            setOutputType('error');
        } finally {
            setIsRunning(false);
        }
    };


    const handleSubmit = async () => {
        if (!code) return;

        setSubmitting(true);
        monitoringService.pause();

        try {
            const timeSpent = startTime ? Math.floor((new Date() - startTime) / 1000) : 0;

            await candidateAPI.submitCode({
                questionId: currentQuestion.id,
                code,
                explanation: 'Voice Interview Submission', // No text explanation
                approach: 'Voice Interview',
                language,
                timeSpent,
                interactionHistory,
                codeChanges
            });

            // Update local session state
            setSession(prev => ({
                ...prev,
                assignedQuestions: prev.assignedQuestions.map(q =>
                    q.questionId._id === currentQuestion.id ? { ...q, status: 'completed' } : q
                )
            }));

            alert('Code submitted!');

        } catch (error) {
            console.error('Error submitting code:', error);
            alert('Submission failed.');
        } finally {
            setSubmitting(false);
            setTimeout(() => monitoringService.resume(), 500);
        }
    };

    const handleFinishExam = async () => {
        try {
            await candidateAPI.finishSession();
            navigate('/candidate/results');
        } catch (e) { console.error(e) }
    };

    // --- RENDER ---

    if (loading) return <div className="loader">Loading...</div>;

    if (!isJoined) {
        return (
            <div className="lobby-container">
                <div className="lobby-card">
                    <h1>Ready to Join?</h1>
                    <p>This is a voice-enabled interview. Please ensure your camera and microphone are working.</p>
                    <div className="permissions-check">
                        <div className="check-item">📷 Camera Required</div>
                        <div className="check-item">🎤 Microphone Required</div>
                    </div>
                    <button className="btn-join" onClick={handleJoinCall}>Join Interview</button>
                </div>
            </div>
        );
    }

    if (!session || !currentQuestion) return <div>No Active Exam</div>;

    return (
        <div className={`exam-container video-mode`}>
            {/* Main Workspace (Left + Right Panels) */}
            <div className="workspace-area">

                {/* Left Panel: Description */}
                <div className="left-panel">
                    <div className="panel-header">
                        <div className="tab active">
                            {/* Document Icon */}
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                <polyline points="14 2 14 8 20 8"></polyline>
                                <line x1="16" y1="13" x2="8" y2="13"></line>
                                <line x1="16" y1="17" x2="8" y2="17"></line>
                                <polyline points="10 9 9 9 8 9"></polyline>
                            </svg>
                            Description
                        </div>
                    </div>
                    <div className="problem-content">
                        <h2 className="problem-title">{currentQuestion.title}</h2>
                        <span className="difficulty-badge">{currentQuestion.difficulty}</span>
                        <div dangerouslySetInnerHTML={{ __html: currentQuestion.description }}
                            style={{ fontSize: '0.95rem', lineHeight: '1.6', color: '#eff1f6' }}
                        />

                        {/* Constraints */}
                        {currentQuestion.constraints && (
                            <div style={{ marginTop: '20px' }}>
                                <strong>Constraints:</strong>
                                <pre style={{ background: '#333', padding: '10px', borderRadius: '6px', whiteSpace: 'pre-wrap', color: '#ccc' }}>{currentQuestion.constraints}</pre>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Panel: Editor + Test Cases */}
                <div className="right-panel">

                    {/* Editor Section */}
                    <div className="editor-section">
                        <div className="editor-header">
                            <select
                                value={language}
                                onChange={(e) => {
                                    const newLang = e.target.value;
                                    setLanguage(newLang);
                                    const template = currentQuestion.codeTemplates?.[newLang] || '// Write your code here\n';
                                    setCode(template);
                                    if (currentQuestion && answersRef.current[currentQuestion.id]) {
                                        answersRef.current[currentQuestion.id].code = template;
                                        answersRef.current[currentQuestion.id].language = newLang;
                                    }
                                }}
                                className="lang-select"
                            >
                                <option value="javascript">JavaScript</option>
                                <option value="python">Python</option>
                                <option value="java">Java</option>
                                <option value="cpp">C++</option>
                            </select>

                            <div className="action-buttons">
                                <button
                                    className="btn-nav"
                                    onClick={() => {
                                        if (!session || !currentQuestion) return;
                                        const currentIndex = session.assignedQuestions.findIndex(q => q.questionId._id === currentQuestion.id);
                                        if (currentIndex > 0) {
                                            loadQuestion(session.assignedQuestions[currentIndex - 1].questionId._id);
                                        }
                                    }}
                                    disabled={!session || !currentQuestion || session.assignedQuestions.findIndex(q => q.questionId._id === currentQuestion.id) <= 0}
                                    style={{ marginRight: '8px' }}
                                >
                                    Previous
                                </button>
                                <button
                                    className="btn-nav"
                                    onClick={() => {
                                        if (!session || !currentQuestion) return;
                                        const currentIndex = session.assignedQuestions.findIndex(q => q.questionId._id === currentQuestion.id);
                                        if (currentIndex < session.assignedQuestions.length - 1) {
                                            loadQuestion(session.assignedQuestions[currentIndex + 1].questionId._id);
                                        }
                                    }}
                                    disabled={!session || !currentQuestion || session.assignedQuestions.findIndex(q => q.questionId._id === currentQuestion.id) >= session.assignedQuestions.length - 1}
                                    style={{ marginRight: '8px' }}
                                >
                                    Next
                                </button>

                                <button className="btn-run-lc" onClick={handleRunCode} disabled={isRunning}>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: '6px' }}>
                                        <polygon points="5 3 19 12 5 21 5 3"></polygon>
                                    </svg>
                                    Run
                                </button>
                                <button className="btn-submit-lc" onClick={handleSubmit} disabled={submitting}>
                                    Submit
                                </button>
                            </div>
                        </div>
                        <div style={{ flex: 1 }}>
                            <Editor
                                height="100%"
                                language={language}
                                theme={theme}
                                value={code}
                                onChange={handleCodeChange}
                                options={{ minimap: { enabled: false }, fontSize: 14 }}
                            />
                        </div>
                    </div>

                    {/* Test Case Section */}
                    <div className="testcase-section">
                        <div className="testcase-header">
                            <div className="tab active">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '6px' }}>
                                    <polyline points="9 11 12 14 22 4"></polyline>
                                    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
                                </svg>
                                Test Cases
                            </div>
                        </div>
                        <div className="testcase-content">
                            {/* Test Cases Visualization */}
                            {output && typeof output === 'object' && output.results ? (
                                <div className="test-results-container">
                                    <div className="test-tabs">
                                        {output.results.map((res, idx) => (
                                            <button
                                                key={idx}
                                                className={`test-tab ${res.passed ? 'pass' : 'fail'}`}
                                                onClick={() => setOutputType(idx)} // Use outputType state to track active tab index temporarily
                                            >
                                                Case {idx + 1}
                                                <span className="status-icon">{res.passed ? '✓' : '✗'}</span>
                                            </button>
                                        ))}
                                    </div>

                                    <div className="test-detail">
                                        {(() => {
                                            const activeIndex = typeof outputType === 'number' ? outputType : 0;
                                            const result = output.results[activeIndex] || output.results[0];

                                            return (
                                                <div className="case-detail">
                                                    {result.isHidden ? (
                                                        <div className="hidden-case">
                                                            <div className="lock-icon">🔒</div>
                                                            <div>Hidden Test Case</div>
                                                            {result.passed ? (
                                                                <div className="status-text success">Passed</div>
                                                            ) : (
                                                                <div className="status-text error">Failed (Runtime Error or Logic)</div>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <div className="detail-row">
                                                                <span className="label">Input:</span>
                                                                <div className="code-block">{result.input}</div>
                                                            </div>
                                                            <div className="detail-row">
                                                                <span className="label">Expected Output:</span>
                                                                <div className="code-block">{result.expectedOutput}</div>
                                                            </div>
                                                            <div className="detail-row">
                                                                <span className="label">Your Output:</span>
                                                                <div className={`code-block ${result.passed ? 'success-border' : 'error-border'}`}>
                                                                    {result.actualOutput}
                                                                </div>
                                                            </div>
                                                            {result.error && (
                                                                <div className="detail-row">
                                                                    <span className="label error-text">Runtime Error:</span>
                                                                    <div className="code-block error-bg">{result.error}</div>
                                                                </div>
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                            );
                                        })()}
                                    </div>
                                </div>
                            ) : (
                                <div className="io-box">
                                    <div className="io-label">Sample Input:</div>
                                    <div className="io-display">{currentQuestion.sampleInput}</div>
                                    <div className="io-label">Output Console:</div>
                                    <div className="io-display">{typeof output === 'string' ? output : JSON.stringify(output, null, 2)}</div>
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            </div>

            {/* SIDEBAR FOR VIDEO (Minimized) */}
            <div className="video-sidebar">
                <div className="video-tile ai-tile">
                    <div className="avatar-pulse">
                        <div className="avatar-circle">AI</div>
                    </div>
                </div>
                <div className="video-tile self-tile">
                    <video ref={videoRef} autoPlay muted playsInline className="live-feedback" />
                </div>
                <div className="transcript-box">
                    <div className="messages-list">
                        {aiMessages.slice(-3).map((msg, i) => (
                            <div key={i} className={`message ${msg.type}`}>
                                <small>{msg.type === 'ai' ? 'AI' : 'You'}</small>
                                <div>{msg.content}</div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="call-controls">
                    <button className={`control-btn mic ${isListening ? 'on' : 'off'}`} onClick={isListening ? stopListening : startListening}>
                        {isListening ? '🎤' : '🔇'}
                    </button>
                    <button className="control-btn end-call" onClick={handleEndCall}>End</button>
                </div>
            </div>

            {showWarningModal && (
                <div className="warning-modal-overlay">
                    <div className="warning-modal">
                        <h3>⚠️ Warning</h3>
                        <p>{violationType}</p>
                        <button onClick={() => setShowWarningModal(false)}>Resume</button>
                    </div>
                </div>
            )}
        </div>
    );
};
