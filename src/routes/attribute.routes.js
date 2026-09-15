const express = require('express');
const { getAttributes, createAttribute, deleteAttribute, getAttributeValues, createAttributeValue, deleteAttributeValue } = require('../controllers/attribute.controller');
const { protect, isAdmin } = require('../middleware/authMiddleware');
const router = express.Router();

router.get('/', getAttributes);
router.post('/', protect, isAdmin, createAttribute);
router.delete('/:id', protect, isAdmin, deleteAttribute);
router.get('/:id/values', getAttributeValues);
router.post('/:id/values', protect, isAdmin, createAttributeValue);
router.delete('/values/:valueId', protect, isAdmin, deleteAttributeValue);

module.exports = router;