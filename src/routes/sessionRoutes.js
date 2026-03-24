const express = require("express");
const router = express.Router();

const {
  createSession,
  uploadSessionImage,
  updateSession,
  deleteSession,
  getSession,
  getAllSessions,
} = require("../controllers/sessionController");

const { protect, adminOnly } = require("../middleware/auth");
const { upload } = require("../utils/upload");
const bookingRoutes = require("./bookingRoutes");

router.post("/", protect, adminOnly, createSession);
router.post(
  "/:sessionId/images",
  protect,
  adminOnly,
  upload.array("image", 5),  // at most 5 images at once
  uploadSessionImage,
);
router.patch("/:sessionId", protect, adminOnly, updateSession);

router.delete("/:sessionId", protect, adminOnly, deleteSession);

router.get("/:sessionId", protect, getSession);
router.get("/", protect, getAllSessions);

// Nested: /api/sessions/:sessionId/bookings
router.use("/:sessionId/bookings", bookingRoutes);

module.exports = router;
