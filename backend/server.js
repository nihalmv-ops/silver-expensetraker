import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import dns from 'dns';
import eventsRouter from './routes/events.js';
import categoriesRouter from './routes/categories.js';
import authRouter from './routes/auth.js';

import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Fix for Windows / ISP DNS resolution issues with MongoDB Atlas SRV records
// Only apply on Windows to prevent interfering with Linux container DNS resolvers on Render
if (process.platform === 'win32') {
  try {
    dns.setServers(['8.8.8.8', '1.1.1.1']);
  } catch {
    // Use default DNS if custom cannot be set
  }
}

dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5050;
let MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/silver_catering';

// Ensure proper db name if missing in Atlas URI
if (MONGODB_URI.startsWith('mongodb+srv://') && !MONGODB_URI.includes('?')) {
  if (MONGODB_URI.endsWith('.net') || MONGODB_URI.endsWith('.net/')) {
    MONGODB_URI = MONGODB_URI.replace(/\/+$/, '') + '/silver_catering?retryWrites=true&w=majority';
  }
}

// Disable Mongoose internal command buffering to prevent hanging queries on disconnect
mongoose.set('bufferCommands', false);

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

// Smart database connection guard for all /api endpoints (except /api/health)
app.use('/api', async (req, res, next) => {
  if (req.path === '/health') return next();

  // If already connected, proceed immediately
  if (mongoose.connection.readyState === 1) {
    return next();
  }

  // If disconnected, trigger reconnection attempt
  if (mongoose.connection.readyState === 0) {
    connectDb().catch(() => {});
  }

  // If connecting (2) or reconnecting, wait up to 8 seconds for connection to complete (handles cold starts)
  let waitCount = 0;
  while (mongoose.connection.readyState !== 1 && waitCount < 16) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    waitCount++;
  }

  if (mongoose.connection.readyState === 1) {
    return next();
  }

  return res.status(503).json({
    success: false,
    error: 'Database is establishing connection to MongoDB Atlas. Please wait a few seconds and try again.',
  });
});

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/events', eventsRouter);
app.use('/api/categories', categoriesRouter);

// Serve frontend dist build if present (full-stack Render support)
const distPath = path.join(__dirname, '..', 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
}

// Root route
app.get('/', (req, res) => {
  if (fs.existsSync(path.join(distPath, 'index.html'))) {
    return res.sendFile(path.join(distPath, 'index.html'));
  }
  res.json({
    message: 'Silver Catering API Server is running.',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      events: '/api/events',
      syncEvents: '/api/events/sync',
      categories: '/api/categories',
    },
  });
});

const mongooseOptions = {
  serverSelectionTimeoutMS: 30000,
  connectTimeoutMS: 30000,
  socketTimeoutMS: 45000,
  maxPoolSize: 10,
};

let isConnecting = false;

async function connectDb() {
  if (mongoose.connection.readyState === 1 || isConnecting) {
    return;
  }
  isConnecting = true;
  try {
    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(MONGODB_URI, mongooseOptions);
    console.log('✅ MongoDB connected successfully to:', MONGODB_URI.includes('@') ? 'MongoDB Atlas Cloud' : MONGODB_URI);
  } catch (err) {
    console.warn('⚠️ Warning: MongoDB connection error:', err.message);
  } finally {
    isConnecting = false;
  }
}

mongoose.connection.on('connected', () => {
  console.log('✅ MongoDB connection established');
});

mongoose.connection.on('disconnected', () => {
  console.warn('⚠️ MongoDB disconnected! Retrying connection in 5s...');
  setTimeout(() => connectDb().catch(() => {}), 5000);
});

mongoose.connection.on('error', (err) => {
  console.error('⚠️ MongoDB connection error:', err.message);
});

// Database connection & Server Startup
async function startServer() {
  await connectDb();

  const server = app.listen(PORT, () => {
    console.log(`🚀 Silver Catering Backend Server listening on port ${PORT}`);
    console.log(`📡 Local API URL: http://localhost:${PORT}/api/health`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`\n⚠️ Port ${PORT} is already in use by another process.`);
      console.error(`👉 Run in PowerShell: Stop-Process -Name node -Force`);
      process.exit(1);
    } else {
      console.error('Server error:', err);
    }
  });
}

// Handle unhandled rejections cleanly
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Promise Rejection:', reason);
});

startServer();

export default app;
