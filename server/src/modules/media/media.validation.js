const { z } = require("zod");

const MEDIA_TYPES = ["anime", "movie", "show"];
const MEDIA_STATUSES = ["planned", "watching", "completed", "paused", "dropped"];

function emptyStringToNull(value) {
  if (value === "" || value === undefined || value === null) {
    return null;
  }

  return value;
}

function episodeProgressIsValid(data) {
  if (data.current_episode === undefined || data.total_episodes === undefined) {
    return true;
  }

  if (data.total_episodes === null || data.total_episodes === "") {
    return true;
  }

  return Number(data.current_episode || 0) <= Number(data.total_episodes);
}

const idParamsSchema = z.object({
  id: z.coerce
    .number()
    .int("ID must be a whole number")
    .positive("ID must be positive")
});

const mediaQuerySchema = z.object({
  type: z.enum(["all", ...MEDIA_TYPES]).optional(),
  status: z.enum(["all", ...MEDIA_STATUSES]).optional(),
  search: z.string().trim().max(255, "Search is too long").optional()
});

const mediaBaseSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title is required")
    .max(255, "Title is too long"),

  type: z.enum(MEDIA_TYPES),

  status: z.enum(MEDIA_STATUSES),

  current_episode: z.preprocess(
    emptyStringToNull,
    z.coerce
      .number("Current episode must be a number")
      .int("Current episode must be a whole number")
      .min(0, "Current episode cannot be negative")
      .max(100000, "Current episode is too large")
  ),

  total_episodes: z.preprocess(
    emptyStringToNull,
    z.coerce
      .number("Total episodes must be a number")
      .int("Total episodes must be a whole number")
      .min(1, "Total episodes must be at least 1")
      .max(100000, "Total episodes is too large")
      .nullable()
      .optional()
  ),

  rating: z.preprocess(
    emptyStringToNull,
    z.coerce
      .number("Rating must be a number")
      .min(0, "Rating must be at least 0")
      .max(10, "Rating must be at most 10")
      .nullable()
      .optional()
  ),

  image_path: z.preprocess(
    emptyStringToNull,
    z
      .string()
      .trim()
      .startsWith("/uploads/media/", "Image path must be a Media upload")
      .max(500, "Image path is too long")
      .nullable()
      .optional()
  ),

  watch_link: z.preprocess(
    emptyStringToNull,
    z
      .string()
      .trim()
      .url("Watch link must be a valid URL")
      .max(1000, "Watch link is too long")
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

const mediaCreateSchema = mediaBaseSchema
  .extend({
    type: mediaBaseSchema.shape.type.default("show"),
    status: mediaBaseSchema.shape.status.default("planned"),
    current_episode: mediaBaseSchema.shape.current_episode.default(0)
  })
  .refine(episodeProgressIsValid, {
    path: ["current_episode"],
    message: "Current episode cannot be higher than total episodes"
  });

const mediaUpdateSchema = mediaBaseSchema.partial().refine(episodeProgressIsValid, {
  path: ["current_episode"],
  message: "Current episode cannot be higher than total episodes"
});

module.exports = {
  idParamsSchema,
  mediaQuerySchema,
  mediaCreateSchema,
  mediaUpdateSchema
};