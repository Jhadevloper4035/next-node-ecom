
const router = require("express").Router();

const healthCtrl = require("../controllers/health.controller");


const authRoutes = require("./auth.route");
const categoryRoutes = require("./category.route")
const productRoutes = require("./product.route")
const addressRoutes = require("./address.route")
const userRoutes = require("./user.route");
const adminRoutes = require("./admin.route");


router.use("/categories", categoryRoutes);
router.use("/product", productRoutes);
router.use("/address", addressRoutes);


router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/admin", adminRoutes);

// Health
router.get("/health", healthCtrl.health);








module.exports = router;