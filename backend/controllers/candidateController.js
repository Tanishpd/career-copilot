import ExamSession from '../models/ExamSession.js';
import Question from '../models/Question.js';
import Submission from '../models/Submission.js';
import Evaluation from '../models/Evaluation.js';
import { Resume } from '../models/Resume.js';
import aiInterviewer from '../services/aiInterviewer.js';
import codeEvaluator from '../services/codeEvaluator.js';
import codeRunner from '../services/codeRunner.js';

/**
 * Get candidate's active exam session
 */
export const getActiveSession = async (req, res) => {
    try {
        const session = await ExamSession.findOne({
            candidateId: req.user.id,
            status: { $in: ['pending', 'in-progress'] }
        }).populate('assignedQuestions.questionId', 'title category difficulty');

        if (!session) {
            return res.status(404).json({
                success: false,
                message: 'No active exam session found'
            });
        }

        // Check if session expired
        if (session.checkExpiration()) {
            await session.save();
            return res.status(403).json({
                success: false,
                message: 'Exam session has expired'
            });
        }

        res.status(200).json({
            success: true,
            data: { session }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching session',
            error: error.message
        });
    }
};

/**
 * Start exam session
 */
export const startSession = async (req, res) => {
    try {
        const session = await ExamSession.findOne({
            candidateId: req.user.id,
            status: 'pending'
        });

        if (!session) {
            return res.status(404).json({
                success: false,
                message: 'No pending session found'
            });
        }

        session.status = 'in-progress';
        session.startTime = new Date();
        await session.save();

        res.status(200).json({
            success: true,
            message: 'Exam session started',
            data: { session }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error starting session',
            error: error.message
        });
    }
};

/**
 * Get specific question with AI explanation
 */
export const getQuestion = async (req, res) => {
    try {
        const { questionId } = req.params;

        // Verify candidate has access to this question
        const session = await ExamSession.findOne({
            candidateId: req.user.id,
            'assignedQuestions.questionId': questionId,
            status: 'in-progress'
        });

        if (!session) {
            return res.status(403).json({
                success: false,
                message: 'You do not have access to this question'
            });
        }

        const question = await Question.findById(questionId);

        if (!question) {
            return res.status(404).json({
                success: false,
                message: 'Question not found'
            });
        }

        // Get AI explanation
        const aiExplanation = await aiInterviewer.explainProblem(question);

        res.status(200).json({
            success: true,
            data: {
                question: {
                    id: question._id,
                    title: question.title,
                    description: question.description,
                    category: question.category,
                    difficulty: question.difficulty,
                    constraints: question.constraints,
                    inputFormat: question.inputFormat,
                    outputFormat: question.outputFormat,
                    sampleInput: question.sampleInput,
                    sampleOutput: question.sampleOutput
                },
                aiExplanation
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching question',
            error: error.message
        });
    }
};

/**
 * Submit code for evaluation
 */
export const submitCode = async (req, res) => {
    try {
        const { questionId, code, explanation, approach, language, timeSpent, interactionHistory, codeChanges } = req.body;

        // Verify session
        const session = await ExamSession.findOne({
            candidateId: req.user.id,
            'assignedQuestions.questionId': questionId,
            status: 'in-progress'
        });

        if (!session) {
            return res.status(403).json({
                success: false,
                message: 'Invalid session or question'
            });
        }

        // Check expiration
        if (session.checkExpiration()) {
            await session.save();
            return res.status(403).json({
                success: false,
                message: 'Session has expired'
            });
        }

        // Get question
        const question = await Question.findById(questionId);

        // Create submission
        const submission = await Submission.create({
            sessionId: session._id,
            candidateId: req.user.id,
            questionId,
            code,
            language,
            explanation,
            approach,
            timeSpent,
            interactionHistory: interactionHistory || [],
            codeChanges: codeChanges || [],
            attempts: 1 // TODO: Increment if previous exist
        });

        // Evaluate submission (Try-Catch to prevent AI failure from blocking submission)
        let evaluation = null;
        try {
            const evaluationResult = await codeEvaluator.evaluateSubmission(submission, question);

            // Update submission with status
            submission.passed = evaluationResult.testResults.passedCount === evaluationResult.testResults.totalCount;
            submission.testCasesPassed = evaluationResult.testResults.passedCount;
            submission.totalTestCases = evaluationResult.testResults.totalCount;
            await submission.save();

            // Create evaluation record
            evaluation = await Evaluation.create({
                submissionId: submission._id,
                candidateId: req.user.id,
                sessionId: session._id,
                questionId,
                scores: evaluationResult.scores,
                detailedFeedback: evaluationResult.feedback,
                strengths: evaluationResult.strengths,
                weaknesses: evaluationResult.weaknesses,
                malpracticeFlags: evaluationResult.malpracticeFlags,
                recommendation: evaluationResult.recommendation,
                testResults: evaluationResult.testResults
            });
        } catch (evalError) {
            console.error('Evaluation Failed (Non-blocking):', evalError);
            // We still return success because the generic submission was saved. 
            // The candidate shouldn't lose work because our AI service is down.
            submission.passed = false; // Default
            await submission.save();
        }

        res.status(201).json({
            success: true,
            message: 'Code submitted successfully' + (evaluation ? '' : ' (Evaluation pending)'),
            data: {
                submission,
                evaluation
            }
        });
    } catch (error) {
        console.error('Submission Error Stack:', error);
        res.status(500).json({
            success: false,
            message: 'Error submitting code: ' + error.message,
            error: error.message
        });
    }
};

/**
 * Get feedback for a submission
 */
export const getFeedback = async (req, res) => {
    try {
        const { submissionId } = req.params;

        const evaluation = await Evaluation.findOne({
            submissionId,
            candidateId: req.user.id
        }).populate('questionId', 'title category difficulty');

        if (!evaluation) {
            return res.status(404).json({
                success: false,
                message: 'Evaluation not found'
            });
        }

        res.status(200).json({
            success: true,
            data: { evaluation }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching feedback',
            error: error.message
        });
    }
};

/**
 * Run code without submission (Sandbox)
 */
export const runCode = async (req, res) => {
    try {
        const { language, code, input, questionId } = req.body;

        if (!code) {
            return res.status(400).json({
                success: false,
                message: 'Code is required'
            });
        }

        // If questionId is provided, run against all test cases
        if (questionId) {
            // Verify candidate has access to this question
            // We can reuse the session check logic here if needed, but for "Run" maybe lighter check?
            // Safer to check session to prevent random code execution against random questions?
            // For now assuming if they have the ID they 'can' run it, but let's be safe and check session.
            const session = await ExamSession.findOne({
                candidateId: req.user.id,
                'assignedQuestions.questionId': questionId,
                status: 'in-progress'
            });

            if (!session) {
                return res.status(403).json({
                    success: false,
                    message: 'Invalid session or access denied'
                });
            }

            const question = await Question.findById(questionId);
            if (!question) {
                return res.status(404).json({
                    success: false,
                    message: 'Question not found'
                });
            }

            // Create a mock submission object for the evaluator
            const submissionLike = {
                language,
                code
            };

            const results = await codeEvaluator.runTestCases(submissionLike, question);

            return res.status(200).json({
                success: true,
                mode: 'test-cases',
                data: results
            });
        }

        // Fallback: Run against provided input (Custom Input mode)
        const result = await codeRunner.run(language, code, input || '');

        res.status(200).json({
            success: true,
            mode: 'custom-input',
            data: result
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error executing code',
            error: error.message
        });
    }
};

/**
 * Request hint
 */
export const requestHint = async (req, res) => {
    try {
        const { questionId, currentCode, hintLevel } = req.body;

        // Verify session allows hints
        const session = await ExamSession.findOne({
            candidateId: req.user.id,
            'assignedQuestions.questionId': questionId,
            status: 'in-progress'
        });

        if (!session) {
            return res.status(403).json({
                success: false,
                message: 'Invalid session'
            });
        }

        if (!session.allowHints) {
            return res.status(403).json({
                success: false,
                message: 'Hints are not allowed for this session'
            });
        }

        if (hintLevel > session.maxHintsPerQuestion) {
            return res.status(403).json({
                success: false,
                message: `Maximum ${session.maxHintsPerQuestion} hints allowed per question`
            });
        }

        const question = await Question.findById(questionId);
        const hint = await aiInterviewer.provideHint(question, currentCode, hintLevel);

        res.status(200).json({
            success: true,
            data: { hint }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error providing hint',
            error: error.message
        });
    }
};

/**
 * Log exam violation
 */
export const logViolation = async (req, res) => {
    try {
        const { type, metadata } = req.body;

        const session = await ExamSession.findOne({
            candidateId: req.user.id,
            status: 'in-progress'
        });

        if (!session) {
            return res.status(404).json({
                success: false,
                message: 'No active session found'
            });
        }

        session.violations.push({
            type,
            metadata,
            timestamp: new Date()
        });

        session.warningCount += 1;
        await session.save();

        res.status(200).json({
            success: true,
            message: 'Violation logged',
            data: { warningCount: session.warningCount }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error logging violation',
            error: error.message
        });
    }
};

/**
 * Save progress (draft code)
 */
export const saveProgress = async (req, res) => {
    try {
        const { questionId, code, language } = req.body;

        const session = await ExamSession.findOne({
            candidateId: req.user.id,
            status: 'in-progress'
        });

        if (!session) {
            return res.status(404).json({
                success: false,
                message: 'No active session found'
            });
        }

        // Find the specific question assignment and update it
        const questionAssignment = session.assignedQuestions.find(
            q => q.questionId.toString() === questionId
        );

        if (questionAssignment) {
            questionAssignment.draftCode = code;
            questionAssignment.language = language || 'javascript';
            await session.save();
        }

        res.status(200).json({ success: true });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error saving progress',
            error: error.message
        });
    }
};

/**
 * Get exam results (Evaluations + Session Summary)
 */
export const getExamResults = async (req, res) => {
    try {
        const session = await ExamSession.findOne({
            candidateId: req.user.id,
            status: { $in: ['completed', 'expired'] }
        }).sort({ createdAt: -1 }); // Get latest completed

        if (!session) {
            return res.status(404).json({
                success: false,
                message: 'No completed exam session found'
            });
        }

        const evaluations = await Evaluation.find({
            sessionId: session._id
        }).populate('questionId', 'title difficulty category');

        // Calculate total score
        let totalScore = 0;
        let totalMaxScore = 0;

        const results = evaluations.map(ev => {
            const maxScore = ev.questionId.difficulty === 'Easy' ? 5 :
                ev.questionId.difficulty === 'Medium' ? 10 : 15;

            // Calculate score based on passed test cases
            let computedScore = 0;
            if (ev.testResults && ev.testResults.totalCount > 0) {
                computedScore = (ev.testResults.passedCount / ev.testResults.totalCount) * maxScore;
            }

            totalScore += computedScore;
            totalMaxScore += maxScore;

            return {
                question: ev.questionId,
                score: computedScore,
                maxScore,
                testResults: ev.testResults,
                feedback: ev.detailedFeedback
            };
        });

        // Sum computed scores
        // const finalScore = results.reduce((acc, curr) => acc + curr.score, 0); // Already calculated in loop

        res.status(200).json({
            success: true,
            data: {
                session,
                results,
                summary: {
                    totalScore: Math.round(totalScore * 10) / 10,
                    totalMaxScore,
                    percentage: totalMaxScore > 0 ? Math.round((totalScore / totalMaxScore) * 100) : 0
                }
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching results',
            error: error.message
        });
    }
};


/**
 * Finish exam session
 */
export const finishSession = async (req, res) => {
    try {
        const session = await ExamSession.findOne({
            candidateId: req.user.id,
            status: 'in-progress'
        });

        if (!session) {
            return res.status(404).json({
                success: false,
                message: 'No active session found'
            });
        }

        session.status = 'completed';
        session.endTime = new Date(); // Actual finish time
        await session.save();

        res.status(200).json({
            success: true,
            message: 'Exam session finished successfully',
            data: { session }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error finishing session',
            error: error.message
        });
    }
};

/**
 * Generate Resume Suggestions
 */
export const generateResumeSuggestions = async (req, res) => {
    try {
        const { section, currentContent } = req.body;

        // Simple validation
        if (!section) {
            return res.status(400).json({
                success: false,
                message: 'Section is required'
            });
        }

        const suggestions = await aiInterviewer.generateResumeContent(section, currentContent);

        res.status(200).json({
            success: true,
            data: { suggestions }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error generating suggestions',
            error: error.message
        });
    }
};

/**
 * Save Resume
 */
export const saveResume = async (req, res) => {
    try {
        const { id, title, data } = req.body;

        if (id) {
            // Update existing
            const resume = await Resume.findOneAndUpdate(
                { _id: id, user: req.user.id },
                { title, data },
                { new: true }
            );

            if (!resume) {
                return res.status(404).json({ success: false, message: 'Resume not found' });
            }

            return res.status(200).json({ success: true, data: { resume } });
        } else {
            // Create new
            const resume = await Resume.create({
                user: req.user.id,
                title: title || 'My Resume',
                data
            });

            return res.status(201).json({ success: true, data: { resume } });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error saving resume', error: error.message });
    }
};

/**
 * Get All Resumes for User
 */
export const getResumes = async (req, res) => {
    try {
        const resumes = await Resume.find({ user: req.user.id })
            .select('title updatedAt createdAt')
            .sort({ updatedAt: -1 });

        res.status(200).json({ success: true, data: { resumes } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching resumes', error: error.message });
    }
};

/**
 * Get Single Resume
 */
export const getResume = async (req, res) => {
    try {
        const resume = await Resume.findOne({ _id: req.params.id, user: req.user.id });

        if (!resume) {
            return res.status(404).json({ success: false, message: 'Resume not found' });
        }

        res.status(200).json({ success: true, data: { resume } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching resume', error: error.message });
    }
};

/**
 * Delete Resume
 */
export const deleteResume = async (req, res) => {
    try {
        const resume = await Resume.findOneAndDelete({ _id: req.params.id, user: req.user.id });

        if (!resume) {
            return res.status(404).json({ success: false, message: 'Resume not found' });
        }

        res.status(200).json({ success: true, message: 'Resume deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error deleting resume', error: error.message });
    }
};