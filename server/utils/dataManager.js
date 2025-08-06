const fs = require('fs').promises;
const path = require('path');

const DATA_DIR = path.join(__dirname, '../data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const PRODUCTS_FILE = path.join(DATA_DIR, 'products.json');

// Ensure data directory exists
async function ensureDataDirectory() {
  try {
    await fs.access(DATA_DIR);
  } catch (error) {
    await fs.mkdir(DATA_DIR, { recursive: true });
  }
}

// Read users data
async function readUsers() {
  await ensureDataDirectory();
  try {
    const data = await fs.readFile(USERS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    // File doesn't exist, return empty array
    return [];
  }
}

// Write users data
async function writeUsers(users) {
  await ensureDataDirectory();
  await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));
}

// Read products data
async function readProducts() {
  await ensureDataDirectory();
  try {
    const data = await fs.readFile(PRODUCTS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    // Return default hot products if file doesn't exist
    return getDefaultProducts();
  }
}

// Write products data
async function writeProducts(products) {
  await ensureDataDirectory();
  await fs.writeFile(PRODUCTS_FILE, JSON.stringify(products, null, 2));
}

// Initialize default products
function getDefaultProducts() {
  return [
    {
      id: '1',
      title: 'Portable 3 In 1 Fan Air Conditioner',
      description: 'Household Small Air Cooler LED Night Lights Humidifier Air Adjustment Home Fans',
      price: '$3.20',
      image: '/images/products/air-cooler.jpg',
      category: 'Home Appliances',
      isHot: true,
      inStock: true
    },
    {
      id: '2',
      title: '2in1 Microfiber Screen Cleaner',
      description: 'Spray Bottle Set Mobile Phone iPad Camera GoPro Computer Microfiber Cloth Cleaning',
      price: '$0.19-1.00',
      image: '/images/products/screen-cleaner.jpg',
      category: 'Electronics',
      isHot: true,
      inStock: true
    },
    {
      id: '3',
      title: 'Mini Magnetic Wireless Power Bank',
      description: 'Fast Charging Portable 5000mAh Wireless Power Bank',
      price: '$4.57-5.00',
      image: '/images/products/power-bank.jpg',
      category: 'Electronics',
      isHot: true,
      inStock: true
    },
    {
      id: '4',
      title: 'Car Air Purifier',
      description: 'Portable Negative Ion Generator Remove Formaldehyde Dust Smoke Air Freshener',
      price: '$1.57-6.29',
      image: '/images/products/air-purifier.jpg',
      category: 'Auto Accessories',
      isHot: true,
      inStock: true
    },
    {
      id: '5',
      title: 'Star Projector with Bluetooth Speaker',
      description: 'Galaxy Lamp Multicolor Night Light for Bedroom',
      price: '$4.00',
      image: '/images/products/star-projector.jpg',
      category: 'Home Decor',
      isHot: true,
      inStock: true
    },
    {
      id: '6',
      title: 'Portable Mini Thermal Label Printer',
      description: 'Home Photo Printer Student Wrong Question Printer Bluetooth Mini Label Printer',
      price: '$2.43-34.05',
      image: '/images/products/thermal-printer.jpg',
      category: 'Office Supplies',
      isHot: true,
      inStock: true
    }
  ];
}

// Initialize default products file
async function initializeProducts() {
  const products = await readProducts();
  if (products.length === 0) {
    await writeProducts(getDefaultProducts());
  }
}

module.exports = {
  readUsers,
  writeUsers,
  readProducts,
  writeProducts,
  initializeProducts
};