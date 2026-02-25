import { Router } from 'express';
import * as matchingController from '../controllers/matchingController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.get('/', authenticateToken, matchingController.getRecommendations);

export default router;
