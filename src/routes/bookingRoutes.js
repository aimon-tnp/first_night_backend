const express = require("express");
const router = express.Router();

const { createBookingHandler } = require("../controllers/bookingController");
const { protect } = require("../middleware/auth");
const { upload } = require("../utils/upload");

router.post("/", protect, upload.single("slip"), createBookingHandler);

module.exports = router;
