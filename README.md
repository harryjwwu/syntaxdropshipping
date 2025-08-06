# Syntax Dropshipping Platform

A professional dropshipping platform built with React and Node.js, providing comprehensive e-commerce solutions for businesses worldwide.

## 🚀 Features

### ✅ Core Functions (Fully Working)
- **User Registration/Login**: Complete with JWT authentication
- **Email Verification System**: Gmail SMTP with verification codes
- **Product Display & Search**: Responsive product catalog
- **Database Integration**: MySQL with complete schema
- **Modern UI/UX**: Tailwind CSS responsive design
- **Contact System**: Professional contact forms

### Frontend (H5 Mobile-First)
- **Responsive Design**: Mobile-first approach with excellent desktop compatibility
- **User Authentication**: Email verification code system ✅
- **Modern UI/UX**: Clean, modern design with smooth animations
- **Service Pages**: Comprehensive information about dropshipping services
- **Product Catalog**: Browse and search through thousands of products
- **Real-time Validation**: Form validation with instant feedback

### Backend API
- **RESTful API**: Well-structured API endpoints ✅
- **User Management**: Registration, authentication, and profile management ✅
- **Email Service**: Gmail SMTP verification system ✅
- **MySQL Database**: Complete database integration ✅
- **JWT Authentication**: Secure token-based auth ✅
- **Rate Limiting**: Smart rate limiting for API protection ✅

### Core Services
1. **Dropshipping**: Complete order fulfillment without inventory
2. **China Sourcing**: End-to-end sourcing and manufacturing services
3. **Custom Packaging**: Branded packaging solutions
4. **Order Fulfillment**: 12-24 hour processing for stocked items

## 🛠️ Technology Stack

### Frontend
- **React 18**: Modern React with hooks
- **React Router**: Client-side routing
- **Tailwind CSS**: Utility-first CSS framework
- **React Hook Form**: Form validation and management
- **Axios**: HTTP client for API calls
- **React Hot Toast**: Toast notifications
- **Lucide React**: Beautiful icons
- **Framer Motion**: Smooth animations

### Backend
- **Node.js**: JavaScript runtime
- **Express.js**: Web framework
- **MySQL**: Database with connection pooling
- **JSON Web Tokens**: Authentication
- **Bcrypt**: Password hashing
- **Nodemailer**: Email service
- **Multer**: File upload handling
- **Helmet**: Security middleware
- **CORS**: Cross-origin resource sharing

## 📦 Installation

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Clone Repository
```bash
git clone <repository-url>
cd syntaxdropshipping
```

### Install Dependencies
```bash
# Install root dependencies
npm install

# Install client dependencies
cd client
npm install
cd ..
```

### Environment Variables
Create a `server/.env` file:
```env
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=syntaxdropshipping
DB_PORT=3306

# Server Configuration
PORT=5001
NODE_ENV=development

# JWT Configuration
JWT_SECRET=syntax_dropshipping_secret_key_2024

# Email Configuration (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

Create a `.env` file in the client directory:
```env
# API Configuration
REACT_APP_API_URL=http://localhost:5001/api
```

## 🚀 Running the Application

### Prerequisites
- MySQL Server 5.7+ or 8.0+ installed and running
- Node.js 14+ and npm installed

### Quick Start
```bash
# 1. Install all dependencies and initialize database
npm run setup

# 2. Start development server
npm run dev
```

### 🔄 Service Management Scripts
For easy development, use the provided restart scripts:

```bash
# Full restart with health checks and colored output
./restart-services.sh

# Quick restart for rapid development
./quick-restart.sh
```

Both scripts will:
- ✅ Stop existing services gracefully
- ✅ Clear port conflicts (5001, 3000)
- ✅ Start backend server (http://localhost:5001)
- ✅ Start frontend server (http://localhost:3000)
- ✅ Provide service status feedback

### Manual Setup
```bash
# 1. Install dependencies
npm run install-all

# 2. Initialize database (creates database, tables, and sample data)
npm run init-db

# 3. Start development server
npm run dev
```

### Development Mode
```bash
# Run both frontend and backend concurrently
npm run dev

# Or run separately:
# Backend only
npm run server

# Frontend only (in client directory)
cd client && npm start
```

### Production Build
```bash
# Build frontend and start production server
./start-production.sh

# Or manually:
cd client && npm run build && cd ..
npm start
```

### Default Admin Account
After database initialization:
- **Email:** admin@syntaxdropshipping.com  
- **Password:** admin123

⚠️ Change the default password in production!

## 📱 Mobile-First Design

The platform is built with a mobile-first approach, ensuring excellent user experience across all devices:

- **Breakpoints**: Mobile (320px+), Tablet (768px+), Desktop (1024px+)
- **Touch-Friendly**: Optimized touch targets and gestures
- **Performance**: Optimized loading and rendering
- **PWA Ready**: Service worker and manifest.json included

## 🔐 Authentication Flow

1. **Registration**: Email-based account creation with validation
2. **Email Verification**: Welcome email sent upon registration
3. **Login**: JWT-based authentication with remember me option
4. **Profile Management**: Complete user profile editing
5. **Password Management**: Secure password change functionality

## 📄 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/verify` - Token verification

### User Endpoints
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile

### Product Endpoints
- `GET /api/products/hot` - Get hot products
- `GET /api/products` - Get all products with pagination
- `GET /api/products/:id` - Get product by ID

## 🎨 Design System

### Color Palette
- **Primary**: Blue gradient (#667eea to #764ba2)
- **Secondary**: Purple (#764ba2)
- **Accent**: Orange (#f97316)
- **Neutrals**: Gray scale for text and backgrounds

### Typography
- **Font**: Inter (Google Fonts)
- **Scales**: Responsive typography using Tailwind CSS

### Components
- **Buttons**: Primary, secondary, and outline variants
- **Cards**: Consistent card design with shadows
- **Forms**: Styled form inputs with validation states
- **Navigation**: Responsive navigation with mobile menu

## 🌐 Platform Integrations

The platform supports integration with major e-commerce platforms:
- Shopify
- WooCommerce
- Amazon
- eBay

## 📊 Performance Features

- **Lazy Loading**: Components and images loaded on demand
- **Code Splitting**: Optimized bundle sizes
- **Caching**: API responses cached for better performance
- **Optimized Images**: Responsive images with proper sizing

## 🔧 Development Tools

- **ESLint**: Code linting and quality
- **Prettier**: Code formatting (configurable)
- **Git Hooks**: Pre-commit validation
- **Hot Reload**: Development server with hot reloading

## 🚀 Deployment

### Frontend Deployment
The React app can be deployed to:
- Vercel
- Netlify
- AWS S3 + CloudFront
- Any static hosting service

### Backend Deployment
The Node.js API can be deployed to:
- Railway
- Heroku
- AWS EC2
- DigitalOcean Droplets

## 📞 Support

For technical support or business inquiries:
- **Email**: info@syntaxdropshipping.com
- **Phone**: +86 177 9983 1302
- **Address**: 181, East Tiancheng Road, Hangzhou City, Zhejiang Province, China

## 📄 License

Copyright © 2024 Syntax Dropshipping. All rights reserved.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

---

Built with ❤️ by the Syntax Dropshipping Team