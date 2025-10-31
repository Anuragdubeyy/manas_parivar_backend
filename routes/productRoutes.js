const express = require("express");
const { protect, admin } = require("../middelware/auth");
const {
  addProduct,
  getProducts,
  addProductCount,
  getProductCounts,
  getMyCounts,
  getAllUsersWithCounts,
  getDailyProductCounts,
} = require("../controller/ProductCountController");

const router = express.Router();

// Admin routes
router.post("/add", protect, admin, addProduct);
router.get("/all", protect, getProducts);
router.get("/:productId/counts", protect, admin, getProductCounts);
router.get("/admin/users-with-counts", protect, getAllUsersWithCounts);


// User routes
router.post("/count", protect, addProductCount);
router.get("/daily",protect, getDailyProductCounts);
router.get("/my-counts", protect, getMyCounts);


module.exports = router;
