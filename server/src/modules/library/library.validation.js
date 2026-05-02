const { z } = require("zod");

const LIBRARY_STATUSES = [
  "active",
  "expired",
  "pending",
  "archived",
  "needs_action"
];

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

const libraryQuerySchema = z.object({
  status: z.enum(["all", ...LIBRARY_STATUSES]).optional(),
  category: z.string().trim().max(100, "Category is too long").optional(),
  search: z.string().trim().max(255, "Search is too long").optional()
});

const libraryBaseSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Document title is required")
    .max(255, "Document title is too long"),

  category: z
    .string()
    .trim()
    .min(1, "Category is required")
    .max(100, "Category is too long"),

  status: z.enum(LIBRARY_STATUSES, {
    message: "Status is invalid"
  }),

  document_date: z
    .preprocess(emptyStringToNull, z.string().trim().nullable().optional())
    .refine(isValidDateString, {
      message: "Document date must be valid"
    }),

  expiry_date: z
    .preprocess(emptyStringToNull, z.string().trim().nullable().optional())
    .refine(isValidDateString, {
      message: "Expiry date must be valid"
    }),

  issuer: z.preprocess(
    emptyStringToNull,
    z.string().trim().max(255, "Issuer is too long").nullable().optional()
  ),

  reference_number: z.preprocess(
    emptyStringToNull,
    z
      .string()
      .trim()
      .max(255, "Reference number is too long")
      .nullable()
      .optional()
  ),

  file_path: z.preprocess(
    emptyStringToNull,
    z
      .string()
      .trim()
      .startsWith("/uploads/library/", "File path must be a Library upload")
      .max(500, "File path is too long")
      .nullable()
      .optional()
  ),

  original_file_name: z.preprocess(
    emptyStringToNull,
    z
      .string()
      .trim()
      .max(255, "Original file name is too long")
      .nullable()
      .optional()
  ),

  file_mime_type: z.preprocess(
    emptyStringToNull,
    z
      .string()
      .trim()
      .max(150, "File MIME type is too long")
      .nullable()
      .optional()
  ),

  file_size: z.preprocess(
    emptyStringToNull,
    z.coerce
      .number({
        message: "File size must be a number"
      })
      .int("File size must be a whole number")
      .min(0, "File size cannot be negative")
      .nullable()
      .optional()
  ),

  notes: z.preprocess(
    emptyStringToNull,
    z.string().trim().max(5000, "Notes are too long").nullable().optional()
  )
});

const libraryCreateSchema = libraryBaseSchema.extend({
  category: libraryBaseSchema.shape.category.default("Other"),
  status: libraryBaseSchema.shape.status.default("active")
});

const libraryUpdateSchema = libraryBaseSchema.partial();

module.exports = {
  idParamsSchema,
  libraryQuerySchema,
  libraryCreateSchema,
  libraryUpdateSchema
};