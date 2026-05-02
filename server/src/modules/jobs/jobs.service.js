const db = require("../../config/db");

async function getJobs(query = {}) {
  const { status, search } = query;

  const conditions = [];
  const values = [];

  if (status && status !== "all") {
    conditions.push("status = ?");
    values.push(status);
  }

  if (search) {
    conditions.push("(company LIKE ? OR role LIKE ? OR notes LIKE ?)");
    values.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const [rows] = await db.query(
    `
    SELECT *
    FROM job_applications
    ${whereClause}
    ORDER BY
      CASE status
        WHEN 'interview' THEN 1
        WHEN 'offer' THEN 2
        WHEN 'applied' THEN 3
        WHEN 'wishlist' THEN 4
        WHEN 'ghosted' THEN 5
        WHEN 'rejected' THEN 6
        ELSE 7
      END,
      COALESCE(date_applied, created_at) DESC,
      created_at DESC
    `,
    values
  );

  return rows;
}

async function getJobById(id) {
  const [rows] = await db.query(
    `
    SELECT *
    FROM job_applications
    WHERE id = ?
    `,
    [id]
  );

  return rows[0];
}

async function createJob(data) {
  const {
    company,
    role,
    salary = null,
    date_applied = null,
    status = "applied",
    job_link = null,
    notes = null,
    interview_date = null,
    follow_up_date = null
  } = data;

  const [result] = await db.query(
    `
    INSERT INTO job_applications (
      company,
      role,
      salary,
      date_applied,
      status,
      job_link,
      notes,
      interview_date,
      follow_up_date
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      company,
      role,
      salary,
      date_applied,
      status,
      job_link,
      notes,
      interview_date,
      follow_up_date
    ]
  );

  return getJobById(result.insertId);
}

async function updateJob(id, data) {
  const allowedFields = [
    "company",
    "role",
    "salary",
    "date_applied",
    "status",
    "job_link",
    "notes",
    "interview_date",
    "follow_up_date"
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
    return getJobById(id);
  }

  values.push(id);

  await db.query(
    `
    UPDATE job_applications
    SET ${fields.join(", ")}
    WHERE id = ?
    `,
    values
  );

  return getJobById(id);
}

async function deleteJob(id) {
  const [result] = await db.query(
    `
    DELETE FROM job_applications
    WHERE id = ?
    `,
    [id]
  );

  return result.affectedRows > 0;
}

async function getJobStats() {
  const [totalRows] = await db.query(`
    SELECT COUNT(*) AS total
    FROM job_applications
  `);

  const [statusRows] = await db.query(`
    SELECT status, COUNT(*) AS count
    FROM job_applications
    GROUP BY status
  `);

  const [activeRows] = await db.query(`
    SELECT COUNT(*) AS active
    FROM job_applications
    WHERE status IN ('wishlist', 'applied', 'interview', 'offer')
  `);

  const [interviewRows] = await db.query(`
    SELECT COUNT(*) AS upcoming_interviews
    FROM job_applications
    WHERE interview_date IS NOT NULL
      AND interview_date >= CURDATE()
      AND status NOT IN ('rejected', 'ghosted')
  `);

  const [followUpRows] = await db.query(`
    SELECT COUNT(*) AS due_follow_ups
    FROM job_applications
    WHERE follow_up_date IS NOT NULL
      AND follow_up_date <= CURDATE()
      AND status NOT IN ('rejected', 'ghosted', 'offer')
  `);

  const byStatus = {
    wishlist: 0,
    applied: 0,
    interview: 0,
    offer: 0,
    rejected: 0,
    ghosted: 0
  };

  for (const row of statusRows) {
    byStatus[row.status] = row.count;
  }

  return {
    total: totalRows[0].total,
    active: activeRows[0].active,
    upcoming_interviews: interviewRows[0].upcoming_interviews,
    due_follow_ups: followUpRows[0].due_follow_ups,
    by_status: byStatus
  };
}

module.exports = {
  getJobs,
  getJobById,
  createJob,
  updateJob,
  deleteJob,
  getJobStats
};