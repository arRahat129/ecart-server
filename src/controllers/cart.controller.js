const { ObjectId } = require('mongodb');
const { getDB } = require('../config/db');

async function getCart(req, res, next) {
    try {
        const db = getDB();
        const cart = await db.collection('carts').findOne({ customerId: req.user.sub });
        res.json(cart || { customerId: req.user.sub, item: [] });
    }
    catch (err) {
        next(err);
    }
}

async function addToCart(req, res, next) {
    try {
        const { productId, quantity, variantId } = req.body;
        const db = getDB();

        const product = await db.collection('products').findOne({ _id: new ObjectId(productId) });

        if (!product) {
            return res.status(404).json({ message: 'Product not found!' });
        }

        if (product.sellerId && product.sellerId === req.user.sub) {
            return res.status(400).json({ message: 'You cannot buy your own product' });
        }

        let resolvedPrice = product.price;
        let variantLabel = null;

        if (product.hasVariants) {
            if (!variantId) {
                return res.status(400).json({ message: 'Please select a variant' });
            }

            const variant = await db.collection('product_variants').findOne({ _id: new ObjectId(variantId) });
        
            if (!variant) {
                return res.status(404).json({ message: 'Variant not found' });
            }

            if (variant.stock < quantity) {
                return res.status(400).json({ message: 'Not enough variant stock' });
            }

            resolvedPrice = variant.price ?? product.price;

            const attrVals = await db.collection('variant_attribute_values').find({ variantId: new ObjectId(variantId) }).toArray();

            variantLabel = attrVals.map(a => `${a.attributeName}: ${a.value}`).join(' / ') || null; 
        }

        const cart = await db.collection('carts').findOne({ customerId: req.user.sub });

        const newItem = {
            productId,
            name: product.name,
            price: product.price,
            image: product.image,
            quantity,
            sellerId: product.sellerId ?? '',
            sellerName: product.sellerName ?? '',
            variantId: variantId ?? null,
            variantLabel: variantLabel ?? null,
        };

        if (cart) {
            const itemIndex = cart.items.findIndex(i => i.productId === productId);
            if (itemIndex > -1) {
                cart.items[itemIndex].quantity += quantity;
            }
            else {
                cart.items.push(newItem);
            }

            await db.collection('carts').updateOne(
                { customerId: req.user.sub },
                { $set: { items: cart.items } },
            );
        }
        else {
            await db.collection('carts').insertOne({
                customerId: req.user.sub,
                items: [newItem]
            });
        }

        const updatedCart = await db.collection('carts').findOne({ customerId: req.user.sub });
        res.json(updatedCart);
    }
    catch (err) {
        next(err);
    }
}

async function removeFromCart(req, res, next) {
    try {
        const { productId } = req.params;
        const db = getDB();
        await db.collection('carts').updateOne(
            { customerId: req.user.sub },
            { $pull: { items: { productId } } }
        );

        const updatedCart = await db.collection('carts').findOne({ customerId: req.user.sub });
        res.json(updatedCart || { customerId: req.user.sub, items: [] });
    }
    catch (err) {
        next(err);
    }
}

async function clearCart(req, res, next) {
    try {
        const db = getDB();
        await db.collection('carts').updateOne({ customerId: req.user.sub }, { $set: { items: [] } });
        res.json({ message: 'Cart Cleared Completely!' });
    }
    catch (err) {
        next(err);
    }
}

module.exports = { getCart, addToCart, removeFromCart, clearCart };