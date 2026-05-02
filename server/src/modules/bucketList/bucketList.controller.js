const bucketListService = require("./bucketList.service");
const { getPublicUploadPath } = require("../../utils/uploadPaths");
const { deleteUploadedFile } = require("../../utils/deleteUploadedFile");



async function getBucketListItems(req, res) {
  const items = await bucketListService.getBucketListItems(req.query);

  res.json({
    ok: true,
    data: items
  });
}

async function getBucketListItemById(req, res) {
  const item = await bucketListService.getBucketListItemById(req.params.id);

  if (!item) {
    res.status(404).json({
      ok: false,
      message: "Bucket list item not found"
    });
    return;
  }

  res.json({
    ok: true,
    data: item
  });
}

async function createBucketListItem(req, res) {
  const item = await bucketListService.createBucketListItem(req.body);

  res.status(201).json({
    ok: true,
    message: "Bucket list item created",
    data: item
  });
}

async function updateBucketListItem(req, res) {
  const existingItem = await bucketListService.getBucketListItemById(req.params.id);

  if (!existingItem) {
    res.status(404).json({
      ok: false,
      message: "Bucket list item not found"
    });
    return;
  }

  const item = await bucketListService.updateBucketListItem(
    req.params.id,
    req.body
  );

  const imageWasChanged =
    Object.prototype.hasOwnProperty.call(req.body, "image_path") &&
    existingItem.image_path &&
    existingItem.image_path !== item.image_path;

  if (imageWasChanged) {
    await deleteUploadedFile(existingItem.image_path);
  }

  res.json({
    ok: true,
    message: "Bucket list item updated",
    data: item
  });
}

async function deleteBucketListItem(req, res) {
  const existingItem = await bucketListService.getBucketListItemById(req.params.id);

  if (!existingItem) {
    res.status(404).json({
      ok: false,
      message: "Bucket list item not found"
    });
    return;
  }

  const deleted = await bucketListService.deleteBucketListItem(req.params.id);

  if (!deleted) {
    res.status(404).json({
      ok: false,
      message: "Bucket list item not found"
    });
    return;
  }

  if (existingItem.image_path) {
    await deleteUploadedFile(existingItem.image_path);
  }

  res.json({
    ok: true,
    message: "Bucket list item deleted"
  });
}

async function getBucketListStats(req, res) {
  const stats = await bucketListService.getBucketListStats();

  res.json({
    ok: true,
    data: stats
  });
}

async function uploadBucketListImage(req, res) {
  if (!req.file) {
    res.status(400).json({
      ok: false,
      message: "No image uploaded"
    });
    return;
  }

  const imagePath = getPublicUploadPath("bucket-list", req.file.filename);

  res.status(201).json({
    ok: true,
    message: "Bucket list image uploaded",
    data: {
      image_path: imagePath
    }
  });
}

module.exports = {
  getBucketListItems,
  getBucketListItemById,
  createBucketListItem,
  updateBucketListItem,
  deleteBucketListItem,
  getBucketListStats,
  uploadBucketListImage
};