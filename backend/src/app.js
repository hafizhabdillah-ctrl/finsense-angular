const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const umkmRoutes = require('./routes/umkmRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const chatRoutes = require('./routes/chatRoutes');
const productRoutes = require('./routes/productRoutes');
const stockLogRoutes = require('./routes/stockLogRoutes');
const debtRoutes = require('./routes/debtRoutes');
const voiceRoutes = require('./routes/voiceRoutes');
const aiRoutes = require('./routes/aiRoutes');

const app = express();

const unwrapRoute = (route, name = 'unknown') => {
  console.log(`[Debug Route] '${name}' keys:`, Object.keys(route || {}));

  let resolved = route;
  if (resolved && typeof resolved !== 'function') {
    resolved = resolved.default || resolved.router || resolved;
  }

  if (typeof resolved !== 'function') {
    throw new Error(
      `[Route Error] Route '${name}' is type '${typeof resolved}'. Received keys: ${JSON.stringify(Object.keys(route || {}))}`
    );
  }
  return resolved;
};

app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use((req, res, next) => {
  console.log(`[Express] ${req.method} ${req.url}`);
  next();
});
app.use('/api/auth', unwrapRoute(authRoutes, 'authRoutes'));
app.use('/api/umkm', unwrapRoute(umkmRoutes, 'umkmRoutes'));
app.use('/api/transactions', unwrapRoute(transactionRoutes, 'transactionRoutes'));
app.use('/api/categories', unwrapRoute(categoryRoutes, 'categoryRoutes'));
app.use('/api/chat', unwrapRoute(chatRoutes, 'chatRoutes'));
app.use('/api/products', unwrapRoute(productRoutes, 'productRoutes'));
app.use('/api/stock-logs', unwrapRoute(stockLogRoutes, 'stockLogRoutes'));
app.use('/api/debts', unwrapRoute(debtRoutes, 'debtRoutes'));
app.use('/api', unwrapRoute(voiceRoutes, 'voiceRoutes'));
app.use('/api/ai', unwrapRoute(aiRoutes, 'aiRoutes'));

app.get('/api/health', (req, res) => res.json({ status: 'OK' }));

module.exports = app;
