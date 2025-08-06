# Syntax Dropshipping - Database Setup Guide

This guide will help you set up MySQL database for the Syntax Dropshipping platform.

## Prerequisites

- MySQL Server 5.7+ or 8.0+
- Node.js 14+
- npm

## Database Configuration

### 1. Create Environment Configuration

Create a `server/.env` file with your database configuration:

```env
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=syntaxdropshipping
DB_PORT=3306

# Server Configuration
PORT=5000
NODE_ENV=development
JWT_SECRET=syntax_dropshipping_secret_key_2024

# Email Configuration (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### 2. Database Setup Options

#### Option A: Automatic Setup (Recommended)

Run the automated database initialization:

```bash
# Install dependencies
npm install

# Initialize database with tables and sample data
npm run init-db
```

This will:
- Create the `syntaxdropshipping` database
- Create all required tables
- Insert sample product data
- Create a default admin user

#### Option B: Manual Setup

1. **Create Database:**
```sql
CREATE DATABASE syntaxdropshipping CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

2. **Run Schema File:**
```bash
mysql -u root -p syntaxdropshipping < server/config/database-schema.sql
```

3. **Create Admin User:**
```bash
node server/config/initDatabase.js
```

## Default Admin Account

After initialization, you can login with:
- **Email:** `admin@syntaxdropshipping.com`
- **Password:** `admin123`

⚠️ **Important:** Change the default admin password in production!

## Database Schema

The platform uses the following main tables:

### Users Table
- `id` - Primary key
- `email` - User email (unique)
- `password` - Hashed password
- `name` - Full name
- `company` - Company name (optional)
- `phone` - Phone number (optional)
- `address` - Address (optional)
- `role` - User role (user/admin)
- `is_active` - Account status
- `created_at` / `updated_at` - Timestamps

### Products Table
- `id` - Primary key
- `title` - Product title
- `description` - Product description
- `price` - Product price (string format)
- `image` - Product image URL
- `category` - Product category
- `is_hot` - Featured product flag
- `in_stock` - Stock status
- `sku` - Product SKU
- `weight` / `dimensions` - Product specifications
- `supplier_info` - Supplier information (JSON)
- `created_at` / `updated_at` - Timestamps

### Contact Messages Table
- `id` - Primary key
- `name` - Sender name
- `email` - Sender email
- `company` - Sender company (optional)
- `subject` - Message subject
- `message` - Message content
- `status` - Message status (unread/read/replied)
- `created_at` - Timestamp

## Testing Database Connection

You can test your database connection:

```bash
# Test connection
npm run server

# The server will display database connection status on startup
```

## Troubleshooting

### Common Issues

1. **Connection Refused**
   - Ensure MySQL server is running
   - Check host and port configuration
   - Verify firewall settings

2. **Access Denied**
   - Verify username and password
   - Check MySQL user privileges
   - Ensure user has access to the database

3. **Database Not Found**
   - Run `npm run init-db` to create the database
   - Verify database name in `.env` file

4. **Table Doesn't Exist**
   - Re-run database initialization: `npm run init-db`
   - Check if schema file was executed properly

### Debug Commands

```bash
# Check MySQL service status (macOS)
brew services list | grep mysql

# Start MySQL service (macOS)
brew services start mysql

# Connect to MySQL directly
mysql -u root -p

# Check database exists
SHOW DATABASES;

# Check tables in database
USE syntaxdropshipping;
SHOW TABLES;

# Check sample data
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM products;
```

## Production Considerations

1. **Security:**
   - Use strong passwords
   - Create dedicated database user
   - Enable SSL connections
   - Regular backups

2. **Performance:**
   - Configure proper indexes
   - Set appropriate connection limits
   - Monitor query performance
   - Use connection pooling

3. **Backup:**
   - Set up automated backups
   - Test backup restoration
   - Store backups securely

## Environment Variables Reference

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `DB_HOST` | Database host | `localhost` | Yes |
| `DB_USER` | Database username | `root` | Yes |
| `DB_PASSWORD` | Database password | `` | Yes |
| `DB_NAME` | Database name | `syntaxdropshipping` | Yes |
| `DB_PORT` | Database port | `3306` | Yes |
| `JWT_SECRET` | JWT signing secret | Auto-generated | Yes |
| `SMTP_HOST` | Email server host | `smtp.gmail.com` | No |
| `SMTP_PORT` | Email server port | `587` | No |
| `SMTP_USER` | Email username | `` | No |
| `SMTP_PASS` | Email password | `` | No |

## Support

If you encounter any issues with database setup, please check:

1. MySQL server logs
2. Application logs in console
3. Network connectivity
4. Database permissions

For additional support, contact the development team or refer to the main README.md file.