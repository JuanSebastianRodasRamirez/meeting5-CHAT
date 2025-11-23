import { Socket } from 'socket.io';
import { ExtendedError } from 'socket.io/dist/namespace';
import { verifyToken } from '../services/authService.js';
import { AuthenticatedSocket } from '../types/index.js';
import logger from '../utils/logger.js';

/**
 * Socket.IO authentication middleware
 * Verifies JWT token before allowing connection
 */
export const socketAuth = async (
  socket: Socket,
  next: (err?: ExtendedError) => void
): Promise<void> => {
  try {
    const token = socket.handshake.auth.token;

    if (!token) {
      logger.warn(`Connection rejected - no token provided: ${socket.id}`);
      return next(new Error('Authentication error - token required'));
    }

    const result = await verifyToken(token);

    if (!result) {
      logger.warn(`Connection rejected - invalid token: ${socket.id}`);
      return next(new Error('Authentication error - invalid token'));
    }

    // Attach userId to socket
    (socket as AuthenticatedSocket).userId = result.userId;
    
    logger.info(`Socket authenticated: ${socket.id} - User: ${result.userId}`);
    next();
  } catch (error) {
    logger.error('Socket authentication error', error instanceof Error ? error : null);
    next(new Error('Authentication error'));
  }
};
