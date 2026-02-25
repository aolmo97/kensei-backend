import { Router } from 'express';
import * as ratingController from '../controllers/ratingController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.post('/', authenticateToken, ratingController.createRating);

export default router;
