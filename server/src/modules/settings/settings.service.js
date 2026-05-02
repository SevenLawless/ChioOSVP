const crypto = require("crypto");
const fs = require("fs/promises");
const path = require("path");
const zlib = require("zlib");
const db = require("../../config/db");
const { uploadsRoot } = require("../../utils/uploadPaths");

const BACKUP_VERSION = 1;

const DATE_ONLY_COLUMNS = new Set([
  "transaction_date",
  "session_date",
  "date_applied",
  "interview_date",
  "follow_up_date",
  "target_date",
  "document_date",
  "expiry_date"
]);

const DATE_TIME_COLUMNS = new Set([
  "created_at",
  "updated_at"
]);

function isIsoDateString(value) {
  return (
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)
  );
}

function toMysqlDate(value) {
  if (!value) return value;

  if (isIsoDateString(value)) {
    return value.slice(0, 10);
  }

  return value;
}

function toMysqlDateTime(value) {
  if (!value) return value;

  if (isIsoDateString(value)) {
    return value.slice(0, 19).replace("T", " ");
  }

  return value;
}

function normalizeBackupRow(row) {
  const normalizedRow = {};

  for (const [key, value] of Object.entries(row)) {
    if (DATE_ONLY_COLUMNS.has(key)) {
      normalizedRow[key] = toMysqlDate(value);
      continue;
    }

    if (DATE_TIME_COLUMNS.has(key)) {
      normalizedRow[key] = toMysqlDateTime(value);
      continue;
    }

    normalizedRow[key] = value;
  }

  return normalizedRow;
}

const BACKUP_TABLES = [
  "home_items",

  "expense_categories",
  "expense_transactions",
  "recurring_bills",
  "monthly_budgets",

  "workout_sessions",
  "workout_exercises",
  "workout_sets",

  "job_applications",

  "loot_items",
  "media_items",
  "bucket_list_items",
  "places",
  "library_documents"
];

const DELETE_ORDER = [
  "workout_sets",
  "workout_exercises",
  "workout_sessions",

  "expense_transactions",
  "recurring_bills",
  "monthly_budgets",
  "expense_categories",

  "home_items",
  "job_applications",
  "loot_items",
  "media_items",
  "bucket_list_items",
  "places",
  "library_documents"
];

const INSERT_ORDER = [
  "home_items",

  "expense_categories",
  "expense_transactions",
  "recurring_bills",
  "monthly_budgets",

  "workout_sessions",
  "workout_exercises",
  "workout_sets",

  "job_applications",

  "loot_items",
  "media_items",
  "bucket_list_items",
  "places",
  "library_documents"
];

function createKey(passphrase, salt) {
  return crypto.pbkdf2Sync(passphrase, salt, 200000, 32, "sha256");
}

function encryptPayload(payload, passphrase) {
  const salt = crypto.randomBytes(16);
  const iv = crypto.randomBytes(12);
  const key = createKey(passphrase, salt);

  const json = JSON.stringify(payload);
  const compressed = zlib.gzipSync(Buffer.from(json, "utf8"));

  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(compressed), cipher.final()]);
  const tag = cipher.getAuthTag();

  return {
    format: "chioos-backup",
    version: BACKUP_VERSION,
    encryption: "aes-256-gcm",
    compression: "gzip",
    kdf: "pbkdf2-sha256",
    iterations: 200000,
    salt: salt.toString("base64"),
    iv: iv.toString("base64"),
    tag: tag.toString("base64"),
    data: encrypted.toString("base64")
  };
}

function decryptPayload(envelope, passphrase) {
  if (!envelope || envelope.format !== "chioos-backup") {
    throw new Error("Invalid ChioOS backup file.");
  }

  if (envelope.version !== BACKUP_VERSION) {
    throw new Error("Unsupported backup version.");
  }

  const salt = Buffer.from(envelope.salt, "base64");
  const iv = Buffer.from(envelope.iv, "base64");
  const tag = Buffer.from(envelope.tag, "base64");
  const encrypted = Buffer.from(envelope.data, "base64");

  const key = createKey(passphrase, salt);

  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);

  const compressed = Buffer.concat([
    decipher.update(encrypted),
    decipher.final()
  ]);

  const json = zlib.gunzipSync(compressed).toString("utf8");
  return JSON.parse(json);
}

async function readUploadFiles() {
  const files = [];

  async function walk(currentFolder) {
    let entries = [];

    try {
      entries = await fs.readdir(currentFolder, {
        withFileTypes: true
      });
    } catch (err) {
      if (err.code === "ENOENT") return;
      throw err;
    }

    for (const entry of entries) {
      const fullPath = path.join(currentFolder, entry.name);

      if (entry.isDirectory()) {
        await walk(fullPath);
        continue;
      }

      if (entry.name === ".gitkeep") {
        continue;
      }

      const relativePath = path.relative(uploadsRoot, fullPath);
      const buffer = await fs.readFile(fullPath);

      files.push({
        relative_path: relativePath.replace(/\\/g, "/"),
        content_base64: buffer.toString("base64")
      });
    }
  }

  await walk(uploadsRoot);

  return files;
}

async function writeUploadFiles(files = []) {
  for (const file of files) {
    if (!file.relative_path || !file.content_base64) {
      continue;
    }

    const destination = path.resolve(uploadsRoot, file.relative_path);
    const safeUploadsRoot = path.resolve(uploadsRoot);

    const isInsideUploads =
      destination === safeUploadsRoot ||
      destination.startsWith(`${safeUploadsRoot}${path.sep}`);

    if (!isInsideUploads) {
      continue;
    }

    await fs.mkdir(path.dirname(destination), {
      recursive: true
    });

    await fs.writeFile(destination, Buffer.from(file.content_base64, "base64"));
  }
}

async function getTableRows(tableName) {
  const [rows] = await db.query(`SELECT * FROM \`${tableName}\``);
  return rows;
}

async function insertRows(tableName, rows = []) {
  for (const row of rows) {
    const normalizedRow = normalizeBackupRow(row);
    const columns = Object.keys(normalizedRow);

    if (columns.length === 0) {
      continue;
    }

    const placeholders = columns.map(() => "?").join(", ");
    const escapedColumns = columns.map((column) => `\`${column}\``).join(", ");
    const values = columns.map((column) => normalizedRow[column]);

    await db.query(
      `
      INSERT INTO \`${tableName}\` (${escapedColumns})
      VALUES (${placeholders})
      `,
      values
    );
  }

  await resetAutoIncrement(tableName);
}

async function resetAutoIncrement(tableName) {
  const [rows] = await db.query(
    `
    SELECT MAX(id) AS max_id
    FROM \`${tableName}\`
    `
  );

  const nextId = Number(rows[0]?.max_id || 0) + 1;

  await db.query(`
    ALTER TABLE \`${tableName}\` AUTO_INCREMENT = ${nextId}
  `);
}

async function createBackup(passphrase) {
  const tables = {};

  for (const table of BACKUP_TABLES) {
    tables[table] = await getTableRows(table);
  }

  const files = await readUploadFiles();

  const payload = {
    app: "ChioOS",
    backup_version: BACKUP_VERSION,
    created_at: new Date().toISOString(),
    tables,
    files
  };

  const encryptedBackup = encryptPayload(payload, passphrase);

  return Buffer.from(JSON.stringify(encryptedBackup, null, 2), "utf8");
}

async function restoreBackup(buffer, passphrase) {
  const envelope = JSON.parse(buffer.toString("utf8"));
  const payload = decryptPayload(envelope, passphrase);

  if (!payload || payload.app !== "ChioOS" || !payload.tables) {
    throw new Error("Invalid ChioOS backup payload.");
  }

  await db.query("SET FOREIGN_KEY_CHECKS = 0");

  try {
    for (const table of DELETE_ORDER) {
      await db.query(`DELETE FROM \`${table}\``);
    }

    for (const table of INSERT_ORDER) {
      const rows = payload.tables[table] || [];
      await insertRows(table, rows);
    }

    await writeUploadFiles(payload.files || []);
  } finally {
    await db.query("SET FOREIGN_KEY_CHECKS = 1");
  }

  return {
    restored_at: new Date().toISOString(),
    backup_created_at: payload.created_at,
    tables_restored: Object.keys(payload.tables).length,
    files_restored: payload.files?.length || 0
  };
}

async function getSettingsInfo() {
  const [dbRows] = await db.query("SELECT DATABASE() AS database_name");

  return {
    app_name: "ChioOS",
    version: "3.0-foundation",
    database_name: dbRows[0]?.database_name || null,
    backup_format: "encrypted .chio",
    backup_version: BACKUP_VERSION
  };
}

module.exports = {
  createBackup,
  restoreBackup,
  getSettingsInfo
};