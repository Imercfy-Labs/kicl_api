const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const orderRoutes = require('./routes/orders');
const { authenticateToken } = require('./middleware/authMiddleware');

dotenv.config();
const app = express();

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true); // Allow requests with no origin

    const allowedOrigins = [
      'http://localhost:4200',
      'https://localhost:4200',
      'https://frolicking-beignet-6232ce.netlify.app',
      'https://devkicl.duckdns.org',
      'https://visionary-pothos-a2e342.netlify.app',
      'http://localhost:8081',
      'https://localhost:8081',
      'https://bright-phoenix-a39783.netlify.app'
    ];

    const webContainerRegex = /^https:\/\/.*\.webcontainer-api\.io$/;

    if (allowedOrigins.includes(origin) || webContainerRegex.test(origin)) {
      callback(null, true);
    } else {
      console.error('Blocked by CORS:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};



// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Routes
app.use('/api', authRoutes);
app.use('/api/users', authenticateToken, userRoutes);
app.use('/api/orders', authenticateToken, orderRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));

