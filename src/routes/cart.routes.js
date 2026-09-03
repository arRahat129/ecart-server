const express = require('express');
const { getCart, addToCart, removeFromCart, clearCart } = require('../controllers/cart.controller');
const { protect } = require('../middleware/authMiddleware.js');
const router = express.Router();

router.get('/', protect, getCart);
router.post('/add', protect, addToCart);
router.delete('/remove/:productId', protect, removeFromCart);
router.delete('/clear', protect, clearCart);

module.exports = router;