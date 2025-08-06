const { getConnection } = require('../config/database');

// User management functions
const userDB = {
  // Get all users
  async findAll() {
    const connection = await getConnection();
    const [rows] = await connection.execute('SELECT * FROM users ORDER BY created_at DESC');
    return rows;
  },

  // Find user by email
  async findByEmail(email) {
    const connection = await getConnection();
    const [rows] = await connection.execute('SELECT * FROM users WHERE email = ?', [email]);
    return rows[0] || null;
  },

  // Find user by ID
  async findById(id) {
    const connection = await getConnection();
    const [rows] = await connection.execute('SELECT * FROM users WHERE id = ?', [id]);
    return rows[0] || null;
  },

  // Create new user
  async create(userData) {
    const connection = await getConnection();
    const { email, password, name, company = null } = userData;
    
    const [result] = await connection.execute(
      'INSERT INTO users (email, password, name, company, role, is_active) VALUES (?, ?, ?, ?, ?, ?)',
      [email, password, name, company, 'user', true]
    );
    
    return await this.findById(result.insertId);
  },

  // Update user
  async update(id, updateData) {
    const connection = await getConnection();
    const fields = [];
    const values = [];
    
    const allowedFields = ['name', 'company', 'phone', 'address'];
    
    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        fields.push(`${field} = ?`);
        values.push(updateData[field]);
      }
    }
    
    if (fields.length === 0) {
      return await this.findById(id);
    }
    
    values.push(id);
    
    await connection.execute(
      `UPDATE users SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      values
    );
    
    return await this.findById(id);
  },

  // Update password
  async updatePassword(id, hashedPassword) {
    const connection = await getConnection();
    await connection.execute(
      'UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [hashedPassword, id]
    );
    return true;
  },

  // Delete user (soft delete - set inactive)
  async delete(id) {
    const connection = await getConnection();
    await connection.execute(
      'UPDATE users SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [id]
    );
    return true;
  }
};

// Product management functions
const productDB = {
  // Get all products with pagination
  async findAll(options = {}) {
    const connection = await getConnection();
    const { page = 1, limit = 20, category, search } = options;
    const offset = (page - 1) * limit;
    
    let query = 'SELECT * FROM products WHERE in_stock = TRUE';
    let countQuery = 'SELECT COUNT(*) as total FROM products WHERE in_stock = TRUE';
    const queryParams = [];
    const countParams = [];
    
    // Add category filter
    if (category) {
      query += ' AND category LIKE ?';
      countQuery += ' AND category LIKE ?';
      const categoryParam = `%${category}%`;
      queryParams.push(categoryParam);
      countParams.push(categoryParam);
    }
    
    // Add search filter
    if (search) {
      query += ' AND (title LIKE ? OR description LIKE ?)';
      countQuery += ' AND (title LIKE ? OR description LIKE ?)';
      const searchParam = `%${search}%`;
      queryParams.push(searchParam, searchParam);
      countParams.push(searchParam, searchParam);
    }
    
    // Add ordering and pagination
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    queryParams.push(parseInt(limit), parseInt(offset));
    
    const [products] = await connection.execute(query, queryParams);
    const [countResult] = await connection.execute(countQuery, countParams);
    
    const total = countResult[0].total;
    const totalPages = Math.ceil(total / limit);
    
    return {
      products,
      total,
      page: parseInt(page),
      totalPages,
      hasMore: page < totalPages
    };
  },

  // Get hot products
  async findHot(limit = 12) {
    const connection = await getConnection();
    const limitValue = parseInt(limit) || 12;
    const [rows] = await connection.query(
      'SELECT * FROM products WHERE is_hot = ? AND in_stock = ? ORDER BY created_at DESC LIMIT ?',
      [true, true, limitValue]
    );
    return rows;
  },

  // Find product by ID
  async findById(id) {
    const connection = await getConnection();
    const [rows] = await connection.execute('SELECT * FROM products WHERE id = ?', [id]);
    return rows[0] || null;
  },

  // Create new product
  async create(productData) {
    const connection = await getConnection();
    const { 
      title, 
      description, 
      price, 
      category, 
      image = null, 
      is_hot = false, 
      sku = null,
      weight = null,
      dimensions = null 
    } = productData;
    
    const [result] = await connection.execute(
      'INSERT INTO products (title, description, price, category, image, is_hot, in_stock, sku, weight, dimensions) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [title, description, price, category, image, is_hot, true, sku, weight, dimensions]
    );
    
    return await this.findById(result.insertId);
  },

  // Update product
  async update(id, updateData) {
    const connection = await getConnection();
    const fields = [];
    const values = [];
    
    const allowedFields = ['title', 'description', 'price', 'category', 'image', 'is_hot', 'in_stock', 'sku', 'weight', 'dimensions'];
    
    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        fields.push(`${field} = ?`);
        values.push(updateData[field]);
      }
    }
    
    if (fields.length === 0) {
      return await this.findById(id);
    }
    
    values.push(id);
    
    await connection.execute(
      `UPDATE products SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      values
    );
    
    return await this.findById(id);
  },

  // Delete product (soft delete - set out of stock)
  async delete(id) {
    const connection = await getConnection();
    await connection.execute(
      'UPDATE products SET in_stock = FALSE, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [id]
    );
    return true;
  }
};

// Contact message management functions
const contactDB = {
  // Create new contact message
  async create(messageData) {
    const connection = await getConnection();
    const { name, email, company, subject, message } = messageData;
    
    const [result] = await connection.execute(
      'INSERT INTO contact_messages (name, email, company, subject, message) VALUES (?, ?, ?, ?, ?)',
      [name, email, company || null, subject, message]
    );
    
    return result.insertId;
  },

  // Get all contact messages
  async findAll(options = {}) {
    const connection = await getConnection();
    const { page = 1, limit = 20, status } = options;
    const offset = (page - 1) * limit;
    
    let query = 'SELECT * FROM contact_messages';
    let countQuery = 'SELECT COUNT(*) as total FROM contact_messages';
    const queryParams = [];
    const countParams = [];
    
    if (status) {
      query += ' WHERE status = ?';
      countQuery += ' WHERE status = ?';
      queryParams.push(status);
      countParams.push(status);
    }
    
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    queryParams.push(parseInt(limit), parseInt(offset));
    
    const [messages] = await connection.execute(query, queryParams);
    const [countResult] = await connection.execute(countQuery, countParams);
    
    const total = countResult[0].total;
    const totalPages = Math.ceil(total / limit);
    
    return {
      messages,
      total,
      page: parseInt(page),
      totalPages
    };
  },

  // Update message status
  async updateStatus(id, status) {
    const connection = await getConnection();
    const repliedAt = status === 'replied' ? new Date() : null;
    
    await connection.execute(
      'UPDATE contact_messages SET status = ?, replied_at = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [status, repliedAt, id]
    );
    
    return true;
  }
};

module.exports = {
  userDB,
  productDB,
  contactDB
};