const express = require("express");
const jobsController = require("./jobs.controller");
const asyncHandler = require("../../utils/asyncHandler");
const validateRequest = require("../../utils/validateRequest");
const {
  idParamsSchema,
  jobsQuerySchema,
  jobsCreateSchema,
  jobsUpdateSchema
} = require("./jobs.validation");

const router = express.Router();

router.get(
  "/",
  validateRequest({ query: jobsQuerySchema }),
  asyncHandler(jobsController.getJobs)
);

router.get("/stats", asyncHandler(jobsController.getJobStats));

router.get(
  "/:id",
  validateRequest({ params: idParamsSchema }),
  asyncHandler(jobsController.getJobById)
);

router.post(
  "/",
  validateRequest({ body: jobsCreateSchema }),
  asyncHandler(jobsController.createJob)
);

router.patch(
  "/:id",
  validateRequest({
    params: idParamsSchema,
    body: jobsUpdateSchema
  }),
  asyncHandler(jobsController.updateJob)
);

router.delete(
  "/:id",
  validateRequest({ params: idParamsSchema }),
  asyncHandler(jobsController.deleteJob)
);

module.exports = router;