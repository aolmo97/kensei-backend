import { Router } from 'express';
import * as userController from '../controllers/userController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.get('/me', authenticateToken, userController.getMe);
router.put('/me', authenticateToken, userController.updateMe);

export default router;
