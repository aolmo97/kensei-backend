import { PrismaClient } from '@prisma/client';

if (!process.env.DATABASE_URL) {
    console.error('CRITICAL: DATABASE_URL is not defined in environment variables');
}

const prisma = new PrismaClient({
    log: ['error', 'warn'],
});

export default prisma;
