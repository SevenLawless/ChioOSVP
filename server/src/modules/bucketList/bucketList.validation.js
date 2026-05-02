const { z } = require("zod");

const BUCKET_STATUSES = ["idea", "planned", "in_progress", "done", "skipped"];
const BUCKET_PRIORITIES = ["low", "medium", "high", "dream"];

function emptyStringToNull(value) {
  if (value === "" || value === undefined || value === null) {
    return null;
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

const bucketListQuerySchema = z.object({
  status: z.enum(["all", ...BUCKET_STATUSES]).optional(),
  category: z.string().trim().max(100, "Category is too long").optional(),
  priority: z.enum(["all", ...BUCKET_PRIORITIES]).optional(),
  search: z.string().trim().max(255, "Search is too long").optional()
});

const bucketListBaseSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title is required")
    .max(255, "Title is too long"),

  category: z
    .string()
    .trim()
    .min(1, "Category is required")
    .max(100, "Category is too long"),

  status: z.enum(BUCKET_STATUSES, {
    message: "Status is invalid"
  }),

  priority: z.enum(BUCKET_PRIORITIES, {
    message: "Priority is invalid"
  }),

  target_date: z
    .preprocess(
      emptyStringToNull,
      z
        .string()
        .trim()
        .nullable()
        .optional()
    )
    .refine(isValidDateString, {
      message: "Target date must be valid"
    }),

  link: z.preprocess(
    emptyStringToNull,
    z
      .string()
      .trim()
      .url("Link must be a valid URL")
      .max(1000, "Link is too long")
      .nullable()
      .optional()
  ),

  image_path: z.preprocess(
    emptyStringToNull,
    z
      .string()
      .trim()
      .startsWith("/uploads/bucket-list/", "Image path must be a HerBucket upload")
      .max(500, "Image path is too long")
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

const bucketListCreateSchema = bucketListBaseSchema.extend({
  category: bucketListBaseSchema.shape.category.default("Other"),
  status: bucketListBaseSchema.shape.status.default("idea"),
  priority: bucketListBaseSchema.shape.priority.default("medium")
});

const bucketListUpdateSchema = bucketListBaseSchema.partial();

module.exports = {
  idParamsSchema,
  bucketListQuerySchema,
  bucketListCreateSchema,
  bucketListUpdateSchema
};