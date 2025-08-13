const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const productRoutes = require('./routes/products');
const verificationRoutes = require('./routes/verification');
const commissionRoutes = require('./routes/commission');
const orderRoutes = require('./routes/ordersFixed');
const walletRoutes = require('./routes/wallet');

// Import database
const { testConnection } = require('./config/database');

// Import commission cron job
// const commissionCronJob = require('./utils/commissionCronJob');

const app = express();
const PORT = process.env.PORT || 5001;

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000 // limit each IP to 1000 requests per windowMs
});
app.use(limiter);

// Special rate limiting for verification codes
const verificationLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 3 // limit each IP to 3 verification requests per minute
});
app.use('/api/verification/send-code', verificationLimiter);

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://syntaxdropshipping.com'] 
    : ['http://localhost:3000'],
  credentials: true
}));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/verification', verificationRoutes);
app.use('/api/commission', commissionRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/wallet', walletRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Syntax Dropshipping Server is running',
    timestamp: new Date().toISOString()
  });
});

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../client/build/index.html'));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'production' ? {} : err.stack
  });
});

app.listen(PORT, async () => {
  console.log(`🚀 Syntax Dropshipping Server running on port ${PORT}`);
  console.log(`📱 H5 Frontend: http://localhost:3000`);
  console.log(`🔧 Admin Panel: http://localhost:3000/admin`);
  
  // Test database connection
  console.log('\n🔄 Testing database connection...');
  const dbConnected = await testConnection();
  
  if (dbConnected) {
    console.log('✅ Database connection successful');
    console.log(`📊 Database: ${process.env.DB_NAME || 'syntaxdropshipping'}`);
    
    // Start commission cron jobs
    try {
      // commissionCronJob.start();
      console.log('⏰ Commission cron jobs disabled (module not found)');
    } catch (error) {
      console.error('❌ Failed to start commission cron jobs:', error);
    }
  } else {
    console.log('❌ Database connection failed');
    console.log('⚠️  Make sure MySQL is running and database is initialized');
    console.log('   Run: npm run init-db');
  }
  
  console.log('\n🌟 Server is ready!');
});