const express = require("express");
const placesController = require("./places.controller");
const asyncHandler = require("../../utils/asyncHandler");
const createUploadMiddleware = require("../../utils/createUploadMiddleware");
const validateRequest = require("../../utils/validateRequest");
const {
  idParamsSchema,
  placesQuerySchema,
  placesCreateSchema,
  placesUpdateSchema
} = require("./places.validation");

const router = express.Router();

const uploadPlaceImage = createUploadMiddleware("places");

router.get(
  "/",
  validateRequest({ query: placesQuerySchema }),
  asyncHandler(placesController.getPlaces)
);

router.get("/stats", asyncHandler(placesController.getPlaceStats));

router.post(
  "/upload",
  uploadPlaceImage.single("image"),
  asyncHandler(placesController.uploadPlaceImage)
);

router.get(
  "/:id",
  validateRequest({ params: idParamsSchema }),
  asyncHandler(placesController.getPlaceById)
);

router.post(
  "/",
  validateRequest({ body: placesCreateSchema }),
  asyncHandler(placesController.createPlace)
);

router.patch(
  "/:id",
  validateRequest({
    params: idParamsSchema,
    body: placesUpdateSchema
  }),
  asyncHandler(placesController.updatePlace)
);

router.delete(
  "/:id",
  validateRequest({ params: idParamsSchema }),
  asyncHandler(placesController.deletePlace)
);

module.exports = router;