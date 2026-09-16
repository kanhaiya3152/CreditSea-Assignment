import cors from 'cors';
import express, { Express } from 'express';
import { env } from './config/env';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';
import applicationsRoutes from './routes/applications.routes';
import authRoutes from './routes/auth.routes';
import leadsRoutes from './routes/leads.routes';
import uploadsRoutes from './routes/uploads.routes';

export function createApp(): Express {
  const app = express();

  app.use(
    cors({
      origin: env.clientOrigins.length > 0 ? env.clientOrigins : true,
      allowedHeaders: ['Content-Type', 'Authorization'],
      // Browsers cache the preflight for a day, so the Authorization header doesn't
      // cost an extra OPTIONS round trip on every single cross-origin call.
      maxAge: 86400,
    }),
  );
  app.use(express.json());
  app.use(requestLogger);

  app.get('/api/health', (_req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/uploads', uploadsRoutes);
  app.use('/api/applications', applicationsRoutes);
  app.use('/api/leads', leadsRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
