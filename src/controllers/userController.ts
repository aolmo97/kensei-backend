import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../utils/prisma';

export const getMe = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                name: true,
                age: true,
                location: true,
                interests: true,
                energyLevel: true,
                availability: true,
                reputationScore: true,
                createdAt: true,
            },
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(user);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const updateMe = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        const { name, age, location, interests, energyLevel, availability } = req.body;

        const user = await prisma.user.update({
            where: { id: userId },
            data: {
                name,
                age: age ? parseInt(age) : undefined,
                location,
                interests,
                energyLevel: energyLevel ? parseInt(energyLevel) : undefined,
                availability,
            },
        });

        res.json({ message: 'Profile updated successfully', user });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};
