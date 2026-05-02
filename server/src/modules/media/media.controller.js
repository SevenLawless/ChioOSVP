const mediaService = require("./media.service");
const { getPublicUploadPath } = require("../../utils/uploadPaths");
const { deleteUploadedFile } = require("../../utils/deleteUploadedFile");



async function getMediaItems(req, res) {
  const items = await mediaService.getMediaItems(req.query);

  res.json({
    ok: true,
    data: items
  });
}

async function getMediaItemById(req, res) {
  const item = await mediaService.getMediaItemById(req.params.id);

  if (!item) {
    res.status(404).json({
      ok: false,
      message: "Media item not found"
    });
    return;
  }

  res.json({
    ok: true,
    data: item
  });
}

async function createMediaItem(req, res) {
  const item = await mediaService.createMediaItem(req.body);

  res.status(201).json({
    ok: true,
    message: "Media item created",
    data: item
  });
}

async function updateMediaItem(req, res) {
  const existingItem = await mediaService.getMediaItemById(req.params.id);

  if (!existingItem) {
    res.status(404).json({
      ok: false,
      message: "Media item not found"
    });
    return;
  }

  const item = await mediaService.updateMediaItem(req.params.id, req.body);

  const imageWasChanged =
    Object.prototype.hasOwnProperty.call(req.body, "image_path") &&
    existingItem.image_path &&
    existingItem.image_path !== item.image_path;

  if (imageWasChanged) {
    await deleteUploadedFile(existingItem.image_path);
  }

  res.json({
    ok: true,
    message: "Media item updated",
    data: item
  });
}

async function deleteMediaItem(req, res) {
  const existingItem = await mediaService.getMediaItemById(req.params.id);

  if (!existingItem) {
    res.status(404).json({
      ok: false,
      message: "Media item not found"
    });
    return;
  }

  const deleted = await mediaService.deleteMediaItem(req.params.id);

  if (!deleted) {
    res.status(404).json({
      ok: false,
      message: "Media item not found"
    });
    return;
  }

  if (existingItem.image_path) {
    await deleteUploadedFile(existingItem.image_path);
  }

  res.json({
    ok: true,
    message: "Media item deleted"
  });
}

async function getMediaStats(req, res) {
  const stats = await mediaService.getMediaStats();

  res.json({
    ok: true,
    data: stats
  });
}

async function uploadMediaImage(req, res) {
  if (!req.file) {
    res.status(400).json({
      ok: false,
      message: "No image uploaded"
    });
    return;
  }

  const imagePath = getPublicUploadPath("media", req.file.filename);

  res.status(201).json({
    ok: true,
    message: "Media image uploaded",
    data: {
      image_path: imagePath
    }
  });
}

module.exports = {
  getMediaItems,
  getMediaItemById,
  createMediaItem,
  updateMediaItem,
  deleteMediaItem,
  getMediaStats,
  uploadMediaImage
};