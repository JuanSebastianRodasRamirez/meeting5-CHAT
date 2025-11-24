import { Socket } from 'socket.io';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface Message {
  id: string;
  meetingId: string;
  userId: string;
  userName: string;
  content: string;
  timestamp: Date;
}

export interface AuthenticatedSocket extends Socket {
  userId?: string;
  meetingId?: string;
  userName?: string;
}

export interface JoinRoomPayload {
  meetingId: string;
  token: string;
}

export interface SendMessagePayload {
  userName: string;
  content: string;
}

export interface VerifyTokenResponse {
  success: boolean;
  valid?: boolean;
  userId?: string;
  message?: string;
}

export interface MeetingParticipantsResponse {
  success: boolean;
  data?: {
    meetingId: string;
    title: string;
    hostId: string;
    host: User;
    participants: string[];
    participantDetails: User[];
    isPublic: boolean;
  };
  message?: string;
}
