const mongoose = require('mongoose');

const transactionItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  productName: {
    type: String,
    required: true
  },
  productType: {
    type: String,
    enum: ['piece', 'fabric'],
    required: true
  },
  quantity: {
    type: Number,
    min: 1,
    required: function() {
      return this.productType === 'piece';
    }
  },
  yards: {
    type: Number,
    min: 0.1,
    required: function() {
      return this.productType === 'fabric';
    }
  },
  unitPrice: {
    type: Number,
    required: true,
    min: 0
  },
  totalPrice: {
    type: Number,
    required: true,
    min: 0
  },
  profitPerUnit: {
    type: Number,
    required: true
  }
});

const transactionSchema = new mongoose.Schema({
  invoiceNumber: {
    type: String,
    unique: true,
    required: true
  },
  items: [transactionItemSchema],
  subtotal: {
    type: Number,
    required: true,
    min: 0
  },
  tax: {
    type: Number,
    default: 0
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  totalProfit: {
    type: Number,
    required: true
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'mobile_money', 'card'],
    required: true
  },
  paymentDetails: {
    type: Map,
    of: String
  },
  cashier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  cashierName: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['completed', 'refunded', 'cancelled'],
    default: 'completed'
  },
  notes: {
    type: String,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Ensure invoiceNumber and sanitize item numeric fields before validation
transactionSchema.pre('validate', async function(next) {
  if (!this.isNew) return next();

  try {
    // Sanitize items
    if (Array.isArray(this.items)) {
      this.items = this.items.map((it) => {
        const copy = it;
        if (copy.productType === 'piece') {
          copy.quantity = Number(copy.quantity) || 1;
          if (copy.quantity < 1) copy.quantity = 1;
        } else if (copy.productType === 'fabric') {
          copy.yards = Number(copy.yards) || 0.1;
          if (copy.yards < 0.1) copy.yards = 0.1;
        }
        return copy;
      });
    }

    // Generate invoice number
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');

    const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
    const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);

    const count = await this.constructor.countDocuments({
      createdAt: { $gte: startOfDay, $lte: endOfDay }
    });

    this.invoiceNumber = `INV-${year}${month}${day}-${(count + 1).toString().padStart(4, '0')}`;
    next();
  } catch (error) {
    next(error);
  }
});

// Indexes for better query performance
transactionSchema.index({ invoiceNumber: 1 });
transactionSchema.index({ cashier: 1 });
transactionSchema.index({ status: 1 });
transactionSchema.index({ createdAt: -1 });
transactionSchema.index({ totalAmount: 1 });

module.exports = mongoose.model('Transaction', transactionSchema);