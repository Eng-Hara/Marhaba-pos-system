const express = require('express');
const { 
  getDashboardStats, 
  getSalesReport 
} = require('../controllers/dashboardController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/stats', getDashboardStats);
router.get('/reports', getSalesReport);

module.exports = router;