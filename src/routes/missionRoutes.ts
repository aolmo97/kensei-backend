import { Router } from 'express';
import * as missionController from '../controllers/missionController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.get('/', authenticateToken, missionController.getMissions);
router.post('/', authenticateToken, missionController.createMission);
router.post('/:id/join', authenticateToken, missionController.joinMission);
router.post('/:id/checkin', authenticateToken, missionController.checkinMission);
router.get('/:id/chat', authenticateToken, missionController.getChat);
router.post('/:id/chat', authenticateToken, missionController.sendMessage);

export default router;
