import express from 'express';
import {
    getActiveSession,
    startSession,
    getQuestion,
    submitCode,
    getFeedback,
    requestHint,
    runCode,
    logViolation,
    finishSession,
    getExamResults,
    saveProgress,
    generateResumeSuggestions,
    saveResume,
    getResumes,
    getResume,
    deleteResume
} from '../controllers/candidateController.js';
import { authenticate, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require authentication and candidate role
router.use(authenticate);
router.use(authorize('candidate'));

// Session management
router.get('/session', getActiveSession);
router.get('/results', getExamResults);
router.post('/session/start', startSession);
router.post('/session/finish', finishSession);
router.post('/session/save', saveProgress);

// Question access
router.get('/question/:questionId', getQuestion);

// Code submission
router.post('/submit', submitCode);
router.post('/run', runCode);

// Feedback
router.get('/feedback/:submissionId', getFeedback);

// Hints
router.post('/hint', requestHint);

// Anti-Cheating
router.post('/log-violation', logViolation);

// Resume AI
router.post('/resume/suggest', generateResumeSuggestions);

// Resume Persistence
router.post('/resume/save', saveResume);
router.get('/resume/list', getResumes);
router.get('/resume/:id', getResume);
router.delete('/resume/:id', deleteResume);

export default router;
