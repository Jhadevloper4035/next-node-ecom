
const router = require("express").Router();

const healthCtrl = require("../controllers/health.controller");


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
const couponRoutes = require("./coupon.route");


router.use("/categories", categoryRoutes);
router.use("/product", productRoutes);
router.use("/address", addressRoutes);
router.use("/contact", contactRoutes);
router.use("/reviews", reviewRoutes);
router.use("/blogs", blogRoutes);
router.use("/checkout", checkoutRoutes);
router.use("/orders", orderRoutes);
router.use("/cart", cartRoutes);
router.use("/coupons", couponRoutes);


router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/admin", adminRoutes);

// Health
router.get("/health", healthCtrl.health);


module.exports = router;
