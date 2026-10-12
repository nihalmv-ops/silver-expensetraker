import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import eventsRouter from '../backend/routes/events.js';
import categoriesRouter from '../backend/routes/categories.js';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cached MongoDB connection across serverless invocations
let cachedDb = null;

async function connectToDatabase() {
  if (cachedDb && mongoose.connection.readyState === 1) {
    return cachedDb;
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.warn('⚠️ MONGODB_URI is not set in environment variables');
    return null;
  }

  try {
    cachedDb = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    return cachedDb;
  } catch (err) {
    console.error('MongoDB serverless connection error:', err.message);
    return null;
  }
}

// Connect DB middleware before processing requests
app.use(async (req, res, next) => {
  await connectToDatabase();
  next();
});

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
    service: 'Silver Catering Backend API (Vercel Serverless)',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    database: stateMap[dbState] || 'disconnected',
    mongoConfigured: Boolean(process.env.MONGODB_URI),
  });
});

app.use('/api/events', eventsRouter);
app.use('/api/categories', categoriesRouter);

export default app;

