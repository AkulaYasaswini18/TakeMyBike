require('./config/env')();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Connect to DB
connectDB();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));
app.use('/uploads', express.static('uploads')); // Serve uploaded images

// Routes
app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

// Mount placeholder API routers (empty for now)
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/bikes', require('./routes/bikeRoutes'));
app.use('/api/bookings', require('./routes/bookingRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));
app.use('/api/deposits', require('./routes/depositRoutes'));
app.use('/api/reviews', require('./routes/reviewRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));

// Error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
