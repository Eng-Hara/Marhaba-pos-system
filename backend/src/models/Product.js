const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true
  },
  sku: {
    type: String,
    unique: true,
    uppercase: true,
    default: function() {
      return `SKU-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
    }
  },
  description: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    enum: ['men', 'women', 'unisex', 'kids'],
    required: [true, 'Category is required']
  },
  size: {
    type: String,
    required: function() {
      return this.productType === 'piece';
    }
  },
  color: {
    type: String,
    required: [true, 'Color is required']
  },
  buyingPrice: {
    type: Number,
    required: [true, 'Buying price is required'],
    min: [0, 'Buying price cannot be negative']
  },
  sellingPrice: {
    type: Number,
    required: [true, 'Selling price is required'],
    min: [0, 'Selling price cannot be negative'],
    validate: {
      validator: function(value) {
        return value >= this.buyingPrice;
      },
      message: 'Selling price must be greater than or equal to buying price'
    }
  },
  imageUrl: {
    type: String,
    default: 'https://ik.imagekit.io/username/products/shirt.png',
  },
  productType: {
    type: String,
    enum: ['piece', 'fabric'],
    required: [true, 'Product type is required']
  },
  quantity: {
    type: Number,
    default: 0,
    min: [0, 'Quantity cannot be negative'],
    required: function() {
      return this.productType === 'piece';
    }
  },
  lengthStock: {
    type: Number,
    default: 0,
    min: [0, 'Length stock cannot be negative'],
    required: function() {
      return this.productType === 'fabric';
    }
  },
  lowStockThreshold: {
    type: Number,
    default: 10
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update timestamp on save
productSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Virtual for profit margin
productSchema.virtual('profitMargin').get(function() {
  return ((this.sellingPrice - this.buyingPrice) / this.buyingPrice * 100).toFixed(2);
});

// Virtual for stock status
productSchema.virtual('stockStatus').get(function() {
  if (this.productType === 'piece') {
    if (this.quantity === 0) return 'out-of-stock';
    if (this.quantity <= this.lowStockThreshold) return 'low-stock';
    return 'in-stock';
  } else {
    if (this.lengthStock === 0) return 'out-of-stock';
    if (this.lengthStock <= this.lowStockThreshold) return 'low-stock';
    return 'in-stock';
  }
});

module.exports = mongoose.model('Product', productSchema);