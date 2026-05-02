const express = require("express");
const gymController = require("./gym.controller");
const asyncHandler = require("../../utils/asyncHandler");
const validateRequest = require("../../utils/validateRequest");
const {
  idParamsSchema,
  sessionIdParamsSchema,
  exerciseIdParamsSchema,
  progressQuerySchema,
  sessionCreateSchema,
  sessionUpdateSchema,
  exerciseCreateSchema,
  exerciseUpdateSchema,
  setCreateSchema,
  setUpdateSchema
} = require("./gym.validation");

const router = express.Router();

router.get("/sessions", asyncHandler(gymController.getSessions));

router.get(
  "/sessions/:id",
  validateRequest({ params: idParamsSchema }),
  asyncHandler(gymController.getSessionById)
);

router.post(
  "/sessions",
  validateRequest({ body: sessionCreateSchema }),
  asyncHandler(gymController.createSession)
);

router.patch(
  "/sessions/:id",
  validateRequest({
    params: idParamsSchema,
    body: sessionUpdateSchema
  }),
  asyncHandler(gymController.updateSession)
);

router.delete(
  "/sessions/:id",
  validateRequest({ params: idParamsSchema }),
  asyncHandler(gymController.deleteSession)
);

router.post(
  "/sessions/:sessionId/exercises",
  validateRequest({
    params: sessionIdParamsSchema,
    body: exerciseCreateSchema
  }),
  asyncHandler(gymController.addExercise)
);

router.patch(
  "/exercises/:id",
  validateRequest({
    params: idParamsSchema,
    body: exerciseUpdateSchema
  }),
  asyncHandler(gymController.updateExercise)
);

router.delete(
  "/exercises/:id",
  validateRequest({ params: idParamsSchema }),
  asyncHandler(gymController.deleteExercise)
);

router.post(
  "/exercises/:exerciseId/sets",
  validateRequest({
    params: exerciseIdParamsSchema,
    body: setCreateSchema
  }),
  asyncHandler(gymController.addSet)
);

router.patch(
  "/sets/:id",
  validateRequest({
    params: idParamsSchema,
    body: setUpdateSchema
  }),
  asyncHandler(gymController.updateSet)
);

router.delete(
  "/sets/:id",
  validateRequest({ params: idParamsSchema }),
  asyncHandler(gymController.deleteSet)
);

router.get(
  "/progress",
  validateRequest({ query: progressQuerySchema }),
  asyncHandler(gymController.getProgress)
);

module.exports = router;