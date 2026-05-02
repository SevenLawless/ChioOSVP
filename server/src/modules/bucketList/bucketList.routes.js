const express = require("express");
const bucketListController = require("./bucketList.controller");
const asyncHandler = require("../../utils/asyncHandler");
const createUploadMiddleware = require("../../utils/createUploadMiddleware");
const validateRequest = require("../../utils/validateRequest");
const {
  idParamsSchema,
  bucketListQuerySchema,
  bucketListCreateSchema,
  bucketListUpdateSchema
} = require("./bucketList.validation");

const router = express.Router();

const uploadBucketListImage = createUploadMiddleware("bucket-list");

router.get(
  "/",
  validateRequest({ query: bucketListQuerySchema }),
  asyncHandler(bucketListController.getBucketListItems)
);

router.get("/stats", asyncHandler(bucketListController.getBucketListStats));

router.post(
  "/upload",
  uploadBucketListImage.single("image"),
  asyncHandler(bucketListController.uploadBucketListImage)
);

router.get(
  "/:id",
  validateRequest({ params: idParamsSchema }),
  asyncHandler(bucketListController.getBucketListItemById)
);

router.post(
  "/",
  validateRequest({ body: bucketListCreateSchema }),
  asyncHandler(bucketListController.createBucketListItem)
);

router.patch(
  "/:id",
  validateRequest({
    params: idParamsSchema,
    body: bucketListUpdateSchema
  }),
  asyncHandler(bucketListController.updateBucketListItem)
);

router.delete(
  "/:id",
  validateRequest({ params: idParamsSchema }),
  asyncHandler(bucketListController.deleteBucketListItem)
);

module.exports = router;