const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const User = require('../models/User');
const Product = require('../models/Product');

dotenv.config();

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    await User.deleteMany({});
    await Product.deleteMany({});
    console.log('🗑️ Cleared existing data');

    const users = [
      { name: 'Manager Admin', email: 'manager@clothespos.com', password: await bcrypt.hash('manager123', 10), role: 'manager' },
      { name: 'Cashier User', email: 'cashier@clothespos.com', password: await bcrypt.hash('cashier123', 10), role: 'cashier' },
      { name: 'John Smith', email: 'john@clothespos.com', password: await bcrypt.hash('john123', 10), role: 'cashier' }
    ];

    const createdUsers = await User.insertMany(users);
    console.log(`👥 Created ${createdUsers.length} users`);

    const products = [
      {
        name: 'Men\'s Cotton T-Shirt', description: '100% Cotton, Comfortable Fit', category: 'men', size: 'L',
        color: 'Black', buyingPrice: 8.50, sellingPrice: 19.99, productType: 'piece', quantity: 45,
        lowStockThreshold: 10, imageUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&auto=format&fit=crop'
      },
      {
        name: 'Women\'s Summer Dress', description: 'Lightweight, Floral Pattern', category: 'women', size: 'M',
        color: 'Floral', buyingPrice: 25.00, sellingPrice: 59.99, productType: 'piece', quantity: 28,
        lowStockThreshold: 5, imageUrl: 'https://barosomali.com/wp-content/uploads/2024/10/1729966095708.png'
      }
    ];

    const createdProducts = await Product.insertMany(products);
    console.log(`📦 Created ${createdProducts.length} products`);

    console.log('✅ Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

seedDatabase();