const db = require("../../config/db");

async function getAllHomeItems() {
  const [rows] = await db.query(`
    SELECT *
    FROM home_items
    ORDER BY z_index ASC, created_at DESC
  `);

  return rows;
}

async function getHomeItemById(id) {
  const [rows] = await db.query(
    `
    SELECT *
    FROM home_items
    WHERE id = ?
    `,
    [id]
  );

  return rows[0];
}

async function createHomeItem(data) {
  const {
    type,
    title = null,
    content = null,
    file_path = null,
    x_position = 100,
    y_position = 100,
    width = 240,
    height = 160,
    z_index = 1
  } = data;

  const [result] = await db.query(
    `
    INSERT INTO home_items (
      type,
      title,
      content,
      file_path,
      x_position,
      y_position,
      width,
      height,
      z_index
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      type,
      title,
      content,
      file_path,
      x_position,
      y_position,
      width,
      height,
      z_index
    ]
  );

  return getHomeItemById(result.insertId);
}

async function updateHomeItem(id, data) {
  const allowedFields = [
    "type",
    "title",
    "content",
    "file_path",
    "x_position",
    "y_position",
    "width",
    "height",
    "z_index"
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
    return getHomeItemById(id);
  }

  values.push(id);

  await db.query(
    `
    UPDATE home_items
    SET ${fields.join(", ")}
    WHERE id = ?
    `,
    values
  );

  return getHomeItemById(id);
}

async function deleteHomeItem(id) {
  const [result] = await db.query(
    `
    DELETE FROM home_items
    WHERE id = ?
    `,
    [id]
  );

  return result.affectedRows > 0;
}

module.exports = {
  getAllHomeItems,
  getHomeItemById,
  createHomeItem,
  updateHomeItem,
  deleteHomeItem
};