const express = require("express");
const { getProducts } = require("../controllers/AdminControllers/productscontroller");
const { getSubcategoriesByCategoryId } = require("../controllers/AdminControllers/admin");
const router = express.Router();

// GET subcategories under a specific category
router.get("/categories/:id/subcategories", getSubcategoriesByCategoryId);

router.get("/:id", getProducts);

module.exports = router;
