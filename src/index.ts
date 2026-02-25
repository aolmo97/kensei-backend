import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import missionRoutes from './routes/missionRoutes';
import matchingRoutes from './routes/matchingRoutes';
import ratingRoutes from './routes/ratingRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Routes
app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/missions', missionRoutes);
app.use('/recommendations', matchingRoutes);
app.use('/ratings', ratingRoutes);

app.listen(PORT, () => {
    console.log(`Kensei Social Backend running on http://localhost:${PORT}`);
});
