const fs = require("fs/promises");
const path = require("path");
const { uploadsRoot } = require("./uploadPaths");

function isLocalUploadPath(filePath) {
  return typeof filePath === "string" && filePath.startsWith("/uploads/");
}

function getDiskPathFromPublicPath(publicPath) {
  if (!isLocalUploadPath(publicPath)) {
    return null;
  }

  const relativePath = publicPath.replace(/^\/uploads\//, "");
  const diskPath = path.resolve(uploadsRoot, relativePath);
  const safeUploadsRoot = path.resolve(uploadsRoot);

  const isInsideUploads =
    diskPath === safeUploadsRoot || diskPath.startsWith(`${safeUploadsRoot}${path.sep}`);

  if (!isInsideUploads) {
    return null;
  }

  return diskPath;
}

async function deleteUploadedFile(publicPath) {
  const diskPath = getDiskPathFromPublicPath(publicPath);

  if (!diskPath) {
    return false;
  }

  try {
    await fs.unlink(diskPath);
    return true;
  } catch (err) {
    if (err.code !== "ENOENT") {
      console.warn(`Could not delete uploaded file: ${publicPath}`, err.message);
    }

    return false;
  }
}

module.exports = {
  deleteUploadedFile,
  isLocalUploadPath,
  getDiskPathFromPublicPath
};