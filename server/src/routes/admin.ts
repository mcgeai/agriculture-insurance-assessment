import { Router } from 'express';
import { authMiddleware, adminOnly } from '../middleware/auth';
import * as adminCtrl from '../controllers/adminController';

const router = Router();

router.use(authMiddleware, adminOnly);

router.get('/overview', adminCtrl.getOverview);
router.get('/employees', adminCtrl.getEmployees);
router.get('/employees/:id/assessments', adminCtrl.getEmployeeAssessments);

router.get('/questions', adminCtrl.listQuestions);
router.post('/questions', adminCtrl.createQuestion);
router.put('/questions/:id', adminCtrl.updateQuestion);
router.delete('/questions/:id', adminCtrl.deleteQuestion);
router.patch('/questions/:id/status', adminCtrl.toggleQuestionStatus);

router.post('/users', adminCtrl.createUser);
router.put('/users/:id', adminCtrl.updateUser);
router.patch('/users/:id/status', adminCtrl.toggleUserStatus);
router.post('/users/:id/reset-password', adminCtrl.resetPassword);

export default router;
