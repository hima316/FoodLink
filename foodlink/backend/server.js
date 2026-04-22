require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initDB } = require('./db/database');

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/food', require('./routes/food'));
app.use('/api/requests', require('./routes/requests'));
app.use('/api/transactions', require('./routes/transactions'));
app.use('/api/cities', require('./routes/cities'));

app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

// 404 handler
app.use((req, res) => res.status(404).json({ error: 'Route not found' }));

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 5000;

initDB()
  .then(() => {
    app.listen(PORT, () => console.log(`🚀 FoodLink server running on port ${PORT}`));
  })
  .catch(err => {
    console.error('Failed to init DB:', err);
    process.exit(1);
  });
