const { z } = require("zod");

const HOME_ITEM_TYPES = ["note", "image"];

function emptyStringToNull(value) {
  if (value === "" || value === undefined || value === null) {
    return null;
  }

  return value;
}

function normalizeHomeType(value) {
  if (value === "text") return "note";
  return value;
}

const idParamsSchema = z.object({
  id: z.coerce
    .number({
      message: "ID must be a number"
    })
    .int("ID must be a whole number")
    .positive("ID must be positive")
});

function nullableTrimmedString(maxLength, maxMessage, extraValidation) {
  const stringSchema = extraValidation
    ? extraValidation(z.string().trim())
    : z.string().trim();

  return z.preprocess(
    emptyStringToNull,
    stringSchema.max(maxLength, maxMessage).nullable()
  ).optional();
}

const xPositionSchema = z.coerce
  .number({
    message: "X position must be a number"
  })
  .min(0, "X position cannot be negative")
  .max(10000, "X position is too large");

const yPositionSchema = z.coerce
  .number({
    message: "Y position must be a number"
  })
  .min(0, "Y position cannot be negative")
  .max(10000, "Y position is too large");

const widthSchema = z.coerce
  .number({
    message: "Width must be a number"
  })
  .min(40, "Width is too small")
  .max(3000, "Width is too large");

const heightSchema = z.coerce
  .number({
    message: "Height must be a number"
  })
  .min(40, "Height is too small")
  .max(3000, "Height is too large");

const zIndexSchema = z.coerce
  .number({
    message: "Layer order must be a number"
  })
  .int("Layer order must be a whole number")
  .min(0, "Layer order cannot be negative")
  .max(100000, "Layer order is too large");

const homeItemBaseSchema = z.object({
  type: z.preprocess(
    normalizeHomeType,
    z.enum(HOME_ITEM_TYPES, {
      message: "Home item type must be note or image"
    })
  ),

  title: nullableTrimmedString(255, "Title is too long"),

  content: nullableTrimmedString(10000, "Content is too long"),

  file_path: nullableTrimmedString(
    500,
    "File path is too long",
    (schema) => schema.startsWith("/uploads/home/", "File path must be a Home upload")
  ),

  x_position: xPositionSchema,

  y_position: yPositionSchema,

  width: widthSchema,

  height: heightSchema,

  z_index: zIndexSchema
});

function normalizeHomeItem(data) {
  return {
    ...data,
    type: normalizeHomeType(data.type)
  };
}

function noteHasText(data) {
  return Boolean(data.title || data.content);
}

function imageHasFilePath(data) {
  return Boolean(data.file_path);
}

const homeItemCreateSchema = homeItemBaseSchema
  .extend({
    x_position: xPositionSchema.default(100),
    y_position: yPositionSchema.default(100),
    width: widthSchema.default(240),
    height: heightSchema.default(160),
    z_index: zIndexSchema.default(1)
  })
  .refine(
    (data) => {
      if (data.type === "note") {
        return noteHasText(data);
      }

      return true;
    },
    {
      path: ["content"],
      message: "Note content is required"
    }
  )
  .refine(
    (data) => {
      if (data.type === "image") {
        return imageHasFilePath(data);
      }

      return true;
    },
    {
      path: ["file_path"],
      message: "Image file is required"
    }
  )
  .transform(normalizeHomeItem);

const homeItemUpdateSchema = homeItemBaseSchema
  .partial()
  .refine(
    (data) => {
      if (data.type === "note") {
        return noteHasText(data);
      }

      return true;
    },
    {
      path: ["content"],
      message: "Note content is required when changing an item to a note"
    }
  )
  .refine(
    (data) => {
      if (data.type === "image") {
        return imageHasFilePath(data);
      }

      return true;
    },
    {
      path: ["file_path"],
      message: "Image file is required when changing an item to an image"
    }
  )
  .transform(normalizeHomeItem);

module.exports = {
  idParamsSchema,
  homeItemCreateSchema,
  homeItemUpdateSchema
};
