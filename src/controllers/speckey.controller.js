const { getDB } = require('../config/db');

async function getSpecKeys(req, res, next) {
    try {
        const db = getDB();
        const filter = {};

        if (req.query.category) {
            filter.category = req.query.category;
        }

        const keys = await db.collection('specification_keys').find(filter).sort({ key: 1 }).toArray();

        req.json(keys);
    }
    catch (err) {
        next(err);
    }
}

async function createSpecKey(req, res, next) {
    try {
        const db = getDB();
        const { category, key, required = false } = req.body;

        if (!category || !key) {
            return res.status(400).json({ message: 'Category and Key are required!' });
        }

        const existing = await db.collection('specification_keys').findOne({ category, key });

        if (existing) {
            return res.status(409).json({ message: 'Spec key already exists for this category' });
        }

        const result = await db.collection('specification_keys').insertOne({
            category,
            key,
            required,
            createdAt: new Date(),
        });

        res.status(201).json({ message: 'Spec key created', specKeyId: result.insertedId });
    }
    catch (err) {
        next(err);
    }
}

async function deleteSpecKey(req, res, next) {
    try {
        const db = getDB();
        const result = await db.collection('specification_keys').deleteOne({ _id: new ObjectId(req.params.id) });

        if (result.deletedCount === 0) {
            return res.status(404).json({ message: 'Spec key not found' });
        }

        res.json({ message: 'Spec key deleted' });
    }
    catch (err) {
        next(err);
    }
}

module.exports = { getSpecKeys, createSpecKey, deleteSpecKey };