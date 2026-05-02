const { z } = require("zod");

function emptyStringToNull(value) {
  if (value === "" || value === undefined || value === null) {
    return null;
  }

  return value;
}

function emptyStringToUndefined(value) {
  if (value === "" || value === undefined || value === null) {
    return undefined;
  }

  return value;
}

function isValidDateString(value) {
  if (value === null || value === undefined) return true;

  const date = new Date(value);
  return !Number.isNaN(date.getTime());
}

const idParamsSchema = z.object({
  id: z.coerce
    .number()
    .int("ID must be a whole number")
    .positive("ID must be positive")
});

const sessionIdParamsSchema = z.object({
  sessionId: z.coerce
    .number()
    .int("Session ID must be a whole number")
    .positive("Session ID must be positive")
});

const exerciseIdParamsSchema = z.object({
  exerciseId: z.coerce
    .number()
    .int("Exercise ID must be a whole number")
    .positive("Exercise ID must be positive")
});

const progressQuerySchema = z.object({
  exercise: z.string().trim().max(255, "Exercise search is too long").optional()
});

const sessionBaseSchema = z.object({
  session_date: z
    .preprocess(
      emptyStringToUndefined,
      z.string().trim().min(1, "Session date is required")
    )
    .refine(isValidDateString, {
      message: "Session date must be valid"
    }),

  title: z.preprocess(
    emptyStringToNull,
    z
      .string()
      .trim()
      .max(255, "Session title is too long")
      .nullable()
      .optional()
  ),

  notes: z.preprocess(
    emptyStringToNull,
    z
      .string()
      .trim()
      .max(5000, "Notes are too long")
      .nullable()
      .optional()
  )
});

const sessionCreateSchema = sessionBaseSchema;
const sessionUpdateSchema = sessionBaseSchema.partial();

const exerciseBaseSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Exercise name is required")
    .max(255, "Exercise name is too long"),

  muscle_group: z.preprocess(
    emptyStringToNull,
    z
      .string()
      .trim()
      .max(100, "Muscle group is too long")
      .nullable()
      .optional()
  ),

  notes: z.preprocess(
    emptyStringToNull,
    z
      .string()
      .trim()
      .max(5000, "Notes are too long")
      .nullable()
      .optional()
  )
});

const exerciseCreateSchema = exerciseBaseSchema;
const exerciseUpdateSchema = exerciseBaseSchema.partial();

const setBaseSchema = z.object({
    set_number: z
      .preprocess(
        emptyStringToUndefined,
        z.union([
          z.coerce
            .number({
              message: "Set number must be a number"
            })
            .int("Set number must be a whole number")
            .positive("Set number must be more than 0"),
          z.undefined()
        ])
      )
      .optional(),
  
    reps: z.preprocess(
      emptyStringToUndefined,
      z.coerce
        .number({
          message: "Reps must be a number"
        })
        .int("Reps must be a whole number")
        .positive("Reps must be more than 0")
        .max(10000, "Reps is too large")
    ),
  
    weight: z
      .preprocess(
        emptyStringToUndefined,
        z.union([
          z.coerce
            .number({
              message: "Weight must be a number"
            })
            .min(0, "Weight cannot be negative")
            .max(100000, "Weight is too large"),
          z.undefined()
        ])
      )
      .optional(),
  
    notes: z
      .preprocess(
        emptyStringToUndefined,
        z.union([
          z
            .string()
            .trim()
            .max(5000, "Notes are too long"),
          z.undefined()
        ])
      )
      .optional()
  });

const setCreateSchema = setBaseSchema;
const setUpdateSchema = setBaseSchema.partial();

module.exports = {
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
};
