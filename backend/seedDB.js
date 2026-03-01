/* eslint-disable no-console */
require("dotenv").config();
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");

const Category = require("./src/models/Category");
const Product = require("./src/models/Products");



// ---------- helpers ----------
const uniq = (arr) => [...new Set(arr)];

function loadProductsJson() {
  const filePath = path.join(__dirname, "./data/products.transformed.json");
  if (!fs.existsSync(filePath)) {
    throw new Error(`❌ products.json not found at: ${filePath}`);
  }
  const raw = fs.readFileSync(filePath, "utf-8");
  const parsed = JSON.parse(raw);

  if (!parsed?.products || !Array.isArray(parsed.products)) {
    throw new Error("❌ Invalid products.json: expected { products: [] }");
  }
  return parsed.products;
}

function slugify(str) {
  return String(str)
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

async function connectDB() {
  const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/node_auth_mvc";
  if (!uri) throw new Error("❌ MONGODB_URI missing in .env");
  await mongoose.connect(uri);
  console.log("✅ MongoDB connected");
}

/**
 * Create/reuse a Category record for (name + parent).
 * NOTE: slug is globally unique, so we ensure unique slug with suffix.
 */
async function getOrCreateCategory({ name, parentId = null }) {
  const existing = await Category.findOne({
    name,
    parent: parentId,
    isDeleted: false,
  }).select("_id name slug path level parent");

  if (existing) return existing;

  const baseSlug = slugify(name) || `cat-${Date.now()}`;
  let finalSlug = baseSlug;
  let i = 1;

  // slug must be globally unique
  while (await Category.exists({ slug: finalSlug, isDeleted: false })) {
    i += 1;
    finalSlug = `${baseSlug}-${i}`;
  }

  let level = 0;
  let parentPath = "";
  if (parentId) {
    const parentDoc = await Category.findById(parentId).select("level path");
    if (!parentDoc) throw new Error(`❌ Parent category not found: ${parentId}`);
    level = Math.min((parentDoc.level ?? 0) + 1, 3);
    parentPath = parentDoc.path || "";
  }

  const doc = await Category.create({
    name,
    slug: finalSlug,
    parent: parentId,
    level,
    path: parentPath ? `${parentPath}/${finalSlug}` : finalSlug,
    isActive: true,
    isDeleted: false,
  });

  console.log(
    `📁 Created category: "${name}" slug="${doc.slug}" parent=${parentId ?? "null"} -> ${doc._id}`
  );

  return doc;
}

/**
 * STRICT RULE:
 * - Root categories come from product.category
 * - Subcategories come from product.subcategories BUT ONLY created under that product's category as parent
 * - We uniquely identify subcategory by: `${parentCategoryId}:${subName}`
 */
async function seedCategoriesAndSubcategoriesStrict(products) {
  const categoryByName = new Map(); // "Sofas" -> ObjectId
  const subByKey = new Map(); // `${catId}:${subName}` -> ObjectId

  // 1) Create all root categories (parent = null)
  const rootCategoryNames = uniq(products.map((p) => p.category).filter(Boolean));
  for (const catName of rootCategoryNames) {
    const catDoc = await getOrCreateCategory({ name: catName, parentId: null });
    categoryByName.set(catName, catDoc._id);
  }

  // 2) Create subcategories STRICTLY under product.category
  for (const p of products) {
    if (!p.category) throw new Error(`❌ Product missing category: ${p.slug}`);

    const catId = categoryByName.get(p.category);
    if (!catId) throw new Error(`❌ Category not found for product ${p.slug}: ${p.category}`);

    const subs = Array.isArray(p.subcategories) ? p.subcategories : [];
    for (const subName of subs) {
      const key = `${String(catId)}:${subName}`;
      if (subByKey.has(key)) continue;

      // ✅ strict: parent = product.categoryId
      const subDoc = await getOrCreateCategory({ name: subName, parentId: catId });
      subByKey.set(key, subDoc._id);
    }
  }

  return { categoryByName, subByKey };
}

function mapProductsWithIds(products, categoryByName, subByKey) {
  return products.map((p) => {
    const catId = categoryByName.get(p.category);
    if (!catId) throw new Error(`❌ Category missing for product: ${p.slug}`);

    const subIds = (Array.isArray(p.subcategories) ? p.subcategories : [])
      .map((subName) => subByKey.get(`${String(catId)}:${subName}`))
      .filter(Boolean);

    return {
      ...p,
      category: catId,        // ✅ single ObjectId
      subcategories: subIds,  // ✅ multiple ObjectId[]
    };
  });
}

async function seedProductsOneByOne(mappedProducts) {
  for (const p of mappedProducts) {
    // Optional strict validation: ensure category is ObjectId and subcategories are array
    if (!mongoose.Types.ObjectId.isValid(p.category)) {
      throw new Error(`❌ Invalid category ObjectId for product: ${p.slug}`);
    }

    const doc = await Product.findOneAndUpdate(
      { slug: p.slug },
      { $set: p },
      { new: true, upsert: true }
    );

    console.log(`🛋️ Product upserted: ${doc.title} -> ${doc._id}`);
  }
}

// ---------- run ----------
async function run() {
  await connectDB();

  try {
    const products = loadProductsJson();

    const { categoryByName, subByKey } =
      await seedCategoriesAndSubcategoriesStrict(products);

    const mappedProducts = mapProductsWithIds(products, categoryByName, subByKey);

    await seedProductsOneByOne(mappedProducts);

    console.log("✅ Seeding completed successfully");
  } catch (err) {
    console.error("❌ Seeding failed:", err);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
}

run();