const db = require("../../config/db");

async function getBucketListItems(query = {}) {
  const { status, category, priority, search } = query;

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

  if (priority && priority !== "all") {
    conditions.push("priority = ?");
    values.push(priority);
  }

  if (search) {
    conditions.push("(title LIKE ? OR category LIKE ? OR notes LIKE ?)");
    values.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const [rows] = await db.query(
    `
    SELECT *
    FROM bucket_list_items
    ${whereClause}
    ORDER BY
      CASE status
        WHEN 'in_progress' THEN 1
        WHEN 'planned' THEN 2
        WHEN 'idea' THEN 3
        WHEN 'done' THEN 4
        WHEN 'skipped' THEN 5
        ELSE 6
      END,
      CASE priority
        WHEN 'dream' THEN 1
        WHEN 'high' THEN 2
        WHEN 'medium' THEN 3
        WHEN 'low' THEN 4
        ELSE 5
      END,
      COALESCE(target_date, updated_at) ASC,
      created_at DESC
    `,
    values
  );

  return rows;
}

async function getBucketListItemById(id) {
  const [rows] = await db.query(
    `
    SELECT *
    FROM bucket_list_items
    WHERE id = ?
    `,
    [id]
  );

  return rows[0];
}

async function createBucketListItem(data) {
  const {
    title,
    category = "Other",
    status = "idea",
    priority = "medium",
    target_date = null,
    link = null,
    image_path = null,
    notes = null
  } = data;

  const [result] = await db.query(
    `
    INSERT INTO bucket_list_items (
      title,
      category,
      status,
      priority,
      target_date,
      link,
      image_path,
      notes
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      title,
      category,
      status,
      priority,
      target_date,
      link,
      image_path,
      notes
    ]
  );

  return getBucketListItemById(result.insertId);
}

async function updateBucketListItem(id, data) {
  const allowedFields = [
    "title",
    "category",
    "status",
    "priority",
    "target_date",
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
    return getBucketListItemById(id);
  }

  values.push(id);

  await db.query(
    `
    UPDATE bucket_list_items
    SET ${fields.join(", ")}
    WHERE id = ?
    `,
    values
  );

  return getBucketListItemById(id);
}

async function deleteBucketListItem(id) {
  const [result] = await db.query(
    `
    DELETE FROM bucket_list_items
    WHERE id = ?
    `,
    [id]
  );

  return result.affectedRows > 0;
}

async function getBucketListStats() {
  const [totalRows] = await db.query(`
    SELECT COUNT(*) AS total
    FROM bucket_list_items
  `);

  const [statusRows] = await db.query(`
    SELECT status, COUNT(*) AS count
    FROM bucket_list_items
    GROUP BY status
  `);

  const [priorityRows] = await db.query(`
    SELECT priority, COUNT(*) AS count
    FROM bucket_list_items
    GROUP BY priority
  `);

  const [upcomingRows] = await db.query(`
    SELECT COUNT(*) AS upcoming
    FROM bucket_list_items
    WHERE target_date IS NOT NULL
      AND target_date >= CURDATE()
      AND status NOT IN ('done', 'skipped')
  `);

  const byStatus = {
    idea: 0,
    planned: 0,
    in_progress: 0,
    done: 0,
    skipped: 0
  };

  const byPriority = {
    low: 0,
    medium: 0,
    high: 0,
    dream: 0
  };

  for (const row of statusRows) {
    byStatus[row.status] = row.count;
  }

  for (const row of priorityRows) {
    byPriority[row.priority] = row.count;
  }

  return {
    total: totalRows[0].total,
    upcoming: upcomingRows[0].upcoming,
    by_status: byStatus,
    by_priority: byPriority
  };
}

module.exports = {
  getBucketListItems,
  getBucketListItemById,
  createBucketListItem,
  updateBucketListItem,
  deleteBucketListItem,
  getBucketListStats
};