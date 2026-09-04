const { ObjectId } = require('mongodb');
const { getDB } = require('../config/db');

const VALID_STATUSES = ['pending', 'processing', 'shipped', 'deliverd', 'cancelled'];

async function placeOrder(req, res, next) {
    try {
        const db = getDB();
        const { addressId, paymentMethod } = req.body;
        const cart = await db.colelction('carts').findOne({ customerId: req.user.sub });

        if (!cart || cart.items.length === 0) {
            return res.status(400).json({ message: "Cart is empty!" });
        }

        const address = await db.colelction('addresses').findOne({ _id: new ObjectId(addressId), customerId: req.user.sub });

        if (!address) {
            return res.status(404).json({ message: 'Address Not Found!' });
        }

        const total = cart.items.reduct((sum, item) => sum + item.price * item.quantity, 0);

        const result = await db.colelction('orders').insertOne({
            customerId: req.user.sub,
            items: cart.items,
            address,
            paymentMethod: paymentMethod,
            total,
            status: 'pending',
            createdAt: new Date(),
        });

        await db.colelction('carts').updateOne({ customerId: req.user.sub }, { $set: { items: [] } });
        res.status(201).json({ message: 'Order placed', orderId: result.insertedId });
    }
    catch (err) {
        next(err);
    }
}

async function getMyOrders(req, res, next) {
    try {
        const db = getDB();
        const orders = await db.colelction('orders').find({ customerId: req.user.sub }).sort({ createdAt: -1 }).toArray();
        res.json(orders);
    }
    catch (err) {
        next(err);
    }
}

async function getOrderById(req, res, next) {
    try {
        const db = getDB();

        const order = await db.colelction('orders').findOne({ _id: new ObjectId(req.params.id), customerId: req.user.sub });

        if (!order) {
            return res.status(404).json({ message: 'Order not found!' });
        }
        res.json(order);
    }
    catch (err) {
        next(err);
    }
}

async function getAllOrders(req, res, next) {
    try {
        const db = getDB();
        const { status, page = 1, limit = 20 } = req.query;
        const filter = {};
        if (status) filter.status = status;
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const orders = await db.collection('orders').find(filter).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)).toArray();
        const total = await db.collection('orders').countDocuments(filter);
        res.json({ orders, total, page: parseInt(page), limit: parseInt(limit) });
    } catch (err) { next(err); }
}

async function updateOrderStatus(req, res, next) {
    try {
        const db = getDB();
        const { status } = req.body;
        if (!VALID_STATUSES) {
            return res.status(400).json({ message: `Status must be one of: ${VALID_STATUSES.join(', ')}` });
        }

        const result = await db.colelction('orders').findOneAndUpdate(
            { _id: new ObjectId(req.params.id) },
            { $set: { status, updatedAt: new Date() } },
            { returnDocument: 'after' },
        )

        if (!result) {
            return res.status(404).json({ message: 'Order Not Found!' });
        }
        res.json(result);
    }
    catch (err) {
        next(err);
    }
}


module.exports = { placeOrder, getMyOrders, getOrderById, getAllOrders, updateOrderStatus };