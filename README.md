# 📝 Meeting5 Chat Microservice

Real-time chat microservice for Meeting5 video conferencing platform using Socket.IO.

## 🎯 Overview

This microservice provides real-time chat functionality for meeting participants (2-10 concurrent users). It integrates with the Meeting5 backend for authentication and authorization using JWT tokens.

## 🔧 Technology Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **WebSocket**: Socket.IO v4
- **Authentication**: JWT (validated against backend)
- **Logger**: Winston
- **HTTP Client**: Axios

## 📋 Prerequisites

- Node.js (v18 or higher)
- Meeting5 Backend running on port 3000
- npm or yarn

## 🚀 Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Configure your .env file
```

## ⚙️ Environment Variables

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Backend Principal URL (para verificar JWT y permisos)
BACKEND_URL=http://localhost:3000

# CORS Origins
FRONTEND_URL=http://localhost:5173
BACKEND_PRINCIPAL_URL=http://localhost:3000
```

## 🏃 Running the Service

```bash
# Development mode with auto-reload
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

The service will be available at `http://localhost:3001`

## 📡 API Endpoints

### HTTP Endpoints

- `GET /` - Service information
- `GET /health` - Health check

### WebSocket Events

#### Client → Server

```typescript
// Connect with authentication
const socket = io('http://localhost:3001', {
  auth: {
    token: 'YOUR_JWT_TOKEN'
  }
});

// Join a meeting room
socket.emit('join-room', {
  meetingId: 'meeting-uuid',
  token: 'YOUR_JWT_TOKEN'
});

// Send a message
socket.emit('send-message', {
  content: 'Hello everyone!'
});

// Leave the room
socket.emit('leave-room');
```

#### Server → Client

```typescript
// Room joined confirmation
socket.on('room-joined', (data) => {
  console.log('Joined meeting:', data.meetingTitle);
  console.log('Participants:', data.participants);
});

// New message received
socket.on('new-message', (message) => {
  console.log(`${message.userName}: ${message.content}`);
});

// User joined
socket.on('user-joined', (data) => {
  console.log(`${data.userName} joined the chat`);
});

// User left
socket.on('user-left', (data) => {
  console.log(`${data.userName} left the chat`);
});

// Errors
socket.on('error', (error) => {
  console.error('Chat error:', error.message);
});
```

## 🔐 Authentication Flow

1. Client connects WebSocket with JWT in `handshake.auth.token`
2. `socketAuth` middleware validates token with backend
3. Backend verifies JWT at `GET /api/users/verify-token`
4. If valid, `socket.userId` is assigned
5. Client emits `join-room` with `meetingId` and `token`
6. `ChatController` verifies meeting access
7. Backend checks permissions at `GET /api/meetings/:id/participants`
8. If authorized, socket joins the room
9. Messages are isolated per room using Socket.IO Rooms

## 🏗️ Project Structure

```
meeting5-chat/
├── api/
│   ├── config/
│   │   └── socketConfig.ts          # Socket.IO configuration
│   ├── controllers/
│   │   └── ChatController.ts        # Message handling logic
│   ├── middleware/
│   │   └── socketAuth.ts            # Socket.IO authentication
│   ├── services/
│   │   ├── authService.ts           # JWT verification
│   │   └── meetingService.ts        # Meeting access verification
│   ├── types/
│   │   └── index.ts                 # TypeScript types
│   ├── utils/
│   │   └── logger.ts                # Winston logger
│   └── index.ts                     # Server entry point
├── .env                              # Environment variables
├── .env.example                      # Environment template
├── .gitignore                        # Git ignore rules
├── package.json                      # Dependencies
├── tsconfig.json                     # TypeScript configuration
├── render.yaml                       # Render deployment config
└── README.md                         # This file
```

## 🧪 Testing

### Test Health Endpoint

```bash
curl http://localhost:3001/health
```

Expected response:
```json
{
  "success": true,
  "message": "Chat service running",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Test WebSocket Connection

1. Get JWT from backend (login endpoint)
2. Connect to `ws://localhost:3001` with auth token
3. Emit `join-room` event
4. Emit `send-message` event
5. Verify message isolation per room

## 🚨 Troubleshooting

### CORS Error
- Verify `FRONTEND_URL` in `.env` matches client origin

### Authentication Error
- Ensure JWT token is sent in `socket.handshake.auth.token`

### Access Denied
- Verify user is in meeting participants or is the host

### Backend Connection Refused
- Check `BACKEND_URL` is correct and backend is running

### Messages Not Isolated
- Confirm using `socket.join(meetingId)` and `io.to(meetingId).emit()`

## 📦 Deployment

### Render Deployment

The service includes a `render.yaml` configuration for easy deployment to Render.

1. Push code to GitHub
2. Connect repository to Render
3. Set environment variables in Render dashboard
4. Deploy

## 📚 Resources

- [Socket.IO Documentation](https://socket.io/docs/v4/)
- [Socket.IO Rooms](https://socket.io/docs/v4/rooms/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Winston Logger](https://github.com/winstonjs/winston)

## 📄 License

ISC

## 👥 Author

Meeting5 Team

---

**Made with ❤️ for Meeting5 Platform**