const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { getDB } = require('../config/db');

async function register(req, res, next) {
    try {
        const { name, email, password } = req.body;
        const db = getDB();

        const existing = await db.collection('customers').findOne({ email });
        if (existing) {
            return res.status(409).json({ message: 'Email already exists!' });
        }

        const hashedPassword = await bcrypt.hash(password, 12);
        const result = await db.collection('customers').insertOne({
            name,
            email,
            password: hashedPassword,
            role: 'customer',
            createdAt: new Date(),
        });

        res.status(201).json({ message: 'Registration Completed successfully!', customerId: result.insertedId });
    }
    catch (err) {
        next(err);
    }
}

async function login(req, res, next) {
    try {
        const { email, password } = req.body;
        const db = getDB();
        // const invalid = false;

        const customer = await db.collection('customers').findOne({ email });

        let isMatch = false;
        if (customer) {
            isMatch = await bcrypt.compare(password, customer.password);
        }

        if (!customer || !isMatch) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const token = jwt.sign(
            {
                sub: customer._id.toString(),
                email: customer.email,
                name: customer.name,
                role: customer.role,
            },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            token,
            customer: {
                id: customer._id,
                name: customer.name,
                email: customer.email,
                role: customer.role,
            },
        });
    }
    catch (err) {
        next(err);
    }
}

module.exports = { register, login };