const express = require('express');
const { getDB } = require('../config/db');
const { protect, isAdmin } = require('../middleware/authMiddleware');
const router = express.Router();

router.get('/public', async (req, res, next) => {
    try {
        const db = getDB();
        const [products, customers, orders] = await Promise.all([
            db.collection('products').countDocuments({ status: 'approved' }),
            db.collection('customers').countDocuments(),
            db.collection('orders').countDocuments(),
        ]);
        res.json({ products, customers, orders });
    } catch (err) { next(err); }
});

router.get('/admin', protect, isAdmin, async (req, res, next) => {
    try {
        const db = getDB();

        const days = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setUTCHours(0, 0, 0, 0);
            d.setUTCDate(d.getUTCDate() - i);
            days.push(d);
        }

        async function dailyCounts(collection) {
            return Promise.all(
                days.map(day => {
                    const next = new Date(day);
                    next.setUTCDate(next.getUTCDate() + 1);
                    return db.collection(collection).countDocuments({ createdAt: { $gte: day, $lt: next } });
                })
            );
        }

        const [totalUsers, dailyUsers, dailyProducts, dailyOrders] = await Promise.all([
            db.collection('customers').countDocuments(),
            dailyCounts('customers'),
            dailyCounts('products'),
            dailyCounts('orders'),
        ]);

        const labels = days.map(d =>
            d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        );

        res.json({
            totalUsers,
            chart: {
                labels,
                dailyUsers,
                dailyProducts,
                dailyOrders,
            },
        });
    } catch (err) { next(err); }
});

module.exports = router;