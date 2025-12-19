require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const compression = require('compression');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const authRoutes = require('./routes/auth');
const jwt = require('jsonwebtoken');
const User = require('./models/User');
const http = require('http');
const { Server } = require('socket.io');
const passport = require('passport');
const session = require('express-session');

require('./config/passport'); // Google strategy configuration

// Import Notification model for cleanup task
const Notification = require('./models/Notification');

const app = express();

// Trust proxy - Required when behind a reverse proxy (e.g., Render, Heroku, etc.)
app.set('trust proxy', 1);

// Security and performance middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https://api.qrserver.com"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'"],
    },
  },
}));
app.use(compression()); // Compress responses

// Rate limiting for auth endpoints - More lenient
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Increased limit to 20 requests per 15 minutes
  message: 'Too many login attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
});

// Apply rate limiting to auth routes
app.use('/api/auth', authLimiter);

// CORS configuration - Handle multiple frontend URLs
app.use(cors({
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:3000',
      'https://custom-web-frontend.onrender.com',
      'https://capitalcove.me',
      'https://www.capitalcove.me'
    ];
    
    console.log('CORS Origin Check:', origin);
    
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      console.log('No origin provided, allowing request');
      return callback(null, true);
    }
    
    // Check if origin is in allowed list
    if (allowedOrigins.includes(origin)) {
      console.log('Origin allowed:', origin);
      callback(null, true);
    } else {
      console.log('Origin not allowed:', origin);
      // For debugging, allow all origins but log them
      console.log('Allowing origin for debugging:', origin);
      callback(null, true);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Content-Length', 'X-Requested-With'],
  optionsSuccessStatus: 200,
  preflightContinue: false
}));

// Body parsing middleware with size limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Session middleware for Passport
app.use(session({
  secret: process.env.SESSION_SECRET || 'your_session_secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Request timeout middleware
app.use((req, res, next) => {
  req.setTimeout(30000, () => {
    res.status(408).json({ message: 'Request timeout' });
  });
  next();
});

// Handle preflight requests
app.options('*', cors());

// Manual CORS headers as backup - Handle multiple frontend URLs
app.use((req, res, next) => {
    const allowedOrigins = [
      'http://localhost:3000',
      'https://custom-web-frontend.onrender.com',
      'https://custom-web-app.onrender.com',
      'https://biharitsolution.onrender.com',
      'https://capitalcove.me',
      'https://www.capitalcove.me'
    ];
  
  const origin = req.headers.origin;
  console.log('Manual CORS - Request Origin:', origin);
  console.log('Manual CORS - Request Method:', req.method);
  
  // Set CORS headers for all origins during debugging
  if (origin) {
    res.header('Access-Control-Allow-Origin', origin);
    console.log('Manual CORS - Origin allowed:', origin);
  }
  
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    console.log('Manual CORS - Handling OPTIONS request');
    res.sendStatus(200);
  } else {
    next();
  }
});

// CORS test route
app.get('/api/cors-test', (req, res) => {
  console.log('CORS Test - Origin:', req.headers.origin);
  console.log('CORS Test - Method:', req.method);
  res.json({ 
    message: 'CORS test successful',
    origin: req.headers.origin,
    timestamp: new Date().toISOString()
  });
});

// Health check route
app.get('/api/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  
  res.json({ 
    status: 'OK',
    message: 'Backend is running',
    timestamp: new Date().toISOString(),
    database: {
      status: dbStatus,
      readyState: mongoose.connection.readyState
    },
    cors: {
      origin: req.headers.origin,
      method: req.method
    },
    environment: {
      nodeEnv: process.env.NODE_ENV,
      clientUrl: process.env.CLIENT_URL,
      hasJwtSecret: !!process.env.JWT_SECRET,
      hasMongoUri: !!process.env.MONGO_URI
    }
  });
});

// JWT middleware
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token, authorization denied.' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'changeme');
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid.' });
  }
}

// MongoDB connection with optimized settings and retry logic
const connectMongoDB = async (retries = 5, delay = 5000) => {
  // Don't attempt to connect if already connected
  if (mongoose.connection.readyState === 1) {
    console.log('MongoDB already connected, skipping connection attempt');
    return;
  }

  for (let i = 0; i < retries; i++) {
    try {
      // Disconnect existing connection if in a bad state
      if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
      }

      await mongoose.connect(process.env.MONGO_URI, {
        maxPoolSize: 10, // Maintain up to 10 socket connections
        serverSelectionTimeoutMS: 10000, // Keep trying to send operations for 10 seconds
        socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
        bufferCommands: true, // Enable mongoose buffering for retry logic
        connectTimeoutMS: 10000, // Give up initial connection after 10 seconds
        heartbeatFrequencyMS: 30000, // Send a heartbeat every 30 seconds
        retryWrites: true,
        retryReads: true,
      });
      console.log('MongoDB connected successfully');
      console.log('Connection state:', mongoose.connection.readyState);
      return;
    } catch (err) {
      // Only log full error details on first and last attempt to reduce spam
      if (i === 0 || i === retries - 1) {
        console.error(`MongoDB connection attempt ${i + 1}/${retries} failed:`, err.message);
      } else {
        console.error(`MongoDB connection attempt ${i + 1}/${retries} failed:`, err.message.split('\n')[0]);
      }
      
      if (i < retries - 1) {
        console.log(`Retrying in ${delay / 1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        // Exponential backoff
        delay = Math.min(delay * 1.5, 30000);
      } else {
        console.error('MongoDB connection failed after all retries. Server will continue but database operations may fail.');
        console.log('Please check your MONGO_URI in .env file');
        console.log('Common issues:');
        console.log('  - Network connectivity problems');
        console.log('  - Incorrect MONGO_URI format');
        console.log('  - MongoDB Atlas IP whitelist restrictions');
      }
    }
  }
};

// Start connection
connectMongoDB();

// Handle MongoDB connection errors
let isReconnecting = false;

mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
  // Only attempt to reconnect if not already reconnecting and connection is actually closed
  if (mongoose.connection.readyState === 0 && !isReconnecting) {
    isReconnecting = true;
    console.log('Attempting to reconnect to MongoDB...');
    setTimeout(() => {
      connectMongoDB(3, 5000).finally(() => {
        isReconnecting = false;
      });
    }, 5000);
  }
});

mongoose.connection.on('disconnected', () => {
  // Only log if not already reconnecting to avoid spam
  if (!isReconnecting) {
    console.log('MongoDB disconnected - attempting to reconnect...');
    isReconnecting = true;
    setTimeout(() => {
      connectMongoDB(3, 5000).finally(() => {
        isReconnecting = false;
      });
    }, 5000);
  }
});

mongoose.connection.on('connected', () => {
  console.log('MongoDB connected - ready for operations');
  // Run initial cleanup when connection is established
  cleanupExpiredNotifications();
});

mongoose.connection.on('reconnected', () => {
  console.log('MongoDB reconnected successfully');
  cleanupExpiredNotifications();
});

const PORT = process.env.PORT || 5000;
app.use('/api/auth', authRoutes);

// Protected user dashboard route with caching (must be before static file serving)
app.get('/api/dashboard', authMiddleware, async (req, res) => {
  try {
    if (req.user.role === 'admin') {
      const userCount = await User.countDocuments();
      const dbUser = await User.findById(req.user.id).select('-password').lean();
      if (!dbUser) {
        return res.status(404).json({ message: 'User not found.' });
      }
      return res.json({
        message: 'Welcome to the admin dashboard!',
        user: dbUser,
        stats: {
          userCount,
        }
      });
    }
    const dbUser = await User.findById(req.user.id).select('-password').lean();
    if (!dbUser) {
      return res.status(404).json({ message: 'User not found.' });
    }
    res.json({ message: 'Welcome to your dashboard!', user: dbUser });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Serve static files from React app in production (must be after all API routes)
if (process.env.NODE_ENV === 'production') {
  const path = require('path');
  // Serve static files from React build
  app.use(express.static(path.join(__dirname, '../frontend/build')));
  
  // Serve React app for all non-API routes (must be last)
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/build/index.html'));
  });
} else {
  // Development: API info route
  app.get('/', (req, res) => {
    res.send('API is running...');
  });
}

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: [
      'http://localhost:3000',
      'https://custom-web-frontend.onrender.com',
      'https://custom-web-app.onrender.com',
      'https://biharitsolution.onrender.com',
      'https://capitalcove.me',
      'https://www.capitalcove.me'
    ],
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Simple in-memory chat (for demo)
let chatHistory = [];

io.on('connection', (socket) => {
  // Send chat history to the newly connected client
  socket.emit('chat history', chatHistory);

  // Listen for new messages
  socket.on('chat message', (msg) => {
    chatHistory.push(msg);
    // Limit history size
    if (chatHistory.length > 100) chatHistory.shift();
    io.emit('chat message', msg); // Broadcast to all
  });
});

// Scheduled task to clean expired notifications (runs every hour)
const cleanupExpiredNotifications = async () => {
  // Check if MongoDB is connected before running cleanup
  if (mongoose.connection.readyState !== 1) {
    console.log('MongoDB not connected, skipping notification cleanup');
    return;
  }
  
  try {
    const deletedCount = await Notification.cleanExpired();
    if (deletedCount > 0) {
      console.log(`Cleaned up ${deletedCount} expired notifications`);
    }
  } catch (error) {
    console.error('Error in notification cleanup task:', error);
  }
};

// Schedule cleanup to run every hour (only runs if MongoDB is connected)
setInterval(cleanupExpiredNotifications, 60 * 60 * 1000); // 1 hour

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Notification cleanup task scheduled (runs every hour)');
}); 