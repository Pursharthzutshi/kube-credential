import express from 'express';
import bodyParser from 'body-parser';
import cors, { CorsOptions } from 'cors';
import routes from './routes';

const normalizeOrigin = (origin: string) => origin.replace(/\/$/, '');

const envOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean)
  .map(normalizeOrigin);

const fallbackOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
].map(normalizeOrigin);

const allowedEnvOrigins = envOrigins.length > 0 ? new Set(envOrigins) : null;
const fallbackOriginSet = new Set(fallbackOrigins);

const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    if (!origin) {
      return callback(null, true);
    }

    const normalized = normalizeOrigin(origin);

    if (allowedEnvOrigins) {
      return callback(null, allowedEnvOrigins.has(normalized));
    }

    if (fallbackOriginSet.has(normalized)) {
      return callback(null, true);
    }

    return callback(null, true);
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400,
  optionsSuccessStatus: 204,
};

export function createApp() {
  const app = express();
  const corsMiddleware = cors(corsOptions);

  app.use(corsMiddleware);
  app.options('*', corsMiddleware);
  app.use(bodyParser.json());
  app.use('/', routes);
  app.get('/health', (_, res) => res.json({ status: 'ok', worker: process.env.WORKER_ID || null }));

  return app;
}
