import Question from '../models/Question.js';
import ExamSession from '../models/ExamSession.js';
import Evaluation from '../models/Evaluation.js';
import User from '../models/User.js';
import aiQuestionGenerator from '../services/aiQuestionGenerator.js';

/**
 * Create a new question
 */
export const createQuestion = async (req, res) => {
    try {
        const questionData = {
            ...req.body,
            createdBy: req.user.id
        };

        const question = await Question.create(questionData);

        res.status(201).json({
            success: true,
            message: 'Question created successfully',
            data: { question }
        });
    } catch (error) {
        console.error('Error creating question:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating question',
            error: error.message
        });
    }
};

/**
 * Get all questions
 */
export const getAllQuestions = async (req, res) => {
    try {
        const { category, difficulty } = req.query;

        const filter = {};
        if (category) filter.category = category;
        if (difficulty) filter.difficulty = difficulty;

        const questions = await Question.find(filter).sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: questions.length,
            data: { questions }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching questions',
            error: error.message
        });
    }
};

/**
 * Update a question
 */
export const updateQuestion = async (req, res) => {
    try {
        const question = await Question.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!question) {
            return res.status(404).json({
                success: false,
                message: 'Question not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Question updated successfully',
            data: { question }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating question',
            error: error.message
        });
    }
};

/**
 * Delete a question
 */
export const deleteQuestion = async (req, res) => {
    try {
        const question = await Question.findByIdAndDelete(req.params.id);

        if (!question) {
            return res.status(404).json({
                success: false,
                message: 'Question not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Question deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting question',
            error: error.message
        });
    }
};

/**
 * Create exam session with automatic candidate account creation
 */
export const createExamSession = async (req, res) => {
    try {
        const { candidateEmail, candidateName, questionIds, timeLimit, allowHints, maxHintsPerQuestion } = req.body;

        // Validate input
        if (!candidateEmail || !candidateName || !questionIds || questionIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Candidate email, name, and at least one question are required'
            });
        }

        // Import required services
        const { generateSecurePassword } = await import('../utils/passwordGenerator.js');
        const emailService = (await import('../services/emailService.js')).default;

        // Check if candidate already exists
        let candidate = await User.findOne({ email: candidateEmail });
        let generatedPassword = null;
        let isNewCandidate = false;

        if (!candidate) {
            // Generate secure password
            generatedPassword = generateSecurePassword(12);

            // Create new candidate account
            candidate = await User.create({
                email: candidateEmail,
                name: candidateName,
                password: generatedPassword, // Will be hashed by the User model pre-save hook
                role: 'candidate'
            });

            isNewCandidate = true;
            console.log(`✅ Created new candidate account: ${candidateEmail}`);
        } else {
            console.log(`ℹ️ Using existing candidate account: ${candidateEmail}`);
        }

        // Verify questions exist
        const questions = await Question.find({ _id: { $in: questionIds } });
        if (questions.length !== questionIds.length) {
            return res.status(404).json({
                success: false,
                message: 'Some questions not found'
            });
        }

        // Create exam session
        const session = await ExamSession.create({
            candidateId: candidate._id,
            assignedQuestions: questionIds.map((qId, index) => ({
                questionId: qId,
                order: index + 1
            })),
            timeLimit,
            allowHints: allowHints !== undefined ? allowHints : true,
            maxHintsPerQuestion: maxHintsPerQuestion || 2,
            createdBy: req.user.id
        });

        // Prepare exam details for email
        const examDetails = {
            sessionId: session.sessionId,
            questionCount: questionIds.length,
            timeLimit: timeLimit || 120
        };

        // Send email with credentials (only if new candidate or password was generated)
        let emailResult = { success: false };
        if (isNewCandidate && generatedPassword) {
            emailResult = await emailService.sendExamCredentials(
                candidateEmail,
                candidateName,
                generatedPassword,
                examDetails
            );
        }

        res.status(201).json({
            success: true,
            message: isNewCandidate
                ? 'Exam session created and credentials sent to candidate'
                : 'Exam session created for existing candidate',
            data: {
                session,
                candidateCreated: isNewCandidate,
                emailSent: emailResult.success,
                credentials: isNewCandidate ? {
                    email: candidateEmail,
                    password: generatedPassword, // Include in response for admin to see
                    note: 'Credentials have been emailed to the candidate'
                } : null
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error creating exam session',
            error: error.message
        });
    }
};


/**
 * Get all exam sessions
 */
export const getAllSessions = async (req, res) => {
    try {
        const sessions = await ExamSession.find()
            .populate('candidateId', 'name email')
            .populate('assignedQuestions.questionId', 'title category difficulty')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: sessions.length,
            data: { sessions }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching sessions',
            error: error.message
        });
    }
};

/**
 * Get detailed session info
 */
export const getSessionDetails = async (req, res) => {
    try {
        const session = await ExamSession.findById(req.params.id)
            .populate('candidateId', 'name email')
            .populate('assignedQuestions.questionId')
            .populate('createdBy', 'name');

        if (!session) {
            return res.status(404).json({ success: false, message: 'Session not found' });
        }

        // Try to find evaluations
        const evaluations = await Evaluation.find({ sessionId: session._id })
            .populate('submissionId')
            .populate('questionId', 'title difficulty');

        res.status(200).json({
            success: true,
            data: { session, evaluations }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching session details',
            error: error.message
        });
    }
};

/**
 * Get all candidate results
 */
export const getAllResults = async (req, res) => {
    try {
        const evaluations = await Evaluation.find()
            .populate('candidateId', 'name email')
            .populate('questionId', 'title category difficulty')
            .populate('sessionId', 'sessionId')
            .sort({ totalScore: -1 });

        const resultsWithScores = evaluations.map(ev => {
            const evObj = ev.toObject();
            if (ev.questionId) {
                const maxScore = ev.questionId.difficulty === 'Easy' ? 5 :
                    ev.questionId.difficulty === 'Medium' ? 10 : 15;

                let computedScore = 0;
                if (ev.testResults && ev.testResults.totalCount > 0) {
                    computedScore = (ev.testResults.passedCount / ev.testResults.totalCount) * maxScore;
                }

                evObj.examScore = Math.round(computedScore * 10) / 10;
                evObj.maxExamScore = maxScore;
            } else {
                evObj.examScore = 0;
                evObj.maxExamScore = 0;
            }
            return evObj;
        });

        res.status(200).json({
            success: true,
            count: resultsWithScores.length,
            data: { evaluations: resultsWithScores }
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
 * Get candidate rankings
 */
export const getRankings = async (req, res) => {
    try {
        const { sessionId } = req.query;

        const filter = sessionId ? { sessionId } : {};

        const evaluations = await Evaluation.find(filter)
            .populate('candidateId', 'name email')
            .sort({ totalScore: -1 });

        // Group by candidate and calculate average
        const rankings = {};

        evaluations.forEach(evaluation => {
            const candidateId = evaluation.candidateId._id.toString();

            if (!rankings[candidateId]) {
                rankings[candidateId] = {
                    candidate: evaluation.candidateId,
                    totalScore: 0,
                    count: 0,
                    evaluations: [],
                    malpracticeFlags: []
                };
            }

            rankings[candidateId].totalScore += evaluation.totalScore;
            rankings[candidateId].count += 1;
            rankings[candidateId].evaluations.push(evaluation);
            rankings[candidateId].malpracticeFlags.push(...evaluation.malpracticeFlags);
        });

        // Convert to array and calculate averages
        const rankingArray = Object.values(rankings).map(r => ({
            candidate: r.candidate,
            averageScore: (r.totalScore / r.count).toFixed(2),
            totalSubmissions: r.count,
            malpracticeCount: r.malpracticeFlags.length,
            evaluations: r.evaluations
        })).sort((a, b) => b.averageScore - a.averageScore);

        res.status(200).json({
            success: true,
            count: rankingArray.length,
            data: { rankings: rankingArray }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching rankings',
            error: error.message
        });
    }
};

/**
 * Get detailed result for a specific submission
 */
export const getResultDetails = async (req, res) => {
    try {
        const evaluation = await Evaluation.findById(req.params.id)
            .populate('candidateId', 'name email')
            .populate('questionId')
            .populate('submissionId')
            .populate('sessionId');

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
            message: 'Error fetching result details',
            error: error.message
        });
    }
};

/**
 * Generate aptitude questions via AI
 */
export const generateAptitudeQuestions = async (req, res) => {
    try {
        const { count, difficulty, topics, type } = req.body;
        if (!count || !difficulty || !topics || !type) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: count, difficulty, topics, type'
            });
        }
        const questions = await aiQuestionGenerator.generateAptitude({ count, difficulty, topics, type });
        return res.status(200).json({ success: true, data: { questions } });
    } catch (error) {
        console.error('Error generating aptitude questions:', error);
        return res.status(500).json({ success: false, message: 'Error generating aptitude questions', error: error.message });
    }
};

/**
 * Generate coding questions via AI
 */
export const generateCodingQuestions = async (req, res) => {
    try {
        const { count, difficulty, problemType, language } = req.body;
        if (!count || !difficulty) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: count, difficulty'
            });
        }
        const questions = await aiQuestionGenerator.generateCoding({ count, difficulty, problemType, language });
        return res.status(200).json({ success: true, data: { questions } });
    } catch (error) {
        console.error('Error generating coding questions:', error);
        return res.status(500).json({ success: false, message: 'Error generating coding questions', error: error.message });
    }
};
