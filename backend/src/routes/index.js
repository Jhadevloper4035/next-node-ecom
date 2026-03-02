
const router = require("express").Router();


const authRoutes = require("./auth.route");
const categoryRoutes = require("./category.route")
const productRoutes = require("./product.route")
const addressRoutes = require("./address.route")


router.use("/categories", categoryRoutes);
router.use("/product", productRoutes);
router.use("/addresses", addressRoutes);
router.use("/", authRoutes);


module.exports = router;