const express = require('express');
const { getAllProducts, getProductById, createProduct, updateMyProduct, updateProductStatus, deleteProduct } = require('../controllers/product.controller');
const { protect, isAdmin } = require('../middleware/authMiddleware');
const router = express.Router();

router.get('/', getAllProducts);
router.get('/:id', getProductById);

router.post('/', protect, createProduct);
router.patch('/:id', protect, updateMyProduct);
router.patch('/:id/status', protect, isAdmin, updateProductStatus);
router.delete('/:id', protect, deleteProduct);

module.exports = router;