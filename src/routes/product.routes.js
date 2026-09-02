const express = require('express');
const { getAllProducts, getProductById, createProduct, updateProduct, deleteProduct } = require('../controllers/product.controller');
const { protect, isAdmin } = require('../middleware/authMiddleware');
const router = express.Router();

router.get('/', getAllProducts);
router.get('/:id', getProductById);

router.post('/', protect, isAdmin, createProduct);
router.patch('/:id', protect, isAdmin, updateProduct);
router.delete('/:id', protect, isAdmin, deleteProduct);

module.exports = router;