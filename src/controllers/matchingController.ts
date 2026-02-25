import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../utils/prisma';

export const getRecommendations = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        const user = await prisma.user.findUnique({ where: { id: userId } });

        if (!user) return res.status(404).json({ error: 'User not found' });

        // Fetch open missions
        const missions = await prisma.mission.findMany({
            where: {
                status: 'OPEN',
                NOT: { creatorId: userId }, // Don't recommend own missions here
                participations: { none: { userId: userId } } // Don't recommend already joined
            },
            include: {
                creator: { select: { name: true, reputationScore: true } },
                _count: { select: { participations: true } }
            }
        });

        const userInterests = user.interests.toLowerCase().split(',').map(i => i.trim());

        // Basic scoring algorithm
        const scoredMissions = missions.map(mission => {
            let score = 0;

            // 1. Interest overlap
            const missionInterests = mission.category.toLowerCase().split(',').map(i => i.trim());
            const overlap = userInterests.filter(i => missionInterests.includes(i));
            score += overlap.length * 10;

            // 2. Energy level match (lower difference is better)
            const energyDiff = Math.abs(user.energyLevel - mission.energyLevel);
            score += (5 - energyDiff) * 5;

            // 3. Location match (exact match for now, could be coordinates later)
            if (mission.location.toLowerCase() === user.location.toLowerCase()) {
                score += 20;
            }

            // 4. Reputation influence (Business Rule)
            score += mission.creator.reputationScore * 2;

            return { ...mission, matchScore: score };
        });

        // Sort by score descending
        scoredMissions.sort((a, b) => b.matchScore - a.matchScore);

        res.json(scoredMissions.slice(0, 10)); // Top 10 recommendations
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};
