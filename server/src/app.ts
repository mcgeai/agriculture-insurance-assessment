import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config';
import { initDb, seedDb } from './models/database';
import { apiLimiter } from './middleware/rateLimit';
import { errorHandler } from './middleware/errorHandler';
import authRoutes from './routes/auth';
import quizRoutes from './routes/quiz';
import adminRoutes from './routes/admin';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use('/api', apiLimiter);

// Initialize DB on startup
initDb();

// Try seed (idempotent with UNIQUE constraint on employee_no)
try { seedDb(); } catch { /* seed data may already exist */ }

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/assessments', quizRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

// Error handler
app.use(errorHandler);

app.listen(config.port, () => {
  console.log(`Server running on http://localhost:${config.port}`);
});

export default app;
