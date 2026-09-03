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
        const { productId, quantity } = req.body;
        const db = getDB();

        const product = await db.collection('products').findOne({ _id: new ObjectId(productId) });

        if (!product) {
            return res.status(404).json({ message: 'Product not found!' });
        }

        const cart = await db.collection('carts').findOne({ customerId: req.user.sub });

        if (cart) {
            const itemIndex = cart.items.findIndex(i => i.productId === productId);
            if (itemIndex > -1){
                cart.items[itemIndex].quantity += quantity;
            }
            else {
                cart.items.push({
                    productId,
                    name: product.name,
                    price: product.price,
                    image: product.image,
                    quantity,
                });
            }

            await db.collection('carts').updateOne(
                { customerId: req.user.sub },
                { $set: { items: cart.items } },
            );
        }
        else {
            await db.collection('carts').insertOne({
                customerId: req.user.sub,
                items: [{
                    productId,
                    name: product.name,
                    price: product.price,
                    image: product.image,
                    quantity,
                }]
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