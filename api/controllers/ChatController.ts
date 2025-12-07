import { Server } from 'socket.io';
import { AuthenticatedSocket, JoinRoomPayload, SendMessagePayload, Message } from '../types/index.js';
import { getMeetingParticipants } from '../services/meetingService.js';
import logger from '../utils/logger.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Handles Socket.IO chat events
 */
export class ChatController {
  private io: Server;

  constructor(io: Server) {
    this.io = io;
  }

  /**
   * Handles user joining a meeting room
   */
  public handleJoinRoom = async (socket: AuthenticatedSocket, payload: JoinRoomPayload): Promise<void> => {
    try {
      const { meetingId, token } = payload;

      if (!socket.userId) {
        socket.emit('error', { message: 'User not authenticated' });
        return;
      }

      // Verify access to meeting
      const meetingData = await getMeetingParticipants(meetingId, token);

      if (!meetingData) {
        logger.warn(`Join room denied - User ${socket.userId} has no access to meeting ${meetingId}`);
        socket.emit('error', { message: 'Access denied to this meeting' });
        return;
      }

      // Get user name from participant details OR host
      const userDetails = meetingData.participantDetails.find(p => p.id === socket.userId) || 
                            (meetingData.host.id === socket.userId ? meetingData.host : null);
                            

      let userName: string;
      
      if (userDetails) {
        // User is a participant or host
        userName = `${userDetails.firstName} ${userDetails.lastName}`;
      } else if (meetingData.isPublic) {
        // Public meeting - allow authenticated users who aren't participants
        userName = `Guest ${socket.userId.substring(0, 8)}`;
        logger.info(`Guest user ${socket.userId} joining public meeting ${meetingId}`);
      } else {
        // Private meeting and user not in participant list
        logger.warn(`Join room denied - User ${socket.userId} not found in private meeting ${meetingId}`);
        socket.emit('error', { message: 'User not found in this meeting' });
        return;
      }

      // Join the room
      socket.join(meetingId);
      socket.meetingId = meetingId;
      socket.userName = userName;

      logger.info(`User ${socket.userId} (${userName}) joined room ${meetingId}`);

      // Notify others in the room
      socket.to(meetingId).emit('user-joined', {
        userId: socket.userId,
        userName,
        timestamp: new Date().toISOString()
      });

    // Confirm to the user
    socket.emit('room-joined', {
      meetingId,
      meetingTitle: meetingData.title,
      participants: meetingData.participantDetails,
      isPublic: meetingData.isPublic,
      message: `Successfully joined ${meetingData.title}`
    });    } catch (error) {
      logger.error('Error joining room', error instanceof Error ? error : null);
      socket.emit('error', { message: 'Failed to join room' });
    }
  };

  /**
   * Handles sending messages
   */
  public handleSendMessage = (socket: AuthenticatedSocket, payload: SendMessagePayload): void => {
    try {
      const { userName, content } = payload;

      if (!socket.userId || !socket.meetingId || !socket.userName) {
        socket.emit('error', { message: 'Not in a meeting room' });
        return;
      }

      if (!content || content.trim() === '') {
        socket.emit('error', { message: 'Message content cannot be empty' });
        return;
      }

      const message: Message = {
        id: uuidv4(),
        meetingId: socket.meetingId,
        userId: socket.userId,
        userName: userName,
        content: content.trim(),
        timestamp: new Date()
      };

      // Broadcast to everyone in the room (including sender)
      this.io.to(socket.meetingId).emit('new-message', message);

      logger.info(`Message sent in room ${socket.meetingId} by ${socket.userName}`);

    } catch (error) {
      logger.error('Error sending message', error instanceof Error ? error : null);
      socket.emit('error', { message: 'Failed to send message' });
    }
  };

  /**
   * Handles requests for number of users connected to a room
   * Emits `room-count` back to the requesting socket with both socket-level count
   * (number of socket connections) and unique user count (distinct `userId`s).
   */
  public handleGetRoomCount = async (socket: AuthenticatedSocket, payload: { meetingId?: string } = {}): Promise<void> => {
    console.log("handleGetRoomCount called with payload:", payload);
    try {
      const meetingId = payload.meetingId || socket.meetingId;

      if (!meetingId) {
        socket.emit('error', { message: 'meetingId is required' });
        return;
      }

      // allSockets returns a Set of socket ids currently in the room
      const socketsInRoom = await this.io.in(meetingId).allSockets();
      const socketsCount = socketsInRoom.size;

      // Derive unique users by reading userId from each socket (if available)
      const userIds = new Set<string>();
      const socketIds: string[] = [];
      for (const socketId of socketsInRoom) {
        socketIds.push(socketId);
        const s = this.io.sockets.sockets.get(socketId) as AuthenticatedSocket | undefined;
        if (s && s.userId) userIds.add(s.userId);
      }
      const uniqueUserCount = userIds.size;

      const socketIdsArr = socketIds;
      const userIdsArr = Array.from(userIds);

      logger.info(`Room count for ${meetingId}: sockets=${socketsCount}, uniqueUsers=${uniqueUserCount}, socketIds=${socketIdsArr.join(',')}`);

      socket.emit('room-count', { meetingId, socketsCount, uniqueUserCount, socketIds: socketIdsArr, userIds: userIdsArr });
    } catch (error) {
      logger.error('Error getting room count', error instanceof Error ? error : null);
      socket.emit('error', { message: 'Failed to get room count' });
    }
  };

  public handleGetAVStatus = async (socket: AuthenticatedSocket, payload: { meetingId?: string, peerId?: string, audioEnabled?: boolean, videoEnabled?: boolean } = {}): Promise<void> => {
    try {

      console.log("handleGetAVStatus called with payload:", payload);
      if (!socket.userId || !socket.meetingId || !socket.userName) {
        socket.emit('error', { message: 'Not in a meeting room' });
        return;
      }
      // Broadcast to everyone in the room (including sender)
      this.io.to(socket.meetingId).emit('new-av-status', payload);
      
    } catch (error) {
      logger.error('Error handling AV status', error instanceof Error ? error : null);
      socket.emit('error', { message: 'Failed to get AV status' });
    }
  }

  /**
   * Handles user leaving a room
   */
  public handleLeaveRoom = (socket: AuthenticatedSocket): void => {
    try {
      if (socket.meetingId) {
        socket.to(socket.meetingId).emit('user-left', {
          userId: socket.userId,
          userName: socket.userName,
          timestamp: new Date().toISOString()
        });

        logger.info(`User ${socket.userId} left room ${socket.meetingId}`);
        
        socket.leave(socket.meetingId);
        socket.meetingId = undefined;
        socket.userName = undefined;
      }
    } catch (error) {
      logger.error('Error leaving room', error instanceof Error ? error : null);
    }
  };

  /**
   * Handles disconnection
   */
  public handleDisconnect = (socket: AuthenticatedSocket): void => {
    try {
      if (socket.meetingId) {
        this.handleLeaveRoom(socket);
      }
      logger.info(`Socket disconnected: ${socket.id}`);
    } catch (error) {
      logger.error('Error handling disconnect', error instanceof Error ? error : null);
    }
  };

}
