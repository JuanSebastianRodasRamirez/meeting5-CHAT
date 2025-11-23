import express, { Express, Request, Response } from 'express';
import { createServer } from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import { configureSocket } from './config/socketConfig.js';
import logger from './utils/logger.js';

dotenv.config();

const app: Express = express();
const httpServer = createServer(app);
const PORT = parseInt(process.env.PORT || '3001');

const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
const backendUrl = process.env.BACKEND_PRINCIPAL_URL || 'http://localhost:3000';

// CORS middleware
app.use(cors({
  origin: [frontendUrl, backendUrl],
  credentials: true
}));

app.use(express.json());

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Chat service running',
    timestamp: new Date().toISOString()
  });
});

// Root endpoint
app.get('/', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    service: 'Meeting5 Chat Microservice',
    version: '1.0.0',
    websocket: 'Socket.IO v4',
    endpoints: {
      health: '/health'
    }
  });
});

// Configure Socket.IO
const io = configureSocket(httpServer);

// Start server
httpServer.listen(PORT, () => {
  logger.info(`Chat service running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`Backend URL: ${process.env.BACKEND_URL}`);
});

export default app;
