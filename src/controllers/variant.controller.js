const { getDB } = require('../config/db');
const { ObjectId } = require('mongodb');

async function getVariants(req, res, next) {
    try {
        const db = getDB();
        const variants = await db.collection('product_variants').find({ productId: new ObjectId(req.params.id) }).toArray();

        const variantIds = variants.map(v => v._id);

        const attrValues = await db.collection('variant_attribute_values').find({ variantId: { $in: variantIds } }).toArray();

        const result = variants.map(v => ({
            ...v,
            attributes: attrValues.filter(a => String(a.variantId) === String(v._id)),
        }));

        res.json(result);
    }
    catch (err) {
        next(err);
    }
}

async function upsertVariants(req, res, next) {
    try {
        const db = getDB();
        const product = await db.collection('products').findOne({ _id: new ObjectId(req.params.id) });

        if (!product) {
            return res.status(404).json({ message: 'Product not found!!!' });
        }

        if (product.sellerId !== req.user.sub) {
            return res.status(403).json({ message: 'You can only manage variants for your own products' });
        }

        const { variants } = req.body;

        if (!Array.isArray(variants)) {
            return res.status(400).json({ message: 'Variants must be an array!' });
        }

        const oldVariants = await db.collection('product_variants').find({ productId: new ObjectId(req.params.id) }, { projection: { _id: 1 } }).toArray();

        const oldIds = oldVariants.map(v => v._id);

        if (oldIds.length > 0) {
            await db.collection('variant_attribute_values').deleteMany({ variantId: { $in: oldIds } });
            await db.collection('product_variants').deleteMany({ productId: new ObjectId(req.params.id) });
        }

        if (variants.length === 0) {
            await db.collection('products').updateOne(
                { _id: new ObjectId(req.params.id) },
                { $set: { hasVariants: false, updatedAt: new Date() } },
            );
            return res.json({ message: 'Variants cleared', count: 0 });
        }

        const variantDocs = variants.map(v => ({
            productId: new ObjectId(req.params.id),
            sku: v.sku ?? '', price: parseFloat(v.price) || product.price,
            stock: parseInt(v.stock) || 0, image: v.image ?? '', createdAt: new Date(),
        }));

        const inserted = await db.collection('product_variants').insertMany(variantDocs);

        const attrDocs = [];

        Object.values(inserted.insertedIds).forEach((variantId, i) => {
            (variants[i].attributes ?? []).forEach(a => {
                attrDocs.push({
                    variantId,
                    attributeValueId: new ObjectId(a.atributeValueId),
                    attributeName: a.attributeName ?? '',
                    value: a.value ?? '',
                });
            });
        });

        if (attrDocs.length > 0) {
            await db.collection('variant_attribute_values').insertMany(attrDocs);
        }

        await db.collection('products').updateOne(
            { _id: new ObjectId(req.params.id) },
            { $set: { hasVariants: true, upddatedAt: new Date() } },
        );

        res.json({ message: 'Variants saved!', count: variantDocs.length });
    }
    catch (err) {
        next(err);
    }
}

async function deleteVariant(req, res, next) {
    try {
        const db = getDB();
        const product = await db.collection('products').findOne({ _id: new ObjectId(req.params.id) });

        if (!product) {
            return res.status(404).json({ message: 'Product Not Found!' });
        }

        if (product.sellerId !== req.user.sub) {
            return res.status(403).json({ message: 'You can only manage variants for your own products' });
        }

        await db.collection('variant_attribute_values').deleteOne({
            _id: new ObjectId(req.params.variantId),
            productId: new ObjectId(req.params.id),
        });

        if (result.deletedCount === 0) {
            return res.status(404).json({ message: 'Variant not found' });
        }

        const remaining = await db.collection('product_variants').countDocuments({ productId: new ObjectId(req.params.id) });

        if (remaining === 0) {
            await db.collection('products').updateOne(
                { _id: new ObjectId(req.params.id) },
                { $set: { hasVariants: false, updatedAt: new Date() } }
            );
        }

        res.json({ message: 'Variant deleted' });
    }
    catch (err) {
        next(err);
    }
}

module.exports = { getVariants, upsertVariants, deleteVariant };