const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const path = require('path');
const { connectDB, getDBStatus } = require('./config/db');
const { initMySQL, getMySQLStatus } = require('./config/mysql');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config();

// Initialize Databases: MySQL (if configured) or MongoDB fallback
(async () => {
  if (process.env.MYSQL_DATABASE || process.env.DB_TYPE === 'mysql') {
    const ok = await initMySQL();
    if (!ok && process.env.MONGO_URI && !process.env.MONGO_URI.includes('127.0.0.1')) {
      connectDB();
    }
  } else if (process.env.MONGO_URI && !process.env.MONGO_URI.includes('127.0.0.1')) {
    connectDB();
  } else {
    // Try MySQL first by default on cPanel, otherwise try Mongo
    const mysqlOk = await initMySQL();
    if (!mysqlOk && process.env.MONGO_URI) {
      connectDB();
    }
  }
})();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
const allowedOrigin = process.env.CLIENT_URL || '*';
app.use(cors({
  origin: allowedOrigin === '*' ? '*' : [allowedOrigin, 'http://localhost:5173', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/services', require('./routes/serviceRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/contact', require('./routes/contactRoutes'));
app.use('/api/v1/bridge', require('./routes/bridgeRoutes'));
app.use('/bridge', require('./routes/bridgeRoutes'));
app.use('/airpay-test', require('./routes/testRoutes'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date(),
    service: 'Modevia Nine Hertz API',
    database: getMySQLStatus() ? 'mysql' : (getDBStatus() ? 'mongodb' : 'memory')
  });
});

// Serve frontend in production if built
const fs = require('fs');
const clientDistCandidates = [
  path.join(__dirname, '../client/dist'),
  path.join(__dirname, 'public'),
  path.join(__dirname, 'dist')
];
const foundDist = clientDistCandidates.find(p => fs.existsSync(p));
if (foundDist) {
  console.log(`📦 Serving static frontend from: ${foundDist}`);
  app.use(express.static(foundDist));
  app.get('*', (req, res) => {
    res.sendFile(path.join(foundDist, 'index.html'));
  });
}

// Error Handler
app.use((err, req, res, next) => {
  console.error('[Server Error] ❌ Unhandled Request Error:', err.stack || err);
  res.status(500).json({ success: false, message: 'Internal Server Error' });
});

// Process-level unhandled rejection & uncaught exception loggers for cPanel console
process.on('unhandledRejection', (reason, promise) => {
  console.error('[Process Error] ❌ Unhandled Promise Rejection:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('[Process Error] ❌ Uncaught Exception:', err.stack || err);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Modevia Nine Hertz Express Server running on port ${PORT}`);
  console.log(`🔗 API endpoint: http://0.0.0.0:${PORT}/api/health`);
});
