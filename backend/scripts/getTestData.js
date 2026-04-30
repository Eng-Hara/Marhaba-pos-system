require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');
const Product = require('../src/models/Product');

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    const prod = await Product.findOne().lean();
    const manager = await User.findOne({ role: 'manager' }).lean();
    console.log('productId:', prod ? prod._id.toString() : null, 'productType:', prod ? prod.productType : null);
    console.log('manager email:', manager ? manager.email : null);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
