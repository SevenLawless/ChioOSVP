const lootService = require("./loot.service");
const { getPublicUploadPath } = require("../../utils/uploadPaths");
const { deleteUploadedFile } = require("../../utils/deleteUploadedFile");


async function getLootItems(req, res) {
  const items = await lootService.getLootItems(req.query);

  res.json({
    ok: true,
    data: items
  });
}

async function getLootItemById(req, res) {
  const item = await lootService.getLootItemById(req.params.id);

  if (!item) {
    res.status(404).json({
      ok: false,
      message: "Loot item not found"
    });
    return;
  }

  res.json({
    ok: true,
    data: item
  });
}

async function createLootItem(req, res) {
  const item = await lootService.createLootItem(req.body);

  res.status(201).json({
    ok: true,
    message: "Loot item created",
    data: item
  });
}

async function updateLootItem(req, res) {
  const existingItem = await lootService.getLootItemById(req.params.id);

  if (!existingItem) {
    res.status(404).json({
      ok: false,
      message: "Loot item not found"
    });
    return;
  }

  const item = await lootService.updateLootItem(req.params.id, req.body);

  const imageWasChanged =
    Object.prototype.hasOwnProperty.call(req.body, "image_path") &&
    existingItem.image_path &&
    existingItem.image_path !== item.image_path;

  if (imageWasChanged) {
    await deleteUploadedFile(existingItem.image_path);
  }

  res.json({
    ok: true,
    message: "Loot item updated",
    data: item
  });
}

async function deleteLootItem(req, res) {
  const existingItem = await lootService.getLootItemById(req.params.id);

  if (!existingItem) {
    res.status(404).json({
      ok: false,
      message: "Loot item not found"
    });
    return;
  }

  const deleted = await lootService.deleteLootItem(req.params.id);

  if (!deleted) {
    res.status(404).json({
      ok: false,
      message: "Loot item not found"
    });
    return;
  }

  if (existingItem.image_path) {
    await deleteUploadedFile(existingItem.image_path);
  }

  res.json({
    ok: true,
    message: "Loot item deleted"
  });
}

async function getLootStats(req, res) {
  const stats = await lootService.getLootStats();

  res.json({
    ok: true,
    data: stats
  });
}

async function uploadLootImage(req, res) {
  if (!req.file) {
    res.status(400).json({
      ok: false,
      message: "No image uploaded"
    });
    return;
  }

  const imagePath = getPublicUploadPath("loot", req.file.filename);

  res.status(201).json({
    ok: true,
    message: "Loot image uploaded",
    data: {
      image_path: imagePath
    }
  });
}

module.exports = {
  getLootItems,
  getLootItemById,
  createLootItem,
  updateLootItem,
  deleteLootItem,
  getLootStats,
  uploadLootImage
};