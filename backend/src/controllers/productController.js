
const Product = require("../models/Products");
const Category = require("../models/Category");

/**
 * Helpers
 */
const buildSort = (sort) => {
  switch (sort) {
    case "price_asc":
      return { basePrice: 1 };
    case "price_desc":
      return { basePrice: -1 };
    case "rating":
      return { rating: -1 };
    case "newest":
    default:
      return { createdAt: -1 };
  }
};

const normalizeImagesArray = (images) => {
  // ✅ strict checks instead of == null
  if (images === null || images === undefined) return undefined;

  if (Array.isArray(images)) {
    return images
      .filter(Boolean)
      .map((x) => String(x).trim())
      .filter(Boolean);
  }

  return [String(images).trim()].filter(Boolean);
};

const sanitizeOptionPricing = (optionPricing) => {
  // optional: ensure nested arrays exist and are arrays
  if (!optionPricing || typeof optionPricing !== "object") return undefined;

  const keys = ["sizes", "fabrics", "foams", "materials"];
  const out = {};
  for (const k of keys) {
    if (optionPricing[k] === null) continue;
    out[k] = Array.isArray(optionPricing[k]) ? optionPricing[k] : [];
  }
  return out;
};

/**
 * CREATE
 */
exports.createProduct = async (req, res, next) => {
  try {
    const payload = { ...req.body };

    const normalizedImages = normalizeImagesArray(payload.images);
    if (normalizedImages) payload.images = normalizedImages;

    // optional: normalize optionPricing
    if (payload.optionPricing) payload.optionPricing = sanitizeOptionPricing(payload.optionPricing);

    const product = await Product.create(payload);

    res.status(201).json({
      success: true,
      message: "Product created",
      data: product,
    });
  } catch (err) {
    // handle duplicate slug nicely
    if (err?.code === 11000 && err?.keyPattern?.slug) {
      return res.status(409).json({ success: false, message: "Slug already exists" });
    }
    next(err);
  }
};

/**
 * UPDATE
 */
exports.updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;

    const payload = { ...req.body };

    // ✅ images array from frontend
    const normalizedImages = normalizeImagesArray(payload.images);
    if (normalizedImages) payload.images = normalizedImages;

    if (payload.optionPricing) payload.optionPricing = sanitizeOptionPricing(payload.optionPricing);

    const updated = await Product.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { $set: payload },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    res.json({
      success: true,
      message: "Product updated",
      data: updated,
    });
  } catch (err) {
    if (err?.code === 11000 && err?.keyPattern?.slug) {
      return res.status(409).json({ success: false, message: "Slug already exists" });
    }
    next(err);
  }
};

/**
 * GET BY SLUG
 */
exports.getBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;

    const product = await Product.findOne({
      slug,
      isDeleted: false,
      isActive: true,
    })
      .populate("category", "name slug")
      .populate("subcategories", "name slug");

    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    res.json({ success: true, data: product });
  } catch (err) {
    next(err);
  }
};

/**
 * LIST (ALL PRODUCTS) WITH PAGINATION + FILTERS
 * Supports:
 *  - page, limit
 *  - category, subcategory (ObjectId)
 *  - minPrice, maxPrice
 *  - inStock, isActive
 *  - q (title search)
 *  - sort (newest, price_asc, price_desc, rating)
 */
exports.listProducts = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      category,
      subcategory,
      minPrice,
      maxPrice,
      inStock,
      isActive,
      q,
      sort = "newest",
    } = req.query;

    const filter = {
      isDeleted: false,
    };

    if (typeof isActive === "boolean") filter.isActive = isActive;
    else filter.isActive = true; // default only active

    if (category) filter.category = category;
    if (subcategory) filter.subcategories = subcategory;

    if (typeof inStock === "boolean") filter.inStock = inStock;

    if (minPrice !== undefined || maxPrice !== undefined) {
      filter.basePrice = {};
      if (minPrice !== null) filter.basePrice.$gte = Number(minPrice);
      if (maxPrice !== null) filter.basePrice.$lte = Number(maxPrice);
    }



    if (q) {
      filter.$or = [
        { title: { $regex: q, $options: "i" } },
        { description: { $regex: q, $options: "i" } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [items, total] = await Promise.all([
      Product.find(filter)
        .sort(buildSort(sort))
        .skip(skip)
        .limit(Number(limit))
        .populate("category", "_id name slug")
        .populate("subcategories", "_id name slug"),
      Product.countDocuments(filter),
    ]);

    res.json({
      success: true,
      meta: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
      data: items,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET BY CATEGORY SLUG (pagination)
 * /products/category/:categorySlug?page=1&limit=10&sort=newest
 */
exports.getByCategorySlug = async (req, res, next) => {
  try {
    const { categorySlug } = req.params;
    const { page = 1, limit = 10, sort = "newest" } = req.query;

    const category = await Category.findOne({ slug: categorySlug });
    if (!category) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }

    const filter = {
      isDeleted: false,
      isActive: true,
      category: category._id,
    };

    const skip = (Number(page) - 1) * Number(limit);

    const [items, total] = await Promise.all([
      Product.find(filter)
        .sort(buildSort(sort))
        .skip(skip)
        .limit(Number(limit))
        .populate("category", "name slug")
        .populate("subcategories", "name slug"),
      Product.countDocuments(filter),
    ]);

    res.json({
      success: true,
      meta: {
        category: { _id: category._id, slug: category.slug, name: category.name },
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
      data: items,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET BY CATEGORY SLUG + SUBCATEGORY SLUG (pagination)
 * /products/category/:categorySlug/subcategory/:subcategorySlug?page=1&limit=10
 */
exports.getByCategoryAndSubcategorySlug = async (req, res, next) => {
  try {
    const { categorySlug, subcategorySlug } = req.params;
    const { page = 1, limit = 10, sort = "newest" } = req.query;

    const [category, subcategory] = await Promise.all([
      Category.findOne({ slug: categorySlug }),
      Category.findOne({ slug: subcategorySlug }),
    ]);

    if (!category) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }
    if (!subcategory) {
      return res.status(404).json({ success: false, message: "Subcategory not found" });
    }

    const filter = {
      isDeleted: false,
      isActive: true,
      category: category._id,
      subcategories: subcategory._id, // matches if array contains it
    };

    const skip = (Number(page) - 1) * Number(limit);

    const [items, total] = await Promise.all([
      Product.find(filter)
        .sort(buildSort(sort))
        .skip(skip)
        .limit(Number(limit))
        .populate("category", "name slug")
        .populate("subcategories", "name slug"),
      Product.countDocuments(filter),
    ]);

    res.json({
      success: true,
      meta: {
        category: { _id: category._id, slug: category.slug, name: category.name },
        subcategory: { _id: subcategory._id, slug: subcategory.slug, name: subcategory.name },
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
      data: items,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * SOFT DELETE
 */
exports.softDeleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;

    const product = await Product.findOne({ _id: id, isDeleted: false });
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    await product.softDelete();

    res.json({ success: true, message: "Product deleted (soft)" });
  } catch (err) {
    next(err);
  }
};