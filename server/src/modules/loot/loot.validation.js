const { z } = require("zod");

const LOOT_STATUSES = ["wanted", "saving", "bought", "skipped"];
const LOOT_PRIORITIES = ["low", "medium", "high", "dream"];

function emptyStringToNull(value) {
  if (value === "" || value === undefined || value === null) {
    return null;
  }

  return value;
}

const idParamsSchema = z.object({
  id: z.coerce.number().int("ID must be a whole number").positive("ID must be positive")
});

const lootQuerySchema = z.object({
  status: z.enum(["all", ...LOOT_STATUSES]).optional(),
  category: z.string().trim().max(100, "Category is too long").optional(),
  priority: z.enum(["all", ...LOOT_PRIORITIES]).optional(),
  search: z.string().trim().max(255, "Search is too long").optional()
});

const lootCreateSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Item name is required")
    .max(255, "Item name is too long"),

  category: z
    .string()
    .trim()
    .min(1, "Category is required")
    .max(100, "Category is too long")
    .default("Other"),

  price: z.preprocess(
    emptyStringToNull,
    z.coerce
      .number({
        message: "Price must be a number"
      })
      .min(0, "Price cannot be negative")
      .max(99999999, "Price is too large")
      .nullable()
      .optional()
  ),

  priority: z.enum(LOOT_PRIORITIES, {
    message: "Priority is invalid"
  }).default("medium"),

  status: z.enum(LOOT_STATUSES, {
    message: "Status is invalid"
  }).default("wanted"),

  store_link: z.preprocess(
    emptyStringToNull,
    z
      .string()
      .trim()
      .url("Store link must be a valid URL")
      .max(1000, "Store link is too long")
      .nullable()
      .optional()
  ),

  image_path: z.preprocess(
    emptyStringToNull,
    z
      .string()
      .trim()
      .startsWith("/uploads/loot/", "Image path must be a Loot upload")
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

const lootUpdateSchema = lootCreateSchema.partial();

module.exports = {
  idParamsSchema,
  lootQuerySchema,
  lootCreateSchema,
  lootUpdateSchema
};