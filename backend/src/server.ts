import express from 'express';
import cors from 'cors';
import path from 'path';
import helmet from 'helmet';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import cron from 'node-cron';
import axios from 'axios';
import { setupSocket } from './socket';
import { setupRoutes } from './routes';
import { apiLimiter, sanitizeInput } from './middleware/security';
import { errorHandler, errorLogger, notFoundHandler } from './middleware/errorHandler';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
  }
});

const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable for development; configure properly for production
  crossOriginEmbedderPolicy: false,
}));

// CORS middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Input sanitization
app.use(sanitizeInput);

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Rate limiting for API routes
app.use('/api', apiLimiter);

// Setup Socket.io
setupSocket(io);

// Setup routes
setupRoutes(app);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware (must be last)
app.use(notFoundHandler);
app.use(errorLogger);
app.use(errorHandler);

httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   CORS origin: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
  
  // Start recurring tasks cron job (runs every hour at minute 0)
  cron.schedule('0 * * * *', async () => {
    try {
      console.log('⏰ Running recurring tasks scheduler...');
      const response = await axios.post(`http://localhost:${PORT}/api/recurring-tasks/run`);
      console.log(`✓ Recurring tasks executed: ${response.data?.created || 0} items created`);
    } catch (error: any) {
      console.error('✗ Recurring tasks scheduler error:', error.message);
    }
  });
  
  console.log('⏰ Recurring tasks scheduler enabled (runs every hour)');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: Error) => {
  console.error('Unhandled Promise Rejection:', reason);
  // In production, you might want to exit the process and let PM2/Docker restart it
  // process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  console.error('Uncaught Exception:', error);
  // Exit the process as the application might be in an unstable state
  process.exit(1);
});

