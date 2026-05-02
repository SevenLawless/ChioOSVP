const express = require("express");
const multer = require("multer");
const settingsController = require("./settings.controller");
const asyncHandler = require("../../utils/asyncHandler");

const router = express.Router();

const uploadBackup = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 250 * 1024 * 1024
  }
});

router.get("/info", asyncHandler(settingsController.getSettingsInfo));

router.post(
  "/backups/export",
  asyncHandler(settingsController.exportBackup)
);

router.post(
  "/backups/restore",
  uploadBackup.single("backup"),
  asyncHandler(settingsController.restoreBackup)
);

module.exports = router;