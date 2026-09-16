const express = require('express');
const { getAllProducts, getProductById, createProduct, updateMyProduct, updateProductStatus, deleteProduct } = require('../controllers/product.controller');
const { getVariants, upsertVariants, deleteVariant } = require('../controllers/variant.controller');
const { getSpecifications, upsertSpecifications } = require('../controllers/specification.controller');
const { protect, isAdmin } = require('../middleware/authMiddleware');
const router = express.Router();

router.get('/', getAllProducts);
router.get('/:id', getProductById);

router.post('/', protect, createProduct);
router.patch('/:id', protect, updateMyProduct);
router.patch('/:id/status', protect, isAdmin, updateProductStatus);
router.delete('/:id', protect, deleteProduct);

router.get('/:id/variants', getVariants);
router.put('/:id/variants', protect, upsertVariants);
router.delete('/:id/variants/:variantId', protect, deleteVariant);

router.get('/:id/specifications', getSpecifications);
router.put('/:id/specifications', protect, upsertSpecifications);

module.exports = router;