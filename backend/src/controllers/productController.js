const Product = require('../models/Product');
const { uploadToImageKit, imagekitConfigured } = require('../config/imageKit');

const coerceNumber = (val) => {
  if (val === undefined || val === '' || val === null) return undefined;
  const n = Number(val);
  return Number.isNaN(n) ? undefined : n;
};

// ================= GET ALL PRODUCTS =================
exports.getProducts = async (req, res, next) => {
  try {
    const {
      category,
      productType,
      search,
      lowStock,
      page = 1,
      limit = 20,
      sort = '-createdAt'
    } = req.query;

    let query = { isActive: true };

    if (category) query.category = category;
    if (productType) query.productType = productType;

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { color: { $regex: search, $options: 'i' } }
      ];
    }

    if (lowStock === 'true') {
      query.$expr = {
        $or: [
          { $and: [ { $eq: ['$productType','piece'] }, { $lte: ['$quantity','$lowStockThreshold'] } ] },
          { $and: [ { $eq: ['$productType','fabric'] }, { $lte: ['$lengthStock','$lowStockThreshold'] } ] }
        ]
      };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const products = await Product.find(query)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await Product.countDocuments(query);

    res.json({
      success: true,
      count: products.length,
      total,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      },
      data: products
    });

  } catch (error) {
    next(error);
  }
};

// ================= GET SINGLE PRODUCT =================
exports.getProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success:false, message:'Product not found' });
    res.json({ success:true, data:product });
  } catch (error) {
    next(error);
  }
};

// ================= CREATE PRODUCT =================
exports.createProduct = async (req, res, next) => {
  try {
    delete req.body._id;
    delete req.body.__v;

    if (!req.body.sku) {
      req.body.sku = `SKU-${Date.now().toString(36).toUpperCase()}`;
    }

    req.body.buyingPrice = coerceNumber(req.body.buyingPrice);
    req.body.sellingPrice = coerceNumber(req.body.sellingPrice);
    req.body.quantity = coerceNumber(req.body.quantity);
    req.body.lengthStock = coerceNumber(req.body.lengthStock);
    req.body.lowStockThreshold = coerceNumber(req.body.lowStockThreshold) ?? 10;

    // Upload image to ImageKit
    if (req.file) {
      if (imagekitConfigured()) {
        try {
          const imageUrl = await uploadToImageKit(req.file);
          req.body.imageUrl = imageUrl;
        } catch (e) {
          console.warn('Image upload failed, using default imageUrl:', e.message);
        }
      } else {
        console.warn('ImageKit not configured, skipping image upload.');
      }
    }

    const product = await Product.create(req.body);

    res.status(201).json({
      success: true,
      data: product
    });

  } catch (error) {
    next(error);
  }
};

// ================= UPDATE PRODUCT =================
exports.updateProduct = async (req, res, next) => {
  try {
    let product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success:false, message:'Product not found' });

    if (req.file) {
      if (imagekitConfigured()) {
        try {
          const imageUrl = await uploadToImageKit(req.file);
          req.body.imageUrl = imageUrl;
        } catch (e) {
          console.warn('Image upload failed, keeping existing imageUrl:', e.message);
        }
      } else {
        console.warn('ImageKit not configured, skipping image upload.');
      }
    }

    req.body.buyingPrice = coerceNumber(req.body.buyingPrice);
    req.body.sellingPrice = coerceNumber(req.body.sellingPrice);
    req.body.quantity = coerceNumber(req.body.quantity);
    req.body.lengthStock = coerceNumber(req.body.lengthStock);
    req.body.lowStockThreshold = coerceNumber(req.body.lowStockThreshold);

    delete req.body._id;
    delete req.body.sku;

    product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new:true, runValidators:true }
    );

    res.json({ success:true, data:product });

  } catch (error) {
    next(error);
  }
};

// ================= DELETE PRODUCT =================
exports.deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success:false, message:'Product not found' });

    product.isActive = false;
    await product.save();

    res.json({ success:true, message:'Product deactivated' });

  } catch (error) {
    next(error);
  }
};

// ================= UPDATE STOCK =================
exports.updateStock = async (req, res, next) => {
  try {
    const { quantity, lengthStock, operation } = req.body;
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success:false, message:'Product not found' });

    if (product.productType === 'piece') {
      if (operation === 'add') product.quantity += quantity;
      else if (operation === 'subtract') product.quantity -= quantity;
      else product.quantity = quantity;
    } else {
      if (operation === 'add') product.lengthStock += lengthStock;
      else if (operation === 'subtract') product.lengthStock -= lengthStock;
      else product.lengthStock = lengthStock;
    }

    await product.save();
    res.json({ success:true, data:product });

  } catch (error) {
    next(error);
  }
};

// ================= LOW STOCK =================
exports.getLowStockProducts = async (req, res, next) => {
  try {
    const products = await Product.find({
      isActive:true,
      $expr:{
        $or:[
          { $and:[{ $eq:['$productType','piece'] }, { $lte:['$quantity','$lowStockThreshold'] }]},
          { $and:[{ $eq:['$productType','fabric'] }, { $lte:['$lengthStock','$lowStockThreshold'] }]}
        ]
      }
    });

    res.json({ success:true, count:products.length, data:products });

  } catch (error) {
    next(error);
  }
};