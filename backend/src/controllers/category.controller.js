const slugify = require("slugify");
const Category = require("../models/category.model");
const { sendSuccess, sendError, isDuplicateErr } = require("../helper/request");


const makeSlug = (name) => slugify(name, { lower: true, strict: true, trim: true });

// ---------- CATEGORY ----------

exports.createCategory = async (req, res) => {
  try {
    const { name, parent, ...rest } = req.body;

    const slug = makeSlug(name);

    const exists = await Category.findOne({ slug, isDeleted: false }).lean();
    if (exists) return sendError(res, "Category already exists", 409);

    // Business check: parent must exist if provided (not validation)
    if (parent && parent !== "null") {
      const parentDoc = await Category.findOne({ _id: parent, isDeleted: false }).lean();
      if (!parentDoc) return sendError(res, "Parent category not found", 404);
      if (parentDoc.level >= 3) return sendError(res, "Maximum nesting depth reached", 400);
    }

    const doc = await Category.create({
      name: name.trim(),
      slug,
      path: `/${slug}`,
      parent: parent && parent !== "null" && parent !== "" ? parent : null,
      ...rest,
    });

    return sendSuccess(
      res,
      doc,
      parent ? "Subcategory created successfully" : "Category created successfully",
      201
    );
  } catch (error) {
    if (isDuplicateErr(error)) return sendError(res, "Category already exists", 409);
    return sendError(res, error.message, 400);
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const update = { ...req.body };

    if (update.name) {
      const slug = makeSlug(update.name);

      const exists = await Category.findOne({
        slug,
        isDeleted: false,
        _id: { $ne: req.params.id },
      }).lean();

      if (exists) return sendError(res, "Category already exists", 409);

      update.slug = slug;
      update.name = update.name.trim();
    }

    const doc = await Category.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      update,
      { new: true, runValidators: true }
    );

    if (!doc) return sendError(res, "Category not found", 404);

    return sendSuccess(res, doc, "Category updated successfully");
  } catch (error) {
    if (isDuplicateErr(error)) return sendError(res, "Category already exists", 409);
    return sendError(res, error.message, 400);
  }
};

exports.getCategories = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page || "1", 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || "20", 10), 1), 100);
    const skip = (page - 1) * limit;

    const filter = { isDeleted: false };

    if (req.query.isActive !== undefined) filter.isActive = req.query.isActive === "true";

    if (req.query.parent !== undefined) {
      filter.parent = req.query.parent === "null" || req.query.parent === "" ? null : req.query.parent;
    }

    if (req.query.search) {
      const s = String(req.query.search).trim();
      filter.$or = [
        { name: { $regex: s, $options: "i" } },
        { slug: { $regex: s, $options: "i" } },
      ];
    }

    const sortBy = req.query.sortBy || "displayOrder";
    const sortOrder = (req.query.sortOrder || "asc").toLowerCase() === "desc" ? -1 : 1;

    const [items, total] = await Promise.all([
      Category.find(filter).sort({ [sortBy]: sortOrder, name: 1 }).skip(skip).limit(limit).lean(),
      Category.countDocuments(filter),
    ]);

    return sendSuccess(res, {
      items,
      meta: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return sendError(res, error.message, 400);
  }
};

exports.getCategoryById = async (req, res) => {
  try {
    const doc = await Category.findOne({ _id: req.params.id, isDeleted: false }).lean();
    if (!doc) return sendError(res, "Category not found", 404);
    return sendSuccess(res, doc);
  } catch (error) {
    return sendError(res, error.message, 400);
  }
};

exports.getCategoryBySlug = async (req, res) => {
  try {
    const doc = await Category.findOne({ slug: req.params.slug.toLowerCase(), isDeleted: false }).lean();
    if (!doc) return sendError(res, "Category not found", 404);
    return sendSuccess(res, doc);
  } catch (error) {
    return sendError(res, error.message, 400);
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const doc = await Category.findOne({ _id: req.params.id, isDeleted: false });
    if (!doc) return sendError(res, "Category not found", 404);

    doc.isDeleted = true;
    doc.deletedAt = new Date();
    doc.isActive = false;

    await doc.save();
    return sendSuccess(res, doc, "Category deleted successfully");
  } catch (error) {
    return sendError(res, error.message, 400);
  }
};

exports.restoreCategory = async (req, res) => {
  try {
    const doc = await Category.findOne({ _id: req.params.id, isDeleted: true });
    if (!doc) return sendError(res, "Deleted category not found", 404);

    doc.isDeleted = false;
    doc.deletedAt = null;
    doc.isActive = true;

    await doc.save();
    return sendSuccess(res, doc, "Category restored successfully");
  } catch (error) {
    return sendError(res, error.message, 400);
  }
};

exports.getCategoryTree = async (req, res) => {
  try {
    const categories = await Category.find({ isDeleted: false })
      .select("_id name slug parent  level")
      .sort({ displayOrder: 1, name: 1 })
      .lean();

    const map = new Map();
    const tree = [];

    categories.forEach((c) => map.set(String(c._id), { ...c, children: [] }));

    categories.forEach((c) => {
      const node = map.get(String(c._id));
      if (c.parent) {
        const parentNode = map.get(String(c.parent));
        if (parentNode) parentNode.children.push(node);
      } else {
        tree.push(node);
      }
    });

    return sendSuccess(res, tree);
  } catch (error) {
    return sendError(res, error.message, 400);
  }
};

exports.getCategoryStats = async (req, res) => {
  try {
    const [total, active, deleted] = await Promise.all([
      Category.countDocuments({}),
      Category.countDocuments({ isActive: true, isDeleted: false }),
      Category.countDocuments({ isDeleted: true }),
    ]);

    return sendSuccess(res, { total, active, deleted });
  } catch (error) {
    return sendError(res, error.message, 400);
  }
};

exports.bulkUpdateCategories = async (req, res) => {
  try {
    const { ids, ...updateData } = req.body;

    delete updateData.slug; // prevent bulk slug edits

    const result = await Category.updateMany(
      { _id: { $in: ids }, isDeleted: false },
      { $set: updateData }
    );

    return sendSuccess(res, result, `${result.modifiedCount} categories updated`);
  } catch (error) {
    return sendError(res, error.message, 400);
  }
};

exports.bulkDeleteCategories = async (req, res) => {
  try {
    const { ids } = req.body;

    const result = await Category.updateMany(
      { _id: { $in: ids }, isDeleted: false },
      { $set: { isDeleted: true, deletedAt: new Date(), isActive: false } }
    );

    return sendSuccess(res, result, `${result.modifiedCount} categories deleted`);
  } catch (error) {
    return sendError(res, error.message, 400);
  }
};

// ---------- SUBCATEGORY ----------

exports.createSubcategory = async (req, res) => {
  try {
    const parentId = req.params.parentId;
    const { name, ...rest } = req.body;

    const parentDoc = await Category.findOne({ _id: parentId, isDeleted: false }).lean();
    if (!parentDoc) return sendError(res, "Parent category not found", 404);
    if (parentDoc.level >= 3) return sendError(res, "Maximum nesting depth reached", 400);

    const slug = makeSlug(name);

    const exists = await Category.findOne({ slug, isDeleted: false }).lean();
    if (exists) return sendError(res, "Category already exists", 409);

    const doc = await Category.create({
      name: name.trim(),
      slug,
      parent: parentId,
      level: 1,
      ...rest,
    });



    return sendSuccess(res, doc, "Subcategory created successfully", 201);
  } catch (error) {
    if (isDuplicateErr(error)) return sendError(res, "Category already exists", 409);
    return sendError(res, error.message, 400);
  }
};

exports.getSubcategories = async (req, res) => {
  try {
    const { parentId } = req.params;

    const page = Math.max(parseInt(req.query.page || "1", 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || "50", 10), 1), 100);
    const skip = (page - 1) * limit;

    const filter = { isDeleted: false, parent: parentId };

    const [items, total] = await Promise.all([
      Category.find(filter).sort({ displayOrder: 1, name: 1 }).skip(skip).limit(limit).lean(),
      Category.countDocuments(filter),
    ]);

    return sendSuccess(res, {
      items,
      meta: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return sendError(res, error.message, 400);
  }
};

exports.moveSubcategory = async (req, res) => {
  try {
    const { subcategoryId } = req.params;
    const { newParentId } = req.body;

    const sub = await Category.findOne({ _id: subcategoryId, isDeleted: false });
    if (!sub) return sendError(res, "Subcategory not found", 404);

    const newParent = await Category.findOne({ _id: newParentId, isDeleted: false }).lean();
    if (!newParent) return sendError(res, "New parent not found", 404);

    if (newParent.level >= 3) return sendError(res, "Maximum nesting depth reached", 400);

    // cycle prevention (using your model method)
    const descendants = await sub.getDescendants();
    if (descendants.some((d) => String(d._id) === String(newParentId))) {
      return sendError(res, "Cannot move category under its own descendant", 400);
    }

    sub.parent = newParentId;
    await sub.save();

    return sendSuccess(res, sub, "Subcategory moved successfully");
  } catch (error) {
    return sendError(res, error.message, 400);
  }
};

exports.reorderSubcategories = async (req, res) => {
  try {
    const { parentId } = req.params;
    const { orderData } = req.body;

    const ops = orderData.map((x) => ({
      updateOne: {
        filter: { _id: x.id, parent: parentId, isDeleted: false },
        update: { $set: { displayOrder: Number(x.displayOrder) || 0 } },
      },
    }));

    const result = await Category.bulkWrite(ops);
    return sendSuccess(res, result, "Subcategories reordered successfully");
  } catch (error) {
    return sendError(res, error.message, 400);
  }
};

