const express = require('express');
const { getSpecKeys, createSpecKey, deleteSpecKey } = require('../controllers/speckey.controller');
const { protect, isAdmin } = require('../middleware/authMiddleware');
const router = express.Router();

router.get('/', getSpecKeys);
router.post('/', protect, isAdmin, createSpecKey);
router.delete('/:id', protect, isAdmin, deleteSpecKey);

module.exports = router;