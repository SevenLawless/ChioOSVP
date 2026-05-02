const express = require("express");
const mediaController = require("./media.controller");
const asyncHandler = require("../../utils/asyncHandler");
const createUploadMiddleware = require("../../utils/createUploadMiddleware");
const validateRequest = require("../../utils/validateRequest");
const {
  idParamsSchema,
  mediaQuerySchema,
  mediaCreateSchema,
  mediaUpdateSchema
} = require("./media.validation");

const router = express.Router();

const uploadMediaImage = createUploadMiddleware("media");

router.get(
  "/",
  validateRequest({ query: mediaQuerySchema }),
  asyncHandler(mediaController.getMediaItems)
);

router.get("/stats", asyncHandler(mediaController.getMediaStats));

router.post(
  "/upload",
  uploadMediaImage.single("image"),
  asyncHandler(mediaController.uploadMediaImage)
);

router.get(
  "/:id",
  validateRequest({ params: idParamsSchema }),
  asyncHandler(mediaController.getMediaItemById)
);

router.post(
  "/",
  validateRequest({ body: mediaCreateSchema }),
  asyncHandler(mediaController.createMediaItem)
);

router.patch(
  "/:id",
  validateRequest({
    params: idParamsSchema,
    body: mediaUpdateSchema
  }),
  asyncHandler(mediaController.updateMediaItem)
);

router.delete(
  "/:id",
  validateRequest({ params: idParamsSchema }),
  asyncHandler(mediaController.deleteMediaItem)
);

module.exports = router;