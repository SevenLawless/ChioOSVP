const express = require("express");
const homeController = require("./home.controller");
const asyncHandler = require("../../utils/asyncHandler");
const createUploadMiddleware = require("../../utils/createUploadMiddleware");
const validateRequest = require("../../utils/validateRequest");
const {
  idParamsSchema,
  homeItemCreateSchema,
  homeItemUpdateSchema
} = require("./home.validation");

const router = express.Router();

const uploadHomeImage = createUploadMiddleware("home");

router.get("/", asyncHandler(homeController.getHomeItems));

router.post(
  "/",
  validateRequest({ body: homeItemCreateSchema }),
  asyncHandler(homeController.createHomeItem)
);

router.patch(
  "/:id",
  validateRequest({
    params: idParamsSchema,
    body: homeItemUpdateSchema
  }),
  asyncHandler(homeController.updateHomeItem)
);

router.delete(
  "/:id",
  validateRequest({ params: idParamsSchema }),
  asyncHandler(homeController.deleteHomeItem)
);

router.post(
  "/upload",
  uploadHomeImage.single("image"),
  asyncHandler(homeController.uploadHomeImage)
);

module.exports = router;