const mongoose = require("mongoose");

const optionItemSchema = new mongoose.Schema(
    {
        value: { type: String, required: true, trim: true },
        label: { type: String, required: true, trim: true },

        description: { type: String, default: "", trim: true },

        priceDelta: { type: Number, default: 0, min: 0 },
        priceOverride: { type: Number, default: null, min: 0 },

        images: [{ type: String }],
        swatch: {
            color: { type: String, default: "", trim: true },
            image: { type: String, default: "", trim: true },
        },
        isDefault: { type: Boolean, default: false },
        isActive: { type: Boolean, default: true },
    },
    { _id: true }
);

/**
 * A product can expose any number of category-specific customization groups.
 * Examples: size, foam-density, foam-quality, fabric-type, colour or finish.
 */
const customizationGroupSchema = new mongoose.Schema(
    {
        key: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
            match: [/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Customization key must be URL friendly"],
        },
        label: { type: String, required: true, trim: true },
        description: { type: String, default: "", trim: true },
        inputType: {
            type: String,
            enum: ["buttons", "select", "swatches", "images"],
            default: "buttons",
        },
        isRequired: { type: Boolean, default: true },
        displayOrder: { type: Number, default: 0, min: 0 },
        isActive: { type: Boolean, default: true },
        options: {
            type: [optionItemSchema],
            default: [],
            validate: [
                {
                    validator(options) {
                        return options.length > 0;
                    },
                    message: "A customization group must contain at least one option",
                },
                {
                    validator(options) {
                        const values = options.map((option) =>
                            String(option.value || "").trim().toLowerCase()
                        );
                        return new Set(values).size === values.length;
                    },
                    message: "Option values must be unique within a customization group",
                },
                {
                    validator(options) {
                        return options.filter((option) => option.isDefault).length <= 1;
                    },
                    message: "A customization group can have only one default option",
                },
            ],
        },
    },
    { _id: true }
);

/**
 * ========= MAIN PRODUCT SCHEMA =========
 */
const productSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
            minlength: 3,
            maxlength: 200,
        },

        slug: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            index: true,
            trim: true,
        },

        description: {
            type: String,
            required: true,
            trim: true,
            minlength: 10,
            maxlength: 2000,
        },

        // ===== BASE PRICE =====
        basePrice: { type: Number, required: true, min: 0 },
        gstPercent: { type: Number, default: 18, min: 0, max: 100 },

        currency: {
            type: String,
            default: "INR",
            enum: ["INR", "USD", "EUR", "GBP"],
        },

        // ===== STOCK =====
        stock: { type: Number, default: 0, min: 0 },
        inStock: { type: Boolean, default: true },

        // ===== PRODUCT IMAGES =====
        images: [{ type: String, required: true }],

        category: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Category",
            required: true,
            index: true,
        },

        subcategories: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Category",
                index: true,
            },
        ],

        optionPricing: {
            sizes: { type: [optionItemSchema], default: [] },
            fabrics: { type: [optionItemSchema], default: [] },
            foams: { type: [optionItemSchema], default: [] },
            materials: { type: [optionItemSchema], default: [] },
        },

        // Dynamic option groups vary by product/category. optionPricing above is
        // retained so existing products and clients remain backward compatible.
        customizationGroups: {
            type: [customizationGroupSchema],
            default: [],
            validate: {
                validator(groups) {
                    const keys = groups.map((group) =>
                        String(group.key || "").trim().toLowerCase()
                    );
                    return new Set(keys).size === keys.length;
                },
                message: "Customization group keys must be unique",
            },
        },

        // ===== DIMENSIONS / WEIGHT =====
        dimensions: {
            length: Number,
            width: Number,
            height: Number,
            unit: { type: String, default: "cm", enum: ["cm", "inch", "m"] },
        },

        weight: {
            value: Number,
            unit: { type: String, default: "kg", enum: ["kg", "g", "lb"] },
        },

        assemblyRequired: { type: Boolean, default: false },
        warranty: { type: String, default: "" },

        careInstructions: [String],
        tags: [String],

        rating: { type: Number, default: 0, min: 0, max: 5 },
        reviewsCount: { type: Number, default: 0, min: 0 },

        isActive: { type: Boolean, default: true, index: true },
        isDeleted: { type: Boolean, default: false, index: true },
    },
    { timestamps: true }
);

/**
 * ========= INDEXES =========
 */
productSchema.index({ slug: 1, isDeleted: 1 });
productSchema.index({ category: 1, isActive: 1 });
productSchema.index({ subcategories: 1, isActive: 1 }); // ✅ filter by subcategory fast
productSchema.index({ basePrice: 1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ rating: -1 });

/**
 * ========= AUTO STOCK =========
 */
productSchema.pre("save", function (next) {
    this.inStock = this.stock > 0;

    // ✅ make sure subcategories are unique (no duplicates)
    if (Array.isArray(this.subcategories) && this.subcategories.length) {
        this.subcategories = [...new Set(this.subcategories.map((id) => id.toString()))].map(
            (id) => new mongoose.Types.ObjectId(id)
        );
    }

    next();
});

/**
 * ========= SOFT DELETE =========
 */
productSchema.methods.softDelete = async function () {
    this.isDeleted = true;
    this.isActive = false;
    return await this.save();
};

module.exports = mongoose.model("Product", productSchema);
