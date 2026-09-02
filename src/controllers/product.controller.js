const { getDB } = require('../config/db');
const { ObjectId } = require('mongodb');

async function getAllProducts(req, res, next) {
    try {
        const db = getDB();
        const { category, search, page = 1, limit = 12 } = req.query;
        const filter = {};

        if (category) {
            filter.category = category;
        }

        if (search) {
            filter.name = {
                $regex: search,
                $options: 'i'
            };
        }

        const skip = (perseInt(page) - 1) * parseInt(limit);

        const products = await db.collection('products').find(filter).skip(skip).limit(parseInt(limit)).toArray();

        const total = await db.collection('products').countDocements(filter);

        res.json({
            products,
            total,
            page: parseInt(page),
            limit: parseInt(limit),
        });
    }
    catch (err) {
        next(err);
    }
}

async function getProductById(req, res, next) {
    try {
        const db = getDB();
        const product = await db.collection('products').findOne({ _id: new ObjectId(req.params.id) });
        if (!product) {
            return res.status(404).json({ message: 'Product not found!' });
        }
        res.json(product);
    }
    catch (err) {
        next(err);
    }
}


async function createProduct(req, res, next) {
    try {
        const db = getDB();
        const { name, description, price, category, image, stock } = req.body;

        const result = await db.collection('products').insertOne({
            name,
            description: description || '',
            price: parseFloat(price),
            category,
            image: image || 'https://i.ibb.co.com/N0JFXfB/image.png',
            stock: parseInt(stock) || 1,
            createdAt: new Date(),
        });

        res.status(201).json({ message: 'A new Product created.', productId: result.insertedId });
    }
    catch (err) {
        next(err);
    }
}

async function updateProduct(req, res, next) {
    try {
        const db = getDB();
        const { name, description, price, category, image, stock } = req.body;

        const updates = {};

        if (name !== undefined) {
            updates.name = name;
        }
        if (description !== undefined) {
            updates.description = description;
        }
        if (price !== undefined) {
            updates.price = parseFloat(price);
        }
        if (category !== undefined) {
            updates.category = category;
        }
        if (image !== undefined) {
            updates.image = image;
        }
        if (stock !== undefined) {
            updates.stock = parseInt(stock);
        }
        updates.updatedAt = new Date();

        const result = await db.collection('products').findOneAndUpdate(
            { _id: new ObjectId(req.params.id) },
            { $set: updates },
            { returnDocument: 'after' }
        );

        if (!result) {
            return res.status(404).json({ message: 'Product Not Found! ' });
        }

        res.json(result);
    }
    catch (err) {
        next(err);
    }
}

async function deleteProduct(req, res, next) {
    try {
        const db = getDB();
        const result = await db.collection('products').deleteOne({ _id: new ObjectId(req.params.id) });
        if (result.deletedCount === 0) return res.status(404).json({ message: 'Product not found' });
        res.json({ message: 'Product deleted' });
    } catch (err) {
        next(err);
    }
}

module.exports = { getAllProducts, getProductById, createProduct, updateProduct, deleteProduct };