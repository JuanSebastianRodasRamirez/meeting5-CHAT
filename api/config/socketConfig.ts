import { Server as HTTPServer } from 'http';
import { Server, ServerOptions } from 'socket.io';
import { socketAuth } from '../middleware/socketAuth.js';
import { ChatController } from '../controllers/ChatController.js';
import { AuthenticatedSocket } from '../types/index.js';
import logger from '../utils/logger.js';

const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
const backendUrl = process.env.BACKEND_PRINCIPAL_URL || 'http://localhost:3000';

/**
 * Configures Socket.IO server
 * @param httpServer - HTTP server instance
 * @returns Configured Socket.IO server
 */
export const configureSocket = (httpServer: HTTPServer): Server => {
  const io = new Server(httpServer, {
    cors: {
      origin: [frontendUrl, backendUrl],
      methods: ['GET', 'POST'],
      credentials: true
    },
    pingTimeout: 60000,
    pingInterval: 25000
  } as Partial<ServerOptions>);

  // Apply authentication middleware
  io.use(socketAuth);

  // Initialize chat controller
  const chatController = new ChatController(io);

  // Handle connections
  io.on('connection', (socket: AuthenticatedSocket) => {
    // Check if user is already connected
    const existingSockets = Array.from(io.sockets.sockets.values())
      .filter((s: any) => s.userId === socket.userId && s.id !== socket.id);

    if (existingSockets.length > 0) {
      logger.warn(`Connection rejected - User ${socket.userId} is already connected with socket ${existingSockets[0].id}`);
      socket.emit('error', { message: 'User already connected from another session' });
      socket.disconnect(true);
      return;
    }

    logger.info(`Client connected: ${socket.id} - User: ${socket.userId}`);

    // Event listeners
    socket.on('join-room', (payload) => chatController.handleJoinRoom(socket, payload));
    socket.on('send-message', (payload) => chatController.handleSendMessage(socket, payload));
    socket.on('get-room-count', (payload) => chatController.handleGetRoomCount(socket, payload));
    socket.on('leave-room', () => chatController.handleLeaveRoom(socket));
    socket.on('disconnect', () => chatController.handleDisconnect(socket));

    // Error handling
    socket.on('error', (error) => {
      logger.error(`Socket error from ${socket.id}`, error instanceof Error ? error : null);
    });
  });

  logger.info('Socket.IO server configured successfully');
  return io;
};
