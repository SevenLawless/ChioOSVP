const db = require("../../config/db");

function getCurrentMonthYear() {
  const now = new Date();

  return {
    month: now.getMonth() + 1,
    year: now.getFullYear()
  };
}

function resolveMonthYear(query) {
  const current = getCurrentMonthYear();

  return {
    month: Number(query.month || current.month),
    year: Number(query.year || current.year)
  };
}

async function getCategories() {
  const [rows] = await db.query(`
    SELECT *
    FROM expense_categories
    ORDER BY type ASC, name ASC
  `);

  return rows;
}

async function createCategory(data) {
  const { name, type, color = null } = data;

  const [result] = await db.query(
    `
    INSERT INTO expense_categories (name, type, color)
    VALUES (?, ?, ?)
    `,
    [name, type, color]
  );

  const [rows] = await db.query(
    `
    SELECT *
    FROM expense_categories
    WHERE id = ?
    `,
    [result.insertId]
  );

  return rows[0];
}

async function getTransactions(query) {
  const { month, year } = resolveMonthYear(query);

  const [rows] = await db.query(
    `
    SELECT
      t.*,
      c.name AS category_name,
      c.color AS category_color
    FROM expense_transactions t
    LEFT JOIN expense_categories c ON t.category_id = c.id
    WHERE MONTH(t.transaction_date) = ?
      AND YEAR(t.transaction_date) = ?
    ORDER BY t.transaction_date DESC, t.created_at DESC
    `,
    [month, year]
  );

  return rows;
}

async function getTransactionById(id) {
  const [rows] = await db.query(
    `
    SELECT
      t.*,
      c.name AS category_name,
      c.color AS category_color
    FROM expense_transactions t
    LEFT JOIN expense_categories c ON t.category_id = c.id
    WHERE t.id = ?
    `,
    [id]
  );

  return rows[0];
}

async function createTransaction(data) {
  const {
    category_id = null,
    type,
    amount,
    title,
    notes = null,
    transaction_date
  } = data;

  const [result] = await db.query(
    `
    INSERT INTO expense_transactions (
      category_id,
      type,
      amount,
      title,
      notes,
      transaction_date
    )
    VALUES (?, ?, ?, ?, ?, ?)
    `,
    [category_id, type, amount, title, notes, transaction_date]
  );

  return getTransactionById(result.insertId);
}

async function updateTransaction(id, data) {
  const allowedFields = [
    "category_id",
    "type",
    "amount",
    "title",
    "notes",
    "transaction_date"
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
    return getTransactionById(id);
  }

  values.push(id);

  await db.query(
    `
    UPDATE expense_transactions
    SET ${fields.join(", ")}
    WHERE id = ?
    `,
    values
  );

  return getTransactionById(id);
}

async function deleteTransaction(id) {
  const [result] = await db.query(
    `
    DELETE FROM expense_transactions
    WHERE id = ?
    `,
    [id]
  );

  return result.affectedRows > 0;
}

async function getMonthlySummary(query) {
  const { month, year } = resolveMonthYear(query);

  const [totalRows] = await db.query(
    `
    SELECT
      COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) AS total_income,
      COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS total_expenses,
      COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END), 0) AS balance
    FROM expense_transactions
    WHERE MONTH(transaction_date) = ?
      AND YEAR(transaction_date) = ?
    `,
    [month, year]
  );

  const [categoryRows] = await db.query(
    `
    SELECT
      c.id AS category_id,
      c.name AS category_name,
      c.color AS category_color,
      t.type,
      COALESCE(SUM(t.amount), 0) AS total
    FROM expense_transactions t
    LEFT JOIN expense_categories c ON t.category_id = c.id
    WHERE MONTH(t.transaction_date) = ?
      AND YEAR(t.transaction_date) = ?
    GROUP BY c.id, c.name, c.color, t.type
    ORDER BY total DESC
    `,
    [month, year]
  );

  const [recentRows] = await db.query(
    `
    SELECT
      t.*,
      c.name AS category_name,
      c.color AS category_color
    FROM expense_transactions t
    LEFT JOIN expense_categories c ON t.category_id = c.id
    WHERE MONTH(t.transaction_date) = ?
      AND YEAR(t.transaction_date) = ?
    ORDER BY t.transaction_date DESC, t.created_at DESC
    LIMIT 5
    `,
    [month, year]
  );

  return {
    month,
    year,
    totals: totalRows[0],
    by_category: categoryRows,
    recent_transactions: recentRows
  };
}

async function getRecurringBills() {
  const [rows] = await db.query(`
    SELECT
      b.*,
      c.name AS category_name,
      c.color AS category_color
    FROM recurring_bills b
    LEFT JOIN expense_categories c ON b.category_id = c.id
    ORDER BY b.is_active DESC, b.due_day ASC
  `);

  return rows;
}

async function getRecurringBillById(id) {
  const [rows] = await db.query(
    `
    SELECT
      b.*,
      c.name AS category_name,
      c.color AS category_color
    FROM recurring_bills b
    LEFT JOIN expense_categories c ON b.category_id = c.id
    WHERE b.id = ?
    `,
    [id]
  );

  return rows[0];
}

async function createRecurringBill(data) {
  const {
    category_id = null,
    title,
    amount,
    due_day,
    is_active = true,
    notes = null
  } = data;

  const [result] = await db.query(
    `
    INSERT INTO recurring_bills (
      category_id,
      title,
      amount,
      due_day,
      is_active,
      notes
    )
    VALUES (?, ?, ?, ?, ?, ?)
    `,
    [category_id, title, amount, due_day, is_active, notes]
  );

  return getRecurringBillById(result.insertId);
}

async function updateRecurringBill(id, data) {
  const allowedFields = [
    "category_id",
    "title",
    "amount",
    "due_day",
    "is_active",
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
    return getRecurringBillById(id);
  }

  values.push(id);

  await db.query(
    `
    UPDATE recurring_bills
    SET ${fields.join(", ")}
    WHERE id = ?
    `,
    values
  );

  return getRecurringBillById(id);
}

async function deleteRecurringBill(id) {
  const [result] = await db.query(
    `
    DELETE FROM recurring_bills
    WHERE id = ?
    `,
    [id]
  );

  return result.affectedRows > 0;
}

async function getBudgets(query) {
  const { month, year } = resolveMonthYear(query);

  const [rows] = await db.query(
    `
    SELECT
      b.*,
      c.name AS category_name,
      c.color AS category_color,
      COALESCE(spent.total_spent, 0) AS spent,
      b.amount - COALESCE(spent.total_spent, 0) AS remaining
    FROM monthly_budgets b
    LEFT JOIN expense_categories c ON b.category_id = c.id
    LEFT JOIN (
      SELECT
        category_id,
        SUM(amount) AS total_spent
      FROM expense_transactions
      WHERE type = 'expense'
        AND MONTH(transaction_date) = ?
        AND YEAR(transaction_date) = ?
      GROUP BY category_id
    ) spent ON spent.category_id = b.category_id
    WHERE b.month = ?
      AND b.year = ?
    ORDER BY c.name ASC
    `,
    [month, year, month, year]
  );

  return rows;
}

async function getBudgetById(id) {
  const [rows] = await db.query(
    `
    SELECT
      b.*,
      c.name AS category_name,
      c.color AS category_color
    FROM monthly_budgets b
    LEFT JOIN expense_categories c ON b.category_id = c.id
    WHERE b.id = ?
    `,
    [id]
  );

  return rows[0];
}

async function createBudget(data) {
  const {
    category_id,
    month,
    year,
    amount
  } = data;

  const [result] = await db.query(
    `
    INSERT INTO monthly_budgets (
      category_id,
      month,
      year,
      amount
    )
    VALUES (?, ?, ?, ?)
    `,
    [category_id, month, year, amount]
  );

  return getBudgetById(result.insertId);
}

async function updateBudget(id, data) {
  const allowedFields = [
    "category_id",
    "month",
    "year",
    "amount"
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
    return getBudgetById(id);
  }

  values.push(id);

  await db.query(
    `
    UPDATE monthly_budgets
    SET ${fields.join(", ")}
    WHERE id = ?
    `,
    values
  );

  return getBudgetById(id);
}

async function deleteBudget(id) {
  const [result] = await db.query(
    `
    DELETE FROM monthly_budgets
    WHERE id = ?
    `,
    [id]
  );

  return result.affectedRows > 0;
}

module.exports = {
  getCategories,
  createCategory,
  getTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getMonthlySummary,
  getRecurringBills,
  createRecurringBill,
  updateRecurringBill,
  deleteRecurringBill,
  getBudgets,
  createBudget,
  updateBudget,
  deleteBudget
};