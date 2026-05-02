const db = require("../../config/db");

async function getLibraryDocuments(query = {}) {
  const { status, category, search } = query;

  const conditions = [];
  const values = [];

  if (status && status !== "all") {
    conditions.push("status = ?");
    values.push(status);
  }

  if (category && category !== "all") {
    conditions.push("category = ?");
    values.push(category);
  }

  if (search) {
    conditions.push(
      "(title LIKE ? OR category LIKE ? OR issuer LIKE ? OR reference_number LIKE ? OR notes LIKE ?)"
    );
    values.push(
      `%${search}%`,
      `%${search}%`,
      `%${search}%`,
      `%${search}%`,
      `%${search}%`
    );
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const [rows] = await db.query(
    `
    SELECT *
    FROM library_documents
    ${whereClause}
    ORDER BY
      CASE status
        WHEN 'needs_action' THEN 1
        WHEN 'pending' THEN 2
        WHEN 'active' THEN 3
        WHEN 'expired' THEN 4
        WHEN 'archived' THEN 5
        ELSE 6
      END,
      CASE
        WHEN expiry_date IS NULL THEN 1
        ELSE 0
      END,
      expiry_date ASC,
      updated_at DESC
    `,
    values
  );

  return rows;
}

async function getLibraryDocumentById(id) {
  const [rows] = await db.query(
    `
    SELECT *
    FROM library_documents
    WHERE id = ?
    `,
    [id]
  );

  return rows[0];
}

async function createLibraryDocument(data) {
  const {
    title,
    category = "Other",
    status = "active",
    document_date = null,
    expiry_date = null,
    issuer = null,
    reference_number = null,
    file_path = null,
    original_file_name = null,
    file_mime_type = null,
    file_size = null,
    notes = null
  } = data;

  const [result] = await db.query(
    `
    INSERT INTO library_documents (
      title,
      category,
      status,
      document_date,
      expiry_date,
      issuer,
      reference_number,
      file_path,
      original_file_name,
      file_mime_type,
      file_size,
      notes
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      title,
      category,
      status,
      document_date,
      expiry_date,
      issuer,
      reference_number,
      file_path,
      original_file_name,
      file_mime_type,
      file_size,
      notes
    ]
  );

  return getLibraryDocumentById(result.insertId);
}

async function updateLibraryDocument(id, data) {
  const allowedFields = [
    "title",
    "category",
    "status",
    "document_date",
    "expiry_date",
    "issuer",
    "reference_number",
    "file_path",
    "original_file_name",
    "file_mime_type",
    "file_size",
    "notes"
  ];

  const fields = [];
  const values = [];

  for (const field of allowedFields) {
    if (data[field] !== undefined) {
      fields.push(`${field} = ?`);
      values.push(data[field]);
    }
  }

  if (fields.length === 0) {
    return getLibraryDocumentById(id);
  }

  values.push(id);

  await db.query(
    `
    UPDATE library_documents
    SET ${fields.join(", ")}
    WHERE id = ?
    `,
    values
  );

  return getLibraryDocumentById(id);
}

async function deleteLibraryDocument(id) {
  const [result] = await db.query(
    `
    DELETE FROM library_documents
    WHERE id = ?
    `,
    [id]
  );

  return result.affectedRows > 0;
}

async function getLibraryStats() {
  const [totalRows] = await db.query(`
    SELECT COUNT(*) AS total
    FROM library_documents
  `);

  const [statusRows] = await db.query(`
    SELECT status, COUNT(*) AS count
    FROM library_documents
    GROUP BY status
  `);

  const [expiryRows] = await db.query(`
    SELECT
      SUM(
        CASE
          WHEN expiry_date IS NOT NULL
            AND expiry_date < CURDATE()
          THEN 1 ELSE 0
        END
      ) AS expired,
      SUM(
        CASE
          WHEN expiry_date IS NOT NULL
            AND expiry_date >= CURDATE()
            AND expiry_date <= DATE_ADD(CURDATE(), INTERVAL 90 DAY)
          THEN 1 ELSE 0
        END
      ) AS expiring_soon
    FROM library_documents
  `);

  const byStatus = {
    active: 0,
    expired: 0,
    pending: 0,
    archived: 0,
    needs_action: 0
  };

  for (const row of statusRows) {
    byStatus[row.status] = row.count;
  }

  return {
    total: totalRows[0].total,
    expired: Number(expiryRows[0].expired || 0),
    expiring_soon: Number(expiryRows[0].expiring_soon || 0),
    by_status: byStatus
  };
}

module.exports = {
  getLibraryDocuments,
  getLibraryDocumentById,
  createLibraryDocument,
  updateLibraryDocument,
  deleteLibraryDocument,
  getLibraryStats
};