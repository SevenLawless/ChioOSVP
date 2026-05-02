const db = require("../../config/db");

async function getSessions() {
  const [rows] = await db.query(`
    SELECT
      s.*,
      COUNT(DISTINCT e.id) AS exercise_count,
      COUNT(ws.id) AS set_count,
      COALESCE(SUM(ws.reps * COALESCE(ws.weight, 0)), 0) AS total_volume
    FROM workout_sessions s
    LEFT JOIN workout_exercises e ON e.session_id = s.id
    LEFT JOIN workout_sets ws ON ws.exercise_id = e.id
    GROUP BY s.id
    ORDER BY s.session_date DESC, s.created_at DESC
  `);

  return rows;
}

async function getSessionById(id) {
  const [sessionRows] = await db.query(
    `
    SELECT *
    FROM workout_sessions
    WHERE id = ?
    `,
    [id]
  );

  const session = sessionRows[0];

  if (!session) return null;

  const [exerciseRows] = await db.query(
    `
    SELECT *
    FROM workout_exercises
    WHERE session_id = ?
    ORDER BY created_at ASC
    `,
    [id]
  );

  const [setRows] = await db.query(
    `
    SELECT ws.*
    FROM workout_sets ws
    JOIN workout_exercises e ON e.id = ws.exercise_id
    WHERE e.session_id = ?
    ORDER BY ws.exercise_id ASC, ws.set_number ASC
    `,
    [id]
  );

  const exercises = exerciseRows.map((exercise) => ({
    ...exercise,
    sets: setRows.filter((set) => set.exercise_id === exercise.id)
  }));

  return {
    ...session,
    exercises
  };
}

async function createSession(data) {
  const {
    session_date,
    title = null,
    notes = null
  } = data;

  const [result] = await db.query(
    `
    INSERT INTO workout_sessions (
      session_date,
      title,
      notes
    )
    VALUES (?, ?, ?)
    `,
    [session_date, title, notes]
  );

  return getSessionById(result.insertId);
}

async function updateSession(id, data) {
  const allowedFields = ["session_date", "title", "notes"];
  const fields = [];
  const values = [];

  for (const field of allowedFields) {
    if (data[field] !== undefined) {
      fields.push(`${field} = ?`);
      values.push(data[field]);
    }
  }

  if (fields.length === 0) {
    return getSessionById(id);
  }

  values.push(id);

  await db.query(
    `
    UPDATE workout_sessions
    SET ${fields.join(", ")}
    WHERE id = ?
    `,
    values
  );

  return getSessionById(id);
}

async function deleteSession(id) {
  const [result] = await db.query(
    `
    DELETE FROM workout_sessions
    WHERE id = ?
    `,
    [id]
  );

  return result.affectedRows > 0;
}

async function getExerciseById(id) {
  const [rows] = await db.query(
    `
    SELECT *
    FROM workout_exercises
    WHERE id = ?
    `,
    [id]
  );

  return rows[0];
}

async function addExercise(sessionId, data) {
  const {
    name,
    muscle_group = null,
    notes = null
  } = data;

  const [result] = await db.query(
    `
    INSERT INTO workout_exercises (
      session_id,
      name,
      muscle_group,
      notes
    )
    VALUES (?, ?, ?, ?)
    `,
    [sessionId, name, muscle_group, notes]
  );

  return getExerciseById(result.insertId);
}

async function updateExercise(id, data) {
  const allowedFields = ["name", "muscle_group", "notes"];
  const fields = [];
  const values = [];

  for (const field of allowedFields) {
    if (data[field] !== undefined) {
      fields.push(`${field} = ?`);
      values.push(data[field]);
    }
  }

  if (fields.length === 0) {
    return getExerciseById(id);
  }

  values.push(id);

  await db.query(
    `
    UPDATE workout_exercises
    SET ${fields.join(", ")}
    WHERE id = ?
    `,
    values
  );

  return getExerciseById(id);
}

async function deleteExercise(id) {
  const [result] = await db.query(
    `
    DELETE FROM workout_exercises
    WHERE id = ?
    `,
    [id]
  );

  return result.affectedRows > 0;
}

async function getSetById(id) {
  const [rows] = await db.query(
    `
    SELECT *
    FROM workout_sets
    WHERE id = ?
    `,
    [id]
  );

  return rows[0];
}

async function getNextSetNumber(exerciseId) {
  const [rows] = await db.query(
    `
    SELECT COALESCE(MAX(set_number), 0) + 1 AS next_set_number
    FROM workout_sets
    WHERE exercise_id = ?
    `,
    [exerciseId]
  );

  return rows[0].next_set_number;
}

async function addSet(exerciseId, data) {
  const {
    reps,
    weight = null,
    notes = null
  } = data;

  const setNumber = data.set_number || await getNextSetNumber(exerciseId);

  const [result] = await db.query(
    `
    INSERT INTO workout_sets (
      exercise_id,
      set_number,
      reps,
      weight,
      notes
    )
    VALUES (?, ?, ?, ?, ?)
    `,
    [exerciseId, setNumber, reps, weight, notes]
  );

  return getSetById(result.insertId);
}

async function updateSet(id, data) {
  const allowedFields = ["set_number", "reps", "weight", "notes"];
  const fields = [];
  const values = [];

  for (const field of allowedFields) {
    if (data[field] !== undefined) {
      fields.push(`${field} = ?`);
      values.push(data[field]);
    }
  }

  if (fields.length === 0) {
    return getSetById(id);
  }

  values.push(id);

  await db.query(
    `
    UPDATE workout_sets
    SET ${fields.join(", ")}
    WHERE id = ?
    `,
    values
  );

  return getSetById(id);
}

async function deleteSet(id) {
  const [result] = await db.query(
    `
    DELETE FROM workout_sets
    WHERE id = ?
    `,
    [id]
  );

  return result.affectedRows > 0;
}

async function getProgress(query) {
  const exerciseName = query.exercise || "";

  const [rows] = await db.query(
    `
    SELECT
      s.session_date,
      e.name AS exercise_name,
      MAX(ws.weight) AS max_weight,
      MAX(ws.reps) AS max_reps,
      SUM(ws.reps * COALESCE(ws.weight, 0)) AS volume
    FROM workout_sessions s
    JOIN workout_exercises e ON e.session_id = s.id
    JOIN workout_sets ws ON ws.exercise_id = e.id
    WHERE e.name LIKE ?
    GROUP BY s.session_date, e.name
    ORDER BY s.session_date ASC
    `,
    [`%${exerciseName}%`]
  );

  return rows;
}

module.exports = {
  getSessions,
  getSessionById,
  createSession,
  updateSession,
  deleteSession,
  addExercise,
  updateExercise,
  deleteExercise,
  addSet,
  updateSet,
  deleteSet,
  getProgress
};