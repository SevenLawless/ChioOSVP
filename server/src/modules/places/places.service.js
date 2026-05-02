const db = require("../../config/db");

async function getPlaces(query = {}) {
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
    conditions.push("(name LIKE ? OR category LIKE ? OR notes LIKE ?)");
    values.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const [rows] = await db.query(
    `
    SELECT *
    FROM places
    ${whereClause}
    ORDER BY
      CASE status
        WHEN 'favorite' THEN 1
        WHEN 'want_to_visit' THEN 2
        WHEN 'visited' THEN 3
        WHEN 'skipped' THEN 4
        ELSE 5
      END,
      updated_at DESC,
      created_at DESC
    `,
    values
  );

  return rows;
}

async function getPlaceById(id) {
  const [rows] = await db.query(
    `
    SELECT *
    FROM places
    WHERE id = ?
    `,
    [id]
  );

  return rows[0];
}

async function createPlace(data) {
  const {
    name,
    category = "Other",
    status = "want_to_visit",
    latitude,
    longitude,
    rating = null,
    link = null,
    image_path = null,
    notes = null
  } = data;

  const [result] = await db.query(
    `
    INSERT INTO places (
      name,
      category,
      status,
      latitude,
      longitude,
      rating,
      link,
      image_path,
      notes
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      name,
      category,
      status,
      latitude,
      longitude,
      rating,
      link,
      image_path,
      notes
    ]
  );

  return getPlaceById(result.insertId);
}

async function updatePlace(id, data) {
  const allowedFields = [
    "name",
    "category",
    "status",
    "latitude",
    "longitude",
    "rating",
    "link",
    "image_path",
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
    return getPlaceById(id);
  }

  values.push(id);

  await db.query(
    `
    UPDATE places
    SET ${fields.join(", ")}
    WHERE id = ?
    `,
    values
  );

  return getPlaceById(id);
}

async function deletePlace(id) {
  const [result] = await db.query(
    `
    DELETE FROM places
    WHERE id = ?
    `,
    [id]
  );

  return result.affectedRows > 0;
}

async function getPlaceStats() {
  const [totalRows] = await db.query(`
    SELECT
      COUNT(*) AS total,
      COALESCE(AVG(rating), 0) AS average_rating
    FROM places
  `);

  const [statusRows] = await db.query(`
    SELECT status, COUNT(*) AS count
    FROM places
    GROUP BY status
  `);

  const [categoryRows] = await db.query(`
    SELECT category, COUNT(*) AS count
    FROM places
    GROUP BY category
    ORDER BY count DESC
  `);

  const byStatus = {
    want_to_visit: 0,
    visited: 0,
    favorite: 0,
    skipped: 0
  };

  for (const row of statusRows) {
    byStatus[row.status] = row.count;
  }

  return {
    total: totalRows[0].total,
    average_rating: Number(totalRows[0].average_rating || 0),
    by_status: byStatus,
    by_category: categoryRows
  };
}

module.exports = {
  getPlaces,
  getPlaceById,
  createPlace,
  updatePlace,
  deletePlace,
  getPlaceStats
};