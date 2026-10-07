require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const aiRoutes = require('./routes/ai');
const marketRoutes = require('./routes/market');
const marketplaceRoutes = require('./routes/marketplace');
const farmerRoutes = require('./routes/farmer');

const app = express();

// ─── Security & Logging ───────────────────────────────────────────────────────
app.use(helmet({ crossOriginEmbedderPolicy: false }));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── CORS ─────────────────────────────────────────────────────────────────────
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173,http://localhost:3000')
  .split(',').map(o => o.trim());

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: Origin not allowed: ${origin}`));
  },
  credentials: true,
}));

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'KrishiSetu Nexus API',
    version: '1.0.0',
    mode: process.env.SUPABASE_URL ? 'supabase-connected' : 'mock-demo',
    timestamp: new Date().toISOString(),
  });
});

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/ai', aiRoutes);
app.use('/api/market', marketRoutes);
app.use('/api/marketplace', marketplaceRoutes);
app.use('/api/farmer', farmerRoutes);

// ─── Root ─────────────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    message: '🌱 KrishiSetu Nexus API — From farmer question to verified farm action.',
    endpoints: {
      health: '/health',
      aiIntake: 'POST /api/ai/intake',
      aiDiagnose: 'POST /api/ai/diagnose',
      aiWeather: 'POST /api/ai/weather',
      aiTreatment: 'POST /api/ai/treatment',
      aiCost: 'POST /api/ai/cost',
      aiVerify: 'POST /api/ai/verify',
      aiFullWorkflow: 'POST /api/ai/full-workflow',
      marketPrices: 'GET /api/market/prices',
      schemes: 'GET /api/market/schemes',
      products: 'GET /api/marketplace/products',
      services: 'GET /api/marketplace/services',
      orders: 'POST /api/marketplace/orders',
      bookings: 'POST /api/marketplace/bookings',
      pestReports: 'GET /api/marketplace/pest-reports',
      farmerProfile: 'GET /api/farmer/profile/:id',
      farmerFarms: 'GET /api/farmer/farms/:farmerId',
      farmerDashboard: 'GET /api/farmer/dashboard/:farmerId',
      farmerObservations: 'GET /api/farmer/observations/:farmerId',
      farmerTasks: 'GET /api/farmer/tasks/:farmerId',
    },
    publicUrl: process.env.PUBLIC_URL || 'http://localhost:5173',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  });
});

// ─── 404 Handler ──────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.path}` });
});

// ─── Error Handler ────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[Error]', err.message);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

// ─── Start Server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';

app.listen(PORT, HOST, () => {
  console.log(`\n🌱 KrishiSetu Nexus Backend API`);
  console.log(`   Mode: ${process.env.SUPABASE_URL ? '✅ Supabase Cloud Connected' : '⚠️  Mock/Demo Mode (no Supabase URL)'}`);
  console.log(`   Local:   http://localhost:${PORT}`);
  console.log(`   Network: http://${HOST}:${PORT}`);
  console.log(`   Public:  ${process.env.PUBLIC_URL || `http://localhost:${PORT}`}\n`);
});

module.exports = app;
