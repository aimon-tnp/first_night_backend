require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const apiRouter = require('./src/routes/api');

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Main API router
app.use('/api', apiRouter);

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'First Night Backend is running' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal server error',
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
