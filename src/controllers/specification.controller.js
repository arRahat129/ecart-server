const { getDB } = require('../config/db');
const { ObjectId } = require('mongodb');

async function getSpecifications(req, res, next) {
    try {
        const db = getDB();
        const specs = await db.collection('product_specifications').find({ productId: new ObjectId(req.params.id), variantId: null }).toArray();
        res.json(specs);
    }
    catch (err) {
        next(err);
    }
}

async function upsertSpecifications(req, res, next) {
    try {
        const db = getDB();
        const product = await db.collection('products').findOne({ _id: new ObjectId(req.params.id) });

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        if (product.sellerId !== req.user.sub) {
            return res.status(403).json({ message: 'You can only manage specs for your own products' });
        }

        const { specifications } = req.body;

        if (!Array.isArray(specifications)) {
            return res.status(400).json({ message: 'specifications must be an array' });
        }

        await db.collection('product_specifications').deleteMany({
            productId: new ObjectId(req.params.id), variantId: null,
        });

        const docs = specifications.filter(s => s.key?.trim() && s.value?.trim()).map(s => ({
            productId: new ObjectId(req.params.id),
            specificationKeyId: s.specificationKeyId ? new ObjectId(s.specificationKeyId) : null,
            key: s.key.trim(),
            value: s.value.trim(),
            variantId: null,
        }));

        if (docs.length > 0) {
            await db.collection('product_specifications').insertMany(docs);
        }

        res.json({ message: 'Specifications saved' });
    }
    catch (err) {
        next(err);
    }
}

module.exports = { getSpecifications, upsertSpecifications };