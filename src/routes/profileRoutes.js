const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/auth");
const {
  upload,
  uploadAvatarHandler,
  getMe,
  updateProfile,
  updatePreferences,
} = require("../controllers/profileController");

router.get("/me", protect, getMe);

// PATCH /api/profile/credentials
router.patch("/credentials", protect, updateProfile);

// PATCH /api/profile/preferences
router.patch("/preferences", protect, updatePreferences);

// POST /api/profile/avatar
router.post("/avatar", protect, upload.single("avatar"), uploadAvatarHandler);

module.exports = router;
