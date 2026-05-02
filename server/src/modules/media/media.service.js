const db = require("../../config/db");

async function getMediaItems(query = {}) {
  const { type, status, search } = query;

  const conditions = [];
  const values = [];

  if (type && type !== "all") {
    conditions.push("type = ?");
    values.push(type);
  }

  if (status && status !== "all") {
    conditions.push("status = ?");
    values.push(status);
  }

  if (search) {
    conditions.push("(title LIKE ? OR notes LIKE ?)");
    values.push(`%${search}%`, `%${search}%`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const [rows] = await db.query(
    `
    SELECT *
    FROM media_items
    ${whereClause}
    ORDER BY
      CASE status
        WHEN 'watching' THEN 1
        WHEN 'planned' THEN 2
        WHEN 'paused' THEN 3
        WHEN 'completed' THEN 4
        WHEN 'dropped' THEN 5
        ELSE 6
      END,
      updated_at DESC,
      created_at DESC
    `,
    values
  );

  return rows;
}

async function getMediaItemById(id) {
  const [rows] = await db.query(
    `
    SELECT *
    FROM media_items
    WHERE id = ?
    `,
    [id]
  );

  return rows[0];
}

async function createMediaItem(data) {
  const {
    title,
    type = "show",
    status = "planned",
    current_episode = 0,
    total_episodes = null,
    rating = null,
    image_path = null,
    watch_link = null,
    notes = null
  } = data;

  const [result] = await db.query(
    `
    INSERT INTO media_items (
      title,
      type,
      status,
      current_episode,
      total_episodes,
      rating,
      image_path,
      watch_link,
      notes
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      title,
      type,
      status,
      current_episode,
      total_episodes,
      rating,
      image_path,
      watch_link,
      notes
    ]
  );

  return getMediaItemById(result.insertId);
}

async function updateMediaItem(id, data) {
  const allowedFields = [
    "title",
    "type",
    "status",
    "current_episode",
    "total_episodes",
    "rating",
    "image_path",
    "watch_link",
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
    return getMediaItemById(id);
  }

  values.push(id);

  await db.query(
    `
    UPDATE media_items
    SET ${fields.join(", ")}
    WHERE id = ?
    `,
    values
  );

  return getMediaItemById(id);
}

async function deleteMediaItem(id) {
  const [result] = await db.query(
    `
    DELETE FROM media_items
    WHERE id = ?
    `,
    [id]
  );

  return result.affectedRows > 0;
}

async function getMediaStats() {
  const [totalRows] = await db.query(`
    SELECT
      COUNT(*) AS total,
      COALESCE(AVG(rating), 0) AS average_rating
    FROM media_items
  `);

  const [typeRows] = await db.query(`
    SELECT type, COUNT(*) AS count
    FROM media_items
    GROUP BY type
  `);

  const [statusRows] = await db.query(`
    SELECT status, COUNT(*) AS count
    FROM media_items
    GROUP BY status
  `);

  const byType = {
    anime: 0,
    movie: 0,
    show: 0
  };

  const byStatus = {
    planned: 0,
    watching: 0,
    completed: 0,
    paused: 0,
    dropped: 0
  };

  for (const row of typeRows) {
    byType[row.type] = row.count;
  }

  for (const row of statusRows) {
    byStatus[row.status] = row.count;
  }

  return {
    total: totalRows[0].total,
    average_rating: Number(totalRows[0].average_rating || 0),
    by_type: byType,
    by_status: byStatus
  };
}

module.exports = {
  getMediaItems,
  getMediaItemById,
  createMediaItem,
  updateMediaItem,
  deleteMediaItem,
  getMediaStats
};