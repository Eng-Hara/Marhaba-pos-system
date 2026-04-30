const express = require('express');
const {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  updateStock,
  getLowStockProducts
} = require('../controllers/productController');

const { protect, authorize } = require('../middleware/auth');
const { upload } = require('../config/imageKit'); // Use ImageKit upload

const router = express.Router();

// Dhammaan routes waa login
router.use(protect);

// View products (user kasta)
router.get('/', getProducts);
router.get('/low-stock', getLowStockProducts);
router.get('/:id', getProduct);

// Manager only
router.post(
  '/',
  authorize('manager'),
  upload.single('image'),
  createProduct
);

router.put(
  '/:id',
  authorize('manager'),
  upload.single('image'),
  updateProduct
);

router.delete('/:id', authorize('manager'), deleteProduct);
router.patch('/:id/stock', authorize('manager'), updateStock);

module.exports = router;