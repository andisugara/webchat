import express from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import apiRouter from './routes/api';
import { initDatabase } from './db/init';
import { initSocketIO } from './sockets/chatSocket';

dotenv.config();

const app = express();
const server = http.createServer(app);

const PORT = parseInt(process.env.PORT || '8000', 10);
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Middlewares
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
}));
app.use(express.json());

// Routes
app.use('/api', apiRouter);

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'SITA Badung AI Webchat API',
    model: process.env.FIREWORKS_MODEL || 'accounts/fireworks/models/gpt-oss-120b',
    timestamp: new Date().toISOString(),
  });
});

// Initialize Socket.io
initSocketIO(server, FRONTEND_URL);

// Start server
async function startServer() {
  try {
    await initDatabase();
    server.listen(PORT, () => {
      console.log(`🚀 SITA Badung Webchat Backend running on http://localhost:${PORT}`);
      console.log(`📊 Health check available at http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
