const { ObjectId } = require('mongodb');
const { getDB } = require('../config/db');

const VALID_STATUSES = ['pending', 'processing', 'shipped', 'deliverd', 'cancelled'];

async function placeOrder(req, res, next) {
    try {
        const db = getDB();
        const { addressId, paymentMethod } = req.body;
        const cart = await db.collection('carts').findOne({ customerId: req.user.sub });

        if (!cart || cart.items.length === 0) {
            return res.status(400).json({ message: "Cart is empty!" });
        }

        const ownItem = cart.items.find(i => i.sellerId === req.user.sub);
        if (ownItem) return res.status(400).json({ message: `You cannot buy your own product: "${ownItem.name}"` });

        const address = await db.collection('addresses').findOne({ _id: new ObjectId(addressId), customerId: req.user.sub });

        if (!address) {
            return res.status(404).json({ message: 'Address Not Found!' });
        }

        const total = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

        const result = await db.collection('orders').insertOne({
            customerId: req.user.sub,
            items: cart.items,
            address,
            paymentMethod: paymentMethod,
            total,
            status: 'pending',
            createdAt: new Date(),
        });

        await db.collection('carts').updateOne({ customerId: req.user.sub }, { $set: { items: [] } });
        res.status(201).json({ message: 'Order placed', orderId: result.insertedId });
    }
    catch (err) {
        next(err);
    }
}

async function getMyOrders(req, res, next) {
    try {
        const db = getDB();
        const orders = await db.collection('orders').find({ customerId: req.user.sub }).sort({ createdAt: -1 }).toArray();
        res.json(orders);
    }
    catch (err) {
        next(err);
    }
}

async function getOrderById(req, res, next) {
    try {
        const db = getDB();

        const order = await db.collection('orders').findOne({ _id: new ObjectId(req.params.id), customerId: req.user.sub });

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

        const result = await db.collection('orders').findOneAndUpdate(
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

async function getOrdersForMyProducts(req, res, next) {
    try {
        const db = getDB();
        const orders = await db.collection('orders')
            .find({ 'items.sellerId': req.user.sub })
            .sort({ createdAt: -1 })
            .toArray();
        const result = orders.map(order => ({
            ...order,
            items: order.items.filter(i => i.sellerId === req.user.sub),
        }));
        res.json(result);
    } catch (err) { next(err); }
}

async function updateOrderStatusBySeller(req, res, next) {
    try {
        const db = getDB();
        const { status } = req.body;

        const SELLER_ALLOWED = ['processing', 'shipped', 'delivered', 'cancelled'];
        if (!SELLER_ALLOWED.includes(status)) {
            return res.status(400).json({ message: `Seller can only set status to: ${SELLER_ALLOWED.join(', ')}` });
        }

        const order = await db.collection('orders').findOne({ _id: new ObjectId(req.params.id) });
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        const hasSellersItem = order.items.some(i => i.sellerId === req.user.sub);
        if (!hasSellersItem) {
            return res.status(403).json({ message: 'You do not have products in this order' });
        }

        // Define valid forward transitions for the seller
        const TRANSITIONS = {
            pending:    ['processing', 'cancelled'],
            processing: ['shipped', 'cancelled'],
            shipped:    ['delivered'],
        };

        const allowed = TRANSITIONS[order.status];
        if (!allowed) {
            return res.status(400).json({ message: `Cannot change status from "${order.status}"` });
        }
        if (!allowed.includes(status)) {
            return res.status(400).json({ message: `Cannot move from "${order.status}" to "${status}". Allowed: ${allowed.join(', ')}` });
        }

        // Decrement stock when seller first accepts (pending → processing)
        if (status === 'processing') {
            const sellerItems = order.items.filter(i => i.sellerId === req.user.sub);
            await Promise.all(
                sellerItems.map(item =>
                    db.collection('products').updateOne(
                        { _id: new ObjectId(item.productId) },
                        { $inc: { stock: -item.quantity } }
                    )
                )
            );
        }

        const result = await db.collection('orders').findOneAndUpdate(
            { _id: new ObjectId(req.params.id) },
            { $set: { status, updatedAt: new Date() } },
            { returnDocument: 'after' }
        );
        res.json(result);
    } catch (err) { next(err); }
}

async function cancelOrderByBuyer(req, res, next) {
    try {
        const db = getDB();
        const { reason } = req.body;
        const order = await db.collection('orders').findOne({ _id: new ObjectId(req.params.id), customerId: req.user.sub });
        if (!order) return res.status(404).json({ message: 'Order not found' });
        if (!['pending', 'processing'].includes(order.status))
            return res.status(400).json({ message: 'Cannot cancel order after it has been shipped' });

        const result = await db.collection('orders').findOneAndUpdate(
            { _id: new ObjectId(req.params.id) },
            {
                $set: {
                    status: 'cancelled',
                    cancelledBy: 'buyer',
                    cancellationReason: reason || '',
                    updatedAt: new Date(),
                },
            },
            { returnDocument: 'after' }
        );
        res.json(result);
    } catch (err) { next(err); }
}


async function cancelOrderBySeller(req, res, next) {
    try {
        const db = getDB();
        const { reason } = req.body;
        const order = await db.collection('orders').findOne({ _id: new ObjectId(req.params.id) });
        if (!order) return res.status(404).json({ message: 'Order not found' });
        const hasSellersItem = order.items.some(i => i.sellerId === req.user.sub);
        if (!hasSellersItem)
            return res.status(403).json({ message: 'You do not have products in this order' });
        if (!['pending', 'processing'].includes(order.status))
            return res.status(400).json({ message: 'Cannot cancel order after it has been shipped' });

        const result = await db.collection('orders').findOneAndUpdate(
            { _id: new ObjectId(req.params.id) },
            {
                $set: {
                    status: 'cancelled',
                    cancelledBy: 'seller',
                    cancellationReason: reason || '',
                    updatedAt: new Date(),
                },
            },
            { returnDocument: 'after' }
        );
        res.json(result);
    } catch (err) { next(err); }
}


module.exports = { placeOrder, getMyOrders, getOrderById, getAllOrders, updateOrderStatus, getOrdersForMyProducts, updateOrderStatusBySeller, cancelOrderByBuyer, cancelOrderBySeller };