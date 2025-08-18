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
const adminRoutes = require('./routes/admin');
const walletRoutes = require('./routes/wallet');
const spuRoutes = require('./routes/spus');
const spuBatchImportRoutes = require('./routes/spu-batch-import');
const spuQuotesRoutes = require('./routes/spu-quotes');
const { router: spuPriceHistoryRoutes } = require('./routes/spu-price-history');
const cosRoutes = require('./routes/cos');
const userDiscountRulesRoutes = require('./routes/user-discount-rules');
// const dianxiaomiRoutes = require('./routes/dianxiaomi'); // 已删除，店小秘无API

// Import database
const { testConnection } = require('./config/database');

// Import commission cron job
// const commissionCronJob = require('./utils/commissionCronJob');

// Import DianXiaoMi cron jobs
// const dianxiaomiCronJobs = require('./utils/dianxiaomiCronJobs'); // 已删除，店小秘无API

const app = express();
const PORT = process.env.PORT || 5001;

// CORS configuration - 必须在其他中间件之前
app.use(cors({
  origin: function (origin, callback) {
    console.log('🔍 CORS请求来源:', origin);
    const allowedOrigins = process.env.NODE_ENV === 'production' 
      ? ['https://syntaxdropshipping.com'] 
      : ['http://localhost:3000', 'http://localhost:3002'];
    
    console.log('📋 允许的来源列表:', allowedOrigins);
    
    // 允许没有origin的请求（如Postman）
    if (!origin) {
      console.log('✅ 允许无origin请求');
      return callback(null, true);
    }
    
    if (allowedOrigins.includes(origin)) {
      console.log('✅ CORS允许来源:', origin);
      callback(null, true);
    } else {
      console.log('❌ CORS拒绝来源:', origin);
      console.log('原因: 不在允许列表中');
      // 在开发环境下，暂时允许所有localhost请求
      if (process.env.NODE_ENV !== 'production' && origin.includes('localhost')) {
        console.log('🔧 开发环境: 允许localhost请求');
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'X-Requested-With', 'Accept']
}));

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: false, // 禁用CORP以避免CORS冲突
}));

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

// Request logging middleware
app.use((req, res, next) => {
  console.log(`🔍 [${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

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
app.use('/api/admin', adminRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/admin/spus', spuRoutes);
app.use('/api/admin/spu-batch-import', spuBatchImportRoutes);
app.use('/api/admin/spu-quotes', spuQuotesRoutes);
app.use('/api/admin/spu-price-history', spuPriceHistoryRoutes);
app.use('/api/cos', cosRoutes);
app.use('/api/admin/user-discount-rules', userDiscountRulesRoutes);
// app.use('/api/dianxiaomi', dianxiaomiRoutes); // 已删除，店小秘无API

// Settings routes
const settingsRoutes = require('./routes/settings');
app.use('/api/settings', settingsRoutes);

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
    
    // Start DianXiaoMi cron jobs
    try {
      // await dianxiaomiCronJobs.start(); // 已删除，店小秘无API
      console.log('✅ DianXiaoMi cron jobs started successfully');
    } catch (error) {
      console.error('❌ Failed to start DianXiaoMi cron jobs:', error);
    }
  } else {
    console.log('❌ Database connection failed');
    console.log('⚠️  Make sure MySQL is running and database is initialized');
    console.log('   Run: npm run init-db');
  }
  
  console.log('\n🌟 Server is ready!');
});