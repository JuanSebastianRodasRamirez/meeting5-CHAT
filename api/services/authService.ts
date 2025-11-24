import axios from 'axios';
import { VerifyTokenResponse } from '../types/index.js';
import logger from '../utils/logger.js';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';

/**
 * Verifies JWT token with backend principal
 * @param token - JWT token from client
 * @returns Object with userId if valid, null if invalid
 */
export const verifyToken = async (token: string): Promise<{ userId: string } | null> => {
  try {
    const response = await axios.get<VerifyTokenResponse>(
      `${BACKEND_URL}/api/users/verify-token`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    // Soportar ambos formatos de respuesta del backend
    const isValid = response.data.success ? response.data.valid : response.data.valid;
    const userId = response.data.userId;

    if (isValid && userId) {
      logger.info(`Token verified for user: ${userId}`);
      return { userId };
    }

    logger.warn('Token verification failed - invalid token');
    return null;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      logger.error(`Token verification error: ${error.response?.status} - ${error.response?.data?.message}`);
    } else {
      logger.error('Token verification error', error instanceof Error ? error : null);
    }
    return null;
  }
};
