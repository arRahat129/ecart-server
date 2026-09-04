const { ObjectId } = require("mongodb");

const { getDB } = require('../config/db.js');

async function getAddresses(req, res, next) {
    try {
        const db = getDB();
        const addresses = await db.collection('addresses').find({ customerId: req.user.sub }).toArray();

        res.json(addresses);
    }
    catch (err) {
        next(err);
    }
}

async function createAddress(req, res, next) {
    try {
        const db = getDB();
        const { label, street, city, state, zip, country, phone } = req.body;

        const result = await db.collection('addresses').insertOne({
            customerId: req.user.sub,
            label,
            street,
            city,
            state,
            zip,
            country,
            phone,
            createdAt: new Date(),
        });
        res.status(201).json({ message: 'Address Saved Successfully!', addressId: result.insertedId });
    }
    catch (err) {
        next(err);
    }
}

async function updateAddress(req, res, next){
    try {
        const db = getDB();
        const { label, street, city, state, zip, country, phone } = req.body;

        const updates = {};
        if (label !== undefined) {
            updates.label = label;
        }
        if (street !== undefined) {
            updates.street = street;
        }
        if (city !== undefined) {
            updates.city = city;
        }
        if (state !== undefined) {
            updates.state = state;
        }
        if (state !== undefined) {
            updates.state = state;
        }
        if (zip !== undefined) {
            updates.zip = zip;
        }
        if (country !== undefined) {
            updates.country = country;
        }
        if (phone !== undefined) {
            updates.phone = phone;
        }
        updates.updatedAt = new Date();

        const result = await db.collection('addresses').findOneAndUpdate(
            { _id: new ObjectId(req.params.id), customerId: req.user.sub },
            { $set: updates },
            { returnDocument: 'after' },
        );

        if (!result) {
            return res.status(404).json({ message: 'Address not found!' });
        }
        res.json(result);
    }
    catch (err) {
        next(err);
    }
}

async function deleteAddress(req, res, next) {
    try {
        const db = getDB();
        const result = await db.collection('addresses').deleteOne(
            { _id: new ObjectId(req.params.id), customerId: req.user.sub, }
        );

        if (result.deletedCount === 0) {
            return res.status(404).json({ message: 'Address not found!' });
        }
        res.json({ message: 'Address Deleted!' });
    }
    catch (err) {
        next(err);
    }
}


module.exports = { getAddresses, createAddress, updateAddress, deleteAddress };