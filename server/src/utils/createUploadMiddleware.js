const fs = require("fs");
const path = require("path");
const multer = require("multer");
const AppError = require("./appError");
const { getUploadFolder } = require("./uploadPaths");

function createUploadMiddleware(moduleName, options = {}) {
  const uploadFolder = getUploadFolder(moduleName);

  const {
    maxFileSizeMb = 5,
    allowedMimePrefixes = ["image/"],
    allowedMimeTypes = [],
    invalidFileMessage = "Only image uploads are allowed."
  } = options;

  fs.mkdirSync(uploadFolder, {
    recursive: true
  });

  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, uploadFolder);
    },
    filename: function (req, file, cb) {
      const safeOriginalName = file.originalname
        .replace(/\s+/g, "-")
        .replace(/[^a-zA-Z0-9._-]/g, "");

      const uniqueName = `${Date.now()}-${Math.round(
        Math.random() * 1e9
      )}-${safeOriginalName}`;

      cb(null, uniqueName);
    }
  });

  const fileFilter = function (req, file, cb) {
    const matchesPrefix = allowedMimePrefixes.some((prefix) =>
      file.mimetype.startsWith(prefix)
    );

    const matchesExactType = allowedMimeTypes.includes(file.mimetype);

    if (matchesPrefix || matchesExactType) {
      cb(null, true);
      return;
    }

    cb(new AppError(invalidFileMessage, 400, [
      {
        field: "file",
        message: invalidFileMessage
      }
    ]));
  };

  return multer({
    storage,
    fileFilter,
    limits: {
      fileSize: maxFileSizeMb * 1024 * 1024
    }
  });
}

module.exports = createUploadMiddleware;