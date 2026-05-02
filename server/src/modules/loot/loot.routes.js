const express = require("express");
const lootController = require("./loot.controller");
const asyncHandler = require("../../utils/asyncHandler");
const createUploadMiddleware = require("../../utils/createUploadMiddleware");
const validateRequest = require("../../utils/validateRequest");
const {
  idParamsSchema,
  lootQuerySchema,
  lootCreateSchema,
  lootUpdateSchema
} = require("./loot.validation");

const router = express.Router();

const uploadLootImage = createUploadMiddleware("loot");

router.get(
  "/",
  validateRequest({ query: lootQuerySchema }),
  asyncHandler(lootController.getLootItems)
);

router.get("/stats", asyncHandler(lootController.getLootStats));

router.post(
  "/upload",
  uploadLootImage.single("image"),
  asyncHandler(lootController.uploadLootImage)
);

router.get(
  "/:id",
  validateRequest({ params: idParamsSchema }),
  asyncHandler(lootController.getLootItemById)
);

router.post(
  "/",
  validateRequest({ body: lootCreateSchema }),
  asyncHandler(lootController.createLootItem)
);

router.patch(
  "/:id",
  validateRequest({
    params: idParamsSchema,
    body: lootUpdateSchema
  }),
  asyncHandler(lootController.updateLootItem)
);

router.delete(
  "/:id",
  validateRequest({ params: idParamsSchema }),
  asyncHandler(lootController.deleteLootItem)
);

module.exports = router;