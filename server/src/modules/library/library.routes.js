const express = require("express");
const libraryController = require("./library.controller");
const asyncHandler = require("../../utils/asyncHandler");
const createUploadMiddleware = require("../../utils/createUploadMiddleware");
const validateRequest = require("../../utils/validateRequest");
const {
  idParamsSchema,
  libraryQuerySchema,
  libraryCreateSchema,
  libraryUpdateSchema
} = require("./library.validation");

const router = express.Router();

const uploadLibraryFile = createUploadMiddleware("library", {
  maxFileSizeMb: 15,
  allowedMimePrefixes: ["image/"],
  allowedMimeTypes: [
    "application/pdf",
    "text/plain",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  ],
  invalidFileMessage:
    "Only images, PDFs, Word, Excel, and text files are allowed."
});

router.get(
  "/",
  validateRequest({ query: libraryQuerySchema }),
  asyncHandler(libraryController.getLibraryDocuments)
);

router.get("/stats", asyncHandler(libraryController.getLibraryStats));

router.post(
  "/upload",
  uploadLibraryFile.single("file"),
  asyncHandler(libraryController.uploadLibraryFile)
);

router.get(
  "/:id",
  validateRequest({ params: idParamsSchema }),
  asyncHandler(libraryController.getLibraryDocumentById)
);

router.post(
  "/",
  validateRequest({ body: libraryCreateSchema }),
  asyncHandler(libraryController.createLibraryDocument)
);

router.patch(
  "/:id",
  validateRequest({
    params: idParamsSchema,
    body: libraryUpdateSchema
  }),
  asyncHandler(libraryController.updateLibraryDocument)
);

router.delete(
  "/:id",
  validateRequest({ params: idParamsSchema }),
  asyncHandler(libraryController.deleteLibraryDocument)
);

module.exports = router;