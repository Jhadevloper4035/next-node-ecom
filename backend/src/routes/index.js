
const router = require("express").Router();

const healthCtrl = require("../controllers/health.controller");
const auth = require("../middlewares/auth");
const requireRole = require("../middlewares/requireRole");


const authRoutes = require("./auth.route");
const categoryRoutes = require("./category.route")
const productRoutes = require("./product.route")
const addressRoutes = require("./address.route")
const userRoutes = require("./user.route");
const adminRoutes = require("./admin.route");
const contactRoutes = require("./contact.route");
const reviewRoutes = require("./review.route");
const blogRoutes = require("./blog.route");
const checkoutRoutes = require("./checkout.route");
const orderRoutes = require("./order.route");
const cartRoutes = require("./cart.route");
const wishlistRoutes = require("./wishlist.route");
const couponRoutes = require("./coupon.route");
const newsletterRoutes = require("./newsletter.route");
const seoRoutes = require("./seo.route");


router.use("/categories", categoryRoutes);
router.use("/product", productRoutes);
router.use("/address", addressRoutes);
router.use("/contact", contactRoutes);
router.use("/reviews", reviewRoutes);
router.use("/blogs", blogRoutes);
router.use("/checkout", checkoutRoutes);
router.use("/orders", orderRoutes);
router.use("/cart", cartRoutes);
router.use("/wishlist", wishlistRoutes);
router.use("/coupons", couponRoutes);
router.use("/newsletter", newsletterRoutes);
router.use("/seo", seoRoutes);


router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/admin", adminRoutes);

// Health
router.get("/health/internal", healthCtrl.health);
router.get("/health", auth, requireRole("admin"), healthCtrl.health);


module.exports = router;
