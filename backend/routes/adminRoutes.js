import express from 'express';
import {
    createQuestion,
    getAllQuestions,
    updateQuestion,
    deleteQuestion,
    createExamSession,
    getAllSessions,
    getSessionDetails,
    getAllResults,
    getRankings,
    getResultDetails,
    generateAptitudeQuestions,
    generateCodingQuestions
} from '../controllers/adminController.js';
import { authenticate, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require authentication and admin role
router.use(authenticate);
router.use(authorize('admin'));

// Question management
router.post('/questions', createQuestion);
router.get('/questions', getAllQuestions);
router.put('/questions/:id', updateQuestion);
router.delete('/questions/:id', deleteQuestion);

// Exam session management
router.post('/sessions', createExamSession);

router.get('/sessions', getAllSessions);
router.get('/sessions/:id', getSessionDetails);

// Results and rankings
router.get('/results', getAllResults);
router.get('/results/:id', getResultDetails);
router.get('/rankings', getRankings);

// Generation endpoints
router.post('/generate-aptitude', generateAptitudeQuestions);
router.post('/generate-coding', generateCodingQuestions);

export default router;
