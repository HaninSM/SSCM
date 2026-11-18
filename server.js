require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');

const authRoutes = require('./src/routes/auth');
const serviceRoutes = require('./src/routes/services');
const posRoutes = require('./src/routes/pos');
const commissionRoutes = require('./src/routes/commissions');
const itemRoutes = require('./src/routes/items');

const app = express();
const PORT = process.env.PORT || 3000;

// Security & parsing middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files
app.use(express.static(path.join(__dirname, 'public')));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/pos', posRoutes);
app.use('/api/commissions', commissionRoutes);
app.use('/api/items', itemRoutes);

// SPA fallback — serve dashboard.html for dashboard routes
app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'pages', 'dashboard.html'));
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('[SERVER ERROR]', err.message);
  if (process.env.NODE_ENV === 'development') {
    console.error(err.stack);
  }
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Terjadi kesalahan internal pada server'
  });
});

app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 SSCM Server berjalan pada http://localhost:${PORT}`);
  console.log(`🏢 Mode: Bengkel (Workshop) & Salon Terpadu`);
  console.log(`====================================================`);
});
