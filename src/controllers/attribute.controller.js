const { getDB } = require('../config/db');
const { ObjectId } = require('mongodb');

async function getAttributes(req, res, next) {
    try {
        const db = getDB();
        const attributes = await db.collection('attributes').find({}).sort({ name: 1 }).toArray();
        res.json(attributes);
    }
    catch (err) {
        next(err);
    }
}

async function createAttribute(req, res, next) {
    try {
        const db = getDB();
        const { name } = req.body;

        if (!name) {
            return res.status(400).json({ message: 'Name is required' });
        }

        const existing = await db.collection('attributes').findOne({ name });

        if (existing) {
            return res.status(409).json({ message: 'Attribute already exists' });
        }

        const result = await db.collection('attributes').insertOne({ name, createdAt: new Date() });

        res.status(201).json({
            message: 'Attribute created',
            attributeId: result.insertedId
        });
    }
    catch (err) {
        next(err);
    }
}

async function deleteAttribute(req, res, next) {
    try {
        const db = getDB();

        await db.collection('attribute_values').deleteMany({ attributeId: new ObjectId(req.params.id) });

        const result = await db.collection('attributes').deleteOne({ _id: new ObjectId(req.params.id) });

        if (result.deletedCount === 0) {
            return res.status(404).json({ message: 'Attribute not found' });
        }
        res.json({ message: 'Attribute and values deleted' });
    }
    catch (err) {
        next(err);
    }
}

async function getAttributeValues(req, res, next) {
    try {
        const db = getDB();
        const values = await db.collection('attribute_values').find({ attributeId: new ObjectId(req.params.id) }).sort({ value: 1 }).toArray();

        res.json(values);
    }
    catch (err) {
        next(err);
    }
}

async function createAttributeValue(req, res, next) {
    try {
        const db = getDB();
        const { value } = req.body;

        if (!value) {
            return res.status(400).json({ message: 'Value is required' });
        }

        const attribute = await db.collection('attributes').findOne({ _id: new ObjectId(req.params.id) });

        if (!attribute) {
            return res.status(404).json({ message: 'Attribute not found' });
        }

        const existing = await db.collection('attribute_values').findOne({ attributeId: new ObjectId(req.params.id), value });

        if (existing) {
            return res.status(409).json({ message: 'Value already exists' });
        }

        const result = await db.collection('attribute_values').insertOne({
            attributeId: new ObjectId(req.params.id),
            attributeName: attribute.name,
            value,
            createdAt: new Date(),
        });

        res.status(201).json({
            message: 'Value added',
            valueId: result.insertedId
        });
    }
    catch (err) {
        next(err);
    }
}

async function deleteAttributeValue(req, res, next) {
    try {
        const db = getDB();
        const result = await db.collection('attribute_values').deleteOne({ _id: new ObjectId(req.params.valueId) });

        if (result.deletedCount === 0) {
            return res.status(404).json({ message: 'Value not found' });
        }

        res.json({ message: 'Value deleted' });
    }
    catch (err) {
        next(err);
    }
}

module.exports = { getAttributes, createAttribute, deleteAttribute, getAttributeValues, createAttributeValue, deleteAttributeValue };