const { ZodError } = require("zod");

function formatZodErrors(error) {
  return error.issues.map((issue) => ({
    field: issue.path.join(".") || "request",
    message: issue.message
  }));
}

function errorHandler(err, req, res, next) {
  console.error(err);

  if (err instanceof ZodError) {
    return res.status(400).json({
      ok: false,
      message: "Validation failed",
      errors: formatZodErrors(err)
    });
  }

  if (err.name === "MulterError") {
    const message =
      err.code === "LIMIT_FILE_SIZE"
        ? "Uploaded file is too large. Maximum size is 5MB."
        : "File upload failed.";

    return res.status(400).json({
      ok: false,
      message,
      errors: [
        {
          field: "image",
          message
        }
      ]
    });
  }

  if (err.message === "Only image uploads are allowed") {
    return res.status(400).json({
      ok: false,
      message: "Only image uploads are allowed.",
      errors: [
        {
          field: "image",
          message: "Only image uploads are allowed."
        }
      ]
    });
  }

  if (err.isOperational) {
    return res.status(err.statusCode || 400).json({
      ok: false,
      message: err.message,
      errors: err.errors || []
    });
  }

  return res.status(500).json({
    ok: false,
    message: "Something went wrong on the server."
  });
}

module.exports = errorHandler;