const homeService = require("./home.service");
const { homeItemCreateSchema } = require("./home.validation");
const { getPublicUploadPath } = require("../../utils/uploadPaths");
const { deleteUploadedFile } = require("../../utils/deleteUploadedFile");

async function getHomeItems(req, res) {
  const items = await homeService.getAllHomeItems();

  res.json({
    ok: true,
    data: items
  });
}

async function createHomeItem(req, res) {
  const item = await homeService.createHomeItem(req.body);

  res.status(201).json({
    ok: true,
    message: "Home item created",
    data: item
  });
}

async function updateHomeItem(req, res) {
  const existingItem = await homeService.getHomeItemById(req.params.id);

  if (!existingItem) {
    res.status(404).json({
      ok: false,
      message: "Home item not found"
    });
    return;
  }

  const updatedItem = await homeService.updateHomeItem(req.params.id, req.body);

  const filePathWasChanged =
    Object.prototype.hasOwnProperty.call(req.body, "file_path") &&
    existingItem.file_path &&
    existingItem.file_path !== updatedItem.file_path;

  if (filePathWasChanged) {
    await deleteUploadedFile(existingItem.file_path);
  }

  res.json({
    ok: true,
    message: "Home item updated",
    data: updatedItem
  });
}

async function deleteHomeItem(req, res) {
  const existingItem = await homeService.getHomeItemById(req.params.id);

  if (!existingItem) {
    res.status(404).json({
      ok: false,
      message: "Home item not found"
    });
    return;
  }

  const deleted = await homeService.deleteHomeItem(req.params.id);

  if (!deleted) {
    res.status(404).json({
      ok: false,
      message: "Home item not found"
    });
    return;
  }

  if (existingItem.file_path) {
    await deleteUploadedFile(existingItem.file_path);
  }

  res.json({
    ok: true,
    message: "Home item deleted"
  });
}

async function uploadHomeImage(req, res) {
  if (!req.file) {
    res.status(400).json({
      ok: false,
      message: "No image uploaded",
      errors: [
        {
          field: "image",
          message: "No image uploaded"
        }
      ]
    });
    return;
  }

  const filePath = getPublicUploadPath("home", req.file.filename);

  const uploadItem = homeItemCreateSchema.parse({
    type: "image",
    title: req.file.originalname,
    file_path: filePath,
    x_position: 120,
    y_position: 120,
    width: 280,
    height: 220,
    z_index: 1
  });

  const item = await homeService.createHomeItem(uploadItem);

  res.status(201).json({
    ok: true,
    message: "Image uploaded",
    data: item
  });
}

module.exports = {
  getHomeItems,
  createHomeItem,
  updateHomeItem,
  deleteHomeItem,
  uploadHomeImage
};
