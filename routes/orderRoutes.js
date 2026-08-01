const express = require("express");

const router = express.Router();

const {
  createOrder,
  getMyOrders,
  getAllOrders,
  updateOrderStatus,
  deleteOrder
} = require("../controllers/orderController");

const { protect } = require("../middleware/authMiddleware");
const { adminOnly } = require("../middleware/adminMiddleware");

router.post("/", protect, createOrder);

router.get("/my-orders", protect, getMyOrders);

router.get("/", protect, adminOnly, getAllOrders);

router.put("/:id", protect, adminOnly, updateOrderStatus);

router.delete("/:id", protect, adminOnly, deleteOrder);



module.exports = router;