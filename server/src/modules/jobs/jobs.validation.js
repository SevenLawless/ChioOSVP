const { z } = require("zod");

const JOB_STATUSES = [
  "wishlist",
  "applied",
  "interview",
  "offer",
  "rejected",
  "ghosted"
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

const jobsQuerySchema = z.object({
  status: z.enum(["all", ...JOB_STATUSES]).optional(),
  search: z.string().trim().max(255, "Search is too long").optional()
});

const jobsBaseSchema = z.object({
  company: z
    .string()
    .trim()
    .min(1, "Company is required")
    .max(255, "Company is too long"),

  role: z
    .string()
    .trim()
    .min(1, "Role is required")
    .max(255, "Role is too long"),

  salary: z.preprocess(
    emptyStringToNull,
    z
      .string()
      .trim()
      .max(255, "Salary is too long")
      .nullable()
      .optional()
  ),

  date_applied: z
    .preprocess(
      emptyStringToNull,
      z.string().trim().nullable().optional()
    )
    .refine(isValidDateString, {
      message: "Date applied must be valid"
    }),

  status: z.enum(JOB_STATUSES, {
    message: "Status is invalid"
  }),

  job_link: z.preprocess(
    emptyStringToNull,
    z
      .string()
      .trim()
      .url("Job link must be a valid URL")
      .max(1000, "Job link is too long")
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

  interview_date: z
    .preprocess(
      emptyStringToNull,
      z.string().trim().nullable().optional()
    )
    .refine(isValidDateString, {
      message: "Interview date must be valid"
    }),

  follow_up_date: z
    .preprocess(
      emptyStringToNull,
      z.string().trim().nullable().optional()
    )
    .refine(isValidDateString, {
      message: "Follow-up date must be valid"
    })
});

const jobsCreateSchema = jobsBaseSchema.extend({
  status: jobsBaseSchema.shape.status.default("applied")
});

const jobsUpdateSchema = jobsBaseSchema.partial();

module.exports = {
  idParamsSchema,
  jobsQuerySchema,
  jobsCreateSchema,
  jobsUpdateSchema
};