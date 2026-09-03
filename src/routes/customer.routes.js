const express = require('express');
const { getMe, updateMe, getAllCustomers, updateCustomerRole } = require('../controllers/customer.controller');
const { protect, isAdmin } = require('../middleware/authMiddleware');
const router = express.Router();

router.get('/me', protect, getMe);
router.patch('/me', protect, updateMe);

router.get('/', protect, isAdmin, getAllCustomers);
router.patch('/:id/role', protect, isAdmin, updateCustomerRole);

module.exports = router;