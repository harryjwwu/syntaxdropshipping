const express = require('express');
const { productDB } = require('../utils/dbManager');
const router = express.Router();

// Get hot products for homepage
router.get('/hot', async (req, res) => {
  try {
    const hotProducts = await productDB.findHot(12);
    
    res.json({
      products: hotProducts,
      total: hotProducts.length
    });
  } catch (error) {
    console.error('Get hot products error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get all products with pagination
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, category, search } = req.query;
    
    const result = await productDB.findAll({
      page: parseInt(page),
      limit: parseInt(limit),
      category,
      search
    });
    
    res.json(result);
  } catch (error) {
    console.error('Get products list error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get product by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const product = await productDB.findById(parseInt(id));
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    res.json(product);
  } catch (error) {
    console.error('Get product details error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;