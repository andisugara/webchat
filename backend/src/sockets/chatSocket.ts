import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';

let io: SocketIOServer | null = null;

export function initSocketIO(httpServer: HttpServer, frontendUrl: string): SocketIOServer {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: '*', // Allow all origins for dev/playground
      methods: ['GET', 'POST', 'PATCH'],
    },
  });

  io.on('connection', (socket: Socket) => {
    console.log(`🔌 Socket client connected: ${socket.id}`);

    // Join a specific chat session room
    socket.on('join_session', (sessionId: string) => {
      socket.join(sessionId);
      console.log(`👤 Client ${socket.id} joined session room: ${sessionId}`);
    });

    // Join agent broadcast room
    socket.on('join_agent_room', () => {
      socket.join('agent_room');
      console.log(`👮 Agent ${socket.id} joined agent broadcast room`);
    });

    // Typing indicator
    socket.on('typing', ({ sessionId, senderName }: { sessionId: string; senderName: string }) => {
      socket.to(sessionId).emit('user_typing', { senderName });
    });

    socket.on('stop_typing', ({ sessionId }: { sessionId: string }) => {
      socket.to(sessionId).emit('user_stop_typing');
    });

    // Escalation trigger from visitor
    socket.on('request_escalation', ({ sessionId, visitorName, reason }: { sessionId: string; visitorName: string; reason?: string }) => {
      console.log(`🚨 Escalation requested for session ${sessionId} by ${visitorName}`);
      // Notify all agents in agent_room
      io?.to('agent_room').emit('new_escalation_alert', {
        sessionId,
        visitorName,
        reason: reason || 'Pengunjung meminta bantuan petugas langsung',
        timestamp: new Date().toISOString(),
      });
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Socket client disconnected: ${socket.id}`);
    });
  });

  return io;
}

export function getSocketIO(): SocketIOServer | null {
  return io;
}
