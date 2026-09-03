const { ObjectId } = require('mongodb');
const { getDB } = require('../config/db');
const bcrypt = require('bcrypt');

async function getMe(req, res, next) {
    try {
        const db = getDB();
        const customer = await db.collection('customers').findOne(
            { _id: new ObjectId(req.user.sub) },
            { projection: { password: 0 } },
        );
        if (!customer) {
            return res.status(404).json({ message: 'Customer Not Found!' });
        }
        res.json(customer);
    }
    catch (err) {
        next(err);
    }
}

async function updateMe(req, res, next) {
    try {
        const db = getDB();
        const { name, email, currentPassword, newPassword, confirmPassword, image } = req.body;
        const updates = {};

        if (name) {
            updates.name = name;
        }
        if (email) {
            const exists = await db.collection('customers').findOne({ email, _id: { $ne: new ObjectId(req.user.sub) } });

            if (exists) {
                return res.status(409).json({ message: 'Email already in use!' });
            }
        }
        if (image !== undefined) {
            updates.image = image;
        }
        if (currentPassword || newPassword || confirmPassword) {
            if (!currentPassword || !newPassword || !confirmPassword) {
                return res.status(400).json({ message: 'To change password, provide Current Password, New Password, and Confirm Password' })
            }

            if (newPassword !== confirmPassword) {
                return res.status(400).json({ message: 'New password do not match in confirmation!' });
            }

            const customer = await db.collection('customers').findOne(
                { _id: new ObjectId(req.user.sub) },
                { projection: { password: 1 } },
            )

            const isMatch = await bcrypt.compare(currentPassword, customer.password);

            if (!isMatch) {
                return res.status(401).json({ message: 'Current Password is incorrect' });
            }

            updates.password = await bcrypt.hash(newPassword, 12);
        }

        updates.updatedAt = new Date();

        const result = await db.collection('customer').findOneAndUpdate(
            { _id: new ObjectId(req.user.sub) },
            { $set: updates },
            { returnDocument: 'after', projection: { password: 0 } },
        );

        res.json(result);
    }
    catch (err) {
        next(err);
    }
}

async function getAllCustomers(req, res, next) {
    try {
        const db = getDB();
        const { page = 1, limit = 10 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const customers = await db.collection('customers').find({}, { projection: { password: 0 } }).skip(skip).limit(parseInt(limit)).toArray();

        const total = await db.collection('customers').countDocuments();

        res.json({
            customers,
            total,
            page: parseInt(page),
            limit: parseInt(limit),
        });
    }
    catch (err) {
        next(err);
    }
}

async function updateCustomerRole(req, res, next) {
    try {
        const db = getDB();
        const { role } = req.body;

        if (!['customer', 'admin'].includes(role)) {
            return res.status(400).json({ message: 'role must be "customer" or "admin"' });
        }

        const result = await db.collection('customers').findOneAndUpdate(
            { _id: new ObjectId(req.params.id) },
            { $set: { role, updatedAt: new Date() } },
            { returnDocument: 'after', projection: { password: 0 } },
        );

        if (!result) {
            return res.status(404).json({ message: 'Customer not found!' });
        }

        res.json(result);
    }
    catch (err) {
        next(err);
    }
}


module.exports = { getMe, updateMe, getAllCustomers, updateCustomerRole };