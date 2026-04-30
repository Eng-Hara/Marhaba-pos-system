const Transaction = require('../models/Transaction');
const Product = require('../models/Product');
const mongoose = require('mongoose');
const PDFDocument = require('pdfkit');

// @desc    Create new sale (non-transactional for standalone MongoDB)
// @route   POST /api/sales
// @access  Private
exports.createSale = async (req, res, next) => {
  try {
    // Log incoming request for debugging
    console.log('Incoming createSale request body:', JSON.stringify(req.body));
    const { items, paymentMethod, paymentDetails, notes } = req.body;
    const cashier = req.user.id;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Items are required for a sale' });
    }

    if (!paymentMethod) {
      return res.status(400).json({ success: false, message: 'Payment method is required' });
    }

    let subtotal = 0;
    let totalProfit = 0;
    const transactionItems = [];
    const productUpdates = [];

    for (const item of items) {
      const product = await Product.findById(item.productId);

      if (!product) {
        return res.status(404).json({ success: false, message: `Product with ID ${item.productId} not found` });
      }

      let quantity = 0;
      let yards = 0;
      let itemTotal = 0;
      let itemProfit = 0;

      if (product.productType === 'piece') {
        if (!item.quantity || item.quantity <= 0) {
          return res.status(400).json({ success: false, message: `Valid quantity is required for ${product.name}` });
        }

        if (product.quantity < item.quantity) {
          return res.status(400).json({ success: false, message: `Insufficient stock for ${product.name}. Available: ${product.quantity}, Requested: ${item.quantity}` });
        }

        quantity = item.quantity;
        itemTotal = product.sellingPrice * quantity;
        itemProfit = (product.sellingPrice - product.buyingPrice) * quantity;

        productUpdates.push({ updateOne: { filter: { _id: product._id }, update: { $inc: { quantity: -quantity } } } });
      } else {
        if (!item.yards || item.yards <= 0) {
          return res.status(400).json({ success: false, message: `Valid yards measurement is required for ${product.name}` });
        }

        if (product.lengthStock < item.yards) {
          return res.status(400).json({ success: false, message: `Insufficient fabric for ${product.name}. Available: ${product.lengthStock} yards, Requested: ${item.yards} yards` });
        }

        yards = item.yards;
        itemTotal = product.sellingPrice * yards;
        itemProfit = (product.sellingPrice - product.buyingPrice) * yards;

        productUpdates.push({ updateOne: { filter: { _id: product._id }, update: { $inc: { lengthStock: -yards } } } });
      }

      subtotal += itemTotal;
      totalProfit += itemProfit;

      const tItem = {
        product: product._id,
        productName: product.name,
        productType: product.productType,
        unitPrice: product.sellingPrice,
        totalPrice: itemTotal,
        profitPerUnit: product.sellingPrice - product.buyingPrice
      };
      if (product.productType === 'piece') tItem.quantity = quantity;
      if (product.productType === 'fabric') tItem.yards = yards;

      transactionItems.push(tItem);
    }

    const tax = subtotal * 0.1;
    const totalAmount = subtotal + tax;

    if (productUpdates.length > 0) {
      await Product.bulkWrite(productUpdates);
    }

    // Generate invoice number (since insertMany/create with arrays won't trigger save hooks reliably)
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    const count = await Transaction.countDocuments({ createdAt: { $gte: startOfDay, $lte: endOfDay } });
    const invoiceNumber = `INV-${year}${month}${day}-${(count + 1).toString().padStart(4, '0')}`;

    const transactionObj = { items: transactionItems, subtotal, tax, totalAmount, totalProfit, paymentMethod, paymentDetails: paymentDetails || {}, cashier, cashierName: req.user.name, notes, status: 'completed', invoiceNumber };

    // Sanitize items: ensure numeric fields meet schema minimums to avoid validation errors
    transactionObj.items = transactionObj.items.map(it => {
      const copy = { ...it };
      if (copy.productType === 'piece') {
        copy.quantity = Number(copy.quantity) || 1;
        if (copy.quantity < 1) copy.quantity = 1;
      } else if (copy.productType === 'fabric') {
        copy.yards = Number(copy.yards) || 0.1;
        if (copy.yards < 0.1) copy.yards = 0.1;
      }
      return copy;
    });

    // Ensure invoiceNumber exists (safety) — if somehow undefined, regenerate
    if (!transactionObj.invoiceNumber) {
      const now2 = new Date();
      const yy = now2.getFullYear().toString().slice(-2);
      const mm = (now2.getMonth() + 1).toString().padStart(2, '0');
      const dd = now2.getDate().toString().padStart(2, '0');
      const sOfDay = new Date(now2.getFullYear(), now2.getMonth(), now2.getDate(), 0, 0, 0, 0);
      const eOfDay = new Date(now2.getFullYear(), now2.getMonth(), now2.getDate(), 23, 59, 59, 999);
      const cnt = await Transaction.countDocuments({ createdAt: { $gte: sOfDay, $lte: eOfDay } });
      transactionObj.invoiceNumber = `INV-${yy}${mm}${dd}-${(cnt + 1).toString().padStart(4, '0')}`;
    }

    // Debug: log payload to inspect fields when running locally
    console.log('Creating transaction invoiceNumber:', transactionObj.invoiceNumber);
    console.log('Creating transaction items summary:', transactionObj.items.map(i => ({ product: i.product.toString(), productType: i.productType, quantity: i.quantity, yards: i.yards })));
    console.log('Full payload:', JSON.stringify(transactionObj, null, 2));

    // Create a single Transaction document (avoid insertMany so pre-save hooks and validations run predictably)
    const transactionDoc = new Transaction(transactionObj);
    const savedTransaction = await transactionDoc.save();

    const populatedTransaction = await Transaction.findById(savedTransaction._id).populate('cashier', 'name email').populate('items.product', 'name sku');

    res.status(201).json({ success: true, data: populatedTransaction });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all transactions
// @route   GET /api/sales
// @access  Private
exports.getTransactions = async (req, res, next) => {
  try {
    const { 
      startDate, 
      endDate, 
      paymentMethod, 
      status,
      page = 1, 
      limit = 20,
      sort = '-createdAt'
    } = req.query;
    
    // Build query
    let query = {};
    
    // Date filter
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        query.createdAt.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }
    
    if (paymentMethod) query.paymentMethod = paymentMethod;
    if (status) query.status = status;

    // Execute query with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const transactions = await Transaction.find(query)
      .populate('cashier', 'name email')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .lean()
      .exec();
    
    // Get total count for pagination
    const total = await Transaction.countDocuments(query);
    
    // Calculate summary
    const summary = await Transaction.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalSales: { $sum: '$totalAmount' },
          totalProfit: { $sum: '$totalProfit' },
          totalTransactions: { $sum: 1 }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      count: transactions.length,
      total,
      summary: summary[0] || { totalSales: 0, totalProfit: 0, totalTransactions: 0 },
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      },
      data: transactions
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single transaction
// @route   GET /api/sales/:id
// @access  Private
exports.getTransaction = async (req, res, next) => {
  try {
    const transaction = await Transaction.findById(req.params.id)
      .populate('cashier', 'name email')
      .populate('items.product', 'name sku category color');

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    res.status(200).json({
      success: true,
      data: transaction
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get invoice PDF
// @route   GET /api/sales/:id/invoice
// @access  Private
exports.getInvoice = async (req, res, next) => {
  try {
    const transaction = await Transaction.findById(req.params.id)
      .populate('cashier', 'name email')
      .populate('items.product', 'name sku');

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    // Create PDF document
    const doc = new PDFDocument({ margin: 50 });
    
    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice-${transaction.invoiceNumber}.pdf`);
    
    // Pipe PDF to response
    doc.pipe(res);
    
    // Add content to PDF
    // Header
    doc.fontSize(25).text('Clothing Shop POS', { align: 'center' });
    doc.moveDown();
    doc.fontSize(20).text('INVOICE', { align: 'center' });
    doc.moveDown();
    
    // Invoice details
    doc.fontSize(12);
    doc.text(`Invoice Number: ${transaction.invoiceNumber}`);
    doc.text(`Date: ${new Date(transaction.createdAt).toLocaleDateString()}`);
    doc.text(`Time: ${new Date(transaction.createdAt).toLocaleTimeString()}`);
    doc.text(`Cashier: ${transaction.cashierName}`);
    doc.moveDown();
    
    // Items table header
    const tableTop = doc.y;
    doc.text('Item', 50, tableTop);
    doc.text('Qty/Yards', 200, tableTop);
    doc.text('Unit Price', 280, tableTop);
    doc.text('Total', 360, tableTop);
    
    doc.moveTo(50, tableTop + 15)
       .lineTo(450, tableTop + 15)
       .stroke();
    
    // Items
    let yPos = tableTop + 30;
    transaction.items.forEach((item, index) => {
      doc.text(item.productName, 50, yPos);
      doc.text(item.productType === 'piece' ? item.quantity.toString() : `${item.yards} yds`, 200, yPos);
      doc.text(`$${item.unitPrice.toFixed(2)}`, 280, yPos);
      doc.text(`$${item.totalPrice.toFixed(2)}`, 360, yPos);
      yPos += 20;
    });
    
    // Totals
    yPos += 20;
    doc.text('Subtotal:', 280, yPos);
    doc.text(`$${transaction.subtotal.toFixed(2)}`, 360, yPos);
    
    yPos += 20;
    doc.text('Tax (10%):', 280, yPos);
    doc.text(`$${transaction.tax.toFixed(2)}`, 360, yPos);
    
    yPos += 20;
    doc.font('Helvetica-Bold');
    doc.text('Total:', 280, yPos);
    doc.text(`$${transaction.totalAmount.toFixed(2)}`, 360, yPos);
    doc.font('Helvetica');
    
    yPos += 30;
    doc.text(`Payment Method: ${transaction.paymentMethod.toUpperCase()}`);
    
    if (transaction.paymentDetails && transaction.paymentDetails.size > 0) {
      doc.text('Payment Details:');
      transaction.paymentDetails.forEach((value, key) => {
        doc.text(`  ${key}: ${value}`);
      });
    }
    
    // Footer
    doc.moveDown(3);
    doc.fontSize(10).text('Thank you for your business!', { align: 'center' });
    doc.text('Clothing Shop POS System', { align: 'center' });
    
    // Finalize PDF
    doc.end();
  } catch (error) {
    next(error);
  }
};

// @desc    Refund transaction
// @route   POST /api/sales/:id/refund
// @access  Private/Manager
exports.refundTransaction = async (req, res, next) => {
  try {
    const transaction = await Transaction.findById(req.params.id);

    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    if (transaction.status === 'refunded') {
      return res.status(400).json({ success: false, message: 'Transaction already refunded' });
    }

    const productUpdates = [];
    for (const item of transaction.items) {
      if (item.productType === 'piece') {
        productUpdates.push({ updateOne: { filter: { _id: item.product }, update: { $inc: { quantity: item.quantity } } } });
      } else {
        productUpdates.push({ updateOne: { filter: { _id: item.product }, update: { $inc: { lengthStock: item.yards } } } });
      }
    }

    if (productUpdates.length > 0) {
      await Product.bulkWrite(productUpdates);
    }

    transaction.status = 'refunded';
    transaction.notes = req.body.notes || 'Refunded by manager';
    await transaction.save();

    res.status(200).json({ success: true, message: 'Transaction refunded successfully', data: transaction });
  } catch (error) {
    next(error);
  }
};