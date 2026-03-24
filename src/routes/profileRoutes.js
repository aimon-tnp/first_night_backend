const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/auth");
const {
  uploadAvatar,
  getMe,
  updateProfile,
  updatePreferences,
  deleteProfile,
} = require("../controllers/profileController");

const { upload } = require("../utils/upload");

router.get("/me", protect, getMe);

router.patch("/credentials", protect, updateProfile);
router.patch("/preferences", protect, updatePreferences);

router.post("/avatar", protect, upload.single("avatar"), uploadAvatar);

router.delete("/", protect, deleteProfile);
router.delete("/:profileId", protect, deleteProfile);

module.exports = router;
