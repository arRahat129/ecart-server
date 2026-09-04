const express = require('express');
const { getAddresses, createAddress, updateAddress, deleteAddress } = require('../controllers/address.controller');
const { protect } = require('../middleware/authMiddleware');
const router = express.Router();

router.get('/', protect, getAddresses);
router.post('/', protect, createAddress);
router.patch('/:id', protect, updateAddress);
router.delete('/:id', protect, deleteAddress);

module.exports = router;