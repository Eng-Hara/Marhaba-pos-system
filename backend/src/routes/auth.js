const express = require('express');
const { 
  register, 
  login, 
  getMe, 
  updateProfile, 
  changePassword 
} = require('../controllers/authController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.post('/login', login);

// Protected routes
router.use(protect);

router.get('/me', getMe);
router.put('/update-profile', updateProfile);
router.put('/change-password', changePassword);

// Manager only routes
router.post('/register', authorize('manager'), register);

module.exports = router;