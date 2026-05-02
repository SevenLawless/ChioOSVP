const libraryService = require("./library.service");
const { getPublicUploadPath } = require("../../utils/uploadPaths");
const { deleteUploadedFile } = require("../../utils/deleteUploadedFile");

async function getLibraryDocuments(req, res) {
  const documents = await libraryService.getLibraryDocuments(req.query);

  res.json({
    ok: true,
    data: documents
  });
}

async function getLibraryDocumentById(req, res) {
  const document = await libraryService.getLibraryDocumentById(req.params.id);

  if (!document) {
    res.status(404).json({
      ok: false,
      message: "Library document not found"
    });
    return;
  }

  res.json({
    ok: true,
    data: document
  });
}

async function createLibraryDocument(req, res) {
  const document = await libraryService.createLibraryDocument(req.body);

  res.status(201).json({
    ok: true,
    message: "Library document created",
    data: document
  });
}

async function updateLibraryDocument(req, res) {
  const existingDocument = await libraryService.getLibraryDocumentById(req.params.id);

  if (!existingDocument) {
    res.status(404).json({
      ok: false,
      message: "Library document not found"
    });
    return;
  }

  const document = await libraryService.updateLibraryDocument(req.params.id, req.body);

  const fileWasChanged =
    Object.prototype.hasOwnProperty.call(req.body, "file_path") &&
    existingDocument.file_path &&
    existingDocument.file_path !== document.file_path;

  if (fileWasChanged) {
    await deleteUploadedFile(existingDocument.file_path);
  }

  res.json({
    ok: true,
    message: "Library document updated",
    data: document
  });
}

async function deleteLibraryDocument(req, res) {
  const existingDocument = await libraryService.getLibraryDocumentById(req.params.id);

  if (!existingDocument) {
    res.status(404).json({
      ok: false,
      message: "Library document not found"
    });
    return;
  }

  const deleted = await libraryService.deleteLibraryDocument(req.params.id);

  if (!deleted) {
    res.status(404).json({
      ok: false,
      message: "Library document not found"
    });
    return;
  }

  if (existingDocument.file_path) {
    await deleteUploadedFile(existingDocument.file_path);
  }

  res.json({
    ok: true,
    message: "Library document deleted"
  });
}

async function getLibraryStats(req, res) {
  const stats = await libraryService.getLibraryStats();

  res.json({
    ok: true,
    data: stats
  });
}

async function uploadLibraryFile(req, res) {
  if (!req.file) {
    res.status(400).json({
      ok: false,
      message: "No file uploaded"
    });
    return;
  }

  const filePath = getPublicUploadPath("library", req.file.filename);

  res.status(201).json({
    ok: true,
    message: "Library file uploaded",
    data: {
      file_path: filePath,
      original_file_name: req.file.originalname,
      file_mime_type: req.file.mimetype,
      file_size: req.file.size
    }
  });
}

module.exports = {
  getLibraryDocuments,
  getLibraryDocumentById,
  createLibraryDocument,
  updateLibraryDocument,
  deleteLibraryDocument,
  getLibraryStats,
  uploadLibraryFile
};