import { Router } from 'express';
import { getQuestions, submitQuiz, getHistory, getReport } from '../controllers/quizController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.get('/questions', authMiddleware, getQuestions);
router.post('/submit', authMiddleware, submitQuiz);
router.get('/history', authMiddleware, getHistory);
router.get('/:id/report', authMiddleware, getReport);

export default router;
