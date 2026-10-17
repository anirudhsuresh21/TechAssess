import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import swaggerUi from 'swagger-ui-express';
import { config } from './config/environment';
import { generalLimiter } from './middleware/rateLimiter';
import { errorHandler, AppError } from './middleware/errorHandler';
import { swaggerDocument } from './utils/swagger';

import { authRouter } from './modules/auth/auth.routes';
import { assessmentRouter } from './modules/assessments/assessment.routes';
import { questionRouter } from './modules/questions/question.routes';
import { candidateRouter } from './modules/candidates/candidate.routes';
import { attemptRouter } from './modules/attempts/attempt.routes';
import { resultRouter } from './modules/results/result.routes';
import { shortlistRouter } from './modules/shortlisting/shortlist.routes';
import { integrityRouter } from './modules/integrity/integrity.routes';
import { auditRouter } from './modules/audit/audit.routes';
import { codeRunnerRouter } from './modules/codeExecution/codeRunner.routes';

const app = express();

// Security and utility middlewares
app.use(
  helmet({
    contentSecurityPolicy: false, // Allows Swagger UI and local development
    crossOriginEmbedderPolicy: false,
  })
);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const allowed = [
        config.corsOrigin,
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'http://localhost:4000',
      ].filter(Boolean);

      if (
        allowed.includes(origin) ||
        origin.endsWith('.vercel.app') ||
        process.env.NODE_ENV !== 'production' ||
        process.env.VERCEL
      ) {
        return callback(null, true);
      }

      return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(generalLimiter);

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'TechAssess API',
    time: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Swagger documentation
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// API v1 routes
const v1Router = express.Router();
v1Router.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'TechAssess API',
    time: new Date().toISOString(),
    uptime: process.uptime(),
  });
});
v1Router.use('/auth', authRouter);
v1Router.use('/assessments', assessmentRouter);
v1Router.use('/questions', questionRouter);
v1Router.use('/candidate', candidateRouter);
v1Router.use('/attempts', attemptRouter);
v1Router.use('/results', resultRouter);
v1Router.use('/shortlist', shortlistRouter);
v1Router.use('/integrity', integrityRouter);
v1Router.use('/audit', auditRouter);
v1Router.use('/code', codeRunnerRouter);

app.use('/api/v1', v1Router);

// 404 handler
app.use('*', (req: Request, res: Response, next) => {
  next(new AppError(`Cannot ${req.method} ${req.originalUrl} - Not Found`, 404));
});

// Centralized error handler
app.use(errorHandler);

export default app;
