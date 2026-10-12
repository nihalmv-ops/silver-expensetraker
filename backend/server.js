import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import eventsRouter from './routes/events.js';
import categoriesRouter from './routes/categories.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5050;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/silver_catering';

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health Check
app.get('/api/health', (req, res) => {
  const dbState = mongoose.connection.readyState;
  const stateMap = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };

  return res.json({
    status: 'ok',
    service: 'Silver Catering Backend API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    database: stateMap[dbState] || 'unknown',
  });
});

// API Routes
app.use('/api/events', eventsRouter);
app.use('/api/categories', categoriesRouter);

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'Silver Catering API Server is running.',
    endpoints: {
      health: '/api/health',
      events: '/api/events',
      syncEvents: '/api/events/sync',
      categories: '/api/categories',
    },
  });
});

// Database connection & Server Startup
async function startServer() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log('✅ MongoDB connected successfully to:', MONGODB_URI.includes('@') ? 'MongoDB Atlas Cloud' : MONGODB_URI);
  } catch (err) {
    console.warn('⚠️ Warning: MongoDB connection error:', err.message);
    console.warn('Backend server is still running. Endpoints requiring database will return appropriate error responses until MongoDB is connected.');
  }

  app.listen(PORT, () => {
    console.log(`🚀 Silver Catering Backend Server listening on port ${PORT}`);
    console.log(`📡 Local API URL: http://localhost:${PORT}/api/health`);
  });
}

// Handle unhandled rejections cleanly
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Promise Rejection:', reason);
});

startServer();

export default app;
