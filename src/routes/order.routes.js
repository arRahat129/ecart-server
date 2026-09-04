const express = require('express');
const { placeOrder, getMyOrders, getOrderById, getAllOrders, updateOrderStatus } = require('../controllers/order.controller');
const { protect, isAdmin } = require('../middleware/authMiddleware');
const router = express.Router();

router.use(protect);
router.post('/place', placeOrder);
router.get('/my', getMyOrders);
router.get('/:id', getOrderById);
router.get('/', isAdmin, getAllOrders);
router.patch('/:id/status', isAdmin, updateOrderStatus);

module.exports = router;