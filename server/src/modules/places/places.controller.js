const placesService = require("./places.service");
const { getPublicUploadPath } = require("../../utils/uploadPaths");
const { deleteUploadedFile } = require("../../utils/deleteUploadedFile");



async function getPlaces(req, res) {
  const places = await placesService.getPlaces(req.query);

  res.json({
    ok: true,
    data: places
  });
}

async function getPlaceById(req, res) {
  const place = await placesService.getPlaceById(req.params.id);

  if (!place) {
    res.status(404).json({
      ok: false,
      message: "Place not found"
    });
    return;
  }

  res.json({
    ok: true,
    data: place
  });
}

async function createPlace(req, res) {
  const place = await placesService.createPlace(req.body);

  res.status(201).json({
    ok: true,
    message: "Place created",
    data: place
  });
}

async function updatePlace(req, res) {
  const existingPlace = await placesService.getPlaceById(req.params.id);

  if (!existingPlace) {
    res.status(404).json({
      ok: false,
      message: "Place not found"
    });
    return;
  }

  const place = await placesService.updatePlace(req.params.id, req.body);

  const imageWasChanged =
    Object.prototype.hasOwnProperty.call(req.body, "image_path") &&
    existingPlace.image_path &&
    existingPlace.image_path !== place.image_path;

  if (imageWasChanged) {
    await deleteUploadedFile(existingPlace.image_path);
  }

  res.json({
    ok: true,
    message: "Place updated",
    data: place
  });
}

async function deletePlace(req, res) {
  const existingPlace = await placesService.getPlaceById(req.params.id);

  if (!existingPlace) {
    res.status(404).json({
      ok: false,
      message: "Place not found"
    });
    return;
  }

  const deleted = await placesService.deletePlace(req.params.id);

  if (!deleted) {
    res.status(404).json({
      ok: false,
      message: "Place not found"
    });
    return;
  }

  if (existingPlace.image_path) {
    await deleteUploadedFile(existingPlace.image_path);
  }

  res.json({
    ok: true,
    message: "Place deleted"
  });
}

async function getPlaceStats(req, res) {
  const stats = await placesService.getPlaceStats();

  res.json({
    ok: true,
    data: stats
  });
}

async function uploadPlaceImage(req, res) {
  if (!req.file) {
    res.status(400).json({
      ok: false,
      message: "No image uploaded"
    });
    return;
  }

  const imagePath = getPublicUploadPath("places", req.file.filename);

  res.status(201).json({
    ok: true,
    message: "Place image uploaded",
    data: {
      image_path: imagePath
    }
  });
}

module.exports = {
  getPlaces,
  getPlaceById,
  createPlace,
  updatePlace,
  deletePlace,
  getPlaceStats,
  uploadPlaceImage
};