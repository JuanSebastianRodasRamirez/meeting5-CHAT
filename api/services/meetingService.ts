import axios from 'axios';
import { MeetingParticipantsResponse, User } from '../types/index.js';
import logger from '../utils/logger.js';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';

/**
 * Verifies if user has access to meeting and gets participant details
 * @param meetingId - Meeting ID
 * @param token - JWT token
 * @returns Meeting data if user has access, null otherwise
 */
export const getMeetingParticipants = async (
  meetingId: string,
  token: string
): Promise<{
  meetingId: string;
  title: string;
  hostId: string;
  host: User;
  participants: string[];
  participantDetails: User[];
} | null> => {
  try {
    const response = await axios.get<MeetingParticipantsResponse>(
      `${BACKEND_URL}/api/meetings/${meetingId}/participants`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    if (response.data.success && response.data.data) {
      logger.info(`Meeting access verified: ${meetingId}`);
      return response.data.data;
    }

    logger.warn(`Meeting access denied: ${meetingId}`);
    return null;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      logger.error(`Meeting verification error: ${error.response?.status} - ${error.response?.data?.message}`);
    } else {
      logger.error('Meeting verification error', error instanceof Error ? error : null);
    }
    return null;
  }
};
