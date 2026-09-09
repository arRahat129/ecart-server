const express = require('express');
const { placeOrder, getMyOrders, getOrderById, getAllOrders, updateOrderStatus, getOrdersForMyProducts, updateOrderStatusBySeller, cancelOrderByBuyer, cancelOrderBySeller } = require('../controllers/order.controller');
const { protect, isAdmin } = require('../middleware/authMiddleware');
const router = express.Router();

router.use(protect);
router.post('/place', placeOrder);
router.get('/my', getMyOrders);
router.get('/my-sales', getOrdersForMyProducts);
router.get('/:id', getOrderById);
router.get('/', isAdmin, getAllOrders);
router.patch('/:id/status', isAdmin, updateOrderStatus);
router.patch('/:id/seller-status', updateOrderStatusBySeller);
router.patch('/:id/cancel-buyer', cancelOrderByBuyer);
router.patch('/:id/cancel-seller', cancelOrderBySeller);

module.exports = router;