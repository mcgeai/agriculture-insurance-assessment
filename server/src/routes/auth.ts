import { Router } from 'express';
import { login, changePassword } from '../controllers/authController';
import { authMiddleware } from '../middleware/auth';
import { loginLimiter } from '../middleware/rateLimit';

const router = Router();

router.post('/login', loginLimiter, login);
router.put('/password', authMiddleware, changePassword);

export default router;
