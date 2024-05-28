const express = require('express');
require('dotenv').config();

const PORT = process.env.PORT || 3001;
const app = express();

// Middleware
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Import Routes
const routes = require('./routes');

// Use Routes
app.use('/api', routes);

// Error handling middleware
app.use((req, res) => {
  res.status(404).json({ error: 'Route Not found' });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Application running on port ${PORT}`);
});
