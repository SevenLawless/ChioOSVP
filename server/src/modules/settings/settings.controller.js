const settingsService = require("./settings.service");

function validatePassphrase(passphrase) {
  return typeof passphrase === "string" && passphrase.trim().length >= 8;
}

async function getSettingsInfo(req, res) {
  const info = await settingsService.getSettingsInfo();

  res.json({
    ok: true,
    data: info
  });
}

async function exportBackup(req, res) {
  const { passphrase } = req.body;

  if (!validatePassphrase(passphrase)) {
    res.status(400).json({
      ok: false,
      message: "Backup password must be at least 8 characters.",
      errors: [
        {
          field: "passphrase",
          message: "Backup password must be at least 8 characters."
        }
      ]
    });
    return;
  }

  const backupBuffer = await settingsService.createBackup(passphrase);

  const date = new Date().toISOString().slice(0, 10);
  const fileName = `chioos-backup-${date}.chio`;

  res.setHeader("Content-Type", "application/octet-stream");
  res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);

  res.send(backupBuffer);
}

async function restoreBackup(req, res) {
  const { passphrase } = req.body;

  if (!validatePassphrase(passphrase)) {
    res.status(400).json({
      ok: false,
      message: "Backup password must be at least 8 characters.",
      errors: [
        {
          field: "passphrase",
          message: "Backup password must be at least 8 characters."
        }
      ]
    });
    return;
  }

  if (!req.file) {
    res.status(400).json({
      ok: false,
      message: "Backup file is required.",
      errors: [
        {
          field: "backup",
          message: "Backup file is required."
        }
      ]
    });
    return;
  }

  try {
    const result = await settingsService.restoreBackup(
      req.file.buffer,
      passphrase
    );

    res.json({
      ok: true,
      message: "Backup restored successfully.",
      data: result
    });
  } catch (err) {
    console.error("Backup restore failed:", err);

    res.status(400).json({
      ok: false,
      message:
        "Could not restore backup. Check the server terminal for the exact restore error.",
      errors: [
        {
          field: "backup",
          message: err.message || "Backup restore failed."
        }
      ]
    });
  }
}

module.exports = {
  getSettingsInfo,
  exportBackup,
  restoreBackup
};