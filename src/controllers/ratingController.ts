import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../utils/prisma';

export const createRating = async (req: AuthRequest, res: Response) => {
    try {
        const fromUserId = req.user?.id;
        const { toUserId, missionId, score, comment } = req.body;

        // Verify mission participation for both
        const fromParticipant = await prisma.participation.findUnique({
            where: { userId_missionId: { userId: fromUserId!, missionId } }
        });
        const toParticipant = await prisma.participation.findUnique({
            where: { userId_missionId: { userId: toUserId, missionId } }
        });

        if (!fromParticipant || !toParticipant) {
            return res.status(400).json({ error: 'Both users must be participants of the mission' });
        }

        const rating = await prisma.rating.create({
            data: {
                fromUserId: fromUserId!,
                toUserId,
                missionId,
                score: parseInt(score),
                comment
            }
        });

        // Update reputation score (simple average)
        const allRatings = await prisma.rating.findMany({
            where: { toUserId }
        });

        const averageRating = allRatings.reduce((acc, curr) => acc + curr.score, 0) / allRatings.length;

        await prisma.user.update({
            where: { id: toUserId },
            data: { reputationScore: averageRating }
        });

        res.status(201).json(rating);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};
