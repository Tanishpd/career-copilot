import aiInterviewer from '../services/aiInterviewer.js';
import Question from '../models/Question.js';
import { Resume } from '../models/Resume.js';
import ExamSession from '../models/ExamSession.js';

/**
 * Setup Socket.io handlers for real-time interview interaction
 */
export const setupInterviewSocket = (io) => {
    io.on('connection', (socket) => {
        console.log(`✅ Candidate connected: ${socket.id}`);

        // Join interview room
        socket.on('join-interview', async (data) => {
            const { sessionId, candidateId } = data;
            socket.join(`interview-${sessionId}`);
            console.log(`Candidate ${candidateId} joined interview room: ${sessionId}`);

            // Initialize Context if needed
            try {
                const session = await ExamSession.findById(sessionId);
                if (session && !session.interviewFlow?.candidateContext?.name) {
                    const resume = await Resume.findOne({ user: candidateId });

                    if (resume) {
                        session.interviewFlow = session.interviewFlow || {};
                        session.interviewFlow.candidateContext = {
                            name: resume.data.personalInfo.fullName,
                            skills: resume.data.skills,
                            summary: resume.data.personalInfo.summary,
                            experience: resume.data.experience.map(e => `${e.role} at ${e.company}`)
                        };
                        await session.save();
                        console.log('Use Resume context for interview:', session.interviewFlow.candidateContext.name);
                    }
                }
            } catch (err) {
                console.error('Error initializing interview context:', err);
            }
        });

        // Handle code changes (track for malpractice detection)
        socket.on('code-change', async (data) => {
            const { sessionId, questionId, code, previousCode, timestamp } = data;

            // Detect change type
            let changeType = 'incremental';

            if (!code) return;

            if (!previousCode || previousCode.length === 0) {
                if (code.length > 100) {
                    changeType = 'paste'; // Sudden large code
                }
            } else {
                const changeSize = Math.abs(code.length - previousCode.length);
                if (changeSize > 200) {
                    changeType = 'major-rewrite';
                }
            }

            // Emit change type back to client for tracking
            socket.emit('code-change-tracked', {
                changeType,
                timestamp
            });

            // Event-Driven Code Monitoring
            // Only checking incremental changes to avoid noise on paste
            if (changeType === 'incremental') {
                try {
                    const question = await Question.findById(questionId);

                    // Call the Silent Observer
                    const feedback = await aiInterviewer.monitorCode({
                        code,
                        previousCode,
                        question
                    });

                    // Only emit if feedback exists (Silence by default)
                    if (feedback) {
                        socket.emit('ai-voice-response', {
                            content: feedback,
                            timestamp: new Date()
                        });

                        // Also log to text chat without speaking? 
                        // No, requirements say "AI should speak only when...". 
                        // So voice response is correct.
                    }
                } catch (error) {
                    console.error('Error monitoring code:', error);
                }
            }
        });

        // Handle candidate response to AI question
        socket.on('candidate-response', async (data) => {
            const { sessionId, response, timestamp, isVoice, interactionHistory } = data;

            // Emit to room for tracking
            io.to(`interview-${sessionId}`).emit('interaction-logged', {
                type: 'candidate-response',
                content: response,
                timestamp
            });

            // If voice interview, generate AI reply
            if (isVoice) {
                try {
                    // Fetch current session state
                    const session = await ExamSession.findById(sessionId);

                    // Use provided history or empty
                    const history = interactionHistory || [];
                    const qContext = data.questionContext || {};

                    console.log(`[Socket] Generating AI reply. History: ${history.length}, Session: ${sessionId}`);

                    const aiReply = await aiInterviewer.replyToCandidate(history, response, session, qContext);

                    // Update session history/stage if returned (optional, depends on AI service return)
                    // For now, assume aiReply is just string, but we should probably handle state updates
                    // Ideally replyToCandidate returns { text, newStage }

                    // But to keep it simple with existing signature, let's just send text for now
                    // We will update aiInterviewer to handle the logic internally if passed the session object?
                    // Actually, passing 'session' allows aiInterviewer to read context.

                    let replyText = aiReply;
                    if (typeof aiReply === 'object') {
                        replyText = aiReply.text;

                        // Update Session State (Stage + Flags)
                        if (session) {
                            if (aiReply.newStage) {
                                session.interviewFlow.currentStage = aiReply.newStage;
                            }
                            if (aiReply.updates) {
                                // Merge flags
                                session.interviewFlow.flags = {
                                    ...session.interviewFlow.flags,
                                    ...aiReply.updates
                                };
                            }
                            await session.save();
                        }
                    }

                    // Only emit if there is text (AI might be silent in Code Writing phase)
                    if (replyText) {
                        console.log(`[Socket] Emitting reply: "${replyText}"`);
                        socket.emit('ai-voice-response', {
                            content: replyText,
                            timestamp: new Date()
                        });
                    } else {
                        console.log('[Socket] AI chose to be silent.');
                    }
                } catch (error) {
                    console.error('Error generating AI reply:', error);
                    // Fallback response so candidate isn't left hanging
                    socket.emit('ai-voice-response', {
                        content: "I'm having trouble connecting to my brain right now. Please continue.",
                        timestamp: new Date()
                    });
                }
            } else {
                // Legacy text acknowledgment
                socket.emit('response-acknowledged', {
                    message: 'Thank you for your response. Continue coding.',
                    timestamp: new Date()
                });
            }
        });

        // Request AI explanation
        socket.on('request-explanation', async (data) => {
            const { questionId } = data;

            try {
                const question = await Question.findById(questionId);
                const explanation = await aiInterviewer.explainProblem(question);

                socket.emit('ai-explanation', {
                    explanation,
                    timestamp: new Date()
                });
            } catch (error) {
                socket.emit('error', {
                    message: 'Failed to generate explanation',
                    error: error.message
                });
            }
        });

        // Handle hint requests
        socket.on('request-hint', async (data) => {
            const { questionId, currentCode, hintLevel } = data;

            try {
                const question = await Question.findById(questionId);
                const hint = await aiInterviewer.provideHint(question, currentCode, hintLevel);

                socket.emit('hint-provided', {
                    hint,
                    hintLevel,
                    timestamp: new Date()
                });

                // Log hint usage
                io.to(`interview-${data.sessionId}`).emit('interaction-logged', {
                    type: 'hint-requested',
                    content: `Hint level ${hintLevel} requested`,
                    timestamp: new Date()
                });
            } catch (error) {
                socket.emit('error', {
                    message: 'Failed to provide hint',
                    error: error.message
                });
            }
        });

        // Handle disconnect
        socket.on('disconnect', () => {
            console.log(`❌ Candidate disconnected: ${socket.id}`);
        });
    });
};
