const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/auth");
const {
  uploadAvatarHandler,
  getMe,
  updateProfile,
  updatePreferences,
  deleteProfileHandler,
} = require("../controllers/profileController");

const { upload } = require("../utils/upload");

router.get("/me", protect, getMe);

router.patch("/credentials", protect, updateProfile);
router.patch("/preferences", protect, updatePreferences);

router.post("/avatar", protect, upload.single("avatar"), uploadAvatarHandler);

router.delete("/", protect, deleteProfileHandler);
router.delete("/:profileId", protect, deleteProfileHandler);

module.exports = router;
