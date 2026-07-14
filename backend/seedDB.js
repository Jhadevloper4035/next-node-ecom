/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");
const mongoose = require("mongoose");

const defaultEnvFile = process.env.NODE_ENV === "production" ? ".env" : ".env.development";
const envPath = process.env.SEED_ENV_FILE
  ? path.resolve(process.cwd(), process.env.SEED_ENV_FILE)
  : path.resolve(__dirname, "..", defaultEnvFile);

if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  dotenv.config();
}

const Category = require("./src/models/category.model");
const Product = require("./src/models/product.model");
const Review = require("./src/models/review.model");
const { closeRedis, initRedis } = require("./src/config/redis");
const { invalidateNamespaces } = require("./src/services/cache.service");

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
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("❌ MONGODB_URI missing in .env");
  await mongoose.connect(uri);
  console.log(`✅ MongoDB connected: ${mongoose.connection.host}/${mongoose.connection.name}`);
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
  const docs = [];

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
    docs.push(doc);
  }

  return docs;
}

const reviewTemplates = [
  {
    authorName: "Aarav Mehta",
    rating: 5,
    title: "Beautiful finish and very comfortable",
    comment:
      "The product looks exactly like the photos and feels sturdy in daily use. Delivery support was smooth and the finish works well with our room.",
  },
  {
    authorName: "Priya Sharma",
    rating: 4,
    title: "Good quality with neat detailing",
    comment:
      "The build quality feels premium and the fabric selection matched our interiors nicely. The team helped us choose the right option before ordering.",
  },
  {
    authorName: "Rohan Kapoor",
    rating: 5,
    title: "Worth it for the comfort",
    comment:
      "We wanted something that looked clean but still felt practical for everyday use. This has held up well and the customisation choices were useful.",
  },
];

async function getReviewSummary(productId) {
  const rows = await Review.aggregate([
    { $match: { product: productId, status: "published" } },
    { $group: { _id: "$rating", count: { $sum: 1 } } },
  ]);

  let total = 0;
  let weightedTotal = 0;

  rows.forEach((row) => {
    total += row.count;
    weightedTotal += row._id * row.count;
  });

  return {
    average: total ? Number((weightedTotal / total).toFixed(1)) : 0,
    total,
  };
}

async function seedReviewsForProducts(productDocs) {
  for (const product of productDocs) {
    const currentCount = await Review.countDocuments({
      product: product._id,
      status: "published",
    });

    if (currentCount < reviewTemplates.length) {
      for (let index = 0; index < reviewTemplates.length; index += 1) {
        const template = reviewTemplates[index];

        await Review.findOneAndUpdate(
          {
            product: product._id,
            authorEmail: `review-${product.slug}-${index + 1}@curvecomfort.local`,
          },
          {
            $set: {
              product: product._id,
              authorEmail: `review-${product.slug}-${index + 1}@curvecomfort.local`,
              authorName: template.authorName,
              rating: template.rating,
              title: template.title,
              comment: template.comment,
              status: "published",
              isVerifiedPurchase: true,
            },
          },
          { new: true, upsert: true, runValidators: true }
        );
      }
    }

    const summary = await getReviewSummary(product._id);
    await Product.findByIdAndUpdate(product._id, {
      $set: {
        rating: summary.average,
        reviewsCount: summary.total,
      },
    });

    console.log(`⭐ Reviews synced: ${product.title} -> ${summary.total}`);
  }
}

// ---------- run ----------
async function run() {
  await connectDB();
  await initRedis();

  try {
    const products = loadProductsJson();

    const { categoryByName, subByKey } =
      await seedCategoriesAndSubcategoriesStrict(products);

    const mappedProducts = mapProductsWithIds(products, categoryByName, subByKey);

    const productDocs = await seedProductsOneByOne(mappedProducts);
    await seedReviewsForProducts(productDocs);
    await invalidateNamespaces(["products", "reviews"]);

    console.log("✅ Seeding completed successfully");
  } catch (err) {
    console.error("❌ Seeding failed:", err);
    process.exitCode = 1;
  } finally {
    await closeRedis();
    await mongoose.connection.close();
  }
}

run();
