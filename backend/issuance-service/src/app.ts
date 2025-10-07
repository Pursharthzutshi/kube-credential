import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import routes from './routes';

export function createApp() {
const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use('/', routes);
app.get('/health', (_, res) => res.json({ status: 'ok', worker: process.env.WORKER_ID || null }));
return app;
}