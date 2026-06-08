require('dotenv').config();

const express = require('express');
const session = require('express-session');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const logger = require('./config/logger');
const { closeDatabase } = require('./config/db');

const authRoutes = require('./routes/auth');
const vehicleRoutes = require('./routes/vehicles');
const customerRoutes = require('./routes/customers');
const promotionRoutes = require('./routes/promotions');
const reportRoutes = require('./routes/reports');

const app = express();
const PORT = process.env.PORT || 5000;

// ===== Security Middleware =====

// Helmet - sets various HTTP security headers
app.use(helmet({
  contentSecurityPolicy: false, // Disabled for development API
  crossOriginEmbedderPolicy: false
}));

// CORS configuration
const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5173,http://localhost:4173,http://localhost:3000')
  .split(',').map(s => s.trim());

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      logger.warn(`CORS blocked request from origin: ${origin}`);
      callback(null, false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging with morgan
app.use(morgan('combined', {
  stream: {
    write: (message) => logger.info(message.trim())
  }
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
  message: { error: 'Too many requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api/', limiter);

// Stricter rate limit for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: { error: 'Too many login attempts. Please try again later.' }
});
app.use('/api/auth/login', authLimiter);

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'fallback-session-secret',
  resave: false,
  saveUninitialized: false,
  name: 'pms_sid',
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Trust proxy for rate limiting behind reverse proxy
app.set('trust proxy', 1);

// ===== Routes =====
app.use('/api/auth', authRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/promotions', promotionRoutes);
app.use('/api/reports', reportRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'PMS API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Serve static files from React build in production
if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, '..', 'frontend', 'dist');
  if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }
}

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Resource not found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({ error: 'Invalid token' });
  }
  if (err.code === 'EBADCSRFTOKEN') {
    return res.status(403).json({ error: 'Invalid CSRF token' });
  }
  res.status(500).json({
    error: process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message
  });
});

// ===== Server Startup =====
const httpsEnabled = process.env.HTTPS_ENABLED === 'true';

if (httpsEnabled) {
  try {
    const certPath = process.env.HTTPS_CERT_PATH || './certs/cert.pem';
    const keyPath = process.env.HTTPS_KEY_PATH || './certs/key.pem';

    if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
      const options = {
        cert: fs.readFileSync(certPath),
        key: fs.readFileSync(keyPath)
      };
      https.createServer(options, app).listen(PORT, () => {
        logger.info(`PMS API Server running with HTTPS on port ${PORT}`);
      });
    } else {
      logger.warn('HTTPS certificates not found. Falling back to HTTP.');
      http.createServer(app).listen(PORT, () => {
        logger.info(`PMS API Server running with HTTP on port ${PORT}`);
      });
    }
  } catch (err) {
    logger.error('HTTPS setup failed:', err);
    http.createServer(app).listen(PORT, () => {
      logger.info(`PMS API Server running with HTTP on port ${PORT} (fallback)`);
    });
  }
} else {
  http.createServer(app).listen(PORT, () => {
    logger.info(`PMS API Server running on http://localhost:${PORT}`);
    logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}

// Graceful shutdown
process.on('SIGINT', () => {
  logger.info('Shutting down server...');
  closeDatabase();
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('Shutting down server...');
  closeDatabase();
  process.exit(0);
});

module.exports = app;
