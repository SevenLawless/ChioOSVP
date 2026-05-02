const db = require("../../config/db");

async function getLootItems(query = {}) {
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
    conditions.push("(name LIKE ? OR category LIKE ? OR notes LIKE ?)");
    values.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const [rows] = await db.query(
    `
    SELECT *
    FROM loot_items
    ${whereClause}
    ORDER BY
      CASE priority
        WHEN 'dream' THEN 1
        WHEN 'high' THEN 2
        WHEN 'medium' THEN 3
        WHEN 'low' THEN 4
        ELSE 5
      END,
      created_at DESC
    `,
    values
  );

  return rows;
}

async function getLootItemById(id) {
  const [rows] = await db.query(
    `
    SELECT *
    FROM loot_items
    WHERE id = ?
    `,
    [id]
  );

  return rows[0];
}

async function createLootItem(data) {
  const {
    name,
    category = "Other",
    price = null,
    priority = "medium",
    status = "wanted",
    store_link = null,
    image_path = null,
    notes = null
  } = data;

  const [result] = await db.query(
    `
    INSERT INTO loot_items (
      name,
      category,
      price,
      priority,
      status,
      store_link,
      image_path,
      notes
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      name,
      category,
      price,
      priority,
      status,
      store_link,
      image_path,
      notes
    ]
  );

  return getLootItemById(result.insertId);
}

async function updateLootItem(id, data) {
  const allowedFields = [
    "name",
    "category",
    "price",
    "priority",
    "status",
    "store_link",
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
    return getLootItemById(id);
  }

  values.push(id);

  await db.query(
    `
    UPDATE loot_items
    SET ${fields.join(", ")}
    WHERE id = ?
    `,
    values
  );

  return getLootItemById(id);
}

async function deleteLootItem(id) {
  const [result] = await db.query(
    `
    DELETE FROM loot_items
    WHERE id = ?
    `,
    [id]
  );

  return result.affectedRows > 0;
}

async function getLootStats() {
  const [totalRows] = await db.query(`
    SELECT
      COUNT(*) AS total,
      COALESCE(SUM(price), 0) AS total_value
    FROM loot_items
  `);

  const [statusRows] = await db.query(`
    SELECT
      status,
      COUNT(*) AS count,
      COALESCE(SUM(price), 0) AS total_price
    FROM loot_items
    GROUP BY status
  `);

  const [priorityRows] = await db.query(`
    SELECT
      priority,
      COUNT(*) AS count
    FROM loot_items
    GROUP BY priority
  `);

  const byStatus = {
    wanted: 0,
    saving: 0,
    bought: 0,
    skipped: 0
  };

  const valueByStatus = {
    wanted: 0,
    saving: 0,
    bought: 0,
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
    valueByStatus[row.status] = Number(row.total_price || 0);
  }

  for (const row of priorityRows) {
    byPriority[row.priority] = row.count;
  }

  return {
    total: totalRows[0].total,
    total_value: Number(totalRows[0].total_value || 0),
    by_status: byStatus,
    value_by_status: valueByStatus,
    by_priority: byPriority
  };
}

module.exports = {
  getLootItems,
  getLootItemById,
  createLootItem,
  updateLootItem,
  deleteLootItem,
  getLootStats
};