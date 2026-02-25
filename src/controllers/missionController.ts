import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../utils/prisma';

export const getMissions = async (req: AuthRequest, res: Response) => {
    try {
        const missions = await prisma.mission.findMany({
            where: { status: 'OPEN' },
            include: {
                creator: { select: { name: true, reputationScore: true } },
                _count: { select: { participations: true } }
            }
        });
        res.json(missions);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const createMission = async (req: AuthRequest, res: Response) => {
    try {
        const creatorId = req.user?.id;
        const { title, category, description, location, datetime, duration, maxParticipants, energyLevel } = req.body;

        const mission = await prisma.mission.create({
            data: {
                title,
                category,
                description,
                location,
                datetime: new Date(datetime),
                duration: parseInt(duration),
                maxParticipants: parseInt(maxParticipants),
                energyLevel: parseInt(energyLevel),
                creatorId: creatorId!,
            },
        });

        res.status(201).json(mission);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const joinMission = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        const missionId = req.params.id as string;
        const userIdStr = userId as string;

        // 1. Check if mission exists and is open
        const mission = await prisma.mission.findUnique({
            where: { id: missionId },
            include: { _count: { select: { participations: true } } }
        });

        if (!mission) return res.status(404).json({ error: 'Mission not found' });
        if (mission.status !== 'OPEN') return res.status(400).json({ error: 'Mission is not open' });
        if (mission._count.participations >= mission.maxParticipants) {
            return res.status(400).json({ error: 'Mission is full' });
        }

        // 2. Check for overlapping missions (Business Rule)
        const missionStart = new Date(mission.datetime);
        const missionEnd = new Date(missionStart.getTime() + mission.duration * 60000);

        const overlapping = await prisma.participation.findFirst({
            where: {
                userId: userIdStr,
                status: 'JOINED',
                mission: {
                    OR: [
                        {
                            // Mission starts during an existing participation
                            datetime: { gte: missionStart, lte: missionEnd }
                        },
                        {
                            // Mission ends during an existing participation (approximate logic)
                            datetime: { lte: missionStart }
                        }
                    ]
                }
            },
            include: { mission: true }
        });

        // More precise overlap check
        if (overlapping) {
            const existingMissionStart = new Date(overlapping.mission.datetime);
            const existingMissionEnd = new Date(existingMissionStart.getTime() + overlapping.mission.duration * 60000);

            if (missionStart < existingMissionEnd && missionEnd > existingMissionStart) {
                return res.status(400).json({ error: 'You have an overlapping mission participation' });
            }
        }

        const participation = await prisma.participation.create({
            data: { userId: userIdStr, missionId },
        });

        res.status(201).json(participation);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const checkinMission = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        const missionId = req.params.id as string;
        const userIdStr = userId as string;

        const participation = await prisma.participation.update({
            where: { userId_missionId: { userId: userIdStr, missionId } },
            data: { status: 'ATTENDED' }
        });

        res.json({ message: 'Check-in successful', participation });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const getChat = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        const missionId = req.params.id as string;
        const userIdStr = userId as string;

        // Verify user is participant
        const participation = await prisma.participation.findUnique({
            where: { userId_missionId: { userId: userIdStr, missionId } }
        });

        if (!participation) return res.status(403).json({ error: 'Not a participant of this mission' });

        const missionIdStr = missionId as string;
        // Verify mission is not completed (Chat expires after mission completion)
        const mission = await prisma.mission.findUnique({ where: { id: missionIdStr } });
        if (mission?.status === 'COMPLETED') {
            return res.status(403).json({ error: 'Chat has expired' });
        }

        const messages = await prisma.message.findMany({
            where: { missionId: missionIdStr },
            include: { user: { select: { name: true } } },
            orderBy: { createdAt: 'asc' }
        });

        res.json(messages);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const sendMessage = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        const missionId = req.params.id as string;
        const userIdStr = userId as string;
        const { content } = req.body;

        const participation = await prisma.participation.findUnique({
            where: { userId_missionId: { userId: userIdStr, missionId } }
        });

        if (!participation) return res.status(403).json({ error: 'Not a participant of this mission' });

        const message = await prisma.message.create({
            data: { content, userId: userIdStr, missionId }
        });

        res.status(201).json(message);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};
