const { z } = require("zod");

const PLACE_STATUSES = ["want_to_visit", "visited", "favorite", "skipped"];

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

const idParamsSchema = z.object({
  id: z.coerce
    .number()
    .int("ID must be a whole number")
    .positive("ID must be positive")
});

const placesQuerySchema = z.object({
  status: z.enum(["all", ...PLACE_STATUSES]).optional(),
  category: z.string().trim().max(100, "Category is too long").optional(),
  search: z.string().trim().max(255, "Search is too long").optional()
});

const placesBaseSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Place name is required")
    .max(255, "Place name is too long"),

  category: z
    .string()
    .trim()
    .min(1, "Category is required")
    .max(100, "Category is too long"),

  status: z.enum(PLACE_STATUSES, {
    message: "Status is invalid"
  }),

  latitude: z.preprocess(
    emptyStringToUndefined,
    z.coerce
      .number({
        message: "Latitude is required and must be a number"
      })
      .min(-90, "Latitude must be at least -90")
      .max(90, "Latitude must be at most 90")
  ),

  longitude: z.preprocess(
    emptyStringToUndefined,
    z.coerce
      .number({
        message: "Longitude is required and must be a number"
      })
      .min(-180, "Longitude must be at least -180")
      .max(180, "Longitude must be at most 180")
  ),

  rating: z.preprocess(
    emptyStringToNull,
    z.coerce
      .number({
        message: "Rating must be a number"
      })
      .min(0, "Rating must be at least 0")
      .max(5, "Rating must be at most 5")
      .nullable()
      .optional()
  ),

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
      .startsWith("/uploads/places/", "Image path must be a ScannerRoom upload")
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

const placesCreateSchema = placesBaseSchema.extend({
  category: placesBaseSchema.shape.category.default("Other"),
  status: placesBaseSchema.shape.status.default("want_to_visit")
});

const placesUpdateSchema = placesBaseSchema.partial();

module.exports = {
  idParamsSchema,
  placesQuerySchema,
  placesCreateSchema,
  placesUpdateSchema
};