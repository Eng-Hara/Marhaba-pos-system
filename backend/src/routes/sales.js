const express = require('express');
const {
  createSale,
  getTransactions,
  getTransaction,
  getInvoice,
  refundTransaction
} = require('../controllers/saleController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Protected routes
router.use(protect);

// All users can create sales and view transactions
router.post('/', createSale);
router.get('/', getTransactions);
router.get('/:id', getTransaction);
router.get('/:id/invoice', getInvoice);

// Manager only routes
router.post('/:id/refund', authorize('manager'), refundTransaction);

module.exports = router;