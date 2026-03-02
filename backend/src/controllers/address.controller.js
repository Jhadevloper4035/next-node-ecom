// controllers/address.controller.js
const mongoose = require("mongoose");
const Address = require("../models/address.model");
const { sendSuccess, sendError, isDuplicateErr } = require("../helper/request");

// ================= GET ALL =================
exports.getAllAddresses = async (req, res) => {
    try {
        const userId = req.user.id;

        const addresses = await Address.find({
            user: userId,
            isActive: true,
        })
            .sort({ isDefault: -1, createdAt: -1 })
            .lean();

        return sendSuccess(res, addresses, "Addresses fetched successfully");
    } catch (err) {
        console.error("Error fetching addresses:", err);
        return sendError(res, "Failed to fetch addresses", 500);
    }
};

// ================= CREATE =================
exports.createMyAddress = async (req, res, next) => {
    try {
        const userId = req.user.id;

        const activeCount = await Address.countDocuments({
            user: userId,
            isActive: true,
        });

        const payload = {
            ...req.body,
            country: "India",
            user: userId,
            isActive: true,
        };

        // auto-set default if first address
        if (activeCount === 0) payload.isDefault = true;

        const address = await Address.create(payload);

        return sendSuccess(res, address, "Address created successfully", 201);
    } catch (err) {
        if (isDuplicateErr(err)) {
            return sendError(
                res,
                "A default address already exists. Set another address as default.",
                409
            );
        }
        next(err);
    }
};

// ================= UPDATE =================
exports.updateMyAddress = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { addressId } = req.params;

        const address = await Address.findOne({
            _id: addressId,
            user: userId,
            isActive: true,
        });

        if (!address) {
            return sendError(res, "Address not found", 404);
        }

        Object.assign(address, req.body);
        await address.save();

        return sendSuccess(res, address, "Address updated successfully");
    } catch (err) {
        if (isDuplicateErr(err)) {
            return sendError(
                res,
                "A default address already exists. Use the set default endpoint.",
                409
            );
        }
        next(err);
    }
};

// ================= DELETE (SOFT) =================
exports.deleteMyAddress = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { addressId } = req.params;

        const address = await Address.findOne({
            _id: addressId,
            user: userId,
            isActive: true,
        });

        if (!address) {
            return sendError(res, "Address not found", 404);
        }

        const wasDefault = address.isDefault;

        address.isActive = false;
        address.isDefault = false;
        await address.save();

        // promote newest active as default if needed
        if (wasDefault) {
            const newest = await Address.findOne({
                user: userId,
                isActive: true,
            }).sort({ createdAt: -1 });

            if (newest) {
                newest.isDefault = true;
                await newest.save();
            }
        }

        return sendSuccess(res, null, "Address deleted successfully");
    } catch (err) {
        next(err);
    }
};

// ================= SET DEFAULT =================
exports.setDefaultAddress = async (req, res, next) => {
    const session = await mongoose.startSession();

    try {
        const userId = req.user.id;
        const { addressId } = req.params;

        await session.withTransaction(async () => {
            const address = await Address.findOne({
                _id: addressId,
                user: userId,
                isActive: true,
            }).session(session);

            if (!address) {
                throw Object.assign(new Error("Address not found"), {
                    statusCode: 404,
                });
            }

            await Address.updateMany(
                { user: userId, isActive: true, isDefault: true },
                { $set: { isDefault: false } },
                { session }
            );

            address.isDefault = true;
            await address.save({ session });
        });

        return sendSuccess(res, null, "Default address updated successfully");
    } catch (err) {
        if (err.statusCode) {
            return sendError(res, err.message, err.statusCode);
        }
        next(err);
    } finally {
        session.endSession();
    }
};

