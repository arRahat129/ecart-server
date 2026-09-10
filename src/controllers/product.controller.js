const { getDB } = require('../config/db');
const { ObjectId } = require('mongodb');

async function getAllProducts(req, res, next) {
    try {
        const db = getDB();
        const { category, search, status, sellerId, page = 1, limit = 12 } = req.query;
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

        if (status) {
            filter.status = status;
        }

        if (sellerId) {
            filter.sellerId = sellerId;
        }

        const parsedPage = parseInt(page) || 1;
        const parsedLimit = parseInt(limit) || 12;
        const skip = (parsedPage - 1) * parsedLimit;

        const products = await db.collection('products')
            .find(filter)
            .skip(skip)
            .limit(parsedLimit)
            .toArray();

        const total = await db.collection('products').countDocuments(filter);

        res.json({
            products,
            total,
            page: parsedPage,
            limit: parsedLimit,
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
        const { name, description, price, category, image, stock, sellerId, sellerName } = req.body;

        const newProduct = {
            name,
            description: description || '',
            price: parseFloat(price),
            category,
            image: image || 'https://i.ibb.co.com/N0JFXfB/image.png',
            stock: parseInt(stock) || 0,
            status: 'pending',
            sellerId: sellerId || req.user.sub,
            sellerName: sellerName || req.user.name,
            createdAt: new Date(),
        };

        const result = await db.collection('products').insertOne(newProduct);

        res.status(201).json({
            message: 'Product submitted successfully.',
            productId: result.insertedId
        });
    }
    catch (err) {
        next(err);
    }
}

async function updateMyProduct(req, res, next) {
    try {
        const db = getDB();

        if (!ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: 'Invalid product ID' });
        }

        const product = await db.collection('products').findOne({ _id: new ObjectId(req.params.id) });
        if (!product) return res.status(404).json({ message: 'Product not found' });
        if (product.sellerId !== req.user.sub)
            return res.status(403).json({ message: 'You can only edit your own products' });

        const { name, description, price, category, image, stock } = req.body;
        const updates = {};
        if (name !== undefined) updates.name = name;
        if (description !== undefined) updates.description = description;
        if (price !== undefined) updates.price = parseFloat(price);
        if (category !== undefined) updates.category = category;
        if (image !== undefined) updates.image = image;
        if (stock !== undefined) updates.stock = parseInt(stock);
        updates.status = 'pending';
        updates.updatedAt = new Date();

        const result = await db.collection('products').findOneAndUpdate(
            { _id: new ObjectId(req.params.id) }, { $set: updates }, { returnDocument: 'after' }
        );
        res.json(result);
    } catch (err) { next(err); }
}

async function updateProductStatus(req, res, next) {
    try {
        const db = getDB();
        const { status, name, description, price, category, image, stock } = req.body;
        const updates = {};
        if (status !== undefined) {
            if (!['pending', 'approved', 'rejected'].includes(status))
                return res.status(400).json({ message: 'status must be pending, approved, or rejected' });
            updates.status = status;
        }
        if (name !== undefined) updates.name = name;
        if (description !== undefined) updates.description = description;
        if (price !== undefined) updates.price = parseFloat(price);
        if (category !== undefined) updates.category = category;
        if (image !== undefined) updates.image = image;
        if (stock !== undefined) updates.stock = parseInt(stock);
        updates.updatedAt = new Date();

        const result = await db.collection('products').findOneAndUpdate(
            { _id: new ObjectId(req.params.id) }, { $set: updates }, { returnDocument: 'after' }
        );
        if (!result) return res.status(404).json({ message: 'Product not found' });
        res.json(result);
    } catch (err) { next(err); }
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

module.exports = { getAllProducts, getProductById, createProduct, updateMyProduct, updateProductStatus, deleteProduct };