const mongoose = require("mongoose");
const Product = require("../models/product.model");
const Review = require("../models/review.model");
const { invalidateNamespaces } = require("../services/cache.service");

const toObjectId = (id) => new mongoose.Types.ObjectId(id);

const serializeReview = (review) => ({
  _id: review._id,
  product: review.product,
  user: review.user,
  authorName: review.authorName,
  title: review.title,
  comment: review.comment,
  rating: review.rating,
  status: review.status,
  isVerifiedPurchase: review.isVerifiedPurchase,
  createdAt: review.createdAt,
  updatedAt: review.updatedAt,
});

const emptyBreakdown = () => ({
  5: 0,
  4: 0,
  3: 0,
  2: 0,
  1: 0,
});

const getReviewSummary = async (productId) => {
  const rows = await Review.aggregate([
    {
      $match: {
        product: toObjectId(productId),
        status: "published",
      },
    },
    {
      $group: {
        _id: "$rating",
        count: { $sum: 1 },
      },
    },
  ]);

  const breakdown = emptyBreakdown();
  let total = 0;
  let weightedTotal = 0;

  rows.forEach((row) => {
    const rating = Number(row._id);
    const count = Number(row.count);
    breakdown[rating] = count;
    total += count;
    weightedTotal += rating * count;
  });

  const average = total ? Number((weightedTotal / total).toFixed(1)) : 0;

  return { average, total, breakdown };
};

const syncProductReviewStats = async (productId) => {
  const summary = await getReviewSummary(productId);
  await Product.findByIdAndUpdate(productId, {
    $set: {
      rating: summary.average,
      reviewsCount: summary.total,
    },
  });
  return summary;
};

exports.listProductReviews = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { page = 1, limit = 10, sort = "newest" } = req.query;

    const product = await Product.findOne({
      _id: productId,
      isDeleted: false,
      isActive: true,
    }).select("_id rating reviewsCount");

    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    const numericPage = Number(page);
    const numericLimit = Number(limit);
    const skip = (numericPage - 1) * numericLimit;
    const sortMap = {
      newest: { createdAt: -1 },
      highest: { rating: -1, createdAt: -1 },
      lowest: { rating: 1, createdAt: -1 },
    };

    const filter = { product: productId, status: "published" };
    const [reviews, total, summary] = await Promise.all([
      Review.find(filter)
        .sort(sortMap[sort] || sortMap.newest)
        .skip(skip)
        .limit(numericLimit),
      Review.countDocuments(filter),
      getReviewSummary(productId),
    ]);

    res.json({
      success: true,
      meta: {
        page: numericPage,
        limit: numericLimit,
        total,
        totalPages: Math.ceil(total / numericLimit),
        summary,
      },
      data: reviews.map(serializeReview),
    });
  } catch (err) {
    next(err);
  }
};

exports.createProductReview = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const product = await Product.findOne({
      _id: productId,
      isDeleted: false,
      isActive: true,
    }).select("_id");

    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    const review = await Review.create({
      product: productId,
      user: req.userDoc._id,
      authorName: req.userDoc.fullName,
      authorEmail: req.userDoc.email,
      title: req.body.title || "",
      comment: req.body.comment,
      rating: req.body.rating,
      status: "published",
    });

    const summary = await syncProductReviewStats(productId);
    await invalidateNamespaces(["products", "reviews"]);

    res.status(201).json({
      success: true,
      message: "Review posted successfully",
      meta: { summary },
      data: serializeReview(review),
    });
  } catch (err) {
    next(err);
  }
};
