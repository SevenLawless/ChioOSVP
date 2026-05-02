const path = require("path");

const serverRoot = path.resolve(__dirname, "../..");

const uploadsRoot = path.resolve(
  serverRoot,
  process.env.UPLOADS_DIR || "../uploads"
);

function getUploadFolder(moduleName) {
  return path.join(uploadsRoot, moduleName);
}

function getPublicUploadPath(moduleName, filename) {
  return `/uploads/${moduleName}/${filename}`;
}

module.exports = {
  uploadsRoot,
  getUploadFolder,
  getPublicUploadPath
};