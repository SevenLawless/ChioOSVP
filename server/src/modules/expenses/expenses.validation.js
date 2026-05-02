const { z } = require("zod");

const TRANSACTION_TYPES = ["income", "expense"];

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

const monthYearQuerySchema = z.object({
  month: z.coerce
    .number()
    .int("Month must be a whole number")
    .min(1, "Month must be between 1 and 12")
    .max(12, "Month must be between 1 and 12")
    .optional(),

  year: z.coerce
    .number()
    .int("Year must be a whole number")
    .min(2000, "Year is too old")
    .max(2100, "Year is too far in the future")
    .optional()
});

const categoryCreateSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Category name is required")
    .max(100, "Category name is too long"),

  type: z.enum(TRANSACTION_TYPES, {
    message: "Category type must be income or expense"
  }),

  color: z
    .string()
    .trim()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Color must be a valid hex color")
    .optional()
});

const transactionBaseSchema = z.object({
  type: z.enum(TRANSACTION_TYPES, {
    message: "Transaction type must be income or expense"
  }),

  title: z
    .string()
    .trim()
    .min(1, "Transaction title is required")
    .max(255, "Transaction title is too long"),

  amount: z.preprocess(
    emptyStringToUndefined,
    z.coerce
      .number({
        message: "Amount must be a number"
      })
      .positive("Amount must be more than 0")
      .max(999999999, "Amount is too large")
  ),

  category_id: z.preprocess(
    emptyStringToNull,
    z.coerce
      .number({
        message: "Category must be valid"
      })
      .int("Category must be valid")
      .positive("Category must be valid")
      .nullable()
      .optional()
  ),

  transaction_date: z
    .preprocess(
      emptyStringToUndefined,
      z.string().trim().min(1, "Transaction date is required")
    )
    .refine(isValidDateString, {
      message: "Transaction date must be valid"
    }),

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

const transactionCreateSchema = transactionBaseSchema;
const transactionUpdateSchema = transactionBaseSchema.partial();

const recurringBillBaseSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Bill title is required")
    .max(255, "Bill title is too long"),

  amount: z.preprocess(
    emptyStringToUndefined,
    z.coerce
      .number({
        message: "Bill amount must be a number"
      })
      .positive("Bill amount must be more than 0")
      .max(999999999, "Bill amount is too large")
  ),

  due_day: z.preprocess(
    emptyStringToUndefined,
    z.coerce
      .number({
        message: "Due day must be a number"
      })
      .int("Due day must be a whole number")
      .min(1, "Due day must be between 1 and 31")
      .max(31, "Due day must be between 1 and 31")
  ),

  category_id: z.preprocess(
    emptyStringToNull,
    z.coerce
      .number({
        message: "Category must be valid"
      })
      .int("Category must be valid")
      .positive("Category must be valid")
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
  ),

  is_active: z.boolean().optional()
});

const recurringBillCreateSchema = recurringBillBaseSchema;
const recurringBillUpdateSchema = recurringBillBaseSchema.partial();

const budgetBaseSchema = z.object({
  category_id: z.coerce
    .number({
      message: "Budget category is required"
    })
    .int("Budget category must be valid")
    .positive("Budget category must be valid"),

  month: z.coerce
    .number({
      message: "Budget month is required"
    })
    .int("Month must be a whole number")
    .min(1, "Month must be between 1 and 12")
    .max(12, "Month must be between 1 and 12"),

  year: z.coerce
    .number({
      message: "Budget year is required"
    })
    .int("Year must be a whole number")
    .min(2000, "Year is too old")
    .max(2100, "Year is too far in the future"),

  amount: z.preprocess(
    emptyStringToUndefined,
    z.coerce
      .number({
        message: "Budget amount must be a number"
      })
      .positive("Budget amount must be more than 0")
      .max(999999999, "Budget amount is too large")
  )
});

const budgetCreateSchema = budgetBaseSchema;
const budgetUpdateSchema = budgetBaseSchema.partial();

module.exports = {
  idParamsSchema,
  monthYearQuerySchema,
  categoryCreateSchema,
  transactionCreateSchema,
  transactionUpdateSchema,
  recurringBillCreateSchema,
  recurringBillUpdateSchema,
  budgetCreateSchema,
  budgetUpdateSchema
};